/**
 * Customer Turf adapter.
 *
 * Keeps Turf pages on the shared EMS_API client while normalizing the
 * backend's snake_case response fields for the existing customer UI.
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
            sport: raw.sport || '',
            city: raw.city || '',
            status: raw.status || '',
            organizationId: raw.organization_id == null ? '' : String(raw.organization_id)
        };
    }

    async function listGrounds(query) {
        var response = await api().listTurfs(query || {});
        if (!response || !response.ok || !response.data || response.data.success !== true || !Array.isArray(response.data.data)) {
            throw new Error(errorMessage(response, 'Unable to load Turf venues.'));
        }
        return {
            items: response.data.data.map(mapGround),
            pagination: response.data.pagination || null
        };
    }

    async function getGround(id) {
        id = id == null ? '' : String(id);
        if (!id) throw new Error('A Turf ground ID is required.');

        var direct = await api().getTurf(id);
        if (direct && direct.ok && direct.data && direct.data.success === true && direct.data.data) {
            return mapGround(direct.data.data);
        }

        // The supplied backend currently fails to dispatch parameterized Turf
        // detail routes. Use its real paginated collection as a read-only fallback.
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
        var price = Number(raw.price);
        return {
            hour: raw.hour,
            label: typeof raw.slot === 'string' ? raw.slot : '',
            available: raw.available === true,
            price: Number.isFinite(price) && price >= 0 ? price : null
        };
    }

    async function getAvailability(resourceId, date) {
        var response = await api().getResourceAvailability(resourceId, date);
        var payload = response && response.data;
        var data = payload && payload.data;
        if (!response || !response.ok || !payload || payload.success !== true || !data || !Array.isArray(data.slots)) {
            throw new Error(errorMessage(response, 'Unable to load Turf availability.'));
        }
        return {
            resourceId: data.resource_id == null ? String(resourceId || '') : String(data.resource_id),
            date: data.date || date,
            slots: data.slots.map(mapSlot).filter(function (slot) { return slot.label; })
        };
    }

    function buildBookingBody(options) {
        options = options || {};
        var ground = options.ground || {};
        var user = options.user || {};
        var slots = Array.isArray(options.slots) ? options.slots : [];
        var amount = slots.reduce(function (sum, slot) {
            if (!Number.isFinite(slot.price)) throw new Error('Selected slot pricing is unavailable.');
            return sum + slot.price;
        }, 0);
        var labels = slots.map(function (slot) { return slot.label; });

        return {
            ground_id: ground.id,
            date: options.date,
            slot: labels[0] || '',
            slots: labels,
            duration_hours: labels.length,
            sport: ground.sport || '',
            amount: amount,
            contact_name: user.username || user.name || '',
            contact_phone: user.phone || ''
        };
    }

    async function createBooking(options) {
        var body = buildBookingBody(options);
        var response = await api().createTurfBooking(body);
        if (!response || !response.ok || !response.data || response.data.success !== true || !response.data.data) {
            throw new Error(errorMessage(response, 'Turf booking could not be created.'));
        }
        return response.data.data;
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
