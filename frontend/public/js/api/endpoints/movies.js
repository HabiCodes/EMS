/**
 * EntryMySlot - Movie API Endpoints
 * Wraps EMSApi with movie-specific endpoints matching backend routes.
 */

(function (global) {
    'use strict';

    var BASE = '/movies';

    function list(params) {
        params = params || {};
        var qs = Object.keys(params).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        return global.EMSApi.get(BASE + (qs ? '?' + qs : ''), { authScope: 'customer' });
    }

    function get(id) {
        return global.EMSApi.get(BASE + '/' + id, { authScope: 'customer' });
    }

    function getShowtimes(movieId, params) {
        params = params || {};
        var qs = Object.keys(params).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        return global.EMSApi.get('/showtimes?movieId=' + movieId + (qs ? '&' + qs : ''), { authScope: 'customer' });
    }

    function getSeatLayout(showtimeId) {
        return global.EMSApi.get('/showtimes/' + showtimeId + '/seats', { authScope: 'customer' });
    }

    // ── Seat hold flow ───────────────────────────────────────────
    // Step 1: Hold selected seats (reserve them for ~5 minutes)
    // Backend: POST /hold-seats { showtimeId, seatIds: [number] }
    function holdSeats(showtimeId, seatNumbers) {
        var seatIds = (seatNumbers || []).map(function(s) { return parseInt(s, 10); }).filter(function(n) { return !isNaN(n); });
        return global.EMSApi.post('/hold-seats', {
            showtimeId: parseInt(showtimeId, 10),
            seatIds: seatIds,
        }, { authScope: 'customer' });
    }

    // Step 2: Check hold status
    // Backend: GET /hold-seats/:holdKey/status
    function getHoldStatus(holdKey) {
        return global.EMSApi.get('/hold-seats/' + encodeURIComponent(holdKey) + '/status', { authScope: 'customer' });
    }

    // Step 3: Release held seats
    // Backend: POST /hold-seats/:holdKey/release
    function releaseSeats(holdKey) {
        return global.EMSApi.post('/hold-seats/' + holdKey + '/release', { holdKey: holdKey }, { authScope: 'customer' });
    }

    // Step 4: Create booking with hold key
    function createBooking(payload) {
        return global.EMSApi.post(BASE + '/bookings', payload, { authScope: 'customer' });
    }

    function searchCinemas(movieId) {
        // Backend: GET /cinemas?movieId=... — list cinemas showing this movie
        return global.EMSApi.get('/cinemas?movieId=' + movieId, { authScope: 'customer' });
    }

    function getFeatured() {
        return global.EMSApi.get(BASE + '/featured', { authScope: 'customer' });
    }

    global.EMSMovieApi = Object.freeze({
        list: list,
        get: get,
        getShowtimes: getShowtimes,
        getSeatLayout: getSeatLayout,
        holdSeats: holdSeats,
        getHoldStatus: getHoldStatus,
        releaseSeats: releaseSeats,
        createBooking: createBooking,
        searchCinemas: searchCinemas,
        getFeatured: getFeatured,
    });

})(window);
