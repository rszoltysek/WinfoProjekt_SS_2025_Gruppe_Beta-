/* =========================================================
   Mietstationen – Verwaltungs‑Frontend (überarbeitet)
   Fokus: ladeStationenUebersicht URL korrigiert, DOMContentLoaded-Init
   Stand: aktuell
   ========================================================= */

// ---------------- DOM-Referenzen ----------------
const form = document.getElementById('mietstationForm');
const stationList = document.getElementById('stationList');
const cancelButton = document.getElementById('cancelEdit');

// ---------------- Utility: Basis-URL ----------------
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api';

// ---------------- Edit abbrechen ----------------
cancelButton.onclick = () => {
  form.reset();
  cancelButton.style.display = 'none';
};

// ---------------- Mietstation speichern -------------
form.addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('name').value,
    adresse: document.getElementById('address').value,
    telefon: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    kapazitaet: parseInt(document.getElementById('capacity').value, 10),
    aufbereitung: document.getElementById('aufbereitung').value,
    schadensregulierung: document.getElementById('schadensregulierung').value === 'Ja',
    lage: document.getElementById('lage').value
  };

  try {
    const res = await fetch(`${API_BASE}/mietstationen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Fehler beim Speichern');
    alert('✅ Mietstation gespeichert!');
    form.reset();
    loadStations();
  } catch (err) {
    alert('❌ ' + err.message);
  }
});

// ---------------- Stationen laden + Accordion --------
async function loadStations() {
  try {
    const res = await fetch(`${API_BASE}/mietstationen`);
    const stationen = await res.json();
    stationList.innerHTML = '';
    stationen.forEach(s => {
      const div = document.createElement('div');
      div.className = 'station-card';
      div.innerHTML = `
        <div class="station-summary" onclick="toggleAccordion(this)">
          <strong>${s.name}</strong> – Kapazität: ${s.kapazitaet}
          <span class="chevron">▼</span>
        </div>
        <div class="station-details">
          ${s.adresse}<br/>Telefon: ${s.telefon}<br/>E-Mail: ${s.email}
        </div>`;
      stationList.appendChild(div);
    });
  } catch (err) {
    console.error('LadeStations-Fehler:', err);
  }
}

function toggleAccordion(el) {
  const card = el.closest('.station-card');
  card.classList.toggle('open');
}

// ---------------- Übersicht laden ------------------
async function ladeStationenUebersicht() {
  try {
    const res = await fetch(`${API_BASE}/mietstationen`);
    const daten = await res.json();
    const tbody = document.querySelector('#stationTable tbody');
    const heute = new Date().toLocaleDateString('de-DE', { weekday: 'long' });
    tbody.innerHTML = daten.map(s => {
      // Öffnungszeiten heute
      let oeffnung = '-';
      if (Array.isArray(s.oeffnungszeiten)) {
        const ot = s.oeffnungszeiten.find(o => o.wochentag === heute);
        oeffnung = ot && ot.von && ot.bis ? `${ot.von}–${ot.bis}` : 'geschlossen';
      }
      const mapsLink = s.koordinaten ?
        `<a href="https://www.google.com/maps?q=${s.koordinaten.lat},${s.koordinaten.lng}" target="_blank">Karte öffnen</a>`
        : '-';
      return `
        <tr>
          <td>${s.name}</td>
          <td>${s.adresse}</td>
          <td>${s.stadt || '-'}</td>
          <td>${s.kapazitaet}</td>
          <td>${oeffnung}</td>
          <td>${mapsLink}</td>
        </tr>`;
    }).join('');
  } catch (err) {
    console.error('Übersicht-Fehler:', err);
  }
}

// ---------------- DOM-Init -------------------------
document.addEventListener('DOMContentLoaded', () => {
  ladeStationenUebersicht(); // sofort Übersicht befüllen
});
