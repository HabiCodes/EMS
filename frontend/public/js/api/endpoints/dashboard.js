/**
 * Dashboard API endpoints (misc aggregated data).
 *
 * Base path: /api/v1/admin
 */

const AdminDashboardAPI = (function () {
  'use strict';

  function getStats() {
    return AdminAPI.get('/admin/stats');
  }

  function recentTickets(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const qs = q.toString();
    return AdminAPI.get('/admin/recent-tickets' + (qs ? '?' + qs : ''));
  }

  return Object.freeze({ getStats, recentTickets });
})();
