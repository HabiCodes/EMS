/**
 * Customer Turf adapter.
 *
 * Keeps Turf pages on the shared EMS_API client while normalizing the
 * backend's response fields for the existing customer UI.
 */
window.EMS_CUSTOMER_TURF = (function () {
    'use strict';

    function api() {
        if (!window.EMS_API || !window.EMS_API.turf) {
            throw new Error('Turf API is unavailable.');
        }
        return window.EMS_API.turf;
    }

    function errorMessage(response, fallback) {
        var payload = response && response.data;
        return (payload && (payload.error || payload.message)) || fallback;
    }

    function mapGround(raw) {
        raw = raw || {};
        return {
            id: raw.id == null ? '' : String(raw.id),
            name: raw.name || '',
            sport: raw.sport || 'Turf',
            city: raw.city || '',
            address: raw.address || '',
            description: raw.description || '',
            status: raw.status || '',
            isActive: raw.is_active === true,
            organizationId: raw.organization_id == null ? '' : String(raw.organization_id),
            amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
            latitude: raw.latitude || null,
            longitude: raw.longitude || null,
        };
    }

    async function listGrounds(query) {
        var response = await api().listTurfs(query || {});
        if (!response || !response.ok || !response.data || !Array.isArray(response.data)) {
            throw new Error(errorMessage(response, 'Unable to load Turf venues.'));
        }
        return {
            items: response.data.map(mapGround),
            pagination: response.raw && response.raw.pagination ? response.raw.pagination : null
        };
    }

    async function getGround(id) {
        id = id == null ? '' : String(id);
        if (!id) throw new Error('A Turf ground ID is required.');

        var direct = await api().getTurf(id);
        if (direct && direct.ok && direct.data) {
            return mapGround(direct.data);
        }

        // Fallback: search in the public list
        var page = 1;
        var totalPages = 1;
        do {
            var result = await listGrounds({ page: page, pageSize: 100 });
            var found = result.items.find(function (ground) { return ground.id === id; });
            if (found) return found;
            totalPages = result.pagination && Number(result.pagination.totalPages) || 1;
            page += 1;
        } while (page <= totalPages);

        throw new Error(errorMessage(direct, 'Turf venue not found.'));
    }

    function mapSlot(raw) {
        raw = raw || {};
        var unitId = raw.unit_id == null ? '' : String(raw.unit_id);
        var price = Number(raw.price);
        var isAvailable = raw.status === 'available';
        return {
            unitId: unitId,
            label: raw.formatted_time || (raw.starts_at ? raw.starts_at.substring(0, 5) + ' – ' + (raw.ends_at || '').substring(0, 5) : ''),
            available: isAvailable && Number.isFinite(price) && price >= 0,
            price: Number.isFinite(price) ? price : null,
            startsAt: raw.starts_at || '',
            endsAt: raw.ends_at || '',
            status: raw.status || 'unknown',
        };
    }

    async function getAvailability(resourceId, date) {
        var response = await api().getResourceAvailability(resourceId, date);
        var payload = response && response.data;
        var data = payload && typeof payload === 'object' ? payload : null;
        if (!response || !response.ok || !data || !Array.isArray(data.slots)) {
            throw new Error(errorMessage(response, 'Unable to load Turf availability.'));
        }
        return {
            resourceId: data.resource_id == null ? String(resourceId || '') : String(data.resource_id),
            resourceName: data.resource_name || '',
            venueId: data.venue_id == null ? '' : String(data.venue_id),
            venueName: data.venue_name || '',
            date: data.date || date,
            slots: data.slots.map(mapSlot).filter(function (slot) { return slot.label; }),
            summary: data.summary || null,
        };
    }

    function buildBookingBody(options) {
        options = options || {};
        var slots = Array.isArray(options.slots) ? options.slots : [];
        var user = options.user || {};
        var unitId = slots.length > 0 && slots[0].unitId ? slots[0].unitId : null;

        if (!unitId) {
            throw new Error('No availability unit selected. Please select a time slot first.');
        }

        var amount = slots.reduce(function (sum, slot) {
            if (!Number.isFinite(slot.price)) throw new Error('Selected slot pricing is unavailable.');
            return sum + slot.price;
        }, 0);

        return {
            availability_unit_id: unitId,
            quantity: slots.length,
            booking_type: 'online',
            amount: amount,
            duration_hours: slots.length,
            contact_name: user.username || user.name || '',
            contact_phone: user.phone || '',
            notes: (options.notes || ''),
        };
    }

    async function createBooking(options) {
        var body = buildBookingBody(options);
        var response = await api().createTurfBooking(body);
        if (!response || !response.ok || !response.data) {
            throw new Error(errorMessage(response, 'Turf booking could not be created.'));
        }
        return response.data;
    }

    return Object.freeze({
        mapGround: mapGround,
        listGrounds: listGrounds,
        getGround: getGround,
        getAvailability: getAvailability,
        buildBookingBody: buildBookingBody,
        createBooking: createBooking
    });
})();
