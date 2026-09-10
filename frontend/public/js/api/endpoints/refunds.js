/**
 * Refund API endpoints.
 *
 * Base path: /api/v1/admin/refunds
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

  function approve(id, data = {}) {
    return AdminAPI.post('/admin/refunds/' + id + '/approve', data);
  }

  function reject(id, data = {}) {
    return AdminAPI.post('/admin/refunds/' + id + '/reject', data);
  }

  function process(id) {
    return AdminAPI.post('/admin/refunds/' + id + '/process');
  }

  return Object.freeze({ list, get, approve, reject, process });
})();
