/**
 * Movies List page module.
 *
 * Features: filters (search, genre, language, featured), sortable table,
 * pagination, create/edit modal, publish/archive actions.
 */

var MoviesListPage = (function () {
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
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Movies' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage movie catalogue' }));
    header.appendChild(info);
    var actions = DOM.el('div', { className: 'page-header__actions' });
    var createBtn = DOM.el('button', { className: 'btn btn--primary', textContent: '+ New Movie' });
    createBtn.addEventListener('click', function () { openEditModal(null); });
    actions.appendChild(createBtn);
    header.appendChild(actions);
    return header;
  }

  function renderFilters() {
    var bar = DOM.el('div', { className: 'filters-bar' });
    var searchInput = DOM.el('input', { className: 'form-input', type: 'text', placeholder: 'Search movies…', id: 'movieSearch', style: 'min-width:240px;' });
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
    var container = DOM.el('div', { className: 'table-container', id: 'moviesTableContainer' });
    container.appendChild(Components.spinner('Loading movies…'));
    body.appendChild(container);
    var pagination = DOM.el('div', { className: 'pagination', id: 'moviesPagination' });
    pagination.style.display = 'none';
    body.appendChild(pagination);
    card.appendChild(body);
    return card;
  }

  async function loadData() {
    var container = document.getElementById('moviesTableContainer');
    var paginationEl = document.getElementById('moviesPagination');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading movies…'));
    if (paginationEl) paginationEl.style.display = 'none';
    try {
      var params = _pag.getQueryParams();
      var response = await AdminMoviesAPI.list(params);
      var list = MovieMapper.normalizeList(response);
      var items = list.items;
      var pag = response.pagination || list.pagination || {};
      _pag.setTotal(pag.total || items.length);
      if (pag.page) _pag.setPage(pag.page);
      if (pag.pageSize) _pag.setPageSize(pag.pageSize);
      renderRows(items, container);
      renderPagination(paginationEl);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load movies', loadData));
    }
  }

  function renderRows(items, container) {
    DOM.empty(container);
    if (items.length === 0) {
      container.appendChild(Components.emptyState('🎞', 'No movies found', 'Add a new movie or adjust your filters.'));
      return;
    }
    var table = DOM.el('table', { className: 'data-table' });
    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    ['ID', 'Title', 'Genre', 'Language', 'Duration', 'Rating', 'Status', ''].forEach(function (h) {
      headRow.appendChild(DOM.el('th', { textContent: h }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DOM.el('tbody');
    items.forEach(function (m) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: m.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(m.title || m.originalTitle || '—') }));
      row.appendChild(DOM.el('td', { textContent: m.genre || '—' }));
      row.appendChild(DOM.el('td', { textContent: m.language || '—' }));
      row.appendChild(DOM.el('td', { textContent: m.durationMinutes ? m.durationMinutes + ' min' : '—' }));
      row.appendChild(DOM.el('td', { textContent: m.imdbRating || m.certification || '—' }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(m.status || (m.isActive !== false ? 'Active' : 'Inactive'), statusVariant(m.status)) }));
      var cell = DOM.el('td', { style: 'white-space:nowrap;' });
      var viewBtn = DOM.el('button', { className: 'btn btn--ghost btn--sm', textContent: 'View' });
      viewBtn.addEventListener('click', function () { openEditModal(m.id); });
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

  function statusVariant(status) {
    if (!status) return 'gray';
    var s = String(status).toLowerCase();
    if (s === 'active' || s === 'published') return 'green';
    if (s === 'pending' || s === 'pending_review') return 'yellow';
    if (s === 'draft') return 'gray';
    if (s === 'archived') return 'cyan';
    if (s === 'inactive' || s === 'rejected') return 'red';
    return 'gray';
  }

  function openEditModal(movieId) {
    var isEdit = !!movieId;
    var title = isEdit ? 'Edit Movie' : 'New Movie';
    var content = DOM.el('form', { id: 'movieForm' });
    var fields = [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'genre', label: 'Genre', type: 'text' },
      { name: 'language', label: 'Language', type: 'text' },
      { name: 'durationMinutes', label: 'Duration (min)', type: 'number' },
      { name: 'director', label: 'Director', type: 'text' },
      { name: 'certification', label: 'Certification', type: 'text' },
      { name: 'posterUrl', label: 'Poster URL', type: 'text' },
      { name: 'trailerUrl', label: 'Trailer URL', type: 'text' },
    ];
    fields.forEach(function (f) {
      var group = DOM.el('div', { className: 'form-group' });
      group.appendChild(DOM.el('label', { className: 'form-label' + (f.required ? ' required' : ''), textContent: f.label }));
      var input = DOM.el('input', { className: 'form-input', type: f.type, name: f.name, placeholder: f.label });
      if (f.required) input.setAttribute('required', '');
      group.appendChild(input);
      content.appendChild(group);
    });
    var footerEl = DOM.el('div', { style: 'display:flex;gap:8px;justify-content:flex-end;' });
    var cancelBtn = DOM.el('button', { className: 'btn btn--secondary', type: 'button', textContent: 'Cancel' });
    cancelBtn.addEventListener('click', closeModal);
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
        AdminMoviesAPI.update(movieId, data).then(function () {
          Components.showToast('Movie updated', 'success');
          closeModal();
          loadData();
        }).catch(function (err) { Components.showToast(err.message, 'error'); });
      } else {
        AdminMoviesAPI.create(data).then(function () {
          Components.showToast('Movie created', 'success');
          closeModal();
          loadData();
        }).catch(function (err) { Components.showToast(err.message, 'error'); });
      }
    });
    if (isEdit) {
      AdminMoviesAPI.get(movieId).then(function (resp) {
        var data = resp.data || resp;
        var fields2 = ['title', 'genre', 'language', 'durationMinutes', 'director', 'certification', 'posterUrl', 'trailerUrl'];
        fields2.forEach(function (k) {
          var el = content.querySelector('[name="' + k + '"]');
          if (el && data[k] != null) el.value = data[k];
        });
      }).catch(function () {});
    }
    openModal(title, content, footerEl);
  }

  return Object.freeze({ render });
})();
