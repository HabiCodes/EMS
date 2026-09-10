/**
 * Managers List page module — Super Admin.
 *
 * Lists all managers across organizations with create, edit, deactivate/reactivate.
 */

var ManagersListPage = (function () {
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
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Managers' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage organizer managers across all organizations' }));
    header.appendChild(info);
    var actions = DOM.el('div', { className: 'page-header__actions' });
    var createBtn = DOM.el('button', { className: 'btn btn--primary', textContent: '+ New Manager' });
    createBtn.addEventListener('click', function () { openEditModal(null); });
    actions.appendChild(createBtn);
    header.appendChild(actions);
    return header;
  }

  function renderFilters() {
    var bar = DOM.el('div', { className: 'filters-bar' });
    var searchInput = DOM.el('input', { className: 'form-input', type: 'text', placeholder: 'Search managers…', id: 'mgrSearch', style: 'min-width:240px;' });
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
    var container = DOM.el('div', { className: 'table-container', id: 'managersTableContainer' });
    container.appendChild(Components.spinner('Loading managers…'));
    body.appendChild(container);
    var pagination = DOM.el('div', { className: 'pagination', id: 'managersPagination' });
    pagination.style.display = 'none';
    body.appendChild(pagination);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('managersTableContainer');
    var paginationEl = document.getElementById('managersPagination');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading…'));
    if (paginationEl) paginationEl.style.display = 'none';
    try {
      var params = _pag.getQueryParams();
      var response = await AdminManagersAPI.list(params);
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
      container.appendChild(Components.errorState(err.message || 'Failed to load managers', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('👤', 'No managers found', 'Create your first manager to get started.'));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Name', 'Email', 'Role', 'Organization', 'Status', 'Actions'].forEach(function (h) {
      headRow.appendChild(DOM.el('th', { textContent: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (m) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: m.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(m.name || '—') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(m.email || '—') }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(m.role || 'manager', 'blue') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(m.organization_name || m.organization_id || '—') }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(m.is_active !== false ? 'Active' : 'Inactive', m.is_active !== false ? 'green' : 'red') }));
      var cell = DOM.el('td', { style: 'white-space:nowrap;' });
      var editBtn = DOM.el('button', { className: 'btn btn--ghost btn--sm', textContent: 'Edit' });
      editBtn.addEventListener('click', function () { openEditModal(m.id); });
      cell.appendChild(editBtn);
      if (m.is_active !== false) {
        var deactBtn = DOM.el('button', { className: 'btn btn--ghost btn--sm', textContent: 'Deactivate' });
        deactBtn.addEventListener('click', function () {
          Components.confirmDialog('Deactivate Manager', 'Deactivate "' + FormatUtil.escHtml(m.name) + '"?', function () {
            AdminManagersAPI.deactivate(m.id).then(function () {
              Components.showToast('Manager deactivated', 'success');
              loadData();
            }).catch(function (err) { Components.showToast(err.message, 'error'); });
          });
        });
        cell.appendChild(deactBtn);
      } else {
        var actBtn = DOM.el('button', { className: 'btn btn--ghost btn--sm', textContent: 'Reactivate' });
        actBtn.addEventListener('click', function () {
          AdminManagersAPI.reactivate(m.id).then(function () {
            Components.showToast('Manager reactivated', 'success');
            loadData();
          }).catch(function (err) { Components.showToast(err.message, 'error'); });
        });
        cell.appendChild(actBtn);
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

  function openEditModal(mgrId) {
    var isEdit = !!mgrId;
    var title = isEdit ? 'Edit Manager' : 'New Manager';
    var content = DOM.el('form', { id: 'mgrForm' });
    var fields = [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'organization_id', label: 'Organization ID', type: 'text', required: true },
    ];
    fields.forEach(function (f) {
      var group = DOM.el('div', { className: 'form-group' });
      group.appendChild(DOM.el('label', { className: 'form-label' + (f.required ? ' required' : ''), textContent: f.label }));
      var input = DOM.el('input', { className: 'form-input', type: f.type, name: f.name, placeholder: f.placeholder || '' });
      if (f.required) input.setAttribute('required', '');
      group.appendChild(input);
      content.appendChild(group);
    });
    var footerEl = DOM.el('div', { style: 'display:flex;gap:8px;justify-content:flex-end;' });
    var cancelBtn = DOM.el('button', { className: 'btn btn--secondary', type: 'button', textContent: 'Cancel' });
    cancelBtn.addEventListener('click', function () { AdminShell.closeModal(); });
    var submitBtn = DOM.el('button', { className: 'btn btn--primary', type: 'submit', textContent: isEdit ? 'Update' : 'Create' });
    footerEl.appendChild(cancelBtn);
    footerEl.appendChild(submitBtn);
    content.appendChild(footerEl);
    content.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(content);
      var data = {};
      fd.forEach(function (v, k) { data[k] = v; });
      if (isEdit) {
        AdminManagersAPI.update(mgrId, data).then(function () {
          Components.showToast('Manager updated', 'success');
          AdminShell.closeModal();
          loadData();
        }).catch(function (err) { Components.showToast(err.message, 'error'); });
      } else {
        AdminManagersAPI.create(data).then(function (result) {
          Components.showToast('Manager created' + (result.data && result.data.temp_password ? ' (temp password provided)' : ''), 'success');
          AdminShell.closeModal();
          loadData();
        }).catch(function (err) { Components.showToast(err.message, 'error'); });
      }
    });
    if (isEdit) {
      AdminManagersAPI.get(mgrId).then(function (resp) {
        var data = resp.data || resp;
        var inputs = content.querySelectorAll('input');
        inputs.forEach(function (input) {
          var key = input.getAttribute('name');
          if (data[key] !== undefined) input.value = data[key];
        });
        AdminShell.openModal(title, content, footerEl);
      }).catch(function (err) { Components.showToast(err.message, 'error'); });
    } else {
      AdminShell.openModal(title, content, footerEl);
    }
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();
