/**
 * Pagination state management.
 *
 * Centralized pagination logic for list pages.
 */

const Pagination = (function () {
  'use strict';

  const DEFAULT_PAGE_SIZE = 20;

  function create(initial = {}) {
    const state = {
      page: initial.page || 1,
      pageSize: initial.pageSize || DEFAULT_PAGE_SIZE,
      total: initial.total || 0,
      totalPages: initial.totalPages || 0,
      sortBy: initial.sortBy || null,
      sortDir: initial.sortDir || 'desc',
      filters: initial.filters || {},
    };

    function getState() {
      return Object.assign({}, state);
    }

    function setPage(page) {
      state.page = Math.max(1, page);
    }

    function setPageSize(pageSize) {
      state.pageSize = pageSize;
      state.page = 1;
    }

    function setTotal(total) {
      state.total = total;
      state.totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    }

    function setSort(sortBy, sortDir) {
      state.sortBy = sortBy;
      state.sortDir = sortDir || 'asc';
      state.page = 1;
    }

    function setFilters(filters) {
      state.filters = Object.assign({}, filters);
      state.page = 1;
    }

    function getQueryParams() {
      const params = {};
      if (state.page > 1) params.page = state.page;
      if (state.pageSize !== DEFAULT_PAGE_SIZE) params.pageSize = state.pageSize;
      if (state.sortBy) params.sortBy = state.sortBy;
      if (state.sortDir && state.sortDir !== 'desc') params.sortDir = state.sortDir;
      Object.entries(state.filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params[k] = v;
      });
      return params;
    }

    function reset() {
      state.page = 1;
      state.pageSize = DEFAULT_PAGE_SIZE;
      state.total = 0;
      state.totalPages = 0;
      state.sortBy = null;
      state.sortDir = 'desc';
      state.filters = {};
    }

    return Object.freeze({
      getState,
      setPage,
      setPageSize,
      setTotal,
      setSort,
      setFilters,
      getQueryParams,
      reset,
    });
  }

  return Object.freeze({ create, DEFAULT_PAGE_SIZE });
})();
