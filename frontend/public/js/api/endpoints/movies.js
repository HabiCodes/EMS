/**
 * Movie API endpoints.
 *
 * Base path: /api/v1/admin/movies
 */

const AdminMoviesAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/movies' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/movies/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/movies', data);
  }

  function update(id, data) {
    return AdminAPI.put('/admin/movies/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/movies/' + id);
  }

  function toggleActive(id, isActive) {
    return AdminAPI.patch('/admin/movies/' + id + '/active', { isActive });
  }

  return Object.freeze({ list, get, create, update, remove, toggleActive });
})();
