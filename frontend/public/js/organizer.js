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
    if (from) query.date_from = from;
    if (to) query.date_to = to;
    return API.get('/owner/dashboard', { query: query, authScope: 'organizer' });
  }

  function getSettlements(limit) {
    var query = {};
    if (limit) query.limit = limit;
    return API.get('/owner/settlements', { query: query, authScope: 'organizer' });
  }

  function getMovieAnalytics(from, to) {
    var query = {};
    if (from) query.date_from = from;
    if (to) query.date_to = to;
    return API.get('/owner/movies/analytics', { query: query, authScope: 'organizer' });
  }

  function getEventAnalytics(from, to) {
    var query = {};
    if (from) query.date_from = from;
    if (to) query.date_to = to;
    return API.get('/owner/events/analytics', { query: query, authScope: 'organizer' });
  }

  // ── Organization ──────────────────────────────────────────────

  function getMyOrganization() {
    return API.get('/organizer/me', { authScope: 'organizer' });
  }

  // ── Manager Management ─────────────────────────────────────────

  function listManagers(params) {
    params = params || {};
    return API.get('/owner/managers', { query: params, authScope: 'organizer' });
  }

  function getManager(id) {
    return API.get('/owner/managers/' + id, { authScope: 'organizer' });
  }

  function createManager(data) {
    return API.post('/owner/managers', data, { authScope: 'organizer' });
  }

  function disableManager(id) {
    return API.post('/owner/managers/' + id + '/disable', null, { authScope: 'organizer' });
  }

  function enableManager(id) {
    return API.post('/owner/managers/' + id + '/enable', null, { authScope: 'organizer' });
  }

  function resetManagerPassword(id) {
    return API.post('/owner/managers/' + id + '/reset-password', null, { authScope: 'organizer' });
  }

  function removeManager(id) {
    return API.del('/owner/managers/' + id, { authScope: 'organizer' });
  }

  function managerAnalytics() {
    return API.get('/owner/managers/analytics', { authScope: 'organizer' });
  }

  // ── Organizer Events ───────────────────────────────────────────

  function myEvents(params) {
    params = params || {};
    return API.get('/organizer/events', { query: params, authScope: 'organizer' });
  }

  function createEvent(data) {
    return API.post('/organizer/events', data, { authScope: 'organizer' });
  }

  function updateEvent(id, data) {
    return API.put('/organizer/events/' + id, data, { authScope: 'organizer' });
  }

  function deleteEvent(id) {
    return API.del('/organizer/events/' + id, { authScope: 'organizer' });
  }

  function eventStats(id) {
    return API.get('/organizer/events/' + id + '/stats', { authScope: 'organizer' });
  }

  // ── Turf (organizer) ───────────────────────────────────────────

  function myGrounds(params) {
    params = params || {};
    return API.get('/turf/organizer/grounds', { query: params, authScope: 'organizer' });
  }

  function createGround(data) {
    return API.post('/turf/organizer/grounds', data, { authScope: 'organizer' });
  }

  function updateGround(id, data) {
    return API.put('/turf/organizer/grounds/' + id, data, { authScope: 'organizer' });
  }

  function deleteGround(id) {
    return API.del('/turf/organizer/grounds/' + id, { authScope: 'organizer' });
  }

  // ── Movie (organizer) ──────────────────────────────────────────

  function myMovies(params) {
    params = params || {};
    return API.get('/organizer/movies', { query: params, authScope: 'organizer' });
  }

  return {
    // Auth
    login: login,
    refresh: refresh,

    // Dashboard
    getDashboard: getDashboard,
    getSettlements: getSettlements,
    getMovieAnalytics: getMovieAnalytics,
    getEventAnalytics: getEventAnalytics,

    // Organization
    getMyOrganization: getMyOrganization,

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
