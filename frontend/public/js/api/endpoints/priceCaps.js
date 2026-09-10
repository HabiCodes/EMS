/**
 * Price cap API endpoints.
 *
 * Base path: /api/v1/admin/price-caps
 */

const AdminPriceCapsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/price-caps' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/price-caps/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/price-caps', data);
  }

  function update(id, data) {
    return AdminAPI.put('/admin/price-caps/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/price-caps/' + id);
  }

  return Object.freeze({ list, get, create, update, remove });
})();
