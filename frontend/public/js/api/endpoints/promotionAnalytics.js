/**
 * Promotion analytics API endpoints.
 *
 * Base path: /api/v1/promotions/admin/analytics
 * Single GET /promotions/admin/analytics returns all platform analytics.
 */

const AdminPromotionAnalyticsAPI = (function () {
  'use strict';

  function getOverview(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/promotions/admin/analytics' + (qs ? '?' + qs : ''));
  }

  return Object.freeze({ getOverview });
})();
