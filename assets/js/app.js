/* ==========================================================================
   Socle commun : langue FR/AR, formatage, images, notifications,
   en-tête, panier dans la barre, révélation au défilement, lien WhatsApp.
   Chargé sur toutes les pages, après data.js et cart.js.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Textes générés par JavaScript (le reste est traduit via data-ar dans le HTML)
   -------------------------------------------------------------------------- */
const T = {
  fr: {
    addToCart: 'Ajouter au panier',
    added: 'Ajouté ✓',
    addedToast: 'ajouté au panier',
    colors: 'coloris',
    color: 'coloris',
    models: 'modèles',
    articles: 'articles',
    noResult: 'Aucun article ne correspond à votre recherche.',
    resultsOne: 'article',
    resultsMany: 'articles',
    size: 'Taille',
    colorLabel: 'Couleur',
    qty: 'Quantité',
    remove: 'Retirer',
    reviews: 'avis',
    free: 'Offerte',
    orderLines: 'Détail de la commande',
    productNotFound: 'Produit introuvable',
    backToShop: 'Retour à la boutique',
    fillName: 'Veuillez indiquer votre nom.',
    fillPhone: 'Numéro de téléphone invalide (ex. 0770 12 34 56).',
    fillWilaya: 'Veuillez indiquer votre wilaya.',
    orderSent: 'WhatsApp va s’ouvrir avec votre commande prête à envoyer.',
    cartCleared: 'Panier vidé.',
    selectSize: 'Choisissez une taille.'
  },
  ar: {
    addToCart: 'أضف إلى السلة',
    added: 'تمت الإضافة ✓',
    addedToast: 'أُضيف إلى السلة',
    colors: 'ألوان',
    color: 'لون',
    models: 'موديل',
    articles: 'قطعة',
    noResult: 'لا توجد قطعة تطابق بحثك.',
    resultsOne: 'قطعة',
    resultsMany: 'قطعة',
    size: 'المقاس',
    colorLabel: 'اللون',
    qty: 'الكمية',
    remove: 'حذف',
    reviews: 'تقييم',
    free: 'مجاناً',
    orderLines: 'تفاصيل الطلب',
    productNotFound: 'المنتج غير موجود',
    backToShop: 'العودة إلى المتجر',
    fillName: 'الرجاء إدخال اسمك.',
    fillPhone: 'رقم الهاتف غير صحيح (مثال: 0770 12 34 56).',
    fillWilaya: 'الرجاء إدخال الولاية.',
    orderSent: 'سيُفتح واتساب وطلبك جاهز للإرسال.',
    cartCleared: 'تم إفراغ السلة.',
    selectSize: 'اختر مقاساً.'
  }
};

/* --------------------------------------------------------------------------
   Langue
   -------------------------------------------------------------------------- */
const Lang = (function () {
  const KEY = 'cu_lang';
  let current = 'fr';

  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'ar' || saved === 'fr') current = saved;
  } catch (e) { /* stockage indisponible : on reste en français */ }

  function applyStatic() {
    const ar = current === 'ar';
    const root = document.documentElement;
    root.setAttribute('lang', ar ? 'ar' : 'fr');
    root.setAttribute('dir', ar ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-ar]').forEach(function (el) {
      if (el.dataset.fr === undefined) el.dataset.fr = el.textContent;
      el.textContent = ar ? el.dataset.ar : el.dataset.fr;
    });
    document.querySelectorAll('[data-ar-placeholder]').forEach(function (el) {
      if (el.dataset.frPlaceholder === undefined) el.dataset.frPlaceholder = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', ar ? el.dataset.arPlaceholder : el.dataset.frPlaceholder);
    });
    document.querySelectorAll('[data-ar-label]').forEach(function (el) {
      if (el.dataset.frLabel === undefined) el.dataset.frLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', ar ? el.dataset.arLabel : el.dataset.frLabel);
    });

    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.langBtn === current);
    });
  }

  return {
    get: function () { return current; },
    isAr: function () { return current === 'ar'; },
    t: function (key) { return (T[current] && T[current][key]) || T.fr[key] || key; },

    /** Champ localisé d'un objet de données : pick(p, 'name') -> name ou name_ar */
    pick: function (obj, field) {
      if (!obj) return '';
      if (current === 'ar' && obj[field + '_ar']) return obj[field + '_ar'];
      return obj[field] || '';
    },

    set: function (lang) {
      if (lang !== 'fr' && lang !== 'ar') return;
      if (lang === current) return;
      current = lang;
      try { localStorage.setItem(KEY, lang); } catch (e) { /* ignoré */ }
      applyStatic();
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
    },

    init: applyStatic
  };
})();

/* --------------------------------------------------------------------------
   Formatage
   -------------------------------------------------------------------------- */
function formatPrice(amount) {
  const n = Math.round(amount || 0);
  const grouped = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return grouped + ' ' + (Lang.isAr() ? SHOP.currencyAr : SHOP.currency);
}

function stars(rating) {
  const full = Math.round(rating || 0);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}

function escapeHtml(str) {
  return String(str === null || str === undefined ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Nom lisible d'une couleur à partir de son code hexadécimal. */
function colorName(product, hex) {
  const found = (product && product.colors || []).find(function (c) { return c.hex === hex; });
  return found ? Lang.pick(found, 'name') : hex;
}

/* --------------------------------------------------------------------------
   Images : <img> réelle si le fichier existe, sinon cadre « placeholder »
   -------------------------------------------------------------------------- */
function mediaHtml(src, label, extraClass) {
  return '<span class="media ' + (extraClass || '') + '">' +
    '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(label) + '" loading="lazy" ' +
    'onerror="this.hidden=true;this.nextElementSibling.hidden=false">' +
    '<span class="media-label" hidden>' + escapeHtml(label) + '</span>' +
    '</span>';
}

/* --------------------------------------------------------------------------
   Notifications
   -------------------------------------------------------------------------- */
function toast(message) {
  let host = document.querySelector('.toast-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = '<span class="tick">✓</span><span></span>';
  el.lastElementChild.textContent = message;
  host.appendChild(el);
  setTimeout(function () {
    el.classList.add('out');
    setTimeout(function () { el.remove(); }, 320);
  }, 2600);
}

/* --------------------------------------------------------------------------
   Message WhatsApp
   -------------------------------------------------------------------------- */
function waLink(text) {
  return 'https://wa.me/' + SHOP.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
}

/** Message court : « je suis intéressé par ce produit ». */
function waProductMessage(product, size, color, qty) {
  const ar = Lang.isAr();
  const lines = [];
  lines.push(ar ? 'السلام عليكم، أريد طلب هذه القطعة:' : 'Bonjour, je souhaite commander cet article :');
  lines.push('');
  lines.push('• ' + Lang.pick(product, 'name'));
  if (size) lines.push('  ' + Lang.t('size') + ' : ' + size);
  if (color) lines.push('  ' + Lang.t('colorLabel') + ' : ' + colorName(product, color));
  lines.push('  ' + Lang.t('qty') + ' : ' + (qty || 1));
  lines.push('  ' + formatPrice(product.price * (qty || 1)));
  return lines.join('\n');
}

/** Message complet du panier + coordonnées client. */
function waOrderMessage(customer) {
  const ar = Lang.isAr();
  const L = [];
  L.push(ar ? '🩺 طلب جديد — ' + SHOP.name : '🩺 Nouvelle commande — ' + SHOP.name);
  L.push('────────────────────');
  L.push(ar ? '👤 الاسم : ' + customer.name : '👤 Nom : ' + customer.name);
  L.push(ar ? '📞 الهاتف : ' + customer.phone : '📞 Téléphone : ' + customer.phone);
  L.push(ar ? '📍 الولاية : ' + customer.wilaya : '📍 Wilaya : ' + customer.wilaya);
  if (customer.address) L.push((ar ? '🏠 العنوان : ' : '🏠 Adresse : ') + customer.address);
  if (customer.note) L.push((ar ? '📝 ملاحظة : ' : '📝 Note : ') + customer.note);
  L.push('────────────────────');
  L.push(ar ? '🛒 تفاصيل الطلب :' : '🛒 Détail de la commande :');

  Cart.lines().forEach(function (line, i) {
    const p = line.product;
    L.push('');
    L.push((i + 1) + '. ' + Lang.pick(p, 'name'));
    L.push('   ' + Lang.t('size') + ' : ' + line.size +
           '  |  ' + Lang.t('colorLabel') + ' : ' + colorName(p, line.color));
    L.push('   ' + line.qty + ' × ' + formatPrice(p.price) + ' = ' + formatPrice(line.lineTotal));
  });

  const delivery = Cart.delivery();
  L.push('');
  L.push('────────────────────');
  L.push((ar ? 'المجموع الفرعي : ' : 'Sous-total : ') + formatPrice(Cart.subtotal()));
  L.push((ar ? 'التوصيل : ' : 'Livraison : ') + (delivery === 0 ? Lang.t('free') : formatPrice(delivery)));
  L.push((ar ? '💰 المجموع : ' : '💰 TOTAL : ') + formatPrice(Cart.total()));
  return L.join('\n');
}

/* --------------------------------------------------------------------------
   En-tête : liens, langue, compteur panier, menu mobile
   -------------------------------------------------------------------------- */
function initHeader() {
  // Lien de navigation actif
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.main-nav a').forEach(function (a) {
    const href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (href && href === page) a.classList.add('is-active');
  });

  // Boutons de langue
  document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () { Lang.set(btn.dataset.langBtn); });
  });

  // Menu mobile
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.main-nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Liens WhatsApp / téléphone / e-mail alimentés par SHOP
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.setAttribute('href', waLink(a.dataset.wa || ''));
  });
  document.querySelectorAll('[data-shop-phone]').forEach(function (a) {
    a.setAttribute('href', 'tel:' + SHOP.phoneHref);
  });
  document.querySelectorAll('[data-shop-email]').forEach(function (a) {
    a.setAttribute('href', 'mailto:' + SHOP.email);
  });
  document.querySelectorAll('[data-shop-text]').forEach(function (el) {
    const key = el.dataset.shopText;
    if (SHOP[key]) el.textContent = SHOP[key];
  });

  updateCartBadge(false);
  Cart.subscribe(function () { updateCartBadge(true); });
}

function updateCartBadge(animate) {
  const n = Cart.count();
  document.querySelectorAll('.cart-count').forEach(function (el) {
    if (el.textContent !== String(n) && animate) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
    el.textContent = n;
  });
}

/* --------------------------------------------------------------------------
   Révélation au défilement + bouton « haut de page »
   -------------------------------------------------------------------------- */
function initScrollEffects() {
  const els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && els.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 40, 200) + 'ms';
      io.observe(el);
    });
  } else {
    els.forEach(function (el) { el.classList.add('is-in'); });
  }

  const top = document.querySelector('.to-top');
  if (top) {
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    window.addEventListener('scroll', function () {
      top.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
  }
}

/** Révèle un contenu injecté après le chargement (grilles produits, etc.). */
function revealNew(container) {
  (container || document).querySelectorAll('[data-reveal]:not(.is-in)').forEach(function (el) {
    el.classList.add('is-in');
  });
}

/* --------------------------------------------------------------------------
   Démarrage
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  Lang.init();
  initHeader();
  initScrollEffects();
});
