/**
 * Media API endpoints (global media library).
 *
 * Base path: /api/v1/admin/media
 * Uploads: JSON body with base64-encoded image data.
 */

const AdminMediaAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/media' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/media/' + id);
  }

  function upload(data) {
    // data: { fileName, contentType, data: base64String, folder? }
    return AdminAPI.post('/admin/media', data);
  }

  function update(id, data) {
    return AdminAPI.patch('/admin/media/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/media/' + id);
  }

  function restore(id) {
    return AdminAPI.post('/admin/media/' + id + '/restore');
  }

  return Object.freeze({ list, get, upload, update, remove, restore });
})();
