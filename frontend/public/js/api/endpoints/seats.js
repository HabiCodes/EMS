/**
 * Seat API endpoints.
 *
 * Base path: /api/v1/admin/layout-versions/{versionId}/seats
 */

const AdminSeatsAPI = (function () {
  'use strict';

  function list(layoutVersionId, params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/layout-versions/' + layoutVersionId + '/seats' + (qs ? '?' + qs : ''));
  }

  function get(layoutVersionId, seatId) {
    return AdminAPI.get('/admin/layout-versions/' + layoutVersionId + '/seats/' + seatId);
  }

  function create(layoutVersionId, data) {
    return AdminAPI.post('/admin/layout-versions/' + layoutVersionId + '/seats', data);
  }

  function update(layoutVersionId, seatId, data) {
    return AdminAPI.put('/admin/layout-versions/' + layoutVersionId + '/seats/' + seatId, data);
  }

  function remove(layoutVersionId, seatId) {
    return AdminAPI.delete('/admin/layout-versions/' + layoutVersionId + '/seats/' + seatId);
  }

  function bulkUpdate(layoutVersionId, data) {
    return AdminAPI.post('/admin/layout-versions/' + layoutVersionId + '/seats/bulk', data);
  }

  return Object.freeze({ list, get, create, update, remove, bulkUpdate });
})();
