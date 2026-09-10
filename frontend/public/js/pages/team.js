/**
 * Admin Team page module.
 * Lists all admin accounts with their roles and permissions.
 */

var TeamListPage = (function () {
  'use strict';

  var _pag = Pagination.create();

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
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Admin Team' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage platform administrators' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'teamTableContainer' });
    container.appendChild(Components.spinner('Loading team…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('teamTableContainer');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading…'));
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
      container.appendChild(Components.emptyState('🛡', 'No admins found', ''));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Name', 'Email', 'Role', 'Status', 'Permissions'].forEach(function (h) {
      headRow.appendChild(DOM.el('th', { textContent: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (a) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: a.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(a.name || '—') }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(a.email || '—') }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(a.role || 'admin', roleVariant(a.role)) }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(a.isActive !== false ? 'Active' : 'Inactive', a.isActive !== false ? 'green' : 'gray') }));
      var perms = a.permissions;
      var permCount = perms ? Object.keys(perms).filter(function (k) { return perms[k]; }).length : 0;
      row.appendChild(DOM.el('td', { textContent: permCount + ' granted' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function roleVariant(role) {
    if (!role) return 'gray';
    if (role === 'super_admin') return 'red';
    if (role === 'admin') return 'blue';
    return 'gray';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();
