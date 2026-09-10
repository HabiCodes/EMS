/**
 * EntryMySlot owner client.
 *
 * This client is intentionally limited to the deployed organizer/owner API.
 * It contains no demo responses or local business-data fallbacks.
 */
(function (global) {
  'use strict';

  const config = global.EMS_API_CONFIG || {};
  const origin = (config.BASE_URL || 'https://api.entrymyslot.com').replace(/\/+$/, '');
  const apiBase = (config.API_BASE || '/api/v1').replace(/\/+$/, '');
  const baseUrl = origin + apiBase;

  const keys = Object.freeze({
    accessToken: 'ems_owner_access_token',
    refreshToken: 'ems_owner_refresh_token',
    user: 'ems_owner_user',
  });

  let refreshPromise = null;

  function read(key) {
    try { return global.localStorage.getItem(key); } catch (_) { return null; }
  }

  function write(key, value) {
    try {
      if (value === null || value === undefined || value === '') {
        global.localStorage.removeItem(key);
      } else {
        global.localStorage.setItem(key, String(value));
      }
    } catch (_) {
      // Private browsing/storage restrictions must not break API calls.
    }
  }

  function getStoredUser() {
    const raw = read(keys.user);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function storeSession(data) {
    const payload = data && data.data ? data.data : data;
    if (!payload || !payload.accessToken || !payload.refreshToken || !payload.user) {
      throw new Error('The server returned an incomplete owner session.');
    }
    if (payload.user.role !== 'owner') {
      clearSession();
      const error = new Error('Owner access is required.');
      error.status = 403;
      throw error;
    }
    write(keys.accessToken, payload.accessToken);
    write(keys.refreshToken, payload.refreshToken);
    write(keys.user, JSON.stringify(payload.user));
    return payload;
  }

  function clearSession() {
    write(keys.accessToken, null);
    write(keys.refreshToken, null);
    write(keys.user, null);
  }

  function errorMessage(body, status) {
    if (body && typeof body === 'object') {
      return body.message || body.error || (body.data && body.data.message) || `Request failed (${status})`;
    }
    return `Request failed (${status})`;
  }

  async function readBody(response) {
    if (response.status === 204) return null;
    const contentType = response.headers && response.headers.get
      ? response.headers.get('content-type') || ''
      : '';
    if (contentType.includes('application/json') || typeof response.json === 'function') {
      try { return await response.json(); } catch (_) { return null; }
    }
    return null;
  }

  async function refreshSession() {
    const refreshToken = read(keys.refreshToken);
    if (!refreshToken) return false;
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async function () {
      try {
        const response = await global.fetch(baseUrl + '/organizer/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const body = await readBody(response);
        if (!response.ok) {
          clearSession();
          return false;
        }
        storeSession(body);
        return true;
      } catch (_) {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  async function request(path, options) {
    const opts = options || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    const accessToken = read(keys.accessToken);
    if (!opts.skipAuth && accessToken) headers.Authorization = 'Bearer ' + accessToken;

    const fetchOptions = {
      method: opts.method || 'GET',
      headers,
      signal: opts.signal,
    };
    if (opts.body !== undefined && opts.body !== null) {
      fetchOptions.body = JSON.stringify(opts.body);
    }

    let response;
    try {
      response = await global.fetch(baseUrl + (path.charAt(0) === '/' ? path : '/' + path), fetchOptions);
    } catch (_) {
      const networkError = new Error('Unable to reach the EntryMySlot test server.');
      networkError.status = 0;
      throw networkError;
    }

    const body = await readBody(response);
    if (response.status === 401 && !opts.skipAuth && !opts._retried) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return request(path, Object.assign({}, opts, { _retried: true }));
      }
      clearSession();
    }

    if (!response.ok) {
      const error = new Error(errorMessage(body, response.status));
      error.status = response.status;
      error.code = body && body.code;
      error.data = body;
      throw error;
    }
    return body;
  }

  function query(path, params) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(function (entry) {
      const key = entry[0];
      const value = entry[1];
      if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
    });
    const encoded = search.toString();
    return path + (encoded ? '?' + encoded : '');
  }

  async function login(email, password) {
    const response = await request('/organizer/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
      _retried: true,
    });
    return storeSession(response);
  }

  const api = {
    baseUrl,
    login,
    logout: clearSession,
    restoreSession: function () {
      return {
        accessToken: read(keys.accessToken),
        refreshToken: read(keys.refreshToken),
        user: getStoredUser(),
      };
    },
    request,
    getOrganization: function () { return request('/organizer/organizations/me'); },
    getDashboard: function (params) { return request(query('/owner/dashboard', params)); },
    getEventAnalytics: function (params) { return request(query('/owner/events/analytics', params)); },
    getMovieAnalytics: function (params) { return request(query('/owner/movies/analytics', params)); },
    getSettlements: function (params) { return request(query('/owner/settlements', params)); },
    getManagers: function (params) { return request(query('/owner/managers', params)); },
    getEvents: function (params) { return request(query('/organizer/events', params)); },
    getEventZones: function (eventId) { return request('/organizer/events/' + encodeURIComponent(eventId) + '/zones'); },
    getTurfVenues: function (params) { return request(query('/turf/organizer/venues', params)); },
    getTurfResources: function (venueId, params) {
      return request(query('/turf/organizer/venues/' + encodeURIComponent(venueId) + '/resources', params));
    },
    getTurfSlots: function (venueId, resourceId, date) {
      return request(query('/turf/organizer/venues/' + encodeURIComponent(venueId) + '/resources/' + encodeURIComponent(resourceId) + '/slots', { date }));
    },
    getTurfBookings: function (params) { return request(query('/turf/organizer/bookings', params)); },
    getTurfCoupons: function (params) { return request(query('/turf/organizer/coupons', params)); },
    getTurfSettlements: function (params) { return request(query('/turf/organizer/settlements', params)); },
  };

  global.EMS_OWNER_API = Object.freeze(api);
})(window);
