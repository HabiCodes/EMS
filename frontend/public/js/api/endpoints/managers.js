/**
 * Manager API endpoints.
 *
 * Base path: /api/v1/admin/managers
 * Note: No password reset route exists for managers.
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
    return AdminAPI.put('/admin/managers/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/managers/' + id);
  }

  function toggleActive(id, isActive) {
    return AdminAPI.patch('/admin/managers/' + id + '/active', { isActive });
  }

  function resetPassword(id, newPassword) {
    return AdminAPI.post('/admin/managers/' + id + '/reset-password', { newPassword });
  }

  return Object.freeze({ list, get, create, update, remove, toggleActive, resetPassword });
})();
