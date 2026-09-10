/**
 * Turf API endpoints.
 *
 * Base path: /api/v1/turf/admin
 */

const AdminTurfAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/turf/admin/venues' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/turf/admin/venues/' + id);
  }

  function approve(id, data = {}) {
    return AdminAPI.post('/turf/admin/venues/' + id + '/approve', data);
  }

  function reject(id, data = {}) {
    return AdminAPI.post('/turf/admin/venues/' + id + '/reject', data);
  }

  function suspend(id, data = {}) {
    return AdminAPI.post('/turf/admin/venues/' + id + '/suspend', data);
  }

  function update(id, data) {
    return AdminAPI.put('/turf/admin/venues/' + id, data);
  }

  // Bookings
  function listBookings(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/turf/admin/bookings' + (qs ? '?' + qs : ''));
  }

  function getBooking(id) {
    return AdminAPI.get('/turf/admin/bookings/' + id);
  }

  function approveBooking(id) {
    return AdminAPI.post('/turf/admin/bookings/' + id + '/approve');
  }

  function rejectBooking(id) {
    return AdminAPI.post('/turf/admin/bookings/' + id + '/reject');
  }

  function refundBooking(id, data = {}) {
    return AdminAPI.post('/turf/admin/bookings/' + id + '/refund', data);
  }

  return Object.freeze({
    list,
    get,
    approve,
    reject,
    suspend,
    update,
    listBookings,
    getBooking,
    approveBooking,
    rejectBooking,
    refundBooking,
  });
})();
