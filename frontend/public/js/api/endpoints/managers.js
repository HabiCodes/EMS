/**
 * Manager API endpoints.
 *
 * Base path: /api/v1/admin/managers
 */

const AdminManagersAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/managers' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/managers/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/managers', data);
  }

  function update(id, data) {
    return AdminAPI.patch('/admin/managers/' + id, data);
  }

  function deactivate(id) {
    return AdminAPI.post('/admin/managers/' + id + '/deactivate');
  }

  function reactivate(id) {
    return AdminAPI.post('/admin/managers/' + id + '/reactivate');
  }

  return Object.freeze({ list, get, create, update, deactivate, reactivate });
})();
