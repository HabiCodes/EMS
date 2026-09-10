/**
 * Central HTTP client for Super Admin API.
 *
 * Responsibilities:
 *  - Build full URLs from config BASE_URL + /api/v1
 *  - Attach Bearer token on every protected request
 *  - Serialize JSON, set Content-Type
 *  - Normalize error text from multiple envelope shapes
 *  - Handle 401 once (logout, no infinite retry)
 *  - Expose response/status for callers
 */

const AdminAPI = (function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Config                                                             */
  /* ------------------------------------------------------------------ */
  function getBaseUrl() {
    const cfg = window.EMS_API_CONFIG || {};
    return (cfg.BASE_URL || '').replace(/\/+$/, '');
  }

  function getApiBase() {
    const cfg = window.EMS_API_CONFIG || {};
    return (cfg.API_BASE || '/api/v1').replace(/\/+$/, '');
  }

  function fullUrl(path) {
    const base = getBaseUrl();
    const api = getApiBase();
    const clean = path.charAt(0) === '/' ? path : '/' + path;
    return base + api + clean;
  }

  /* ------------------------------------------------------------------ */
  /*  Token                                                              */
  /* ------------------------------------------------------------------ */
  const TOKEN_KEY = 'ems_admin_token';

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (_) {
      return null;
    }
  }

  function setToken(token) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (_) {
      // storage may be unavailable
    }
  }

  function clearToken() {
    setToken(null);
  }

  /* ------------------------------------------------------------------ */
  /*  401 handler                                                         */
  /* ------------------------------------------------------------------ */
  let _onUnauthorized = null;

  function onUnauthorized(fn) {
    _onUnauthorized = fn;
  }

  function handle401() {
    clearToken();
    if (typeof _onUnauthorized === 'function') {
      _onUnauthorized();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Error text normalization                                            */
  /* ------------------------------------------------------------------ */
  function extractError(body, fallback) {
    if (!body || typeof body !== 'object') return fallback || 'Something went wrong';
    return body.message || body.error || fallback || 'Something went wrong';
  }

  /* ------------------------------------------------------------------ */
  /*  Core request                                                       */
  /* ------------------------------------------------------------------ */
  async function request(path, options = {}) {
    const {
      method = 'GET',
      body = null,
      query = null,
      signal = null,
      parseJson = true,
      skipAuth = false,
    } = options;

    const url = new URL(fullUrl(path), 'http://localhost');

    // Query params
    if (query && typeof query === 'object') {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v));
        }
      });
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const token = getToken();
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
    }

    const fetchOpts = {
      method,
      headers,
      signal,
    };

    if (body !== null && body !== undefined) {
      fetchOpts.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url.toString(), fetchOpts);
    } catch (err) {
      throw { message: 'Network error. Please check your connection.', status: 0 };
    }

    const status = response.status;

    let data = null;
    if (parseJson) {
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }
    }

    if (!response.ok) {
      if (status === 401) {
        handle401();
        throw {
          message: 'Your session has expired. Please sign in again.',
          status: 401,
        };
      }
      const msg = extractError(data, 'Request failed (' + status + ')');
      throw { message: msg, status, data };
    }

    return data;
  }

  /* ------------------------------------------------------------------ */
  /*  Convenience HTTP methods                                           */
  /* ------------------------------------------------------------------ */
  const http = {
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
    patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
    delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  };

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */
  return Object.freeze({
    request,
    get: http.get,
    post: http.post,
    put: http.put,
    patch: http.patch,
    delete: http.delete,
    getToken,
    setToken,
    clearToken,
    onUnauthorized,
    extractError,
  });
})();
