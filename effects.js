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

  /* ---- 3) Zugang: der Bild-Tausch ist ein WERKZEUG, kein Angebot ----
   * Klaus' Befund 2026-08-08: an jedem Bild hing ein 📷-Knopf, und ein Klick
   * auf die Handy-Bilder oeffnete ein Datei-Fenster. Das ist Werkzeug aus der
   * Bauphase — fuer einen Besucher sinnlos und verwirrend, und es kostet bei
   * JEDEM Seitenaufbau Arbeit: sieben Knoepfe anlegen, sieben Dropzonen
   * verdrahten, sieben Speicher-Abfragen (gemessen 47 · 47 · 43 mit gegen
   * 48 · 48 · 46 ohne).
   *
   * Klaus' Anweisung: "nur wenn ich diesen Knopf druecke, soll das geladen
   * werden" — also derselbe Griff wie im Studio von family-projekt.de:
   * 1,5 s Druck auf die ©-Zeile im Fuss (dort assets/studio-markt.js
   * wireAccess). Zehn Pixel Wackeln sind erlaubt, damit Scrollen den Griff
   * nicht ausloest.
   *
   * Im gesperrten Zustand wird NICHTS verdrahtet und auch kein gespeichertes
   * Bild eingesetzt — sonst saehe Klaus eine andere Seite als jeder Besucher.
   * Die gespeicherten Bilder bleiben liegen; ein Langdruck holt sie zurueck. */
  var LS_MODUS = 'rb-bearbeiten';
  function istOffen() { try { return localStorage.getItem(LS_MODUS) === '1'; } catch (_e) { return false; } }

  function oeffnen() {
    try { localStorage.setItem(LS_MODUS, '1'); } catch (_e) {}
    document.body.classList.add('rb-bearbeiten');
    slotsVerdrahten(document);
    toast('Bild-Werkzeug an — 📷 an jedem Bild. Nochmal lang druecken schaltet es aus.');
  }
  function schliessen() {
    try { localStorage.setItem(LS_MODUS, '0'); } catch (_e) {}
    document.body.classList.remove('rb-bearbeiten');
    document.querySelectorAll('.slot-edit').forEach(function (b) { b.remove(); });
    document.querySelectorAll('.dropzone').forEach(function (el) { el.classList.remove('dropzone'); });
    toast('Bild-Werkzeug aus.');
  }

  function wireZugang() {
    if (wireZugang._done) return;
    var trig = null, kandidaten = document.querySelectorAll('footer .wrap, .fp-copy, footer');
    for (var i = 0; i < kandidaten.length; i++) {
      if (/©/.test(kandidaten[i].textContent || '')) { trig = kandidaten[i]; break; }
    }
    /* Noch nicht da? Die ©-Zeile steht im Dokument HINTER dem Skript, das sie
     * sucht — beim ersten apply() existiert sie also gar nicht. Deshalb erst
     * abhaken, wenn sie wirklich gefunden wurde, und spaeter nochmal nachsehen. */
    if (!trig) {
      if (!wireZugang._wartet) {
        wireZugang._wartet = true;
        document.addEventListener('DOMContentLoaded', wireZugang, { once: true });
        window.addEventListener('load', wireZugang, { once: true });
      }
      return;                                // fail-soft: ohne Fuss passiert nichts
    }
    wireZugang._done = true;
    var timer = null, sx = 0, sy = 0;
    var clear = function () { if (timer) { clearTimeout(timer); timer = null; } };
    trig.addEventListener('pointerdown', function (e) {
      sx = e.clientX; sy = e.clientY; clear();
      timer = setTimeout(function () { timer = null; istOffen() ? schliessen() : oeffnen(); }, 1500);
    });
    trig.addEventListener('pointermove', function (e) {
      if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) clear();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { trig.addEventListener(ev, clear); });
  }

  function slotsVerdrahten(root) {
    (root || document).querySelectorAll('[data-slot]').forEach(function (el) {
      var slot = el.getAttribute('data-slot');
      var d = load(slot);
      if (d) setImg(el, d);
      wireSlot(el, slot);
    });
  }

  function apply(root) {
    wireHolo();
    wireZugang();
    if (!istOffen()) return;                 // Regelfall: nichts weiter zu tun
    slotsVerdrahten(root);
  }

  global.RBImg = { apply: apply };
})(window);
