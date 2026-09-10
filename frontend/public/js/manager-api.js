/**
 * EntryMySlot manager client.
 * Uses only deployed organizer-authenticated routes and never supplies demo data.
 */
(function (global) {
  'use strict';

  const config = global.EMS_API_CONFIG || {};
  const origin = (config.BASE_URL || 'https://api.entrymyslot.com').replace(/\/+$/, '');
  const apiBase = (config.API_BASE || '/api/v1').replace(/\/+$/, '');
  const baseUrl = origin + apiBase;
  const keys = Object.freeze({
    accessToken: 'ems_manager_access_token',
    refreshToken: 'ems_manager_refresh_token',
    user: 'ems_manager_user',
  });
  let refreshPromise = null;

  function read(key) {
    try { return global.localStorage.getItem(key); } catch (_) { return null; }
  }

  function write(key, value) {
    try {
      if (value === null || value === undefined || value === '') global.localStorage.removeItem(key);
      else global.localStorage.setItem(key, String(value));
    } catch (_) {}
  }

  function getStoredUser() {
    const raw = read(keys.user);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function clearSession() {
    write(keys.accessToken, null);
    write(keys.refreshToken, null);
    write(keys.user, null);
  }

  function storeSession(response) {
    const data = response && response.data ? response.data : response;
    if (!data || !data.accessToken || !data.refreshToken || !data.user) {
      throw new Error('The server returned an incomplete manager session.');
    }
    if (data.user.role !== 'manager') {
      clearSession();
      const error = new Error('Manager access is required.');
      error.status = 403;
      throw error;
    }
    write(keys.accessToken, data.accessToken);
    write(keys.refreshToken, data.refreshToken);
    write(keys.user, JSON.stringify(data.user));
    return data;
  }

  async function readBody(response) {
    if (response.status === 204) return null;
    try { return await response.json(); } catch (_) { return null; }
  }

  function messageFor(body, status) {
    return body && (body.message || body.error || (body.data && (body.data.message || body.data.reason)))
      ? body.message || body.error || body.data.message || body.data.reason
      : `Request failed (${status})`;
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
    const fetchOptions = { method: opts.method || 'GET', headers, signal: opts.signal };
    if (opts.body !== undefined && opts.body !== null) fetchOptions.body = JSON.stringify(opts.body);

    let response;
    try {
      response = await global.fetch(baseUrl + (path.charAt(0) === '/' ? path : '/' + path), fetchOptions);
    } catch (_) {
      const error = new Error('Unable to reach the EntryMySlot test server.');
      error.status = 0;
      throw error;
    }

    const body = await readBody(response);
    if (response.status === 401 && !opts.skipAuth && !opts._retried) {
      const refreshed = await refreshSession();
      if (refreshed) return request(path, Object.assign({}, opts, { _retried: true }));
      clearSession();
    }
    if (!response.ok) {
      const error = new Error(messageFor(body, response.status));
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
      if (entry[1] !== undefined && entry[1] !== null && entry[1] !== '') search.set(entry[0], String(entry[1]));
    });
    const encoded = search.toString();
    return path + (encoded ? '?' + encoded : '');
  }

  async function login(email, password) {
    const response = await request('/organizer/auth/login', {
      method: 'POST', body: { email, password }, skipAuth: true, _retried: true,
    });
    return storeSession(response);
  }

  function orgPath(organizationId, suffix) {
    return '/turf/manager/organizations/' + encodeURIComponent(organizationId) + suffix;
  }

  global.EMS_MANAGER_API = Object.freeze({
    baseUrl,
    login,
    logout: clearSession,
    restoreSession: function () {
      return { accessToken: read(keys.accessToken), refreshToken: read(keys.refreshToken), user: getStoredUser() };
    },
    request,
    getOrganization: function () { return request('/organizer/organizations/me'); },
    getEvents: function (params) { return request(query('/organizer/events', params)); },
    getEventTiers: function (eventId) { return request('/organizer/events/' + encodeURIComponent(eventId) + '/ticket-tiers'); },
    getMovies: function (params) { return request(query('/organizer/movies/movies', params)); },
    getCinemas: function () { return request('/organizer/movies/cinemas'); },
    getScreens: function (params) { return request(query('/organizer/movies/screens', params)); },
    getShowtimes: function (params) { return request(query('/organizer/movies/showtimes', params)); },
    getMovieOfflineBookings: function (params) { return request(query('/organizer/movies/offline-bookings', params)); },
    getMovieOfflineBooking: function (bookingId) {
      return request('/organizer/movies/offline-bookings/' + encodeURIComponent(bookingId));
    },
    createMovieOfflineBooking: function (body) { return request('/organizer/movies/offline-bookings', { method: 'POST', body }); },
    getTurfVenues: function (params) { return request(query('/turf/organizer/venues', params)); },
    getTurfResources: function (venueId, params) {
      return request(query('/turf/organizer/venues/' + encodeURIComponent(venueId) + '/resources', params));
    },
    getTurfSlots: function (venueId, resourceId, date) {
      return request(query('/turf/organizer/venues/' + encodeURIComponent(venueId) + '/resources/' + encodeURIComponent(resourceId) + '/slots', { date }));
    },
    getTurfAttendance: function (organizationId, params) { return request(query(orgPath(organizationId, '/attendance'), params)); },
    getTurfDailyReport: function (organizationId, date) { return request(query(orgPath(organizationId, '/daily-report'), { date })); },
    getTurfEntryLogs: function (organizationId, params) { return request(query(orgPath(organizationId, '/entry-logs'), params)); },
    validateTurfQr: function (organizationId, token) {
      return request(orgPath(organizationId, '/validate-qr'), { method: 'POST', body: { token } });
    },
    createTurfOfflineBooking: function (organizationId, body) {
      return request(orgPath(organizationId, '/offline-booking'), { method: 'POST', body });
    },
    cancelTurfBooking: function (organizationId, bookingId, reason) {
      return request(orgPath(organizationId, '/bookings/' + encodeURIComponent(bookingId) + '/cancel'), {
        method: 'POST', body: { reason: reason || 'Cancelled by manager' },
      });
    },
  });
})(window);
