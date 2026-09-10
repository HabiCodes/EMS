/**
 * Media Library page module.
 */

var MediaListPage = (function () {
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
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Media Library' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Global media assets' }));
    header.appendChild(info);
    return header;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });
    var container = DOM.el('div', { className: 'table-container', id: 'mediaTableContainer' });
    container.appendChild(Components.spinner('Loading media…'));
    body.appendChild(container);
    var pagination = DOM.el('div', { className: 'pagination', id: 'mediaPagination' });
    pagination.style.display = 'none';
    body.appendChild(pagination);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('mediaTableContainer');
    var paginationEl = document.getElementById('mediaPagination');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading…'));
    if (paginationEl) paginationEl.style.display = 'none';
    try {
      var params = _pag.getQueryParams();
      var response = await AdminMediaAPI.list(params);
      var data = extractEnvelope(response);
      var items = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      var pag = response.pagination || (data && data.pagination) || {};
      _pag.setTotal(pag.total || items.length);
      renderRows(items, container);
      renderPagination(paginationEl, pag);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load media', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('🖼', 'No media found', 'Upload media through event media or use the upload endpoint.'));
      return;
    }
    var grid = DOM.el('div', { className: 'media-grid', id: 'mediaGrid' });
    items.forEach(function (m) {
      var card = DOM.el('div', { className: 'media-card' });
      var thumb = m.thumbnail_url || m.url || m.data ? '🖼' : '📄';
      card.appendChild(DOM.el('div', { className: 'media-card__thumb', textContent: thumb }));
      var info = DOM.el('div', { className: 'media-card__info' });
      info.appendChild(DOM.el('div', { className: 'media-card__name', textContent: FormatUtil.escHtml(m.file_name || m.name || 'Media ' + m.id) }));
      info.appendChild(DOM.el('div', { className: 'media-card__meta', textContent: m.content_type || m.mime_type || '—' }));
      card.appendChild(info);
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  function renderPagination(container, pag) {
    if (!container || !pag || (!pag.total && !pag.totalPages)) { if (container) container.style.display = 'none'; return; }
    var total = pag.total || 0;
    var totalPages = pag.totalPages || Math.ceil(total / _pag.getState().pageSize);
    if (totalPages <= 1) { container.style.display = 'none'; return; }
    DOM.empty(container);
    container.style.display = 'flex';
    var info = DOM.el('div', { className: 'pagination__info' });
    info.textContent = 'Showing 1–' + FormatUtil.formatCount(total) + ' of ' + FormatUtil.formatCount(total);
    container.appendChild(info);
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({ render });
})();
