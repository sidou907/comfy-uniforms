/* ==========================================================================
   Carte produit réutilisable (accueil + page produits).
   La carte permet de choisir taille et couleur puis d'ajouter au panier
   sans quitter la page.
   ========================================================================== */

function productCardHtml(p) {
  const cat = getCategory(p.cat);
  const tag = Lang.pick(p, 'tag');
  const href = 'produit.html?id=' + encodeURIComponent(p.id);

  let html = '<article class="product-card" data-product="' + escapeHtml(p.id) + '">';

  html += '<a class="shot media" href="' + href + '">' +
            '<img src="' + escapeHtml(p.img) + '" alt="' + escapeHtml(Lang.pick(p, 'name')) + '" loading="lazy" ' +
              'onerror="this.hidden=true;this.nextElementSibling.hidden=false">' +
            '<span class="media-label" hidden>' + escapeHtml(Lang.pick(p, 'name')) + '</span>' +
            (tag ? '<span class="tag">' + escapeHtml(tag) + '</span>' : '') +
          '</a>';

  html += '<div class="body">';

  html += '<div class="head">' +
            '<div>' +
              '<h3><a href="' + href + '">' + escapeHtml(Lang.pick(p, 'name')) + '</a></h3>' +
              '<div class="cat">' + escapeHtml(cat ? Lang.pick(cat, 'name') : '') + '</div>' +
            '</div>' +
            '<div class="price-col">' +
              '<div class="price">' + formatPrice(p.price) + '</div>' +
              '<div class="rating">★ ' + p.rating + ' <span>(' + p.reviews + ')</span></div>' +
            '</div>' +
          '</div>';

  // Couleurs sélectionnables (la première est active par défaut)
  html += '<div class="swatches" data-role="colors">';
  p.colors.forEach(function (c, i) {
    html += '<button type="button" class="swatch' + (i === 0 ? ' is-active' : '') + '" ' +
              'style="background:' + escapeHtml(c.hex) + '" data-color="' + escapeHtml(c.hex) + '" ' +
              'title="' + escapeHtml(Lang.pick(c, 'name')) + '" ' +
              'aria-label="' + escapeHtml(Lang.pick(c, 'name')) + '"></button>';
  });
  html += '<span class="swatch-label">' + p.colors.length + ' ' + Lang.t('colors') + '</span>';
  html += '</div>';

  // Tailles sélectionnables ; taille unique => présélectionnée
  const single = p.sizes.length === 1;
  html += '<div class="size-row" data-role="sizes">';
  p.sizes.forEach(function (s) {
    html += '<button type="button" class="size-chip' + (single ? ' is-active' : '') + '" data-size="' +
            escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
  });
  html += '</div>';

  html += '<button type="button" class="card-add" data-role="add">' + Lang.t('addToCart') + '</button>';

  html += '</div></article>';
  return html;
}

/**
 * Active les cartes d'un conteneur : sélection couleur/taille et ajout au panier.
 * À n'appeler qu'une fois par conteneur (délégation d'événements).
 */
function bindProductCards(container) {
  container.addEventListener('click', function (e) {
    const card = e.target.closest('.product-card');
    if (!card) return;

    const swatch = e.target.closest('.swatch');
    if (swatch) {
      card.querySelectorAll('.swatch').forEach(function (s) { s.classList.remove('is-active'); });
      swatch.classList.add('is-active');
      return;
    }

    const chip = e.target.closest('.size-chip');
    if (chip) {
      card.querySelectorAll('.size-chip').forEach(function (s) { s.classList.remove('is-active'); });
      chip.classList.add('is-active');
      card.querySelector('[data-role="sizes"]').classList.remove('needs-pick');
      return;
    }

    const addBtn = e.target.closest('[data-role="add"]');
    if (!addBtn) return;

    const p = getProduct(card.dataset.product);
    if (!p) return;

    const sizeRow = card.querySelector('[data-role="sizes"]');
    const activeSize = sizeRow.querySelector('.size-chip.is-active');
    if (!activeSize) {
      sizeRow.classList.remove('needs-pick');
      void sizeRow.offsetWidth;
      sizeRow.classList.add('needs-pick');
      toast(Lang.t('selectSize'));
      return;
    }

    const activeColor = card.querySelector('.swatch.is-active');
    Cart.add(p.id, activeSize.dataset.size, activeColor ? activeColor.dataset.color : '', 1);

    addBtn.textContent = Lang.t('added');
    addBtn.classList.add('is-done');
    setTimeout(function () {
      addBtn.textContent = Lang.t('addToCart');
      addBtn.classList.remove('is-done');
    }, 1400);

    toast(Lang.pick(p, 'name') + ' — ' + Lang.t('addedToast'));
  });
}

/** Remplit une grille avec une liste de produits. */
function renderProductGrid(container, list) {
  if (!list.length) {
    container.innerHTML = '<div class="empty-state">' + escapeHtml(Lang.t('noResult')) + '</div>';
    return;
  }
  container.innerHTML = list.map(productCardHtml).join('');
}
