/**
 * EntryMySlot - Unified Frontend Configuration
 * Sets BOTH window.EMS_API_CONFIG (legacy consumers) and
 * window.EMS_CONFIG (new API client / auth modules).
 */
(function () {
  'use strict';

  if (window.__EMS_CONFIG__) return;
  window.__EMS_CONFIG__ = true;

  // ── Environment detection ────────────────────────────────────────────
  // In production the frontend is served from entrymyslot.com.
  // The backend may be on the same origin (proxied) or a separate domain.
  // When the backend is on the same origin, set EMS_BACKEND_SAME_ORIGIN=true
  // before this script loads (e.g. via <script> in the HTML <head>).
  var host = (location.hostname || '').toLowerCase();
  var isProduction = host === 'entrymyslot.com' || host === 'www.entrymyslot.com';
  // Default production to cross-origin (api.entrymyslot.com) unless explicitly overridden.
  var sameOrigin = typeof window.EMS_BACKEND_SAME_ORIGIN !== 'undefined'
    ? window.EMS_BACKEND_SAME_ORIGIN
    : false;

  var derivedApiBase;
  if (sameOrigin) {
    // Backend is served from the same origin — use relative path
    derivedApiBase = '/api/v1';
  } else {
    // Separate domain — build full URL
    var defaultBackend = isProduction
      ? 'https://api.entrymyslot.com'
      : 'http://localhost:4000';
    var override = (window.EMS_API_CONFIG_OVERRIDE && window.EMS_API_CONFIG_OVERRIDE.BASE_URL)
      ? window.EMS_API_CONFIG_OVERRIDE.BASE_URL.replace(/\/+$/, '')
      : defaultBackend.replace(/\/+$/, '');
    derivedApiBase = override + '/api/v1';
  }

  // ── Legacy config (window.EMS_API_CONFIG) ────────────────────────────
  // Used by: api.js, auth.js, admin.js (older IIFE modules)
  window.EMS_API_CONFIG = Object.freeze({
    API_BASE: '/api/v1',
    BASE_URL: sameOrigin ? '' : (derivedApiBase.replace(/\/api\/v1$/, '')),
    WS_URL: sameOrigin ? '' : (derivedApiBase.replace(/\/api\/v1$/, '')),
    ENVIRONMENT: isProduction ? 'production' : 'development',
  });

  // ── Modern config (window.EMS_CONFIG) ────────────────────────────────
  // Used by: api/client.js, auth/*.js, api/endpoints/*.js (new modules)
  window.EMS_CONFIG = Object.freeze({
    apiBaseUrl: derivedApiBase,
    wsBaseUrl: sameOrigin ? '' : derivedApiBase.replace(/\/api\/v1$/, ''),
    environment: isProduction ? 'production' : 'development',
    isProduction: isProduction,

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
