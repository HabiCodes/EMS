/**
 * Cinema API endpoints.
 *
 * Base path: /api/v1/admin/movies/cinemas
 */

const AdminCinemasAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/movies/cinemas' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/movies/cinemas/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/movies/cinemas', data);
  }

  function update(id, data) {
    return AdminAPI.patch('/admin/movies/cinemas/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/movies/cinemas/' + id);
  }

  function toggle(id) {
    return AdminAPI.post('/admin/movies/cinemas/' + id + '/toggle');
  }

  return Object.freeze({ list, get, create, update, remove, toggle });
})();
