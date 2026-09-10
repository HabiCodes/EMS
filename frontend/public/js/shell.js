/**
 * Admin shell — layout, sidebar, topbar, modals, toasts.
 *
 * Renders the main app layout once authenticated.
 * Pages are rendered into the main content area by page modules.
 */

const AdminShell = (function () {
  'use strict';

  let _container = null;
  let _currentPage = 'dashboard';
  let _sidebarCollapsed = false;

  function init() {
    _container = document.getElementById('app');
    if (!_container) return;
    render(_container);
  }

  function render(container) {
    container.innerHTML = '';
    container.className = 'admin-shell';

    const sidebarOverlay = DOM.el('div', { className: 'sidebar-overlay', id: 'sidebarOverlay' });
    container.appendChild(sidebarOverlay);

    const sidebar = renderSidebar();
    container.appendChild(sidebar);

    const mainContent = DOM.el('div', { className: 'main-content' });
    const topbar = renderTopbar();
    mainContent.appendChild(topbar);

    const pageContent = DOM.el('div', { className: 'page-content', id: 'pageContent' });
    mainContent.appendChild(pageContent);

    const modalOverlay = renderModalOverlay();
    container.appendChild(modalOverlay);

    const toastContainer = DOM.el('div', { className: 'toast-container', id: 'toastContainer' });
    container.appendChild(toastContainer);

    container.appendChild(mainContent);

    bindEvents(sidebarOverlay);
  }

  function renderSidebar() {
    const sidebar = DOM.el('aside', { className: 'sidebar', id: 'sidebar' });

    const header = DOM.el('div', { className: 'sidebar__header' });
    const logo = DOM.el('div', { className: 'sidebar__logo', textContent: 'E' });
    const brand = DOM.el('div', { className: 'sidebar__brand', textContent: 'EMS Admin' });
    header.appendChild(logo);
    header.appendChild(brand);
    sidebar.appendChild(header);

    const nav = DOM.el('nav', { className: 'sidebar__nav', id: 'sidebarNav' });
    sidebar.appendChild(nav);

    const footer = DOM.el('div', { className: 'sidebar__footer' });
    footer.appendChild(renderUserInfo());
    const logoutBtn = DOM.el('button', {
      className: 'sidebar__logout',
      textContent: 'Sign Out',
    });
    logoutBtn.addEventListener('click', function () {
      AdminAuth.logout();
    });
    footer.appendChild(logoutBtn);
    sidebar.appendChild(footer);

    return sidebar;
  }

  function renderUserInfo() {
    const state = AuthState.getState();
    const admin = state.admin || {};
    const initials = (admin.name || admin.email || 'A').charAt(0).toUpperCase();

    const user = DOM.el('div', { className: 'sidebar__user' });
    const avatar = DOM.el('div', {
      className: 'sidebar__avatar',
      textContent: initials,
    });
    const info = DOM.el('div', { className: 'sidebar__user-info' });
    const name = DOM.el('div', {
      className: 'sidebar__user-name',
      textContent: admin.name || admin.email || 'Admin',
    });
    const role = DOM.el('div', {
      className: 'sidebar__user-role',
      textContent: admin.role === 'super_admin' ? 'Super Admin' : 'Admin',
    });
    info.appendChild(name);
    info.appendChild(role);
    user.appendChild(avatar);
    user.appendChild(info);

    return user;
  }

  function renderTopbar() {
    const topbar = DOM.el('header', { className: 'topbar' });

    const left = DOM.el('div', { className: 'topbar__left' });
    const toggle = DOM.el('button', {
      className: 'topbar__toggle',
      textContent: '☰',
      'aria-label': 'Toggle sidebar',
    });
    toggle.addEventListener('click', toggleSidebar);
    const title = DOM.el('h1', {
      className: 'topbar__title',
      id: 'pageTitle',
      textContent: 'Dashboard',
    });
    left.appendChild(toggle);
    left.appendChild(title);
    topbar.appendChild(left);

    const right = DOM.el('div', { className: 'topbar__right' });
    const breadcrumb = DOM.el('div', {
      className: 'topbar__breadcrumb',
      id: 'breadcrumb',
      textContent: 'Home',
    });
    right.appendChild(breadcrumb);
    topbar.appendChild(right);

    return topbar;
  }

  function renderModalOverlay() {
    const overlay = DOM.el('div', {
      className: 'modal-overlay',
      id: 'modalOverlay',
    });
    const modal = DOM.el('div', { className: 'modal', id: 'modal' });

    const header = DOM.el('div', { className: 'modal__header' });
    const title = DOM.el('h2', { className: 'modal__title', id: 'modalTitle', textContent: '' });
    const close = DOM.el('button', {
      className: 'modal__close',
      textContent: '×',
      'aria-label': 'Close',
    });
    close.addEventListener('click', closeModal);
    header.appendChild(title);
    header.appendChild(close);

    const body = DOM.el('div', { className: 'modal__body', id: 'modalBody' });
    const footer = DOM.el('div', { className: 'modal__footer', id: 'modalFooter' });

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    return overlay;
  }

  function bindEvents(sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function () {
      _sidebarCollapsed = false;
      updateSidebarState();
    });

    // Listen for auth changes to update user info
    EventBus.on('auth:change', function () {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        const footer = sidebar.querySelector('.sidebar__footer');
        if (footer) {
          const oldUser = footer.querySelector('.sidebar__user');
          if (oldUser) {
            footer.removeChild(oldUser);
            footer.insertBefore(renderUserInfo(), footer.firstChild);
          }
        }
      }
    });
  }

  function updateSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;

    if (window.innerWidth <= 768) {
      // Mobile
      if (_sidebarCollapsed) {
        sidebar.classList.remove('sidebar--open');
        overlay.classList.remove('sidebar-overlay--visible');
      } else {
        sidebar.classList.add('sidebar--open');
        overlay.classList.add('sidebar-overlay--visible');
      }
    }
    // Desktop sidebar is always visible (fixed)
  }

  function toggleSidebar() {
    _sidebarCollapsed = !_sidebarCollapsed;
    updateSidebarState();
  }

  function navigateTo(pageId) {
    _currentPage = pageId;

    // Update sidebar active state
    const items = document.querySelectorAll('.sidebar__item');
    items.forEach(function (item) {
      const page = item.getAttribute('data-page');
      if (page === pageId) {
        item.classList.add('sidebar__item--active');
      } else {
        item.classList.remove('sidebar__item--active');
      }
    });

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumb = document.getElementById('breadcrumb');
    const pageConfig = Pages.getConfig(pageId);
    if (pageTitle && pageConfig) {
      pageTitle.textContent = pageConfig.title;
    }
    if (breadcrumb && pageConfig) {
      breadcrumb.textContent = pageConfig.title;
    }

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(function (p) { p.classList.remove('page--active'); });

    // Show target page
    const pageEl = document.getElementById('page-' + pageId);
    if (pageEl) {
      pageEl.classList.add('page--active');
    }

    // Close mobile sidebar
    if (window.innerWidth <= 768) {
      _sidebarCollapsed = false;
      updateSidebarState();
    }

    // Trigger page render
    const pageModule = Pages.get(pageId);
    if (pageModule && pageModule.render) {
      pageModule.render();
    }
  }

  function getPageContainer() {
    return document.getElementById('pageContent');
  }

  function getCurrentPage() {
    return _currentPage;
  }

  function openModal(title, bodyContent, footerContent) {
    var overlay = document.getElementById('modalOverlay');
    var titleEl = document.getElementById('modalTitle');
    var bodyEl = document.getElementById('modalBody');
    var footerEl = document.getElementById('modalFooter');
    if (!overlay || !bodyEl) return;
    if (titleEl && title) titleEl.textContent = title;
    DOM.empty(bodyEl);
    if (bodyContent) bodyEl.appendChild(bodyContent);
    if (footerEl) {
      DOM.empty(footerEl);
      if (footerContent) footerEl.appendChild(footerContent);
    }
    overlay.classList.add('modal-overlay--visible');
  }

  function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('modal-overlay--visible');
  }

  return Object.freeze({
    init,
    render,
    navigateTo,
    getPageContainer,
    getCurrentPage,
    renderSidebar,
    openModal,
    closeModal,
  });
})();
