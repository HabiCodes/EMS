/**
 * Admin team API endpoints (read-only).
 *
 * Base path: /api/v1/admin/team
 * NOTE: Admin team is read-only — no mutation routes exist.
 */

const AdminTeamAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/team' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/team/' + id);
  }

  return Object.freeze({ list, get });
})();
