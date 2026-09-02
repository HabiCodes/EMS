/**
 * movies.js — Movie management service
 *
 * Public endpoints:
 *   GET    /api/v1/movies                    - List movies (filters)
 *   GET    /api/v1/movies/featured           - Featured movies
 *   GET    /api/v1/movies/genres             - List genres
 *   GET    /api/v1/movies/languages          - List languages
 *   GET    /api/v1/movies/:slugOrId          - Movie details
 *   GET    /api/v1/cinemas                   - List cinemas
 *   GET    /api/v1/cinemas/city/:city        - Cinemas by city
 *   GET    /api/v1/cinemas/:idOrSlug         - Cinema details
 *   GET    /api/v1/cinemas/:cinemaId/screens - Cinema screens
 *   GET    /api/v1/showtimes                 - List showtimes
 *   GET    /api/v1/showtimes/cities          - Cities with showtimes
 *   GET    /api/v1/showtimes/:idOrSlug       - Showtime details
 *   GET    /api/v1/showtimes/:showtimeId/seats - Seat layout
 *   POST   /api/v1/showtimes/:showtimeId/calculate-prices - Price preview
 *
 * Authenticated (auth required):
 *   POST   /api/v1/hold-seats                - Hold seats (Redis TTL)
 *   POST   /api/v1/hold-seats/:holdKey/release - Release hold
 *   GET    /api/v1/hold-seats/:holdKey/status - Check hold status
 *   POST   /api/v1/bookings                  - Create movie booking
 *   POST   /api/v1/bookings/confirm           - Confirm booking
 *   GET    /api/v1/bookings/my                - My movie bookings
 *   GET    /api/v1/bookings/:referenceOrId    - Booking details
 *   POST   /api/v1/bookings/:id/cancel        - Cancel booking
 *   GET    /api/v1/tickets/:ticketUuid/verify - Verify ticket
 */
window.EMS_MOVIES = (function () {
  'use strict';

  var API = window.EMS_API;
  var UI = window.EMS_UI;
  var CFG = window.EMS_API_CONFIG;

  // ── Movies ─────────────────────────────────────────────────────

  async function listMovies(filters) {
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
    return API.get('/movies', { query: filters });
  }

  function getFeatured(limit) {
    return API.get('/movies/featured', { query: limit ? { limit: limit } : {} });
  }

  function getGenres() {
    return API.get('/movies/genres');
  }

  function getLanguages() {
    return API.get('/movies/languages');
  }

  function getMovie(idOrSlug) {
    return API.get('/movies/' + idOrSlug);
  }

  // ── Cinemas ────────────────────────────────────────────────────

  function listCinemas(filters) {
    filters = filters || {};
    return API.get('/cinemas', { query: filters });
  }

  function getByCity(city) {
    return API.get('/cinemas/city/' + encodeURIComponent(city));
  }

  function getCinema(idOrSlug) {
    return API.get('/cinemas/' + idOrSlug);
  }

  function getScreens(cinemaId) {
    return API.get('/cinemas/' + cinemaId + '/screens');
  }

  // ── Showtimes ──────────────────────────────────────────────────

  function listShowtimes(filters) {
    filters = filters || {};
    return API.get('/showtimes', { query: filters });
  }

  function getCities() {
    return API.get('/showtimes/cities');
  }

  function getShowtime(idOrSlug) {
    return API.get('/showtimes/' + idOrSlug);
  }

  /**
   * Get seat layout for a showtime.
   * Returns seat grid with availability status.
   * @param {number|string} showtimeId
   */
  function getSeatLayout(showtimeId) {
    return API.get('/showtimes/' + showtimeId + '/seats');
  }

  /**
   * Preview prices for selected seats.
   * @param {number} showtimeId
   * @param {string[]} seatIds
   */
  function calculatePrices(showtimeId, seatIds) {
    return API.post('/showtimes/' + showtimeId + '/calculate-prices', {
      seatIds: seatIds,
    });
  }

  // ── Seat Hold ──────────────────────────────────────────────────

  /**
   * Hold seats temporarily (5 min TTL).
   * @param {number} showtimeId
   * @param {string[]} seatIds
   * @param {number} durationMs
   */
  function holdSeats(showtimeId, seatIds, durationMs) {
    durationMs = durationMs || CFG.SEAT_HOLD_DURATION_MS;
    return API.post('/hold-seats', {
      showtimeId: showtimeId,
      seatIds: seatIds,
      durationMs: durationMs,
    });
  }

  function releaseSeats(holdKey) {
    return API.post('/hold-seats/' + holdKey + '/release');
  }

  function checkHold(holdKey) {
    return API.get('/hold-seats/' + holdKey + '/status');
  }

  // ── Movie Bookings ─────────────────────────────────────────────

  function createBooking(data) {
    return API.post('/bookings', data);
  }

  function confirmBooking(holdKey) {
    return API.post('/bookings/confirm', { holdKey: holdKey });
  }

  function myBookings(params) {
    params = params || {};
    return API.get('/bookings/my', { query: params });
  }

  function getBooking(referenceOrId) {
    return API.get('/bookings/' + referenceOrId);
  }

  function cancelBooking(referenceOrId, reason) {
    return API.post('/bookings/' + referenceOrId + '/cancel', {
      reason: reason || 'Cancelled by user',
    });
  }

  function verifyTicket(ticketUuid) {
    return API.post('/scan/movies/verify', { ticket_uuid: ticketUuid });
  }

  return {
    // Movies
    listMovies: listMovies,
    getFeatured: getFeatured,
    getGenres: getGenres,
    getLanguages: getLanguages,
    getMovie: getMovie,

    // Cinemas
    listCinemas: listCinemas,
    getByCity: getByCity,
    getCinema: getCinema,
    getScreens: getScreens,

    // Showtimes
    listShowtimes: listShowtimes,
    getCities: getCities,
    getShowtime: getShowtime,
    getSeatLayout: getSeatLayout,
    calculatePrices: calculatePrices,

    // Seat holds
    holdSeats: holdSeats,
    releaseSeats: releaseSeats,
    checkHold: checkHold,

    // Bookings
    createBooking: createBooking,
    confirmBooking: confirmBooking,
    myBookings: myBookings,
    getBooking: getBooking,
    cancelBooking: cancelBooking,
    verifyTicket: verifyTicket,
  };
})();
