/**
 * Promotion campaign API endpoints.
 *
 * Base path: /api/v1/promotions/admin/campaigns
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

  function create(data) {
    return AdminAPI.post('/promotions/admin/campaigns', data);
  }

  function update(id, data) {
    return AdminAPI.put('/promotions/admin/campaigns/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/promotions/admin/campaigns/' + id);
  }

  function approve(id, data = {}) {
    return AdminAPI.post('/promotions/admin/campaigns/' + id + '/approve', data);
  }

  function reject(id, data = {}) {
    return AdminAPI.post('/promotions/admin/campaigns/' + id + '/reject', data);
  }

  function approvePayment(id) {
    return AdminAPI.post('/promotions/admin/campaigns/' + id + '/approve-payment');
  }

  function pause(id) {
    return AdminAPI.post('/promotions/admin/campaigns/' + id + '/pause');
  }

  function resume(id) {
    return AdminAPI.post('/promotions/admin/campaigns/' + id + '/resume');
  }

  function cancel(id, data = {}) {
    return AdminAPI.post('/promotions/admin/campaigns/' + id + '/cancel', data);
  }

  return Object.freeze({ list, get, create, update, remove, approve, reject, approvePayment, pause, resume, cancel });
})();
