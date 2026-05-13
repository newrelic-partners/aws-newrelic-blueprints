import { applyFilter, highlightSearch } from './graph.js';

let state = { category: '', product: '', transport: '' };

export function initFilters() {
  loadFromHash();

  document.getElementById('filter-category')?.addEventListener('change', e => {
    state.category = e.target.value;
    pushHash();
    applyFilter(state);
  });

  document.getElementById('filter-product')?.addEventListener('change', e => {
    state.product = e.target.value;
    pushHash();
    applyFilter(state);
  });

  document.getElementById('filter-transport')?.addEventListener('change', e => {
    state.transport = e.target.value;
    pushHash();
    applyFilter(state);
  });

  document.getElementById('search-input')?.addEventListener('input', e => {
    highlightSearch(e.target.value.trim());
  });

  // Apply any filter loaded from hash on boot
  if (state.category || state.product || state.transport) {
    applyFilter(state);
  }
}

function loadFromHash() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  state.category  = params.get('category')  || '';
  state.product   = params.get('product')   || '';
  state.transport = params.get('transport') || '';

  const catEl  = document.getElementById('filter-category');
  const prodEl = document.getElementById('filter-product');
  const trnEl  = document.getElementById('filter-transport');
  if (catEl  && state.category)  catEl.value  = state.category;
  if (prodEl && state.product)   prodEl.value = state.product;
  if (trnEl  && state.transport) trnEl.value  = state.transport;
}

function pushHash() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (state.category)  params.set('category',  state.category);  else params.delete('category');
  if (state.product)   params.set('product',   state.product);   else params.delete('product');
  if (state.transport) params.set('transport', state.transport); else params.delete('transport');
  const str = params.toString();
  window.history.replaceState(null, '', str ? '#' + str : window.location.pathname);
}

export function getFilterState() { return { ...state }; }
