/* ==========================================================================
   Panier — état persistant (localStorage), partagé par toutes les pages.
   Une ligne de panier = produit + taille + couleur. Deux tailles différentes
   d'un même produit comptent donc pour deux lignes distinctes.
   ========================================================================== */

const Cart = (function () {
  const KEY = 'cu_cart_v1';
  const listeners = [];
  let items = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // On ne garde que les lignes dont le produit existe toujours au catalogue.
      return parsed
        .filter(function (it) { return it && typeof it.id === 'string' && getProduct(it.id); })
        .map(function (it) {
          return {
            id: it.id,
            size: String(it.size || ''),
            color: String(it.color || ''),
            qty: clampQty(it.qty)
          };
        });
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      /* quota plein ou navigation privée : le panier reste valable pour la session */
    }
    listeners.forEach(function (fn) { fn(items); });
  }

  function clampQty(n) {
    const q = parseInt(n, 10);
    if (isNaN(q) || q < 1) return 1;
    return Math.min(q, 99);
  }

  function indexOfLine(id, size, color) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === id && items[i].size === size && items[i].color === color) return i;
    }
    return -1;
  }

  return {
    /** Toutes les lignes, enrichies du produit correspondant. */
    lines: function () {
      return items.map(function (it, i) {
        const p = getProduct(it.id);
        return {
          index: i,
          id: it.id,
          size: it.size,
          color: it.color,
          qty: it.qty,
          product: p,
          lineTotal: p ? p.price * it.qty : 0
        };
      });
    },

    raw: function () { return items.slice(); },

    add: function (id, size, color, qty) {
      const p = getProduct(id);
      if (!p) return false;
      const s = size || (p.sizes && p.sizes[0]) || '';
      const c = color || (p.colors && p.colors[0] && p.colors[0].hex) || '';
      const q = clampQty(qty || 1);
      const i = indexOfLine(id, s, c);
      if (i >= 0) items[i].qty = clampQty(items[i].qty + q);
      else items.push({ id: id, size: s, color: c, qty: q });
      save();
      return true;
    },

    setQty: function (index, qty) {
      if (!items[index]) return;
      items[index].qty = clampQty(qty);
      save();
    },

    remove: function (index) {
      if (!items[index]) return;
      items.splice(index, 1);
      save();
    },

    clear: function () {
      items = [];
      save();
    },

    /** Nombre total d'articles (somme des quantités). */
    count: function () {
      return items.reduce(function (n, it) { return n + it.qty; }, 0);
    },

    /** Sous-total marchandise, en DA. */
    subtotal: function () {
      return items.reduce(function (n, it) {
        const p = getProduct(it.id);
        return n + (p ? p.price * it.qty : 0);
      }, 0);
    },

    /** Frais de livraison appliqués au sous-total courant. */
    delivery: function () {
      const sub = this.subtotal();
      if (sub === 0) return 0;
      if (SHOP.freeDeliveryFrom > 0 && sub >= SHOP.freeDeliveryFrom) return 0;
      return SHOP.deliveryFee;
    },

    total: function () {
      return this.subtotal() + this.delivery();
    },

    isEmpty: function () { return items.length === 0; },

    /** Appelé à chaque modification ; renvoie une fonction de désabonnement. */
    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    }
  };
})();

/* Synchronise le panier entre les onglets ouverts. */
window.addEventListener('storage', function (e) {
  if (e.key === 'cu_cart_v1') location.reload();
});
