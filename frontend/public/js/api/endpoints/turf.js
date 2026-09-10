/**
 * Turf API endpoints (admin oversight).
 *
 * Base path: /api/v1/turf/admin
 * Venue status changes use PATCH /venues/:venueId/status (not approve/reject/suspend).
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

  function updateStatus(id, status) {
    return AdminAPI.patch('/turf/admin/venues/' + id + '/status', { status });
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

  // Reviews
  function listVenueReviews(venueId) {
    return AdminAPI.get('/turf/admin/venues/' + venueId + '/reviews');
  }

  return Object.freeze({
    list,
    get,
    updateStatus,
    listBookings,
    getBooking,
    listVenueReviews,
  });
})();
