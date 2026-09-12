/**
 * EntryMySlot - Centralized HTTP Client
 *
 * Single-flight architecture:
 *   - One fetch() wrapper for all API calls
 *   - Customer / Organizer / Admin token support
 *   - Automatic token refresh with single-flight deduplication
 *   - Error normalization
 *   - Request/response interceptors
 *   - Automatic unwrap of backend { success, data } envelope
 *
 * RESPONSE SHAPE (critical):
 *   Backend always returns: { success: true, data: <payload>, pagination?: {...} }
 *   This client automatically unwraps so callers get:
 *     result.ok      — boolean
 *     result.status  — HTTP status code
 *     result.data    — THE ACTUAL PAYLOAD (unwrapped from { success, data })
 *     result.raw     — full raw response including { success, data, pagination }
 *
 * USAGE:
 *   const r = await EMSApi.get('/events');
 *   if (r.ok) {
 *     const events = r.data;          // actual array (unwrapped)
 *     const pagination = r.raw.pagination; // pagination from raw
 *   }
 */

(function (global) {
  'use strict';

  var CFG = global.EMS_CONFIG;
  var API_BASE = (CFG && CFG.apiBaseUrl) || '/api/v1';

  // ── Token store ─────────────────────────────────────────────────────

  function getToken(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function setToken(key, val) {
    try {
      if (val) localStorage.setItem(key, val); else localStorage.removeItem(key);
    } catch (_) {}
  }

  function getCustomerToken() { return getToken(CFG.storage.customerAccess); }
  function getOrganizerToken() { return getToken(CFG.storage.organizerAccess); }
  function getAdminToken() { return getToken(CFG.storage.adminToken); }

  // ── Auth header selection ──────────────────────────────────────────

  function authHeader(authScope) {
    var token = null;
    if (authScope === 'organizer') token = getOrganizerToken();
    else if (authScope === 'admin') token = getAdminToken();
    else token = getCustomerToken();
    if (token) return 'Bearer ' + token;
    return null;
  }

  // ── Response unwrapping ────────────────────────────────────────────
  //
  // Backend contract: every successful response is { success: true, data: <payload>, pagination?: {...} }
  // This function extracts the real payload so callers never deal with the envelope.

  function unwrapResponse(rawData, status) {
    if (!rawData || typeof rawData !== 'object') return rawData;
    // If it has the envelope shape, return the inner data
    if ('success' in rawData && 'data' in rawData) {
      return rawData.data;
    }
    // Already unwrapped or non-envelope response
    return rawData;
  }

  // ── Single-flight refresh ──────────────────────────────────────────

  var _refreshPromises = {};

  async function refreshCustomerToken(refreshToken) {
    if (!refreshToken) throw { status: 401, message: 'No refresh token available.' };
    if (_refreshPromises.customer) return _refreshPromises.customer;

    _refreshPromises.customer = (async function () {
      try {
        var res = await fetch(API_BASE + '/auth/refresh-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refreshToken }),
        });
        var ct = res.headers.get('content-type') || '';
        var rawData = ct.includes('application/json') ? await res.json() : null;
        var data = unwrapResponse(rawData, res.status);
        if (res.ok && data) {
          // Store tokens from the inner data object
          var d = rawData.data || data;
          setToken(CFG.storage.customerAccess, d.accessToken);
          setToken(CFG.storage.customerRefresh, d.refreshToken);
          if (typeof global.__emsOnCustomerRefresh === 'function') global.__emsOnCustomerRefresh(d);
          return { ok: true, data: d, raw: rawData };
        }
        logoutCustomer();
        return { ok: false, status: 401 };
      } catch (_) {
        logoutCustomer();
        return { ok: false, status: 0 };
      } finally {
        _refreshPromises.customer = null;
      }
    })();
    return _refreshPromises.customer;
  }

  async function refreshOrganizerToken(token) {
    if (!token) throw { status: 401, message: 'No refresh token available.' };
    if (_refreshPromises.organizer) return _refreshPromises.organizer;

    _refreshPromises.organizer = (async function () {
      try {
        var res = await fetch(API_BASE + '/organizer/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token }),
        });
        var ct = res.headers.get('content-type') || '';
        var rawData = ct.includes('application/json') ? await res.json() : null;
        var data = unwrapResponse(rawData, res.status);
        if (res.ok && data) {
          var d = rawData.data || data;
          setToken(CFG.storage.organizerAccess, d.accessToken || d.token);
          setToken(CFG.storage.organizerRefresh, d.refreshToken || token);
          if (typeof global.__emsOnOrganizerRefresh === 'function') global.__emsOnOrganizerRefresh(d);
          return { ok: true, data: d, raw: rawData };
        }
        logoutOrganizer();
        return { ok: false, status: 401 };
      } catch (_) {
        logoutOrganizer();
        return { ok: false, status: 0 };
      } finally {
        _refreshPromises.organizer = null;
      }
    })();
    return _refreshPromises.organizer;
  }

  function logoutCustomer() {
    setToken(CFG.storage.customerAccess, null);
    setToken(CFG.storage.customerRefresh, null);
    setToken(CFG.storage.customerUser, null);
    if (typeof global.__emsOnCustomerLogout === 'function') global.__emsOnCustomerLogout();
  }

  function logoutOrganizer() {
    setToken(CFG.storage.organizerAccess, null);
    setToken(CFG.storage.organizerRefresh, null);
    setToken(CFG.storage.organizerUser, null);
    if (typeof global.__emsOnOrganizerLogout === 'function') global.__emsOnOrganizerLogout();
  }

  function logoutAdmin() {
    setToken(CFG.storage.adminToken, null);
    setToken(CFG.storage.adminUser, null);
    if (typeof global.__emsOnAdminLogout === 'function') global.__emsOnAdminLogout();
  }

  // ── Error normalization ────────────────────────────────────────────

  function extractError(data, fallback) {
    if (!data || typeof data !== 'object') return fallback || 'Something went wrong. Please try again.';
    var candidate = data;
    if (candidate.message) return String(candidate.message);
    if (candidate.error) return String(candidate.error);
    if (candidate.errors && Array.isArray(candidate.errors) && candidate.errors[0]) return String(candidate.errors[0]);
    return fallback || 'Something went wrong. Please try again.';
  }

  // ── Core request ───────────────────────────────────────────────────

  var CONTENT_TYPES = {
    json: 'application/json',
    form: 'application/x-www-form-urlencoded',
    multipart: 'multipart/form-data',
  };

  async function request(path, opts) {
    opts = opts || {};
    var method = (opts.method || 'GET').toUpperCase();
    var body = opts.body || null;
    var query = opts.query || null;
    var authScope = opts.authScope || 'customer';
    var timeout = opts.timeout || (CFG && CFG.requestTimeout) || 15000;
    var skipAuth = opts.skipAuth === true;
    var noRefresh = opts.noRefresh === true;
    var contentType = opts.contentType || CONTENT_TYPES.json;

    // Build URL
    var url = API_BASE + path;
    if (query && typeof query === 'object') {
      var qs = new URLSearchParams();
      Object.keys(query).forEach(function (k) {
        var v = query[k];
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
      });
      var qstr = qs.toString();
      if (qstr) url += '?' + qstr;
    }

    // Build headers
    var headers = { 'Content-Type': contentType };
    if (!skipAuth) {
      var ah = authHeader(authScope);
      if (ah) headers['Authorization'] = ah;
    }

    // Timeout
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeout);

    var fetchOpts = {
      method: method,
      headers: headers,
      signal: controller.signal,
    };

    if (body !== null && body !== undefined) {
      if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
        fetchOpts.body = JSON.stringify(body);
      } else {
        fetchOpts.body = body;
      }
    }

    var response;
    try {
      response = await fetch(url, fetchOpts);
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return { ok: false, status: 0, message: 'Request timed out. Please try again.' };
      }
      return { ok: false, status: 0, message: 'Network error. Please check your connection and try again.' };
    } finally {
      clearTimeout(timer);
    }

    var status = response.status;

    // Parse response
    var raw = null;
    var ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { raw = await response.json(); } catch (_) { raw = null; }
    } else {
      var text = await response.text();
      raw = { message: text || 'Request failed.' };
    }

    // Unwrap the backend envelope: { success, data, pagination? }
    var data = unwrapResponse(raw, status);

    // Handle 401 with token refresh (customer & organizer)
    if (status === 401 && !skipAuth && !noRefresh && (authScope === 'customer' || authScope === 'organizer')) {
      if (authScope === 'customer') {
        var rt = getToken(CFG.storage.customerRefresh);
        if (rt) {
          var refreshResult = await refreshCustomerToken(rt);
          if (refreshResult.ok) {
            var ah2 = authHeader('customer');
            if (ah2) headers['Authorization'] = ah2;
            try {
              var retry = await fetch(url, Object.assign({}, fetchOpts, { headers: headers }));
              var retryCt = retry.headers.get('content-type') || '';
              var retryRaw = null;
              if (retryCt.includes('application/json')) { try { retryRaw = await retry.json(); } catch (_) {} }
              var retryData = unwrapResponse(retryRaw, retry.status);
              if (retry.ok) return { ok: true, status: retry.status, data: retryData, raw: retryRaw };
              if (retry.status === 401) { logoutCustomer(); return { ok: false, status: 401, message: 'Your session has expired. Please sign in again.', data: retryData, raw: retryRaw }; }
              return { ok: false, status: retry.status, message: extractError(retryData, 'Request failed (' + retry.status + ')'), data: retryData, raw: retryRaw };
            } catch (_) { return { ok: false, status: 0, message: 'Network error during retry.' }; }
          }
        }
        logoutCustomer();
        return { ok: false, status: 401, message: 'Your session has expired. Please sign in again.', data: data, raw: raw };
      }
      // Organizer 401: attempt refresh
      if (authScope === 'organizer') {
        var orgRefresh = localStorage.getItem(CFG.storage.organizerRefresh);
        if (orgRefresh) {
          var orgRefreshResult = await refreshOrganizerToken(orgRefresh);
          if (orgRefreshResult.ok) {
            var ah3 = authHeader('organizer');
            if (ah3) headers['Authorization'] = ah3;
            try {
              var orgRetry = await fetch(url, Object.assign({}, fetchOpts, { headers: headers }));
              var orgRetryCt = orgRetry.headers.get('content-type') || '';
              var orgRetryRaw = null;
              if (orgRetryCt.includes('application/json')) { try { orgRetryRaw = await orgRetry.json(); } catch (_) {} }
              var orgRetryData = unwrapResponse(orgRetryRaw, orgRetry.status);
              if (orgRetry.ok) return { ok: true, status: orgRetry.status, data: orgRetryData, raw: orgRetryRaw };
              if (orgRetry.status === 401) { logoutOrganizer(); return { ok: false, status: 401, message: 'Your session has expired. Please sign in again.', data: orgRetryData, raw: orgRetryRaw }; }
              return { ok: false, status: orgRetry.status, message: extractError(orgRetryData, 'Request failed (' + orgRetry.status + ')'), data: orgRetryData, raw: orgRetryRaw };
            } catch (_) { return { ok: false, status: 0, message: 'Network error during retry.' }; }
          }
        }
        logoutOrganizer();
        return { ok: false, status: 401, message: 'Your session has expired. Please sign in again.', data: data, raw: raw };
      }
    }

    if (!response.ok) {
      if (status === 401 && authScope === 'admin') {
        logoutAdmin();
        return { ok: false, status: 401, message: 'Your admin session has expired.', data: data, raw: raw };
      }
      return { ok: false, status: status, message: extractError(data, 'Request failed (' + status + ')'), data: data, raw: raw };
    }

    return { ok: true, status: status, data: data, raw: raw };
  }

  // ── HTTP verbs ─────────────────────────────────────────────────────

  function get(path, opts) { return request(path, Object.assign({}, opts, { method: 'GET' })); }
  function post(path, body, opts) { return request(path, Object.assign({}, opts, { method: 'POST', body: body })); }
  function put(path, body, opts) { return request(path, Object.assign({}, opts, { method: 'PUT', body: body })); }
  function patch(path, body, opts) { return request(path, Object.assign({}, opts, { method: 'PATCH', body: body })); }
  function del(path, opts) { return request(path, Object.assign({}, opts, { method: 'DELETE' })); }

  // ── Data extraction helper (kept for backward compat) ──────────────

  function extractData(result) {
    if (!result || !result.ok) return null;
    if (result.data && result.data.data && !('success' in result.data)) return result.data.data;
    return result.data;
  }

  // ── Pagination helper ──────────────────────────────────────────────

  function getPagination(result) {
    if (result && result.raw && result.raw.pagination) return result.raw.pagination;
    return null;
  }

  // ── Public API ─────────────────────────────────────────────────────

  global.EMSApi = Object.freeze({
    request: request,
    get: get,
    post: post,
    put: put,
    patch: patch,
    delete: del,

    // Token management
    getCustomerToken: getCustomerToken,
    getOrganizerToken: getOrganizerToken,
    getAdminToken: getAdminToken,
    setCustomerToken: function (t) { setToken(CFG.storage.customerAccess, t); },
    setOrganizerToken: function (t) { setToken(CFG.storage.organizerToken, t); },
    setAdminToken: function (t) { setToken(CFG.storage.adminToken, t); },

    // Session management
    logoutCustomer: logoutCustomer,
    logoutOrganizer: logoutOrganizer,
    logoutAdmin: logoutAdmin,

    // Utilities
    extractError: extractError,
    extractData: extractData,
    getPagination: getPagination,

    // Refresh
    refreshCustomerToken: refreshCustomerToken,
    refreshOrganizerToken: refreshOrganizerToken,
  });

})(window);
