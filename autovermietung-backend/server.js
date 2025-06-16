const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// JSON-Dateipfade
const DATA_PATH = path.join(__dirname, 'data', 'data.json'); // Für Mietstationen
const VEHICLE_PATH = path.join(__dirname, 'data', 'fahrzeuge.json'); // Für Fahrzeuge
const VEHICLE_TYPES_PATH = path.join(__dirname, 'data', 'fahrzeugtypen.json'); // Für Fahrzeugtypen
const UEberfuehrungen_PATH = path.join(__dirname, 'data', 'ueberfueberungen.json'); // Für Überführungen
const VERMIETUNGEN_PATH = path.join(__dirname, 'vermietungen.json'); // NEU: Pfad zu vermietungen.json
const KOSTEN_PATH = path.join(__dirname, 'kosten.json'); // NEU: Pfad zu kosten.json

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static('autos'));
app.use('/autos', express.static(path.join(__dirname, 'autos')));

// Hilfsfunktionen
function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); //
}
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); //
}
function readVehicles() {
  return JSON.parse(fs.readFileSync(VEHICLE_PATH, 'utf8')); //
}
function writeVehicles(data) {
  fs.writeFileSync(VEHICLE_PATH, JSON.stringify(data, null, 2)); //
}
function readVehicleTypes() {
  return JSON.parse(fs.readFileSync(VEHICLE_TYPES_PATH, 'utf8')); //
}
function readUeberfuehrungen() {
  if (!fs.existsSync(UEberfuehrungen_PATH)) {
    fs.writeFileSync(UEberfuehrungen_PATH, JSON.stringify({ ueberfuehrungen: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(UEberfuehrungen_PATH, 'utf8'));
}
function writeUeberfuehrungen(data) {
  fs.writeFileSync(UEberfuehrungen_PATH, JSON.stringify(data, null, 2));
}

// NEUE Hilfsfunktionen für Kosten und Vermietungen
function readVermietungen() {
  // Überprüfen, ob die Datei existiert, sonst leeres Array zurückgeben
  if (!fs.existsSync(VERMIETUNGEN_PATH)) {
    console.warn(`WARNUNG: ${VERMIETUNGEN_PATH} nicht gefunden. Erstelle leeres Array.`);
    return [];
  }
  return JSON.parse(fs.readFileSync(VERMIETUNGEN_PATH, 'utf8'));
}

function readKosten() {
  // Überprüfen, ob die Datei existiert, sonst leeres Array zurückgeben
  if (!fs.existsSync(KOSTEN_PATH)) {
    console.warn(`WARNUNG: ${KOSTEN_PATH} nicht gefunden. Erstelle leeres Array.`);
    return [];
  }
  return JSON.parse(fs.readFileSync(KOSTEN_PATH, 'utf8'));
}


// ────────────── Mietstationen ──────────────
app.get('/api/mietstationen', (req, res) => {
  try {
    res.json(readData().mietstationen);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fehler beim Laden der Mietstationen" });
  }
});

app.post('/api/mietstationen', (req, res) => {
  try {
    const data = readData();
    const newStation = { id: Date.now(), ...req.body };
    data.mietstationen.push(newStation);
    writeData(data);
    res.status(201).json(newStation);
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Speichern der Mietstation" });
  }
});

app.put('/api/mietstationen/:id', (req, res) => {
  try {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.mietstationen.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ message: 'Nicht gefunden' });
    data.mietstationen[index] = { id, ...req.body };
    writeData(data);
    res.json(data.mietstationen[index]);
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Bearbeiten der Mietstation" });
  }
});

app.delete('/api/mietstationen/:id', (req, res) => {
  try {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.mietstationen.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ message: 'Nicht gefunden' });

    const fahrzeuge = readVehicles().fahrzeuge;
    if (fahrzeuge.some(v => v.stationId === id)) {
      return res.status(400).json({ message: 'Station enthält noch Fahrzeuge' });
    }

    data.mietstationen.splice(index, 1);
    writeData(data);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Löschen der Mietstation" });
  }
});

// ────────────── Fahrzeugtypen ──────────────
app.get('/api/fahrzeugtypen', (req, res) => {
  try {
    const data = readVehicleTypes();
    if (!data.typen || !Array.isArray(data.typen)) {
      return res.status(500).json({ message: '🚫 Datei enthält keine gültigen Fahrzeugtypen.' });
    }
    res.json(data.typen);
  } catch (err) {
    console.error('Fehler beim Lesen von fahrzeugtypen.json:', err.message);
    res.status(500).json({ message: '❌ Fahrzeugtypen konnten nicht geladen werden.' });
  }
});

// ────────────── Fahrzeuge (Alle Fahrzeuge für Historie und andere Zwecke) ──────────────
app.get('/api/fahrzeuge', (req, res) => {
  try {
    const data = readVehicles();
    if (!data.fahrzeuge || !Array.isArray(data.fahrzeuge)) {
      return res.json([]);
    }
    res.json(data.fahrzeuge);
  } catch (err) {
    console.error('Fehler bei /api/fahrzeuge:', err);
    res.status(500).json({ error: 'Serverfehler beim Laden der Fahrzeuge' });
  }
});

// ────────────── Fahrzeuge für Mietstation ──────────────
app.get('/api/stationen/:id/fahrzeuge', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = readVehicles();
    if (!data.fahrzeuge || !Array.isArray(data.fahrzeuge)) {
      return res.json([]);
    }
    const vehicles = data.fahrzeuge.filter(v => v.stationId === id);
    res.json(vehicles);
  } catch (err) {
    console.error('Fehler bei /api/stationen/:id/fahrzeuge:', err);
    res.status(500).json({ error: 'Serverfehler beim Laden der Fahrzeuge' });
  }
});

app.post('/api/fahrzeuge', (req, res) => {
  try {
    const data = readVehicles();
    const allStations = readData().mietstationen;
    const { stationId } = req.body;

    // Kapazitätsprüfung
    const station = allStations.find(s => s.id === stationId);
    if (!station) return res.status(400).json({ message: 'Station nicht gefunden' });
    const anzahlFahrzeuge = data.fahrzeuge.filter(f => f.stationId === stationId).length;
    if (anzahlFahrzeuge >= station.kapazitaet) {
      return res.status(400).json({ message: 'Kapazität dieser Station erreicht!' });
    }

    const newVehicle = { id: Date.now(), ...req.body };
    data.fahrzeuge.push(newVehicle);
    writeVehicles(data);
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Hinzufügen des Fahrzeugs" });
  }
});

app.put('/api/fahrzeuge/:id', (req, res) => {
  try {
    const data = readVehicles();
    const id = parseInt(req.params.id);
    const index = data.fahrzeuge.findIndex(v => v.id === id);
    if (index === -1) return res.status(404).json({ message: 'Nicht gefunden' });
    data.fahrzeuge[index] = { id, ...req.body };
    writeVehicles(data);
    res.json(data.fahrzeuge[index]);
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Bearbeiten des Fahrzeugs" });
  }
});

app.delete('/api/fahrzeuge/:id', (req, res) => {
  try {
    const data = readVehicles();
    const id = parseInt(req.params.id);
    const index = data.fahrzeuge.findIndex(v => v.id === id);
    if (index === -1) return res.status(404).json({ message: 'Nicht gefunden' });
    data.fahrzeuge.splice(index, 1);
    writeVehicles(data);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Löschen des Fahrzeugs" });
  }
});

// ────────────── NEU: Fahrzeugüberführung ──────────────
app.post('/api/fahrzeuge/:id/ueberfuehrung', (req, res) => {
  try {
    const fahrzeugId = parseInt(req.params.id);
    const { zielStationId, kommentar } = req.body;
    const zielId = parseInt(zielStationId);

    // Daten laden
    const fahrzeugData = readVehicles();
    const stationsData = readData();
    const ueberfuehrungData = readUeberfuehrungen();

    // Existenzprüfungen
    const fahrzeugIndex = fahrzeugData.fahrzeuge.findIndex(f => f.id === fahrzeugId);
    if (fahrzeugIndex === -1) {
      return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
    }
    const fahrzeug = fahrzeugData.fahrzeuge[fahrzeugIndex];

    const zielStation = stationsData.mietstationen.find(s => s.id === zielId);
    if (!zielStation) {
      return res.status(400).json({ message: 'Zielstation nicht gefunden' });
    }

    // Kapazitätsprüfung
    const anzahlFahrzeugeZiel = fahrzeugData.fahrzeuge.filter(f => f.stationId === zielId).length;
    if (anzahlFahrzeugeZiel >= zielStation.kapazitaet) {
      return res.status(400).json({ message: 'Kapazität der Zielstation erreicht!' });
    }

    // Überführung durchführen
    const alteStationId = fahrzeug.stationId;
    fahrzeugData.fahrzeuge[fahrzeugIndex].stationId = zielId;
    writeVehicles(fahrzeugData);

    // Überführungshistorie speichern
    const ueberfuehrung = {
      id: Date.now(),
      fahrzeugId,
      vonStationId: alteStationId,
      nachStationId: zielId,
      datum: new Date().toISOString(),
      kommentar: kommentar || ""
    };
    ueberfuehrungData.ueberfueferungen.push(ueberfuehrung);
    writeUeberfuehrungen(ueberfuehrungData);

    res.json({ message: 'Fahrzeug erfolgreich überführt!', ueberfuehrung });
  } catch (err) {
    res.status(500).json({ message: "Fehler bei der Fahrzeugüberführung" });
  }
});

// ────────────── Überführungshistorie ──────────────
app.get('/api/ueberfuehrungen', (req, res) => {
  try {
    const ueberfuehrungData = readUeberfuehrungen();
    res.json(ueberfuehrungData.ueberfuehrungen);
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Laden der Überführungshistorie" });
  }
});

// ────────────── NEU: Vermietungen ──────────────
app.get('/api/vermietungen', (req, res) => {
  try {
    res.json(readVermietungen());
  } catch (err) {
    console.error('Fehler bei /api/vermietungen:', err);
    res.status(500).json({ error: 'Serverfehler beim Laden der Vermietungen' });
  }
});

// ────────────── NEU: Kosten ──────────────
app.get('/api/kosten', (req, res) => {
  try {
    res.json(readKosten());
  } catch (err) {
    console.error('Fehler bei /api/kosten:', err);
    res.status(500).json({ error: 'Serverfehler beim Laden der Kosten' });
  }
});


// ────────────── Root ──────────────
app.get('/', (req, res) => {
  res.send('🚗 Autovermietung Backend läuft!');
});

// Serverstart
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});