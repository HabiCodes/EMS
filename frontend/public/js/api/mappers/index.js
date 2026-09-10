/**
 * Mappers barrel export.
 * Re-exports all mapper modules. Must be loaded after individual mappers.
 */

const Mappers = (function () {
  'use strict';

  // Mappers are loaded as globals via script tags before this file.
  // Each mapper is an IIFE assigned to a global constant.
  // This barrel simply re-exports them under a single namespace.
  return Object.freeze({
    events: window.EventMapper || null,
    movies: window.MovieMapper || null,
    turf: window.TurfMapper || null,
    promotions: window.PromotionMapper || null,
  });
})();
