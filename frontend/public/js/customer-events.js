/**
 * Customer Events adapter.
 *
 * Uses the shared EMS_API client and maps the backend event, zone and booking
 * contracts to the existing customer Events UI.
 */
window.EMS_CUSTOMER_EVENTS = (function () {
    'use strict';

    function api() {
        if (!window.EMS_API || !window.EMS_API.events) {
            throw new Error('Events API is unavailable.');
        }
        return window.EMS_API.events;
    }

    function errorMessage(response, fallback) {
        var payload = response && response.data;
        return (payload && (payload.error || payload.message)) || fallback;
    }

    function mapEvent(raw) {
        raw = raw || {};
        var price = raw.price === null || raw.price === undefined || raw.price === '' ? NaN : Number(raw.price);
        var capacity = raw.capacity === null || raw.capacity === undefined || raw.capacity === '' ? NaN : Number(raw.capacity);
        return {
            id: raw.id == null ? '' : String(raw.id),
            title: raw.title || '',
            description: raw.description || '',
            category: raw.category || '',
            venue: raw.venue || '',
            city: raw.city || '',
            capacity: Number.isFinite(capacity) ? capacity : null,
            price: Number.isFinite(price) ? price : null,
            status: raw.status || '',
            eventDate: raw.event_date || '',
            startTime: raw.start_time || '',
            endTime: raw.end_time || '',
            currency: raw.currency || '',
            organizationId: raw.organization_id == null ? '' : String(raw.organization_id),
            createdAt: raw.created_at || '',
            imageUrl: raw.imageUrl || raw.thumbnailUrl || raw.thumbnail_url || raw.bannerUrl || raw.banner_url || raw.image_url || '',
            bannerUrl: raw.bannerUrl || raw.banner_url || raw.thumbnailUrl || raw.thumbnail_url || '',
            thumbnailUrl: raw.thumbnailUrl || raw.thumbnail_url || raw.bannerUrl || raw.banner_url || ''
        };
    }

    async function listEvents(query) {
        query = Object.assign({ status: 'published' }, query || {});
        var response = await api().listEvents(query);
        if (!response || !response.ok || !response.data || response.data.success !== true || !Array.isArray(response.data.data)) {
            throw new Error(errorMessage(response, 'Unable to load events.'));
        }
        return {
            items: response.data.data.map(mapEvent),
            pagination: response.data.pagination || null
        };
    }

    async function getEvent(id) {
        id = id == null ? '' : String(id);
        if (!id) throw new Error('An Event ID is required.');

        var direct = await api().getEvent(id);
        if (direct && direct.ok && direct.data && direct.data.success === true && direct.data.data) {
            return mapEvent(direct.data.data);
        }

        // The supplied backend does not currently dispatch parameterized Event
        // routes. Fall back to its real published collection without inventing data.
        var page = 1;
        var totalPages = 1;
        do {
            var result = await listEvents({ page: page, pageSize: 100 });
            var found = result.items.find(function (event) { return event.id === id; });
            if (found) return found;
            totalPages = result.pagination && Number(result.pagination.totalPages) || 1;
            page += 1;
        } while (page <= totalPages);

        throw new Error(errorMessage(direct, 'Event not found.'));
    }

    function mapZone(raw) {
        raw = raw || {};
        var price = raw.price === null || raw.price === undefined || raw.price === '' ? NaN : Number(raw.price);
        var capacity = raw.capacity === null || raw.capacity === undefined || raw.capacity === '' ? NaN : Number(raw.capacity);
        return {
            id: raw.id == null ? '' : String(raw.id),
            name: raw.name || '',
            description: raw.description || '',
            price: Number.isFinite(price) ? price : null,
            capacity: Number.isFinite(capacity) ? capacity : null,
            currency: raw.currency || '',
            soldOut: raw.is_sold_out === true
        };
    }

    async function getZones(eventId) {
        var response = await api().getEventZones(eventId);
        // Backend returns raw { zones: [...] } — no envelope
        var zones = (response && response.ok && response.data && response.data.zones) ? response.data.zones
            : (response && response.ok && response.data && response.data.success && Array.isArray(response.data.data)) ? response.data.data
            : null;
        if (!zones) {
            throw new Error(errorMessage(response, 'Unable to load Event zones.'));
        }
        return zones.map(mapZone).filter(function (zone) {
            return zone.id && zone.name && Number.isFinite(zone.price);
        });
    }

    function buildBookingBody(options) {
        options = options || {};
        var event = options.event || {};
        var zone = options.zone || {};
        var user = options.user || {};
        var quantity = Number(options.quantity);
        if (!event.id || !zone.id || !Number.isInteger(quantity) || quantity < 1) {
            throw new Error('A valid Event zone and ticket quantity are required.');
        }
        if (!Number.isFinite(zone.price)) {
            throw new Error('The selected zone does not have server-provided pricing.');
        }
        return {
            event_id: event.id,
            tickets_count: quantity,
            ticket_type: zone.name,
            zone_id: zone.id,
            seat_numbers: [],
            amount: zone.price * quantity,
            currency: zone.currency || event.currency || '',
            payment_method: 'online',
            contact_name: user.username || user.name || '',
            contact_phone: user.phone || ''
        };
    }

    async function createBooking(options) {
        var body = buildBookingBody(options);
        var response = await api().createEventBooking(body);
        // Backend returns 201 for free (confirmed) or 202 for paid (payment_pending)
        // Response body: { booking, tickets } or { booking, tickets, zone, payment }
        if (!response || !response.ok || !response.data) {
            throw new Error(errorMessage(response, 'Event booking could not be created.'));
        }
        if (response.data.booking) {
            return response.data;
        }
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(errorMessage(response, 'Event booking could not be created.'));
    }

    // Extract booking object from the response
    function getBookingFromResponse(response) {
        if (!response) return null;
        return response.booking || (response.data && response.data.booking) || response;
    }

    // Get booking ID (handles both old 'id' and new 'bookingId' field)
    function getBookingId(response) {
        var booking = getBookingFromResponse(response);
        if (!booking) return '';
        return booking.bookingId || booking.id || '';
    }

    // Get booking status
    function getBookingStatus(response) {
        var booking = getBookingFromResponse(response);
        if (!booking) return 'unknown';
        return booking.status || 'pending_payment';
    }

    return Object.freeze({
        mapEvent: mapEvent,
        mapZone: mapZone,
        listEvents: listEvents,
        getEvent: getEvent,
        getZones: getZones,
        buildBookingBody: buildBookingBody,
        createBooking: createBooking,
        getBookingFromResponse: getBookingFromResponse,
        getBookingId: getBookingId,
        getBookingStatus: getBookingStatus
    });
})();
