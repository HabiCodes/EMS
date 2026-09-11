/**
 * EntryMySlot - Turf API Endpoints
 * Matches backend routes under /api/v1/turf.
 */

(function (global) {
    'use strict';

    var BASE = '/turf/grounds';

    function list(params) {
        params = params || {};
        var qs = Object.keys(params).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        return global.EMSApi.get(BASE + (qs ? '?' + qs : ''), { authScope: 'customer' });
    }

    function get(id) {
        return global.EMSApi.get(BASE + '/' + id, { authScope: 'customer' });
    }

    function getAvailability(resourceId, date) {
        return global.EMSApi.get('/turf/resources/' + resourceId + '/availability?date=' + date, { authScope: 'customer' });
    }

    function createBooking(turfId, payload) {
        // Backend contract: { availability_unit_id, contactName, contactPhone, notes }
        // availability_unit_id identifies the specific date+slot+ground combination
        var unitId = payload.availability_unit_id || payload.unitId || null;
        if (!unitId) {
            // Fallback: if caller passes turfId + date + slot, construct a reference
            // (The caller should ideally pass availability_unit_id from the slot picker)
            return Promise.resolve({ ok: false, status: 400, message: 'availability_unit_id is required.', data: { error: 'MISSING_UNIT_ID' } });
        }
        return global.EMSApi.post('/turf/bookings', {
            availability_unit_id: unitId,
            contactName: payload.contactName || '',
            contactPhone: payload.contactPhone || '',
            notes: payload.notes || '',
        }, { authScope: 'customer' });
    }

    function getFeatured() {
        return global.EMSApi.get('/turf/grounds', { authScope: 'customer' });
    }

    function getMyBookings(params) {
        params = params || {};
        var qs = Object.keys(params).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        return global.EMSApi.get('/turf/my/bookings' + (qs ? '?' + qs : ''), { authScope: 'customer' });
    }

    function getMyBooking(id) {
        return global.EMSApi.get('/turf/my/bookings/' + id, { authScope: 'customer' });
    }

    function cancelBooking(id) {
        return global.EMSApi.post('/turf/my/bookings/' + id + '/cancel', {}, { authScope: 'customer' });
    }

    global.EMSTurfApi = Object.freeze({
        list: list,
        get: get,
        getAvailability: getAvailability,
        createBooking: createBooking,
        getFeatured: getFeatured,
        getMyBookings: getMyBookings,
        getMyBooking: getMyBooking,
        cancelBooking: cancelBooking,
    });

})(window);
