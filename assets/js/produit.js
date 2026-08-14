/* ==========================================================================
   Fiche produit : galerie, choix taille/couleur/quantité,
   ajout au panier et commande WhatsApp directe.
   ========================================================================== */

const pdp = {
  product: null,
  color: null,
  size: null,
  qty: 1
};

function pdpTitleize() {
  document.title = Lang.pick(pdp.product, 'name') + ' — ' + SHOP.name;
}

function notFoundHtml() {
  return '<div class="cart-empty" style="margin-top:48px;">' +
    '<div class="icon">🔎</div>' +
    '<h2>' + escapeHtml(Lang.t('productNotFound')) + '</h2>' +
    '<a class="btn btn-primary" href="produits.html">' + escapeHtml(Lang.t('backToShop')) + '</a>' +
    '</div>';
}

function renderPdp() {
  const root = document.getElementById('pdpRoot');
  const p = pdp.product;

  if (!p) {
    root.innerHTML = notFoundHtml();
    return;
  }

  const cat = getCategory(p.cat);
  const ar = Lang.isAr();
  const name = Lang.pick(p, 'name');

  let html = '';

  // Fil d'Ariane
  html += '<nav class="breadcrumb">' +
            '<a href="index.html">' + (ar ? 'الرئيسية' : 'Accueil') + '</a><span>/</span>' +
            '<a href="produits.html?cat=' + encodeURIComponent(p.cat) + '">' + escapeHtml(Lang.pick(cat, 'name')) + '</a>' +
            '<span>/</span><span>' + escapeHtml(name) + '</span>' +
          '</nav>';

  html += '<div class="pdp">';

  // ---- Galerie
  html += '<div class="pdp-gallery">' +
            mediaHtml(p.img, name, 'media-main') +
            '<div class="pdp-thumbs">' +
              [1, 2, 3, 4].map(function (i) {
                const src = p.img.replace(/\.(jpg|jpeg|png|webp)$/i, '-' + i + '.$1');
                return mediaHtml(src, name + ' — ' + i);
              }).join('') +
            '</div>' +
          '</div>';

  // ---- Informations
  html += '<div class="pdp-info">';
  html += '<div class="eyebrow">' + escapeHtml(Lang.pick(cat, 'name')) + '</div>';
  html += '<h1>' + escapeHtml(name) + '</h1>';

  html += '<div class="pdp-meta">' +
            '<span class="pdp-price">' + formatPrice(p.price) + '</span>' +
            (p.oldPrice ? '<span style="font-size:17px; color:var(--muted-2); text-decoration:line-through;">' +
              formatPrice(p.oldPrice) + '</span>' : '') +
            '<span class="rating">' + stars(p.rating) + ' ' + p.rating +
              ' <span>(' + p.reviews + ' ' + Lang.t('reviews') + ')</span></span>' +
          '</div>';

  html += '<p class="pdp-desc">' + escapeHtml(Lang.pick(p, 'desc')) + '</p>';

  // Couleurs
  html += '<div class="opt-group">' +
            '<div class="opt-label"><span>' + Lang.t('colorLabel') +
              '</span><span class="picked" id="pickedColor"></span></div>' +
            '<div class="opt-colors" id="optColors">' +
              p.colors.map(function (c) {
                return '<button type="button" class="opt-color" data-color="' + escapeHtml(c.hex) + '" ' +
                       'style="background:' + escapeHtml(c.hex) + '" ' +
                       'aria-label="' + escapeHtml(Lang.pick(c, 'name')) + '"></button>';
              }).join('') +
            '</div>' +
          '</div>';

  // Tailles
  html += '<div class="opt-group">' +
            '<div class="opt-label"><span>' + Lang.t('size') +
              '</span><a href="index.html#faq" style="font-size:13px; font-weight:600;">' +
              (ar ? 'دليل المقاسات' : 'Guide des tailles') + '</a></div>' +
            '<div class="opt-sizes" id="optSizes">' +
              p.sizes.map(function (s) {
                return '<button type="button" class="opt-size" data-size="' + escapeHtml(s) + '">' +
                       escapeHtml(s) + '</button>';
              }).join('') +
            '</div>' +
          '</div>';

  // Quantité
  html += '<div class="opt-group">' +
            '<div class="opt-label"><span>' + Lang.t('qty') + '</span></div>' +
            '<div class="qty">' +
              '<button type="button" data-qty="-1" aria-label="-">−</button>' +
              '<input type="number" id="qtyInput" value="1" min="1" max="99" aria-label="' + Lang.t('qty') + '">' +
              '<button type="button" data-qty="1" aria-label="+">+</button>' +
            '</div>' +
          '</div>';

  // Actions
  html += '<div class="pdp-actions">' +
            '<button type="button" class="btn btn-primary" id="pdpAdd">' + Lang.t('addToCart') + '</button>' +
            '<a class="btn btn-wa" id="pdpWa" href="#" target="_blank" rel="noopener">' +
              (ar ? 'اطلب عبر واتساب' : 'Commander sur WhatsApp') + '</a>' +
          '</div>';

  // Réassurance
  html += '<div class="pdp-assurance">' +
            '<div><span class="tick">✓</span><span>' +
              (ar ? 'الدفع عند الاستلام في كل الولايات' : 'Paiement à la livraison dans toutes les wilayas') + '</span></div>' +
            '<div><span class="tick">✓</span><span>' +
              (ar ? 'استبدال مجاني خلال 14 يوماً' : 'Échange gratuit sous 14 jours') + '</span></div>' +
            '<div><span class="tick">✓</span><span>' +
              (ar ? '48 ساعة في الجزائر العاصمة، 2–5 أيام لباقي الولايات' : '48 h à Alger, 2 à 5 jours ailleurs') + '</span></div>' +
          '</div>';

  // Caractéristiques
  html += '<div style="margin-top:28px;">' +
            '<h3 style="font-size:18px; font-weight:600; margin-bottom:8px;">' +
              (ar ? 'الخصائص' : 'Caractéristiques') + '</h3>' +
            '<table class="spec-table"><tbody>' +
              '<tr><th>' + (ar ? 'القماش' : 'Tissu') + '</th><td>' + escapeHtml(Lang.pick(p, 'fabric')) + '</td></tr>' +
              '<tr><th>' + (ar ? 'العناية' : 'Entretien') + '</th><td>' + escapeHtml(Lang.pick(p, 'care')) + '</td></tr>' +
              '<tr><th>' + (ar ? 'المقاسات المتوفرة' : 'Tailles disponibles') + '</th><td>' + p.sizes.join(' · ') + '</td></tr>' +
              '<tr><th>' + (ar ? 'الألوان' : 'Coloris') + '</th><td>' +
                p.colors.map(function (c) { return escapeHtml(Lang.pick(c, 'name')); }).join(' · ') + '</td></tr>' +
              '<tr><th>' + (ar ? 'المرجع' : 'Référence') + '</th><td>' + escapeHtml(p.id.toUpperCase()) + '</td></tr>' +
            '</tbody></table>' +
          '</div>';

  html += '</div></div>';

  root.innerHTML = html;
  bindPdp();
  syncPdp();
}

function bindPdp() {
  const p = pdp.product;

  document.getElementById('optColors').addEventListener('click', function (e) {
    const btn = e.target.closest('.opt-color');
    if (!btn) return;
    pdp.color = btn.dataset.color;
    syncPdp();
  });

  document.getElementById('optSizes').addEventListener('click', function (e) {
    const btn = e.target.closest('.opt-size');
    if (!btn) return;
    pdp.size = btn.dataset.size;
    syncPdp();
  });

  const input = document.getElementById('qtyInput');
  document.querySelectorAll('[data-qty]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      pdp.qty = Math.max(1, Math.min(99, pdp.qty + parseInt(btn.dataset.qty, 10)));
      syncPdp();
    });
  });
  input.addEventListener('change', function () {
    const v = parseInt(input.value, 10);
    pdp.qty = isNaN(v) || v < 1 ? 1 : Math.min(v, 99);
    syncPdp();
  });

  document.getElementById('pdpAdd').addEventListener('click', function () {
    if (!pdp.size) {
      const row = document.getElementById('optSizes');
      row.classList.remove('needs-pick');
      void row.offsetWidth;
      row.classList.add('needs-pick');
      toast(Lang.t('selectSize'));
      return;
    }
    Cart.add(p.id, pdp.size, pdp.color, pdp.qty);
    toast(Lang.pick(p, 'name') + ' — ' + Lang.t('addedToast'));
  });

  // Miniatures : cliquer remplace l'image principale
  const main = document.querySelector('.media-main');
  document.querySelectorAll('.pdp-thumbs .media').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      const img = thumb.querySelector('img');
      const mainImg = main.querySelector('img');
      if (!img || img.hidden || !mainImg) return; // miniature sans photo réelle
      mainImg.hidden = false;
      mainImg.src = img.src;
      main.querySelector('.media-label').hidden = true;
      document.querySelectorAll('.pdp-thumbs .media').forEach(function (t) { t.classList.remove('is-active'); });
      thumb.classList.add('is-active');
    });
  });
}

/** Répercute l'état (couleur, taille, quantité) sur l'affichage. */
function syncPdp() {
  const p = pdp.product;

  document.querySelectorAll('.opt-color').forEach(function (b) {
    b.classList.toggle('is-active', b.dataset.color === pdp.color);
  });
  document.querySelectorAll('.opt-size').forEach(function (b) {
    b.classList.toggle('is-active', b.dataset.size === pdp.size);
  });
  document.getElementById('pickedColor').textContent = colorName(p, pdp.color);
  document.getElementById('qtyInput').value = pdp.qty;

  const wa = document.getElementById('pdpWa');
  wa.setAttribute('href', waLink(waProductMessage(p, pdp.size, pdp.color, pdp.qty)));
}

function renderRelated() {
  const p = pdp.product;
  const section = document.getElementById('relatedSection');
  const grid = document.getElementById('relatedGrid');
  if (!p) { section.hidden = true; return; }

  let list = PRODUCTS.filter(function (o) { return o.id !== p.id && o.cat === p.cat; });
  if (list.length < 3) {
    list = list.concat(PRODUCTS.filter(function (o) {
      return o.id !== p.id && o.cat !== p.cat && list.indexOf(o) < 0;
    }));
  }
  list = list.slice(0, 3);

  if (!list.length) { section.hidden = true; return; }
  section.hidden = false;
  renderProductGrid(grid, list);
}

function renderAll() {
  renderPdp();
  renderRelated();
  if (pdp.product) pdpTitleize();
}

document.addEventListener('DOMContentLoaded', function () {
  const id = new URLSearchParams(location.search).get('id');
  pdp.product = id ? getProduct(id) : null;

  if (pdp.product) {
    pdp.color = pdp.product.colors[0] ? pdp.product.colors[0].hex : null;
    pdp.size = pdp.product.sizes.length === 1 ? pdp.product.sizes[0] : null;
  }

  renderAll();
  bindProductCards(document.getElementById('relatedGrid'));
});

document.addEventListener('langchange', renderAll);
