# Design Dokumentation: Allgemeine Verwaltung

Dieses Dokument beschreibt die Designentscheidungen für den Bereich "E. Allgemeine Verwaltung" des Autovermietungssystems.

## 1. Architektur

### 1.1 Architekturüberblick

Das Modul "Allgemeine Verwaltung" wird als Teil einer mehrschichtigen Architektur implementiert. Die Architektur umfasst die folgenden Schichten:

* **Präsentationsschicht:** Zuständig für die Darstellung der Benutzeroberfläche und die Interaktion mit dem Benutzer. (z.B. HTML, CSS, JavaScript)
* **Anwendungsschicht:** Enthält die Geschäftslogik des Moduls. (z.B. PHP, Java, Python)
* **Datenhaltungsschicht:** Zuständig für den Zugriff auf die Datenbank. (z.B. MySQL)

### 1.2 Komponenten

Die Hauptkomponenten des Moduls "Allgemeine Verwaltung" sind:

* **Mietstationsverwaltung:**
    * Ermöglicht die Verwaltung der Stammdaten von Mietstationen.
    * Stellt Funktionen zum Erstellen, Anzeigen, Bearbeiten und Löschen von Mietstationen bereit.
* **Performance-Berichtserstellung:**
    * Generiert Performance-Berichte für die Unternehmenszentrale.
    * Berechnet und visualisiert Leistungskennzahlen.
* **Personaleinsatzplanung:**
    * Unterstützt die Planung des Personaleinsatzes in den Mietstationen.
    * Verwaltet Personalstammdaten und plant den Einsatz basierend auf der Auslastung.
* **Gemeinsame Dienste:**
    * Stellt gemeinsame Funktionen für die anderen Komponenten bereit (z.B. Datenbankzugriff, Fehlerbehandlung).

### 1.3 Diagramme

* Ein **Komponentendiagramm** (UML) wird die Beziehungen und Abhängigkeiten zwischen den Hauptkomponenten des Moduls "Allgemeine Verwaltung" darstellen.
* Ein **Deploymentdiagramm** (UML) wird die physische Verteilung der Komponenten auf die Infrastruktur zeigen (z.B. Webserver, Datenbankserver).

## 2. Datenmodellierung

### 2.1 Entity-Relationship-Diagramm (ERD)

Ein ERD wird die wichtigsten Entitäten und ihre Beziehungen im Modul "Allgemeine Verwaltung" darstellen.

* **Mietstation:**
    * `StationsID` (PK)
    * `Name`
    * `Adresse`
    * `Telefonnummer`
    * `Kapazität`
    * ...
* **PerformanceBericht:**
    * `BerichtID` (PK)
    * `Datum`
    * `MietstationID` (FK)
    * `Umsatz`
    * `Auslastung`
    * ...
* **PersonalEinsatzPlan:**
    * `PlanID` (PK)
    * `Datum`
    * `MietstationID` (FK)
    * `MitarbeiterID` (FK)
    * `Rolle`
    * `Schicht`
    * ...
* **Mitarbeiter:**
    * `MitarbeiterID` (PK)
    * `Name`
    * `Rolle`
    * `...`

### 2.2 Datenbankschema

Das Datenbankschema wird die Tabellen und Beziehungen in der MySQL-Datenbank definieren. Es wird auf dem ERD basieren.

## 3. Benutzeroberfläche (UI) Design

### 3.1 Allgemeine Richtlinien

* Die Benutzeroberfläche soll benutzerfreundlich, intuitiv und konsistent sein.
* Es sollen die im Lastenheft genannten Mock-up-Tools verwendet werden (z.B. Claritee.io), um die UI zu entwerfen.
* Die UI soll responsive sein und auf verschiedenen Geräten (Desktop, Tablet, Smartphone) funktionieren.
* Es sollen die GUI-Design-Standards beachtet werden (siehe Lastenheft). [cite: 131]

### 3.2 Mockups

* Für jeden Geschäftsanwendungsfall (Mietstationen verwalten, Performance-Bericht erstellen, Personaleinsatz planen) werden Mockups der wichtigsten Bildschirme erstellt.
* Die Mockups zeigen das Layout, die Navigation und die Interaktionselemente der UI.
* Die Mockups werden im Verzeichnis `doku/mockups/` gespeichert.

### 3.3 Navigationsdesign

* Die Navigation innerhalb des Moduls "Allgemeine Verwaltung" soll einfach und klar sein.
* Es wird ein Navigationsmenü verwendet, um zwischen den Hauptfunktionen zu wechseln.
* Breadcrumbs helfen dem Benutzer, seinen aktuellen Standort innerhalb der Anwendung zu bestimmen.

### 3.4 Formulare

* Formulare zur Dateneingabe sollen benutzerfreundlich gestaltet sein.
* Es werden geeignete Eingabefelder (z.B. Textfelder, Dropdown-Menüs, Datumsfelder) verwendet.
* Es werden Validierungen durchgeführt, um sicherzustellen, dass die eingegebenen Daten korrekt sind.
* Fehlermeldungen sollen klar und verständlich sein.

## 4. Schnittstellen

### 4.1 Schnittstellen zu anderen Modulen

Das Modul "Allgemeine Verwaltung" interagiert mit den folgenden Modulen:

* **Buchungssystem:** Um Daten für die Performance-Berichte und die Personaleinsatzplanung abzurufen.
* **Personalverwaltungssystem:** Um Mitarbeiterdaten abzurufen und zu aktualisieren.

### 4.2 Schnittstellen zu externen Systemen

Es sind keine direkten Schnittstellen zu externen Systemen geplant.

## 5. Technologien

Die folgenden Technologien werden für die Implementierung des Moduls "Allgemeine Verwaltung" verwendet:

* **Frontend:** HTML5, CSS, JavaScript
* **Backend:** PHP (oder eine andere im Lastenheft erlaubte Sprache)
* **Datenbank:** MySQL

## 6. Designentscheidungen

* Die Entscheidung für eine mehrschichtige Architektur ermöglicht eine klare Trennung der Zuständigkeiten und eine bessere Wartbarkeit.
* Die Verwendung von MySQL als Datenbank entspricht den Empfehlungen des Lastenhefts. [cite: 9]
* Die UI-Gestaltung orientiert sich an den GUI-Design-Standards, um eine benutzerfreundliche Anwendung zu gewährleisten. [cite: 131]

---

**Hinweise:**

* Diese `design.md`-Datei gibt einen Überblick über die wichtigsten Designaspekte des Moduls "Allgemeine Verwaltung".
* Sie wird im Laufe des Projekts weiter verfeinert und mit detaillierteren Designinformationen ergänzt.
* Diagramme (z.B. Komponentendiagramm, ERD) und Mockups werden separat erstellt und in die Dokumentation eingebunden oder verlinkt.
* Die Datei soll die Designentscheidungen nachvollziehbar machen und die Kommunikation innerhalb des Entwicklungsteams erleichtern.
