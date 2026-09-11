/**
<<<<<<< HEAD
 * EMS Frontend Configuration
 * Centralized config — edit here to point to your backend.
 *
 * Production: set window.EMS_API_CONFIG_OVERRIDE before this loads,
 * or use an environment-specific build. Otherwise BASE_URL defaults
 * to the production domain.
 */
window.EMS_API_CONFIG = (function () {
  // Allow override from a global set by server-side rendering or env script
  var override = window.EMS_API_CONFIG_OVERRIDE || {};
=======
 * EntryMySlot - Production Configuration
 * Single source of truth for all API endpoints and app settings.
 */

(function () {
  'use strict';

  if (window.__EMS_CONFIG__) return;
  window.__EMS_CONFIG__ = true;
>>>>>>> d3846f2 (chore: finalize production frontend)

  // Determine environment: if the page is served from the production domain,
  // we're in production. Otherwise, localhost/127.0.0.1 = development.
  var isProduction = (function () {
    var host = (location.hostname || '').toLowerCase();
    return host === 'entrymyslot.com' || host === 'www.entrymyslot.com';
  })();

<<<<<<< HEAD
  // Defaults: production → server IP:4000, dev → localhost:4000
  // Override with window.EMS_API_CONFIG_OVERRIDE for either environment.
  var defaultBase = isProduction ? 'https://api.entrymyslot.com' : 'http://localhost:4000';
  var defaultWs   = isProduction ? 'https://api.entrymyslot.com' : 'http://localhost:4000';
  var cfg = {
    API_BASE: '/api/v1',
    // Production defaults to entrymyslot.com; localhost for dev only.
    // When running on the same origin, set BASE_URL to empty string for relative paths.
    BASE_URL: (override.BASE_URL !== undefined ? override.BASE_URL : defaultBase).replace(/\/+$/, ''),
    WS_URL: (override.WS_URL !== undefined ? override.WS_URL : defaultWs).replace(/\/+$/, ''),

    MAX_TICKETS_PER_BOOKING: 10,
    CURRENCY: 'INR',
    CURRENCY_SYMBOL: '₹',
    TAX_RATE: 0,
    CANCELLATION_WINDOW_HOURS: 6,
    SLOT_HOLD_DURATION_MS: 5 * 60 * 1000,
    SEAT_HOLD_DURATION_MS: 5 * 60 * 1000,
    SLOTS_PER_HOUR: 4,
    DEFAULT_OPTOUT_REASONS: [
      'No longer available',
      'Better price elsewhere',
      'Schedule conflict',
      'Personal reasons',
      'Organiser cancelled',
      'Weather / venue issue',
      'Other',
    ],
  };
=======
  window.EMS_CONFIG = Object.freeze({
    apiBaseUrl: 'https://api.entrymyslot.com/api/v1',
    wsBaseUrl: 'https://api.entrymyslot.com',
    environment: isProduction ? 'production' : 'development',
    isProduction: isProduction,
>>>>>>> d3846f2 (chore: finalize production frontend)

    // Timeouts (ms)
    requestTimeout: 15000,
    uploadTimeout: 60000,

    // Token storage keys
    storage: {
      customerAccess: 'ems_access_token',
      customerRefresh: 'ems_refresh_token',
      customerUser: 'ems_auth_user',
      organizerAccess: 'ems_organizer_access',
      organizerRefresh: 'ems_organizer_refresh',
      organizerUser: 'ems_organizer_user',
      adminToken: 'ems_admin_token',
      adminUser: 'ems_admin_user',
      location: 'ems_selected_location',
      locationName: 'ems_global_location_name',
      locationCode: 'ems_global_location_code',
    },

    // Booking
    maxTicketsPerBooking: 10,
    seatHoldDurationMs: 5 * 60 * 1000,
    slotHoldDurationMs: 5 * 60 * 1000,

    // Currency
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',

    // Pagination defaults
    defaultPageSize: 20,
    maxPageSize: 100,

    // Feature flags
    features: {
      paymentProvider: false,
      realTimeSeats: false,
      pushNotifications: false,
    },
  });
})();
