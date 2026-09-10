/**
 * Price cap API endpoints.
 *
 * Base path: /api/v1/admin/movies/price-caps
 * All endpoints nested under the movie admin router.
 */

const AdminPriceCapsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/movies/price-caps' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/movies/price-caps/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/movies/price-caps', data);
  }

  function update(id, data) {
    return AdminAPI.patch('/admin/movies/price-caps/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/movies/price-caps/' + id);
  }

  return Object.freeze({ list, get, create, update, remove });
})();
