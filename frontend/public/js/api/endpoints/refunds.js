/**
 * Refund API endpoints.
 *
 * Base path: /api/v1/admin/refunds
 * List and view require payment:read.
 * Create requires payment:write.
 */

const AdminRefundsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/refunds' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/refunds/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/refunds', data);
  }

  return Object.freeze({ list, get, create });
})();
