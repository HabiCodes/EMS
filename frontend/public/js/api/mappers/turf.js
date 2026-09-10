/**
 * Normalize turf venue/booking response data.
 *
 * Turf endpoints return snake_case from mutation operations.
 * This mapper normalizes to camelCase for the frontend.
 */

const TurfMapper = (function () {
  'use strict';

  const fieldMap = {
    venue_name: 'venueName',
    venue_type: 'venueType',
    sport_type: 'sportType',
    address_line1: 'addressLine1',
    address_line2: 'addressLine2',
    city: 'city',
    state: 'state',
    pincode: 'pincode',
    contact_phone: 'contactPhone',
    contact_email: 'contactEmail',
    description: 'description',
    amenities: 'amenities',
    booking_price_per_hour: 'bookingPricePerHour',
    currency: 'currency',
    is_active: 'isActive',
    status: 'status',
    rejection_reason: 'rejectionReason',
    admin_notes: 'adminNotes',
    slot_duration_minutes: 'slotDurationMinutes',
    advance_booking_days: 'advanceBookingDays',
    opening_time: 'openingTime',
    closing_time: 'closingTime',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    approved_at: 'approvedAt',
    rejected_at: 'rejectedAt',
    organization_id: 'organizationId',
    user_id: 'userId',
    booking_date: 'bookingDate',
    start_time: 'startTime',
    end_time: 'endTime',
    total_amount: 'totalAmount',
    payment_status: 'paymentStatus',
    booking_status: 'bookingStatus',
    number_of_players: 'numberOfPlayers',
    special_requests: 'specialRequests',
    cancelled_at: 'cancelledAt',
    cancellation_reason: 'cancellationReason',
    refund_amount: 'refundAmount',
  };

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    if (Array.isArray(raw)) {
      return raw.map(normalize);
    }
    const out = {};
    Object.keys(raw).forEach(k => {
      const camel = fieldMap[k] || k;
      out[camel] = raw[k];
    });
    return out;
  }

  function normalizeList(data) {
    if (!data) return [];
    const items = data.data || data;
    if (!Array.isArray(items)) return [];
    const pagination = data.pagination || null;
    return {
      items: items.map(normalize),
      pagination,
    };
  }

  return Object.freeze({ normalize, normalizeList });
})();
