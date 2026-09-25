/* متجر الجوهر — منطق المتجر (لا حاجة لتعديل هذا الملف؛ الإعدادات في config.js) */
(function () {
  "use strict";
  var C = window.STORE_CONFIG;
  var CUR = C.currency || "ر.س";
  var KEY = "aljawhar_cart_v1";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (n) { return (Math.round(n * 100) / 100).toLocaleString("en-US") + " " + CUR; };
  var byId = function (id) { for (var i = 0; i < C.products.length; i++) if (C.products[i].id === id) return C.products[i]; return null; };
  var waBase = "https://wa.me/" + String(C.whatsappNumber).replace(/\D/g, "");

  /* ---------- السلة ---------- */
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }
  function lines() {
    return cart.map(function (it) {
      var p = byId(it.id); if (!p) return null;
      var s = p.sizes.filter(function (z) { return z.label === it.size; })[0]; if (!s) return null;
      return { p: p, s: s, qty: it.qty, total: s.price * it.qty };
    }).filter(Boolean);
  }
  function save() { cart = lines().map(function (l) { return { id: l.p.id, size: l.s.label, qty: l.qty }; }); try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} renderCart(); }
  function add(id, size, qty) {
    var f = cart.filter(function (it) { return it.id === id && it.size === size; })[0];
    if (f) f.qty += qty; else cart.push({ id: id, size: size, qty: qty });
    save();
    var b = $("#cartBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
    toast("✓ أُضيف " + byId(id).name + " (" + size + ") للسلة");
  }
  function totals() {
    var sub = lines().reduce(function (a, l) { return a + l.total; }, 0);
    var fee = Number(C.shippingFee) || 0, thr = Number(C.freeShippingThreshold) || 0;
    var ship = sub === 0 ? 0 : (thr > 0 && sub >= thr ? 0 : fee);
    return { sub: sub, ship: ship, total: sub + ship, fee: fee, thr: thr };
  }

  /* ---------- عرض المنتجات ---------- */
  function sizeSeg(p, sel, cls) {
    return '<div class="seg ' + (cls || "") + '" role="group" aria-label="الحجم">' + p.sizes.map(function (s, i) {
      return '<button type="button" data-size="' + i + '" class="' + (i === sel ? "on" : "") + '" aria-pressed="' + (i === sel) + '">' + esc(s.label) + "</button>";
    }).join("") + "</div>";
  }
  function renderGrid() {
    $("#grid").innerHTML = C.products.map(function (p) {
      var sel = p.sizes.length - 1 > 0 ? 0 : 0;
      return '<article class="card" data-id="' + esc(p.id) + '" data-sel="' + sel + '">' +
        (p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "") +
        '<button class="img" type="button" data-open aria-label="تفاصيل ' + esc(p.name) + '"><img src="' + esc(p.image) + '" alt="عطر ' + esc(p.name) + '" width="400" height="480"></button>' +
        '<h3><button type="button" data-open>' + esc(p.name) + "</button></h3>" +
        '<p class="notes">' + esc(p.short) + "</p>" + sizeSeg(p, sel) +
        '<div class="price" data-price>' + money(p.sizes[sel].price) + "</div>" +
        '<button class="add" type="button" data-add>أضف للسلة</button></article>';
    }).join("");
  }
  $("#grid").addEventListener("click", function (e) {
    var card = e.target.closest(".card"); if (!card) return;
    var p = byId(card.dataset.id), t;
    if ((t = e.target.closest("[data-size]"))) {
      card.dataset.sel = t.dataset.size;
      $$("[data-size]", card).forEach(function (b) { var on = b === t; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      $("[data-price]", card).textContent = money(p.sizes[+t.dataset.size].price);
    } else if (e.target.closest("[data-add]")) {
      add(p.id, p.sizes[+card.dataset.sel].label, 1);
    } else if (e.target.closest("[data-open]")) {
      openProduct(p.id, +card.dataset.sel);
    }
  });

  /* ---------- نافذة المنتج ---------- */
  var pm = { id: null, sel: 0, qty: 1 };
  function openProduct(id, sel) {
    var p = byId(id); if (!p) return;
    pm = { id: id, sel: sel || 0, qty: 1 };
    $("#pmBody").innerHTML =
      '<div class="pm-img"><img src="' + esc(p.image) + '" alt="عطر ' + esc(p.name) + '"></div>' +
      '<div class="pm-info">' + (p.badge ? '<span class="badge" style="position:static;display:inline-block;margin-bottom:4px">' + esc(p.badge) + "</span>" : "") +
      '<h2 id="pmName">' + esc(p.name) + '</h2><p class="notes">' + esc(p.short) + '</p><p class="desc">' + esc(p.description) + "</p>" +
      '<div class="pyramid"><div><b>المقدمة</b><span>' + esc(p.top) + '</span></div><div><b>القلب</b><span>' + esc(p.heart) + '</span></div><div><b>القاعدة</b><span>' + esc(p.base) + "</span></div></div>" +
      '<div class="meta"><div><b>👤 يناسب:</b><span>' + esc(p.suits) + '</span></div><div><b>🍂 الموسم:</b><span>' + esc(p.season) + "</span></div></div>" +
      '<div class="pm-buy">' + sizeSeg(p, pm.sel, "pm-seg") +
      '<div class="pm-row"><div class="price" id="pmPrice"></div><div class="qty"><button type="button" data-q="1" aria-label="زيادة">+</button><span id="pmQty">1</span><button type="button" data-q="-1" aria-label="إنقاص">−</button></div></div>' +
      '<button class="btn block" type="button" id="pmAdd">أضف للسلة</button></div></div>';
    updPm(); show("#productModal");
    if (location.hash !== "#p/" + id) history.replaceState(null, "", "#p/" + id);
  }
  function updPm() {
    var p = byId(pm.id);
    $("#pmPrice").innerHTML = money(p.sizes[pm.sel].price * pm.qty) + (pm.qty > 1 ? ' <small>(' + pm.qty + " × " + money(p.sizes[pm.sel].price) + ")</small>" : "");
    $("#pmQty").textContent = pm.qty;
  }
  $("#pmBody").addEventListener("click", function (e) {
    var t, p = byId(pm.id);
    if ((t = e.target.closest("[data-size]"))) {
      pm.sel = +t.dataset.size;
      $$("#pmBody [data-size]").forEach(function (b) { var on = b === t; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      updPm();
    } else if ((t = e.target.closest("[data-q]"))) {
      pm.qty = Math.max(1, Math.min(99, pm.qty + +t.dataset.q)); updPm();
    } else if (e.target.closest("#pmAdd")) {
      add(p.id, p.sizes[pm.sel].label, pm.qty); hide("#productModal");
    }
  });

  /* ---------- فتح/إغلاق النوافذ ---------- */
  function show(s) { $(s).hidden = false; document.body.classList.add("lock"); }
  function hide(s) {
    $(s).hidden = true;
    if ($("#productModal").hidden && $("#cartDrawer").hidden) document.body.classList.remove("lock");
    if (s === "#productModal" && /^#p\//.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  }
  $$(".overlay").forEach(function (o) {
    o.addEventListener("click", function (e) { if (e.target === o || e.target.closest("[data-close]")) hide("#" + o.id); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { hide("#productModal"); hide("#cartDrawer"); } });
  function fromHash() { var m = location.hash.match(/^#p\/(.+)$/); if (m && byId(decodeURIComponent(m[1]))) openProduct(decodeURIComponent(m[1]), 0); }
  window.addEventListener("hashchange", fromHash);

  /* ---------- السلة (الدرج) ---------- */
  var view = "cart";
  function setView(v) {
    view = v;
    $("#cartView").hidden = v !== "cart"; $("#checkoutView").hidden = v !== "checkout"; $("#doneView").hidden = v !== "done";
    $("#backToCart").hidden = v !== "checkout";
    $("#drawerTitle").textContent = v === "cart" ? "سلة المشتريات" : v === "checkout" ? "بيانات التوصيل" : "تم تجهيز الطلب";
    $("#toCheckout").hidden = v !== "cart"; $("#sendOrder").hidden = v !== "checkout";
    renderCart();
  }
  function renderCart() {
    var L = lines(), T = totals(), n = L.reduce(function (a, l) { return a + l.qty; }, 0);
    var cc = $("#cartCount"); cc.textContent = n; cc.hidden = n === 0;
    $("#cartItems").innerHTML = L.map(function (l, i) {
      return '<div class="item" data-i="' + i + '"><img src="' + esc(l.p.image) + '" alt=""><div class="mid"><h4>' + esc(l.p.name) + '</h4><div class="sz">' + esc(l.s.label) + " · " + money(l.s.price) + '</div><div class="bot"><div class="qty"><button type="button" data-d="1" aria-label="زيادة">+</button><span>' + l.qty + '</span><button type="button" data-d="-1" aria-label="إنقاص">−</button></div><b class="lt">' + money(l.total) + '</b></div></div><button class="rm" type="button" data-rm>حذف</button></div>';
    }).join("");
    $("#cartEmpty").hidden = L.length > 0;
    $("#drawerFoot").hidden = L.length === 0 || view === "done";
    $("#sumSub").textContent = money(T.sub);
    $("#shipRow").hidden = !(T.fee > 0);
    $("#sumShip").textContent = T.ship === 0 ? "مجاني 🎉" : money(T.ship);
    $("#sumTotal").textContent = money(T.total);
    var fs = $("#freeShip");
    if (T.fee > 0 && T.thr > 0 && T.sub > 0) {
      fs.hidden = false;
      fs.innerHTML = (T.sub >= T.thr ? "🎉 طلبك مؤهل للشحن المجاني" : "أضف " + money(T.thr - T.sub) + " واحصل على شحن مجاني") + '<div class="bar"><i style="width:' + Math.min(100, T.sub / T.thr * 100) + '%"></i></div>';
    } else fs.hidden = true;
  }
  $("#cartItems").addEventListener("click", function (e) {
    var row = e.target.closest(".item"); if (!row) return;
    var L = lines(), l = L[+row.dataset.i], it = cart.filter(function (c) { return c.id === l.p.id && c.size === l.s.label; })[0], t;
    if ((t = e.target.closest("[data-d]"))) { it.qty = Math.min(99, it.qty + +t.dataset.d); if (it.qty < 1) cart.splice(cart.indexOf(it), 1); save(); }
    else if (e.target.closest("[data-rm]")) { cart.splice(cart.indexOf(it), 1); save(); }
  });
  $("#cartBtn").addEventListener("click", function () { setView("cart"); show("#cartDrawer"); });
  $("#toCheckout").addEventListener("click", function () { setView("checkout"); $("#checkoutView").scrollTop = 0; });
  $("#backToCart").addEventListener("click", function () { setView("cart"); });

  /* ---------- نموذج الطلب ---------- */
  var form = $("#checkoutView");
  $("#citySelect").innerHTML = '<option value="">اختر المدينة</option>' + C.cities.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + '<option value="__other">مدينة أخرى</option>';
  $("#citySelect").addEventListener("change", function () { $("#otherCityWrap").hidden = this.value !== "__other"; });
  $("#payOptions").innerHTML = C.paymentMethods.map(function (m, i) { return '<label><input type="radio" name="payment" value="' + esc(m) + '"' + (i === 0 ? " checked" : "") + "> " + esc(m) + "</label>"; }).join("");
  try { var saved = JSON.parse(localStorage.getItem("aljawhar_customer") || "{}"); ["name", "phone", "address"].forEach(function (k) { if (saved[k]) form.elements[k].value = saved[k]; }); if (saved.city) { form.elements.city.value = saved.city; if (form.elements.city.value !== saved.city) { form.elements.city.value = "__other"; form.elements.otherCity.value = saved.city; $("#otherCityWrap").hidden = false; } } } catch (e) {}

  function normDigits(s) { return String(s).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }); }
  function normPhone(raw) {
    var s = normDigits(raw).replace(/[\s\-()]/g, "");
    var m = s.match(/^(?:\+?966|00966|0)?(5\d{8})$/);
    if (m) return "0" + m[1];
    if (/^\+?\d{8,15}$/.test(s)) return s;
    return null;
  }
  function orderNo() {
    var d = new Date(Date.now() + 3 * 3600e3); // توقيت الرياض
    var p = function (n) { return ("0" + n).slice(-2); };
    return (C.orderPrefix || "AJ") + "-" + String(d.getUTCFullYear()).slice(2) + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + "-" + Math.floor(1000 + Math.random() * 9000);
  }
  function buildMessage(no, data) {
    var L = lines(), T = totals(), d = new Date(Date.now() + 3 * 3600e3);
    var out = [];
    out.push("🛍️ *طلب جديد — متجر " + C.storeName + "*");
    out.push("رقم الطلب: *" + no + "*");
    out.push("التاريخ: " + d.getUTCFullYear() + "/" + (d.getUTCMonth() + 1) + "/" + d.getUTCDate());
    out.push("");
    out.push("*المنتجات:*");
    L.forEach(function (l, i) {
      out.push((i + 1) + ") " + l.p.name + " — " + l.s.label);
      out.push("    الكمية: " + l.qty + " × " + money(l.s.price) + " = " + money(l.total));
    });
    out.push("");
    out.push("المجموع الفرعي: " + money(T.sub));
    if (T.fee > 0) out.push("الشحن: " + (T.ship === 0 ? "مجاني" : money(T.ship)));
    out.push("*الإجمالي: " + money(T.total) + "*");
    out.push("");
    out.push("*بيانات العميل:*");
    out.push("الاسم: " + data.name);
    out.push("الجوال: " + data.phone);
    out.push("المدينة: " + data.city);
    out.push("العنوان: " + data.address);
    out.push("طريقة الدفع: " + data.payment);
    if (data.notes) out.push("ملاحظات: " + data.notes);
    return out.join("\n");
  }
  /* ---------- نسخة الطلب على البريد (FormSubmit) — لا تعطّل واتساب أبداً ---------- */
  function sendOrderEmail(no, data) {
    try {
      var to = String(C.orderEmail || "").trim();
      if (!to) return null;
      var L = lines(), T = totals(), d = new Date(Date.now() + 3 * 3600e3);
      var p2 = function (n) { return ("0" + n).slice(-2); };
      var f = new URLSearchParams();
      f.append("_subject", "طلب جديد #" + no + " - متجر " + C.storeName);
      f.append("_template", "table");
      f.append("_captcha", "false");
      f.append("رقم الطلب", no);
      f.append("التاريخ والوقت (الرياض)", d.getUTCFullYear() + "/" + p2(d.getUTCMonth() + 1) + "/" + p2(d.getUTCDate()) + " " + p2(d.getUTCHours()) + ":" + p2(d.getUTCMinutes()));
      f.append("اسم العميل", data.name);
      f.append("الجوال", data.phone);
      f.append("المدينة", data.city);
      f.append("العنوان", data.address);
      f.append("طريقة الدفع", data.payment);
      f.append("ملاحظات", data.notes || "-");
      L.forEach(function (l, i) { f.append("المنتج " + (i + 1), l.p.name + " — " + l.s.label + " — الكمية " + l.qty + " × " + money(l.s.price) + " = " + money(l.total)); });
      f.append("المجموع الفرعي", money(T.sub));
      f.append("الشحن", T.ship === 0 ? "مجاني" : money(T.ship));
      f.append("الإجمالي", money(T.total));
      var ep = /^https?:\/\//.test(to) ? to : "https://formsubmit.co/ajax/" + encodeURIComponent(to);
      var body = f.toString();
      if (window.fetch) {
        try {
          // طلب بسيط (form-urlencoded) + keepalive حتى يكتمل الإرسال حتى لو غادرت الصفحة
          return fetch(ep, { method: "POST", mode: "cors", keepalive: true, headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "Accept": "application/json" }, body: body })
            .catch(function () {});
        } catch (e) {}
      }
      if (navigator.sendBeacon) navigator.sendBeacon(ep, f);
    } catch (err) {}
    return null;
  }
  function fail(msg, el) {
    var e = $("#formError"); e.textContent = msg; e.hidden = false;
    if (el) { el.classList.add("bad"); el.focus(); }
    return false;
  }
  form.elements.phone.addEventListener("input", function () { var v = normDigits(this.value); if (v !== this.value) this.value = v; });
  form.addEventListener("input", function (e) { e.target.classList.remove("bad"); $("#formError").hidden = true; });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    $$(".bad", form).forEach(function (x) { x.classList.remove("bad"); });
    if (!lines().length) return fail("السلة فارغة");
    var name = f.name.value.trim(), phone = normPhone(f.phone.value), city = f.city.value, address = f.address.value.trim();
    if (name.length < 2) return fail("فضلاً اكتب الاسم", f.name);
    if (!phone) return fail("رقم الجوال غير صحيح (مثال: 05XXXXXXXX)", f.phone);
    if (!city) return fail("فضلاً اختر المدينة", f.city);
    if (city === "__other") { city = f.otherCity.value.trim(); if (!city) return fail("فضلاً اكتب اسم المدينة", f.otherCity); }
    if (address.length < 3) return fail("فضلاً اكتب الحي / العنوان", f.address);
    var payEl = form.querySelector("input[name=payment]:checked");
    var data = { name: name, phone: phone, city: city, address: address, payment: payEl ? payEl.value : "", notes: f.notes.value.trim() };
    try { localStorage.setItem("aljawhar_customer", JSON.stringify({ name: name, phone: phone, city: city, address: address })); } catch (err) {}
    var no = orderNo();
    var url = waBase + "?text=" + encodeURIComponent(buildMessage(no, data));
    window.__lastOrder = { no: no, url: url };
    $("#doneNo").textContent = no; $("#doneLink").href = url;
    var mail = sendOrderEmail(no, data); // يُرسل بالخلفية ولا يؤخر فتح واتساب
    var w = null;
    try { w = window.open(url, "_blank"); if (w) w.opener = null; } catch (err) {}
    if (!w) { // في حال منع النوافذ المنبثقة: ننتقل لواتساب بعد انتهاء الإرسال أو 1.5 ثانية كحد أقصى
      var went = false, go = function () { if (!went) { went = true; location.href = url; } };
      setTimeout(go, 1500);
      if (mail && mail.then) mail.then(go, go); else setTimeout(go, 50);
    }
    cart = []; save(); f.notes.value = "";
    setView("done");
  });

  /* ---------- نصوص من الإعدادات ---------- */
  function fill(t) { return t.replace("{days}", C.deliveryDays).replace("{fee}", money(C.shippingFee)).replace("{free}", money(C.freeShippingThreshold)); }
  var shipPol = C.policies.shipping.filter(function (t) { return t.indexOf("{fee}") < 0 || (C.shippingFee > 0); })
    .map(function (t) { return (t.indexOf("{free}") >= 0 && !(C.freeShippingThreshold > 0)) ? t.replace(/، والشحن مجاني[^.]*/, "") : t; });
  $("#polShipping").innerHTML = shipPol.map(function (t) { return "<li>" + esc(fill(t)) + "</li>"; }).join("");
  $("#polExchange").innerHTML = C.policies.exchange.map(function (t) { return "<li>" + esc(fill(t)) + "</li>"; }).join("");
  $("#topbar").textContent = "🚚 توصيل خلال " + C.deliveryDays + " أيام" + (C.shippingFee > 0 && C.freeShippingThreshold > 0 ? " · شحن مجاني فوق " + money(C.freeShippingThreshold) : C.shippingFee > 0 ? " لكل مدن المملكة" : " · الشحن مجاني");
  $("#trustDays").textContent = "خلال " + C.deliveryDays + " أيام";
  var hello = waBase + "?text=" + encodeURIComponent("السلام عليكم، عندي استفسار عن عطور متجر " + C.storeName);
  $("#waFloat").href = hello; $("#lnkWa").href = hello;
  $("#lnkIg").href = C.instagramUrl; $("#lnkTt").href = C.tiktokUrl;
  if (!C.instagramUrl) $("#lnkIg").hidden = true; if (!C.tiktokUrl) $("#lnkTt").hidden = true;
  $("#year").textContent = new Date().getFullYear();

  var toastT;
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2000); }

  renderGrid(); renderCart(); fromHash();
})();
