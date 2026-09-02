/**
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

  // Determine environment: if the page is served from the production domain,
  // we're in production. Otherwise, localhost/127.0.0.1 = development.
  var isProduction = (function () {
    try {
      return location.hostname === 'entrymyslot.com' ||
             location.hostname === 'www.entrymyslot.com';
    } catch (e) {
      return false;
    }
  })();

  // Change this line in your config script:
var defaultBase = 'https://entrymyslot.com';
var defaultWs   = 'https://entrymyslot.com';
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

  return cfg;
})();
