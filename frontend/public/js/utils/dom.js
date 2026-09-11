/**
 * DOM helper utilities.
 * Attached to window as global.DOM for use across all modules.
 */

(function (global) {
    'use strict';

    function el(tag, attrs, children) {
        var e = document.createElement(tag);
        if (attrs && typeof attrs === 'object') {
            Object.keys(attrs).forEach(function(k) {
                var v = attrs[k];
                if (k === 'textContent') {
                    e.textContent = v;
                } else if (k === 'innerHTML') {
                    e.innerHTML = v;
                } else if (k.indexOf('data-') === 0) {
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
            var arr = Array.isArray(children) ? children : [children];
            arr.forEach(function(child) {
                if (typeof child === 'string') {
                    e.appendChild(document.createTextNode(child));
                } else if (child instanceof Element) {
                    e.appendChild(child);
                }
            });
        }
        return e;
    }

    function empty(e) {
        while (e.firstChild) {
            e.removeChild(e.firstChild);
        }
    }

    function toggleClass(e, cls, add) {
        if (add !== false) {
            e.classList.add(cls);
        } else {
            e.classList.remove(cls);
        }
    }

    function setVisible(e, visible) {
        e.style.display = visible ? '' : 'none';
    }

    function debounce(fn, ms) {
        var timer;
        return function () {
            var args = Array.prototype.slice.call(arguments);
            var self = this;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(self, args); }, ms);
        };
    }

    global.DOM = Object.freeze({
        el: el,
        empty: empty,
        toggleClass: toggleClass,
        setVisible: setVisible,
        debounce: debounce,
    });

})(window);
