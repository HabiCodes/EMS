/**
 * Admin team (admins) API endpoints (read-only for listing).
 *
 * Base path: /api/v1/admin/admins
 * Requires admins:read permission.
 */

const AdminTeamAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/admins' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/admins/' + id);
  }

  return Object.freeze({ list, get });
})();
