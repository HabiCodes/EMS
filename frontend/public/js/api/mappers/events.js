/**
 * Normalize event response data.
 *
 * Events come back as snake_case DB rows from most mutation endpoints,
 * but camelCase from the list endpoint. This mapper normalizes everything
 * to camelCase for the frontend.
 */

const EventMapper = (function () {
  'use strict';

  // snake_case -> camelCase field mapping for events
  const fieldMap = {
    original_title: 'originalTitle',
    event_date: 'eventDate',
    start_time: 'startTime',
    end_time: 'endTime',
    start_at: 'startAt',
    end_at: 'endAt',
    banner_url: 'bannerUrl',
    thumbnail_url: 'thumbnailUrl',
    logo_url: 'logoUrl',
    remaining_capacity: 'remainingCapacity',
    is_featured: 'isFeatured',
    is_free: 'isFree',
    is_active: 'isActive',
    cancel_window_hours: 'cancelWindowHours',
    published_at: 'publishedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    organization_id: 'organizationId',
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
