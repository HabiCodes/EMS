/**
 * Event media API endpoints.
 *
 * Base path: /api/v1/admin/events/{eventId}/media
 */

const AdminEventMediaAPI = (function () {
  'use strict';

  function list(eventId, params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/events/' + eventId + '/media' + (qs ? '?' + qs : ''));
  }

  function upload(eventId, data) {
    // data: { fileName, contentType, data: base64String, type?, altText?, sortOrder? }
    return AdminAPI.post('/admin/events/' + eventId + '/media', data);
  }

  function update(eventId, mediaId, data) {
    return AdminAPI.put('/admin/events/' + eventId + '/media/' + mediaId, data);
  }

  function remove(eventId, mediaId) {
    return AdminAPI.delete('/admin/events/' + eventId + '/media/' + mediaId);
  }

  function reorder(eventId, mediaIds) {
    return AdminAPI.post('/admin/events/' + eventId + '/media/reorder', { mediaIds });
  }

  return Object.freeze({ list, upload, update, remove, reorder });
})();
