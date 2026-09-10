/**
 * Event API endpoints.
 *
 * Base path: /api/v1/admin/events
 * All responses use { success, data } envelope.
 */

const AdminEventsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/events' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/events/' + id);
  }

  function create(data) {
    return AdminAPI.post('/admin/events', data);
  }

  function update(id, data) {
    return AdminAPI.put('/admin/events/' + id, data);
  }

  function patch(id, data) {
    return AdminAPI.patch('/admin/events/' + id, data);
  }

  function remove(id) {
    return AdminAPI.delete('/admin/events/' + id);
  }

  function restore(id) {
    return AdminAPI.post('/admin/events/' + id + '/restore');
  }

  function submitForReview(id) {
    return AdminAPI.post('/admin/events/' + id + '/submit-for-review');
  }

  function approve(id) {
    return AdminAPI.post('/admin/events/' + id + '/approve');
  }

  function reject(id, data = {}) {
    return AdminAPI.post('/admin/events/' + id + '/reject', data);
  }

  function publish(id) {
    return AdminAPI.post('/admin/events/' + id + '/publish');
  }

  function hide(id) {
    return AdminAPI.post('/admin/events/' + id + '/hide');
  }

  function archive(id) {
    return AdminAPI.post('/admin/events/' + id + '/archive');
  }

  function unpublish(id) {
    return AdminAPI.post('/admin/events/' + id + '/unpublish');
  }

  function show(id) {
    return AdminAPI.post('/admin/events/' + id + '/show');
  }

  function setFeatured(id) {
    return AdminAPI.post('/admin/events/' + id + '/featured');
  }

  function cancel(id, data = {}) {
    return AdminAPI.post('/admin/events/' + id + '/cancel', data);
  }

  function updateStatus(id, status) {
    return AdminAPI.patch('/admin/events/' + id + '/status', { status });
  }

  // Zone endpoints return { zone } / { zones } directly (no envelope)
  function getZones(eventId) {
    return AdminAPI.get('/admin/events/' + eventId + '/zones');
  }

  function createZone(eventId, data) {
    return AdminAPI.post('/admin/events/' + eventId + '/zones', data);
  }

  function getZone(eventId, zoneId) {
    return AdminAPI.get('/admin/events/' + eventId + '/zones/' + zoneId);
  }

  function updateZone(eventId, zoneId, data) {
    return AdminAPI.put('/admin/events/' + eventId + '/zones/' + zoneId, data);
  }

  function deleteZone(eventId, zoneId) {
    return AdminAPI.delete('/admin/events/' + eventId + '/zones/' + zoneId);
  }

  function reorderZones(eventId, zoneIds) {
    return AdminAPI.post('/admin/events/' + eventId + '/zones/reorder', { zoneIds });
  }

  // Review queue
  function getReviewQueue(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/events/pending-review' + (qs ? '?' + qs : ''));
  }

  return Object.freeze({
    list,
    get,
    create,
    update,
    patch,
    remove,
    restore,
    submitForReview,
    approve,
    reject,
    publish,
    hide,
    archive,
    unpublish,
    show,
    setFeatured,
    cancel,
    updateStatus,
    getZones,
    createZone,
    getZone,
    updateZone,
    deleteZone,
    reorderZones,
    getReviewQueue,
  });
})();
