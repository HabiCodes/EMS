/**
 * Cinema API endpoints.
 *
 * Base path: /api/v1/admin/cinemas
 */

const AdminCinemasAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/cinemas' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/cinemas/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/cinemas', data);
  }

  function update(id, data) {
    return AdminAPI.put('/admin/cinemas/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/cinemas/' + id);
  }

  function toggleActive(id, isActive) {
    return AdminAPI.patch('/admin/cinemas/' + id + '/active', { isActive });
  }

  return Object.freeze({ list, get, create, update, remove, toggleActive });
})();
