/**
 * events.js — Event management service
 *
 * Public endpoints:
 *   GET    /api/v1/events                  - List events (filters: city, category, status, search, page, limit)
 *   GET    /api/v1/events/featured         - Featured events
 *   GET    /api/v1/events/categories       - List categories
 *   GET    /api/v1/events/cities           - List cities with events
 *   GET    /api/v1/events/:id              - Event details
 *   GET    /api/v1/events/:id/stats        - Event stats
 *   POST   /api/v1/events/bookings         - Create event booking (FREE — no payment)
 *
 * Admin endpoints (requires admin JWT):
 *   GET    /api/v1/admin/events            - Admin list
 *   POST   /api/v1/admin/events            - Create event
 *   PUT    /api/v1/admin/events/:id        - Update event
 *   DELETE /api/v1/admin/events/:id        - Delete/archive event
 *   POST   /api/v1/admin/events/:id/restore - Restore event
 *   POST   /api/v1/admin/events/:id/publish - Publish event
 *   POST   /api/v1/admin/events/:id/hide   - Hide event
 *   POST   /api/v1/admin/events/:id/cancel - Cancel event
 *   POST   /api/v1/admin/events/:id/featured - Set featured
 *
 * Event ticket booking (customer, auth required):
 *   POST   /api/v1/events/bookings         - Create free event booking → returns tickets with UUIDs + QR
 *   GET    /api/v1/bookings/my             - My bookings (all types, via unified endpoint)
 *   GET    /api/v1/bookings/:id             - Booking details
 *   GET    /api/v1/bookings/:id/pdf         - Download booking PDF
 *   POST   /api/v1/bookings/:id/cancel      - Cancel booking
 */
window.EMS_EVENTS = (function () {
  'use strict';

  var API = window.EMS_API;
  var UI = window.EMS_UI;
  var CFG = window.EMS_API_CONFIG;

  // ── Public ─────────────────────────────────────────────────────

  /**
   * List events with filters.
   * @param {Object} filters - { city, category, status, search, page, limit, featured }
   */
  async function listEvents(filters) {
    filters = filters || {};
    if (!filters.city) {
      try {
        var loc = window.EMS_LOCATION;
        if (loc && loc.getSelectedCityId) {
          var cityId = await loc.getSelectedCityId();
          if (cityId) filters.city = cityId;
        }
      } catch (e) {}
    }
    return API.get('/events', { query: filters });
  }

  /**
   * Get featured events.
   * @param {number} limit
   */
  function getFeatured(limit) {
    return API.get('/events/featured', { query: limit ? { limit: limit } : {} });
  }

  /**
   * Get all event categories.
   */
  function getCategories() {
    return API.get('/events/categories');
  }

  /**
   * Get all cities with events.
   */
  function getCities() {
    return API.get('/events/cities');
  }

  /**
   * Get single event details.
   * @param {string} eventId - UUID or slug
   */
  function getEvent(eventId) {
    return API.get('/events/' + eventId);
  }

  /**
   * Get event statistics.
   * @param {string} eventId
   */
  function getStats(eventId) {
    return API.get('/events/' + eventId + '/stats');
  }

  // ── Customer: Event Bookings ───────────────────────────────────
  //
  // Events are FREE. No payment flow.
  // POST /api/v1/events/bookings creates the booking and returns tickets
  // with UUIDs, QR signatures, and booking confirmation.

  /**
   * Create a free event booking.
   * Backend: POST /api/v1/bookings { event_id: number, attendees: [{ full_name, phone, age?, gender? }] }
   * @param {Object} data - { eventId, attendees: [{ full_name, phone, age?, gender? }] }
   * @returns {{ ok: boolean, data: object }} booking with bookingId, status, totalAmount, tickets[]
   */
  function createBooking(data) {
    // Transform frontend format to backend format
    var eventId = data.eventId || data.event_id;
    var attendees = [];
    if (data.attendees && Array.isArray(data.attendees)) {
      attendees = data.attendees.map(function (a) {
        return {
          full_name: a.full_name || a.name || '',
          phone: a.phone || '',
          age: a.age,
          gender: a.gender,
        };
      });
    } else if (data.attendeeDetails && Array.isArray(data.attendeeDetails)) {
      attendees = data.attendeeDetails.map(function (a) {
        return {
          full_name: a.name || '',
          phone: a.phone || '',
        };
      });
    }
    return API.post('/bookings', {
      event_id: eventId,
      attendees: attendees,
    });
  }

  /**
   * Get my event bookings (via unified bookings endpoint).
   * @param {Object} params - { page, limit, status }
   */
  function myBookings(params) {
    params = params || {};
    return API.get('/bookings/my', { query: params });
  }

  /**
   * Get single booking details.
   * @param {string} bookingId
   */
  function getBooking(bookingId) {
    return API.get('/bookings/' + bookingId);
  }

  /**
   * Cancel an event booking.
   * @param {string} bookingId
   * @param {string} reason
   */
  function cancelBooking(bookingId, reason) {
    return API.post('/bookings/' + bookingId + '/cancel', {
      reason: reason || 'Cancelled by user',
    });
  }

  // ── Admin: Event Management ────────────────────────────────────
  // These require admin JWT. The calling page (super-admin.html) must set
  // EMS_API.setToken(adminJwt) before calling these.

  function adminList(filters) {
    filters = filters || {};
    return API.get('/admin/events', { query: filters });
  }

  function adminCreate(data) {
    return API.post('/admin/events', data);
  }

  function adminUpdate(id, data) {
    return API.put('/admin/events/' + id, data);
  }

  function adminDelete(id) {
    return API.del('/admin/events/' + id);
  }

  function adminRestore(id) {
    return API.post('/admin/events/' + id + '/restore');
  }

  function adminPublish(id) {
    return API.post('/admin/events/' + id + '/publish');
  }

  function adminHide(id) {
    return API.post('/admin/events/' + id + '/hide');
  }

  function adminCancel(id) {
    return API.post('/admin/events/' + id + '/cancel');
  }

  function adminSetFeatured(id, featured) {
    return API.post('/admin/events/' + id + '/featured', { featured: !!featured });
  }

  function adminPendingReview() {
    return API.get('/admin/events/pending-review');
  }

  return {
    // Public
    listEvents: listEvents,
    getFeatured: getFeatured,
    getCategories: getCategories,
    getCities: getCities,
    getEvent: getEvent,
    getStats: getStats,

    // Customer bookings
    createBooking: createBooking,
    myBookings: myBookings,
    getBooking: getBooking,
    cancelBooking: cancelBooking,

    // Admin
    adminList: adminList,
    adminCreate: adminCreate,
    adminUpdate: adminUpdate,
    adminDelete: adminDelete,
    adminRestore: adminRestore,
    adminPublish: adminPublish,
    adminHide: adminHide,
    adminCancel: adminCancel,
    adminSetFeatured: adminSetFeatured,
    adminPendingReview: adminPendingReview,
  };
})();
