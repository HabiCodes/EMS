/**
 * admin.js — Admin portal service
 *
 * Authentication model:
 *   - Admin login:  POST /api/v1/admin/login  (no auth required)
 *   - Admin JWT:    stored in localStorage as "ems_admin_token"
 *   - All requests: send Authorization: Bearer <ems_admin_token>
 *   - Customer JWT: stored as "ems_access_token" — NOT used for admin routes
 *
 * IMPORTANT: This module uses its OWN fetch calls. The EMS_API wrapper
 * (api.js) only sends the customer token (ems_access_token) and does NOT
 * support admin auth scope. All admin requests go through this module.
 *
 * Admin token expires in 12 hours. On expiry, dispatch 'ems:admin-expired'
 * event so the UI can redirect to login.
 */

(function () {
  'use strict';

  // Build full API base from config: BASE_URL + /api/v1
  // Falls back to relative path /api/v1 if config not loaded
  var _cfg = {};
  try { _cfg = window.EMS_API_CONFIG || {}; } catch (e) { /* noop */ }
  var _base = (_cfg.BASE_URL || '').replace(/\/+$/, '');
  var API_BASE = _base ? (_base + '/api/v1') : '/api/v1';
  var TOKEN_KEY = 'ems_admin_token';
  var NAME_KEY = 'ems_admin_name';
  var EMAIL_KEY = 'ems_admin_email';
  var ROLE_KEY = 'ems_admin_role';
  var PERMS_KEY = 'ems_admin_permissions';

  // ── Token helpers ──────────────────────────────────────────────

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }
  function setToken(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }
  function getRole() {
    try { return localStorage.getItem(ROLE_KEY) || 'admin'; } catch { return 'admin'; }
  }
  function getPermissions() {
    try { return JSON.parse(localStorage.getItem(PERMS_KEY) || 'null'); } catch { return null; }
  }
  function setPermissions(p) {
    if (p) localStorage.setItem(PERMS_KEY, JSON.stringify(p));
    else localStorage.removeItem(PERMS_KEY);
  }
  function clearSession() {
    [TOKEN_KEY, NAME_KEY, EMAIL_KEY, ROLE_KEY, PERMS_KEY].forEach(function (k) {
      try { localStorage.removeItem(k); } catch { /* noop */ }
    });
  }
  function isLoggedIn() {
    return !!getToken();
  }

  // ── Core fetch with admin JWT ──────────────────────────────────

  function adminHeaders() {
    var h = { 'Content-Type': 'application/json' };
    var t = getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  function adminFetch(path, opts) {
    opts = opts || {};
    var url = API_BASE + path;
    var init = {
      method: opts.method || 'GET',
      headers: adminHeaders(),
    };
    if (opts.body && init.method !== 'GET' && init.method !== 'HEAD') {
      init.body = JSON.stringify(opts.body);
    }
    return fetch(url, init).then(function (res) {
      var ct = res.headers.get('content-type') || 'application/json';
      var data;
      if (ct.indexOf('application/json') !== -1) {
        data = res.json();
      } else {
        data = res.text().then(function (t) { return { message: t }; });
      }
      return data.then(function (d) {
        return { ok: res.ok, status: res.status, data: d };
      });
    }).catch(function (err) {
      return { ok: false, status: 0, data: { message: 'Network error: ' + (err.message || 'Unknown') } };
    });
  }

  // ── Auth (login — no token required) ──────────────────────────

  /**
   * POST /api/v1/admin/login
   * Body: { email, password }
   * Response: { success: true, data: { token, admin: { id, email, name, role, permissions } } }
   */
  function login(email, password) {
    return fetch(API_BASE + '/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    }).then(function (res) {
      var ct = res.headers.get('content-type') || 'application/json';
      return (ct.indexOf('application/json') !== -1 ? res.json() : res.text().then(function (t) { return { message: t }; })).then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    }).catch(function (err) {
      return { ok: false, status: 0, data: { message: 'Network error' } };
    });
  }

  // ── Session validation ────────────────────────────────────────

  /**
   * Validate the stored admin token by calling a lightweight protected endpoint.
   * Uses /admin/stats as a cheap "is token still valid?" check.
   * Returns null if invalid, the user object if valid.
   */
  function validateSession() {
    return adminFetch('/admin/stats').then(function (r) {
      if (r.ok && r.data && r.data.success && r.data.data) {
        // Token is valid — the stats response confirms it
        return { valid: true, stats: r.data.data };
      }
      // 401 means token expired or invalid
      if (r.status === 401 || r.status === 403) {
        clearSession();
        return { valid: false, reason: 'expired' };
      }
      // Other errors — token might still be valid but stats endpoint has an issue
      // Don't clear session, let the actual API call handle the error
      return { valid: null, stats: r.data && r.data.data ? r.data.data : null, status: r.status };
    });
  }

  // ── Profile ───────────────────────────────────────────────────

  function getMe() {
    return adminFetch('/admin/me');
  }

  // ── Dashboard ─────────────────────────────────────────────────

  function getStats() {
    return adminFetch('/admin/stats');
  }

  // ── Bookings ──────────────────────────────────────────────────

  function listBookings(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/admin/bookings' + (qs.length ? '?' + qs.join('&') : ''));
  }

  function cancelBooking(bookingId, reason) {
    return adminFetch('/admin/bookings/' + bookingId + '/cancel', {
      method: 'POST',
      body: { reason: reason || 'Cancelled by admin' },
    });
  }

  function recentTickets(limit) {
    var qs = limit ? '?limit=' + encodeURIComponent(limit) : '';
    return adminFetch('/admin/recent-tickets' + qs);
  }

  // ── Users ─────────────────────────────────────────────────────

  function listUsers(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/admin/users' + (qs.length ? '?' + qs.join('&') : ''));
  }

  // ── Admin Team ────────────────────────────────────────────────

  function listAdmins(params) {
    params = params || {};
    var qs = [];
    Object.keys(params).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null) {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
      }
    });
    return adminFetch('/admin/admins' + (qs.length ? '?' + qs.join('&') : ''));
  }

  // ── Audit Logs ────────────────────────────────────────────────

  function listAuditLogs(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/admin/audit-logs' + (qs.length ? '?' + qs.join('&') : ''));
  }

  // ── Event Management ──────────────────────────────────────────

  function listEvents(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/admin/events' + (qs.length ? '?' + qs.join('&') : ''));
  }

  function createEvent(data) {
    return adminFetch('/admin/events', { method: 'POST', body: data });
  }

  function updateEvent(id, data) {
    return adminFetch('/admin/events/' + id, { method: 'PUT', body: data });
  }

  function deleteEvent(id) {
    return adminFetch('/admin/events/' + id, { method: 'DELETE' });
  }

  function restoreEvent(id) {
    return adminFetch('/admin/events/' + id + '/restore', { method: 'POST' });
  }

  function publishEvent(id) {
    return adminFetch('/admin/events/' + id + '/publish', { method: 'POST' });
  }

  function hideEvent(id) {
    return adminFetch('/admin/events/' + id + '/hide', { method: 'POST' });
  }

  function cancelEvent(id) {
    return adminFetch('/admin/events/' + id + '/cancel', { method: 'POST' });
  }

  function setFeatured(id, featured) {
    return adminFetch('/admin/events/' + id + '/featured', {
      method: 'POST',
      body: { featured: !!featured },
    });
  }

  function getPendingReview() {
    return adminFetch('/admin/events/pending-review');
  }

  // ── Organizer Applications ────────────────────────────────────

  function listOrganizerApplications(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null) {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/admin/organizer-applications' + (qs.length ? '?' + qs.join('&') : ''));
  }

  function reviewOrganizerApplication(id, action, reason) {
    return adminFetch('/admin/organizer-applications/' + id + '/review', {
      method: 'POST',
      body: { action: action, reason: reason || '' },
    });
  }

  // ── Turf Management ───────────────────────────────────────────

  function listTurfBookings(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null) {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/turf/bookings' + (qs.length ? '?' + qs.join('&') : ''));
  }

  function listAllGrounds(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null) {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/turf/grounds' + (qs.length ? '?' + qs.join('&') : ''));
  }

  // ── Managers ──────────────────────────────────────────────────

  function listManagers(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null) {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/admin/managers' + (qs.length ? '?' + qs.join('&') : ''));
  }

  function createManager(email, name) {
    return adminFetch('/admin/managers', { method: 'POST', body: { email: email, name: name } });
  }

  function toggleManager(id, activate) {
    var endpoint = activate ? '/admin/managers/' + id + '/reactivate' : '/admin/managers/' + id + '/deactivate';
    return adminFetch(endpoint, { method: 'POST' });
  }

  // ── Organizations ─────────────────────────────────────────────

  function listOrganizations(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/admin/organizations' + (qs.length ? '?' + qs.join('&') : ''));
  }

  function toggleOrganization(id, activate) {
    var endpoint = activate ? '/admin/organizations/' + id + '/reactivate' : '/admin/organizations/' + id + '/deactivate';
    return adminFetch(endpoint, { method: 'POST' });
  }

  // ── Movies / Cinemas ──────────────────────────────────────────

  function listCinemas(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null) {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/admin/movies/cinemas' + (qs.length ? '?' + qs.join('&') : ''));
  }

  // ── Refunds ───────────────────────────────────────────────────

  function listRefunds(filters) {
    filters = filters || {};
    var qs = [];
    Object.keys(filters).forEach(function (k) {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(filters[k]));
      }
    });
    return adminFetch('/admin/refunds' + (qs.length ? '?' + qs.join('&') : ''));
  }

  // ── Expose ────────────────────────────────────────────────────

  window.EMS_ADMIN = {
    API_BASE: API_BASE,

    // Auth
    login: login,
    validateSession: validateSession,
    isLoggedIn: isLoggedIn,
    getToken: getToken,
    setToken: setToken,
    getRole: getRole,
    getPermissions: getPermissions,
    setPermissions: setPermissions,
    clearSession: clearSession,

    // Profile
    getMe: getMe,

    // Dashboard
    getStats: getStats,

    // Bookings
    listBookings: listBookings,
    cancelBooking: cancelBooking,
    recentTickets: recentTickets,

    // Users
    listUsers: listUsers,

    // Admin team
    listAdmins: listAdmins,

    // Audit logs
    listAuditLogs: listAuditLogs,

    // Events
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

    // Organizer applications
    listOrganizerApplications: listOrganizerApplications,
    reviewOrganizerApplication: reviewOrganizerApplication,

    // Turf
    listTurfBookings: listTurfBookings,
    listAllGrounds: listAllGrounds,

    // Managers
    listManagers: listManagers,
    createManager: createManager,
    toggleManager: toggleManager,

    // Organizations
    listOrganizations: listOrganizations,
    toggleOrganization: toggleOrganization,

    // Movies/Cinemas
    listCinemas: listCinemas,

    // Refunds
    listRefunds: listRefunds,
  };

})();
