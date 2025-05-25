const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const DATA_PATH = path.join(__dirname, 'data', 'data.json');

app.use(express.json());

// Helper to read data
function readData() {
  const jsonData = fs.readFileSync(DATA_PATH);
  return JSON.parse(jsonData);
}

// Helper to write data
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// GET all mietstationen
app.get('/api/mietstationen', (req, res) => {
  const data = readData();
  res.json(data.mietstationen);
});

// POST new mietstation
app.post('/api/mietstationen', (req, res) => {
  const data = readData();
  const newStation = req.body;
  newStation.id = Date.now(); // unique ID
  data.mietstationen.push(newStation);
  writeData(data);
  res.status(201).json(newStation);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('🚗 Autovermietung Backend läuft!');
});