/**
 * Refunds List page module.
 */

var RefundsListPage = (function () {
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
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Refunds' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Payment refund management' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'refundsTableContainer' });
    container.appendChild(Components.spinner('Loading refunds…'));
    body.appendChild(container);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('refundsTableContainer');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading…'));
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
    ['ID', 'Payment Order', 'Amount', 'Status', 'Created'].forEach(function (h) {
      headRow.appendChild(DOM.el('th', { textContent: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (r) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: r.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(r.payment_order_id || r.orderId || '—') }));
      row.appendChild(DOM.el('td', { textContent: r.amount || r.refund_amount ? FormatUtil.formatCount(r.amount || r.refund_amount) : '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(r.status || '—', statusVariant(r.status)) }));
      row.appendChild(DOM.el('td', { textContent: r.created_at ? FormatUtil.formatDate(r.created_at) : '—' }));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function statusVariant(status) {
    if (!status) return 'gray';
    var s = String(status).toLowerCase();
    if (s === 'completed' || s === 'success' || s === 'processed') return 'green';
    if (s === 'pending') return 'yellow';
    if (s === 'failed' || s === 'rejected') return 'red';
    return 'blue';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();
