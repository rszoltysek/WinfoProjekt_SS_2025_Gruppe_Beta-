const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); // Hauptverzeichnis
app.use('/autos', express.static(path.join(__dirname, 'autos')));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const PORT = process.env.PORT || 3000;

// ────────────── Root ──────────────
app.get('/', (req, res) => {
  res.send('🚗 Autovermietung Backend (Supabase) läuft!');
});

// ────────────── Mietstationen ──────────────
app.get('/api/mietstationen', async (req, res) => {
  const { data, error } = await supabase.from('station').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/mietstationen', async (req, res) => {
  const { data, error } = await supabase.from('station').insert([req.body]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});
app.put('/api/mietstationen/:id', async (req, res) => {
  const { data, error } = await supabase.from('station').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});
app.delete('/api/mietstationen/:id', async (req, res) => {
  // Prüfe, ob es noch Fahrzeuge gibt
  const { data: fahrzeuge } = await supabase.from('fahrzeuge').select('id').eq('stationid', req.params.id);
  if (fahrzeuge && fahrzeuge.length > 0) {
    return res.status(400).json({ message: 'Station enthält noch Fahrzeuge' });
  }
  const { error } = await supabase.from('station').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

// ────────────── Fahrzeuge ──────────────
app.get('/api/fahrzeuge', async (req, res) => {
  const { data, error } = await supabase.from('fahrzeuge').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/fahrzeuge', async (req, res) => {
  const { data: stationen } = await supabase.from('station').select('id, kapazitaet').eq('id', req.body.stationid);
  if (!stationen || stationen.length === 0) return res.status(400).json({ message: 'Station nicht gefunden' });
  const { data: fahrzeuge } = await supabase.from('fahrzeuge').select('id').eq('stationid', req.body.stationid);
  if (fahrzeuge.length >= stationen[0].kapazitaet) {
    return res.status(400).json({ message: 'Kapazität dieser Station erreicht!' });
  }
  const { data, error } = await supabase.from('fahrzeuge').insert([req.body]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});
app.put('/api/fahrzeuge/:id', async (req, res) => {
  const { data, error } = await supabase.from('fahrzeuge').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});
app.delete('/api/fahrzeuge/:id', async (req, res) => {
  const { error } = await supabase.from('fahrzeuge').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

// ────────────── Überführungen ──────────────
app.get('/api/ueberfuehrungen', async (req, res) => {
  const { data, error } = await supabase.from('ueberfuehrungen').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/fahrzeuge/:id/ueberfuehrung', async (req, res) => {
  try {
    const fahrzeug_id = parseInt(req.params.id, 10);
    const zielId = parseInt(req.body.nach_stationid, 10);
    const kommentar = req.body.kommentar || '';
    const vonId = parseInt(req.body.von_stationid, 10);

    // Kapazitätsprüfung Zielstation
    const { data: stationen, error: stationError } = await supabase.from('station').select('kapazitaet').eq('id', zielId);
    if (stationError) throw stationError;
    const { data: fahrzeuge, error: fahrzeugeError } = await supabase.from('fahrzeuge').select('id').eq('stationid', zielId);
    if (fahrzeugeError) throw fahrzeugeError;
    if (!stationen || stationen.length === 0) {
      return res.status(400).json({ message: 'Zielstation nicht gefunden' });
    }
    if (fahrzeuge.length >= stationen[0].kapazitaet) {
      return res.status(400).json({ message: 'Kapazität der Zielstation erreicht!' });
    }

    // Fahrzeug umziehen
    const { error: updateError } = await supabase.from('fahrzeuge').update({ stationid: zielId }).eq('id', fahrzeug_id);
    if (updateError) throw updateError;

    // Überführung eintragen
    const { data, error } = await supabase.from('ueberfuehrungen').insert([{
      fahrzeug_id: fahrzeug_id,
      von_stationid: vonId,
      nach_stationid: zielId,
      datum: new Date().toISOString(),
      kommentar: kommentar
    }]).select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Fahrzeug erfolgreich überführt!', ueberfuehrung: data[0] });
  } catch (err) {
    console.error('Überführung Fehler:', err);
    res.status(400).json({ error: err.message || err.toString() });
  }
});

// ────────────── Personal ──────────────
app.get('/api/personal', async (req, res) => {
  let query = supabase.from('personal').select('*');
  if (req.query.name) query = query.ilike('name', `%${req.query.name}%`);
  if (req.query.rolle) query = query.eq('rolle', req.query.rolle);
  if (req.query.stationid) query = query.eq('stationid', req.query.stationid);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/personal', async (req, res) => {
  const { data, error } = await supabase.from('personal').insert([req.body]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});
app.put('/api/personal/:id', async (req, res) => {
  const { data, error } = await supabase.from('personal').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});
app.delete('/api/personal/:id', async (req, res) => {
  const { error } = await supabase.from('personal').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

// ────────────── Kosten ──────────────
app.get('/api/kosten', async (req, res) => {
  const { data, error } = await supabase.from('kosten').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ────────────── Personaleinsaetze ──────────────
app.get('/api/personaleinsaetze', async (req, res) => {
  const { data, error } = await supabase.from('personaleinsaetze').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/personaleinsaetze', async (req, res) => {
  const { data, error } = await supabase.from('personaleinsaetze').insert([req.body]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});
app.put('/api/personaleinsaetze/:id', async (req, res) => {
  const { data, error } = await supabase.from('personaleinsaetze').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});
app.delete('/api/personaleinsaetze/:id', async (req, res) => {
  const { error } = await supabase.from('personaleinsaetze').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

// ────────────── Abwesenheiten ──────────────
app.get('/api/abwesenheiten', async (req, res) => {
  const { data, error } = await supabase.from('abwesenheiten').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/abwesenheiten', async (req, res) => {
  const { data, error } = await supabase.from('abwesenheiten').insert([req.body]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});
app.put('/api/abwesenheiten/:id', async (req, res) => {
  const { data, error } = await supabase.from('abwesenheiten').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});
app.delete('/api/abwesenheiten/:id', async (req, res) => {
  const { error } = await supabase.from('abwesenheiten').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

// ────────────── Saisonalität ──────────────
app.get('/api/saisonalitaet', async (req, res) => {
  const { data, error } = await supabase.from('saisonalitaet').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ────────────── Ereignisse ──────────────
app.get('/api/ereignisse', async (req, res) => {
  const { data, error } = await supabase.from('ereignisse').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ────────────── Personalbedarf ──────────────
app.get('/api/personalbedarf', async (req, res) => {
  const { data, error } = await supabase.from('personalbedarf').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
