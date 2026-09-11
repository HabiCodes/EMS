/**
 * Dashboard page module.
 *
 * Shows: admin profile, stat cards, recent tickets.
 */

var DashboardPage = (function () {
  'use strict';

  var _loaded = false;

  function render() {
    if (!_loaded) {
      _loaded = true;
    }

    var container = AdminShell.getPageContainer();
    if (!container) return;

    DOM.empty(container);

    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderStats());
    wrapper.appendChild(renderRecentTickets());
    container.appendChild(wrapper);

    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    var title = DOM.el('h2', { className: 'page-header__title', textContent: 'Dashboard' });
    var subtitle = DOM.el('p', { className: 'page-header__subtitle', textContent: 'Overview of your platform' });
    info.appendChild(title);
    info.appendChild(subtitle);
    header.appendChild(info);
    return header;
  }

  function renderStats() {
    var grid = DOM.el('div', { className: 'stat-grid', id: 'dashboardStats' });
    grid.appendChild(Components.spinner('Loading stats…'));
    return grid;
  }

  function renderRecentTickets() {
    var card = DOM.el('div', { className: 'card' });
    var header = DOM.el('div', { className: 'card__header' });
    var title = DOM.el('h3', { className: 'card__title', textContent: 'Recent Tickets' });
    header.appendChild(title);
    card.appendChild(header);

    var body = DOM.el('div', { className: 'card__body', id: 'recentTickets' });
    body.appendChild(Components.spinner('Loading tickets…'));
    card.appendChild(body);

    return card;
  }

  async function loadData() {
    try {
      await Promise.all([loadStats(), loadRecentTickets()]);
    } catch (err) {
      Components.showToast(err.message || 'Failed to load dashboard', 'error');
    }
  }

  async function loadStats() {
    var grid = document.getElementById('dashboardStats');
    if (!grid) return;

    try {
      // Try multiple stat endpoints — guide says backend is source of truth
      var stats = {};

      try {
        var dashboardResp = await AdminDashboardAPI.getStats();
        if (dashboardResp && dashboardResp.data) {
          stats = Object.assign(stats, dashboardResp.data);
        }
      } catch (_) {}

      // Merge with fallback defaults
      var display = {
        totalEvents: (stats.events && stats.events.total) || stats.totalEvents || 0,
        pendingReview: (stats.events && stats.events.pending) || stats.pendingReview || 0,
        publishedEvents: (stats.events && stats.events.published) || stats.publishedEvents || 0,
        totalUsers: stats.totalUsers || 0,
        totalBookings: stats.totalBookings || 0,
        totalRevenue: stats.totalRevenue || 0,
      };

      DOM.empty(grid);
      grid.appendChild(createStatCard('Total Events', display.totalEvents, '🎬', 'blue'));
      grid.appendChild(createStatCard('Pending Review', display.pendingReview, '⏳', 'yellow'));
      grid.appendChild(createStatCard('Published', display.publishedEvents, '✅', 'green'));
      grid.appendChild(createStatCard('Users', display.totalUsers, '👥', 'cyan'));
      grid.appendChild(createStatCard('Bookings', display.totalBookings, '🎫', 'blue'));
      if (display.totalRevenue > 0) {
        grid.appendChild(createStatCard('Revenue', display.totalRevenue, '💰', 'green'));
      }
    } catch (err) {
      grid.innerHTML = '';
      grid.appendChild(Components.emptyState('📊', 'No data available', 'Stats will appear once the backend is connected.'));
    }
  }

  function createStatCard(label, value, icon, colorVariant) {
    var card = DOM.el('div', { className: 'stat-card' });
    card.appendChild(DOM.el('div', { className: 'stat-card__icon stat-card__icon--' + (colorVariant || 'blue'), textContent: icon || '📊' }));
    var info = DOM.el('div', { className: 'stat-card__info' });
    info.appendChild(DOM.el('div', { className: 'stat-card__label', textContent: label }));
    info.appendChild(DOM.el('div', { className: 'stat-card__value', textContent: FormatUtil.formatCount(value) }));
    card.appendChild(info);
    return card;
  }

  async function loadRecentTickets() {
    var body = document.getElementById('recentTickets');
    if (!body) return;

    try {
      var response = await AdminDashboardAPI.recentTickets({ limit: 10 });
      var data = response && response.data ? response.data : (response || []);
      var tickets = Array.isArray(data) ? data : (data.data || data.items || []);

      DOM.empty(body);
      if (tickets.length === 0) {
        body.appendChild(Components.emptyState('🎫', 'No tickets yet', 'Recent tickets will appear here.'));
        return;
      }

      var table = DOM.el('table', { className: 'data-table' });
      var thead = DOM.el('thead');
      var headRow = DOM.el('tr');
      ['ID', 'Event', 'User', 'Status', 'Created'].forEach(function (h) {
        headRow.appendChild(DOM.el('th', { textContent: h }));
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      var tbody = DOM.el('tbody');
      tickets.forEach(function (t) {
        var row = DOM.el('tr');
        row.appendChild(DOM.el('td', { textContent: t.id || '—' }));
        row.appendChild(DOM.el('td', { textContent: t.event_title || t.eventName || '—' }));
        row.appendChild(DOM.el('td', { textContent: t.user_name || t.userEmail || '—' }));
        row.appendChild(DOM.el('td', { textContent: Components.badge(t.status || 'unknown', statusVariant(t.status)) }));
        row.appendChild(DOM.el('td', { textContent: t.created_at ? FormatUtil.formatDate(t.created_at) : '—' }));
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      body.appendChild(table);
    } catch (err) {
      body.innerHTML = '';
      body.appendChild(Components.emptyState('🎫', 'Could not load tickets', err.message || 'An error occurred.'));
    }
  }

  function statusVariant(status) {
    if (!status) return 'gray';
    var s = String(status).toLowerCase();
    if (s === 'active' || s === 'confirmed' || s === 'valid') return 'green';
    if (s === 'pending' || s === 'pending_review') return 'yellow';
    if (s === 'cancelled' || s === 'invalid') return 'red';
    return 'blue';
  }

  return Object.freeze({
    render,
  });
})();
