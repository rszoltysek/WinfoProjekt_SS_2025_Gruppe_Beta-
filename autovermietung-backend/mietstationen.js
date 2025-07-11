// ==========================
// Mietstationen Frontend (Supabase-Backend)
// ==========================

// DOM-Referenzen
const form = document.getElementById('mietstationForm');
const stationList = document.getElementById('stationList');
const cancelButton = document.getElementById('cancelEdit');

// Modal für Bearbeiten
const editModal = document.getElementById('editStationModal');
const editForm = document.getElementById('editStationForm');

// Modal für Fahrzeug einfügen (Galerie)
const fahrzeugAddModal = document.getElementById('fahrzeugAddModal');
const closeAddFahrzeugModalBtn = document.getElementById('closeAddFahrzeugModal');
const fahrzeugtypenGallery = document.getElementById('fahrzeugtypenGallery');
const saveSelectedFahrzeugeBtn = document.getElementById('saveSelectedFahrzeuge');

// Basis-URL je nach Umgebung
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api';

// ======================
// Mietstationen CRUD
// ======================

if (cancelButton) {
  cancelButton.onclick = () => {
    form.reset();
    form.dataset.editId = '';
    cancelButton.style.display = 'none';
  };
}

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
    if (form.dataset.editId) {
      const res = await fetch(`${API_BASE}/mietstationen/${form.dataset.editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Fehler beim Bearbeiten');
      alert('✅ Mietstation geändert!');
      form.dataset.editId = '';
      cancelButton.style.display = 'none';
    } else {
      const res = await fetch(`${API_BASE}/mietstationen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Fehler beim Speichern');
      alert('✅ Mietstation gespeichert!');
    }
    form.reset();
    await loadStations();
  } catch (err) {
    alert('❌ ' + err.message);
  }
});

let fahrzeugtypen = [];
let selectedTypen = new Set();

// Holt Fahrzeugtypen von Backend
async function ladeFahrzeugtypen() {
  const res = await fetch(`${API_BASE}/fahrzeugtypen`);
  fahrzeugtypen = await res.json();
  return fahrzeugtypen;
}

// Stationen und zugehörige Fahrzeuge laden & anzeigen
async function loadStations() {
  const stationsRes = await fetch(`${API_BASE}/mietstationen`);
  const stationen = await stationsRes.json();
  stationList.innerHTML = '';

  const fahrzeugeRes = await fetch(`${API_BASE}/fahrzeuge`);
  const fahrzeuge = await fahrzeugeRes.json();

  stationen.forEach(s => {
    const div = document.createElement('div');
    div.className = 'station-card';
    const fahrzeugeThis = fahrzeuge.filter(f => Number(f.stationid) === Number(s.id));

    let sliderHtml = '';
    if (fahrzeugeThis.length > 0) {
      sliderHtml = `
        <div class="fahrzeug-slider-wrap">
          <div class="fahrzeug-slider-container">
            ${fahrzeugeThis.map(f => {
              const status = f.verfuegbar
                ? '<div style="color:#7fff7f; font-size:0.9rem;">✔️ Verfügbar</div>'
                : '<div style="color:#ff8080; font-size:0.9rem;">❌ Nicht verfügbar</div>';
              const transferButton = f.verfuegbar
                ? `<button class="ueberfuehrung-btn" data-id="${f.id}" data-name="${f.marke} ${f.typ}">Überführen</button>`
                : '';
              return `
                <div class="fahrzeug-card" data-fahrzeug='${JSON.stringify(f)}'>
                  <img src="autos/${f.bild}" alt="${f.marke} ${f.typ}" style="width:120px;height:80px;object-fit:cover;border-radius:10px;margin-bottom:0.5rem;">
                  <div class="fahrzeug-name">${f.marke} ${f.typ}</div>
                  ${status}
                  ${transferButton}
                </div>`;
            }).join('')}
          </div>
        </div>`;
    } else {
      sliderHtml = '<div style="color:#aaa; margin:1rem 0;">Keine Fahrzeuge in dieser Station.</div>';
    }

    div.innerHTML = `
      <div class="station-summary" onclick="toggleAccordion(this)">
        <strong>${s.name}</strong> – Kapazität: ${s.kapazitaet}
        <span class="chevron">▼</span>
      </div>
      <div class="station-details">
        ${s.adresse}<br/>
        Telefon: ${s.telefon}<br/>
        E-Mail: ${s.email}<br/>
        <div style="margin: 1rem 0;">
          <button class="edit-btn" data-id="${s.id}">Bearbeiten</button>
          <button class="delete-btn" data-id="${s.id}">Löschen</button>
          <button class="add-fahrzeug-btn" data-id="${s.id}" style="margin-left:1rem;background:#3373d1;color:#fff;padding:0.4rem 1rem;border-radius:8px;">🚗 Fahrzeug einfügen</button>
        </div>
        ${sliderHtml}
      </div>
    `;
    stationList.appendChild(div);
  });

  // Bearbeiten
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.dataset.id;
      const station = stationen.find(s => s.id == id);
      if (!station) return alert("Station nicht gefunden");
      editModal.style.display = 'flex';
      document.getElementById('editId').value = station.id;
      document.getElementById('editName').value = station.name;
      document.getElementById('editAddress').value = station.adresse;
      document.getElementById('editPhone').value = station.telefon;
      document.getElementById('editEmail').value = station.email;
      document.getElementById('editCapacity').value = station.kapazitaet;
      document.getElementById('editAufbereitung').value = station.aufbereitung;
      document.getElementById('editSchadensregulierung').value = station.schadensregulierung === true ? 'Ja' : 'Nein';
      document.getElementById('editLage').value = station.lage;
    };
  });

  // Löschen
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.dataset.id;
      if (!confirm('Diese Station wirklich löschen? Alle zugeordneten Fahrzeuge müssen zuvor entfernt werden!')) return;
      const res = await fetch(`${API_BASE}/mietstationen/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Station gelöscht!');
        await loadStations();
      } else {
        const err = await res.json();
        alert('❌ ' + (err.error || err.message || 'Fehler beim Löschen!'));
      }
    };
  });
}

// =======================
// Fahrzeug Gallerie-Modal
// =======================

document.addEventListener('click', async function(e) {
  const btn = e.target.closest('.add-fahrzeug-btn');
  if (btn) {
    fahrzeugAddModal.style.display = 'flex';
    fahrzeugAddModal.dataset.stationid = btn.dataset.id;

    await ladeFahrzeugtypen();
    fahrzeugtypenGallery.innerHTML = '';
    selectedTypen.clear();

    fahrzeugtypen.forEach(typ => {
      const card = document.createElement('div');
      card.className = 'fahrzeugtypen-card';
      card.innerHTML = `
        <img src="autos/${typ.bild}" alt="${typ.marke} ${typ.typ}" style="width:120px;height:80px;object-fit:cover;border-radius:8px;"><br>
        <b>${typ.marke} ${typ.typ}</b><br>
        <span>${typ.kraftstoff} • ${typ.preisprotag} €/Tag</span>
      `;
      card.onclick = function() {
        if (card.classList.toggle('selected')) {
          selectedTypen.add(typ.id);
        } else {
          selectedTypen.delete(typ.id);
        }
      };
      fahrzeugtypenGallery.appendChild(card);
    });
  }
});

saveSelectedFahrzeugeBtn.onclick = async function() {
  const stationid = Number(fahrzeugAddModal.dataset.stationid);
  if (!stationid) {
    alert('Station-ID fehlt!');
    return;
  }
  if (selectedTypen.size === 0) {
    alert('Bitte mindestens ein Fahrzeug auswählen!');
    return;
  }
  for (const typid of selectedTypen) {
    const typ = fahrzeugtypen.find(t => t.id == typid);
    const payload = {
      stationid,
      marke: typ.marke,
      typ: typ.typ,
      kraftstoff: typ.kraftstoff,
      bild: typ.bild,
      kilometer: 0,
      preisprotag: parseFloat(typ.preisprotag),
      verfuegbar: true
    };
    const res = await fetch(`${API_BASE}/fahrzeuge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      alert('❌ Fehler beim Einfügen: ' + (err.message || err.error || 'Unbekannter Fehler'));
      return;
    }
  }
  selectedTypen.clear();
  fahrzeugAddModal.style.display = 'none';
  await loadStations();
};

closeAddFahrzeugModalBtn.onclick = () => {
  fahrzeugAddModal.style.display = 'none';
  selectedTypen.clear();
};

// =======================
// Überführungs-Modal & weitere Interaktionen (wie gehabt)
// =======================

document.addEventListener('click', async function(e) {
  // --- Überführungs-Button ---
  const btn = e.target.closest('.ueberfuehrung-btn');
  if (btn) {
    const fahrzeug_id = btn.dataset.id;
    const fahrzeugeRes = await fetch(`${API_BASE}/fahrzeuge`);
    const fahrzeuge = await fahrzeugeRes.json();
    window.fahrzeuge = fahrzeuge;

    const fahrzeug = fahrzeuge.find(f => f.id == fahrzeug_id);
    if (!fahrzeug) return alert("Fahrzeug nicht gefunden");
    window.aktFahrzeug = fahrzeug;

    document.getElementById('ueberfuehrungFahrzeugName').innerText = btn.dataset.name;
    document.getElementById('ueberfuehrungModal').style.display = 'flex';
    document.getElementById('confirmTransfer').dataset.id = fahrzeug_id;

    const stationsRes = await fetch(`${API_BASE}/mietstationen`);
    const stationen = await stationsRes.json();
    const select = document.getElementById('zielStation');
    select.innerHTML = stationen.map(s =>
      `<option value="${s.id}">${s.name}</option>`
    ).join('');
    return;
  }

  // --- Fahrzeug-Card: Modal öffnen ---
  const card = e.target.closest('.fahrzeug-card');
  if (card) {
    const f = JSON.parse(card.getAttribute('data-fahrzeug'));
    document.getElementById('fahrzeugModal').style.display = 'flex';
    document.getElementById('modalBild').src = 'autos/' + f.bild;
    document.getElementById('modalInfo').innerHTML = `
      <h3>${f.marke} ${f.typ} ${f.kennzeichen ? "<span style='font-weight:400;font-size:1rem;color:#ffd600;margin-left:0.7rem'>" + f.kennzeichen + "</span>" : ""}</h3>
      <ul style="text-align:left">
        <li><b>Kraftstoff:</b> ${f.kraftstoff}</li>
        <li><b>Kilometer:</b> ${f.kilometer.toLocaleString()} km</li>
        <li><b>Preis/Tag:</b> ${f.preisprotag} €</li>
        <li><b>Verfügbar:</b> ${f.verfuegbar ? "✅ Ja" : "❌ Nein"}</li>
      </ul>`;
  }
});

document.getElementById('closeModal').onclick = function() {
  document.getElementById('fahrzeugModal').style.display = 'none';
};
document.getElementById('closeTransferModal').onclick = () =>
  document.getElementById('ueberfuehrungModal').style.display = 'none';

document.getElementById('confirmTransfer').onclick = async function() {
  const fahrzeug = window.aktFahrzeug;
  if (!fahrzeug) return alert("Fahrzeug nicht gefunden");

  const zielStationId = Number(document.getElementById('zielStation').value);
  const kommentar = document.getElementById('ueberfuehrungKommentar').value;

  const res = await fetch(`${API_BASE}/fahrzeuge/${fahrzeug.id}/ueberfuehrung`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      von_stationid: Number(fahrzeug.stationid),
      nach_stationid: Number(zielStationId),
      kommentar: kommentar
    })
  });

  if (res.ok) {
    alert("✅ Fahrzeug wurde erfolgreich überführt.");
    document.getElementById('ueberfuehrungModal').style.display = 'none';
    await loadStations();
  } else {
    const err = await res.json();
    alert("❌ Fehler: " + err.message);
  }
};

// Accordion öffnen/schließen
function toggleAccordion(el) {
  const card = el.closest('.station-card');
  card.classList.toggle('open');
}

// Übersicht laden (Tabelle)
async function ladeStationenUebersicht() {
  try {
    const res = await fetch(`${API_BASE}/mietstationen`);
    const daten = await res.json();
    const tbody = document.querySelector('#stationTable tbody');
    const heute = new Date().toLocaleDateString('de-DE', { weekday: 'long' });
    if (!tbody) return;
    tbody.innerHTML = daten.map(s => {
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
    // ignore
  }
}

// Überführungs-Historie Tab
async function ladeUeberfuehrungen() {
  const ueberfuehrungDiv = document.getElementById('ueberfuehrungen-list');
  ueberfuehrungDiv.innerHTML = "<p>Lade Überführungen...</p>";

  try {
    const [ueberfuehrungenRes, fahrzeugeRes, stationenRes] = await Promise.all([
      fetch(`${API_BASE}/ueberfuehrungen`),
      fetch(`${API_BASE}/fahrzeuge`),
      fetch(`${API_BASE}/mietstationen`)
    ]);
    const [ueberfuehrungen, fahrzeuge, stationen] = await Promise.all([
      ueberfuehrungenRes.json(),
      fahrzeugeRes.json(),
      stationenRes.json()
    ]);

    const fahrzeugMap = {};
    fahrzeuge.forEach(fzg => {
      const name = [fzg.marke, fzg.typ].filter(Boolean).join(' ');
      fahrzeugMap[fzg.id] = name + (fzg.kennzeichen ? ` – ${fzg.kennzeichen}` : "");
    });

    const stationMap = {};
    stationen.forEach(st => {
      stationMap[st.id] = st.name || st.adresse || ("Station #" + st.id);
    });

    let html = `
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Fahrzeug</th>
            <th>Von</th>
            <th>Nach</th>
            <th>Kommentar</th>
          </tr>
        </thead>
        <tbody>
    `;
    if (!ueberfuehrungen.length) {
      html += `<tr><td colspan="5" style="text-align:center;">Keine Überführungen gefunden.</td></tr>`;
    } else {
      ueberfuehrungen.forEach(u => {
        html += `
          <tr>
            <td>${u.datum ? new Date(u.datum).toLocaleString("de-DE") : ''}</td>
            <td>${fahrzeugMap[u.fahrzeug_id] || u.fahrzeug_id}</td>
            <td>${stationMap[u.von_stationid] || u.von_stationid}</td>
            <td>${stationMap[u.nach_stationid] || u.nach_stationid}</td>
            <td>${u.kommentar ? u.kommentar : ''}</td>
          </tr>
        `;
      });
    }
    html += `</tbody></table>`;
    ueberfuehrungDiv.innerHTML = html;
  } catch (err) {
    ueberfuehrungDiv.innerHTML = "<p style='color:red;'>Fehler beim Laden der Überführungen.</p>";
  }
}

// Tab-Handler
document.querySelectorAll('.sidebar-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    if (target === 'existing-stations') loadStations();
    if (target === 'overview-map') ladeStationenUebersicht();
    if (target === 'ueberfuehrung-historie') ladeUeberfuehrungen();
  });
});

// Beim Laden der Seite Übersicht & Cards befüllen
document.addEventListener('DOMContentLoaded', () => {
  ladeStationenUebersicht();
  loadStations();
});
