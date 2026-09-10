/**
 * User API endpoints.
 *
 * Base path: /api/v1/admin/users
 */

const AdminUsersAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/users' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/users/' + id);
  }

  function update(id, data) {
    return AdminAPI.put('/admin/users/' + id, data);
  }

  function toggleActive(id, isActive) {
    return AdminAPI.patch('/admin/users/' + id + '/active', { isActive });
  }

  function ban(id) {
    return AdminAPI.post('/admin/users/' + id + '/ban');
  }

  function unban(id) {
    return AdminAPI.post('/admin/users/' + id + '/unban');
  }

  return Object.freeze({ list, get, update, toggleActive, ban, unban });
})();
