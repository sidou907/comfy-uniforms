/* ==========================================================================
   Page catalogue : filtre par catégorie, recherche, tri.
   L'état est reflété dans l'URL (?cat=…&q=…) pour pouvoir partager un lien.
   ========================================================================== */

const state = {
  cat: 'all',
  q: '',
  sort: 'default'
};

function readUrl() {
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  if (cat && getCategory(cat)) state.cat = cat;
  state.q = (params.get('q') || '').trim();
  const sort = params.get('sort');
  if (['price-asc', 'price-desc', 'rating'].indexOf(sort) >= 0) state.sort = sort;
}

function writeUrl() {
  const params = new URLSearchParams();
  if (state.cat !== 'all') params.set('cat', state.cat);
  if (state.q) params.set('q', state.q);
  if (state.sort !== 'default') params.set('sort', state.sort);
  const qs = params.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

function renderChips() {
  const host = document.getElementById('catChips');
  let html = '<button type="button" class="chip' + (state.cat === 'all' ? ' is-active' : '') +
             '" data-cat="all">' + (Lang.isAr() ? 'الكل' : 'Tout') + '</button>';
  CATEGORIES.forEach(function (c) {
    html += '<button type="button" class="chip' + (state.cat === c.id ? ' is-active' : '') +
            '" data-cat="' + escapeHtml(c.id) + '">' + escapeHtml(Lang.pick(c, 'name')) + '</button>';
  });
  host.innerHTML = html;
}

function filtered() {
  const q = state.q.toLowerCase();
  let list = PRODUCTS.filter(function (p) {
    if (state.cat !== 'all' && p.cat !== state.cat) return false;
    if (!q) return true;
    const cat = getCategory(p.cat);
    const haystack = [
      p.name, p.name_ar, p.desc, p.desc_ar,
      cat ? cat.name : '', cat ? cat.name_ar : '',
      p.tag || '', p.tag_ar || ''
    ].join(' ').toLowerCase();
    return haystack.indexOf(q) >= 0;
  });

  if (state.sort === 'price-asc') list = list.slice().sort(function (a, b) { return a.price - b.price; });
  else if (state.sort === 'price-desc') list = list.slice().sort(function (a, b) { return b.price - a.price; });
  else if (state.sort === 'rating') list = list.slice().sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });

  return list;
}

function renderTitle() {
  const h = document.getElementById('pageTitle');
  if (state.cat === 'all') {
    h.textContent = Lang.isAr() ? 'كل المنتجات' : 'Tous nos produits';
  } else {
    const c = getCategory(state.cat);
    h.textContent = Lang.pick(c, 'name');
  }
}

function render() {
  const grid = document.getElementById('productGrid');
  const list = filtered();
  renderChips();
  renderTitle();
  renderProductGrid(grid, list);
  document.getElementById('resultsCount').textContent =
    list.length + ' ' + (list.length > 1 ? Lang.t('resultsMany') : Lang.t('resultsOne'));
  writeUrl();
}

document.addEventListener('DOMContentLoaded', function () {
  readUrl();

  const search = document.getElementById('searchInput');
  const sort = document.getElementById('sortSelect');
  search.value = state.q;
  sort.value = state.sort;

  render();
  bindProductCards(document.getElementById('productGrid'));

  document.getElementById('catChips').addEventListener('click', function (e) {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.cat = chip.dataset.cat;
    render();
  });

  let debounce;
  search.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      state.q = search.value.trim();
      render();
    }, 180);
  });

  sort.addEventListener('change', function () {
    state.sort = sort.value;
    render();
  });
});

document.addEventListener('langchange', render);
