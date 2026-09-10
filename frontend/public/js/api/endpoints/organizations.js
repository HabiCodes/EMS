/**
 * Organization API endpoints.
 *
 * Base path: /api/v1/admin/organizations
 */

const AdminOrganizationsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/organizations' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/organizations/' + id);
  }

  function update(id, data) {
    return AdminAPI.patch('/admin/organizations/' + id, data);
  }

  function deactivate(id) {
    return AdminAPI.post('/admin/organizations/' + id + '/deactivate');
  }

  function reactivate(id) {
    return AdminAPI.post('/admin/organizations/' + id + '/reactivate');
  }

  return Object.freeze({ list, get, update, deactivate, reactivate });
})();
