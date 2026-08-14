/* ==========================================================================
   Page panier : lignes modifiables, totaux, envoi de la commande sur WhatsApp.
   ========================================================================== */

function renderCart() {
  const empty = document.getElementById('cartEmpty');
  const layout = document.getElementById('cartLayout');

  if (Cart.isEmpty()) {
    empty.hidden = false;
    layout.hidden = true;
    return;
  }
  empty.hidden = true;
  layout.hidden = false;

  const host = document.getElementById('cartItems');
  host.innerHTML = Cart.lines().map(function (line) {
    const p = line.product;
    const href = 'produit.html?id=' + encodeURIComponent(p.id);
    return '<div class="cart-row" data-index="' + line.index + '">' +
      '<a href="' + href + '">' + mediaHtml(p.img, Lang.pick(p, 'name')) + '</a>' +
      '<div>' +
        '<div class="name"><a href="' + href + '">' + escapeHtml(Lang.pick(p, 'name')) + '</a></div>' +
        '<div class="opts">' +
          '<span>' + Lang.t('size') + ' : <b>' + escapeHtml(line.size) + '</b></span>' +
          '<span><span class="dotcol" style="background:' + escapeHtml(line.color) + '"></span>' +
            escapeHtml(colorName(p, line.color)) + '</span>' +
          '<span>' + formatPrice(p.price) + '</span>' +
        '</div>' +
        '<div class="row-bottom">' +
          '<div class="qty">' +
            '<button type="button" data-act="dec" aria-label="-">−</button>' +
            '<input type="number" value="' + line.qty + '" min="1" max="99" data-act="qty" aria-label="' + Lang.t('qty') + '">' +
            '<button type="button" data-act="inc" aria-label="+">+</button>' +
          '</div>' +
          '<button type="button" class="link-danger" data-act="remove">' + Lang.t('remove') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="line-total">' + formatPrice(line.lineTotal) + '</div>' +
    '</div>';
  }).join('');

  renderTotals();
}

function renderTotals() {
  const delivery = Cart.delivery();
  document.getElementById('sumSubtotal').textContent = formatPrice(Cart.subtotal());
  document.getElementById('sumDelivery').textContent = delivery === 0 ? Lang.t('free') : formatPrice(delivery);
  document.getElementById('sumTotal').textContent = formatPrice(Cart.total());

  const note = document.getElementById('deliveryNote');
  const remaining = SHOP.freeDeliveryFrom - Cart.subtotal();
  if (SHOP.freeDeliveryFrom > 0 && remaining > 0) {
    note.textContent = Lang.isAr()
      ? 'أضف ' + formatPrice(remaining) + ' للحصول على التوصيل مجاناً.'
      : 'Plus que ' + formatPrice(remaining) + ' pour la livraison offerte.';
  } else if (SHOP.freeDeliveryFrom > 0) {
    note.textContent = Lang.isAr() ? '🎉 التوصيل مجاني على هذا الطلب.' : '🎉 Livraison offerte sur cette commande.';
  } else {
    note.textContent = '';
  }
}

function fillWilayas() {
  const sel = document.getElementById('wilayaSelect');
  const previous = sel.value;
  sel.innerHTML = '<option value="">' + (Lang.isAr() ? '— اختر ولايتك —' : '— Choisir votre wilaya —') + '</option>' +
    WILAYAS.map(function (w) { return '<option value="' + escapeHtml(w) + '">' + escapeHtml(w) + '</option>'; }).join('');
  if (previous) sel.value = previous;
}

function bindCart() {
  document.getElementById('cartItems').addEventListener('click', function (e) {
    const row = e.target.closest('.cart-row');
    if (!row) return;
    const index = parseInt(row.dataset.index, 10);
    const act = e.target.closest('[data-act]');
    if (!act) return;

    const current = Cart.raw()[index];
    if (!current) return;

    if (act.dataset.act === 'inc') Cart.setQty(index, current.qty + 1);
    else if (act.dataset.act === 'dec') {
      if (current.qty <= 1) Cart.remove(index);
      else Cart.setQty(index, current.qty - 1);
    } else if (act.dataset.act === 'remove') Cart.remove(index);
    else return;

    renderCart();
  });

  document.getElementById('cartItems').addEventListener('change', function (e) {
    const input = e.target.closest('[data-act="qty"]');
    if (!input) return;
    const index = parseInt(input.closest('.cart-row').dataset.index, 10);
    Cart.setQty(index, input.value);
    renderCart();
  });

  document.getElementById('clearCart').addEventListener('click', function () {
    const msg = Lang.isAr() ? 'هل تريد إفراغ السلة؟' : 'Vider tout le panier ?';
    if (!confirm(msg)) return;
    Cart.clear();
    renderCart();
    toast(Lang.t('cartCleared'));
  });
}

function bindOrderForm() {
  const form = document.getElementById('orderForm');
  const el = form.elements;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (Cart.isEmpty()) return;

    const name = el.name.value.trim();
    const phone = el.phone.value.trim();
    const wilaya = el.wilaya.value;

    if (!name) { el.name.classList.add('field-error'); el.name.focus(); toast(Lang.t('fillName')); return; }
    el.name.classList.remove('field-error');

    if (!/^[0-9+\s().-]{9,}$/.test(phone)) {
      el.phone.classList.add('field-error'); el.phone.focus(); toast(Lang.t('fillPhone')); return;
    }
    el.phone.classList.remove('field-error');

    if (!wilaya) { el.wilaya.classList.add('field-error'); el.wilaya.focus(); toast(Lang.t('fillWilaya')); return; }
    el.wilaya.classList.remove('field-error');

    const message = waOrderMessage({
      name: name,
      phone: phone,
      wilaya: wilaya,
      address: el.address.value.trim(),
      note: el.note.value.trim()
    });

    window.open(waLink(message), '_blank', 'noopener');
    toast(Lang.t('orderSent'));
  });
}

document.addEventListener('DOMContentLoaded', function () {
  fillWilayas();
  renderCart();
  bindCart();
  bindOrderForm();
});

document.addEventListener('langchange', function () {
  fillWilayas();
  renderCart();
});
