/**
 * Turf Venues List page module.
 */

var TurfListPage = (function () {
  'use strict';

  var _pag = Pagination.create();

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);
    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderFilters());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);
    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Turf Venues' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage all turf grounds and bookings' }));
    header.appendChild(info);
    return header;
  }

  function renderFilters() {
    var bar = DOM.el('div', { className: 'filters-bar' });
    var searchInput = DOM.el('input', { className: 'form-input', type: 'text', placeholder: 'Search venues…', id: 'turfSearch', style: 'min-width:240px;' });
    searchInput.addEventListener('input', DOM.debounce(function () {
      _pag.setFilters({ search: searchInput.value.trim() });
      loadData();
    }, 300));
    bar.appendChild(searchInput);
    return bar;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'turfTableContainer' });
    container.appendChild(Components.spinner('Loading turf venues…'));
    body.appendChild(container);
    var pagination = DOM.el('div', { className: 'pagination', id: 'turfPagination' });
    pagination.style.display = 'none';
    body.appendChild(pagination);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('turfTableContainer');
    var paginationEl = document.getElementById('turfPagination');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading…'));
    if (paginationEl) paginationEl.style.display = 'none';
    try {
      var params = _pag.getQueryParams();
      var response = await AdminAPI.get('/turf/admin/venues' + (params.page || params.pageSize ? '?' + new URLSearchParams(params).toString() : ''));
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      var pag = response.pagination || (data && data.pagination) || {};
      _pag.setTotal(pag.total || items.length);
      renderRows(items, container);
      renderPagination(paginationEl, pag);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load venues', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('⚽', 'No turf venues found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Name', 'Sport', 'City', 'Status', ''].forEach(function (h) {
      headRow.appendChild(DOM.el('th', { textContent: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (v) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: v.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(v.name || v.venue_name || '—') }));
      row.appendChild(DOM.el('td', { textContent: v.sport || v.sport_type || '—' }));
      row.appendChild(DOM.el('td', { textContent: v.city || '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(v.status || (v.is_active !== false ? 'Active' : 'Inactive'), statusVariant(v.status)) }));
      var cell = DOM.el('td', { style: 'white-space:nowrap;' });
      var statusBtn = DOM.el('button', { className: 'btn btn--ghost btn--sm', textContent: 'Toggle Status' });
      statusBtn.addEventListener('click', function () {
        var newStatus = v.status === 'active' ? 'inactive' : 'active';
        AdminAPI.patch('/turf/admin/venues/' + v.id + '/status', { status: newStatus })
          .then(function () { Components.showToast('Venue status updated', 'success'); loadData(); })
          .catch(function (err) { Components.showToast(err.message, 'error'); });
      });
      cell.appendChild(statusBtn);
      row.appendChild(cell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderPagination(container, pag) {
    if (!container || !pag || (!pag.total && !pag.totalPages)) { if (container) container.style.display = 'none'; return; }
    var total = pag.total || 0;
    var totalPages = pag.totalPages || Math.ceil(total / _pag.getState().pageSize);
    if (totalPages <= 1) { container.style.display = 'none'; return; }
    DOM.empty(container);
    container.style.display = 'flex';
    var info = DOM.el('div', { className: 'pagination__info' });
    var state = _pag.getState();
    var start = (state.page - 1) * state.pageSize + 1;
    var end = Math.min(state.page * state.pageSize, total);
    info.textContent = 'Showing ' + start + '–' + end + ' of ' + FormatUtil.formatCount(total);
    container.appendChild(info);
    var controls = DOM.el('div', { className: 'pagination__controls' });
    var prevBtn = DOM.el('button', { className: 'pagination__btn', textContent: '← Prev' });
    prevBtn.disabled = state.page <= 1;
    prevBtn.addEventListener('click', function () { _pag.setPage(state.page - 1); loadData(); });
    controls.appendChild(prevBtn);
    for (var p = 1; p <= Math.min(totalPages, 5); p++) {
      (function (pageNum) {
        var btn = DOM.el('button', { className: 'pagination__btn' + (pageNum === state.page ? ' pagination__btn--active' : ''), textContent: String(pageNum) });
        btn.addEventListener('click', function () { _pag.setPage(pageNum); loadData(); });
        controls.appendChild(btn);
      })(p);
    }
    var nextBtn = DOM.el('button', { className: 'pagination__btn', textContent: 'Next →' });
    nextBtn.disabled = state.page >= totalPages;
    nextBtn.addEventListener('click', function () { _pag.setPage(state.page + 1); loadData(); });
    controls.appendChild(nextBtn);
    container.appendChild(controls);
  }

  function statusVariant(status) {
    if (!status) return 'gray';
    var s = String(status).toLowerCase();
    if (s === 'active') return 'green';
    if (s === 'inactive' || s === 'suspended') return 'red';
    if (s === 'pending') return 'yellow';
    return 'gray';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();
