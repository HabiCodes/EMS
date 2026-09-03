/**
 * EMS API — shared fetch wrapper for customer-facing frontend pages.
 *
 * Base URL: /api/v1
 * All authenticated calls use Bearer <accessToken> from localStorage.
 *
 * On 401: attempts refresh via stored refreshToken.
 * On 403/404/410: returns null (caller decides UI).
 *
 * Usage:
 *   const r = await EMS_API.get('/events');
 *   if (r) { /* use r.data }
 */

const EMS_API = (() => {
  const API_BASE = '/api/v1';

  function headers() {
    const h = { 'Content-Type': 'application/json' };
    try {
      const t = localStorage.getItem('ems_access_token');
      if (t) h['Authorization'] = 'Bearer ' + t;
    } catch { /* noop */ }
    return h;
  }

  async function refreshAndRetry(path, opts = {}) {
    const rt = localStorage.getItem('ems_refresh_token');
    if (!rt) return { ok: false, status: 401, data: null };
    try {
      const res = await fetch(API_BASE + '/auth/refresh-token', {
        method: 'POST',
        headers: { ...headers(), ...(opts.headers || {}) },
        body: JSON.stringify({ refreshToken: rt }),
      });
      const ct = res.headers.get('content-type') || 'application/json';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (res.ok && data && data.success && data.data) {
        localStorage.setItem('ems_access_token', data.data.accessToken);
        localStorage.setItem('ems_refresh_token', data.data.refreshToken);
        return request(path, opts);
      }
      return { ok: false, status: 401, data: null };
    } catch {
      return { ok: false, status: 401, data: null };
    }
  }

  async function request(path, opts = {}) {
    const url = API_BASE + path;
    const res = await fetch(url, {
      ...opts,
      headers: { ...headers(), ...(opts.headers || {}) },
    });
    if (res.status === 401 && !opts._noRefresh) return refreshAndRetry(path, opts);
    const ct = res.headers.get('content-type') || 'application/json';
    let data;
    if (ct.includes('application/json')) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }
    return { ok: res.ok, status: res.status, data };
  }

  // ── Generic ────────────────────────────────────────────────────────────────
  function GET(path)    { return request(path); }
  function POST(path, body)  { return request(path, { method: 'POST', body: JSON.stringify(body) }); }
  function PUT(path, body)   { return request(path, { method: 'PUT', body: JSON.stringify(body) }); }
  function PATCH(path, body) { return request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
  function DELETE(path)      { return request(path, { method: 'DELETE' }); }

  // ── Auth ───────────────────────────────────────────────────────────────────
  const auth = {
    register: (email, password) =>
      POST('/auth/register', { email, password }),
    registerEnhanced: (email, username, password) =>
      POST('/auth/register-enhanced', { email, username, password }),
    verifyRegistrationOtp: (email, otp) =>
      POST('/auth/verify-registration-otp', { email, otp }),
    resendRegistrationOtp: (email) =>
      POST('/auth/resend-registration-otp', { email }),
    login: (email, password) =>
      POST('/auth/login', { email, password }),
    loginEnhanced: (email, password, deviceInfo) =>
      POST('/auth/login-enhanced', { email, password, deviceInfo }),
    refreshToken: (refreshToken) =>
      POST('/auth/refresh-token', { refreshToken }),
    logout: (refreshToken) =>
      POST('/auth/logout', { refreshToken: refreshToken || '' }),
    getMe: () => GET('/auth/me'),
    updateProfile: (username) => PATCH('/auth/me', { username }),
    forgotPassword: (email) => POST('/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => POST('/auth/reset-password', { token, newPassword }),
  };

  // ── Turf ───────────────────────────────────────────────────────────────────
  // Public turf listing
  function listTurfs(query = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
    const q = qs.toString();
    return GET('/turf/grounds' + (q ? '?' + q : ''));
  }
  function getTurf(venueId) { return GET('/turf/grounds/' + venueId); }
  function getTurfReviews(venueId) { return GET('/turf/grounds/' + venueId + '/reviews'); }

  // Resource availability (public, no auth) — the single source of truth
  function getResourceAvailability(resourceId, date) {
    return GET('/turf/resources/' + resourceId + '/availability?date=' + encodeURIComponent(date));
  }

  // Turf bookings (authenticated)
  function createTurfBooking(body) { return POST('/turf/bookings', body); }
  function getTurfBookings(query = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null) qs.set(k, String(v)); });
    const q = qs.toString();
    return GET('/turf/my/bookings' + (q ? '?' + q : ''));
  }
  function getTurfBooking(bookingId) { return GET('/turf/my/bookings/' + bookingId); }
  function cancelTurfBooking(bookingId, reason) {
    return POST('/turf/my/bookings/' + bookingId + '/cancel', { reason: reason || 'Cancelled by user' });
  }

  // Turf payment
  function createTurfPaymentOrder(bookingId) {
    return POST('/turf/payments/create-order', { bookingId });
  }
  function verifyTurfPayment(bookingId, gatewayOrderId, gatewayPaymentId) {
    return POST('/turf/payments/verify', { bookingId, gatewayOrderId, gatewayPaymentId });
  }

  // Payments (shared)
  function initializePayment(body) { return POST('/payments/initialize', body); }
  function verifyPayment(body) { return POST('/payments/verify', body); }
  function requestRefund(body) { return POST('/payments/refund', body); }

  // ── Events ────────────────────────────────────────────────────────────────
  function listEvents(query = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
    const q = qs.toString();
    return GET('/events' + (q ? '?' + q : ''));
  }
  function getFeaturedEvents(limit) {
    return GET('/events/featured' + (limit ? '?limit=' + limit : ''));
  }
  function getEventCategories() { return GET('/events/categories'); }
  function getEventCities() { return GET('/events/cities'); }
  function getEvent(eventId) { return GET('/events/' + eventId); }
  function getEventStats(eventId) { return GET('/events/' + eventId + '/stats'); }
  function getEventZones(eventId) { return GET('/events/' + eventId + '/zones'); }
  function getEventZone(eventId, zoneId) { return GET('/events/' + eventId + '/zones/' + zoneId); }

  // Event bookings (authenticated)
  function createEventBooking(body) { return POST('/bookings', body); }
  function getEventBookings() { return GET('/bookings/my'); }
  function getEventBooking(bookingId) { return GET('/bookings/' + bookingId); }
  function cancelEventBooking(bookingId, reason) {
    return POST('/bookings/' + bookingId + '/cancel', { reason: reason || 'Cancelled by user' });
  }
  function verifyEventPayment(bookingId) {
    return POST('/bookings/' + bookingId + '/verify');
  }
  function getEventBookingPdf(bookingId) { return GET('/bookings/' + bookingId + '/pdf'); }

  // ── Movies ────────────────────────────────────────────────────────────────
  function listMovies(query = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
    const q = qs.toString();
    return GET('/movies' + (q ? '?' + q : ''));
  }
  function getFeaturedMovies(limit) {
    return GET('/movies/featured' + (limit ? '?limit=' + limit : ''));
  }
  function getMovieGenres() { return GET('/movies/genres'); }
  function getMovieLanguages() { return GET('/movies/languages'); }
  function getMovie(slugOrId) { return GET('/movies/' + slugOrId); }
  function searchMovies(q, page, pageSize) {
    const qs = new URLSearchParams({ q, page: String(page || 1), pageSize: String(pageSize || 20) });
    return GET('/movies/search?' + qs.toString());
  }
  function listCinemas(query = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
    const q = qs.toString();
    return GET('/cinemas' + (q ? '?' + q : ''));
  }
  function getCinemasByCity(city) { return GET('/cinemas/city/' + encodeURIComponent(city)); }
  function getCinema(idOrSlug) { return GET('/cinemas/' + idOrSlug); }
  function getScreens(cinemaId) { return GET('/cinemas/' + cinemaId + '/screens'); }

  function listShowtimes(query = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
    const q = qs.toString();
    return GET('/showtimes' + (q ? '?' + q : ''));
  }
  function getCitiesWithMovies() { return GET('/showtimes/cities'); }
  function getShowtime(showtimeId) { return GET('/showtimes/' + showtimeId); }
  function getSeatLayout(showtimeId) { return GET('/showtimes/' + showtimeId + '/seats'); }
  function calculatePrices(showtimeId, seatIds) {
    return POST('/showtimes/' + showtimeId + '/calculate-prices', { seatIds });
  }

  // Movie bookings (authenticated)
  function createMovieBooking(body) { return POST('/movies/bookings', body); }
  function confirmMovieBooking(body) { return POST('/movies/bookings/confirm', body); }
  function getMovieBooking(reference) { return GET('/movies/bookings/' + reference); }
  function cancelMovieBooking(reference, reason) {
    return POST('/movies/bookings/' + reference + '/cancel', { reason: reason || 'Cancelled by user' });
  }
  function getMyMovieBookings(query = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
    const q = qs.toString();
    return GET('/movies/bookings/my' + (q ? '?' + q : ''));
  }
  function holdSeats(body) { return POST('/movies/hold-seats', body); }
  function releaseSeats(holdKey) { return POST('/movies/hold-seats/' + holdKey + '/release', {}); }
  function checkHold(holdKey) { return GET('/movies/hold-seats/' + holdKey + '/status'); }

  return {
    GET, POST, PUT, PATCH, DELETE, request,
    auth,
    turf: { listTurfs, getTurf, getTurfReviews, getResourceAvailability, createTurfBooking, getTurfBookings, getTurfBooking, cancelTurfBooking, createTurfPaymentOrder, verifyTurfPayment },
    events: { listEvents, getFeaturedEvents, getEventCategories, getEventCities, getEvent, getEventStats, getEventZones, getEventZone, createEventBooking, getEventBookings, getEventBooking, cancelEventBooking, verifyEventPayment, getEventBookingPdf },
    movies: { listMovies, getFeaturedMovies, getMovieGenres, getMovieLanguages, getMovie, searchMovies, listCinemas, getCinemasByCity, getCinema, getScreens, listShowtimes, getCitiesWithMovies, getShowtime, getSeatLayout, calculatePrices, createMovieBooking, confirmMovieBooking, getMovieBooking, cancelMovieBooking, getMyMovieBookings, holdSeats, releaseSeats, checkHold },
  };
})();
