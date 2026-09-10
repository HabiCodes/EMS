/**
 * Ticket API endpoints.
 *
 * Base path: /api/v1/admin/tickets
 */

const AdminTicketsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/tickets' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/tickets/' + id);
  }

  function resend(id) {
    return AdminAPI.post('/admin/tickets/' + id + '/resend');
  }

  function invalidate(id) {
    return AdminAPI.post('/admin/tickets/' + id + '/invalidate');
  }

  return Object.freeze({ list, get, resend, invalidate });
})();
