/**
 * Banners List page module.
 */

var BannersListPage = (function () {
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
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Banners' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage promotional banners and ads' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'bannersTableContainer' });
    container.appendChild(Components.spinner('Loading banners…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('bannersTableContainer');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading…'));
    try {
      var response = await AdminBannersAPI.list({ page: 1, pageSize: 50 });
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
      container.appendChild(Components.emptyState('📢', 'No banners found', 'Banners will appear here once configured.'));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Title', 'Type', 'Status', 'Actions'].forEach(function (h) {
      headRow.appendChild(DOM.el('th', { textContent: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (b) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: b.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(b.title || b.name || '—') }));
      row.appendChild(DOM.el('td', { textContent: b.type || b.banner_type || '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(b.is_active !== false ? 'Active' : 'Inactive', b.is_active !== false ? 'green' : 'gray') }));
      var cell = DOM.el('td', { style: 'white-space:nowrap;' });
      var toggleBtn = DOM.el('button', { className: 'btn btn--ghost btn--sm', textContent: b.is_active !== false ? 'Deactivate' : 'Activate' });
      toggleBtn.addEventListener('click', function () {
        var apiFn = b.is_active !== false ? AdminBannersAPI.deactivate : AdminBannersAPI.activate;
        apiFn(b.id).then(function () {
          Components.showToast('Banner updated', 'success');
          loadData();
        }).catch(function (err) { Components.showToast(err.message, 'error'); });
      });
      cell.appendChild(toggleBtn);
      row.appendChild(cell);
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
