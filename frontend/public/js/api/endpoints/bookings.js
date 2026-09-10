/**
 * Unified booking API endpoints.
 *
 * Base path: /api/v1/admin/bookings
 */

const AdminBookingsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/bookings' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/bookings/' + id);
  }

  function cancel(id, data = {}) {
    return AdminAPI.post('/admin/bookings/' + id + '/cancel', data);
  }

  function refund(id, data = {}) {
    return AdminAPI.post('/admin/bookings/' + id + '/refund', data);
  }

  return Object.freeze({ list, get, cancel, refund });
})();
