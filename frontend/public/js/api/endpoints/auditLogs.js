/**
 * Audit log API endpoints.
 *
 * Base path: /api/v1/admin/audit-logs
 */

const AdminAuditLogsAPI = (function () {
  'use strict';

  function list(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/audit-logs' + (qs ? '?' + qs : ''));
  }

  function get(id) {
    return AdminAPI.get('/admin/audit-logs/' + id);
  }

  return Object.freeze({ list, get });
})();
