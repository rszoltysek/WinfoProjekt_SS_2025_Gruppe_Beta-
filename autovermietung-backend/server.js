const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('SUPABASE_URL und SUPABASE_KEY müssen in der .env gesetzt sein!');
}

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));
app.use('/autos', express.static(path.join(__dirname, 'autos')));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const PORT = process.env.PORT || 3000;

// ────────────── Root ──────────────
app.get('/', (req, res) => {
  res.send('🚗 Autovermietung Backend (Supabase) läuft!');
});

// ────────────── Mietstationen ──────────────
app.get('/api/mietstationen', async (req, res) => {
  try {
    const { data, error } = await supabase.from('station').select('*');
    if (error) {
      console.error('[GET /api/mietstationen] Fehler:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error('[GET /api/mietstationen] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mietstationen', async (req, res) => {
  try {
    const { data, error } = await supabase.from('station').insert([req.body]).select();
    if (error) {
      console.error('[POST /api/mietstationen] Fehler:', error.message);
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('[POST /api/mietstationen] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/mietstationen/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('station').update(req.body).eq('id', req.params.id).select();
    if (error) {
      console.error('[PUT /api/mietstationen/:id] Fehler:', error.message);
      return res.status(400).json({ error: error.message });
    }
    res.json(data[0]);
  } catch (err) {
    console.error('[PUT /api/mietstationen/:id] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/mietstationen/:id', async (req, res) => {
  try {
    // Prüfe, ob es noch Fahrzeuge gibt
    const { data: fahrzeuge } = await supabase.from('fahrzeuge').select('id').eq('stationid', req.params.id);
    if (fahrzeuge && fahrzeuge.length > 0) {
      return res.status(400).json({ message: 'Station enthält noch Fahrzeuge' });
    }
    const { error } = await supabase.from('station').delete().eq('id', req.params.id);
    if (error) {
      console.error('[DELETE /api/mietstationen/:id] Fehler:', error.message);
      return res.status(400).json({ error: error.message });
    }
    res.status(204).end();
  } catch (err) {
    console.error('[DELETE /api/mietstationen/:id] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== Fahrzeuge (verbessert & robust) ====================
app.get('/api/fahrzeuge', async (req, res) => {
  try {
    const { data, error } = await supabase.from('fahrzeuge').select('*');
    if (error) {
      console.error('[GET /api/fahrzeuge] Fehler:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error('[GET /api/fahrzeuge] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fahrzeuge', async (req, res) => {
  try {
    console.log('[POST /api/fahrzeuge] Insert-Payload:', req.body);

    // ==== 1. Pflichtfeld-Validierung ====
    const pflichtfelder = ['stationid', 'marke', 'typ', 'kraftstoff', 'bild', 'kilometer', 'preisprotag', 'verfuegbar'];
    for (const feld of pflichtfelder) {
      if (typeof req.body[feld] === 'undefined' || req.body[feld] === null || req.body[feld] === '') {
        return res.status(400).json({ error: `Pflichtfeld fehlt oder leer: ${feld}` });
      }
    }

    // ==== 2. Typprüfung (robust!) ====
    if (
      isNaN(Number(req.body.stationid)) ||
      typeof req.body.marke !== 'string' ||
      typeof req.body.typ !== 'string' ||
      typeof req.body.kraftstoff !== 'string' ||
      typeof req.body.bild !== 'string' ||
      isNaN(Number(req.body.kilometer)) ||
      isNaN(Number(req.body.preisprotag)) ||
      typeof req.body.verfuegbar !== 'boolean'
    ) {
      return res.status(400).json({ error: 'Ungültige Datentypen im Payload.' });
    }

    // ==== 2a. Zusatz: Ist Fahrzeugtyp gültig? ====
    // Stelle sicher, dass NUR existierende Fahrzeugtypen benutzt werden!
    const { data: typCheck, error: typCheckError } = await supabase
      .from('fahrzeugtypen')
      .select('id')
      .eq('marke', req.body.marke)
      .eq('typ', req.body.typ)
      .eq('kraftstoff', req.body.kraftstoff)
      .eq('bild', req.body.bild);

    if (typCheckError) {
      console.error('[POST /api/fahrzeuge] Typ-Check Fehler:', typCheckError.message);
      return res.status(500).json({ error: typCheckError.message });
    }
    if (!typCheck || typCheck.length === 0) {
      return res.status(400).json({ error: 'Der Fahrzeugtyp existiert nicht!' });
    }

    // ==== 3. Station prüfen ====
    const stationId = req.body.stationid;
    const { data: stationen, error: stationError } = await supabase
      .from('station')
      .select('id, kapazitaet')
      .eq('id', stationId);

    if (stationError) {
      console.error('[POST /api/fahrzeuge] Station-Fehler:', stationError.message);
      return res.status(500).json({ error: stationError.message });
    }
    if (!stationen || stationen.length === 0) {
      console.warn('[POST /api/fahrzeuge] Station nicht gefunden:', stationId);
      return res.status(404).json({ message: 'Station nicht gefunden' });
    }

    // ==== 4. Kapazität prüfen ====
    const { data: fahrzeuge } = await supabase
      .from('fahrzeuge')
      .select('id')
      .eq('stationid', stationId);

    if (fahrzeuge.length >= stationen[0].kapazitaet) {
      console.warn('[POST /api/fahrzeuge] Kapazität voll:', stationId);
      return res.status(409).json({ message: 'Kapazität dieser Station erreicht!' });
    }

    // ==== 5. Insert durchführen ====
    const insertPayload = {
      stationid: Number(stationId),
      marke: req.body.marke,
      typ: req.body.typ,
      kraftstoff: req.body.kraftstoff,
      bild: req.body.bild,
      kilometer: Number(req.body.kilometer),
      preisprotag: Number(req.body.preisprotag),
      verfuegbar: req.body.verfuegbar
    };

    const { data, error } = await supabase
      .from('fahrzeuge')
      .insert([insertPayload])
      .select();

    if (error) {
      console.error('[POST /api/fahrzeuge] Insert-Fehler:', error.message);
      return res.status(400).json({ error: error.message });
    }
    console.log('[POST /api/fahrzeuge] Insert erfolgreich:', data[0]);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('[POST /api/fahrzeuge] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/fahrzeuge/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('fahrzeuge').update(req.body).eq('id', req.params.id).select();
    if (error) {
      console.error('[PUT /api/fahrzeuge/:id] Fehler:', error.message);
      return res.status(400).json({ error: error.message });
    }
    res.json(data[0]);
  } catch (err) {
    console.error('[PUT /api/fahrzeuge/:id] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fahrzeuge/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('fahrzeuge').delete().eq('id', req.params.id);
    if (error) {
      console.error('[DELETE /api/fahrzeuge/:id] Fehler:', error.message);
      return res.status(400).json({ error: error.message });
    }
    res.status(204).end();
  } catch (err) {
    console.error('[DELETE /api/fahrzeuge/:id] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────────────── Fahrzeugtypen ──────────────
app.get('/api/fahrzeugtypen', async (req, res) => {
  try {
    const { data, error } = await supabase.from('fahrzeugtypen').select('*').order('marke', { ascending: true });
    if (error) {
      console.error('[GET /api/fahrzeugtypen] Fehler:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error('[GET /api/fahrzeugtypen] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
});

// ────────────── Überführungen ──────────────
app.get('/api/ueberfuehrungen', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ueberfuehrungen')
      .select(`
        id,
        fahrzeug_id,
        fahrzeuge:fahrzeug_id (
          id, marke, typ, kennzeichen
        ),
        von_stationid,
        von:von_stationid (id, name),
        nach_stationid,
        nach:nach_stationid (id, name),
        datum,
        kommentar
      `)
      .order('datum', { ascending: false })
      .order('id', { ascending: false });
    if (error) {
      console.error('[GET /api/ueberfuehrungen] Fehler:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const mapped = data.map(row => ({
      id: row.id,
      fahrzeug_id: row.fahrzeug_id,
      fahrzeug_name: row.fahrzeuge ? `${row.fahrzeuge.marke} ${row.fahrzeuge.typ}${row.fahrzeuge.kennzeichen ? ' (' + row.fahrzeuge.kennzeichen + ')' : ''}` : '-',
      von_stationid: row.von_stationid,
      von_station_name: row.von ? row.von.name : '-',
      nach_stationid: row.nach_stationid,
      nach_station_name: row.nach ? row.nach.name : '-',
      datum: row.datum,
      kommentar: row.kommentar
    }));
    res.json(mapped);
  } catch (err) {
    console.error('[GET /api/ueberfuehrungen] Unerwarteter Fehler:', err);
    res.status(500).json({ error: err.message });
  }
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

// (Ab hier bleibt dein bestehender Code gleich)
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
app.get('/api/kosten', async (req, res) => {
  const { data, error } = await supabase.from('kosten').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
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
app.get('/api/saisonalitaet', async (req, res) => {
  const { data, error } = await supabase.from('saisonalitaet').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.get('/api/ereignisse', async (req, res) => {
  const { data, error } = await supabase.from('ereignisse').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.get('/api/personalbedarf', async (req, res) => {
  const { data, error } = await supabase.from('personalbedarf').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
