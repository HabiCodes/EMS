/**
 * EMS API Client — shared by all frontend pages.
 *
 * Auth flow:
 *   1. Login → store accessToken (ems_token, 15 min) + refreshToken (ems_refresh_token).
 *   2. On 401: refresh access token via /auth/refresh (single-flight), retry once.
 *   3. If refresh also 401s → clear tokens, dispatch auth-expired, redirect to login.
 *   4. If no refresh token → clear tokens, redirect to login.
 *
 * Standard response:  { success, data, message, pagination }
 * Standard error:     { success: false, error, message, retryInMs }
 */

(function (global) {
  'use strict';

  var CFG = window.EMS_API_CONFIG || {};
  var BASE = CFG.BASE_URL || 'https://entrymyslot.com';
  var API_PREFIX = CFG.API_BASE || '/api/v1';
  var REFRESH_PATH = '/auth/refresh';

  // ── Token helpers ──────────────────────────────────────────────

  function getAccessToken() {
    return localStorage.getItem('ems_token');
  }

  function setAccessToken(token) {
    if (token) localStorage.setItem('ems_token', token);
    else localStorage.removeItem('ems_token');
  }

  function getRefreshToken() {
    return localStorage.getItem('ems_refresh_token');
  }

  function setRefreshToken(token) {
    if (token) localStorage.setItem('ems_refresh_token', token);
    else localStorage.removeItem('ems_refresh_token');
  }

  function clearTokens() {
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_refresh_token');
  }

  // ── Single-flight refresh token ────────────────────────────────
  // Concurrent 401s share a single refresh request.

  var _refreshPromise = null;

  function refreshAccessToken() {
    if (_refreshPromise) return _refreshPromise;

    var refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token available'));
    }

    var url = buildUrl(REFRESH_PATH);
    _refreshPromise = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ refreshToken: refreshToken }),
    })
      .then(function (res) {
        if (!res.ok) return res.text().then(function (txt) {
          throw new Error(txt || 'Refresh failed (' + res.status + ')');
        });
        return res.json();
      })
      .then(function (data) {
        // Backend rotates refresh tokens — store both
        var newAccess = data.data && (data.data.accessToken || data.data.token);
        var newRefresh = data.data && (data.data.refreshToken || data.data.refresh_token);

        if (!newAccess) throw new Error('No access token in refresh response');

        setAccessToken(newAccess);
        if (newRefresh) setRefreshToken(newRefresh);
        return newAccess;
      })
      .finally(function () {
        _refreshPromise = null;
      });

    return _refreshPromise;
  }

  // ── URL builder ───────────────────────────────────────────────

  function buildUrl(path, query) {
    var url = BASE + API_PREFIX + path;
    if (query && typeof query === 'object') {
      var params = new URLSearchParams();
      Object.keys(query).forEach(function (k) {
        if (query[k] !== undefined && query[k] !== null && query[k] !== '') {
          params.append(k, String(query[k]));
        }
      });
      var qs = params.toString();
      if (qs) url += (url.indexOf('?') !== -1 ? '&' : '?') + qs;
    }
    return url;
  }

  // ── Core request ───────────────────────────────────────────────

  var _retrying = false; // guard against double refresh loops

  function makeRequest(method, path, options) {
    options = options || {};

    var body = options.body;
    var headers = options.headers || {};
    var query = options.query;
    var responseType = options.responseType || 'json';
    var signal = options.signal;
    var skipAuth = options.skipAuth;

    var url = buildUrl(path, query);
    var accessToken = getAccessToken();

    var init = {
      method: method,
      headers: {
        'Accept': 'application/json',
      },
      signal: signal,
    };

    // Merge caller headers first (lowest priority for Content-Type since we set it below)
    Object.keys(headers).forEach(function (k) { init.headers[k] = headers[k]; });

    if (accessToken && !skipAuth) {
      init.headers['Authorization'] = 'Bearer ' + accessToken;
    }

    if (body !== undefined && body !== null) {
      if (body instanceof FormData) {
        init.body = body;
      } else {
        if (!init.headers['Content-Type']) {
          init.headers['Content-Type'] = 'application/json';
        }
        init.body = JSON.stringify(body);
      }
    }

    return fetch(url, init)
      .then(function (res) {
        if (responseType === 'blob') {
          return { ok: res.ok, status: res.status, data: Promise.resolve(res.blob()) };
        }
        if (responseType === 'text') {
          return { ok: res.ok, status: res.status, data: Promise.resolve(res.text()) };
        }
        return res.text()
          .then(function (txt) {
            var parsed = {};
            try { parsed = JSON.parse(txt); } catch (e) { /* not JSON, that's fine */ }
            return { ok: res.ok, status: res.status, data: parsed };
          });
      })
      .then(function (result) {
        // Handle 401: refresh token and retry once
        if (result.status === 401 && !skipAuth && !_retrying) {
          _retrying = true;
          return refreshAccessToken()
            .then(function () {
              // Retry original request with new token
              return makeRequest(method, path, options);
            })
            .catch(function (refreshErr) {
              // Refresh itself failed — log out
              clearTokens();
              window.dispatchEvent(new CustomEvent('ems:auth-expired'));
              return result; // return original error for caller to handle
            })
            .finally(function () {
              _retrying = false;
            });
        }
        return result;
      });
  }

  // ── Error formatter ────────────────────────────────────────────

  function handleApiError(result) {
    if (result.ok) return null;

    var status = result.status;
    var data = result.data || {};
    var message = data.message || data.error || 'Something went wrong.';

    if (status === 0) {
      return 'Could not reach the server. Please check your connection.';
    }
    if (status === 401) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('ems:auth-expired'));
      return 'Your session has expired. Please log in again.';
    }
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    if (status === 409) {
      return message;
    }
    if (status === 422) {
      return message;
    }
    if (status >= 500) {
      return 'Server error. Please try again later.';
    }
    if (status === 400) {
      return message;
    }
    return message;
  }

  // ── Convenience methods ────────────────────────────────────────

  function get(path, options) {
    return makeRequest('GET', path, options);
  }

  function post(path, body, options) {
    return makeRequest('POST', path, Object.assign({}, options, { body: body }));
  }

  function put(path, body, options) {
    return makeRequest('PUT', path, Object.assign({}, options, { body: body }));
  }

  function patch(path, body, options) {
    return makeRequest('PATCH', path, Object.assign({}, options, { body: body }));
  }

  function del(path, options) {
    return makeRequest('DELETE', path, options);
  }

  function upload(path, formData) {
    return makeRequest('POST', path, { body: formData });
  }

  // ── Public API ─────────────────────────────────────────────────

  var api = {
    // Core
    makeRequest: makeRequest,

    // HTTP verbs
    get: get,
    post: post,
    put: put,
    patch: patch,
    del: del,
    upload: upload,

    // Token management (backward-compatible names)
    token: getAccessToken,
    setToken: setAccessToken,
    clearToken: clearTokens,

    // Refresh token
    getAccessToken: getAccessToken,
    setAccessToken: setAccessToken,
    getRefreshToken: getRefreshToken,
    setRefreshToken: setRefreshToken,
    clearTokens: clearTokens,
    refreshAccessToken: refreshAccessToken,

    // Error handling
    handleApiError: handleApiError,

    // Config
    base: BASE,
    apiPrefix: API_PREFIX,
  };

  global.EMS_API = api;
})(window);
