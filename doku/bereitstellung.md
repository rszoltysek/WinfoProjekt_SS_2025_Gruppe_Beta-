# Bereitstellungsanleitung: Allgemeine Verwaltung

Dieses Dokument beschreibt die Schritte zur Bereitstellung des Moduls "Allgemeine Verwaltung" für das Autovermietungssystem.

## 1. Voraussetzungen

Stellen Sie sicher, dass die folgenden Komponenten installiert und konfiguriert sind:

* **Webserver:** XAMPP (mit Apache) [cite: 8, 9, 10]
* **Datenbank:** MySQL [cite: 8, 9, 10]
* **PHP:** Version 7.4.29 oder höher (falls PHP verwendet wird) [cite: 30, 31]
* **Entwicklungsumgebung:** Visual Studio (oder eine andere bevorzugte IDE) [cite: 8, 9, 10]
* **Git:** Zur Versionskontrolle und zum Klonen des Repositorys
* **Betriebssystem:** Windows (oder ein anderes geeignetes System für den Server)

## 2. Repository klonen

1.  Öffnen Sie die Eingabeaufforderung oder ein Terminal.
2.  Navigieren Sie zu dem Verzeichnis, in dem Sie das Repository klonen möchten (z. B. `xampp/htdocs` für XAMPP).
3.  Führen Sie den folgenden Befehl aus, um das Repository zu klonen:

    ```bash
    git clone <URL_DES_REPOSITORYS>
    ```

    Ersetzen Sie `<URL_DES_REPOSITORYS>` durch die tatsächliche URL des GitHub-Repositorys für das Modul "Allgemeine Verwaltung".

## 3. Datenbank einrichten

1.  Starten Sie den MySQL-Dienst über XAMPP Control Panel oder einen anderen Dienstmanager.
2.  Öffnen Sie ein MySQL-Client-Tool (z. B. phpMyAdmin).
3.  Erstellen Sie eine neue Datenbank (z. B. `autovermietung`).
4.  Führen Sie das SQL-Skript zum Erstellen der Datenbankstruktur aus. Das Skript befindet sich im Verzeichnis `daten/` des Repositorys (z. B. `daten/initialdaten.sql`).
5.  Stellen Sie sicher, dass die Datenbankverbindungseinstellungen in der Konfigurationsdatei korrekt sind (z. B. `config/db_config.php` oder ähnliches).

## 4. Webserver konfigurieren

1.  Stellen Sie sicher, dass der Apache-Webserver gestartet ist (über XAMPP oder einen anderen Dienstmanager).
2.  Wenn sich der Code nicht im Root-Verzeichnis des Webservers befindet, konfigurieren Sie einen Virtual Host oder passen Sie die Document Root entsprechend an.

## 5. Aufgabenplanung (falls zutreffend)

Falls Aufgabenplanung für bestimmte Funktionen erforderlich ist (z.B. für das Erstellen von Performance-Berichten oder andere Hintergrundprozesse):

1.  Öffnen Sie die Aufgabenplanung des Betriebssystems (z. B. "Aufgabenplanung" unter Windows)[cite: 30, 31].
2.  Importieren Sie die bereitgestellten Aufgabenplanungsdateien (falls vorhanden). Die Dateien könnten im Verzeichnis `config/` oder einem anderen geeigneten Ordner liegen.
3.  Stellen Sie sicher, dass die Pfade und Einstellungen in den Aufgaben richtig konfiguriert sind.

## 6. Zugriff auf die Anwendung

Öffnen Sie einen Webbrowser und navigieren Sie zur URL der Anwendung, um auf das Modul "Allgemeine Verwaltung" zuzugreifen. Zum Beispiel:
