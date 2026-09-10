/**
 * Seat API endpoints.
 *
 * Base path: /api/v1/admin/layout-versions/{id}/seats
 * Seats are nested under layout versions — no standalone seat CRUD.
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

  function add(layoutVersionId, data) {
    return AdminAPI.post('/admin/layout-versions/' + layoutVersionId + '/seats', data);
  }

  return Object.freeze({ list, add });
})();
