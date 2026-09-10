/**
 * Users List page module.
 */

var UsersListPage = (function () {
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
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Users' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Registered platform users' }));
    header.appendChild(info);
    return header;
  }

  function renderFilters() {
    var bar = DOM.el('div', { className: 'filters-bar' });
    var searchInput = DOM.el('input', { className: 'form-input', type: 'text', placeholder: 'Search users…', id: 'userSearch', style: 'min-width:240px;' });
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
    var container = DOM.el('div', { className: 'table-container', id: 'usersTableContainer' });
    container.appendChild(Components.spinner('Loading users…'));
    body.appendChild(container);
    var pagination = DOM.el('div', { className: 'pagination', id: 'usersPagination' });
    pagination.style.display = 'none';
    body.appendChild(pagination);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('usersTableContainer');
    var paginationEl = document.getElementById('usersPagination');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading users…'));
    if (paginationEl) paginationEl.style.display = 'none';
    try {
      var params = _pag.getQueryParams();
      var response = await AdminUsersAPI.list(params);
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
    ['ID', 'Email', 'Username', 'Verified', 'Phone', 'Actions'].forEach(function (h) {
      headRow.appendChild(DOM.el('th', { textContent: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (u) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: u.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(u.email || '—') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(u.username || '—') }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(u.isVerified ? 'Verified' : 'Unverified', u.isVerified ? 'green' : 'yellow') }));
      row.appendChild(DOM.el('td', { textContent: u.phone || '—' }));
      var cell = DOM.el('td', { style: 'white-space:nowrap;' });
      var viewBtn = DOM.el('button', { className: 'btn btn--ghost btn--sm', textContent: 'View' });
      viewBtn.addEventListener('click', function () { openUserDetail(u.id); });
      cell.appendChild(viewBtn);
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

  function openUserDetail(userId) {
    AdminUsersAPI.get(userId).then(function (resp) {
      var u = resp.data || resp;
      var details = DOM.el('div');
      var rows = [
        ['Email', u.email], ['Username', u.username], ['Phone', u.phone],
        ['Verified', u.isVerified ? 'Yes' : 'No'], ['User ID', u.id],
      ];
      rows.forEach(function (r) {
        var row = DOM.el('div', { style: 'display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;' });
        row.appendChild(DOM.el('span', { style: 'font-weight:500;color:#666;', textContent: r[0] }));
        row.appendChild(DOM.el('span', { style: 'font-weight:500;', textContent: r[1] || '—' }));
        details.appendChild(row);
      });
      var closeBtn = DOM.el('button', { className: 'btn btn--secondary', textContent: 'Close' });
      closeBtn.addEventListener('click', function () { AdminShell.closeModal(); });
      AdminShell.openModal('User Details', details, closeBtn);
    }).catch(function (err) {
      Components.showToast(err.message || 'Failed to load user', 'error');
    });
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();
