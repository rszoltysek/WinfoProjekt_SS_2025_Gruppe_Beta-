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

// Basis-URL je nach Umgebung
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api';

// Edit abbrechen (Neuanlage-Formular)
if (cancelButton) {
  cancelButton.onclick = () => {
    form.reset();
    form.dataset.editId = '';
    cancelButton.style.display = 'none';
  };
}

// Mietstation speichern (neu oder bearbeiten im unteren Form)
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
      // Bearbeiten
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
      // Neu
      const res = await fetch(`${API_BASE}/mietstationen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Fehler beim Speichern');
      alert('✅ Mietstation gespeichert!');
    }
    form.reset();
    loadStations();
  } catch (err) {
    alert('❌ ' + err.message);
  }
});

async function loadStations() {
  try {
    const stationsRes = await fetch(`${API_BASE}/mietstationen`);
    const stationen = await stationsRes.json();
    stationList.innerHTML = '';

    const fahrzeugeRes = await fetch(`${API_BASE}/fahrzeuge`);
    const fahrzeuge = await fahrzeugeRes.json();

    stationen.forEach(s => {
      const div = document.createElement('div');
      div.className = 'station-card';

      const fahrzeugeThis = fahrzeuge.filter(f => f.stationid === s.id);

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
                    <img src="autos/${f.bild}" alt="${f.marke} ${f.typ}">
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
          </div>
          ${sliderHtml}
        </div>
      `;

      stationList.appendChild(div);
    });

    // === Bearbeiten (öffnet Modal) ===
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = async function() {
        const id = this.dataset.id;
        const station = stationen.find(s => s.id == id);
        if (!station) return alert("Station nicht gefunden");

        editModal.style.display = 'flex';

        // Felder füllen
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

    // === Löschen ===
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async function() {
        const id = this.dataset.id;
        if (!confirm('Diese Station wirklich löschen? Alle zugeordneten Fahrzeuge müssen zuvor entfernt werden!')) return;

        const res = await fetch(`${API_BASE}/mietstationen/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          alert('Station gelöscht!');
          loadStations();
        } else {
          const err = await res.json();
          alert('❌ ' + (err.error || err.message || 'Fehler beim Löschen!'));
        }
      };
    });

    // Überführungs-Buttons funktionieren per Event Delegation weiter unten
  } catch (err) {
    console.error('LadeStations-Fehler:', err);
  }
}

// -----------------------
// Überführungs-Modal und weitere Interaktionen
// -----------------------

// Event Delegation: Öffnen Überführungs-Modal + globales Fahrzeug speichern
document.addEventListener('click', async function(e) {
  const btn = e.target.closest('.ueberfuehrung-btn');
  if (!btn) return;

  // Fahrzeug-Objekt global speichern
  const fahrzeug_id = btn.dataset.id;
  const fahrzeugeRes = await fetch(`${API_BASE}/fahrzeuge`);
  const fahrzeuge = await fahrzeugeRes.json();
  const fahrzeug = fahrzeuge.find(f => f.id == fahrzeug_id);
  if (!fahrzeug) return alert("Fahrzeug nicht gefunden");
  window.aktFahrzeug = fahrzeug;

  document.getElementById('ueberfuehrungFahrzeugName').innerText = btn.dataset.name;
  document.getElementById('ueberfuehrungModal').style.display = 'flex';
  document.getElementById('confirmTransfer').dataset.id = fahrzeug_id;

  // Zielstationen laden (alle)
  const stationsRes = await fetch(`${API_BASE}/mietstationen`);
  const stationen = await stationsRes.json();
  const select = document.getElementById('zielStation');
  select.innerHTML = stationen.map(s =>
    `<option value="${s.id}">${s.name}</option>`
  ).join('');
});

// Modal schließen
document.getElementById('closeTransferModal').onclick = () =>
  document.getElementById('ueberfuehrungModal').style.display = 'none';

// Überführung ausführen
document.getElementById('confirmTransfer').onclick = async function() {
  const fahrzeug = window.aktFahrzeug; // global gespeichertes Objekt!
  if (!fahrzeug) return alert("Fahrzeug nicht gefunden");

  const zielStationId = Number(document.getElementById('zielStation').value);
  const kommentar = document.getElementById('ueberfuehrungKommentar').value;

  const body = {
    von_stationid: Number(fahrzeug.stationid),
    nach_stationid: zielStationId,
    kommentar
  };

 const res = await fetch(`${API_BASE}/fahrzeuge/${fahrzeug.id}/ueberfuehrung`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    von_stationid: Number(fahrzeug.stationid), // <-- Achte auf diese Namen und Werte!
    nach_stationid: Number(zielStationId),
    kommentar: kommentar
  })
});


  if (res.ok) {
    alert("✅ Fahrzeug wurde erfolgreich überführt.");
    document.getElementById('ueberfuehrungModal').style.display = 'none';
    loadStations(); // UI aktualisieren
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
      // Öffnungszeiten heute (optional)
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

// Beim Laden der Seite Übersicht befüllen
document.addEventListener('DOMContentLoaded', () => {
  ladeStationenUebersicht();
  loadStations(); // Wichtig! Sonst keine Cards bei Reload.
});

// Fahrzeug-Detail-Modal anzeigen
document.addEventListener('click', function(e) {
  const card = e.target.closest('.fahrzeug-card');
  if (!card) return;
  const f = JSON.parse(card.getAttribute('data-fahrzeug'));

  document.getElementById('fahrzeugModal').style.display = 'flex';
  document.getElementById('modalBild').src = 'autos/' + f.bild;
  document.getElementById('modalInfo').innerHTML = `
    <h3>${f.marke} ${f.typ}</h3>
    <ul style="text-align:left">
      <li><b>Kraftstoff:</b> ${f.kraftstoff}</li>
      <li><b>Kilometer:</b> ${f.kilometer.toLocaleString()} km</li>
      <li><b>Preis/Tag:</b> ${f.preisprotag} €</li>
      <li><b>Verfügbar:</b> ${f.verfuegbar ? "✅ Ja" : "❌ Nein"}</li>
    </ul>`;
});
document.getElementById('closeModal').onclick = function() {
  document.getElementById('fahrzeugModal').style.display = 'none';
};

// ======= BEARBEITEN-MODAL =======
document.getElementById('closeEditModal').onclick = function() {
  editModal.style.display = 'none';
};
document.getElementById('cancelEditModal').onclick = function() {
  editModal.style.display = 'none';
};

editForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const payload = {
    name: document.getElementById('editName').value,
    adresse: document.getElementById('editAddress').value,
    telefon: document.getElementById('editPhone').value,
    email: document.getElementById('editEmail').value,
    kapazitaet: parseInt(document.getElementById('editCapacity').value, 10),
    aufbereitung: document.getElementById('editAufbereitung').value,
    schadensregulierung: document.getElementById('editSchadensregulierung').value === 'Ja',
    lage: document.getElementById('editLage').value
  };
  try {
    const res = await fetch(`${API_BASE}/mietstationen/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Fehler beim Bearbeiten');
    alert('✅ Mietstation geändert!');
    editModal.style.display = 'none';
    loadStations();
  } catch (err) {
    alert('❌ ' + err.message);
  }
});
