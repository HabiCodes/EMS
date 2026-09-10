/**
 * Promotion campaign API endpoints.
 *
 * Admin routes: /api/v1/promotions/admin/campaigns
 * Organizer routes: /api/v1/promotions/organizer/campaigns
 */

const AdminPromotionCampaignsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/promotions/admin/campaigns' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/promotions/admin/campaigns/' + id);
  }

  function approve(id) {
    return AdminAPI.patch('/promotions/admin/campaigns/' + id + '/approve');
  }

  function reject(id) {
    return AdminAPI.patch('/promotions/admin/campaigns/' + id + '/reject');
  }

  function pause(id) {
    return AdminAPI.patch('/promotions/admin/campaigns/' + id + '/pause');
  }

  function resume(id) {
    return AdminAPI.patch('/promotions/admin/campaigns/' + id + '/resume');
  }

  return Object.freeze({ list, get, approve, reject, pause, resume });
})();
