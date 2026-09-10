/**
 * Layout version API endpoints.
 *
 * Base path: /api/v1/admin/layout-versions
 * Hierarchy: Screen → Layout Version → Seat
 */

const AdminLayoutVersionsAPI = (function () {
  'use strict';

  function listForScreen(screenId) {
    return AdminAPI.get('/admin/layout-versions/screen/' + screenId);
  }

  function getCurrentForScreen(screenId) {
    return AdminAPI.get('/admin/layout-versions/screen/' + screenId + '/current');
  }

  function get(id) {
    return AdminAPI.get('/admin/layout-versions/' + id);
  }

  function getSeats(id) {
    return AdminAPI.get('/admin/layout-versions/' + id + '/seats');
  }

  function create(data) {
    return AdminAPI.post('/admin/layout-versions', data);
  }

  function createFromScreen(screenId, data) {
    return AdminAPI.post('/admin/layout-versions/screen/' + screenId + '/new-version', data);
  }

  function setCurrent(id) {
    return AdminAPI.patch('/admin/layout-versions/' + id + '/set-current');
  }

  function addSeat(id, data) {
    return AdminAPI.post('/admin/layout-versions/' + id + '/seats', data);
  }

  function syncSeats(id) {
    return AdminAPI.post('/admin/layout-versions/' + id + '/sync-seats');
  }

  function initializeForScreen(screenId, data) {
    return AdminAPI.post('/admin/layout-versions/screen/' + screenId + '/initialize', data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/layout-versions/' + id);
  }

  return Object.freeze({
    listForScreen,
    getCurrentForScreen,
    get,
    getSeats,
    create,
    createFromScreen,
    setCurrent,
    addSeat,
    syncSeats,
    initializeForScreen,
    remove,
  });
})();
