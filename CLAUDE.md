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
