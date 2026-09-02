/**
 * bookings.js — General booking service
 * Works for both event and turf bookings via the unified /api/v1/bookings endpoints.
 * Also handles payment order creation.
 *
 * Endpoints:
 *   POST   /api/v1/bookings                 - Create booking (event or turf)
 *   POST   /api/v1/bookings/confirm          - Confirm booking (movie)
 *   GET    /api/v1/bookings/my              - My bookings (all types)
 *   GET    /api/v1/bookings/:id             - Booking details
 *   POST   /api/v1/bookings/:id/cancel      - Cancel booking
 *   GET    /api/v1/bookings/:id/pdf         - Download booking PDF
 *   GET    /api/v1/tickets/:uuid/verify     - Verify ticket QR
 */
window.EMS_BOOKINGS = (function () {
  'use strict';

  var API = window.EMS_API;
  var UI = window.EMS_UI;
  var CFG = window.EMS_API_CONFIG;

  /**
   * Create a booking. Works for events (tickets) and turf (slots).
   * Backend determines type from the body content.
   * @param {Object} data - Booking payload
   * @param {string} data.eventId     - For event bookings
   * @param {string} data.groundId    - For turf bookings
   * @param {string} data.date        - Booking date (turf)
   * @param {string[]} data.slotIds   - Turf slot IDs
   * @param {Array} data.tickets      - [{ ticketTypeId, quantity }] for events
   * @param {Array} data.attendees    - [{ name, email, phone }]
   * @returns {{ ok: boolean, data: object }}
   */
  function create(data) {
    return API.post('/bookings', data);
  }

  /**
   * Confirm a held booking (movie seats hold → confirmed).
   * @param {string} holdKey
   */
  function confirm(holdKey) {
    return API.post('/bookings/confirm', { holdKey: holdKey });
  }

  /**
   * Get my bookings across all types.
   * @param {Object} params - { page, limit, status, type }
   */
  function myBookings(params) {
    params = params || {};
    return API.get('/bookings/my', { query: params });
  }

  /**
   * Get booking details.
   * @param {string} bookingId
   */
  function getById(bookingId) {
    return API.get('/bookings/' + bookingId);
  }

  /**
   * Cancel a booking.
   * @param {string} bookingId
   * @param {string} reason
   */
  function cancel(bookingId, reason) {
    return API.post('/bookings/' + bookingId + '/cancel', {
      reason: reason || 'Cancelled by user',
    });
  }

  /**
   * Download booking PDF.
   * @param {string} bookingId
   */
  function downloadPdf(bookingId) {
    return API.get('/bookings/' + bookingId + '/pdf', { responseType: 'blob' });
  }

  /**
   * Verify a ticket (POST /api/v1/scan/verify with body { ticket_uuid }).
   * Requires admin auth token.
   * @param {string} ticketUuid
   */
  function verifyTicket(ticketUuid) {
    return API.post('/scan/verify', { ticket_uuid: ticketUuid });
  }

  // ── Payment ────────────────────────────────────────────────────
  // The backend creates a booking (status: pending_payment) first,
  // then creates a payment order with Cashfree.
  // The frontend initiates the flow:

  /**
   * Step 1: Create a pending booking, then create payment order.
   * @param {Object} bookingData - The booking payload
   * @param {Function} onOrderCreated - callback(paymentSessionId, orderId)
   * @param {Function} onError - callback(message)
   */
  async function initiatePayment(bookingData, onOrderCreated, onError) {
    // Create the booking
    var result = await create(bookingData);
    if (!result.ok) {
      if (onError) onError(API.handleApiError(result) || 'Failed to create booking.');
      return null;
    }

    var booking = result.data.data;
    var bookingId = booking.bookingId;

    // Initiate payment
    var paymentResult = await API.post('/payments/initiate', {
      bookingId: bookingId,
      // amount is derived by backend from booking
    });

    if (!paymentResult.ok) {
      if (onError) onError(API.handleApiError(paymentResult) || 'Failed to initiate payment.');
      return null;
    }

    var paymentData = paymentResult.data.data;
    if (onOrderCreated) onOrderCreated(paymentData.paymentSessionId, paymentData.orderId, bookingId);
    return paymentData;
  }

  return {
    create: create,
    confirm: confirm,
    myBookings: myBookings,
    getById: getById,
    cancel: cancel,
    downloadPdf: downloadPdf,
    verifyTicket: verifyTicket,
    initiatePayment: initiatePayment,
  };
})();
