/**
 * EMS Frontend Configuration
 * Centralized config — edit here to point to your backend.
 */
window.EMS_API_CONFIG = (function () {
  var override = window.EMS_API_CONFIG_OVERRIDE || {};

  var isProduction = (function () {
    try {
      return location.hostname === 'entrymyslot.com' ||
             location.hostname === 'www.entrymyslot.com';
    } catch (e) {
      return false;
    }
  })();

  var defaultBase = 'https://api.entrymyslot.com';
  var cfg = {
    API_BASE: '/api/v1',
    BASE_URL: (override.BASE_URL !== undefined ? override.BASE_URL : defaultBase).replace(/\/+$/, ''),
    WS_URL: (override.WS_URL !== undefined ? override.WS_URL : defaultBase).replace(/\/+$/, ''),
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
