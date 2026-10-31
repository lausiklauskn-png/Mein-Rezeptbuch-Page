**🔬 Regel: Forschung nur in Kimhub (Klaus 2026-10-31: „einheitlich alles in Kimhub … in den einzelnen Repos soll keine Forschungseinträge sein“):** jeder Forschungseintrag (Sitzungs-Befunde, Messungen, Stunden-Auswertungen, Forschungsnotizen) kommt nach **Kimhub `forschung/messungen/`**; in diesem Repo werden keine Forschungseinträge geführt und keine Forschungsdateien angelegt. Öffentliche Forschungs**aufgaben** stehen in Sage-Protokol.

# Mein-Rezeptbuch · Landingpage — Sitzungs-Anker

Installierbare PWA-Landingpage für die App **Mein Rezeptbuch** (eigenes Repo). Hier
liegt **nicht** die App selbst — wer am Rezeptbuch baut, ist im falschen Repo.

## Was hier leicht kaputtgeht

- **Cache-Bump:** `CACHE` in `sw.js` (`rezeptbuch-page-vNN`) erhöhen, wenn eine Datei
  aus dem Vorrat sich ändert. Sonst liefert der Service-Worker die alte Fassung.
- `vendor/` ist mitgeliefert, damit die Seite **ohne CDN** läuft — nicht durch einen
  Netz-Aufruf ersetzen.
- Ladezeit-Regeln (Bilder, Skripte, Layout, Messen): Skill `seiten-bauregeln`.

## Netzweit

Freibrief zum Selbst-Mergen · Gerätename · frisch von `origin/main` vor jeder Arbeit ·
Ton · kein PII · Ehrlichkeit stehen **einmal** in
**[`Sage-Protokol/docs/NETZWEIT.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/NETZWEIT.md)**.

```bash
git fetch origin --quiet && git checkout -B <branch> origin/main
git push -u origin refs/heads/<branch>:refs/heads/<branch>
git diff --stat origin/main origin/<branch>     # leer = der PR wäre leer
```


## ⬇ Installieren-Knopf in der Kopfleiste (2026-10-18)

Klaus: „Den Installieren-Button überall fest einbauen … Wenn es kein Einstellungsfeld gibt, dann den Installier-Button oben ins Menü hinein.“ `assets/installieren.js` ist byte-1:1 aus Sage-Protokol (SHA-256 `e0644084…c3`), nie hier abwandeln. Der Knopf steht vor 🌙 (`data-vor="tbDark"`, nur ⬇), ist immer da und verschwindet, sobald die Seite als App läuft. Die Leiste unten (`#installBar`) bleibt ein Hinweis; ihr Knopf tippt den neuen an (`installApp`). Im Vorrat, Cache erhöht. Gemessen im Browser: sichtbar, als App weg, Meldung lesbar, keine Installierbarkeits-Fehler, 360 px ohne Überlauf. ⚠ Am Tablet nicht gemessen.
