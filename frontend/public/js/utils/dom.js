/**
 * DOM helper utilities.
 */

const DOM = (function () {
  'use strict';

  /**
   * Create an element with optional attributes and children.
   * @param {string} tag
   * @param {Object} [attrs]
   * @param {string|Element|Array<string|Element>} [children]
   * @returns {Element}
   */
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs && typeof attrs === 'object') {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'textContent') {
          e.textContent = v;
        } else if (k === 'innerHTML') {
          e.innerHTML = v;
        } else if (k.startsWith('data-')) {
          e.dataset[k.slice(5)] = v;
        } else if (k === 'className') {
          e.className = v;
        } else if (k === 'style' && typeof v === 'object') {
          Object.assign(e.style, v);
        } else {
          e.setAttribute(k, v);
        }
      });
    }
    if (children) {
      const arr = Array.isArray(children) ? children : [children];
      arr.forEach(child => {
        if (typeof child === 'string') {
          e.appendChild(document.createTextNode(child));
        } else if (child instanceof Element) {
          e.appendChild(child);
        }
      });
    }
    return e;
  }

  /**
   * Remove all children from an element.
   * @param {Element} e
   */
  function empty(e) {
    while (e.firstChild) {
      e.removeChild(e.firstChild);
    }
  }

  /**
   * Toggle CSS classes.
   * @param {Element} e
   * @param {string} cls
   * @param {boolean} [add=true]
   */
  function toggleClass(e, cls, add) {
    if (add !== false) {
      e.classList.add(cls);
    } else {
      e.classList.remove(cls);
    }
  }

  /**
   * Show/hide element.
   * @param {Element} e
   * @param {boolean} visible
   */
  function setVisible(e, visible) {
    e.style.display = visible ? '' : 'none';
  }

  /**
   * Debounce function.
   */
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  return Object.freeze({
    el,
    empty,
    toggleClass,
    setVisible,
    debounce,
  });
})();
