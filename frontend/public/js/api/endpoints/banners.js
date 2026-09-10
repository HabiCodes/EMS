/**
 * Banner API endpoints.
 *
 * Base path: /api/v1/admin/banners
 * Pagination uses page_size (not pageSize).
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

  function get(id) {
    return AdminAPI.get('/admin/banners/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/banners', data);
  }

  function update(id, data) {
    return AdminAPI.put('/admin/banners/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/banners/' + id);
  }

  function activate(id) {
    // Guide says PUT for activation
    return AdminAPI.put('/admin/banners/' + id + '/activate');
  }

  function deactivate(id) {
    return AdminAPI.put('/admin/banners/' + id + '/deactivate');
  }

  return Object.freeze({ list, get, create, update, remove, activate, deactivate });
})();
