/**
 * turf.js — Turf / ground management service
 *
 * Endpoints (from backend):
 *   GET    /api/v1/turf/grounds                    - List grounds (filters: city, sport, search, page, limit)
 *   GET    /api/v1/turf/grounds/:id                - Get ground details
 *   GET    /api/v1/turf/sports                     - List sports
 *   GET    /api/v1/turf/cities                     - List cities
 *   GET    /api/v1/turf/grounds/:id/slots          - Available slots (date param)
 *   POST   /api/v1/turf/bookings                   - Create booking (auth required)
 *   GET    /api/v1/turf/bookings/my                - My turf bookings (auth)
 *   GET    /api/v1/turf/bookings/:id               - Booking details (auth)
 *   POST   /api/v1/turf/bookings/:id/cancel        - Cancel booking (auth)
 *
 * Role: Customer (read), Organizer (own grounds), Admin (all)
 */
window.EMS_TURF = (function () {
  'use strict';

  var API = window.EMS_API;
  var UI = window.EMS_UI;

  // ── Grounds ────────────────────────────────────────────────────

  /**
   * List turf grounds with optional filters.
   * @param {Object} filters - { city, sport, search, page, limit, featured }
   * @returns {{ ok: boolean, data: object }}
   */
  async function listGrounds(filters) {
    filters = filters || {};
    // If caller did not specify a district/city, attach the current selected location.
    if (!filters.district && !filters.city) {
      try {
        var loc = window.EMS_LOCATION;
        if (loc && loc.getSelectedCityId) {
          var cityId = await loc.getSelectedCityId();
          if (cityId) filters.city = cityId;
        }
      } catch (e) {}
    }
    return API.get('/turf/grounds', { query: filters });
  }

  /**
   * Get single ground details.
   * @param {string} id - Ground UUID
   */
  function getGround(id) {
    return API.get('/turf/grounds/' + id);
  }

  /**
   * List available sports.
   */
  function listSports() {
    return API.get('/turf/sports');
  }

  /**
   * List cities with turf grounds.
   */
  function listCities() {
    return API.get('/turf/cities');
  }

  // ── Slots ──────────────────────────────────────────────────────

  /**
   * Get available slots for a resource on a given date.
   * Backend: GET /api/v1/turf/resources/:resourceId/availability?date=YYYY-MM-DD
   * @param {string} resourceId - Resource ID (not ground ID)
   * @param {string} dateStr - YYYY-MM-DD
   */
  function getSlots(resourceId, dateStr) {
    return API.get('/turf/resources/' + resourceId + '/availability', {
      query: { date: dateStr },
    });
  }

  /**
   * Slot time slots are 15-minute intervals.
   * Generates a human-friendly time label from a slot object or time string.
   */
  function formatSlotTime(slotOrTime) {
    var time = typeof slotOrTime === 'string' ? slotOrTime : (slotOrTime && (slotOrTime.startTime || slotOrTime.time));
    return EMS_UI.formatTime(time);
  }

  // ── Bookings ───────────────────────────────────────────────────

  /**
   * Create a turf booking.
   * @param {Object} data - { groundId, date, slotIds: [uuid], teamName, contactName, contactPhone }
   * @returns {{ ok: boolean, data: object }} Booking object with bookingId, status, totalAmount
   */
  function createBooking(data) {
    return API.post('/turf/bookings', data);
  }

  /**
   * Get my turf bookings.
   * Backend: GET /api/v1/turf/my/bookings (auth required)
   * @param {Object} params - { page, limit, status }
   */
  function myBookings(params) {
    params = params || {};
    return API.get('/turf/my/bookings', { query: params });
  }

  /**
   * Get single booking details.
   * Backend: GET /api/v1/turf/my/bookings/:id (auth required)
   * @param {string} bookingId
   */
  function getBooking(bookingId) {
    return API.get('/turf/my/bookings/' + bookingId);
  }

  /**
   * Cancel a turf booking.
   * Backend: POST /api/v1/turf/my/bookings/:id/cancel (auth required)
   * @param {string} bookingId
   * @param {string} reason
   */
  function cancelBooking(bookingId, reason) {
    return API.post('/turf/my/bookings/' + bookingId + '/cancel', {
      reason: reason || 'Cancelled by user',
    });
  }

  // ── Organizer: Ground Management ───────────────────────────────
  // These require organizer JWT in the Authorization header.
  // The api.js base token is the user token — for organizer endpoints,
  // pages using owner-dash.html should set EMS_API.setToken with organizer JWT
  // before making calls, OR we use a separate token.

  /**
   * Get organizer's own grounds.
   */
  function listMyGrounds() {
    return API.get('/turf/grounds/my');
  }

  /**
   * Create a new ground (organizer).
   * @param {Object} data - Ground details
   */
  function createGround(data) {
    return API.post('/turf/grounds', data);
  }

  /**
   * Update ground (organizer owns it).
   * @param {string} id
   * @param {Object} data
   */
  function updateGround(id, data) {
    return API.put('/turf/grounds/' + id, data);
  }

  /**
   * Toggle ground availability.
   * @param {string} id
   * @param {boolean} available
   */
  function toggleGround(id, available) {
    return API.patch('/turf/grounds/' + id + '/availability', {
      available: available,
    });
  }

  // ── Admin: Ground Management ───────────────────────────────────

  /**
   * Admin: list all grounds with filters.
   * @param {Object} filters
   */
  function adminListGrounds(filters) {
    filters = filters || {};
    return API.get('/turf/grounds', { query: filters });
  }

  /**
   * Admin: get all bookings (pending review, etc.)
   */
  function adminListBookings(filters) {
    filters = filters || {};
    return API.get('/turf/bookings', { query: filters });
  }

  return {
    // Grounds (public)
    listGrounds: listGrounds,
    getGround: getGround,
    listSports: listSports,
    listCities: listCities,

    // Slots
    getSlots: getSlots,
    formatSlotTime: formatSlotTime,

    // Bookings (customer)
    createBooking: createBooking,
    myBookings: myBookings,
    getBooking: getBooking,
    cancelBooking: cancelBooking,

    // Organizer
    listMyGrounds: listMyGrounds,
    createGround: createGround,
    updateGround: updateGround,
    toggleGround: toggleGround,

    // Admin
    adminListGrounds: adminListGrounds,
    adminListBookings: adminListBookings,
  };
})();
