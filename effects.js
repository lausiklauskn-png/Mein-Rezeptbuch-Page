/* ============================================================================
 * Mein Rezeptbuch · Landingpage — Effekte
 * Glas-Cabochon / holografischer Maus-Glanz (--mx/--my + 3D-Tilt --rx/--ry)
 * sowie optionales Ersetzen der Bilder per Drag&Drop / Klick (lokal gespeichert,
 * automatisch herunterskaliert). Vollständig offline, keine Abhängigkeiten.
 * ========================================================================== */
(function (global) {
  'use strict';

  /* ---- 1) Glaskugel-Glanz folgt der Maus (auch auf Bildern/Karten) ---- */
  function wireHolo() {
    if (wireHolo._done) return; wireHolo._done = true;
    var SEL = '.btn,.pill,.iconbtn,.navbtn,.themeopt,.srow,.faq,.stat,.scard,.galitem,.tcard,.hero,.sh-hero,.topnav button,.phone';
    var BIG = '.scard,.galitem,.tcard,.hero,.sh-hero,.stat,.phone';
    document.addEventListener('pointermove', function (e) {
      var b = e.target && e.target.closest && e.target.closest(SEL);
      if (!b) return;
      var max = b.matches(BIG) ? 5 : 9;
      var r = b.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      b.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      b.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      b.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
      b.style.setProperty('--rx', (-(py - 0.5) * 2 * max).toFixed(2) + 'deg');
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var b = e.target && e.target.closest && e.target.closest(SEL);
      if (!b) return;
      ['--mx', '--my', '--rx', '--ry'].forEach(function (v) { b.style.removeProperty(v); });
    }, { passive: true });
  }

  /* ---- 2) Drag&Drop-Bilder (optionaler Bild-Tausch) ---- */
  var LS = 'rb-img-';
  var picker = null;

  function downscale(file, cb) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
      if (w > max || h > max) { var s = Math.min(max / w, max / h); w = Math.round(w * s); h = Math.round(h * s); }
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      var out = null; try { out = c.toDataURL('image/jpeg', 0.82); } catch (_e) {}
      cb(out);
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  function setImg(el, dataUrl) {
    var img = el.querySelector('img');
    if (!img) { img = document.createElement('img'); el.insertBefore(img, el.firstChild); }
    img.src = dataUrl; img.style.display = '';
    el.classList.add('has-img');
  }

  function save(slot, dataUrl) {
    try { localStorage.setItem(LS + slot, dataUrl); }
    catch (_e) { toast('Bild zu groß für lokalen Speicher.'); }
  }
  function load(slot) { try { return localStorage.getItem(LS + slot); } catch (_e) { return null; } }

  function toast(m) {
    if (typeof global.toast === 'function') return global.toast(m);
    try { var t = document.createElement('div'); t.className = 'toast'; t.textContent = m;
      (document.getElementById('toasts') || document.body).appendChild(t);
      setTimeout(function () { t.remove(); }, 2600); } catch (_e) {}
  }

  function applyToAll(slot, dataUrl) {
    document.querySelectorAll('[data-slot="' + (window.CSS && CSS.escape ? CSS.escape(slot) : slot) + '"]').forEach(function (el) { setImg(el, dataUrl); });
  }
  function handleFile(el, slot, file) {
    if (!file || !/^image\//.test(file.type)) { toast('Bitte eine Bilddatei ablegen.'); return; }
    downscale(file, function (d) { if (!d) { toast('Bild konnte nicht gelesen werden.'); return; } save(slot, d); applyToAll(slot, d); toast('Bild eingesetzt ✓'); });
  }

  function openPicker(el, slot) {
    if (!picker) { picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'image/*'; picker.style.display = 'none'; document.body.appendChild(picker); }
    picker.value = '';
    picker.onchange = function () { if (picker.files && picker.files[0]) handleFile(el, slot, picker.files[0]); };
    picker.click();
  }

  function wireSlot(el, slot) {
    if (el._rb) return; el._rb = 1;
    el.classList.add('dropzone');
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'slot-edit'; btn.title = 'Bild ersetzen (Klick oder Datei hierher ziehen)'; btn.textContent = '📷';
    btn.addEventListener('click', function (e) { e.stopPropagation(); openPicker(el, slot); });
    el.appendChild(btn);

    el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('dragover'); });
    el.addEventListener('dragleave', function (e) { if (e.target === el) el.classList.remove('dragover'); });
    el.addEventListener('drop', function (e) {
      e.preventDefault(); e.stopPropagation(); el.classList.remove('dragover');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      handleFile(el, slot, f);
    });
  }

  function apply(root) {
    wireHolo();
    (root || document).querySelectorAll('[data-slot]').forEach(function (el) {
      var slot = el.getAttribute('data-slot');
      var d = load(slot);
      if (d) setImg(el, d);
      wireSlot(el, slot);
    });
  }

  global.RBImg = { apply: apply };
})(window);
