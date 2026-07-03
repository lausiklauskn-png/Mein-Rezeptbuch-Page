# Mein Rezeptbuch · Landingpage

Installierbare **PWA-Landingpage** für die App **[Mein Rezeptbuch](https://lausiklauskn-png.github.io/Mein-Rezeptbuch/)** –
sie stellt vor, *was* die App kann, *wie* sie es macht und *für wen* sie nützlich ist.
Aufbau und Technik sind ein umgebrandeter Klon der ISD-Page-Entwurf-Struktur, vollständig
auf Mein Rezeptbuch zugeschnitten (keine Fremdbezüge mehr).
**Live:** https://lausiklauskn-png.github.io/Mein-Rezeptbuch-Page/

## Aufbau

Single-File-Ansatz mit wenigen Geschwister-Dateien (offline-fähig, keine externen Abhängigkeiten
außer dem lokal vendorierten three.js):

| Datei | Zweck |
|---|---|
| `index.html` | Die komplette Seite (HTML + CSS + JS in einer Datei) |
| `effects.js` | Glaskugel-/Holo-Effekt + optionaler Bild-Tausch per Drag&Drop |
| `assets/mycel-bg.js` | three.js-Partikel-Hintergrund, färbt sich nach dem aktiven Theme |
| `vendor/three.module.min.js` | three.js (lokal, kein CDN) |
| `sw.js` | Service Worker (offline + installierbar) |
| `manifest.webmanifest` | PWA-Manifest |
| `icon-192/512*.png` | App-Icons (Buch-Icon aus der App) |
| `img/*.jpg` | Food-Fotos, Food-Zines und App-Screenshots |

## Inhalt (6 Screens)

1. **Start** – Hero, Kennzahlen, Blick in die App (Phone-Mockups), Top-Funktionen, „Für wen?"
2. **Funktionen** – alle Funktionen mit Suche/Filter + Food-Galerie
3. **KI & Food-Zine** – Foto→KI→Rezept-Ablauf, Food-Zine-Showcase, Kostenmodell, Vergleichstabelle
4. **Themen & Sprachen** – 8 umschaltbare Farbwelten (wie in der App) + 8 Sprachen
5. **FAQ**
6. **Kontakt & Impressum** – App installieren, Kontakt, Impressum/Datenschutz, Feedback

## Bilder

Die Food-Fotos, KI-Food-Zines und App-Screenshots stammen aus Mein Rezeptbuch. Sie wurden
auf den reinen Inhalt zugeschnitten (kein sichtbarer Screenshot-Rahmen) und web-tauglich
komprimiert. App-Screenshots werden in Phone-Mockups gezeigt. Bilder lassen sich per
Drag&Drop / 📷-Knopf lokal austauschen.

## Themen

Acht Farbwelten aus der App (Landhaus, Frühling, Nacht, Modern, Bunt, Neon, Pastell, Spektral).
Jedes Theme setzt nur seine Palette-Zeile; alle semantischen Farben leiten sich per `color-mix`
davon ab – so bleibt die Erweiterung um weitere Themen minimal.

## Lokal ansehen

```bash
python3 -m http.server 8099
# → http://localhost:8099/index.html
```

## Hinweis

Diese Seite ist **noch nicht** auf familyproject.de veröffentlicht – sie liegt als Entwurf/Beispiel
im Repo. Geplanter Einsatz: verlinktes Beispiel im Family-Project.
