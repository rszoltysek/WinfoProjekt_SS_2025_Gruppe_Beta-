/* =========================================================
   Mietstationen – Verwaltungs‑Frontend  (Stand: 23 Jun 2025)
   ---------------------------------------------------------
   – Alle Toggle‑/Collapsible‑Funktionen integriert
   – Legacy‑Code für #toggleStationenBtn entfernt
   – DOMContentLoaded‑Init für sauberes Laden
   ========================================================= */

/* ----------- Globale Variablen & DOM‑Referenzen ---------- */
let editingId = null;
const form         = document.getElementById('mietstationForm');
const stationList  = document.getElementById('stationList');
const cancelButton = document.getElementById('cancelEdit');

// Direkt nach DOMContentLoaded oder init-Block:
['fahrzeugModal','ueberfuehrungModal','historieModal','bearbeitenModal']
  .forEach(id => {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
  });


/* --------------------- Edit‑Modus abbrechen --------------- */
cancelButton.onclick = () => {
  editingId = null;
  form.reset();
  cancelButton.style.display = 'none';
};

/* ------------------ Mietstation speichern ---------------- */
form.addEventListener('submit', async e => {
  e.preventDefault();
  const newStation = {
    name:               document.getElementById('name').value,
    adresse:            document.getElementById('address').value,
    telefon:            document.getElementById('phone').value,
    email:              document.getElementById('email').value,
    kapazitaet:         parseInt(document.getElementById('capacity').value, 10),
    aufbereitung:       document.getElementById('aufbereitung').value,
    schadensregulierung:document.getElementById('schadensregulierung').value === 'Ja',
    lage:               document.getElementById('lage').value
  };

  const url    = editingId ? `http://localhost:3000/api/mietstationen/${editingId}` : 'http://localhost:3000/api/mietstationen';
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

/* ---------------- Mietstation bearbeiten Modal ----------- */
let editingStationId = null;
function editStation(id) {
  fetch('http://localhost:3000/api/mietstationen')
    .then(res => res.json())
    .then(stationen => {
      const station = stationen.find(s => s.id === parseInt(id, 10));
      if (!station) return alert('❌ Station nicht gefunden');
      editingStationId = station.id;
      document.getElementById('edit-name').value               = station.name;
      document.getElementById('edit-address').value            = station.adresse;
      document.getElementById('edit-phone').value              = station.telefon;
      document.getElementById('edit-email').value              = station.email;
      document.getElementById('edit-capacity').value           = station.kapazitaet;
      document.getElementById('edit-aufbereitung').value       = station.aufbereitung;
      document.getElementById('edit-schadensregulierung').value= station.schadensregulierung ? 'Ja' : 'Nein';
      document.getElementById('edit-lage').value               = station.lage;
      document.getElementById('bearbeitenModal').style.display = 'flex';
    });
}

/* ---------------- Mietstation löschen -------------------- */
function deleteStation(id) {
  fetch(`http://localhost:3000/api/mietstationen/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('Fehler beim Löschen');
      loadStations();
    })
    .catch(err => alert('❌ ' + err.message));
}

/* -------------- Fahrzeug‑Details Modal ------------------- */
function showVehicleDetails(f) {
  const modal   = document.getElementById('fahrzeugModal');
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <img src="/autos/${f.bild}" alt="${f.marke}" style="width:100%;border-radius:0.5rem;margin-bottom:1rem;" />
    <h3>${f.marke}</h3>
    <p><strong>Typ:</strong> ${f.typ}</p>
    <p><strong>Kraftstoff:</strong> ${f.kraftstoff}</p>
    <p><strong>Kilometerstand:</strong> ${f.kilometer.toLocaleString()} km</p>
    <p><strong>Preis pro Tag:</strong> ${f.preisProTag} €</p>
    <p><strong>Verfügbar:</strong> ${f.verfuegbar ? '✅ Ja' : '❌ Nein'}</p>`;
  modal.style.display = 'flex';
}
function closeVehicleModal(){document.getElementById('fahrzeugModal').style.display='none';}

/* ----------------------------------------------------------
   Stationen – Liste + Slider + Accordion
   ---------------------------------------------------------- */
function loadStations() {
  fetch('http://localhost:3000/api/mietstationen')
    .then(res => res.json())
    .then(stationen => {
      const promises = stationen.map(station =>
        fetch(`http://localhost:3000/api/stationen/${station.id}/fahrzeuge`)
          .then(res => res.json())
          .then(fahrzeuge => ({ station, fahrzeuge }))
      );

      Promise.all(promises).then(results => {
        stationList.innerHTML = '';

        results.forEach(({ station, fahrzeuge }) => {
          const belegte = fahrzeuge.length;
          const max     = station.kapazitaet;

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
              <div id="fahrzeuge-slider-${station.id}" style="margin-top:1rem;"></div>
              <div id="vehicle-form-${station.id}" style="margin-top:1rem;"></div>
            </div>`;

          stationList.appendChild(div);

          // ---------------- Slider für Fahrzeuge -------------
          const fahrzeugSliderDiv = document.getElementById(`fahrzeuge-slider-${station.id}`);

          if (!fahrzeuge.length) {
            fahrzeugSliderDiv.innerHTML = '<p style="color:#999;">Keine Fahrzeuge vorhanden.</p>';
            return;
          }

          window.slideFahrzeuge = function (stationId, dir) {
            const slider = document.getElementById('slider-container-' + stationId);
            if (!slider) return;
            slider.scrollBy({ left: dir * 180, behavior: 'smooth' });
          };

          const sliderHTML = `
            <div class="fahrzeug-slider-wrap">
              <button onclick="slideFahrzeuge(${station.id}, -1)" style="font-size:1.5rem;padding:0 .5rem;">&#8592;</button>
              <div class="fahrzeug-slider-container" id="slider-container-${station.id}">
                ${fahrzeuge.map(f => `
                  <div class="fahrzeug-card">
                    <img src="/autos/${f.bild}" alt="${f.marke}" onclick='showVehicleDetails(${JSON.stringify(f)})' />
                    <div class="fahrzeug-name">${f.marke} ${f.typ}</div>
                    ${f.verfuegbar
                      ? `<button onclick="showUeberfuehrungDialog(${f.id}, ${station.id})">Überführen</button>`
                      : `<button disabled style="opacity:.5;cursor:not-allowed;">Nicht verfügbar</button>`}
                  </div>`).join('')}
              </div>
              <button onclick="slideFahrzeuge(${station.id}, 1)" style="font-size:1.5rem;padding:0 .5rem;">&#8594;</button>
            </div>`;

          fahrzeugSliderDiv.innerHTML = `<h4>Fahrzeuge:</h4>${sliderHTML}`;
        });
      });
    });
}

/* -------------- Accordion (Station‑Details) -------------- */
function toggleAccordion(summaryEl){summaryEl.closest('.station-card').classList.toggle('open');}

/* -------------- Collapsible (Neue/Liste) ----------------- */
function initCollapsibles(){
  document.querySelectorAll('.collapsible-header').forEach(btn=>{
    btn.addEventListener('click',()=>btn.parentElement.classList.toggle('open'));
  });
}

/* -------------- DOM‑Init --------------------------------- */
if(document.readyState!=='loading'){
  initCollapsibles();
  loadStations();
}else{
  document.addEventListener('DOMContentLoaded',()=>{
    initCollapsibles();
    loadStations();
  });
}

/* ---------------------------------------------------------
   Weitere UI‑, Modal‑ & Übersichts‑Funktionen (unverändert)
   --------------------------------------------------------- */
// showUeberfuehrungDialog(), bestaetigeUeberfuehrung(), ...
// closeUeberfuehrungModal(), showUeberfuehrungHistorie(), ...
// closeHistorieModal(), closeBearbeitenModal(), ...
// ladeStationen(), ladeStationenUebersicht(), etc.
// (Alle bleiben wie bisher – aus Platzgründen hier gekürzt)
