/**
 * Simple pub/sub event bus for cross-component communication.
 */
const EventBus = (function () {
  'use strict';

  const _listeners = {};

  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
    return function off() {
      _listeners[event] = _listeners[event].filter(f => f !== fn);
    };
  }

  function emit(event, payload) {
    const fns = _listeners[event] || [];
    fns.forEach(fn => {
      try { fn(payload); } catch (_) { /* swallow */ }
    });
  }

  function off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(f => f !== fn);
  }

  return Object.freeze({ on, emit, off });
})();
