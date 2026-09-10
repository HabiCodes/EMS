/**
 * Events List page module.
 *
 * Features:
 *   - Stat cards (total, draft, pending, published)
 *   - Filters (search, status, featured, free)
 *   - Sortable data table
 *   - Pagination
 *   - Action menu per row (status transitions)
 *   - Detail modal
 *   - Create/Edit modal
 */

var EventsListPage = (function () {
  'use strict';

  var _pag = Pagination.create();
  var _filters = {
    search: '',
    status: '',
    isFeatured: '',
    isFree: '',
  };

  function render() {
    var container = AdminShell.getPageContainer();
    if (!container) return;
    DOM.empty(container);

    var wrapper = DOM.el('div', { className: 'fade-in' });
    wrapper.appendChild(renderHeader());
    wrapper.appendChild(renderStats());
    wrapper.appendChild(renderFilters());
    wrapper.appendChild(renderTable());
    container.appendChild(wrapper);

    loadData();
  }

  function renderHeader() {
    var header = DOM.el('div', { className: 'page-header' });
    var info = DOM.el('div');
    info.appendChild(DOM.el('h2', { className: 'page-header__title', textContent: 'Events' }));
    info.appendChild(DOM.el('p', { className: 'page-header__subtitle', textContent: 'Manage all events on the platform' }));
    header.appendChild(info);

    var actions = DOM.el('div', { className: 'page-header__actions' });
    var createBtn = DOM.el('button', { className: 'btn btn--primary', textContent: '+ New Event' });
    createBtn.addEventListener('click', function () {
      openEditModal(null);
    });
    actions.appendChild(createBtn);
    header.appendChild(actions);

    return header;
  }

  function renderStats() {
    var grid = DOM.el('div', { className: 'stat-grid', id: 'eventsStats' });
    grid.appendChild(Components.spinner('Loading…'));
    return grid;
  }

  function renderFilters() {
    var bar = DOM.el('div', { className: 'filters-bar' });

    var searchInput = DOM.el('input', {
      className: 'form-input',
      type: 'text',
      placeholder: 'Search events…',
      id: 'eventSearch',
      style: 'min-width:240px;',
    });
    searchInput.addEventListener('input', DOM.debounce(function () {
      _filters.search = searchInput.value.trim();
      _pag.setFilters(_filters);
      loadData();
    }, 300));

    var statusSelect = DOM.el('select', { className: 'form-select', id: 'eventStatusFilter' });
    statusSelect.appendChild(DOM.el('option', { value: '', textContent: 'All Statuses' }));
    ['draft', 'pending_review', 'approved', 'published', 'hidden', 'archived', 'cancelled'].forEach(function (s) {
      statusSelect.appendChild(DOM.el('option', { value: s, textContent: formatStatus(s) }));
    });
    statusSelect.addEventListener('change', function () {
      _filters.status = statusSelect.value;
      _pag.setFilters(_filters);
      loadData();
    });

    var featuredSelect = DOM.el('select', { className: 'form-select', id: 'eventFeaturedFilter' });
    featuredSelect.appendChild(DOM.el('option', { value: '', textContent: 'All' }));
    featuredSelect.appendChild(DOM.el('option', { value: 'true', textContent: 'Featured' }));
    featuredSelect.appendChild(DOM.el('option', { value: 'false', textContent: 'Not Featured' }));
    featuredSelect.addEventListener('change', function () {
      _filters.isFeatured = featuredSelect.value;
      _pag.setFilters(_filters);
      loadData();
    });

    bar.appendChild(searchInput);
    bar.appendChild(statusSelect);
    bar.appendChild(featuredSelect);
    return bar;
  }

  function renderTable() {
    var card = DOM.el('div', { className: 'card' });
    var body = DOM.el('div', { className: 'card__body', style: 'padding:0;' });

    var container = DOM.el('div', { className: 'table-container', id: 'eventsTableContainer' });
    container.appendChild(Components.spinner('Loading events…'));
    body.appendChild(container);

    var pagination = DOM.el('div', { className: 'pagination', id: 'eventsPagination' });
    pagination.style.display = 'none';
    body.appendChild(pagination);

    card.appendChild(body);
    return card;
  }

  async function loadData() {
    await Promise.all([loadStats(), loadEvents()]);
  }

  async function loadStats() {
    var grid = document.getElementById('eventsStats');
    if (!grid) return;

    try {
      var response = await AdminEventsAPI.getStats();
      var data = extractEnvelope(response);
      if (!data) throw new Error('No stats data');

      DOM.empty(grid);
      grid.appendChild(createStatCard('Total', data.total || 0, '🎬', 'blue'));
      grid.appendChild(createStatCard('Draft', data.draft || 0, '📝', 'gray'));
      grid.appendChild(createStatCard('Pending Review', data.pending || data.pending_review || 0, '⏳', 'yellow'));
      grid.appendChild(createStatCard('Published', data.published || 0, '✅', 'green'));
    } catch (err) {
      DOM.empty(grid);
      grid.appendChild(createStatCard('Total', '—', '🎬', 'blue'));
      grid.appendChild(createStatCard('Draft', '—', '📝', 'gray'));
      grid.appendChild(createStatCard('Pending', '—', '⏳', 'yellow'));
      grid.appendChild(createStatCard('Published', '—', '✅', 'green'));
    }
  }

  async function loadEvents() {
    var container = document.getElementById('eventsTableContainer');
    var paginationEl = document.getElementById('eventsPagination');
    if (!container) return;

    container.innerHTML = '';
    container.appendChild(Components.spinner('Loading events…'));
    if (paginationEl) paginationEl.style.display = 'none';

    try {
      var params = _pag.getQueryParams();
      var response = await AdminEventsAPI.list(params);
      var list = EventMapper.normalizeList(response);
      var items = list.items;
      var pag = list.pagination || response.pagination || {};

      _pag.setTotal(pag.total || items.length);
      if (pag.page) _pag.setPage(pag.page);
      if (pag.pageSize) _pag.setPageSize(pag.pageSize);

      renderTableRows(items, container);
      renderPagination(paginationEl);
    } catch (err) {
      container.innerHTML = '';
      container.appendChild(Components.errorState(err.message || 'Failed to load events', loadEvents));
    }
  }

  function renderTableRows(items, container) {
    DOM.empty(container);

    if (items.length === 0) {
      container.appendChild(Components.emptyState('🎬', 'No events found', 'Adjust your filters or create a new event.'));
      return;
    }

    var table = DOM.el('table', { className: 'data-table' });

    var thead = DOM.el('thead');
    var headRow = DOM.el('tr');
    var columns = [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'eventDate', label: 'Date' },
      { key: 'organizationName', label: 'Organization' },
      { key: 'isFeatured', label: 'Featured' },
      { key: 'actions', label: '' },
    ];
    columns.forEach(function (col) {
      headRow.appendChild(DOM.el('th', { textContent: col.label }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = DOM.el('tbody');
    items.forEach(function (evt) {
      var row = DOM.el('tr');
      row.appendChild(DOM.el('td', { textContent: evt.id || '—' }));
      row.appendChild(DOM.el('td', { textContent: FormatUtil.escHtml(evt.title || 'Untitled') }));
      row.appendChild(DOM.el('td', { textContent: Components.badge(formatStatus(evt.status), statusVariant(evt.status)) }));
      row.appendChild(DOM.el('td', { textContent: evt.eventDate ? FormatUtil.formatDate(evt.eventDate) : '—' }));
      row.appendChild(DOM.el('td', { textContent: evt.organizationName || evt.organization_id || '—' }));
      row.appendChild(DOM.el('td', { textContent: evt.isFeatured ? '⭐' : '—' }));
      row.appendChild(DOM.el('td', { style: 'white-space:nowrap;' }, [renderActionButton(evt)]));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderActionButton(event) {
    var wrapper = DOM.el('div', { style: 'position:relative;display:inline-block;' });

    var btn = DOM.el('button', {
      className: 'btn btn--ghost btn--sm',
      textContent: '⋯',
      style: 'padding:2px 8px;font-size:16px;',
    });

    var menu = DOM.el('div', {
      style: 'display:none;position:absolute;background:white;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.1);z-index:50;min-width:180px;padding:4px 0;',
      id: 'eventMenu_' + event.id,
    });

    var actions = getActionsForStatus(event.status);
    actions.forEach(function (action) {
      var item = DOM.el('div', {
        style: 'padding:8px 16px;font-size:13px;cursor:pointer;transition:background .15s;',
        textContent: action.label,
      });
      item.addEventListener('mouseenter', function () { item.style.background = '#f1f5f9'; });
      item.addEventListener('mouseleave', function () { item.style.background = 'transparent'; });
      item.addEventListener('click', function () {
        menu.style.display = 'none';
        executeAction(action, event);
      });
      menu.appendChild(item);
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.querySelectorAll('[id^="eventMenu_"]').forEach(function (m) {
        if (m.id !== 'eventMenu_' + event.id) m.style.display = 'none';
      });
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', function () {
      document.querySelectorAll('[id^="eventMenu_"]').forEach(function (m) {
        m.style.display = 'none';
      });
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(menu);
    return wrapper;
  }

  function getActionsForStatus(status) {
    var actions = [];
    switch (status) {
      case 'draft':
        actions.push({ key: 'submit_for_review', label: 'Submit for Review' });
        actions.push({ key: 'edit', label: 'Edit' });
        actions.push({ key: 'delete', label: 'Delete', danger: true });
        break;
      case 'pending_review':
        actions.push({ key: 'approve', label: '✓ Approve' });
        actions.push({ key: 'reject', label: '✗ Reject' });
        actions.push({ key: 'view', label: 'View Details' });
        break;
      case 'approved':
        actions.push({ key: 'publish', label: 'Publish' });
        actions.push({ key: 'reject', label: 'Send Back to Draft' });
        actions.push({ key: 'view', label: 'View Details' });
        break;
      case 'published':
        actions.push({ key: 'hide', label: 'Hide' });
        actions.push({ key: 'archive', label: 'Archive' });
        actions.push({ key: 'unpublish', label: 'Unpublish' });
        actions.push({ key: 'view', label: 'View Details' });
        break;
      case 'hidden':
        actions.push({ key: 'publish', label: 'Publish' });
        actions.push({ key: 'archive', label: 'Archive' });
        actions.push({ key: 'view', label: 'View Details' });
        break;
      case 'archived':
      case 'cancelled':
        actions.push({ key: 'view', label: 'View Details' });
        break;
    }
    return actions;
  }

  async function executeAction(action, event) {
    var id = event.id;
    switch (action.key) {
      case 'edit': openEditModal(id); break;
      case 'view': openDetailModal(id); break;
      case 'delete':
        Components.confirmDialog('Delete Event', 'Are you sure you want to delete "' + (event.title || 'this event') + '"?', function () {
          AdminEventsAPI.remove(id).then(function () {
            Components.showToast('Event deleted', 'success');
            loadData();
          }).catch(function (err) { Components.showToast(err.message, 'error'); });
        });
        break;
      case 'submit_for_review':
        AdminEventsAPI.submitForReview(id).then(function () { Components.showToast('Submitted for review', 'success'); loadData(); }).catch(function (err) { Components.showToast(err.message, 'error'); });
        break;
      case 'approve':
        AdminEventsAPI.approve(id).then(function () { Components.showToast('Event approved', 'success'); loadData(); }).catch(function (err) { Components.showToast(err.message, 'error'); });
        break;
      case 'reject': openRejectModal(id); break;
      case 'publish':
        AdminEventsAPI.publish(id).then(function () { Components.showToast('Event published', 'success'); loadData(); }).catch(function (err) { Components.showToast(err.message, 'error'); });
        break;
      case 'unpublish':
        AdminEventsAPI.unpublish(id).then(function () { Components.showToast('Event unpublished', 'success'); loadData(); }).catch(function (err) { Components.showToast(err.message, 'error'); });
        break;
      case 'hide':
        AdminEventsAPI.hide(id).then(function () { Components.showToast('Event hidden', 'success'); loadData(); }).catch(function (err) { Components.showToast(err.message, 'error'); });
        break;
      case 'archive':
        AdminEventsAPI.archive(id).then(function () { Components.showToast('Event archived', 'success'); loadData(); }).catch(function (err) { Components.showToast(err.message, 'error'); });
        break;
      default: Components.showToast('Action not implemented', 'warning');
    }
  }

  // ─── Modal helpers ───────────────────────────

  function openModal(title, content, footer) {
    var overlay = document.getElementById('modalOverlay');
    var modalTitle = document.getElementById('modalTitle');
    var modalBody = document.getElementById('modalBody');
    var modalFooter = document.getElementById('modalFooter');
    if (!overlay || !modalTitle || !modalBody || !modalFooter) return;

    modalTitle.textContent = title || '';
    DOM.empty(modalBody);
    DOM.empty(modalFooter);

    if (typeof content === 'string') {
      modalBody.appendChild(DOM.el('p', { textContent: content }));
    } else if (content instanceof Element) {
      modalBody.appendChild(content);
    }

    if (footer) {
      if (Array.isArray(footer)) footer.forEach(function (btn) { modalFooter.appendChild(btn); });
      else if (footer instanceof Element) modalFooter.appendChild(footer);
    }

    overlay.classList.add('modal-overlay--visible');
  }

  function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('modal-overlay--visible');
  }

  function openEditModal(eventId) {
    var isEdit = !!eventId;
    var title = isEdit ? 'Edit Event' : 'New Event';

    var form = DOM.el('form', { id: 'eventForm' });
    var formContent = DOM.el('div');

    var fields = [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'eventDate', label: 'Event Date', type: 'date', required: true },
      { name: 'startTime', label: 'Start Time', type: 'time' },
      { name: 'endTime', label: 'End Time', type: 'time' },
      { name: 'venue', label: 'Venue', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'totalCapacity', label: 'Total Capacity', type: 'number' },
      { name: 'isFree', label: 'Free Event', type: 'checkbox' },
      { name: 'isFeatured', label: 'Featured', type: 'checkbox' },
    ];

    fields.forEach(function (f) {
      var group = DOM.el('div', { className: 'form-group' });
      var label = DOM.el('label', { className: 'form-label' + (f.required ? ' required' : ''), textContent: f.label });

      if (f.type === 'textarea') {
        group.appendChild(label);
        group.appendChild(DOM.el('textarea', { className: 'form-textarea', name: f.name, id: 'field_' + f.name, rows: '4' }));
      } else if (f.type === 'checkbox') {
        var wrap = DOM.el('label', { style: 'display:flex;align-items:center;gap:8px;cursor:pointer;' });
        var cb = DOM.el('input', { type: 'checkbox', name: f.name, id: 'field_' + f.name });
        var span = DOM.el('span', { textContent: f.label });
        wrap.appendChild(cb);
        wrap.appendChild(span);
        group.appendChild(wrap);
      } else {
        group.appendChild(label);
        group.appendChild(DOM.el('input', { className: 'form-input', type: f.type, name: f.name, id: 'field_' + f.name }));
      }

      formContent.appendChild(group);
    });

    var footerEl = DOM.el('div', { style: 'display:flex;gap:8px;justify-content:flex-end;' });
    var cancelBtn = DOM.el('button', { className: 'btn btn--secondary', type: 'button', textContent: 'Cancel' });
    cancelBtn.addEventListener('click', closeModal);
    var submitBtn = DOM.el('button', { className: 'btn btn--primary', type: 'submit', textContent: isEdit ? 'Save Changes' : 'Create Event' });
    footerEl.appendChild(cancelBtn);
    footerEl.appendChild(submitBtn);

    form.appendChild(formContent);
    form.appendChild(footerEl);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitEventForm(form, eventId, isEdit);
    });

    openModal(title, form, footerEl);

    if (eventId) loadEventForEdit(eventId);
  }

  async function loadEventForEdit(id) {
    try {
      var response = await AdminEventsAPI.get(id);
      var event = extractEnvelope(response);
      if (!event) return;
      Object.keys(event).forEach(function (key) {
        var field = document.getElementById('field_' + key);
        if (!field) return;
        if (field.type === 'checkbox') field.checked = !!event[key];
        else field.value = event[key] || '';
      });
    } catch (err) {
      Components.showToast('Failed to load event details', 'error');
    }
  }

  async function submitEventForm(form, eventId, isEdit) {
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    var data = {};
    form.querySelectorAll('[name]').forEach(function (input) {
      if (input.type === 'checkbox') data[input.name] = input.checked;
      else if (input.value) data[input.name] = input.value;
    });

    try {
      if (isEdit) {
        await AdminEventsAPI.update(eventId, data);
        Components.showToast('Event updated', 'success');
      } else {
        await AdminEventsAPI.create(data);
        Components.showToast('Event created', 'success');
      }
      closeModal();
      loadData();
    } catch (err) {
      Components.showToast(err.message || 'Failed to save event', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function openDetailModal(eventId) {
    openModal('Event Details', DOM.el('p', { textContent: 'Loading…' }), []);

    AdminEventsAPI.get(eventId)
      .then(function (response) {
        var event = extractEnvelope(response);
        if (!event) throw new Error('Event not found');

        var details = DOM.el('div');
        var rows = [
          ['ID', event.id],
          ['Title', event.title],
          ['Status', Components.badge(formatStatus(event.status), statusVariant(event.status))],
          ['Date', event.eventDate ? FormatUtil.formatDate(event.eventDate) : '—'],
          ['Time', event.startTime ? FormatUtil.formatTime(event.startTime) + ' – ' + (event.endTime ? FormatUtil.formatTime(event.endTime) : '—') : '—'],
          ['Venue', event.venue || '—'],
          ['City', event.city || '—'],
          ['Capacity', event.totalCapacity || '—'],
          ['Featured', event.isFeatured ? 'Yes' : 'No'],
          ['Free', event.isFree ? 'Yes' : 'No'],
        ];
        rows.forEach(function (r) {
          var row = DOM.el('div', { style: 'display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;' });
          row.appendChild(DOM.el('span', { style: 'color:#64748b;font-size:14px;', textContent: r[0] }));
          row.appendChild(DOM.el('span', { style: 'font-weight:500;font-size:14px;', textContent: r[1] }));
          details.appendChild(row);
        });

        var closeBtn = DOM.el('button', { className: 'btn btn--secondary', textContent: 'Close' });
        closeBtn.addEventListener('click', closeModal);
        openModal('Event Details', details, [closeBtn]);
      })
      .catch(function (err) {
        Components.showToast(err.message || 'Failed to load event', 'error');
        closeModal();
      });
  }

  function openRejectModal(eventId) {
    var content = DOM.el('form', { id: 'rejectForm' });
    var group = DOM.el('div', { className: 'form-group' });
    group.appendChild(DOM.el('label', { className: 'form-label required', textContent: 'Rejection Reason' }));
    group.appendChild(DOM.el('textarea', { className: 'form-textarea', name: 'reason', id: 'rejectReason', placeholder: 'Enter reason for rejection…', rows: '4' }));
    content.appendChild(group);

    var footerEl = DOM.el('div', { style: 'display:flex;gap:8px;justify-content:flex-end;' });
    var cancelBtn = DOM.el('button', { className: 'btn btn--secondary', type: 'button', textContent: 'Cancel' });
    cancelBtn.addEventListener('click', closeModal);
    var submitBtn = DOM.el('button', { className: 'btn btn--danger', type: 'submit', textContent: 'Reject Event' });
    footerEl.appendChild(cancelBtn);
    footerEl.appendChild(submitBtn);

    content.appendChild(footerEl);
    content.addEventListener('submit', function (e) {
      e.preventDefault();
      var reason = document.getElementById('rejectReason').value.trim();
      if (!reason) { Components.showToast('Please provide a reason', 'warning'); return; }
      AdminEventsAPI.reject(eventId, { reason: reason }).then(function () {
        Components.showToast('Event rejected', 'success');
        closeModal();
        loadData();
      }).catch(function (err) { Components.showToast(err.message, 'error'); });
    });

    openModal('Reject Event', content, footerEl);
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

  // ─── Helpers ─────────────────────────────────

  function createStatCard(label, value, icon, colorVariant) {
    var card = DOM.el('div', { className: 'stat-card' });
    card.appendChild(DOM.el('div', { className: 'stat-card__icon stat-card__icon--' + (colorVariant || 'blue'), textContent: icon || '📊' }));
    var info = DOM.el('div', { className: 'stat-card__info' });
    info.appendChild(DOM.el('div', { className: 'stat-card__label', textContent: label }));
    info.appendChild(DOM.el('div', { className: 'stat-card__value', textContent: FormatUtil.formatCount(value) }));
    card.appendChild(info);
    return card;
  }

  function formatStatus(status) {
    if (!status) return 'unknown';
    return status.replace(/_/g, ' ');
  }

  function statusVariant(status) {
    if (!status) return 'gray';
    var s = String(status).toLowerCase();
    if (s === 'published') return 'green';
    if (s === 'approved') return 'blue';
    if (s === 'pending_review' || s === 'pending') return 'yellow';
    if (s === 'draft') return 'gray';
    if (s === 'cancelled' || s === 'rejected') return 'red';
    if (s === 'hidden' || s === 'archived') return 'cyan';
    return 'gray';
  }

  function extractEnvelope(response) {
    if (!response) return null;
    if (response.data) return response.data;
    return response;
  }

  return Object.freeze({
    render,
  });
})();
