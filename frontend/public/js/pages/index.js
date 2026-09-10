/**
 * Pages registry.
 *
 * Each page module registers itself here.
 * The shell and navigation use this registry to render pages and build the sidebar.
 */

const Pages = (function () {
  'use strict';

  const _pages = {};
  const _navItems = [];

  function register(config) {
    if (!config.id || !config.module) return;
    _pages[config.id] = config;
    _navItems.push({
      id: config.id,
      label: config.label,
      icon: config.icon || '📄',
      section: config.section || 'General',
      permission: config.permission || null,
    });
  }

  function get(pageId) {
    return _pages[pageId] ? _pages[pageId].module : null;
  }

  function getConfig(pageId) {
    return _pages[pageId] || null;
  }

  function getAll() {
    return Object.keys(_pages).map(function (id) {
      return _pages[id];
    });
  }

  function getNavItems() {
    return _navItems.slice();
  }

  return Object.freeze({
    register,
    get,
    getConfig,
    getAll,
    getNavItems,
  });
})();
