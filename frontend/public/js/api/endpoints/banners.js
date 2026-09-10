/**
 * Banner API endpoints.
 *
 * Base path: /api/v1/admin/banners
 * Create uses multipart upload (jsonUploadMiddleware on backend).
 * Update uses PATCH (not PUT).
 */

const AdminBannersAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/banners' + (qs ? '?' + qs : ''));
  }

  function getActiveTicketAd() {
    return AdminAPI.get('/admin/banners/active-ticket-ad');
  }

  function get(id) {
    return AdminAPI.get('/admin/banners/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/banners', data);
  }

  function update(id, data) {
    return AdminAPI.patch('/admin/banners/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/banners/' + id);
  }

  function activate(id) {
    return AdminAPI.put('/admin/banners/' + id + '/activate');
  }

  function deactivate(id) {
    return AdminAPI.put('/admin/banners/' + id + '/deactivate');
  }

  return Object.freeze({ list, getActiveTicketAd, get, create, update, remove, activate, deactivate });
})();
