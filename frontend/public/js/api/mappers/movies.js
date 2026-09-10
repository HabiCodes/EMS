/**
 * Normalize movie/cinema/screen/showtime response data.
 *
 * The movie module returns mixed snake_case (from mutations) and
 * camelCase (from list endpoints). This mapper normalizes to camelCase.
 */

const MovieMapper = (function () {
  'use strict';

  const fieldMap = {
    original_title: 'originalTitle',
    release_date: 'releaseDate',
    duration_minutes: 'durationMinutes',
    genre: 'genre',
    cast: 'cast',
    director: 'director',
    synopsis: 'synopsis',
    poster_url: 'posterUrl',
    trailer_url: 'trailerUrl',
    backdrop_url: 'backdropUrl',
    is_featured: 'isFeatured',
    language: 'language',
    certification: 'certification',
    is_active: 'isActive',
    status: 'status',
    imdb_rating: 'imdbRating',
    created_at: 'createdAt',
    updated_at: 'updatedAt',

    // Cinema
    city: 'city',
    state: 'state',
    pincode: 'pincode',
    total_screens: 'totalScreens',
    is_active: 'isActive',

    // Screen
    screen_number: 'screenNumber',
    screen_name: 'screenName',
    seat_capacity: 'seatCapacity',
    screen_type: 'screenType',
    is_active: 'isActive',

    // Showtime
    show_date: 'showDate',
    show_time: 'showTime',
    screen_id: 'screenId',
    movie_id: 'movieId',
    cinema_id: 'cinemaId',
    price_cap: 'priceCap',
    currency: 'currency',
    is_active: 'isActive',
    sold_count: 'soldCount',
    total_seats: 'totalSeats',
    remaining_seats: 'remainingSeats',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
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
