const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Pfad zur Datenbank-Datei
const DATA_PATH = path.join(__dirname, 'data', 'data.json');

app.use(cors());
app.use(express.json());

// Helfer: Daten lesen (mit Fallback bei leerer Datei)
function readData() {
  try {
    const jsonData = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(jsonData);
  } catch (err) {
    return { mietstationen: [] };
  }
}

// Helfer: Daten schreiben
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// GET: Alle Mietstationen abrufen
app.get('/api/mietstationen', (req, res) => {
  const data = readData();
  res.json(data.mietstationen);
});

// POST: Neue Mietstation erstellen
app.post('/api/mietstationen', (req, res) => {
  const data = readData();
  const newStation = req.body;
  newStation.id = Date.now(); // Einzigartige ID generieren
  data.mietstationen.push(newStation);
  writeData(data);
  res.status(201).json(newStation);
});

// PUT: Bestehende Mietstation bearbeiten
app.put('/api/mietstationen/:id', (req, res) => {
  const data = readData();
  const stationId = parseInt(req.params.id);
  const index = data.mietstationen.findIndex(s => s.id === stationId);

  if (index === -1) {
    return res.status(404).json({ message: 'Nicht gefunden' });
  }

  const updatedStation = {
    ...req.body,
    id: stationId // ID bleibt gleich
  };

  data.mietstationen[index] = updatedStation;
  writeData(data);
  res.json(updatedStation);
});

// DELETE: Mietstation löschen
app.delete('/api/mietstationen/:id', (req, res) => {
  const data = readData();
  const stationId = parseInt(req.params.id);
  const index = data.mietstationen.findIndex(s => s.id === stationId);

  if (index === -1) {
    return res.status(404).json({ message: 'Nicht gefunden' });
  }

  data.mietstationen.splice(index, 1);
  writeData(data);
  res.status(204).end();
});

// Standardroute
app.get('/', (req, res) => {
  res.send('🚗 Autovermietung Backend läuft!');
});

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
