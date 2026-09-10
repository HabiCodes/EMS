/**
 * Generic list page base.
 *
 * Provides common CRUD operations for list pages.
 */

const ListPageBase = (function () {
  'use strict';

  function createPage(config) {
    return (function () {
      'use strict';

      var _pag = Pagination.create();
      var _filters = {};
      var _api = config.api;
      var _columns = config.columns || [];
      var _title = config.title || 'List';

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
        info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: _title }));
        info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: config.subtitle || '' }));
        header.appendChild(info);

        if (config.canCreate) {
          var actions = DOM.el('div', { className: 'page-header__actions' });
          var createBtn = DOM.el('button', { className: 'btn btn--primary', textContent: '+ New ' + config.singular });
          createBtn.addEventListener('click', function () {
            Components.showToast('Create form not yet implemented for ' + _title, 'warning');
          });
          actions.appendChild(createBtn);
          header.appendChild(actions);
        }

        return header;
      }

      function renderFilters() {
        if (!config.filters) return DOM.el('div');
        var bar = DOM.el('div', { className: 'filters-bar' });

        config.filters.forEach(function (f) {
          var group = DOM.el('div', { className: 'form-group' });

          if (f.type === 'search') {
            group.appendChild(DOM.el('label', { className: 'form-label', textContent: f.label || 'Search' }));
            var input = DOM.el('input', {
              className: 'form-input',
              type: 'text',
              placeholder: f.placeholder || 'Search…',
            });
            input.addEventListener('input', DOM.debounce(function () {
              _filters[f.key] = input.value.trim();
              _pag.setFilters(_filters);
              loadData();
            }, 300));
            group.appendChild(input);
          } else if (f.type === 'select') {
            group.appendChild(DOM.el('label', { className: 'form-label', textContent: f.label || f.key }));
            var select = DOM.el('select', { className: 'form-select' });
            if (f.placeholder) select.appendChild(DOM.el('option', { value: '', textContent: f.placeholder }));
            (f.options || []).forEach(function (opt) {
              select.appendChild(DOM.el('option', { value: opt.value || opt, textContent: opt.label || opt }));
            });
            select.addEventListener('change', function () {
              _filters[f.key] = select.value;
              _pag.setFilters(_filters);
              loadData();
            });
            group.appendChild(select);
          }

          bar.appendChild(group);
        });

        return bar;
      }

      function renderTable() {
        var card = DOM.el('div', { className: 'card' });
        var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });

        var container = DOM.el('div', { className: 'table-container', id: 'tableContainer_' + config.id });
        container.appendChild(Components.spinner('Loading…'));
        body.appendChild(container);

        var pagination = DOM.el('div', { className: 'pagination', id: 'pagination_' + config.id });
        pagination.style.display = 'none';
        body.appendChild(pagination);

        card.appendChild(body);
        return card;
      }

      async function loadData() {
        var container = document.getElementById('tableContainer_' + config.id);
        var paginationEl = document.getElementById('pagination_' + config.id);
        if (!container) return;

        container.innerHTML = '';
        container.appendChild(Components.spinner('Loading…'));
        if (paginationEl) paginationEl.style.display = 'none';

        try {
          var params = _pag.getQueryParams();
          var response = await _api.list(params);
          var list = response && response.data ? response.data : (response || []);
          var items = Array.isArray(list) ? list : (list.data || list.items || []);
          var pag = response.pagination || (list.pagination) || {};

          _pag.setTotal(pag.total || items.length);
          if (pag.page) _pag.setPage(pag.page);
          if (pag.pageSize) _pag.setPageSize(pag.pageSize);

          renderRows(items, container);
          renderPagination(paginationEl);
        } catch (err) {
          container.innerHTML = '';
          container.appendChild(Components.errorState(err.message || 'Failed to load data', loadData));
        }
      }

      function renderRows(items, container) {
        DOM.empty(container);

        if (items.length === 0) {
          container.appendChild(Components.emptyState(
            config.emptyIcon || '📭',
            config.emptyTitle || 'No records found',
            config.emptyText || 'No items match your current filters.'
          ));
          return;
        }

        var table = DOM.el('table', { className: 'data-table' });

        // Header
        var thead = DOM.el('thead');
        var headRow = DOM.el('tr');
        _columns.forEach(function (col) {
          var th = DOM.el('th', { textContent: col.label });
          if (col.sortable) {
            th.style.cursor = 'pointer';
            th.addEventListener('click', function () {
              var key = col.key;
              var current = _pag.getState().sortBy;
              var dir = (current === key && _pag.getState().sortDir === 'asc') ? 'desc' : 'asc';
              _pag.setSort(key, dir);
              loadData();
            });
          }
          headRow.appendChild(th);
        });
        if (config.hasActions) headRow.appendChild(DOM.el('th', { textContent: 'Actions' }));
        thead.appendChild(headRow);
        table.appendChild(thead);

        // Body
        var tbody = DOM.el('tbody');
        items.forEach(function (item) {
          var row = DOM.el('tr');
          _columns.forEach(function (col) {
            var val = col.key.split('.').reduce(function (o, k) { return o && o[k]; }, item);
            if (col.formatter) val = col.formatter(val, item);
            row.appendChild(DOM.el('td', { textContent: val != null ? String(val) : '—' }));
          });
          if (config.hasActions) {
            var cell = DOM.el('td', { style: 'white-space:nowrap;' });
            if (config.actions) {
              config.actions.forEach(function (act) {
                var btn = DOM.el('button', {
                  className: 'btn btn--ghost btn--sm',
                  textContent: act.label,
                });
                btn.addEventListener('click', function () { act.handler(item); });
                cell.appendChild(btn);
              });
            }
            row.appendChild(cell);
          }
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
            var btn = DOM.el('button', {
              className: 'pagination__btn' + (pageNum === state.page ? ' pagination__btn--active' : ''),
              textContent: String(pageNum),
            });
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

      return Object.freeze({ render });
    })();
  }

  return Object.freeze({ createPage });
})();
