# Anforderungen: Allgemeine Verwaltung

Dieses Dokument beschreibt die detaillierten Anforderungen für den Bereich "E. Allgemeine Verwaltung" des Autovermietungssystems. Es basiert auf dem Lastenheft "DV-Projekt Winfo - Anwendungssystem Autovermietung SS 2025".

## E1: Geschäftsanwendungsfall: Mietstationen verwalten

### Beschreibung

In der Unternehmenszentrale werden die Mietstationen verwaltet. [cite: 247] Dies umfasst die Pflege von Stammdaten, die Überwachung und Optimierung des Fahrzeugbestands sowie die Durchführung von Fahrzeugüberführungen.

### Funktionale Anforderungen

* **E1.1 Stammdatenpflege:**
    * Das System soll es ermöglichen, Stammdaten für jede Mietstation zu erfassen und zu pflegen. [cite: 247]
    * Zu den Stammdaten gehören:
        * Name der Mietstation
        * Adresse
        * Telefonnummer
        * E-Mail-Adresse
        * Kapazität (Anzahl Stellplätze für PKW)
        * Informationen zur Fahrzeugaufbereitung (ja/nein, Art der Aufbereitung)
        * Informationen zur Schadensregulierung (ja/nein)
    * Das System soll eine Benutzeroberfläche bieten, um neue Mietstationen anzulegen, bestehende zu bearbeiten und zu löschen.
    * Das System soll Datenvalidierungen durchführen, um sicherzustellen, dass alle erforderlichen Stammdaten vorhanden und im richtigen Format sind.
* **E1.2 Fahrzeugbestand überwachen und optimieren:**
    * Das System soll den aktuellen Fahrzeugbestand jeder Mietstation erfassen und anzeigen. [cite: 247]
    * Der Fahrzeugbestand umfasst:
        * Anzahl der verfügbaren Fahrzeuge (nach Fahrzeugtyp)
        * Anzahl der vermieteten Fahrzeuge (nach Fahrzeugtyp)
        * Anzahl der Fahrzeuge in der Aufbereitung/Reparatur
    * Das System soll Warnmeldungen ausgeben, wenn der Fahrzeugbestand einer Mietstation einen bestimmten Schwellenwert unter- oder überschreitet.
    * Das System soll Vorschläge zur Optimierung des Fahrzeugbestands geben (z. B. Überführung von Fahrzeugen von einer Station zu einer anderen).
* **E1.3 Fahrzeugüberführung durchführen:**
    * Das System soll die Überführung von Fahrzeugen zwischen Mietstationen unterstützen. [cite: 248]
    * Dies umfasst:
        * Erfassung der Überführungsaufträge (von welcher Station zu welcher Station, Anzahl und Typ der Fahrzeuge)
        * Planung der Überführung (Termin, Fahrer)
        * Dokumentation der Überführung (Status, ggf. Abweichungen)
    * Das System soll die Auswirkungen der Überführung auf den Fahrzeugbestand der beteiligten Stationen aktualisieren.

### Nicht-funktionale Anforderungen

* **E1.N1 Performance:**
    * Das System soll Anfragen zur Stammdatenpflege, Bestandsabfrage und Überführungsverwaltung innerhalb von X Sekunden beantworten (z.B. 2 Sekunden).
* **E1.N2 Sicherheit:**
    * Der Zugriff auf die Funktionen zur Mietstationsverwaltung soll auf autorisierte Benutzer beschränkt sein (z.B. Mitarbeiter der Unternehmenszentrale).
    * Das System soll die Datenintegrität gewährleisten (z.B. durch Transaktionsmanagement).
* **E1.N3 Benutzerfreundlichkeit:**
    * Die Benutzeroberfläche soll intuitiv und einfach zu bedienen sein.
    * Fehlermeldungen sollen klar und verständlich sein.
* **E1.N4 Skalierbarkeit:**
    * Das System soll in der Lage sein, eine wachsende Anzahl von Mietstationen und Fahrzeugen zu verwalten.

## E2: Geschäftsanwendungsfall: Performance-Bericht erstellen

### Beschreibung

In der Unternehmenszentrale wird ein Performance-Bericht erstellt, um die Leistung der einzelnen Mietstationen zu analysieren. [cite: 249]

### Funktionale Anforderungen

* **E2.1 Leistungskennziffern definieren:**
    * Das System soll es ermöglichen, verschiedene Leistungskennziffern (KPIs) zu definieren. [cite: 250]
    * Beispiele für KPIs sind:
        * Auslastung der Mietstation (nach Fahrzeugtyp)
        * Umsatz pro Mietstation
        * Durchschnittliche Mietdauer
        * Anzahl der Schäden pro Mietstation
    * Das System soll es ermöglichen, KPIs zu gruppieren und zu kategorisieren.
* **E2.2 Leistungskennziffern der einzelnen Mietstationen auswerten:**
    * Das System soll die definierten KPIs für jede Mietstation berechnen und anzeigen. [cite: 251, 252]
    * Die Daten für die Berechnung der KPIs sollen aus dem laufenden Buchungssystem exportiert und in das Reporting-System importiert werden. [cite: 251]
    * Das System soll es ermöglichen, die KPIs für verschiedene Zeiträume (z.B. täglich, wöchentlich, monatlich, jährlich) auszuwerten.
* **E2.3 Performance-Dashboard erstellen:**
    * Das System soll ein Dashboard zur Visualisierung der Unternehmensleistung bereitstellen. [cite: 253]
    * Das Dashboard soll die wichtigsten KPIs in übersichtlicher Form darstellen (z.B. in Form von Diagrammen, Tabellen, Grafiken).
    * Das Dashboard soll es ermöglichen, Drill-Down-Analysen durchzuführen, um detailliertere Informationen zu erhalten.
    * Das Dashboard soll exportierbar sein (z.B. als PDF oder Excel).

### Nicht-funktionale Anforderungen

* **E2.N1 Performance:**
    * Die Generierung von Performance-Berichten soll innerhalb eines angemessenen Zeitraums erfolgen (z.B. X Minuten).
* **E2.N2 Sicherheit:**
    * Der Zugriff auf die Performance-Berichte soll auf autorisierte Benutzer beschränkt sein.
* **E2.N3 Datenqualität:**
    * Das System soll sicherstellen, dass die Daten für die Berechnung der KPIs korrekt und vollständig sind.
* **E2.N4 Flexibilität:**
    * Das System soll es ermöglichen, neue KPIs bei Bedarf hinzuzufügen.

## E3: Geschäftsanwendungsfall: Personaleinsatz planen

### Beschreibung

Die HR-Abteilung des Unternehmens plant den Personaleinsatz zentral für alle Mietstationen. [cite: 253]

### Funktionale Anforderungen

* **E3.1 Notwendige Stammdaten und Auslastungsdaten bereitstellen:**
    * Das System soll die notwendigen Stammdaten (Personal, Mietstation) und Auslastungsdaten bereitstellen. [cite: 253]
    * Stammdaten Personal:
        * Mitarbeitername
        * Mitarbeiter-ID
        * Rolle (z.B. Stationsleiter, Sachbearbeiter, Fahrzeugaufbereiter)
        * Verfügbarkeit
        * Qualifikationen
    * Stammdaten Mietstation: (siehe E1.1)
    * Auslastungsdaten:
        * Anzahl der erwarteten Ankünfte/Abholungen
        * Anzahl der erwarteten Rückgaben
        * Anzahl der Reservierungen
* **E3.2 Personaleinsatz planen:**
    * Das System soll die Planung des Personaleinsatzes auf Basis der Auslastungsdaten ermöglichen. [cite: 254, 255]
    * Das System soll Vorschläge für die Personalplanung machen (z.B. Anzahl der benötigten Mitarbeiter pro Rolle pro Station).
    * Das System soll es ermöglichen, den Personaleinsatz manuell anzupassen.
    * Das System soll verschiedene Planungszeiträume unterstützen (z.B. täglich, wöchentlich, monatlich).
* **E3.3 Personaleinsatz überwachen:**
    * Das System soll die Überwachung des Personaleinsatzes ermöglichen. [cite: 256]
    * Das System soll es ermöglichen, den geplanten Personaleinsatz mit dem tatsächlichen Personaleinsatz zu vergleichen.
    * Das System soll Warnmeldungen ausgeben, wenn es Abweichungen gibt (z.B. Unterbesetzung).
    * Das System soll die kurzfristige Anpassung des Personaleinsatzes bei Bedarf ermöglichen (z.B. bei Krankheitsfällen).

### Nicht-funktionale Anforderungen

* **E3.N1 Performance:**
    * Die Planung des Personaleinsatzes soll innerhalb eines angemessenen Zeitraums erfolgen.
* **E3.N2 Sicherheit:**
    * Der Zugriff auf die Funktionen zur Personaleinsatzplanung soll auf autorisierte Benutzer beschränkt sein (z.B. Mitarbeiter der HR-Abteilung).
* **E3.N3 Integration:**
    * Das System soll mit anderen Systemen integriert werden können (z.B. mit dem Buchungssystem, dem Personalverwaltungssystem).
* **E3.N4 Flexibilität:**
    * Das System soll verschiedene Arbeitszeitmodelle und Schichtplanungen unterstützen.

---

**Hinweise:**

* Diese `anforderungen.md`-Datei ist eine detaillierte Ausarbeitung der im Lastenheft genannten Geschäftsanwendungsfälle.
* Sie enthält sowohl funktionale (was das System tun soll) als auch nicht-funktionale (wie das System sein soll) Anforderungen.
* Die nicht-funktionalen Anforderungen sind wichtig, um die Qualität des Systems sicherzustellen.
* Diese Datei sollte im Laufe des Projekts weiter verfeinert und aktualisiert werden.
* Die Anforderungen sind so formuliert, dass sie testbar sind.
* Die Nummerierung der Anforderungen (z.B. E1.1, E2.N3) dient der besseren Referenzierung.
