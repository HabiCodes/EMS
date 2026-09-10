/**
 * Screen API endpoints.
 *
 * Base path: /api/v1/admin/movies/cinemas/:cinemaId/screens
 * Screen detail: /api/v1/admin/movies/screens/:screenId
 */

const AdminScreensAPI = (function () {
  'use strict';

  function list(cinemaId, params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/movies/cinemas/' + cinemaId + '/screens' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/movies/screens/' + id);
  }

  function create(cinemaId, data) {
    return AdminAPI.post('/admin/movies/cinemas/' + cinemaId + '/screens', data);
  }

  function update(id, data) {
    return AdminAPI.patch('/admin/movies/screens/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/movies/screens/' + id);
  }

  function getLayout(screenId) {
    return AdminAPI.get('/admin/movies/screens/' + screenId + '/layout');
  }

  function getLayoutVersions(screenId) {
    return AdminAPI.get('/admin/movies/screens/' + screenId + '/layout/versions');
  }

  function setCurrentLayout(screenId, versionId) {
    return AdminAPI.patch('/admin/movies/screens/' + screenId + '/layout/versions/' + versionId + '/current');
  }

  function createLayoutVersion(screenId, data) {
    return AdminAPI.post('/admin/movies/screens/' + screenId + '/layout/versions', data);
  }

  function syncLayout(screenId) {
    return AdminAPI.post('/admin/movies/screens/' + screenId + '/layout/sync');
  }

  function initializeLayout(screenId, data) {
    return AdminAPI.post('/admin/movies/screens/' + screenId + '/layout/initialize', data);
  }

  return Object.freeze({
    list,
    get,
    create,
    update,
    remove,
    getLayout,
    getLayoutVersions,
    setCurrentLayout,
    createLayoutVersion,
    syncLayout,
    initializeLayout,
  });
})();
