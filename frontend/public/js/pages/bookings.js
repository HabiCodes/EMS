/**
 * Bookings List page module.
 */

var BookingsListPage = (function () {
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
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Bookings' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'All platform bookings' }));
    header.appendChild(info);
    return header;
  }

  function renderFilters() {
    var bar = DOM.el('div', { className: 'filters-bar' });
    var searchInput = DOM.el('input', { className: 'form-input', type: 'text', placeholder: 'Search bookings…', id: 'bookingSearch', style: 'min-width:240px;' });
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
    var container = DOM.el('div', { className: 'table-container', id: 'bookingsTableContainer' });
    container.appendChild(Components.spinner('Loading bookings…'));
    body.appendChild(container);
    var pagination = DOM.el('div', { className: 'pagination', id: 'bookingsPagination' });
    pagination.style.display = 'none';
    body.appendChild(pagination);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('bookingsTableContainer');
    var paginationEl = document.getElementById('bookingsPagination');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading bookings…'));
    if (paginationEl) paginationEl.style.display = 'none';
    try {
      var params = _pag.getQueryParams();
      var response = await AdminBookingsAPI.list(params);
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      var pag = response.pagination || (data && data.pagination) || {};
      _pag.setTotal(pag.total || items.length);
      if (pag.page) _pag.setPage(pag.page);
      if (pag.pageSize) _pag.setPageSize(pag.pageSize);
      renderRows(items, container);
      renderPagination(paginationEl);
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
    ['ID', 'Type', 'Event/Title', 'User', 'Amount', 'Status', 'Created', ''].forEach(function (h) {
      headRow.appendChild(DOM.el('th', { textContent: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (b) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: b.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(b.type || 'event', 'gray') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(b.event_title || b.title || b.ground_name || '—') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(b.user_email || b.user_name || '—') }));
      row.appendChild(DOM.el('td', { textContent: b.amount || b.total_amount ? FormatUtil.formatCount(b.amount || b.total_amount) : '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(b.status || 'unknown', statusVariant(b.status)) }));
      row.appendChild(DOM.el('td', { textContent: b.created_at ? FormatUtil.formatDate(b.created_at) : '—' }));
      var cell = DOM.el('td', { style: 'white-space:nowrap;' });
      if (b.status !== 'cancelled') {
        var cancelBtn = DOM.el('button', { className: 'btn btn--ghost btn--sm', textContent: 'Cancel' });
        cancelBtn.addEventListener('click', function () {
          Components.confirmDialog('Cancel Booking', 'Are you sure you want to cancel this booking?', function () {
            AdminBookingsAPI.cancel(b.id, { reason: 'Admin cancelled' }).then(function () {
              Components.showToast('Booking cancelled', 'success');
              loadData();
            }).catch(function (err) { Components.showToast(err.message, 'error'); });
          });
        });
        cell.appendChild(cancelBtn);
      }
      row.appendChild(cell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderPagination(container) {
    if (!container) return;
    var state = _pag.getState();
    var totalPages = state.totalPages || Math.ceil((state.total || 0) / state.pageSize);
    if (totalPages <= 1) { container.style.display = 'none'; return; }
    DOM.empty(container);
    container.style.display = 'flex';
    var info = DOM.el('div', { className: 'pagination__info' });
    var start = (state.page - 1) * state.pageSize + 1;
    var end = Math.min(state.page * state.pageSize, state.total);
    info.textContent = 'Showing ' + start + '–' + end + ' of ' + FormatUtil.formatCount(state.total);
    container.appendChild(info);
    var controls = DOM.el('div', { className: 'pagination__controls' });
    var prevBtn = DOM.el('button', { className: 'pagination__btn', textContent: '← Prev' });
    prevBtn.disabled = state.page <= 1;
    prevBtn.addEventListener('click', function () { _pag.setPage(state.page - 1); loadData(); });
    controls.appendChild(prevBtn);
    var maxVisible = 5;
    var sp = Math.max(1, state.page - Math.floor(maxVisible / 2));
    var ep = Math.min(totalPages, sp + maxVisible - 1);
    if (ep - sp < maxVisible - 1) sp = Math.max(1, ep - maxVisible + 1);
    for (var p = sp; p <= ep; p++) {
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
    if (s === 'confirmed' || s === 'completed' || s === 'paid') return 'green';
    if (s === 'pending' || s === 'pending_payment') return 'yellow';
    if (s === 'cancelled' || s === 'failed') return 'red';
    return 'blue';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();
