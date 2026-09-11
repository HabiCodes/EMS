/**
 * EntryMySlot - Event API Endpoints
 * Matches backend routes under /api/v1/events and /api/v1/bookings.
 */

(function (global) {
    'use strict';

    var BASE = '/events';

    function list(params) {
        params = params || {};
        var qs = Object.keys(params).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        return global.EMSApi.get(BASE + (qs ? '?' + qs : ''), { authScope: 'customer' });
    }

    function get(id) {
        return global.EMSApi.get(BASE + '/' + id, { authScope: 'customer' });
    }

    function createBooking(eventId, payload) {
        // Backend contract: { event_id, attendees: [{full_name, phone, age, gender}], zone_id }
        // payload from UI: { ticketsCount, contactName, contactPhone, notes }
        var ticketCount = parseInt(payload.ticketsCount || payload.tickets_count || 1);
        var contactName = payload.contactName || '';
        var contactPhone = payload.contactPhone || '';
        var primaryAttendee = { full_name: contactName, phone: contactPhone, age: 0, gender: '' };
        var attendees = [primaryAttendee];
        // If more than 1 ticket, duplicate primary attendee (age/gender unknown from single form)
        for (var i = 1; i < ticketCount; i++) {
            attendees.push({ full_name: contactName + ' (Guest ' + i + ')', phone: contactPhone, age: 0, gender: '' });
        }
        return global.EMSApi.post('/bookings', {
            event_id: parseInt(eventId),
            attendees: attendees,
            zone_id: payload.zone_id || null,
        }, { authScope: 'customer' });
    }

    function getFeatured() {
        return global.EMSApi.get(BASE + '/featured', { authScope: 'customer' });
    }

    function getCategories() {
        return global.EMSApi.get(BASE + '/categories', { authScope: 'customer' });
    }

    function getCities() {
        return global.EMSApi.get(BASE + '/cities', { authScope: 'customer' });
    }

    function getStats(eventId) {
        return global.EMSApi.get(BASE + '/' + eventId + '/stats', { authScope: 'customer' });
    }

    function getZones(eventId) {
        return global.EMSApi.get(BASE + '/' + eventId + '/zones', { authScope: 'customer' });
    }

    global.EMSEventApi = Object.freeze({
        list: list,
        get: get,
        createBooking: createBooking,
        getFeatured: getFeatured,
        getCategories: getCategories,
        getCities: getCities,
        getStats: getStats,
        getZones: getZones,
    });

})(window);
