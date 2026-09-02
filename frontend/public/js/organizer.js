/**
 * organizer.js — Organizer / business-owner service
 *
 * Login:
 *   POST   /api/v1/organizer/auth/login       - Organizer login (no auth header)
 *   POST   /api/v1/organizer/auth/refresh     - Refresh token
 *   POST   /api/v1/organizer/auth/setup-password - Setup initial password
 *
 * Owner Dashboard (requires organizer JWT):
 *   GET    /api/v1/owner/dashboard            - Revenue & analytics
 *   GET    /api/v1/owner/settlements          - Settlement history
 *   GET    /api/v1/owner/movies/analytics     - Movie analytics
 *
 * Manager management (owner/manager JWT):
 *   GET    /api/v1/owner/managers             - List managers
 *   GET    /api/v1/owner/managers/:id         - Manager details
 *   POST   /api/v1/owner/managers             - Create manager
 *   POST   /api/v1/owner/managers/:id/disable - Disable manager
 *   POST   /api/v1/owner/managers/:id/enable  - Enable manager
 *   POST   /api/v1/owner/managers/:id/reset-password - Reset password
 *   DELETE /api/v1/owner/managers/:id         - Remove manager
 *   GET    /api/v1/owner/managers/analytics   - Manager performance
 *
 * Organizer event management (organizer JWT):
 *   GET    /api/v1/organizer/events           - My events
 *   POST   /api/v1/organizer/events           - Create event
 *   PUT    /api/v1/organizer/events/:id       - Update event
 *   DELETE /api/v1/organizer/events/:id       - Delete event
 *   GET    /api/v1/organizer/events/:id/stats - Event stats
 *
 * Turf organizer (organizer JWT):
 *   GET    /api/v1/turf/organizer/grounds     - My turf grounds
 *   POST   /api/v1/turf/organizer/grounds     - Create ground
 *   PUT    /api/v1/turf/organizer/grounds/:id - Update ground
 *   DELETE /api/v1/turf/organizer/grounds/:id - Delete ground
 *
 * Token storage: localStorage key "ems_organizer_token"
 */
window.EMS_ORGANIZER = (function () {
  'use strict';

  var API = window.EMS_API;
  var UI = window.EMS_UI;
  var AUTH = window.EMS_AUTH;

  // ── Auth ───────────────────────────────────────────────────────

  /**
   * Organizer login. Stores token separately from user/admin tokens.
   */
  function login(email, password) {
    return API.post('/organizer/auth/login', { email: email, password: password }, { skipAuth: true });
  }

  /**
   * Refresh organizer token.
   */
  function refresh(refreshToken) {
    return API.post('/organizer/auth/refresh', { refreshToken: refreshToken }, { skipAuth: true });
  }

  // ── Dashboard ──────────────────────────────────────────────────

  function getDashboard(from, to) {
    var query = {};
    if (from) query.from = from;
    if (to) query.to = to;
    return API.get('/owner/dashboard', { query: query });
  }

  function getSettlements(limit) {
    var query = {};
    if (limit) query.limit = limit;
    return API.get('/owner/settlements', { query: query });
  }

  function getMovieAnalytics(from, to) {
    var query = {};
    if (from) query.from = from;
    if (to) query.to = to;
    return API.get('/owner/movies/analytics', { query: query });
  }

  // ── Manager Management ─────────────────────────────────────────

  function listManagers(params) {
    params = params || {};
    return API.get('/owner/managers', { query: params });
  }

  function getManager(id) {
    return API.get('/owner/managers/' + id);
  }

  function createManager(data) {
    return API.post('/owner/managers', data);
  }

  function disableManager(id) {
    return API.post('/owner/managers/' + id + '/disable');
  }

  function enableManager(id) {
    return API.post('/owner/managers/' + id + '/enable');
  }

  function resetManagerPassword(id) {
    return API.post('/owner/managers/' + id + '/reset-password');
  }

  function removeManager(id) {
    return API.del('/owner/managers/' + id);
  }

  function managerAnalytics() {
    return API.get('/owner/managers/analytics');
  }

  // ── Organizer Events ───────────────────────────────────────────

  function myEvents(params) {
    params = params || {};
    return API.get('/organizer/events', { query: params });
  }

  function createEvent(data) {
    return API.post('/organizer/events', data);
  }

  function updateEvent(id, data) {
    return API.put('/organizer/events/' + id, data);
  }

  function deleteEvent(id) {
    return API.del('/organizer/events/' + id);
  }

  function eventStats(id) {
    return API.get('/organizer/events/' + id + '/stats');
  }

  // ── Turf (organizer) ───────────────────────────────────────────

  function myGrounds(params) {
    params = params || {};
    return API.get('/turf/organizer/grounds', { query: params });
  }

  function createGround(data) {
    return API.post('/turf/organizer/grounds', data);
  }

  function updateGround(id, data) {
    return API.put('/turf/organizer/grounds/' + id, data);
  }

  function deleteGround(id) {
    return API.del('/turf/organizer/grounds/' + id);
  }

  // ── Movie (organizer) ──────────────────────────────────────────

  function myMovies(params) {
    params = params || {};
    return API.get('/organizer/movies', { query: params });
  }

  return {
    // Auth
    login: login,
    refresh: refresh,

    // Dashboard
    getDashboard: getDashboard,
    getSettlements: getSettlements,
    getMovieAnalytics: getMovieAnalytics,

    // Managers
    listManagers: listManagers,
    getManager: getManager,
    createManager: createManager,
    disableManager: disableManager,
    enableManager: enableManager,
    resetManagerPassword: resetManagerPassword,
    removeManager: removeManager,
    managerAnalytics: managerAnalytics,

    // Events
    myEvents: myEvents,
    createEvent: createEvent,
    updateEvent: updateEvent,
    deleteEvent: deleteEvent,
    eventStats: eventStats,

    // Turf
    myGrounds: myGrounds,
    createGround: createGround,
    updateGround: updateGround,
    deleteGround: deleteGround,

    // Movies
    myMovies: myMovies,
  };
})();
