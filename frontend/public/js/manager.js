/**
 * manager.js — Turf Manager API service
 *
 * Base path (all turf-manager routes): POST /api/v1/turf/manager/organizations/:organizationId/*
 *
 * Authentication: Organizer JWT via authScope: 'organizer'
 *
 * Manager endpoints:
 *   GET  /api/v1/turf/manager/organizations/:orgId/attendance?date&venueId&resourceId
 *   GET  /api/v1/turf/manager/organizations/:orgId/daily-report?date
 *   GET  /api/v1/turf/manager/organizations/:orgId/entry-logs?date&limit
 *   POST /api/v1/turf/manager/organizations/:orgId/validate-qr          { token }
 *   POST /api/v1/turf/manager/organizations/:orgId/bookings/:id/cancel   { reason? }
 *   POST /api/v1/turf/manager/organizations/:orgId/offline-booking       { availabilityUnitId, customerName, customerPhone, quantity? }
 *
 * Venue / Resource endpoints (organizer scope, used to build offline booking):
 *   GET  /api/v1/turf/organizer/venues
 *   GET  /api/v1/turf/organizer/venues/:venueId/resources
 *   GET  /api/v1/turf/resources/:resourceId/availability?date
 *
 * Organization context:
 *   GET  /api/v1/organizer/me
 */

window.EMS_MANAGER = (function () {
  'use strict';

  var API = window.EMS_API;

  // ════════════════════════════════════════════════════════════════
  //  Organization
  // ════════════════════════════════════════════════════════════════

  function getMyOrganization() {
    return API.get('/organizer/me', { authScope: 'organizer' });
  }

  // ════════════════════════════════════════════════════════════════
  //  Attendance — bookings for a given date
  //
  //  GET /turf/manager/organizations/:orgId/attendance
  //  Query: { date, venueId?, resourceId? }
  //  Response: { success: true, data: { bookings: [...] } }
  //
  //  Booking fields:
  //    id, booking_reference, booking_type, status, amount, created_at,
  //    starts_at, ends_at, customer_name, customer_phone,
  //    resource_name, venue_name, qr_status
  // ════════════════════════════════════════════════════════════════

  function getAttendance(orgId, query) {
    query = query || {};
    return API.get('/turf/manager/organizations/' + orgId + '/attendance', {
      query: query,
      authScope: 'organizer',
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  Daily Report — revenue breakdown by booking type
  //
  //  GET /turf/manager/organizations/:orgId/daily-report
  //  Query: { date } (required, YYYY-MM-DD)
  //  Response: { success: true, data: { date, online: { count, revenue }, offline: { count, revenue } } }
  // ════════════════════════════════════════════════════════════════

  function getDailyReport(orgId, date) {
    var q = {};
    if (date) q.date = date;
    return API.get('/turf/manager/organizations/' + orgId + '/daily-report', {
      query: q,
      authScope: 'organizer',
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  Entry Logs — QR check-in records
  //
  //  GET /turf/manager/organizations/:orgId/entry-logs
  //  Query: { date?, limit? } (default limit: 50)
  //  Response: { success: true, data: { entries: [...] } }
  //
  //  Entry fields:
  //    id, used_at, booking_type, status,
  //    customer_name, customer_phone, venue_name, resource_name
  // ════════════════════════════════════════════════════════════════

  function getEntryLogs(orgId, query) {
    query = query || {};
    return API.get('/turf/manager/organizations/' + orgId + '/entry-logs', {
      query: query,
      authScope: 'organizer',
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  QR Validation / Check-in
  //
  //  POST /turf/manager/organizations/:orgId/validate-qr
  //  Body: { token }
  //  Response: { success: true, data: { valid, reason?, booking? } }
  // ════════════════════════════════════════════════════════════════

  function validateQR(orgId, token) {
    return API.post('/turf/manager/organizations/' + orgId + '/validate-qr', { token: token }, { authScope: 'organizer' });
  }

  // ════════════════════════════════════════════════════════════════
  //  Cancel Booking (Manager)
  //
  //  POST /turf/manager/organizations/:orgId/bookings/:bookingId/cancel
  //  Body: { reason? }
  //  Response: { success: true, data: cancelledBooking }
  // ════════════════════════════════════════════════════════════════

  function cancelBooking(orgId, bookingId, reason) {
    return API.post('/turf/manager/organizations/' + orgId + '/bookings/' + bookingId + '/cancel', { reason: reason || 'Cancelled by manager' }, { authScope: 'organizer' });
  }

  // ════════════════════════════════════════════════════════════════
  //  Offline Booking (Walk-in)
  //
  //  POST /turf/manager/organizations/:orgId/offline-booking
  //  Body: { availabilityUnitId, customerName, customerPhone, quantity? }
  //  Response: { success: true, data: confirmedBooking }
  //
  //  IMPORTANT: availabilityUnitId must come from the availability
  //  engine — never invent it from names, indices, or mock data.
  // ════════════════════════════════════════════════════════════════

  function createOfflineBooking(orgId, body) {
    return API.post('/turf/manager/organizations/' + orgId + '/offline-booking', body, { authScope: 'organizer' });
  }

  // ════════════════════════════════════════════════════════════════
  //  Turf Organizer Venues
  //
  //  GET /turf/organizer/venues
  //  GET /turf/organizer/venues/:venueId/resources
  // ════════════════════════════════════════════════════════════════

  function getMyVenues() {
    return API.get('/turf/organizer/venues', { authScope: 'organizer' });
  }

  function getVenue(id) {
    return API.get('/turf/organizer/venues/' + id, { authScope: 'organizer' });
  }

  function getResources(venueId) {
    return API.get('/turf/organizer/venues/' + venueId + '/resources', { authScope: 'organizer' });
  }

  // ════════════════════════════════════════════════════════════════
  //  Availability — backend is the source of truth for available slots
  //
  //  GET /turf/resources/:resourceId/availability?date=YYYY-MM-DD
  //
  //  Response: { success: true, data: { resourceId, date, slots: [...] } }
  //
  //  Slot fields:
  //    id, startsAt (ISO-8601), endsAt (ISO-8601),
  //    status: 'available' | 'booked' | 'blocked' | 'expired',
  //    price, currency, label (display string), resourceName, venueName
  // ════════════════════════════════════════════════════════════════

  function getAvailability(resourceId, date) {
    var q = {};
    if (date) q.date = date;
    return API.get('/turf/resources/' + resourceId + '/availability', { query: q });
  }

  // ════════════════════════════════════════════════════════════════
  //  Public API
  // ════════════════════════════════════════════════════════════════

  return {
    getMyOrganization: getMyOrganization,

    // Manager endpoints
    getAttendance: getAttendance,
    getDailyReport: getDailyReport,
    getEntryLogs: getEntryLogs,
    validateQR: validateQR,
    cancelBooking: cancelBooking,
    createOfflineBooking: createOfflineBooking,

    // Venue / resource discovery
    getMyVenues: getMyVenues,
    getVenue: getVenue,
    getResources: getResources,
    getAvailability: getAvailability,
  };
})();
