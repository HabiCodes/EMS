/**
 * EntryMySlot - Simple Hash-based Router
 * Maps clean URLs to page controllers. SPA-style navigation with
 * pushState support. Server fallback handled via .htaccess.
 */

(function (global) {
  'use strict';

  var routes = [];
  var currentRoute = null;
  var _beforeHooks = [];
  var _afterHooks = [];
  var _notFoundHandler = null;

  function addRoute(pattern, handler, options) {
    options = options || {};
    routes.push({
      pattern: pattern,
      handler: handler,
      options: options,
      // Pre-compile param names
      paramNames: (pattern.match(/:(\w+)/g) || []).map(function (p) { return p.slice(1); }),
    });
    return routes.length - 1;
  }

  function before(hook) { _beforeHooks.push(hook); }
  function after(hook) { _afterHooks.push(hook); }
  function notFound(handler) { _notFoundHandler = handler; }

  function matchRoute(path) {
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      var regex = new RegExp('^' + r.pattern.replace(/:\w+/g, '([^/]+)') + '$');
      var match = path.match(regex);
      if (match) {
        var params = {};
        r.paramNames.forEach(function (name, idx) {
          params[name] = decodeURIComponent(match[idx + 1] || '');
        });
        return { route: r, params: params };
      }
    }
    return null;
  }

  async function navigate(path, replace) {
    if (replace) {
      history.replaceState(null, '', path);
    } else {
      history.pushState(null, '', path);
    }
    await resolve(path);
  }

  async function resolve(path) {
    path = path.split('?')[0];
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

    // Run before hooks
    for (var b = 0; b < _beforeHooks.length; b++) {
      var bh = _beforeHooks[b];
      if (bh && typeof bh === 'function') {
        var br = await bh(path);
        if (br === false) return;
      }
    }

    var matched = matchRoute(path);
    if (!matched) {
      if (_notFoundHandler) _notFoundHandler(path);
      return;
    }

    var route = matched.route;
    var params = matched.params;
    var meta = route.options;

    // Auth guard
    if (meta.requiresAuth) {
      var scope = meta.authScope || 'customer';
      if (scope === 'customer' && !EMSAuth.isLoggedIn()) {
        global.location.href = '/login';
        return;
      }
      if (scope === 'organizer' && !EMSOrganizerAuth.isLoggedIn()) {
        global.location.href = '/partner/login';
        return;
      }
      if (scope === 'admin' && !EMSAdminAuth.isLoggedIn()) {
        global.location.href = '/admin/login';
        return;
      }
    }

    currentRoute = { path: path, params: params, route: route };

    // Update meta
    updatePageMeta(meta, params);

    // Render page
    if (route.handler && typeof route.handler === 'function') {
      await route.handler(params);
    } else if (route.handler && typeof route.handler.render === 'function') {
      await route.handler.render(params);
    }

    // Run after hooks
    for (var a = 0; a < _afterHooks.length; a++) {
      var ah = _afterHooks[a];
      if (ah && typeof ah === 'function') {
        await ah(path, params);
      }
    }

    // Scroll to top
    global.scrollTo(0, 0);
  }

  function updatePageMeta(meta, params) {
    var title = meta.title || 'EntryMySlot';
    var description = meta.description || 'Book sports venues, events, and movies near you.';
    var image = meta.image || 'https://entrymyslot.com/assets/images/og-default.jpg';

    if (document.title !== title) document.title = title;

    // Meta description
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', description);

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', global.location.href);
    setMeta('property', 'og:type', 'website');

    // Twitter
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    setMeta('name', 'twitter:card', 'summary_large_image');

    // Canonical
    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = global.location.origin + global.location.pathname;
  }

  function setMeta(attr, name, content) {
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function getCurrentRoute() { return currentRoute; }
  function getRoutes() { return routes.slice(); }

  global.EMSRouter = {
    get: addRoute,
    before: before,
    after: after,
    notFound: notFound,
    navigate: navigate,
    resolve: resolve,
    match: matchRoute,
    getCurrentRoute: getCurrentRoute,
    getRoutes: getRoutes,
    setResolveInitial: setResolveInitial,
  };

  // Defer initial URL resolution until app signals ready.
  // routes.js calls EMSRouter.setResolveInitial(true) after all
  // route definitions have been registered.
  var _resolveInitial = false;

  function setResolveInitial(flag) {
    _resolveInitial = !!flag;
    if (_resolveInitial) {
      resolveInitial();
    }
  }

  function resolveInitial() {
    if (_resolving) return;
    _resolving = true;
    resolve(global.location.pathname);
  }

  // Handle browser back/forward
  global.addEventListener('popstate', function () {
    resolve(global.location.pathname);
  });

  // Handle initial page load — wait until setResolveInitial(true) is called.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      // Do NOT resolve until routes.js calls setResolveInitial(true).
      // This ensures all route definitions are registered before the
      // initial URL is resolved.
    });
  }
  // If DOM is already loaded, still wait for setResolveInitial(true).

  // Intercept same-origin link clicks for SPA navigation
  var _hostPrefix = global.location.origin;
  global.addEventListener('click', function (e) {
    var el = e.target;
    // Walk up to find the closest anchor
    while (el && el.tagName !== 'A' && el !== global.document.body) {
      el = el.parentNode;
    }
    if (!el || el.tagName !== 'A') return;

    // Skip modified clicks (new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // Skip external links, targets, and non-http protocols
    if (el.target === '_blank') return;
    if (!el.href || el.href.indexOf(_hostPrefix) !== 0) return;
    if (el.protocol !== 'http:' && el.protocol !== 'https:') return;

    var path = el.pathname;
    if (!matchRoute(path)) return;

    e.preventDefault();
    navigate(path);
  });

})(window);
