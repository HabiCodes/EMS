/**
 * Showtime API endpoints.
 *
 * Base path: /api/v1/admin/movies/showtimes
 * Sub-resources: /cinemas/:cinemaId/showtimes, /movies/:movieId/showtimes
 */

const AdminShowtimesAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/movies/showtimes' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/movies/showtimes/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/movies/showtimes', data);
  }

  function update(id, data) {
    return AdminAPI.patch('/admin/movies/showtimes/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/movies/showtimes/' + id);
  }

  function getByCinema(cinemaId) {
    return AdminAPI.get('/admin/movies/cinemas/' + cinemaId + '/showtimes');
  }

  function getByMovie(movieId) {
    return AdminAPI.get('/admin/movies/movies/' + movieId + '/showtimes');
  }

  function getStats() {
    return AdminAPI.get('/admin/movies/showtimes/stats');
  }

  return Object.freeze({
    list,
    get,
    create,
    update,
    remove,
    getByCinema,
    getByMovie,
    getStats,
  });
})();
