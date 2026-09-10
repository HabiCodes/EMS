/**
 * Organizer application API endpoints.
 *
 * Base path: /api/v1/admin/organizer-applications
 */

const AdminOrganizerApplicationsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/organizer-applications' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/organizer-applications/' + id);
  }

  function review(id, data = {}) {
    // data: { action, reason? }
    return AdminAPI.post('/admin/organizer-applications/' + id + '/review', data);
  }

  return Object.freeze({ list, get, review });
})();
