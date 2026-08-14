/* ==========================================================================
   Page d'accueil : grille des catégories, best-sellers, formulaire contact.
   ========================================================================== */

function renderCategories() {
  const grid = document.getElementById('catGrid');
  if (!grid) return;

  // Une catégorie encore vide n'est pas montrée : elle apparaîtra d'elle-même
  // dès qu'un produit lui sera rattaché. Si le catalogue est entièrement vide,
  // on les affiche toutes plutôt que de laisser un trou.
  const filled = CATEGORIES.filter(function (c) { return countByCategory(c.id) > 0; });
  const list = filled.length ? filled : CATEGORIES;

  grid.innerHTML = list.map(function (c) {
    const label = Lang.pick(c, 'name');
    return '<a class="cat-card" href="produits.html?cat=' + encodeURIComponent(c.id) + '">' +
      mediaHtml(c.img, label) +
      '<div class="body">' +
        '<div class="name">' + escapeHtml(label) + '</div>' +
        '<div class="count">' + countByCategory(c.id) + ' ' + Lang.t('models') + '</div>' +
      '</div></a>';
  }).join('');
}

function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  // Tant qu'aucun produit n'est coché « page d'accueil », on montre les premiers
  // du catalogue : la section n'est jamais vide.
  const chosen = PRODUCTS.filter(function (p) { return p.featured; });
  renderProductGrid(grid, chosen.length ? chosen : PRODUCTS.slice(0, 6));
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // form.elements[...] et non form.name : sur un <form>, .name désigne l'attribut du formulaire.
  const el = form.elements;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = el.name.value.trim();
    const phone = el.phone.value.trim();

    if (!name) { el.name.classList.add('field-error'); el.name.focus(); toast(Lang.t('fillName')); return; }
    el.name.classList.remove('field-error');

    if (!/^[0-9+\s().-]{9,}$/.test(phone)) {
      el.phone.classList.add('field-error'); el.phone.focus(); toast(Lang.t('fillPhone')); return;
    }
    el.phone.classList.remove('field-error');

    const ar = Lang.isAr();
    const L = [];
    L.push(ar ? 'السلام عليكم، أود الاستفسار:' : 'Bonjour, je vous contacte via le site :');
    L.push('');
    L.push((ar ? '👤 الاسم : ' : '👤 Nom : ') + name);
    L.push((ar ? '📞 الهاتف : ' : '📞 Téléphone : ') + phone);
    if (el.email.value.trim()) L.push((ar ? '✉️ البريد : ' : '✉️ Email : ') + el.email.value.trim());
    L.push((ar ? '📦 نوع الطلب : ' : '📦 Type : ') + el.type.value);
    if (el.message.value.trim()) {
      L.push('');
      L.push(el.message.value.trim());
    }

    window.open(waLink(L.join('\n')), '_blank', 'noopener');
    toast(Lang.t('orderSent'));
    form.reset();
  });
}

function renderHome() {
  renderCategories();
  renderFeatured();
}

document.addEventListener('DOMContentLoaded', function () {
  renderHome();
  bindProductCards(document.getElementById('featuredGrid'));
  initContactForm();
});

document.addEventListener('langchange', renderHome);
