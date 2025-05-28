const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// JSON-Dateipfade
const DATA_PATH = path.join(__dirname, 'data', 'data.json');
const VEHICLE_PATH = path.join(__dirname, 'data', 'fahrzeuge.json');
const VEHICLE_TYPES_PATH = path.join(__dirname, 'data', 'fahrzeugtypen.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // für /images usw.
app.use('/autos', express.static(path.join(__dirname, 'autos'))); // für Fahrzeugbilder

// Hilfsfunktionen
function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function readVehicles() {
  return JSON.parse(fs.readFileSync(VEHICLE_PATH, 'utf8'));
}

function writeVehicles(data) {
  fs.writeFileSync(VEHICLE_PATH, JSON.stringify(data, null, 2));
}

function readVehicleTypes() {
  return JSON.parse(fs.readFileSync(VEHICLE_TYPES_PATH, 'utf8'));
}

// ────────────── Mietstationen ──────────────
app.get('/api/mietstationen', (req, res) => {
  res.json(readData().mietstationen);
});

app.post('/api/mietstationen', (req, res) => {
  const data = readData();
  const newStation = { id: Date.now(), ...req.body };
  data.mietstationen.push(newStation);
  writeData(data);
  res.status(201).json(newStation);
});

app.put('/api/mietstationen/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const index = data.mietstationen.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ message: 'Nicht gefunden' });
  data.mietstationen[index] = { id, ...req.body };
  writeData(data);
  res.json(data.mietstationen[index]);
});

app.delete('/api/mietstationen/:id', (req, res) => {
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

// ────────────── Fahrzeuge ──────────────
app.get('/api/stationen/:id/fahrzeuge', (req, res) => {
  const id = parseInt(req.params.id);
  const data = readVehicles();
  res.json(data.fahrzeuge.filter(v => v.stationId === id));
});

app.post('/api/fahrzeuge', (req, res) => {
  const data = readVehicles();
  const newVehicle = { id: Date.now(), ...req.body };
  data.fahrzeuge.push(newVehicle);
  writeVehicles(data);
  res.status(201).json(newVehicle);
});

app.put('/api/fahrzeuge/:id', (req, res) => {
  const data = readVehicles();
  const id = parseInt(req.params.id);
  const index = data.fahrzeuge.findIndex(v => v.id === id);
  if (index === -1) return res.status(404).json({ message: 'Nicht gefunden' });
  data.fahrzeuge[index] = { id, ...req.body };
  writeVehicles(data);
  res.json(data.fahrzeuge[index]);
});

app.delete('/api/fahrzeuge/:id', (req, res) => {
  const data = readVehicles();
  const id = parseInt(req.params.id);
  const index = data.fahrzeuge.findIndex(v => v.id === id);
  if (index === -1) return res.status(404).json({ message: 'Nicht gefunden' });
  data.fahrzeuge.splice(index, 1);
  writeVehicles(data);
  res.status(204).end();
});

// ────────────── Root ──────────────
app.get('/', (req, res) => {
  res.send('🚗 Autovermietung Backend läuft!');
});

// Serverstart
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
