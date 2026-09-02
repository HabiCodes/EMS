/**
 * admin.js — Admin portal service
 *
 * Login:
 *   POST   /api/v1/admin/login                - Admin login (no auth header)
 *
 * Authenticated (admin JWT in Authorization header):
 *   GET    /api/v1/admin/me                   - Current admin profile
 *   GET    /api/v1/admin/stats                - Dashboard analytics
 *   GET    /api/v1/admin/bookings             - All bookings (with filters)
 *   POST   /api/v1/admin/bookings/:id/cancel  - Cancel any booking
 *   GET    /api/v1/admin/recent-tickets       - Recent tickets
 *   GET    /api/v1/admin/users                - User management
 *   GET    /api/v1/admin/admins               - Admin/team listing
 *   GET    /api/v1/admin/audit-logs           - Audit log viewer
 *
 * Event management:
 *   GET    /api/v1/admin/events               - List all events
 *   POST   /api/v1/admin/events               - Create event
 *   PUT    /api/v1/admin/events/:id           - Update event
 *   DELETE /api/v1/admin/events/:id           - Delete event
 *   POST   /api/v1/admin/events/:id/restore   - Restore event
 *   POST   /api/v1/admin/events/:id/publish   - Publish event
 *   POST   /api/v1/admin/events/:id/hide      - Hide event
 *   POST   /api/v1/admin/events/:id/cancel    - Cancel event
 *   POST   /api/v1/admin/events/:id/featured  - Set featured
 *   GET    /api/v1/admin/events/pending-review- Pending review events
 *
 * Admin token storage: localStorage key "ems_admin_token"
 */
window.EMS_ADMIN = (function () {
  'use strict';

  var API = window.EMS_API;
  var UI = window.EMS_UI;
  var AUTH = window.EMS_AUTH;

  // ── Login ──────────────────────────────────────────────────────

  /**
   * Admin login. Stores token in EMS_ADMIN (separate from user token).
   * @param {string} email
   * @param {string} password
   * @returns {{ ok: boolean, data: object }}
   */
  function login(email, password) {
    return API.post('/admin/login', { email: email, password: password }, { skipAuth: true });
  }

  // ── Profile ────────────────────────────────────────────────────

  function getMe() {
    return API.get('/admin/me', { authScope: 'admin' });
  }

  // ── Dashboard Stats ────────────────────────────────────────────

  function getStats() {
    return API.get('/admin/stats', { authScope: 'admin' });
  }

  // ── Bookings ───────────────────────────────────────────────────

  function listBookings(filters) {
    filters = filters || {};
    return API.get('/admin/bookings', { query: filters, authScope: 'admin' });
  }

  function cancelBooking(bookingId, reason) {
    return API.post('/admin/bookings/' + bookingId + '/cancel', {
      reason: reason || 'Cancelled by admin',
    }, { authScope: 'admin' });
  }

  function recentTickets(limit) {
    return API.get('/admin/recent-tickets', { query: limit ? { limit: limit } : {}, authScope: 'admin' });
  }

  // ── Users ──────────────────────────────────────────────────────

  function listUsers(filters) {
    filters = filters || {};
    return API.get('/admin/users', { query: filters, authScope: 'admin' });
  }

  // ── Admin Team ─────────────────────────────────────────────────

  function listAdmins(params) {
    params = params || {};
    return API.get('/admin/admins', { query: params, authScope: 'admin' });
  }

  // ── Audit Logs ─────────────────────────────────────────────────

  function listAuditLogs(filters) {
    filters = filters || {};
    return API.get('/admin/audit-logs', { query: filters, authScope: 'admin' });
  }

  // ── Event Management (admin scope) ─────────────────────────────

  function listEvents(filters) {
    filters = filters || {};
    return API.get('/admin/events', { query: filters, authScope: 'admin' });
  }

  function createEvent(data) {
    return API.post('/admin/events', data, { authScope: 'admin' });
  }

  function updateEvent(id, data) {
    return API.put('/admin/events/' + id, data, { authScope: 'admin' });
  }

  function deleteEvent(id) {
    return API.del('/admin/events/' + id, { authScope: 'admin' });
  }

  function restoreEvent(id) {
    return API.post('/admin/events/' + id + '/restore', null, { authScope: 'admin' });
  }

  function publishEvent(id) {
    return API.post('/admin/events/' + id + '/publish', null, { authScope: 'admin' });
  }

  function hideEvent(id) {
    return API.post('/admin/events/' + id + '/hide', null, { authScope: 'admin' });
  }

  function cancelEvent(id) {
    return API.post('/admin/events/' + id + '/cancel', null, { authScope: 'admin' });
  }

  function setFeatured(id, featured) {
    return API.post('/admin/events/' + id + '/featured', { featured: !!featured }, { authScope: 'admin' });
  }

  function getPendingReview() {
    return API.get('/admin/events/pending-review', { authScope: 'admin' });
  }

  // ── Turf Management (admin scope) ──────────────────────────────

  function listTurfBookings(filters) {
    filters = filters || {};
    return API.get('/turf/bookings', { query: filters, authScope: 'admin' });
  }

  function listAllGrounds(filters) {
    filters = filters || {};
    return API.get('/turf/grounds', { query: filters, authScope: 'admin' });
  }

  return {
    login: login,
    getMe: getMe,
    getStats: getStats,

    listBookings: listBookings,
    cancelBooking: cancelBooking,
    recentTickets: recentTickets,

    listUsers: listUsers,
    listAdmins: listAdmins,
    listAuditLogs: listAuditLogs,

    listEvents: listEvents,
    createEvent: createEvent,
    updateEvent: updateEvent,
    deleteEvent: deleteEvent,
    restoreEvent: restoreEvent,
    publishEvent: publishEvent,
    hideEvent: hideEvent,
    cancelEvent: cancelEvent,
    setFeatured: setFeatured,
    getPendingReview: getPendingReview,

    listTurfBookings: listTurfBookings,
    listAllGrounds: listAllGrounds,
  };
})();
