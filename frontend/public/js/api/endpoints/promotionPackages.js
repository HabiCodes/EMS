/**
 * Promotion package API endpoints.
 *
 * Base path: /api/v1/promotions/admin/packages
 * Admin actions (CRUD) — requires admins:read / admins:write.
 */

const AdminPromotionPackagesAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/promotions/admin/packages' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/promotions/admin/packages/' + id);
  }

  function create(data) {
    return AdminAPI.post('/promotions/admin/packages', data);
  }

  function update(id, data) {
    return AdminAPI.patch('/promotions/admin/packages/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/promotions/admin/packages/' + id);
  }

  return Object.freeze({ list, get, create, update, remove });
})();
