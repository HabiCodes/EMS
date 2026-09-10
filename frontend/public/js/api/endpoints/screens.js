/**
 * Screen API endpoints.
 *
 * Base path: /api/v1/admin/screens
 */

const AdminScreensAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/screens' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/screens/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/screens', data);
  }

  function update(id, data) {
    return AdminAPI.put('/admin/screens/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/screens/' + id);
  }

  function toggleActive(id, isActive) {
    return AdminAPI.patch('/admin/screens/' + id + '/active', { isActive });
  }

  return Object.freeze({ list, get, create, update, remove, toggleActive });
})();
