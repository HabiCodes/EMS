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

  function getAdminToken() {
    return localStorage.getItem('ems_admin_token');
  }

  function getOrganizerToken() {
    return localStorage.getItem('ems_organizer_token');
  }

  function resolveToken(options) {
    if (options && options.token) return options.token;
    if (options && options.authScope === 'admin') return getAdminToken();
    if (options && options.authScope === 'organizer') return getOrganizerToken();
    return getAccessToken();
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

  function clearAdminTokens() {
    localStorage.removeItem('ems_admin_token');
  }

  function clearOrganizerTokens() {
    localStorage.removeItem('ems_organizer_token');
    localStorage.removeItem('ems_organizer_refresh');
  }

  function getOrganizerRefreshToken() {
    return localStorage.getItem('ems_organizer_refresh');
  }

  function setOrganizerTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('ems_organizer_token', accessToken);
    if (refreshToken) localStorage.setItem('ems_organizer_refresh', refreshToken);
  }

  // ── Single-flight refresh token (customer + organizer scope) ──
  // Concurrent 401s share a single refresh request.
  // Admin has no refresh.

  var _refreshPromise = null;

  function refreshAccessToken(options) {
    if (_refreshPromise) return _refreshPromise;

    var authScope = (options && options.authScope) || 'customer';

    if (authScope === 'organizer') {
      var organizerRefreshToken = getOrganizerRefreshToken();
      if (!organizerRefreshToken) {
        return Promise.reject(new Error('No organizer refresh token available'));
      }
      // Organizer uses /organizer/auth/refresh (separate path, no customer header)
      var organizerUrl = buildUrl('/organizer/auth/refresh');
      _refreshPromise = fetch(organizerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken: organizerRefreshToken }),
      })
        .then(function (res) {
          if (!res.ok) return res.text().then(function (txt) {
            throw new Error(txt || 'Organizer refresh failed (' + res.status + ')');
          });
          return res.json();
        })
        .then(function (data) {
          var newAccess = data.data && (data.data.accessToken || data.data.token);
          var newRefresh = data.data && (data.data.refreshToken || data.data.refresh_token);

          if (!newAccess) throw new Error('No access token in organizer refresh response');

          setOrganizerTokens(newAccess, newRefresh || organizerRefreshToken);
          return newAccess;
        })
        .catch(function (err) {
          // Organizer refresh failed — clear tokens and notify
          clearOrganizerTokens();
          window.dispatchEvent(new CustomEvent('ems:organizer-expired'));
          throw err;
        })
        .finally(function () {
          _refreshPromise = null;
        });

      return _refreshPromise;
    }

    // ── Customer refresh (original path) ────────────────────────
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
    var authScope = options.authScope; // 'customer' | 'admin' | 'organizer'

    var url = buildUrl(path, query);
    var accessToken = resolveToken(options);

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
        // Handle 401: refresh token and retry once (customer scope only)
        if (result.status === 401 && !skipAuth && !_retrying) {
          if (authScope === 'customer') {
            _retrying = true;
            return refreshAccessToken(options)
              .then(function () {
                // Retry original request with new token
                return makeRequest(method, path, options);
              })
              .catch(function (refreshErr) {
                // Refresh itself failed — log out customer only
                clearTokens();
                window.dispatchEvent(new CustomEvent('ems:auth-expired'));
                return result; // return original error for caller to handle
              })
              .finally(function () {
                _retrying = false;
              });
          } else if (authScope === 'admin') {
            // Admin has no refresh — clear admin token and notify
            clearAdminTokens();
            window.dispatchEvent(new CustomEvent('ems:admin-expired'));
            return result;
          } else if (authScope === 'organizer') {
            _retrying = true;
            return refreshAccessToken(options)
              .then(function () {
                return makeRequest(method, path, options);
              })
              .catch(function (refreshErr) {
                clearOrganizerTokens();
                window.dispatchEvent(new CustomEvent('ems:organizer-expired'));
                return result;
              })
              .finally(function () {
                _retrying = false;
              });
          } else {
            // No scope specified — default to customer behavior (backward compatible)
            _retrying = true;
            return refreshAccessToken(options)
              .then(function () {
                return makeRequest(method, path, options);
              })
              .catch(function (refreshErr) {
                clearTokens();
                window.dispatchEvent(new CustomEvent('ems:auth-expired'));
                return result;
              })
              .finally(function () {
                _retrying = false;
              });
          }
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

    // HTTP verbs — options.authScope selects the correct token namespace
    get: function (path, options) { return makeRequest('GET', path, options); },
    post: function (path, body, options) { return makeRequest('POST', path, Object.assign({}, options, { body: body })); },
    put: function (path, body, options) { return makeRequest('PUT', path, Object.assign({}, options, { body: body })); },
    patch: function (path, body, options) { return makeRequest('PATCH', path, Object.assign({}, options, { body: body })); },
    del: function (path, options) { return makeRequest('DELETE', path, options); },
    upload: function (path, formData) { return makeRequest('POST', path, { body: formData }); },

    // Token management (backward-compatible names)
    token: getAccessToken,
    setToken: setAccessToken,
    clearToken: clearTokens,

    // Customer tokens
    getAccessToken: getAccessToken,
    setAccessToken: setAccessToken,
    getRefreshToken: getRefreshToken,
    setRefreshToken: setRefreshToken,
    clearTokens: clearTokens,

    // Admin tokens
    getAdminToken: getAdminToken,
    clearAdminTokens: clearAdminTokens,

    // Organizer tokens
    getOrganizerToken: getOrganizerToken,
    clearOrganizerTokens: clearOrganizerTokens,

    // Refresh token (customer scope)
    refreshAccessToken: refreshAccessToken,

    // Error handling
    handleApiError: handleApiError,

    // Config
    base: BASE,
    apiPrefix: API_PREFIX,
  };

  global.EMS_API = api;
})(window);
