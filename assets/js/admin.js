/* ==========================================================================
   Espace de gestion — outil local.
   Édite une copie de travail (SHOP + PRODUCTS) conservée dans le navigateur,
   puis régénère un fichier data.js complet, prêt à remplacer l'ancien.
   Ce fichier n'est utilisé que par admin.html : le site public l'ignore.
   ========================================================================== */

const DRAFT_KEY = 'cu_admin_v1';
const PHOTOS_KEY = 'cu_admin_photos_v1';
const PHOTOS_MAX = 4 * 1024 * 1024; // au-delà, le stockage du navigateur sature

/** Traduction courte pour les textes générés ici. */
const tx = (fr, ar) => (Lang.isAr() ? ar : fr);

const state = {
  shop: null,
  products: null,
  editingId: null,   // null = création d'un nouveau produit
  form: null,        // produit en cours de saisie
  photoData: null,   // photo du produit en cours : { dataUrl, base64, bytes }
  photos: {},        // photos choisies mais pas encore publiées, par identifiant
  exported: true     // false dès qu'une modification n'a pas encore été enregistrée
};

/* --------------------------------------------------------------------------
   Chargement / sauvegarde du brouillon
   -------------------------------------------------------------------------- */

function deepCopy(o) { return JSON.parse(JSON.stringify(o)); }

function loadDraft() {
  try {
    const rawPhotos = localStorage.getItem(PHOTOS_KEY);
    if (rawPhotos) state.photos = JSON.parse(rawPhotos) || {};
  } catch (e) { state.photos = {}; }

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.products) && d.shop) {
        state.shop = d.shop;
        state.products = d.products;
        state.exported = d.exported !== false;
        return;
      }
    }
  } catch (e) { /* brouillon illisible : on repart du catalogue livré */ }
  state.shop = deepCopy(SHOP);
  state.products = deepCopy(PRODUCTS);
}

function photosBytes() {
  return Object.keys(state.photos).reduce(function (n, k) {
    return n + (state.photos[k].bytes || 0);
  }, 0);
}

function savePhotos() {
  try {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(state.photos));
  } catch (e) {
    alert(tx('Trop de photos en attente : publiez-les avant d’en ajouter d’autres.',
             'صور كثيرة في الانتظار: انشرها قبل إضافة غيرها.'));
  }
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      shop: state.shop, products: state.products, exported: state.exported
    }));
  } catch (e) {
    alert(tx('Impossible d’enregistrer : la mémoire du navigateur est pleine.',
             'تعذّر الحفظ: ذاكرة المتصفح ممتلئة.'));
  }
}

function markDirty() {
  state.exported = false;
  saveDraft();
}

/* --------------------------------------------------------------------------
   Utilitaires
   -------------------------------------------------------------------------- */

function slugify(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // enlève les accents
    .toLowerCase()
    .replace(/[«»"'’]/g, '')
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function uniqueId(base, exceptId) {
  let id = base || 'produit';
  let n = 2;
  while (state.products.some(p => p.id === id && p.id !== exceptId)) {
    id = base + '-' + n;
    n++;
  }
  return id;
}

function emptyProduct() {
  return {
    id: '', name: '', name_ar: '', cat: CATEGORIES[0].id,
    price: null, oldPrice: null, rating: 5, reviews: 0,
    tag: '', tag_ar: '', featured: false,
    colors: [], sizes: [],
    img: '', desc: '', desc_ar: '',
    fabric: '', fabric_ar: '', care: '', care_ar: ''
  };
}

/** Extension actuelle de la photo d'un produit (jpg par défaut). */
function extOf(img) {
  const m = /\.(jpg|jpeg|png|webp)$/i.exec(img || '');
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

/* --------------------------------------------------------------------------
   Liste des produits
   -------------------------------------------------------------------------- */

function renderList() {
  const host = document.getElementById('plist');
  const hint = document.getElementById('listHint');

  hint.textContent = state.products.length + ' ' +
    tx(state.products.length > 1 ? 'produits en ligne' : 'produit en ligne', 'منتج في المتجر') +
    ' · ' + tx('cliquez pour modifier', 'اضغط للتعديل');

  if (!state.products.length) {
    host.innerHTML = '<div class="empty-state">' +
      tx('Aucun produit. Commencez par « + Nouveau ».', 'لا توجد منتجات. ابدأ بـ «+ منتج جديد».') + '</div>';
    return;
  }

  host.innerHTML = state.products.map(function (p, i) {
    const cat = getCategory(p.cat);
    return '<div class="pitem' + (p.id === state.editingId ? ' is-editing' : '') + '" data-id="' + escapeHtml(p.id) + '">' +
      mediaHtml(p.img, '') +
      '<div class="t">' +
        '<b>' + escapeHtml(Lang.pick(p, 'name') || tx('(sans nom)', '(بدون اسم)')) + '</b>' +
        '<span>' + escapeHtml(cat ? Lang.pick(cat, 'name') : '?') + ' · ' + formatPrice(p.price || 0) + '</span>' +
      '</div>' +
      '<div class="acts">' +
        '<button class="icon-btn" type="button" data-act="feat" title="' + tx('Page d’accueil', 'الصفحة الرئيسية') + '">' +
          (p.featured ? '<span class="star-on">★</span>' : '☆') + '</button>' +
        '<button class="icon-btn" type="button" data-act="up" title="' + tx('Monter', 'أعلى') + '"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button class="icon-btn" type="button" data-act="down" title="' + tx('Descendre', 'أسفل') + '"' + (i === state.products.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button class="icon-btn" type="button" data-act="dup" title="' + tx('Dupliquer', 'نسخ') + '">⧉</button>' +
        '<button class="icon-btn danger" type="button" data-act="del" title="' + tx('Supprimer', 'حذف') + '">✕</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function bindList() {
  document.getElementById('plist').addEventListener('click', function (e) {
    const item = e.target.closest('.pitem');
    if (!item) return;
    const id = item.dataset.id;
    const i = state.products.findIndex(p => p.id === id);
    if (i < 0) return;

    const act = e.target.closest('[data-act]');
    if (!act) { editProduct(id); return; }

    const p = state.products[i];
    switch (act.dataset.act) {
      case 'feat':
        p.featured = !p.featured;
        break;
      case 'up':
        if (i > 0) state.products.splice(i - 1, 0, state.products.splice(i, 1)[0]);
        break;
      case 'down':
        if (i < state.products.length - 1) state.products.splice(i + 1, 0, state.products.splice(i, 1)[0]);
        break;
      case 'dup': {
        const copy = deepCopy(p);
        copy.id = uniqueId(p.id + '-copie');
        copy.name = p.name + ' (copie)';
        copy.img = 'assets/img/products/' + copy.id + '.' + extOf(p.img);
        state.products.splice(i + 1, 0, copy);
        break;
      }
      case 'del': {
        const label = Lang.pick(p, 'name');
        if (!confirm(tx('Supprimer définitivement « ' + label + ' » ?', 'حذف «' + label + '» نهائياً؟'))) return;
        state.products.splice(i, 1);
        if (state.editingId === id) newProduct();
        break;
      }
      default: return;
    }
    markDirty();
    renderList();
    renderStats();
  });
}

/* --------------------------------------------------------------------------
   Formulaire produit
   -------------------------------------------------------------------------- */

const form = () => document.getElementById('pform');

function fillCategorySelect() {
  const sel = document.getElementById('catSelect');
  const keep = sel.value;
  sel.innerHTML = CATEGORIES.map(c =>
    '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(Lang.pick(c, 'name')) + '</option>').join('');
  if (keep) sel.value = keep;
}

function renderPalette() {
  const host = document.getElementById('palette');
  const chosen = state.form.colors;

  // Palette du fichier + couleurs personnalisées déjà utilisées par ce produit
  const list = Object.keys(C).map(k => C[k]).slice();
  chosen.forEach(function (c) {
    if (!list.some(o => o.hex.toUpperCase() === c.hex.toUpperCase() && o.name === c.name)) list.push(c);
  });

  host.innerHTML = list.map(function (c) {
    const on = chosen.some(o => o.hex.toUpperCase() === c.hex.toUpperCase() && o.name === c.name);
    return '<button class="pal-item' + (on ? ' is-on' : '') + '" type="button" ' +
      'data-hex="' + escapeHtml(c.hex) + '" data-name="' + escapeHtml(c.name) + '">' +
      '<span class="dot" style="background:' + escapeHtml(c.hex) + '"></span>' +
      escapeHtml(Lang.pick(c, 'name')) + '</button>';
  }).join('');
}

const SIZE_POOL = {
  vetement: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  unique: ['Taille unique'],
  pointures: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
};

function renderSizes() {
  const presets = document.getElementById('sizePresets');
  presets.innerHTML =
    '<button class="chip-sm" type="button" data-preset="vetement">' + tx('Vêtement XS→XXL', 'ملابس XS→XXL') + '</button>' +
    '<button class="chip-sm" type="button" data-preset="unique">' + tx('Taille unique', 'مقاس واحد') + '</button>' +
    '<button class="chip-sm" type="button" data-preset="pointures">' + tx('Pointures 36→45', 'أرقام 36→45') + '</button>' +
    '<button class="chip-sm" type="button" data-preset="clear">' + tx('Tout retirer', 'مسح الكل') + '</button>';

  const pool = SIZE_POOL.vetement.concat(SIZE_POOL.unique, SIZE_POOL.pointures);
  state.form.sizes.forEach(s => { if (pool.indexOf(s) < 0) pool.push(s); });

  document.getElementById('sizeChips').innerHTML = pool.map(function (s) {
    const on = state.form.sizes.indexOf(s) >= 0;
    return '<button class="chip-sm' + (on ? ' is-on' : '') + '" type="button" data-size="' +
      escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
  }).join('');
}

function renderPhoto() {
  const id = form().elements.id.value.trim() || slugify(form().elements.name.value) || 'produit';
  const ext = document.getElementById('photoExt').value;
  const path = 'assets/img/products/' + id + '.' + ext;
  state.form.img = path;
  document.getElementById('photoPath').textContent = path;

  const box = document.getElementById('photoPreview');
  if (state.photoData) {
    box.innerHTML = '<img src="' + state.photoData.dataUrl + '" alt="">';
  } else {
    box.innerHTML = '<img src="' + escapeHtml(path) + '" alt="" ' +
      'onerror="this.hidden=true;this.nextElementSibling.hidden=false">' +
      '<span class="media-label" hidden>' + tx('photo à copier', 'الصورة غير موجودة') + '</span>';
  }
}

/** Recopie les champs du formulaire dans state.form. */
function readForm() {
  const el = form().elements;
  const f = state.form;
  f.name = el.name.value.trim();
  f.name_ar = el.name_ar.value.trim();
  f.cat = el.cat.value;
  f.price = el.price.value === '' ? null : Number(el.price.value);
  f.oldPrice = el.oldPrice.value === '' ? null : Number(el.oldPrice.value);
  f.tag = el.tag.value.trim();
  f.tag_ar = el.tag_ar.value.trim();
  f.featured = el.featured.checked;
  f.desc = el.desc.value.trim();
  f.desc_ar = el.desc_ar.value.trim();
  f.fabric = el.fabric.value.trim();
  f.fabric_ar = el.fabric_ar.value.trim();
  f.care = el.care.value.trim();
  f.care_ar = el.care_ar.value.trim();
  f.rating = el.rating.value === '' ? 5 : Number(el.rating.value);
  f.reviews = el.reviews.value === '' ? 0 : Number(el.reviews.value);
  f.id = el.id.value.trim();
  return f;
}

function writeForm() {
  const el = form().elements;
  const f = state.form;
  el.name.value = f.name || '';
  el.name_ar.value = f.name_ar || '';
  el.cat.value = f.cat || CATEGORIES[0].id;
  el.price.value = f.price === null || f.price === undefined ? '' : f.price;
  el.oldPrice.value = f.oldPrice === null || f.oldPrice === undefined ? '' : f.oldPrice;
  el.tag.value = f.tag || '';
  el.tag_ar.value = f.tag_ar || '';
  el.featured.checked = !!f.featured;
  el.desc.value = f.desc || '';
  el.desc_ar.value = f.desc_ar || '';
  el.fabric.value = f.fabric || '';
  el.fabric_ar.value = f.fabric_ar || '';
  el.care.value = f.care || '';
  el.care_ar.value = f.care_ar || '';
  el.rating.value = f.rating === undefined ? '' : f.rating;
  el.reviews.value = f.reviews === undefined ? '' : f.reviews;
  el.id.value = f.id || '';
  // L'identifiant redevient automatique tant qu'il n'a pas été retouché.
  el.id.dataset.touched = f.id ? '1' : '';
  document.getElementById('photoExt').value = extOf(f.img);
}

function refreshForm() {
  renderPalette();
  renderSizes();
  renderPhoto();
  renderPreview();
}

function newProduct() {
  state.editingId = null;
  state.form = emptyProduct();
  state.photoData = null;
  const info = document.getElementById('photoInfo');
  if (info) info.textContent = '';
  document.getElementById('formTitle').textContent = tx('Nouveau produit', 'منتج جديد');
  document.getElementById('formError').hidden = true;
  writeForm();
  refreshForm();
  renderList();
}

function editProduct(id) {
  const p = state.products.find(o => o.id === id);
  if (!p) return;
  state.editingId = id;
  state.form = deepCopy(p);
  // Photo deja choisie pour ce produit mais pas encore publiee : on la remontre.
  state.photoData = state.photos[id] || null;
  const info = document.getElementById('photoInfo');
  if (info) {
    info.textContent = state.photoData
      ? tx('Photo en attente de publication — ' + formatBytes(state.photoData.bytes),
           'صورة تنتظر النشر — ' + formatBytes(state.photoData.bytes))
      : '';
  }
  document.getElementById('formTitle').textContent = tx('Modifier le produit', 'تعديل المنتج');
  document.getElementById('formError').hidden = true;
  writeForm();
  refreshForm();
  renderList();
  document.getElementById('pform').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showError(msg) {
  const box = document.getElementById('formError');
  box.textContent = msg;
  box.hidden = false;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function saveProduct(e) {
  e.preventDefault();
  const f = readForm();

  if (!f.name) return showError(tx('Le nom du produit en français est obligatoire.', 'اسم المنتج بالفرنسية إجباري.'));
  if (f.price === null || isNaN(f.price) || f.price <= 0) {
    return showError(tx('Indiquez un prix valide en dinars.', 'أدخل سعراً صحيحاً بالدينار.'));
  }
  if (!f.colors.length) return showError(tx('Choisissez au moins un coloris.', 'اختر لوناً واحداً على الأقل.'));
  if (!f.sizes.length) return showError(tx('Choisissez au moins une taille.', 'اختر مقاساً واحداً على الأقل.'));

  f.id = uniqueId(slugify(f.id) || slugify(f.name), state.editingId);
  f.img = 'assets/img/products/' + f.id + '.' + document.getElementById('photoExt').value;

  const clean = deepCopy(f);
  if (state.editingId) {
    const i = state.products.findIndex(p => p.id === state.editingId);
    // L'identifiant a pu changer : la photo en attente suit le produit.
    if (state.editingId !== clean.id && state.photos[state.editingId]) {
      state.photos[clean.id] = state.photos[state.editingId];
      delete state.photos[state.editingId];
    }
    state.products[i] = clean;
  } else {
    state.products.push(clean);
  }

  // Photo choisie pendant la saisie : elle part au prochain « Publier ».
  if (state.photoData) {
    state.photos[clean.id] = state.photoData;
    if (photosBytes() > PHOTOS_MAX) {
      alert(tx('Beaucoup de photos attendent d’être publiées. Publiez maintenant pour ne rien perdre.',
               'صور كثيرة تنتظر النشر. انشرها الآن حتى لا تفقدها.'));
    }
    savePhotos();
  }

  markDirty();
  document.getElementById('formError').hidden = true;
  state.editingId = clean.id;
  state.form = deepCopy(clean);
  writeForm();
  refreshForm();
  renderList();
  renderStats();
  document.getElementById('formTitle').textContent = tx('Modifier le produit', 'تعديل المنتج');
  toast(tx('Produit enregistré ✓', 'تم حفظ المنتج ✓'));
}

/* --------------------------------------------------------------------------
   Aperçu de la fiche
   -------------------------------------------------------------------------- */

function renderPreview() {
  const host = document.getElementById('preview');
  const f = state.form;

  if (!f.name || !f.price) {
    host.innerHTML = '<div class="empty-state">' +
      tx('Renseignez le nom et le prix pour voir l’aperçu.', 'أدخل الاسم والسعر لرؤية المعاينة.') + '</div>';
    return;
  }

  host.innerHTML = productCardHtml({
    id: f.id || 'apercu',
    name: f.name, name_ar: f.name_ar,
    cat: f.cat, price: f.price,
    rating: f.rating || 5, reviews: f.reviews || 0,
    tag: f.tag, tag_ar: f.tag_ar,
    colors: f.colors.length ? f.colors : [C.navy],
    sizes: f.sizes.length ? f.sizes : ['M'],
    img: f.img
  });

  if (state.photoData) {
    const img = host.querySelector('.shot img');
    if (img) { img.hidden = false; img.src = state.photoData.dataUrl; }
    const label = host.querySelector('.shot .media-label');
    if (label) label.hidden = true;
  }
}

/** Sélection de couleur/taille dans l'aperçu, sans toucher au panier. */
function bindPreview() {
  document.getElementById('preview').addEventListener('click', function (e) {
    const sw = e.target.closest('.swatch');
    if (sw) {
      this.querySelectorAll('.swatch').forEach(s => s.classList.remove('is-active'));
      sw.classList.add('is-active');
      return;
    }
    const chip = e.target.closest('.size-chip');
    if (chip) {
      this.querySelectorAll('.size-chip').forEach(s => s.classList.remove('is-active'));
      chip.classList.add('is-active');
      return;
    }
    if (e.target.closest('[data-role="add"]')) {
      toast(tx('Aperçu seulement — le vrai bouton fonctionne sur le site.',
               'معاينة فقط — الزر الحقيقي يعمل على الموقع.'));
    }
  });
}

/* --------------------------------------------------------------------------
   Onglet boutique
   -------------------------------------------------------------------------- */

/** 0773 74 73 89 / +213 773… / 213773…  ->  213773747389 */
function toInternational(display) {
  let d = String(display).replace(/[^0-9]/g, '');
  if (d.indexOf('00213') === 0) d = d.slice(2);
  if (d.indexOf('213') === 0) return d;
  if (d.indexOf('0') === 0) return '213' + d.slice(1);
  return d ? '213' + d : '';
}

function renderShopForm() {
  const el = document.getElementById('sform').elements;
  const s = state.shop;
  el.name.value = s.name || '';
  el.phoneDisplay.value = s.phoneDisplay || '';
  el.email.value = s.email || '';
  el.facebook.value = s.facebook || '';
  el.instagram.value = s.instagram || '';
  el.deliveryFee.value = s.deliveryFee || 0;
  el.freeDeliveryFrom.value = s.freeDeliveryFrom || 0;
  renderWaHint();
}

function renderWaHint() {
  const v = document.getElementById('sform').elements.phoneDisplay.value;
  const intl = toInternational(v);
  document.getElementById('waHint').innerHTML = intl
    ? tx('Les commandes partiront vers : ', 'ستصل الطلبات إلى: ') +
      '<b style="color:var(--accent)">wa.me/' + escapeHtml(intl) + '</b>'
    : tx('Saisissez le numéro qui recevra les commandes WhatsApp.', 'أدخل الرقم الذي سيستقبل طلبات واتساب.');
}

function saveShop(e) {
  e.preventDefault();
  const el = document.getElementById('sform').elements;
  const intl = toInternational(el.phoneDisplay.value);
  if (intl.length < 11) {
    alert(tx('Numéro de téléphone invalide.', 'رقم الهاتف غير صحيح.'));
    return;
  }
  state.shop.name = el.name.value.trim();
  state.shop.phoneDisplay = el.phoneDisplay.value.trim();
  state.shop.whatsapp = intl;
  state.shop.phoneHref = '+' + intl;
  state.shop.email = el.email.value.trim();
  state.shop.facebook = el.facebook.value.trim();
  state.shop.instagram = el.instagram.value.trim();
  state.shop.deliveryFee = Number(el.deliveryFee.value) || 0;
  state.shop.freeDeliveryFrom = Number(el.freeDeliveryFrom.value) || 0;
  markDirty();
  toast(tx('Informations enregistrées ✓', 'تم حفظ المعلومات ✓'));
}

/* --------------------------------------------------------------------------
   Onglet publier : statistiques et photos manquantes
   -------------------------------------------------------------------------- */

function renderSteps() {
  // Rendu en JS pour garder la mise en forme (gras, code) dans les deux langues.
  const steps = Lang.isAr() ? [
    'اضغط <b>💾 حفظ في الموقع</b>. تُفتح نافذة حفظ: اذهب إلى مجلد <code>site/assets/js/</code>، اختر الملف <code>data.js</code> الموجود واقبل الاستبدال.',
    'انسخ صور المنتجات الجديدة إلى <code>site/assets/img/products/</code> بالأسماء المذكورة أسفله.',
    'افتح <code>index.html</code> بنقرة مزدوجة للتأكد أن كل شيء يظهر كما يجب.',
    'على Cloudflare Pages: مشروعك ← <b>Create new deployment</b> ← اسحب محتوى مجلد <code>site</code>.'
  ] : [
    'Cliquez sur <b>💾 Enregistrer dans le site</b>. Une fenêtre s\'ouvre : allez dans <code>site/assets/js/</code>, sélectionnez le fichier <code>data.js</code> existant et acceptez de le remplacer.',
    'Copiez les nouvelles photos dans <code>site/assets/img/products/</code> avec les noms indiqués plus bas.',
    'Ouvrez <code>index.html</code> (double-clic) pour vérifier que tout s\'affiche correctement.',
    'Sur Cloudflare Pages : votre projet → <b>Create new deployment</b> → glissez le contenu du dossier <code>site</code>.'
  ];
  document.getElementById('publishSteps').innerHTML =
    steps.map(function (s) { return '<li>' + s + '</li>'; }).join('');
}

function renderTokenSteps() {
  const c = GH.get();
  const repo = (c.owner || 'sidou907') + '/' + (c.repo || 'comfy-uniforms');
  const steps = Lang.isAr() ? [
    'افتح <code>github.com/settings/personal-access-tokens/new</code> وسجّل الدخول.',
    'الاسم: <code>boutique</code> — والمدة: اختر <b>No expiration</b> حتى لا تعيد العملية.',
    'في <b>Repository access</b> اختر <b>Only select repositories</b> ثم <code>' + repo + '</code>.',
    'في <b>Permissions ▸ Repository permissions</b> اضبط <b>Contents</b> على <b>Read and write</b>. لا شيء غير ذلك.',
    'اضغط <b>Generate token</b>، انسخ الرمز، والصقه في الخانة أعلاه ثم احفظ.'
  ] : [
    'Ouvrez <code>github.com/settings/personal-access-tokens/new</code> et connectez-vous.',
    'Nom : <code>boutique</code> — Expiration : choisissez <b>No expiration</b> pour ne pas recommencer.',
    'Dans <b>Repository access</b> : <b>Only select repositories</b>, puis <code>' + repo + '</code>.',
    'Dans <b>Permissions ▸ Repository permissions</b> : mettez <b>Contents</b> sur <b>Read and write</b>. Rien d\'autre.',
    'Cliquez <b>Generate token</b>, copiez-le et collez-le dans le champ ci-dessus, puis enregistrez.'
  ];
  const host = document.getElementById('tokenSteps');
  if (host) host.innerHTML = steps.map(s => '<li>' + s + '</li>').join('');
}

function renderStats() {
  document.getElementById('statProducts').textContent = state.products.length;
  document.getElementById('statFeatured').textContent = state.products.filter(p => p.featured).length;
  renderSteps();
  checkPhotos();
}

function checkPhotos() {
  const missing = [];
  let pending = state.products.length;
  if (!pending) { showMissing([]); return; }

  state.products.forEach(function (p) {
    const img = new Image();
    img.onload = done;
    img.onerror = function () { missing.push(p); done(); };
    img.src = p.img;
    function done() { if (--pending === 0) showMissing(missing); }
  });
}

function showMissing(missing) {
  document.getElementById('statPhotos').textContent = missing.length;
  const host = document.getElementById('missingPhotos');
  if (!missing.length) {
    host.textContent = tx('Toutes les photos sont en place.', 'كل الصور موجودة.');
    return;
  }
  host.innerHTML = '<b>' + tx('Photos encore à copier dans assets/img/products/ :', 'صور يجب نسخها إلى assets/img/products/ :') +
    '</b><br>' + missing.map(p =>
      '<code>' + escapeHtml(p.img.split('/').pop()) + '</code> — ' + escapeHtml(Lang.pick(p, 'name'))
    ).join('<br>');
}

/* --------------------------------------------------------------------------
   Génération du fichier data.js
   -------------------------------------------------------------------------- */

function q(s) {
  if (s === null || s === undefined || s === '') return "''";
  return "'" + String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n') + "'";
}
function qOrNull(s) { return (s === null || s === undefined || s === '') ? 'null' : q(s); }
function numOrNull(n) { return (n === null || n === undefined || n === '' || isNaN(n)) ? 'null' : String(n); }

function colorRef(c) {
  const key = Object.keys(C).find(k =>
    C[k].hex.toUpperCase() === String(c.hex).toUpperCase() && C[k].name === c.name);
  if (key) return 'C.' + key;
  return '{ hex: ' + q(c.hex) + ', name: ' + q(c.name) + ', name_ar: ' + q(c.name_ar) + ' }';
}

function sameArray(a, b) { return a.length === b.length && a.every((v, i) => v === b[i]); }

function sizesRef(sizes) {
  if (sameArray(sizes, SIZES_STD)) return 'SIZES_STD';
  if (sameArray(sizes, SIZES_ACC)) return 'SIZES_ACC';
  return '[' + sizes.map(q).join(', ') + ']';
}

function productBlock(p) {
  return [
    '  {',
    '    id: ' + q(p.id) + ',',
    '    name: ' + q(p.name) + ',',
    '    name_ar: ' + q(p.name_ar) + ',',
    '    cat: ' + q(p.cat) + ',',
    '    price: ' + numOrNull(p.price) + ', oldPrice: ' + numOrNull(p.oldPrice) + ',',
    '    rating: ' + numOrNull(p.rating) + ', reviews: ' + numOrNull(p.reviews) + ',',
    '    tag: ' + qOrNull(p.tag) + ', tag_ar: ' + qOrNull(p.tag_ar) + ',',
    '    featured: ' + (p.featured ? 'true' : 'false') + ',',
    '    colors: [' + p.colors.map(colorRef).join(', ') + '],',
    '    sizes: ' + sizesRef(p.sizes) + ',',
    '    img: ' + q(p.img) + ',',
    '    desc: ' + q(p.desc) + ',',
    '    desc_ar: ' + q(p.desc_ar) + ',',
    '    fabric: ' + q(p.fabric) + ',',
    '    fabric_ar: ' + q(p.fabric_ar) + ',',
    '    care: ' + q(p.care) + ',',
    '    care_ar: ' + q(p.care_ar),
    '  }'
  ].join('\n');
}

function buildDataFile() {
  const s = state.shop;
  const L = [];

  L.push('/* ==========================================================================');
  L.push('   Données du site — fichier généré depuis admin.html.');
  L.push('   Vous pouvez aussi le modifier à la main : la structure reste la même.');
  L.push('   Dernière mise à jour : ' + new Date().toLocaleString('fr-FR'));
  L.push('   ========================================================================== */');
  L.push('');
  L.push('/* --------------------------------------------------------------------------');
  L.push('   1) Coordonnées de la boutique');
  L.push('   -------------------------------------------------------------------------- */');
  L.push('const SHOP = {');
  L.push('  name: ' + q(s.name) + ',');
  L.push('');
  L.push('  // Numéro WhatsApp au format international SANS "+" ni espaces.');
  L.push('  // ' + s.phoneDisplay + '  ->  ' + q(s.whatsapp));
  L.push('  whatsapp: ' + q(s.whatsapp) + ',');
  L.push('');
  L.push('  phoneDisplay: ' + q(s.phoneDisplay) + ',');
  L.push('  phoneHref: ' + q(s.phoneHref) + ',');
  L.push('  email: ' + q(s.email) + ',');
  L.push('  facebook: ' + q(s.facebook) + ',');
  L.push('  instagram: ' + q(s.instagram) + ',');
  L.push('  currency: ' + q(s.currency || 'DA') + ',');
  L.push('  currencyAr: ' + q(s.currencyAr || 'دج') + ',');
  L.push('');
  L.push('  // Livraison : gratuite à partir de ce montant (0 = jamais gratuite)');
  L.push('  deliveryFee: ' + (s.deliveryFee || 0) + ',');
  L.push('  freeDeliveryFrom: ' + (s.freeDeliveryFrom || 0));
  L.push('};');
  L.push('');

  L.push('/* --------------------------------------------------------------------------');
  L.push('   2) Catégories');
  L.push('   -------------------------------------------------------------------------- */');
  L.push('const CATEGORIES = [');
  L.push(CATEGORIES.map(c =>
    '  { id: ' + q(c.id) + ', name: ' + q(c.name) + ', name_ar: ' + q(c.name_ar) +
    ', img: ' + q(c.img) + ' }').join(',\n'));
  L.push('];');
  L.push('');

  L.push('/* --------------------------------------------------------------------------');
  L.push('   3) Couleurs réutilisables');
  L.push('   -------------------------------------------------------------------------- */');
  L.push('const C = {');
  L.push(Object.keys(C).map(k =>
    '  ' + k + ': { hex: ' + q(C[k].hex) + ', name: ' + q(C[k].name) +
    ', name_ar: ' + q(C[k].name_ar) + ' }').join(',\n'));
  L.push('};');
  L.push('');
  L.push('const SIZES_STD = [' + SIZES_STD.map(q).join(', ') + '];');
  L.push('const SIZES_ACC = [' + SIZES_ACC.map(q).join(', ') + '];');
  L.push('');

  L.push('/* --------------------------------------------------------------------------');
  L.push('   4) Catalogue produits');
  L.push('        img : si le fichier photo n\'existe pas, un cadre gris s\'affiche.');
  L.push('   -------------------------------------------------------------------------- */');
  L.push('const PRODUCTS = [');
  L.push(state.products.map(productBlock).join(',\n'));
  L.push('];');
  L.push('');

  L.push('/* --------------------------------------------------------------------------');
  L.push('   5) Wilayas (pour le formulaire de commande)');
  L.push('   -------------------------------------------------------------------------- */');
  L.push('const WILAYAS = [');
  const rows = [];
  for (let i = 0; i < WILAYAS.length; i += 4) {
    rows.push('  ' + WILAYAS.slice(i, i + 4).map(q).join(', '));
  }
  L.push(rows.join(',\n'));
  L.push('];');
  L.push('');

  L.push('/* --------------------------------------------------------------------------');
  L.push('   Aides d\'accès');
  L.push('   -------------------------------------------------------------------------- */');
  L.push('function getProduct(id) {');
  L.push('  return PRODUCTS.find(function (p) { return p.id === id; }) || null;');
  L.push('}');
  L.push('function getCategory(id) {');
  L.push('  return CATEGORIES.find(function (c) { return c.id === id; }) || null;');
  L.push('}');
  L.push('function countByCategory(id) {');
  L.push('  return PRODUCTS.filter(function (p) { return p.cat === id; }).length;');
  L.push('}');
  L.push('');

  return L.join('\n');
}

/** Génère le fichier et vérifie qu'il est exécutable. Renvoie null en cas de problème. */
function generateChecked() {
  if (!state.products.length) {
    alert(tx('Ajoutez au moins un produit avant d’enregistrer.', 'أضف منتجاً واحداً على الأقل قبل الحفظ.'));
    return null;
  }

  const text = buildDataFile();

  // Filet de sécurité : le fichier produit doit s'exécuter sans erreur.
  try {
    const check = new Function(text + '\nreturn { n: PRODUCTS.length, wa: SHOP.whatsapp };')();
    if (check.n !== state.products.length) throw new Error('nombre de produits incohérent');
    if (!check.wa) throw new Error('numéro WhatsApp vide');
  } catch (err) {
    alert(tx('Le fichier n’a pas pu être généré : ', 'تعذّر إنشاء الملف: ') + err.message);
    return null;
  }

  // Le BOM garantit que l'arabe et les accents restent lisibles, quels que soient
  // l'éditeur de texte et les en-têtes envoyés par l'hébergeur.
  return '﻿' + text;
}

function markExported() {
  state.exported = true;
  saveDraft();
}

/**
 * Méthode 1 (la meilleure) : écrire directement dans assets/js/data.js.
 * Chrome et Edge savent le faire ; aucun téléchargement, donc aucun blocage.
 * Si le navigateur ne sait pas, on retombe automatiquement sur le téléchargement.
 */
async function saveToSite() {
  const text = generateChecked();
  if (!text) return;

  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'data.js',
        types: [{
          description: tx('Fichier du catalogue', 'ملف الكتالوج'),
          accept: { 'text/javascript': ['.js'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      markExported();
      toast(tx('Enregistré ✓ Le catalogue est à jour dans le site.',
               'تم الحفظ ✓ الكتالوج محدَّث في الموقع.'));
      return;
    } catch (err) {
      // L'utilisateur a simplement fermé la fenêtre : on ne fait rien.
      if (err && err.name === 'AbortError') return;
      // Navigateur qui refuse (page ouverte en file://, permission…) : on télécharge.
    }
  }

  downloadFile(text);
}

/** Méthode 2 : téléchargement classique. Chrome demande « Conserver » pour les .js. */
function downloadFile(text) {
  try {
    const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    // Aucune des deux méthodes automatiques ne passe : il reste le presse-papiers.
    alert(tx('Le téléchargement a été refusé par le navigateur. Utilisez le bouton « 📋 Copier le contenu » de l’onglet Publier.',
             'رفض المتصفح التنزيل. استعمل زر «📋 نسخ المحتوى» في تبويب النشر.'));
    return;
  }

  markExported();
  toast(tx('Téléchargé. Si Chrome affiche un avertissement, cliquez sur « Conserver ».',
           'تم التنزيل. إذا حذّرك كروم اضغط «Conserver».'));
}

function exportFile() {
  const text = generateChecked();
  if (text) downloadFile(text);
}

/** Méthode 3 : copier le contenu, à coller dans data.js ouvert avec le Bloc-notes. */
async function copyFileText() {
  const text = generateChecked();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Repli universel quand le presse-papiers moderne est refusé.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignoré */ }
    ta.remove();
  }

  markExported();
  toast(tx('Contenu copié — collez-le dans assets/js/data.js',
           'تم نسخ المحتوى — الصقه في assets/js/data.js'));
}

/* --------------------------------------------------------------------------
   Publication en ligne (fonctionne depuis un téléphone)
   -------------------------------------------------------------------------- */

function renderGhForm() {
  const el = document.getElementById('ghForm').elements;
  const c = GH.get();
  el.owner.value = c.owner || '';
  el.repo.value = c.repo || '';
  el.branch.value = c.branch || 'main';
  el.token.value = c.token ? '••••••••••••••••' : '';
  renderTokenSteps();
  renderGhState();
}

function renderGhState() {
  const box = document.getElementById('ghState');
  const btn = document.getElementById('btnPublish');
  const ready = GH.isReady();

  btn.disabled = !ready;
  const nb = Object.keys(state.photos).length;
  const details = state.products.length + ' ' + tx('produits', 'منتج') +
    (nb ? ' · ' + nb + ' ' + tx('photo(s) à envoyer', 'صورة للإرسال') +
          ' (' + formatBytes(photosBytes()) + ')' : '');

  box.innerHTML = ready
    ? '<b style="color:var(--accent)">' + tx('Connecté', 'متصل') + '</b> — ' + escapeHtml(details)
    : tx('Renseignez les champs ci-dessous pour publier depuis cet appareil.',
         'أدخل المعلومات أدناه للنشر من هذا الجهاز.');
}

function ghProgress(msg) {
  document.getElementById('ghProgress').textContent = msg || '';
}

async function testGh() {
  ghProgress(tx('Vérification…', 'جارٍ التحقق…'));
  try {
    const info = await GH.test();
    ghProgress('');
    alert(tx('Connexion réussie : ' + info.full_name + ' (branche ' + info.branch + ')',
             'نجح الاتصال: ' + info.full_name + ' (الفرع ' + info.branch + ')'));
  } catch (err) {
    ghProgress('');
    alert(tx('Échec : ', 'فشل: ') + err.message);
  }
}

async function publishOnline() {
  if (!GH.isReady()) return;

  const text = generateChecked();
  if (!text) return;

  const files = [{ path: 'assets/js/data.js', text: text }];
  const ids = Object.keys(state.photos);
  ids.forEach(function (id) {
    const p = state.products.find(o => o.id === id);
    if (p) files.push({ path: p.img, base64: state.photos[id].base64 });
  });

  const btn = document.getElementById('btnPublish');
  btn.disabled = true;

  try {
    const sha = await GH.commit(
      files,
      'Catalogue : ' + state.products.length + ' produits' +
        (ids.length ? ', ' + ids.length + ' photo(s)' : ''),
      ghProgress
    );

    // Publié : les photos ne sont plus en attente.
    state.photos = {};
    savePhotos();
    markExported();

    ghProgress('');
    renderGhState();
    renderStats();
    alert(tx(
      'Publié ✓ (' + sha + ')\n\nLe site se met à jour tout seul dans une à deux minutes.',
      'تم النشر ✓ (' + sha + ')\n\nسيتحدّث الموقع وحده خلال دقيقة أو دقيقتين.'
    ));
  } catch (err) {
    ghProgress('');
    const msg = err.status === 401 ? tx('Jeton invalide ou expiré.', 'الرمز غير صالح أو منتهي.')
      : err.status === 404 ? tx('Dépôt ou branche introuvable — vérifiez les noms.',
                                'المستودع أو الفرع غير موجود — تحقق من الأسماء.')
      : err.message;
    alert(tx('Publication impossible : ', 'تعذّر النشر: ') + msg);
  } finally {
    btn.disabled = !GH.isReady();
  }
}

function bindGh() {
  const form = document.getElementById('ghForm');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const el = form.elements;
    const next = {
      owner: el.owner.value.trim(),
      repo: el.repo.value.trim(),
      branch: el.branch.value.trim() || 'main'
    };
    // Champ laissé masqué : on garde le jeton déjà enregistré.
    const typed = el.token.value.trim();
    if (typed && typed.indexOf('•') === -1) next.token = typed;

    GH.save(next);
    renderGhForm();
    toast(tx('Réglages enregistrés ✓', 'تم حفظ الإعدادات ✓'));
  });

  document.getElementById('btnGhTest').addEventListener('click', testGh);
  document.getElementById('btnPublish').addEventListener('click', publishOnline);

  document.getElementById('btnGhForget').addEventListener('click', function () {
    if (!confirm(tx('Oublier le jeton sur cet appareil ?', 'حذف الرمز من هذا الجهاز؟'))) return;
    GH.forget();
    renderGhForm();
    toast(tx('Jeton oublié.', 'تم حذف الرمز.'));
  });
}

/* --------------------------------------------------------------------------
   Onglets et démarrage
   -------------------------------------------------------------------------- */

function bindTabs() {
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('is-active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('is-active');
      if (tab.dataset.tab === 'publier') renderStats();
      if (tab.dataset.tab === 'enligne') renderGhState();
    });
  });
}

function bindForm() {
  const f = form();

  f.addEventListener('submit', saveProduct);

  f.addEventListener('input', function (e) {
    readForm();
    // L'identifiant suit le nom tant qu'il n'a pas été saisi à la main
    if (e.target.name === 'name' && !state.editingId && !f.elements.id.dataset.touched) {
      f.elements.id.value = slugify(f.elements.name.value);
      state.form.id = f.elements.id.value;
    }
    renderPhoto();
    renderPreview();
  });

  f.elements.id.addEventListener('input', function () { this.dataset.touched = '1'; });
  document.getElementById('photoExt').addEventListener('change', function () { renderPhoto(); renderPreview(); });

  document.getElementById('btnCancel').addEventListener('click', function () {
    if (state.editingId) editProduct(state.editingId);
    else newProduct();
  });

  // Couleurs
  document.getElementById('palette').addEventListener('click', function (e) {
    const item = e.target.closest('.pal-item');
    if (!item) return;
    const hex = item.dataset.hex, name = item.dataset.name;
    const i = state.form.colors.findIndex(c =>
      c.hex.toUpperCase() === hex.toUpperCase() && c.name === name);
    if (i >= 0) state.form.colors.splice(i, 1);
    else {
      const known = Object.keys(C).map(k => C[k]).find(c =>
        c.hex.toUpperCase() === hex.toUpperCase() && c.name === name);
      state.form.colors.push(known ? deepCopy(known) : { hex: hex, name: name, name_ar: name });
    }
    renderPalette();
    renderPreview();
  });

  document.getElementById('ccAdd').addEventListener('click', function () {
    const hex = document.getElementById('ccHex').value.toUpperCase();
    const name = document.getElementById('ccName').value.trim();
    const nameAr = document.getElementById('ccNameAr').value.trim();
    if (!name) { alert(tx('Donnez un nom à la couleur.', 'أعطِ اسماً للون.')); return; }
    state.form.colors.push({ hex: hex, name: name, name_ar: nameAr || name });
    document.getElementById('ccName').value = '';
    document.getElementById('ccNameAr').value = '';
    renderPalette();
    renderPreview();
  });

  // Tailles
  document.getElementById('sizePresets').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-preset]');
    if (!btn) return;
    const key = btn.dataset.preset;
    state.form.sizes = key === 'clear' ? [] : SIZE_POOL[key].slice();
    renderSizes();
    renderPreview();
  });

  document.getElementById('sizeChips').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-size]');
    if (!btn) return;
    const s = btn.dataset.size;
    const i = state.form.sizes.indexOf(s);
    if (i >= 0) state.form.sizes.splice(i, 1);
    else state.form.sizes.push(s);
    renderSizes();
    renderPreview();
  });

  document.getElementById('csAdd').addEventListener('click', function () {
    const input = document.getElementById('csName');
    const s = input.value.trim();
    if (!s) return;
    if (state.form.sizes.indexOf(s) < 0) state.form.sizes.push(s);
    input.value = '';
    renderSizes();
    renderPreview();
  });

  // Photo : réduite tout de suite, puis publiée avec le produit.
  document.getElementById('photoFile').addEventListener('change', async function () {
    const file = this.files && this.files[0];
    if (!file) return;

    const info = document.getElementById('photoInfo');
    info.textContent = tx('Réduction de la photo…', 'جارٍ تصغير الصورة…');

    try {
      const img = await compressImage(file);
      // La photo est réencodée en JPEG : l'extension doit suivre.
      document.getElementById('photoExt').value = 'jpg';
      state.photoData = { dataUrl: img.dataUrl, base64: img.base64, bytes: img.bytes };
      info.textContent = tx(
        'Photo prête : ' + img.width + '×' + img.height + ' — ' + formatBytes(img.bytes) +
          ' (au lieu de ' + formatBytes(file.size) + ')',
        'الصورة جاهزة: ' + img.width + '×' + img.height + ' — ' + formatBytes(img.bytes) +
          ' (بدل ' + formatBytes(file.size) + ')'
      );
      renderPhoto();
      renderPreview();
    } catch (err) {
      info.textContent = '';
      alert(err.message);
    }
  });

  document.getElementById('copyPath').addEventListener('click', function () {
    const text = document.getElementById('photoPath').textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    toast(tx('Chemin copié', 'تم نسخ المسار'));
  });
}

function bindGlobal() {
  document.getElementById('btnNew').addEventListener('click', newProduct);
  document.getElementById('btnExport').addEventListener('click', saveToSite);
  document.getElementById('btnExport2').addEventListener('click', saveToSite);
  document.getElementById('btnDownload').addEventListener('click', exportFile);
  document.getElementById('btnCopy').addEventListener('click', copyFileText);
  document.getElementById('sform').addEventListener('submit', saveShop);
  document.getElementById('sform').elements.phoneDisplay.addEventListener('input', renderWaHint);

  document.getElementById('btnReset').addEventListener('click', function () {
    if (!confirm(tx('Revenir au catalogue actuellement en ligne ? Vos modifications non téléchargées seront perdues.',
                    'العودة إلى الكتالوج المنشور حالياً؟ ستفقد التعديلات غير المنزّلة.'))) return;
    localStorage.removeItem(DRAFT_KEY);
    location.reload();
  });

  window.addEventListener('beforeunload', function (e) {
    if (state.exported) return;
    e.preventDefault();
    e.returnValue = '';
  });
}

function renderAll() {
  fillCategorySelect();
  renderList();
  refreshForm();
  renderShopForm();
  renderGhForm();
  renderStats();
}

document.addEventListener('DOMContentLoaded', function () {
  loadDraft();
  state.form = emptyProduct();
  fillCategorySelect();
  bindTabs();
  bindList();
  bindForm();
  bindPreview();
  bindGlobal();
  bindGh();
  newProduct();
  renderShopForm();
  renderGhForm();
  renderStats();
});

document.addEventListener('langchange', renderAll);
