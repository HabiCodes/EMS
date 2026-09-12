/**
 * EntryMySlot - Turf API Endpoints
 * Matches backend routes under /api/v1/turf.
 */

(function (global) {
    'use strict';

    var BASE = '/turf';

    function list(params) {
        params = params || {};
        var qs = Object.keys(params).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        return global.EMSApi.get(BASE + '/grounds' + (qs ? '?' + qs : ''), { authScope: 'customer' });
    }

    function get(id) {
        return global.EMSApi.get(BASE + '/grounds/' + id, { authScope: 'customer' });
    }

    function getAvailability(resourceId, date) {
        // Backend route: GET /turf/resources/:resourceId/availability?date=YYYY-MM-DD
        return global.EMSApi.get(BASE + '/resources/' + resourceId + '/availability?date=' + encodeURIComponent(date), { authScope: 'customer' });
    }

    function createBooking(payload) {
        // Backend contract: { availability_unit_id, quantity?, booking_type?, coupon_code?, amount?, duration_hours?, contact_name?, contact_phone?, notes? }
        var body = {
            availability_unit_id: payload.availability_unit_id || payload.unitId || null,
            quantity: payload.quantity || 1,
            booking_type: payload.booking_type || 'online',
            coupon_code: payload.coupon_code || null,
            amount: payload.amount || 0,
            duration_hours: payload.duration_hours || 1,
            contact_name: payload.contact_name || payload.contactName || null,
            contact_phone: payload.contact_phone || payload.contactPhone || null,
            notes: payload.notes || null,
        };
        return global.EMSApi.post(BASE + '/bookings', body, { authScope: 'customer' });
    }

    function getMyBookings(params) {
        params = params || {};
        var qs = Object.keys(params).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        return global.EMSApi.get(BASE + '/my/bookings' + (qs ? '?' + qs : ''), { authScope: 'customer' });
    }

    function getMyBooking(id) {
        return global.EMSApi.get(BASE + '/my/bookings/' + id, { authScope: 'customer' });
    }

    function cancelBooking(id) {
        return global.EMSApi.post(BASE + '/my/bookings/' + id + '/cancel', { reason: 'Cancelled by user' }, { authScope: 'customer' });
    }

    function getFeatured() {
        return global.EMSApi.get(BASE + '/grounds', { authScope: 'customer' });
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
