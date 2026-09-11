/**
 * EntryMySlot - Booking API Endpoints
 * Matches backend routes under /api/v1/bookings.
 */

(function (global) {
    'use strict';

    function list(params) {
        params = params || {};
        var qs = Object.keys(params).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        return global.EMSApi.get('/bookings' + (qs ? '?' + qs : ''), { authScope: 'customer' });
    }

    function getMy(params) {
        params = params || {};
        var qs = Object.keys(params).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        return global.EMSApi.get('/bookings/my' + (qs ? '?' + qs : ''), { authScope: 'customer' });
    }

    function get(reference) {
        return global.EMSApi.get('/bookings/' + reference, { authScope: 'customer' });
    }

    function cancel(reference) {
        return global.EMSApi.post('/bookings/' + reference + '/cancel', {}, { authScope: 'customer' });
    }

    function verifyPayment(bookingId) {
        return global.EMSApi.post('/bookings/' + bookingId + '/verify', {}, { authScope: 'customer' });
    }

    function createPaymentOrder(payload) {
        return global.EMSApi.post('/bookings/create-payment-order', payload, { authScope: 'customer' });
    }

    global.EMSBookingApi = Object.freeze({
        list: list,
        getMy: getMy,
        get: get,
        cancel: cancel,
        verifyPayment: verifyPayment,
        createPaymentOrder: createPaymentOrder,
    });

})(window);
