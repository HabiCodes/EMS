/**
 * Movie API endpoints.
 *
 * Base path: /api/v1/admin/movies
 * All endpoints under /admin/movies (nested in the movie admin router).
 */

const AdminMoviesAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/movies/movies' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/movies/movies/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/movies/movies', data);
  }

  function update(id, data) {
    return AdminAPI.put('/admin/movies/movies/' + id, data);
  }

  function patch(id, data) {
    return AdminAPI.patch('/admin/movies/movies/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/movies/movies/' + id);
  }

  function publish(id) {
    return AdminAPI.post('/admin/movies/movies/' + id + '/publish');
  }

  function archive(id) {
    return AdminAPI.post('/admin/movies/movies/' + id + '/archive');
  }

  return Object.freeze({ list, get, create, update, patch, remove, publish, archive });
})();
