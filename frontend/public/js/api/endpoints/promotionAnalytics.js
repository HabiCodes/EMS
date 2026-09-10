/**
 * Promotion analytics API endpoints.
 *
 * Base path: /api/v1/promotions/admin/analytics
 */

const AdminPromotionAnalyticsAPI = (function () {
  'use strict';

  function getCampaign(campaignId, params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/promotions/admin/analytics/campaign/' + campaignId + (qs ? '?' + qs : ''));
  }

  function getOverview(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/promotions/admin/analytics/overview' + (qs ? '?' + qs : ''));
  }

  return Object.freeze({ getCampaign, getOverview });
})();
