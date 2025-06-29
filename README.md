# Autovermietung – Verwaltungssystem 🚗

Willkommen im Semesterprojekt **Gruppe Beta (Winfo SS 2025)**.

Diese Web-App unterstützt eine mittelgroße Autovermietung dabei, ihren **Fuhrpark**, die **Leistungskennzahlen** und die **Personaleinsatzplanung** zentral und intuitiv zu steuern.

---

## Funktionsüberblick

| Modul | Kurzbeschreibung |
|-------|------------------|
| **E1 – Stationen verwalten** | Stammdaten jeder Mietstation pflegen, Fahrzeuge zuordnen, Verfügbarkeiten einsehen. |
| **E2 – Leistungs-Dashboard** | Umsatz- & Auslastungs-KPIs live verfolgen; Berichte als CSV / PDF exportieren. |
| **E3 – Personalplanung** | Dienstpläne per Drag-and-Drop erstellen, Urlaubs-Konflikte sofort erkennen, Mitarbeitende benachrichtigen. |

---

## Lokaler Start in VS Code

```bash
# 1. Repository holen
git clone https://github.com/rszoltysek/WinfoProjekt_SS_2025_Gruppe_Beta-.git
cd WinfoProjekt_SS_2025_Gruppe_Beta-

# 2. Umgebungsvariablen (Supabase) einrichten
cp .env.local.example .env.local        # Keys einfügen

# 3. Abhängigkeiten installieren
npm install

# 4. Entwicklungsserver starten
npm run dev          # läuft standardmäßig auf http://localhost:5173
