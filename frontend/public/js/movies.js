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

  var API = typeof EMS_API !== 'undefined' ? EMS_API.movies : null;

  function unavailable() {
    return Promise.resolve({
      ok: false,
      status: 0,
      data: { success: false, message: 'Movie API is unavailable.' },
    });
  }

  function findFromList(request, predicate) {
    return request.then(function (response) {
      var items = response && response.data && Array.isArray(response.data)
        ? response.data
        : [];
      var item = items.find(predicate);
      if (item) {
        return { ok: true, status: 200, data: item };
      }
      return {
        ok: false,
        status: 404,
        data: { success: false, message: 'Requested movie resource was not found.' },
      };
    });
  }

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
    return API ? API.listMovies(filters) : unavailable();
  }

  function getFeatured(limit) {
    return API ? API.getFeaturedMovies(limit) : unavailable();
  }

  function getGenres() {
    return API ? API.getMovieGenres() : unavailable();
  }

  function getLanguages() {
    return API ? API.getMovieLanguages() : unavailable();
  }

  function getMovie(idOrSlug) {
    if (!API) return unavailable();
    var wanted = String(idOrSlug || '');
    return findFromList(API.listMovies({ pageSize: 100 }), function (movie) {
      return String(movie.id || '') === wanted || String(movie.slug || '') === wanted;
    });
  }

  // ── Cinemas ────────────────────────────────────────────────────

  function listCinemas(filters) {
    filters = filters || {};
    return API ? API.listCinemas(filters) : unavailable();
  }

  function getByCity(city) {
    return listCinemas(city ? { city: city } : {});
  }

  function getCinema(idOrSlug) {
    if (!API) return unavailable();
    var wanted = String(idOrSlug || '');
    return findFromList(API.listCinemas({ pageSize: 100 }), function (cinema) {
      return String(cinema.id || '') === wanted || String(cinema.slug || '') === wanted;
    });
  }

  function getScreens(cinemaId) {
    return API ? API.getScreens(cinemaId) : unavailable();
  }

  // ── Showtimes ──────────────────────────────────────────────────

  function listShowtimes(filters) {
    filters = filters || {};
    return API ? API.listShowtimes(filters) : unavailable();
  }

  function getCities() {
    return API ? API.getCitiesWithMovies() : unavailable();
  }

  function getShowtime(idOrSlug) {
    if (!API) return unavailable();
    var wanted = String(idOrSlug || '');
    return findFromList(API.listShowtimes({ pageSize: 100 }), function (showtime) {
      return String(showtime.id || '') === wanted || String(showtime.slug || '') === wanted;
    });
  }

  /**
   * Get seat layout for a showtime.
   * Returns seat grid with availability status.
   * @param {number|string} showtimeId
   */
  function getSeatLayout(showtimeId) {
    return API ? API.getSeatLayout(showtimeId) : unavailable();
  }

  /**
   * Preview prices for selected seats.
   * @param {number} showtimeId
   * @param {string[]} seatIds
   */
  function calculatePrices(showtimeId, seatIds) {
    return API ? API.calculatePrices(showtimeId, seatIds) : unavailable();
  }

  // ── Seat Hold ──────────────────────────────────────────────────

  /**
   * Hold seats temporarily (5 min TTL).
   * @param {number} showtimeId
   * @param {string[]} seatIds
   * @param {number} durationMs
   */
  function holdSeats(showtimeId, seatIds, durationMs) {
    return API ? API.holdSeats({
      showtimeId: Number(showtimeId),
      seatIds: (seatIds || []).map(function(s) { return Number(s); }).filter(function(n) { return Number.isFinite(n); }),
    }) : unavailable();
  }

  function releaseSeats(holdKey) {
    return API ? API.releaseSeats(holdKey) : unavailable();
  }

  function checkHold(holdKey) {
    return API ? API.checkHold(holdKey) : unavailable();
  }

  // ── Movie Bookings ─────────────────────────────────────────────

  function createBooking(data) {
    return API ? API.createMovieBooking(data) : unavailable();
  }

  function confirmBooking(bookingReference) {
    return API ? API.confirmMovieBooking({ bookingReference: String(bookingReference || '') }) : unavailable();
  }

  function myBookings(params) {
    params = params || {};
    return API ? API.getMyMovieBookings(params) : unavailable();
  }

  function getBooking(referenceOrId) {
    return API ? API.getMovieBooking(referenceOrId) : unavailable();
  }

  function cancelBooking(referenceOrId, reason) {
    return API ? API.cancelMovieBooking(referenceOrId, reason) : unavailable();
  }

  function verifyTicket(ticketUuid) {
    return unavailable();
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
