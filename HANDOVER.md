# Übergabe: cursus-Website

Stand: 12. Oktober 2026. Entstanden in einem claude.ai-Chat. Ab jetzt führt ein neuer Owner das Projekt
mit **eigenen Konten** weiter (Claude, GitHub, Netlify, Supabase, Resend), komplett getrennt vom bisherigen
Account. Dieses Dokument ist für Menschen und für Claude gedacht: Es fasst zusammen, was existiert, was
entschieden wurde und was als Nächstes zu tun ist. Die verbindlichen Arbeitsregeln für den Code stehen in
[CLAUDE.md](CLAUDE.md).

---

## Kurzfassung

- **Website v0.1 ist fertig gebaut und getestet**: React + TypeScript, Deutsch und Englisch, mit
  interaktiver Europakarte (4 Szenen), Teilladungen-Check, ROI-Rechner und Terminbuchung.
- **Code liegt in diesem Repo** (privat, Branch `main`) und wird an den neuen Owner übertragen (Abschnitt 5.2).
- **Noch nicht live**: kein Hosting, keine Domain, das Formular sendet noch nichts, Impressum fehlt.
- **Nächste Schritte**: eigene Konten anlegen, Repo übernehmen, Claude Code installieren,
  Prompt A aus Abschnitt 6 ausführen.

---

## 1. Was cursus ist (Kontext aus dem Pitch-Deck, Okt 2026)

Das Deck selbst liegt nicht im Repo (vertraulich). Bei Bedarf im neuen Claude-Account hochladen oder unter
`docs/` ablegen. Die wichtigsten Punkte:

- **Produkt**: KI-Planungsschicht über dem bestehenden TMS von Frächtern und Speditionen. Liest
  LKW-Positionen (Telematik), Aufträge (TMS) und Angebote (Frachtbörsen, nur offizielle APIs), rankt jede
  mögliche nächste Ladung nach **Marge pro Kilometer** (inkl. Leer-km, Lenk-/Ruhezeiten, Lieferfenster),
  kombiniert Teilladungen, warnt bei Problemen unterwegs. Disponent entscheidet mit einem Klick.
  Vier Schritte: Verbinden, Bewerten, Vorschlagen, Lernen.
- **Problem**: 21,6 % der LKW-km in der EU leer (Eurostat 2024), Österreich 34 % (2020);
  502.000 unbesetzte Fahrerstellen in Europa (IRU 2025), weitere 660.000 gehen bis 2030 in Pension;
  bis zu 16 Partner werden pro Spotladung kontaktiert (TIMOCOM 2026).
- **Kunden**: Frächter mit eigener Flotte und Speditionen, die Subunternehmer-LKW planen.
- **Preismodell (intern, nicht auf der Website)**: Frächter 60 €/LKW/Monat (später Mischpreis 50 €),
  Speditionen 10 € pro geplanter Ladung. Bezahlter 3-Monats-Pilot, Vertrag erst bei erreichter Einsparung.
- **ROI-Beispiele**: Frächter mit 25 LKW zahlt 18.000 €/Jahr, gewinnt ca. 60.200 € (3,3×).
  Spedition mit 430 Ladungen/Monat zahlt 52.000 €, gewinnt ca. 127.200 € (2,4×, bis 5,8×).
- **Markt**: Strassengüterverkehr Europa ca. 440 Mrd. € (2025). TAM Dispositionssoftware EU 1,8 Mrd. €,
  SAM mittelgrosse Frächter AT + DE 165 Mio. € (9.200 Firmen, 229.000 LKW), SOM Jahr 5 (Basis) 8,4 Mio. € ARR.
- **Design-Partner**: österreichische Spedition ohne eigene LKW ("Vertex", Name **nicht öffentlich**),
  plant ca. 1.000 Subunternehmer-LKW/Monat mit Translogica und TIMOCOM; ein Team Schweiz–UK mit ca. 80 LKW
  und 430 Ladungen/Monat.
- **Roadmap**: Validieren Okt 2026 – Jan 2027 → Pilot bei Vertex Feb – Jun 2027 → erste 5 zahlende Kunden
  Jul 2027 – 2028, dann Seed-Runde.
- **Finanzierung**: Pre-Seed CHF 300–500k für 18 Monate.
- **Team**: zwei Co-Founder (einer studiert Business Management an der HSG, technischer Hintergrund);
  gesucht: Optimierungs-/Data-Engineer und Advisor mit Dispo-Erfahrung.

---

## 2. Was bisher gemacht wurde

1. **Klickbares Interview** zur Website mit Challenges (Zielgruppe, Perspektive, Demo, Claims, Recht).
   Ergebnisse siehe Abschnitt 3.
2. **Website gebaut** (dieses Repo), Sektionen in dieser Reihenfolge:
   Hero mit Live-Beispiel (LKW 14 in Lyon) · Problem in Zahlen · Heute vs. mit Cursus ·
   So funktioniert's (4 Schritte) · **Live-Karte** mit 4 Szenen (eine Entscheidung, selbst suchen,
   ganze Flotte 18 LKW über 3 Tage, Meldungen unterwegs) · Teilladungen-Check · ROI-Rechner ·
   Pilot 2027 · Team · FAQ · Erstgespräch mit Wunschterminen · Footer.
3. **Rechenlogik echt umgesetzt**: Strassennetz mit 53 Städten, Lenk- und Ruhezeiten nach EU-Regeln
   (vereinfacht), Marge = Fracht − 1,50 €/km, Ladefenster, Zusammenladeverbot Lebensmittel/Gefahrgut,
   Lademeter und Nutzlast, Flottensimulation ohne/mit Cursus. ROI-Formeln 1:1 aus dem Deck.
4. **Getestet** in einem Headless-Browser auf Desktop (1440 px) und Handy (390 px): alle Szenen,
   Rechner, Formular-Validierung und Bestätigung, keine Konsolenfehler, kein horizontales Scrollen.
5. **Vorschau**: Es gab eine private Vorschau-Seite im bisherigen claude.ai-Account. Sie ist für den neuen
   Owner nicht zugänglich und wird durch das eigene Netlify-Hosting ersetzt (Abschnitt 5.7).
   Eine lokale Vorschau startet jederzeit mit `npm run dev`.
6. **Vorbereitet, aber nicht aktiv**: Supabase-Tabelle `leads` + Edge Function `lead` (speichert Anfragen,
   schickt Mail über Resend), `netlify.toml`. Es existieren dafür noch **keine** Konten oder Projekte.
7. **Nicht gemacht**: `npm install`/Lockfile, Typecheck (in der Build-Umgebung nicht möglich),
   Deployment, Domain, Impressum/Datenschutz, echte Teamnamen und Fotos.

---

## 3. Entscheidungen

### Aus dem Interview

| Thema | Entscheidung |
|---|---|
| Zielgruppe | Primär Speditionen ohne eigene LKW |
| Perspektive | Frächter-Sicht "beste nächste Ladung für jeden LKW" |
| Ziel der Seite | Erstgespräch buchen (Kalender/Wunschtermine) |
| Skyscanner-Vergleich | Nicht verwenden, eigenes Bild |
| Karten-Simulation | Alle vier Szenen, ganz Europa |
| Design-Partner | Anonym: "österreichische Spedition, rund 1.000 LKW/Monat" |
| Preise | Keine Listenpreise, Pilot-Konditionen im Gespräch |
| Look | Dunkler Hero mit Karte, helle Inhalte darunter, Farben Navy + Orange |
| Bausteine | ROI-Rechner, Problem in Zahlen, 4 Schritte, Heute vs. mit Cursus, Teilladungen-Check, FAQ, Team |
| Sprachen | Deutsch und Englisch |
| Übergabe | Eigenes GitHub-Repo und eigene Konten des neuen Owners, Weiterarbeit in Claude Code |

### Von Claude getroffen (begründet, änderbar)

- **Zielgruppe + Perspektive zusammengeführt**: "für jeden LKW, den Sie planen – eigene Flotte oder
  Subunternehmer". So passt der LKW-Blick auch für Speditionen.
- **Frachtbörsen** (Frage blieb offen): TIMOCOM/Trans.eu nur als Text, keine Logos, "Anbindung beantragt".
- **"Sie"-Ansprache** auf Deutsch (B2B Logistik AT/DE), Schreibweise mit ß.
- **Eigene Europakarte** statt Kartendienst: kein API-Key, keine Besucher-IPs an Kartenserver
  (sonst Consent-Banner nötig), volle Kontrolle über Farben.
- **esbuild statt Vite**: In der Build-Umgebung gab es keinen npm-Zugriff. Wechsel später möglich.
- **Ehrlichkeit bei Zahlen**: Simulation als Modell gekennzeichnet; Rechnungen mit 1 % weniger km,
  auch wenn die Leerfahrtquote 21,6 % beträgt.

---

## 4. Strategie-Notiz: Layer über dem TMS oder eigenes TMS?

Frage aus dem Chat: Muss man als Layer für jedes System bei jeder Firma einen eigenen Agenten trainieren,
und wäre ein eigenes TMS klüger?

- **Kein Agent pro Firma.** Pro TMS-Produkt (z. B. Translogica) gibt es *einen* Adapter, der Daten in ein
  gemeinsames Datenmodell übersetzt; jeder weitere Kunde auf demselben TMS nutzt ihn mit. Das Ranking ist
  zuerst Rechnung/Optimierung und braucht kein Training. Pro Kunde gibt es nur Einstellungen
  (Kosten/km, Aufliegertypen, Relationen) und Feintuning aus seinen Entscheidungen. KI-Agenten eher für
  Unstrukturiertes (PDF-Aufträge, E-Mails, WhatsApp), firmenübergreifend.
- **Echtes Risiko des Layers**: Abhängigkeit von fremden APIs (fehlende APIs, Zugang wird verteuert oder
  gesperrt), Zurückschreiben ins TMS ist schwerer als Lesen.
- **Gegen eigenes TMS jetzt**: TMS-Wechsel dauert Monate (Abrechnung, Dokumente, Maut, EDI), riesiger
  Funktionsumfang, nicht machbar mit Pre-Seed und zwei Gründern, starke Konkurrenz (inkl. Qargo), und das
  Verkaufsargument "kein Systemwechsel" ginge verloren.
- **Empfehlung**: Als Layer starten, cursus zum täglichen Arbeitsbildschirm der Disponenten machen,
  später für kleine Frächter ohne TMS ein schlankes TMS anbieten.
- **Jetzt klären**: (1) Welche TMS nutzen die 20 wichtigsten Wunschkunden? (2) Hat Translogica eine API
  und ein Partnerprogramm? (3) Was muss bei Vertex zurück ins TMS geschrieben werden?

---

## 5. Übernahme durch den neuen Owner: Schritt für Schritt

### 5.1 Eigene Konten anlegen

Alle Konten gehören dem neuen Owner, am besten auf eine **gemeinsame Firmen-Mailadresse** (z. B. team@…),
damit sie nicht an einer einzelnen Person hängen.

| Konto | Wofür | Hinweis |
|---|---|---|
| Claude | Claude Code | Plan Pro, Max, Team oder Enterprise; der kostenlose Plan enthält kein Claude Code |
| GitHub | Code und Versionen | bekommt das Repo in Schritt 5.2 |
| Netlify | Hosting der Website | wird mit dem eigenen GitHub verbunden |
| Supabase | speichert Anfragen aus dem Formular | Projekt in einer EU-Region anlegen |
| Resend | E-Mail bei neuer Anfrage | braucht eine verifizierte Absender-Domain |
| Domain-Anbieter | eigene Domain | erst nach der Markenprüfung "cursus" |

### 5.2 Repo übernehmen

**Variante A – Übertragung (empfohlen, der Verlauf bleibt erhalten).**
Der bisherige Owner öffnet auf GitHub das Repo `cursus-website` → Settings → General → ganz unten
"Transfer ownership" und gibt den GitHub-Namen des neuen Owners ein. Der neue Owner bestätigt per E-Mail.
Danach hat der bisherige Owner keinen Zugriff mehr.

**Variante B – Kopie in ein neues Repo.**
Der neue Owner legt auf GitHub ein leeres, privates Repo `cursus-website` an (ohne README). Der bisherige
Owner gibt ihm vorübergehend Lesezugriff (Settings → Collaborators). Dann:

```bash
git clone https://github.com/<BISHERIGER-OWNER>/cursus-website
cd cursus-website
git remote set-url origin https://github.com/<DEIN-GITHUB-NAME>/cursus-website
git push -u origin main
```

Danach den Zugriff wieder entfernen und das alte Repo löschen.

### 5.3 Voraussetzungen auf dem Rechner

Mac mit macOS 13 oder neuer, Git, **Node.js 20 oder neuer** (`node -v` prüfen, sonst von nodejs.org).

### 5.4 Claude Code installieren und anmelden

```bash
curl -fsSL https://claude.ai/install.sh | bash
# neues Terminal-Fenster öffnen
claude --version
```

Beim ersten Start von `claude` öffnet sich der Browser: mit dem **eigenen** Claude-Account anmelden.
Alternativ: `brew install --cask claude-code`. Doku: https://code.claude.com/docs/en/setup

### 5.5 Repo holen und Claude Code starten

Bei Variante B ist das Repo schon lokal vorhanden; dann nur `cd cursus-website` und `claude`.

```bash
git clone https://github.com/<DEIN-GITHUB-NAME>/cursus-website
cd cursus-website
claude
```

Claude Code liest `CLAUDE.md` automatisch. Diese Datei (`HANDOVER.md`) im ersten Prompt erwähnen.

### 5.6 Erster Prompt (einfügen)

Siehe Abschnitt 6, Prompt A.

### 5.7 Live gehen mit dem eigenen Netlify (ohne Code, ca. 5 Minuten)

1. Im eigenen Netlify-Konto: Add new site → Import an existing project → GitHub → das eigene GitHub-Konto
   verbinden → `cursus-website` wählen.
2. Build-Einstellungen werden aus `netlify.toml` übernommen (Build `npm run build`, Ordner `dist`).
3. Deploy. Ab dann geht jeder Push auf `main` automatisch live.
4. Eigene Domain unter Site configuration → Domain management verbinden, sobald gesichert.

### 5.8 Buchungsformular mit eigenem Supabase und Resend scharf schalten

Ablauf steht in `CLAUDE.md` unter "Buchungsformular". Kurz: im eigenen Supabase-Konto ein Projekt in der
EU anlegen, Migration anwenden, Edge Function `lead` deployen, im eigenen Resend-Konto die Absender-Domain
verifizieren, Secrets setzen, `LEAD_ENDPOINT` im eigenen Netlify eintragen. Claude Code kann das mit
Prompt C übernehmen.

---

## 6. Fertige Prompts für Claude Code

**Prompt A – Einrichten und prüfen (zuerst)**
```
Lies CLAUDE.md und HANDOVER.md. Dann: npm install, npm run typecheck und alle Typfehler beheben,
ohne Verhalten oder Texte zu ändern. package-lock.json committen und pushen. Danach npm run build und
npm run dev starten und mir die lokale URL geben. Fasse am Ende zusammen, was du geändert hast.
```

**Prompt B – Team und Inhalte eintragen**
```
Trage im Team-Abschnitt (src/i18n/de.ts und en.ts, team.members) folgende Personen ein: [Name, Rolle,
1–2 Sätze Bio]. Fotos liegen in public/team/ als [dateiname.jpg]; ersetze die Platzhalter in
src/components/Team.tsx durch echte Bilder mit Alt-Text. Halte dich an die Inhaltsregeln in CLAUDE.md.
```

**Prompt C – Buchungsformular live schalten**
```
Schalte das Buchungsformular produktiv nach der Anleitung in CLAUDE.md (Abschnitt Buchungsformular),
in unserem eigenen Supabase- und Resend-Konto. Nutze die Supabase CLI und führe mich durch Login und
Projektauswahl. Frag mich nach Region (EU), Absender-Domain und Empfänger-Adresse, bevor du etwas anlegst.
Teste am Ende eine echte Anfrage und zeig mir den Eintrag in der Tabelle leads.
```

**Prompt D – Vor dem Launch**
```
Geh die Liste "Offen vor dem Launch" in CLAUDE.md durch. Erledige alles, was ohne Entscheidungen von uns
geht (OG-Bild, Favicons, Lighthouse- und Accessibility-Check mit Fixes), und gib mir eine kurze Liste
der Punkte, für die du Angaben von uns brauchst (z. B. Impressum-Daten).
```

---

## 7. Offen

**Vor dem Launch** (Details in `CLAUDE.md`):
Impressum und Datenschutzerklärung (braucht eine Firma als Rechtsperson) · Domain · Markenprüfung "cursus" ·
Teamnamen und Fotos · Buchungs-Backend · Lockfile und Typecheck · OG-Bild · SEO-Prerendering ·
cookieloses Analytics · Accessibility-Check · schriftliche Freigabe, den Design-Partner zu nennen.

**Fragen ans Team**:
- Wer sind die beiden Co-Founder, und dürfen Namen und Fotos auf die Seite?
- Unter welcher Firma und Adresse läuft das Impressum?
- Welche E-Mail-Adresse bekommt die Anfragen aus dem Formular?
- Soll das Formular Wunschtermine sammeln (jetzt) oder direkt in einen Kalender buchen (z. B. Cal.com)?
- Welche TMS nutzen die wichtigsten Wunschkunden (für die Reihenfolge der Schnittstellen)?
