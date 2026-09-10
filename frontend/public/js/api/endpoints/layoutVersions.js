/**
 * Layout version API endpoints.
 *
 * Base path: /api/v1/admin/layout-versions
 * Hierarchy: Screen → Layout Version → Seat
 */

const AdminLayoutVersionsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/layout-versions' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/layout-versions/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/layout-versions', data);
  }

  function update(id, data) {
    return AdminAPI.put('/admin/layout-versions/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/layout-versions/' + id);
  }

  function activate(id) {
    return AdminAPI.post('/admin/layout-versions/' + id + '/activate');
  }

  function duplicate(id) {
    return AdminAPI.post('/admin/layout-versions/' + id + '/duplicate');
  }

  return Object.freeze({ list, get, create, update, remove, activate, duplicate });
})();
