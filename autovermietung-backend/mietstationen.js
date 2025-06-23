let editingId = null;
const form = document.getElementById('mietstationForm');
const stationList = document.getElementById('stationList');
const cancelButton = document.getElementById('cancelEdit');

cancelButton.onclick = () => {
  editingId = null;
  form.reset();
  cancelButton.style.display = 'none';
};

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const newStation = {
    name: document.getElementById('name').value,
    adresse: document.getElementById('address').value,
    telefon: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    kapazitaet: parseInt(document.getElementById('capacity').value),
    aufbereitung: document.getElementById('aufbereitung').value,
    schadensregulierung: document.getElementById('schadensregulierung').value === 'Ja',
    lage: document.getElementById('lage').value
  };

  const url = editingId
    ? `http://localhost:3000/api/mietstationen/${editingId}`
    : 'http://localhost:3000/api/mietstationen';
  const method = editingId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStation)
    });

    if (!res.ok) throw new Error(editingId ? 'Fehler beim Bearbeiten' : 'Fehler beim Speichern');
    alert(`✅ Mietstation ${editingId ? 'bearbeitet' : 'gespeichert'}!`);
    editingId = null;
    cancelButton.style.display = 'none';
    form.reset();
    loadStations();
  } catch (err) {
    alert('❌ ' + err.message);
  }
});

let editingStationId = null;
function editStation(id) {
  fetch('http://localhost:3000/api/mietstationen')
    .then(res => res.json())
    .then(stationen => {
      const station = stationen.find(s => s.id === parseInt(id));
      if (!station) return alert('❌ Station nicht gefunden');
      editingStationId = station.id;
      document.getElementById('edit-name').value = station.name;
      document.getElementById('edit-address').value = station.adresse;
      document.getElementById('edit-phone').value = station.telefon;
      document.getElementById('edit-email').value = station.email;
      document.getElementById('edit-capacity').value = station.kapazitaet;
      document.getElementById('edit-aufbereitung').value = station.aufbereitung;
      document.getElementById('edit-schadensregulierung').value = station.schadensregulierung ? 'Ja' : 'Nein';
      document.getElementById('edit-lage').value = station.lage;
      document.getElementById('bearbeitenModal').style.display = "flex";
    });
}

function deleteStation(id) {
  fetch(`http://localhost:3000/api/mietstationen/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('Fehler beim Löschen');
      loadStations();
    })
    .catch(err => alert('❌ ' + err.message));
}

function showVehicleDetails(f) {
  const modal = document.getElementById("fahrzeugModal");
  const content = document.getElementById("modalContent");

  content.innerHTML = `
    <img src="/autos/${f.bild}" alt="${f.marke}" style="width:100%; border-radius:0.5rem; margin-bottom:1rem;" />
    <h3>${f.marke}</h3>
    <p><strong>Typ:</strong> ${f.typ}</p>
    <p><strong>Kraftstoff:</strong> ${f.kraftstoff}</p>
    <p><strong>Kilometerstand:</strong> ${f.kilometer.toLocaleString()} km</p>
    <p><strong>Preis pro Tag:</strong> ${f.preisProTag} €</p>
    <p><strong>Verfügbar:</strong> ${f.verfuegbar ? '✅ Ja' : '❌ Nein'}</p>
  `;
  modal.style.display = 'flex';
}

function closeVehicleModal() {
  document.getElementById("fahrzeugModal").style.display = 'none';
}

// Button Bestehende Mietstationen anzeigen/ausblenden
/*const toggleBtn = document.getElementById('toggleStationenBtn');
const stationenSection = document.getElementById('stationenSection');
toggleBtn.addEventListener('click', () => {
  if (stationenSection.style.display === 'none' || stationenSection.style.display === '') {
    stationenSection.style.display = 'block';
    toggleBtn.textContent = 'Bestehende Mietstationen ausblenden';
  } else {
    stationenSection.style.display = 'none';
    toggleBtn.textContent = 'Bestehende Mietstationen anzeigen';
  }
}); */

// ** NEUE LOADSTATIONS FUNKTION **
function loadStations() {
  fetch('http://localhost:3000/api/mietstationen')
    .then(res => res.json())
    .then(stationen => {
      const promises = stationen.map(station => {
        return fetch(`http://localhost:3000/api/stationen/${station.id}/fahrzeuge`)
          .then(res => res.json())
          .then(fahrzeuge => {
            return { station, fahrzeuge };
          });
      });

      Promise.all(promises).then(results => {
        stationList.innerHTML = '';
        results.forEach(({ station, fahrzeuge }) => {
          const belegte = fahrzeuge.length;
          const max = station.kapazitaet;
          const div = document.createElement('div');
         div.className = 'station-card';
div.innerHTML = `
  <div class="station-summary" onclick="toggleAccordion(this)">
    <strong>${station.name}</strong> – Kapazität: ${belegte} / ${max}
    <span class="chevron">▼</span>
  </div>
  <div class="station-details">
    ${station.adresse}<br/>
    Tel: ${station.telefon}<br/>
    E-Mail: ${station.email}<br/>
    <b>Kapazität: ${belegte} / ${max}</b><br/>
    Aufbereitung: ${station.aufbereitung}<br/>
    Schadensregulierung: ${station.schadensregulierung ? 'Ja' : 'Nein'}<br/>
    Lage: ${station.lage}<br/>
    <button onclick="editStation(${station.id})">✏️ Bearbeiten</button>
    <button onclick="deleteStation(${station.id})">🗑️ Löschen</button>
    <button onclick="toggleVehicleForm(${station.id})">➕ Fahrzeug hinzufügen</button>
    <div id="fahrzeuge-slider-${station.id}" style="margin-top: 1rem;"></div>
    <div id="vehicle-form-${station.id}" style="margin-top:1rem;"></div>
  </div>
`;

          stationList.appendChild(div);

          // Slider für Fahrzeuge:
          const fahrzeugSliderDiv = document.getElementById(`fahrzeuge-slider-${station.id}`);
          window.slideFahrzeuge = function(stationId, dir) {
            const slider = document.getElementById('slider-container-' + stationId);
            if (!slider) return;
            const scrollAmount = 180;
            slider.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
          }

          if (!fahrzeuge.length) {
            fahrzeugSliderDiv.innerHTML = '<p style="color:#999;">Keine Fahrzeuge vorhanden.</p>';
            return;
          }

          let sliderHTML = `
            <div class="fahrzeug-slider-wrap">
              <button onclick="slideFahrzeuge(${station.id}, -1)" style="font-size:1.5rem; padding:0 0.5rem;">&#8592;</button>
              <div class="fahrzeug-slider-container" id="slider-container-${station.id}">
                ${fahrzeuge.map(f => `
                  <div class="fahrzeug-card">
                    <img src="/autos/${f.bild}" alt="${f.marke}" onclick='showVehicleDetails(${JSON.stringify(f)})' />
                    <div class="fahrzeug-name">${f.marke} ${f.typ}</div>
                    ${
                      f.verfuegbar
                        ? `<button onclick="showUeberfuehrungDialog(${f.id}, ${station.id})">Überführen</button>`
                        : `<button disabled style="opacity:0.5; cursor:not-allowed;">Nicht verfügbar</button>`
                    }
                  </div>
                `).join('')}
              </div>
              <button onclick="slideFahrzeuge(${station.id}, 1)" style="font-size:1.5rem; padding:0 0.5rem;">&#8594;</button>
            </div>
          `;

          fahrzeugSliderDiv.innerHTML = `<h4>Fahrzeuge:</h4>${sliderHTML}`;
        });
      });
    });
}

// Fahrzeug hinzufügen UI
async function toggleVehicleForm(stationId) {
  const container = document.getElementById(`vehicle-form-${stationId}`);
  container.innerHTML = '';
  container.style.display = 'block';

  const res = await fetch('http://localhost:3000/api/fahrzeugtypen');
  const typen = await res.json();

  const grid = document.createElement('div');
  grid.style.display = 'flex';
  grid.style.flexWrap = 'wrap';
  grid.style.gap = '1rem';

  let selectedTyp = null;

  typen.forEach(t => {
    const img = document.createElement('img');
    img.src = `/autos/${t.bild}`;
    img.alt = t.bezeichnung;
    img.title = `${t.marke} (${t.typ}) – ${t.kraftstoff}`;
    img.style.width = '100px';
    img.style.borderRadius = '0.5rem';
    img.style.cursor = 'pointer';
    img.onclick = () => {
      selectedTyp = t;
      document.getElementById(`km-${stationId}`).style.display = 'block';
      document.getElementById(`verfuegbar-wrap-${stationId}`).style.display = 'block';
      document.getElementById(`save-${stationId}`).style.display = 'inline-block';
      [...grid.children].forEach(i => i.style.border = 'none');
      img.style.border = '3px solid #facc15';
    };
    grid.appendChild(img);
  });

  const kmField = `<input type="number" id="km-${stationId}" placeholder="Kilometerstand z.B. 42000" style="display:none; width:100%; margin-top:1rem;" />`;
  const checkbox = `<div id="verfuegbar-wrap-${stationId}" style="display:none; margin-top:1rem;"><label><input type="checkbox" id="verfuegbar-${stationId}" checked /> Verfügbar</label></div>`;
  const saveBtn = `<button id="save-${stationId}" onclick="submitVehicleForm(${stationId})" style="display:none; margin-top:1rem;">🚗 Speichern</button>`;

  container.appendChild(grid);
  container.insertAdjacentHTML('beforeend', kmField + checkbox + saveBtn);
}

async function submitVehicleForm(stationId) {
  const km = parseInt(document.getElementById(`km-${stationId}`).value);
  const verfuegbar = document.getElementById(`verfuegbar-${stationId}`).checked;
  const img = document.querySelector(`#vehicle-form-${stationId} img[style*="3px solid"]`);
  if (!img) return alert('❗ Bitte ein Fahrzeug wählen');

  const alt = img.getAttribute('alt');
  const res = await fetch('http://localhost:3000/api/fahrzeugtypen');
  const typen = await res.json();
  const typ = typen.find(t => t.bezeichnung === alt);

  if (!typ || isNaN(km)) {
    return alert('❗ Bitte gültigen Kilometerstand angeben.');
  }

  const newVehicle = {
    stationId,
    marke: typ.marke,
    typ: typ.typ,
    kraftstoff: typ.kraftstoff,
    kilometer: km,
    preisProTag: typ.preisProTag,
    bild: typ.bild,
    verfuegbar
  };

  const save = await fetch('http://localhost:3000/api/fahrzeuge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newVehicle)
  });

  if (!save.ok) return alert('❌ Fahrzeug konnte nicht gespeichert werden.');
  alert('✅ Fahrzeug gespeichert!');
  loadStations();
}

// ==== Überführung ====
let ueberfuehrungFahrzeugId = null;
let ueberfuehrungAktuelleStationId = null;

async function showUeberfuehrungDialog(fahrzeugId, aktuelleStationId) {
  ueberfuehrungFahrzeugId = fahrzeugId;
  ueberfuehrungAktuelleStationId = aktuelleStationId;
  const modal = document.getElementById("ueberfuehrungModal");
  const content = document.getElementById("ueberfuehrungContent");

  const res = await fetch('http://localhost:3000/api/mietstationen');
  const stationen = await res.json();
  const andereStationen = stationen.filter(s => s.id !== aktuelleStationId);

  let options = andereStationen.map(
    s => `<option value="${s.id}">${s.name} (${s.lage})</option>`
  ).join('');
  if (!options) options = '<option disabled>Keine Zielstationen verfügbar</option>';

  content.innerHTML = `
    <h3>Fahrzeug überführen</h3>
    <label>Zielstation:</label>
    <select id="ueberfuehrung-ziel">${options}</select>
    <label>Kommentar (optional):</label>
    <input id="ueberfuehrung-kommentar" placeholder="z.B. wegen hoher Nachfrage" />
    <button style="margin-top:1rem;" onclick="bestaetigeUeberfuehrung()">Überführen</button>
  `;
  modal.style.display = "flex";
}

async function bestaetigeUeberfuehrung() {
  const modal = document.getElementById("ueberfuehrungModal");
  const zielStationId = document.getElementById("ueberfuehrung-ziel").value;
  const kommentar = document.getElementById("ueberfuehrung-kommentar").value;

  if (!zielStationId) {
    alert('Bitte Zielstation auswählen!');
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/fahrzeuge/${ueberfuehrungFahrzeugId}/ueberfuehrung`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zielStationId, kommentar })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Unbekannter Fehler bei Überführung");
    alert('✅ Fahrzeug wurde erfolgreich überführt!');
    modal.style.display = "none";
    loadStations();
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

function closeUeberfuehrungModal() {
  document.getElementById("ueberfuehrungModal").style.display = "none";
}

// Historie-Modal
async function showUeberfuehrungHistorie() {
  const modal = document.getElementById("historieModal");
  const content = document.getElementById("historieContent");
  const statistik = document.getElementById("historieStatistik");
  content.innerHTML = '<em>Lade Überführungen...</em>';
  statistik.innerHTML = '';

  const [ueberfuehrungen, fahrzeuge, stationen] = await Promise.all([
    fetch('http://localhost:3000/api/ueberfuehrungen').then(r => r.json()),
    fetch('http://localhost:3000/data/fahrzeuge.json').then(r => r.json()).then(d => d.fahrzeuge),
    fetch('http://localhost:3000/api/mietstationen').then(r => r.json())
  ]);

  const fahrzeugMap = {};
  fahrzeuge.forEach(f => fahrzeugMap[f.id] = f);

  const stationMap = {};
  stationen.forEach(s => stationMap[s.id] = s);

  ueberfuehrungen.sort((a, b) => new Date(b.datum) - new Date(a.datum));

  let html = `<table style="width:100%;border-collapse:collapse;">
    <tr style="background:#222;">
      <th style="padding:0.5rem;">Datum</th>
      <th style="padding:0.5rem;">Fahrzeug</th>
      <th style="padding:0.5rem;">Von</th>
      <th style="padding:0.5rem;">Nach</th>
      <th style="padding:0.5rem;">Kommentar</th>
    </tr>`;
  ueberfuehrungen.forEach(u => {
    const f = fahrzeugMap[u.fahrzeugId];
    const von = stationMap[u.vonStationId];
    const nach = stationMap[u.nachStationId];
    html += `<tr style="border-bottom:1px solid #333;">
      <td style="padding:0.5rem;">${new Date(u.datum).toLocaleString('de')}</td>
      <td style="padding:0.5rem;">${f ? `${f.marke} ${f.typ}` : u.fahrzeugId}</td>
      <td style="padding:0.5rem;">${von ? von.name : u.vonStationId}</td>
      <td style="padding:0.5rem;">${nach ? nach.name : u.nachStationId}</td>
      <td style="padding:0.5rem;">${u.kommentar || '-'}</td>
    </tr>`;
  });
  html += '</table>';
  content.innerHTML = html;

  const byFahrzeug = {};
  ueberfuehrungen.forEach(u => byFahrzeug[u.fahrzeugId] = (byFahrzeug[u.fahrzeugId] || 0) + 1);
  const topFahrzeuge = Object.entries(byFahrzeug)
    .sort((a, b) => b[1] - a[1]).slice(0, 3);

  const byRoute = {};
  ueberfuehrungen.forEach(u => {
    const key = `${u.vonStationId}->${u.nachStationId}`;
    byRoute[key] = (byRoute[key] || 0) + 1;
  });
  const topRouten = Object.entries(byRoute)
    .sort((a, b) => b[1] - a[1]).slice(0, 3);

  statistik.innerHTML = `
    <h3>Auswertung</h3>
    <ul>
      <li><strong>Top 3 Fahrzeuge nach Überführungen:</strong>
        <ol>${topFahrzeuge.map(([fid, count]) => `<li>${fahrzeugMap[fid] ? fahrzeugMap[fid].marke + ' ' + fahrzeugMap[fid].typ : fid} (${count}×)</li>`).join('')}</ol>
      </li>
      <li style="margin-top:1rem;"><strong>Top 3 Routen (von → nach):</strong>
        <ol>${topRouten.map(([key, count]) => {
          const [von, nach] = key.split('->');
          return `<li>${stationMap[von] ? stationMap[von].name : von} → ${stationMap[nach] ? stationMap[nach].name : nach} (${count}×)</li>`;
        }).join('')}</ol>
      </li>
      <li style="margin-top:1rem;"><strong>Gesamtzahl Überführungen:</strong> ${ueberfuehrungen.length}</li>
    </ul>
  `;

  modal.style.display = "flex";
}

function closeHistorieModal() {
  document.getElementById("historieModal").style.display = "none";
}

document.getElementById('bearbeitenForm').onsubmit = async function(e) {
  e.preventDefault();
  const updatedStation = {
    name: document.getElementById('edit-name').value,
    adresse: document.getElementById('edit-address').value,
    telefon: document.getElementById('edit-phone').value,
    email: document.getElementById('edit-email').value,
    kapazitaet: parseInt(document.getElementById('edit-capacity').value),
    aufbereitung: document.getElementById('edit-aufbereitung').value,
    schadensregulierung: document.getElementById('edit-schadensregulierung').value === 'Ja',
    lage: document.getElementById('edit-lage').value
  };

  try {
    const res = await fetch(`http://localhost:3000/api/mietstationen/${editingStationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedStation)
    });
    if (!res.ok) throw new Error('Fehler beim Bearbeiten');
    alert('✅ Mietstation bearbeitet!');
    document.getElementById('bearbeitenModal').style.display = "none";
    loadStations();
  } catch (err) {
    alert('❌ ' + err.message);
  }
};

function closeBearbeitenModal() {
  document.getElementById('bearbeitenModal').style.display = "none";
  editingStationId = null;
}

// Initiales Laden
window.onload = loadStations;

function toggleAccordion(summaryEl) {
  const card = summaryEl.closest('.station-card');
  card.classList.toggle('open');
}

async function ladeStationen() {
  const res = await fetch('/api/mietstationen');
  const stationen = await res.json();
  const tbody = document.querySelector('#stationTable tbody');
  tbody.innerHTML = '';
  const heute = new Date().toLocaleDateString('de-DE', { weekday: 'long' });

  stationen.forEach(s => {
    // Öffnungszeiten für heute finden
    let oeffnung = "-";
    if (s.oeffnungszeiten && Array.isArray(s.oeffnungszeiten)) {
      const ot = s.oeffnungszeiten.find(o => o.wochentag === heute);
      if (ot && ot.von && ot.bis) oeffnung = `${ot.von}–${ot.bis}`;
      else oeffnung = "geschlossen";
    }
    // Google Maps-Link bauen
    const mapsLink = (s.koordinaten && s.koordinaten.lat && s.koordinaten.lng)
      ? `<a href="https://www.google.com/maps?q=${s.koordinaten.lat},${s.koordinaten.lng}" target="_blank">Karte öffnen</a>`
      : "-";
    tbody.innerHTML += `
      <tr>
        <td>${s.name || '-'}</td>
        <td>${s.adresse || '-'}</td>
        <td>${s.stadt || '-'}</td>
        <td>${s.kapazitaet || '-'}</td>
        <td>${oeffnung}</td>
        <td>${mapsLink}</td>
      </tr>
    `;
  });
}
ladeStationen();

async function ladeStationenUebersicht() {
  const res = await fetch('/api/mietstationen');
  const stationen = await res.json();
  const tbody = document.querySelector('#stationTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const heute = new Date().toLocaleDateString('de-DE', { weekday: 'long' });

  stationen.forEach(s => {
    // Öffnungszeiten heute finden
    let oeffnung = "-";
    if (s.oeffnungszeiten && Array.isArray(s.oeffnungszeiten)) {
      const ot = s.oeffnungszeiten.find(o => o.wochentag === heute);
      if (ot && ot.von && ot.bis) oeffnung = `${ot.von}–${ot.bis}`;
      else oeffnung = "geschlossen";
    }
    // Google Maps-Link bauen
    const mapsLink = (s.koordinaten && s.koordinaten.lat && s.koordinaten.lng)
      ? `<a href="https://www.google.com/maps?q=${s.koordinaten.lat},${s.koordinaten.lng}" target="_blank">Karte öffnen</a>`
      : "-";
    tbody.innerHTML += `
      <tr>
        <td>${s.name || '-'}</td>
        <td>${s.adresse || '-'}</td>
        <td>${s.stadt || '-'}</td>
        <td>${s.kapazitaet || '-'}</td>
        <td>${oeffnung}</td>
        <td>${mapsLink}</td>
      </tr>
    `;
  });
}
ladeStationenUebersicht();

// ============ Collapsible Toggle ============
function initCollapsibles() {
  document.querySelectorAll('.collapsible-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.parentElement;
      section.classList.toggle('open');
    });
  });
}
// Auf zwei Arten aufrufen → funktioniert egal, wo das Script geladen wird
if (document.readyState !== 'loading') {
  // DOM ist schon bereit (Script am Ende des <body>)
  initCollapsibles();
} else {
  // Fallback für <head>- oder "defer"-Einbindung
  document.addEventListener('DOMContentLoaded', initCollapsibles);
}


