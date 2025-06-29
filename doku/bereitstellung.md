# Bereitstellungs‑Guide 📦

**Modul „Allgemeine Verwaltung“ – Autovermietungssystem**

Dieses Dokument zeigt, wie du das Projekt **lokal in VS Code** startest. Wir nutzen einen modernen **Node + Vite‑Stack** mit **Supabase** als Back‑End‑Service (PostgreSQL + Auth). Es gibt **keine** PHP‑ oder XAMPP‑Abhängigkeiten und **kein** Vercel‑Deployment in dieser Variante.

---

## 1 · Voraussetzungen

| Tool                     | Zweck                                  | Download                                                         |
| ------------------------ | -------------------------------------- | ---------------------------------------------------------------- |
| **Node.js ≥ 18**         | Runtime für JavaScript / TypeScript    | [https://nodejs.org/](https://nodejs.org/)                       |
| **npm** (kommt mit Node) | Paket‑Management                       | –                                                                |
| **Git**                  | Repository klonen / Versions­kontrolle | [https://git-scm.com/](https://git-scm.com/)                     |
| **VS Code**              | Code‑Editor + Terminal                 | [https://code.visualstudio.com/](https://code.visualstudio.com/) |
| **Supabase‑Konto**       | gehostete Datenbank mit Auth           | [https://app.supabase.com/](https://app.supabase.com/)           |
| *optional* Supabase CLI  | lokale Supabase‑Instanz starten        | `npm i -g supabase`                                              |

---

## 2 · Repository klonen

```bash
# beliebiges Arbeits­verzeichnis öffnen
$ git clone https://github.com/rszoltysek/WinfoProjekt_SS_2025_Gruppe_Beta-.git
$ cd WinfoProjekt_SS_2025_Gruppe_Beta-
```

---

## 3 · Umgebungs­variablen setzen

1. Kopiere die Beispiel‑Datei:

   ```bash
   cp .env.example .env.local
   ```
2. Öffne `.env.local` und trage deine **Supabase URL** und den **anon‑Key** ein:

   ```bash
   VITE_SUPABASE_URL=https://<proj>.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
   ```

---

## 4 · Abhängigkeiten installieren

```bash
npm install
```

---

## 5 · Entwicklungs­server starten

```bash
npm run dev
```

* Der Vite‑Server öffnet sich automatisch unter [http://localhost:5173](http://localhost:5173).
* Bei **Supabase CLI**‑Nutzung kannst du lokal eine DB starten:

  ```bash
  supabase start
  # (optional) Schema anwenden, falls nötig
  supabase db push
  ```

---

## 6 · Testdaten laden (optional)

Wenn du Beispiel­daten brauchst, führe das SQL‑Script `docs/sql/seed.sql` in deiner Supabase‑Instanz aus (online oder CLI).

---

## 7 · Nützliche Befehle

| Befehl          | Beschreibung                  |
| --------------- | ----------------------------- |
| `npm run lint`  | Code‑Qualität prüfen (ESLint) |
| `npm run test`  | Unit‑Tests starten (Vitest)   |
| `npm run build` | Production‑Build erzeugen     |

---

## 8 · Troubleshooting

* **Fehler „Supabase URL not defined“** → `.env.local` nicht ausgefüllt oder falscher Pfad.
* **Port 5173 belegt** → in `vite.config.ts` Port anpassen (`server.port`).
* **Auth schlägt fehl** → Prüfe anon‑Key und RLS‑Policies in Supabase.

---

🎉 Viel Spaß beim Entwickeln! Sollte etwas fehlen, melde dich im Team‑Channel.
