/**
 * Placeholder page modules.
 * Each module exports a render function compatible with AdminShell.
 * These will be expanded with full CRUD as we progress.
 */

// Organizations
var OrganizationsListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Organizations' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage event organizations' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'orgTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('orgTable');
    if (!container) return;
    try {
      var response = await AdminOrganizationsAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load organizations', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('🏢', 'No organizations found', 'Organizations will appear here once they register.'));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Name', 'Status', 'Created'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (org) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: org.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(org.name || 'Unnamed') }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(org.status || org.isActive ? 'Active' : 'Inactive', org.status === 'suspended' ? 'red' : 'green') }));
      row.appendChild(DOM.el('td', { textContent: org.created_at ? FormatUtil.formatDate(org.created_at) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Managers
var ManagersListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Managers' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Admin team management (read-only)' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'managersTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('managersTable');
    if (!container) return;
    try {
      var response = await AdminManagersAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load managers', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('👤', 'No managers found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Name', 'Email', 'Role', 'Status'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (mgr) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: mgr.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(mgr.name || '—') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(mgr.email || '—') }));
      row.appendChild(DOM.el('td', { textContent: mgr.role || 'manager' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(mgr.isActive ? 'Active' : 'Inactive', mgr.isActive ? 'green' : 'gray') }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Movies
var MoviesListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Movies' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage movie catalog' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'moviesTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('moviesTable');
    if (!container) return;
    try {
      var response = await AdminMoviesAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load movies', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('🎞', 'No movies found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Title', 'Language', 'Duration', 'Status', 'Featured'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (movie) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: movie.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(movie.title || movie.originalTitle || 'Untitled') }));
      row.appendChild(DOM.el('td', { textContent: movie.language || '—' }));
      row.appendChild(DOM.el('td', { textContent: movie.durationMinutes ? movie.durationMinutes + ' min' : '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(movie.status || '—', statusVariant(movie.status)) }));
      row.appendChild(DOM.el('td', { textContent: movie.isFeatured ? '⭐' : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function statusVariant(status) {
    var s = (status || '').toLowerCase();
    if (s === 'now_showing') return 'green';
    if (s === 'coming_soon') return 'yellow';
    if (s === 'ended') return 'gray';
    return 'blue';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Showtimes
var ShowtimesListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Showtimes' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage cinema showtimes and pricing' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'showtimesTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('showtimesTable');
    if (!container) return;
    try {
      var response = await AdminShowtimesAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load showtimes', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('🕐', 'No showtimes found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Movie', 'Cinema', 'Screen', 'Date', 'Time', 'Price Cap'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (st) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: st.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: st.movieTitle || st.movie_id || '—' }));
      row.appendChild(DOM.el('td', { textContent: st.cinemaName || st.cinema_id || '—' }));
      row.appendChild(DOM.el('td', { textContent: st.screenName || st.screenNumber || '—' }));
      row.appendChild(DOM.el('td', { textContent: st.showDate ? FormatUtil.formatDate(st.showDate) : '—' }));
      row.appendChild(DOM.el('td', { textContent: st.showTime ? FormatUtil.formatTime(st.showTime) : '—' }));
      row.appendChild(DOM.el('td', { textContent: st.priceCap != null ? MoneyUtil.formatINR(MoneyUtil.paiseToRupees(st.priceCap)) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Turf Venues
var TurfListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Turf Venues' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage turf venue approvals and settings' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'turfTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('turfTable');
    if (!container) return;
    try {
      var response = await AdminTurfAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load venues', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('⚽', 'No venues found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Venue', 'Type', 'City', 'Sport', 'Status', 'Price/hr'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (venue) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: venue.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(venue.venueName || 'Unnamed') }));
      row.appendChild(DOM.el('td', { textContent: venue.venueType || '—' }));
      row.appendChild(DOM.el('td', { textContent: venue.city || '—' }));
      row.appendChild(DOM.el('td', { textContent: venue.sportType || '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(venue.status || 'unknown', turfStatusVariant(venue.status)) }));
      row.appendChild(DOM.el('td', { textContent: venue.bookingPricePerHour != null ? MoneyUtil.formatINR(MoneyUtil.paiseToRupees(venue.bookingPricePerHour)) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function turfStatusVariant(status) {
    var s = (status || '').toLowerCase();
    if (s === 'approved') return 'green';
    if (s === 'pending') return 'yellow';
    if (s === 'suspended') return 'red';
    return 'gray';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Media Library
var MediaListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Media Library' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Global media asset management' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'mediaTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('mediaTable');
    if (!container) return;
    try {
      var response = await AdminMediaAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load media', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('🖼', 'No media files found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Filename', 'Type', 'Size', 'Uploaded'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (m) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: m.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(m.fileName || m.file_name || '—') }));
      row.appendChild(DOM.el('td', { textContent: m.contentType || m.content_type || '—' }));
      row.appendChild(DOM.el('td', { textContent: m.fileSize ? FormatUtil.formatCount(m.fileSize) + ' B' : '—' }));
      row.appendChild(DOM.el('td', { textContent: m.createdAt ? FormatUtil.formatDate(m.createdAt) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Banners
var BannersListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Banners' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage promotional banners' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'bannersTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('bannersTable');
    if (!container) return;
    try {
      var response = await AdminBannersAPI.list({ page: 1, page_size: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load banners', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('📢', 'No banners found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Title', 'Position', 'Status', 'Active', 'Updated'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (b) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: b.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(b.title || 'Untitled') }));
      row.appendChild(DOM.el('td', { textContent: b.position || '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(b.status || '—', 'blue') }));
      row.appendChild(DOM.el('td', { textContent: b.isActive ? '✅' : '❌' }));
      row.appendChild(DOM.el('td', { textContent: b.updatedAt ? FormatUtil.formatDate(b.updatedAt) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Promotion Packages
var PromotionPackagesPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Promotion Packages' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage ad packages available for purchase' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'pkgTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('pkgTable');
    if (!container) return;
    try {
      var response = await AdminPromotionPackagesAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load packages', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('📦', 'No packages found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Name', 'Price', 'Validity', 'Max Events', 'Popular', 'Active'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (pkg) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: pkg.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(pkg.packageName || pkg.displayName || '—') }));
      row.appendChild(DOM.el('td', { textContent: pkg.priceInPaise != null ? MoneyUtil.formatINR(MoneyUtil.paiseToRupees(pkg.priceInPaise)) : '—' }));
      row.appendChild(DOM.el('td', { textContent: pkg.validityDays ? pkg.validityDays + ' days' : '—' }));
      row.appendChild(DOM.el('td', { textContent: pkg.maxEvents || '—' }));
      row.appendChild(DOM.el('td', { textContent: pkg.isPopular ? '⭐' : '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(pkg.isActive ? 'Active' : 'Inactive', pkg.isActive ? 'green' : 'gray') }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Promotion Campaigns
var PromotionCampaignsPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Campaigns' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage promotional campaigns' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'campaignsTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('campaignsTable');
    if (!container) return;
    try {
      var response = await AdminPromotionCampaignsAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load campaigns', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('📊', 'No campaigns found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Campaign', 'Package', 'Status', 'Budget', 'Spent', 'Remaining', 'Updated'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (c) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: c.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(c.campaignName || '—') }));
      row.appendChild(DOM.el('td', { textContent: c.packageName || c.package_id || '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(c.status || '—', campaignStatusVariant(c.status)) }));
      row.appendChild(DOM.el('td', { textContent: c.budgetInPaise != null ? MoneyUtil.formatINR(MoneyUtil.paiseToRupees(c.budgetInPaise)) : '—' }));
      row.appendChild(DOM.el('td', { textContent: c.spendInPaise != null ? MoneyUtil.formatINR(MoneyUtil.paiseToRupees(c.spendInPaise)) : '—' }));
      row.appendChild(DOM.el('td', { textContent: c.remainingBudgetInPaise != null ? MoneyUtil.formatINR(MoneyUtil.paiseToRupees(c.remainingBudgetInPaise)) : '—' }));
      row.appendChild(DOM.el('td', { textContent: c.updatedAt ? FormatUtil.formatDate(c.updatedAt) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function campaignStatusVariant(status) {
    var s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return 'green';
    if (s === 'DRAFT' || s === 'PENDING_PAYMENT') return 'yellow';
    if (s === 'PAUSED') return 'cyan';
    if (s === 'EXPIRED' || s === 'CANCELLED' || s === 'REJECTED' || s === 'DEPLETED' || s === 'REFUNDED') return 'red';
    return 'gray';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Users
var UsersListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Users' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Platform user management' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'usersTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('usersTable');
    if (!container) return;
    try {
      var response = await AdminUsersAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load users', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('👥', 'No users found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Name', 'Email', 'Status', 'Registered'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (u) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: u.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(u.name || u.username || '—') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(u.email || '—') }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(u.isActive ? 'Active' : (u.isBanned ? 'Banned' : 'Inactive'), u.isBanned ? 'red' : (u.isActive ? 'green' : 'gray')) }));
      row.appendChild(DOM.el('td', { textContent: u.createdAt ? FormatUtil.formatDate(u.createdAt) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Bookings
var BookingsListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Bookings' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Unified booking management' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'bookingsTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('bookingsTable');
    if (!container) return;
    try {
      var response = await AdminBookingsAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load bookings', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('🎫', 'No bookings found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Event', 'User', 'Amount', 'Status', 'Date'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (b) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: b.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: b.eventName || b.eventTitle || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(b.userName || b.userEmail || '—') }));
      row.appendChild(DOM.el('td', { textContent: b.totalAmount != null ? MoneyUtil.formatINR(MoneyUtil.paiseToRupees(b.totalAmount)) : '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(b.status || '—', bookingStatusVariant(b.status)) }));
      row.appendChild(DOM.el('td', { textContent: b.createdAt ? FormatUtil.formatDate(b.createdAt) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function bookingStatusVariant(status) {
    var s = (status || '').toLowerCase();
    if (s === 'confirmed') return 'green';
    if (s === 'pending') return 'yellow';
    if (s === 'cancelled' || s === 'refunded') return 'red';
    return 'blue';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Refunds
var RefundsListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Refunds' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage refund requests' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'refundsTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('refundsTable');
    if (!container) return;
    try {
      var response = await AdminRefundsAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load refunds', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('💸', 'No refunds found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Booking', 'User', 'Amount', 'Status', 'Requested'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (r) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: r.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: r.bookingId || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(r.userName || r.userEmail || '—') }));
      row.appendChild(DOM.el('td', { textContent: r.amount != null ? MoneyUtil.formatINR(MoneyUtil.paiseToRupees(r.amount)) : '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(r.status || '—', refundStatusVariant(r.status)) }));
      row.appendChild(DOM.el('td', { textContent: r.createdAt ? FormatUtil.formatDate(r.createdAt) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function refundStatusVariant(status) {
    var s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'processed') return 'green';
    if (s === 'pending') return 'yellow';
    if (s === 'rejected') return 'red';
    return 'blue';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Admin Team
var TeamListPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderInfo());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Admin Team' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Super admin team members (read-only)' }));
    header.appendChild(info);
    return header;
  }

  function renderInfo() {
    var card = DOM.el('div', { className: 'card card--flat', style: 'margin-bottom:16px;padding:12px 16px;background:#fef3c7;border-color:#fde68a;' });
    card.appendChild(DOM.el('p', { style: 'font-size:13px;color:#92400e;margin:0;', textContent: 'ℹ️ Admin team management is read-only. Use the Managers section to manage sub-admin accounts.' }));
    return card;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'teamTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('teamTable');
    if (!container) return;
    try {
      var response = await AdminTeamAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load team', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('🛡', 'No team members found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Name', 'Email', 'Role', 'Permissions', 'Last Active'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (member) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: member.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(member.name || '—') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(member.email || '—') }));
      row.appendChild(DOM.el('td', { textContent: member.role || 'admin' }));
      row.appendChild(DOM.el('td', { textContent: member.permissions ? Object.keys(member.permissions).join(', ') : '—' }));
      row.appendChild(DOM.el('td', { textContent: member.lastActive ? FormatUtil.formatDate(member.lastActive) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();

// Audit Logs
var AuditLogsPage = (function () {
  'use strict';

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Audit Logs' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'System activity and change tracking' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'auditTable' });
    container.appendChild(Components.spinner('Loading…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('auditTable');
    if (!container) return;
    try {
      var response = await AdminAuditLogsAPI.list({ page: 1, pageSize: 50 });
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      renderRows(items, container);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load audit logs', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('📋', 'No audit logs found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Actor', 'Action', 'Target', 'IP', 'Timestamp'].forEach(function (h) { headRow.appendChild(DOM.el('th', { textContent: h })); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (log) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: log.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(log.actorName || log.actorEmail || log.actor_id || '—') }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(log.action || '—', 'gray') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(log.targetType + ' ' + (log.targetId || '')) }));
      row.appendChild(DOM.el('td', { textContent: log.ipAddress || '—' }));
      row.appendChild(DOM.el('td', { textContent: log.timestamp ? FormatUtil.formatDateTime(log.timestamp) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();
