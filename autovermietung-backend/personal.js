
async function ladePersonal(name = "") {
  setLadeindikator('#personalTable', 6);

  // 1) Hol dir das Personal
  let url = '/api/personal';
  if (name) url += `?name=${encodeURIComponent(name)}`;
  const [persRes, abwRes] = await Promise.all([
    fetch(url),
    fetch('/api/abwesenheiten')
  ]);
  if (!persRes.ok || !abwRes.ok) {
    throw new Error('Fehler beim Laden der Daten');
  }
  let personal = await persRes.json();
  const abwesenheiten = await abwRes.json();

  // 2) Filtere alle, die aktuell abwesend sind
  const heute = new Date().toISOString().split('T')[0];
  personal = personal.filter(p =>
    !abwesenheiten.some(a =>
      a.personal_id === p.id &&
      a.von <= heute &&
      a.bis >= heute
    )
  );

  // 3) Fülle die Tabelle mit dem gefilterten Array
  fuellePersonalTabelle(personal);
}


function fuellePersonalTabelle(daten) {
  const tbody = document.querySelector('#personalTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!daten || daten.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Keine Mitarbeiter gefunden</td></tr>`;
    return;
  }

  daten.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.name || ''}</td>
        <td>${p.rolle || ''}</td>
        <td>${p.arbeitszeitmodell || ''}</td>
        <td>${p.mietstation?.name || ''}</td> <!-- Stationsname -->
        <td>${p.telefon || ''}</td>
        <td>${p.email || ''}</td>
      </tr>
    `;
  });
}


// Event-Handler für Suche
document.getElementById('searchBtn').onclick = function() {
  const search = document.getElementById('searchInput').value;
  ladePersonal(search);
};
document.getElementById('clearBtn').onclick = function() {
  document.getElementById('searchInput').value = '';
  ladePersonal();
};

async function ladeEinsaetze() {
  setLadeindikator('#einsatzTable', 6);
  const res = await fetch('/api/personaleinsaetze');
  if (!res.ok) throw new Error('Fehler beim Laden der Einsätze');
  const daten = await res.json();
  fuelleEinsaetzeTabelle(daten);
}
function fuelleEinsaetzeTabelle(daten) {
  const tbody = document.querySelector('#einsatzTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    if (!daten || !daten.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Keine Einsätze gefunden</td></tr>`;
      return;
    }
    daten.forEach(e => {
      tbody.innerHTML += `
        <tr>
          <td>${e.name || ''}</td>
          <td>${e.rolle || ''}</td>
          <td>${e.station_id || ''}</td>
          <td>${e.von || ''}</td>
          <td>${e.bis || ''}</td>
          <td>${e.warnung || ''}</td>
        </tr>
      `;
    });
  }
}
async function ladeAbwesenheiten() {
  setLadeindikator('#abwesenheitenTable', 6);
  const res = await fetch('/api/abwesenheiten');
  if (!res.ok) throw new Error('Fehler beim Laden der Abwesenheiten');
  const daten = await res.json();
  fuelleAbwesenheitenTabelle(daten);
}

function fuelleAbwesenheitenTabelle(daten) {
  const tbody = document.querySelector('#abwesenheitenTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    if (!daten || !daten.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Keine Abwesenheiten gefunden</td></tr>`;
      return;
    }
  daten.forEach(a => {
  tbody.innerHTML += `
    <tr>
      <td>${a.name || ''}</td>
      <td>${a.rolle || ''}</td>
      <td>${a.station?.name || a.personal?.station_name || ''}</td>  <!-- Neue Spalte für Mietstation -->
      <td>${a.typ || ''}</td>
      <td>${a.von || ''}</td>
      <td>${a.bis || ''}</td>
      <td>${a.status || ''}</td>
      <td>
        <button onclick="loescheAbwesenheit(${a.id})">🗑️</button>
      </td>
    </tr>
  `;
});
  }
}


// ===== Tab-Switching und alle weiteren Tabs =====
document.querySelectorAll('.sidebar-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(this.dataset.target).style.display = 'block';

    switch (this.dataset.target) {
      case 'kpi':
        ladeKPIParallel();
        break;
      case 'einsatz-uebersicht':
        ladePersonal();
        break;
      case 'einsatz':
        ladeEinsaetze();
        break;
      case 'abwesenheiten':
        ladeAbwesenheiten();
        break;
      case 'saisonalitaet':
        ladeSaisonalitaet();
        break;
      case 'ereignisse':
        ladeEreignisse();
        break;
      case 'skills':
        ladeSkillMatrix();
        break;
      case 'reserven':
        ladeReserven();
        break;
      case 'ueberstunden':
        ladeUeberstunden();
        break;
      case 'bedarf':
        ladePersonalBedarf();
        break;
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchBtn').onclick = function() {
    const search = document.getElementById('searchInput').value;
    ladePersonal(search);
  };

  document.getElementById('clearBtn').onclick = function() {
    document.getElementById('searchInput').value = '';
    ladePersonal();
  };
});

// ===== Ladeindikator =====
function setLadeindikator(selector, colspan = 4, error = false) {
  const tbody = document.querySelector(`${selector} tbody`);
  if (tbody) {
    tbody.innerHTML = `<tr>
      <td colspan="${colspan}" style="text-align:center;${error ? 'color:#f00;' : ''}">
        ${error ? 'Fehler beim Laden!' : 'Lade Daten...'}
      </td>
    </tr>`;
  }
}

// ===== KPI =====
function ladeKPIParallel() {
  setLadeindikator('#personalTable', 6);
  Promise.all([
    ladePersonal(),
    ladeEinsaetze(),
    ladeAbwesenheiten()
  ]).then(([_, __, ___]) => {
    fetch('/api/personal').then(res => res.json()).then(personal => personalChart(personal));
  }).catch(err => {
    setLadeindikator('#personalTable', 6, true);
    alert('❌ Fehler beim parallelen Laden!');
    console.error('PARALLEL-FEHLER:', err);
  });
}

// ===== Abwesenheiten (vollständig interaktiv) =====

const abwesenheitForm = document.getElementById('abwesenheitForm');
const abwesenheitNeuBtn = document.getElementById('abwesenheitNeuBtn');
const abwesenheitAbbrechenBtn = document.getElementById('abwesenheitAbbrechenBtn');

// Neu-Button zeigt Formular
abwesenheitNeuBtn.onclick = async () => {
  abwesenheitForm.style.display = 'block';
  abwesenheitNeuBtn.style.display = 'none';
  abwesenheitForm.reset();
  await fuelleAbwesenheitDropdown();
};

// Abbrechen
abwesenheitAbbrechenBtn.onclick = () => {
  abwesenheitForm.style.display = 'none';
  abwesenheitNeuBtn.style.display = 'inline-block';
};

// === DROPDOWN mit allen Mitarbeitenden füllen ===
async function fuelleAbwesenheitDropdown() {
  const res = await fetch('/api/personal');
  const daten = await res.json();
  const sel = document.getElementById('abwesenheitMitarbeiter');
  sel.innerHTML = '<option value="">Mitarbeiter wählen</option>';
  daten.forEach(p => {
    sel.innerHTML += `<option value="${p.id}" data-rolle="${p.rolle}">${p.name}</option>`;
  });
}

// === NEU-Button zeigt Formular ===
abwesenheitNeuBtn.onclick = async () => {
  abwesenheitForm.style.display = 'block';
  abwesenheitNeuBtn.style.display = 'none';
  abwesenheitForm.reset();
  await fuelleAbwesenheitDropdown();
};

// === ABBRECHEN-Button ===
abwesenheitAbbrechenBtn.onclick = () => {
  abwesenheitForm.style.display = 'none';
  abwesenheitNeuBtn.style.display = 'inline-block';
};

// === SPEICHERN: Formular absenden ===
abwesenheitForm.onsubmit = async function (e) {
  e.preventDefault();

  // Mitarbeiter-Select + ausgewählte Option holen
  const sel = document.getElementById('abwesenheitMitarbeiter');
  const selectedOption = sel.options[sel.selectedIndex];

  if (!sel.value) {
    alert('Bitte Mitarbeiter auswählen!');
    return;
  }

  // Payload bauen (hier werden Name und Rolle extra mitgegeben!)
  const payload = {
    personal_id: parseInt(sel.value),
    name: selectedOption.text, // Name
    rolle: selectedOption.getAttribute('data-rolle'), // Rolle
    typ: document.getElementById('abwesenheitTyp').value,
    von: document.getElementById('abwesenheitVon').value,
    bis: document.getElementById('abwesenheitBis').value,
    status: document.getElementById('abwesenheitStatus').value
  };

  // Konfliktprüfung...
  const einsRes = await fetch('/api/personaleinsaetze');
  const einsaetze = await einsRes.json();
  const konflikte = einsaetze.filter(e =>
    e.personal_id === payload.personal_id &&
    payload.von <= e.bis &&
    payload.bis >= e.von
  );
  if (konflikte.length > 0) {
    alert('⚠️ Achtung: Diese Abwesenheit überschneidet sich mit einem geplanten Einsatz!');
    // return; // ggf. speichern abbrechen
  }

  // Speichern
  await fetch('/api/abwesenheiten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  abwesenheitForm.style.display = 'none';
  abwesenheitNeuBtn.style.display = 'inline-block';
  ladeAbwesenheiten();
};

// === TABELLE füllen ===
function fuelleAbwesenheitenTabelle(daten) {
  const tbody = document.querySelector('#abwesenheitenTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    if (!daten || !daten.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Keine Abwesenheiten gefunden</td></tr>`;
      return;
    }
    daten.forEach(a => {
      tbody.innerHTML += `
        <tr>
          <td>${a.name || ''}</td>
          <td>${a.rolle || ''}</td>
          <td>${a.typ || ''}</td>
          <td>${a.von || ''}</td>
          <td>${a.bis || ''}</td>
          <td>${a.status || ''}</td>
          <td>
            <button onclick="loescheAbwesenheit(${a.id})">🗑️</button>
          </td>
        </tr>
      `;
    });
  }
}



// Abwesenheit löschen
window.loescheAbwesenheit = async function(id) {
  if (!confirm('Diesen Abwesenheitseintrag löschen?')) return;
  await fetch(`/api/abwesenheiten/${id}`, { method: 'DELETE' });
  ladeAbwesenheiten();
};


function fuelleAbwesenheitenTabelle(daten) {
  const tbody = document.querySelector('#abwesenheitenTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!daten || daten.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Keine Abwesenheiten gefunden</td></tr>`;
    return;
  }

   daten.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td>${a.personal_id || ''}</td>                     <!-- ArbeitID -->
        <td>${a.personal?.name || ''}</td>                  <!-- Name -->
        <td>${a.personal?.telefon || ''}</td>               <!-- Telefon -->
        <td>${a.personal?.rolle || ''}</td>                  <!-- Rolle -->
        <td>${a.typ || ''}</td>                               <!-- Typ -->
        <td>${a.von || ''}</td>                               <!-- Von -->
        <td>${a.bis || ''}</td>                               <!-- Bis -->
        <td>${a.status || ''}</td>                            <!-- Status -->

        <td>${a.personal?.mietstation?.name || ''}</td>      <!-- Station -->
        <td>${a.personal?.station_id || ''}</td>             <!-- Station ID -->
        <td>
          <button onclick="loescheAbwesenheit(${a.id})">🗑️</button>
        </td>  
      </tr>
    `;
  });
}



async function ladeSaisonalitaet() {
  const div = document.querySelector('#saisonalitaetContent');
  if (div) div.innerHTML = "Lade Daten...";
  try {
    const res = await fetch('/api/saisonalitaet');
    if (!res.ok) throw new Error('Fehler beim Laden der Saisonalitätsdaten');
    const daten = await res.json();
    if (!daten.length) {
      div.innerHTML = "Keine Saisonalitätsdaten gefunden.";
      return;
    }
    div.innerHTML = "<ul>" + daten.map(s => 
      `<li>${s.monat || ''}: ${s.event || ''}</li>`
    ).join('') + "</ul>";
  } catch (err) {
    div.innerHTML = "<span style='color:#f00;'>Fehler beim Laden!</span>";
  }
}

async function ladeEreignisse() {
  const div = document.querySelector('#ereignisseContent');
  if (div) div.innerHTML = "Lade Daten...";
  try {
    const res = await fetch('/api/ereignisse');
    if (!res.ok) throw new Error('Fehler beim Laden der Ereignisse');
    const daten = await res.json();
    if (!daten.length) {
      div.innerHTML = "Keine Ereignisse gefunden.";
      return;
    }
    div.innerHTML = "<ul>" + daten.map(e => 
      `<li>${e.titel || ''} (${e.datum || ''})</li>`
    ).join('') + "</ul>";
  } catch (err) {
    div.innerHTML = "<span style='color:#f00;'>Fehler beim Laden!</span>";
  }
}

async function ladeSkillMatrix() {
  setLadeindikator('#skillMatrixTable', 4);
  const res = await fetch('/api/personal');
  if (!res.ok) throw new Error('Fehler beim Laden der Skill-Matrix');
  const daten = await res.json();
  fuelleSkillMatrixTabelle(daten);
}

function fuelleSkillMatrixTabelle(daten) {
  const tbody = document.querySelector('#skillMatrixTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    if (!daten || !daten.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Keine Daten gefunden</td></tr>`;
      return;
    }
    daten.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.name || ''}</td>
          <td>${p.rolle || ''}</td>
          <td>${p.skills || ''}</td>
          <td>${p.vertretung_moeglich ? 'Ja' : 'Nein'}</td>
        </tr>
      `;
    });
  }
}

async function ladeReserven() {
  const div = document.querySelector('#reservenContent');
  if (div) div.innerHTML = "Lade Daten...";
  try {
    const res = await fetch('/api/personal?rolle=Reserve');
    if (!res.ok) throw new Error('Fehler beim Laden der Reserven');
    const daten = await res.json();
    if (!daten.length) {
      div.innerHTML = "Keine Reserven gefunden.";
      return;
    }
    div.innerHTML = "<ul>" + daten.map(r =>
      `<li>${r.name || ''} (${r.station_id || ''})</li>`
    ).join('') + "</ul>";
  } catch (err) {
    div.innerHTML = "<span style='color:#f00;'>Fehler beim Laden!</span>";
  }
}

async function ladeUeberstunden() {
  setLadeindikator('#ueberstundenTable', 4);
  const res = await fetch('/api/personal');
  if (!res.ok) throw new Error('Fehler beim Laden der Überstunden');
  const daten = await res.json();
  fuelleUeberstundenTabelle(daten);
}

function fuelleUeberstundenTabelle(daten) {
  const tbody = document.querySelector('#ueberstundenTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    if (!daten || !daten.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Keine Überstunden/Externe gefunden</td></tr>`;
      return;
    }
    daten.forEach(u => {
      tbody.innerHTML += `
        <tr>
          <td>${u.name || ''}</td>
          <td>${u.rolle || ''}</td>
          <td>${u.ueberstunden || ''}</td>
          <td>${u.extern_status || ''}</td>
        </tr>
      `;
    });
  }
}

// ======= PERSONALBEDARF-VERWALTUNG =======

// Initialisiere Formular-Elemente
const bedarfNeuBtn = document.getElementById('bedarfNeuBtn');
const bedarfForm = document.getElementById('bedarfForm');
const bedarfAbbrechenBtn = document.getElementById('bedarfAbbrechenBtn');

// Button "Neu" zeigt Formular an
bedarfNeuBtn.onclick = function() {
  bedarfForm.reset();
  bedarfForm.style.display = 'block';
  bedarfNeuBtn.style.display = 'none';
  bedarfForm.dataset.editId = "";
  ladeBedarfStationen();
};

// Button "Abbrechen" versteckt Formular
bedarfAbbrechenBtn.onclick = function() {
  bedarfForm.style.display = 'none';
  bedarfNeuBtn.style.display = 'inline-block';
  bedarfForm.dataset.editId = "";
};

// Formular "Speichern": entweder POST oder PUT
bedarfForm.onsubmit = async function(e) {
  e.preventDefault();
  const payload = {
    station_id: document.getElementById('bedarfStation').value,
    rolle: document.getElementById('bedarfRolle').value,
    schicht: document.getElementById('bedarfSchicht').value,
    wochentag: document.getElementById('bedarfWochentag').value,
    soll: Number(document.getElementById('bedarfSoll').value)
  };
  const editId = bedarfForm.dataset.editId;

  // ✅ Duplikatsprüfung (nur bei Neuanlage oder anderer Kombination)
  const vorhandene = [...document.querySelectorAll('#bedarfTable tbody tr')];
  const existiert = vorhandene.some(tr =>
    tr.dataset.id !== editId &&
    tr.dataset.stationid === payload.station_id &&
    tr.dataset.rolle === payload.rolle &&
    tr.dataset.wochentag === payload.wochentag
  );
  if (existiert) {
    alert('❗ Ein Eintrag mit dieser Kombination (Station, Rolle, Wochentag) existiert bereits!');
    return;
  }

  // Speichern: PUT oder POST
  if (editId) {
    await fetch(`/api/personalbedarf/${editId}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
  } else {
    await fetch('/api/personalbedarf', {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
  }

  bedarfForm.style.display = 'none';
  bedarfNeuBtn.style.display = 'inline-block';
  bedarfForm.dataset.editId = "";
  ladePersonalBedarf();
};


// Dropdown mit allen Mietstationen befüllen
async function ladeBedarfStationen() {
  const res = await fetch('/api/mietstationen');
  const daten = await res.json();
  const sel = document.getElementById('bedarfStation');
  sel.innerHTML = '<option value="">Station wählen</option>';
  daten.forEach(s => {
    sel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
  });
}

// Tabelle inkl. Aktionen (Bearbeiten/Löschen)
async function fuellePersonalBedarfTabelle(daten) {
  const tbody = document.querySelector('#bedarfTable tbody');
  if (!tbody) return;

  // Daten laden
  const [personalRes, abwesenheitRes] = await Promise.all([
    fetch('/api/personal'),
    fetch('/api/abwesenheiten')
  ]);

  const personal = await personalRes.json();
  const abwesenheiten = await abwesenheitRes.json();

  tbody.innerHTML = '';
  if (!daten || !daten.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Keine Bedarfsdaten gefunden</td></tr>`;
    return;
  }

  daten.forEach(b => {
    // Filtere Mitarbeitende nach Rolle und Station
    const passendesPersonal = personal.filter(p =>
      p.station_id == b.station_id &&
      p.rolle == b.rolle
    );

    // Prüfe, ob jemand zur geplanten Schicht abwesend ist
    const verfuegbar = passendesPersonal.filter(p => {
      const abwesend = abwesenheiten.find(a =>
        a.personal_id == p.id &&
        a.von <= getDatumNaechsterWochentag(b.wochentag) &&
        a.bis >= getDatumNaechsterWochentag(b.wochentag)
      );
      return !abwesend;
    });

    const ist = verfuegbar.length;
    const abweichung = ist - b.soll;

    tbody.innerHTML += `
      <tr>
        <td>${b.station_id || ''}</td>
        <td>${b.rolle || ''}</td>
        <td>${b.schicht || ''}</td>
        <td>${b.wochentag || ''}</td>
        <td>${b.soll}</td>
        <td>${ist}</td>
        <td style="color:${abweichung < 0 ? '#f87171' : abweichung > 0 ? '#facc15' : '#4ade80'};">
          ${abweichung > 0 ? '+' : ''}${abweichung}
        </td>
        <td>
          <button onclick="bearbeitePersonalBedarf('${b.id}')">✏️</button>
          <button onclick="loeschePersonalBedarf('${b.id}')">🗑️</button>
        </td>
      </tr>
    `;
  });
}

// Hilfsfunktion: nächstes Datum für "Montag", "Dienstag", ...
function getDatumNaechsterWochentag(wochentag) {
  const wochentage = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const heute = new Date();
  const ziel = wochentage.indexOf(wochentag);
  const diff = (ziel + 7 - heute.getDay()) % 7;
  const zielDatum = new Date(heute);
  zielDatum.setDate(heute.getDate() + diff);
  return zielDatum.toISOString().split('T')[0];
}
// Löschen-Button
window.loeschePersonalBedarf = async function(id) {
  if (!confirm('Diesen Eintrag wirklich löschen?')) return;
  await fetch(`/api/personalbedarf/${id}`, {method:"DELETE"});
  ladePersonalBedarf();
};

// personalbedarf laden & anzeigen
// personalbedarf laden & anzeigen
async function ladePersonalbedarf() {
  const tableBody = document.querySelector('#bedarfTable tbody');
  const info = document.getElementById('bedarfInfo');
  tableBody.innerHTML = '<tr><td colspan="8">Lade Daten...</td></tr>';

  try {
    const res = await fetch('/api/personalbedarf');
    if (!res.ok) throw new Error('Fehler beim Laden des Personalbedarfs');

    const daten = await res.json();
    if (!daten.length) {
      tableBody.innerHTML = '';
      info.textContent = 'Es wurden noch keine Bedarfsdaten eingetragen.';
      return;
    }

    tableBody.innerHTML = '';
    daten.forEach(eintrag => {
      const tr = document.createElement('tr');

      const farbe = eintrag.abweichung < 0 ? '#fdd' : eintrag.abweichung > 0 ? '#dfd' : 'transparent';
      const abwText = eintrag.abweichung > 0 ? '+' + eintrag.abweichung : eintrag.abweichung;

      tr.innerHTML = `
        <td>${eintrag.station_id}</td>
        <td>${eintrag.rolle}</td>
        <td>${eintrag.schicht}</td>
        <td>${eintrag.wochentag}</td>
        <td>${eintrag.soll}</td>
        <td>${eintrag.ist}</td>
        <td style="background:${farbe}; text-align:center;">${abwText}</td>
        <td>
          <button onclick="bearbeiteBedarf(${eintrag.id})">Bearbeiten</button>
          <button onclick="loescheBedarf(${eintrag.id})">Löschen</button>
        </td>
      `;

      tableBody.appendChild(tr);
    });
    info.textContent = '';

  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="8" style="color:red;">Fehler: ' + err.message + '</td></tr>';
    info.textContent = '';
  }
}


// === Chart für KPI ===
function personalChart(personal) {
  const stations = {};
  personal.forEach(p => {
    const id = p.station_id || 'Unbekannt';
    stations[id] = (stations[id] || 0) + 1;
  });
  const labels = Object.keys(stations);
  const werte = Object.values(stations);

  if (window.kpiChartInstanz) window.kpiChartInstanz.destroy();

  const ctx = document.getElementById('kpiChart').getContext('2d');
  window.kpiChartInstanz = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Anzahl Mitarbeiter pro Station',
        data: werte,
        backgroundColor: '#facc15',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#f5f5f5' } }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#f5f5f5' },
          grid: { color: '#444' }
        },
        x: {
          ticks: { color: '#f5f5f5' },
          grid: { color: '#444' }
        }
      }
    }
  });
}
let bearbeiteId = null;

document.getElementById('bedarfTable').addEventListener('click', async (e) => {
  if (e.target.classList.contains('bearbeiten-btn')) {
    const zeile = e.target.closest('tr');
    bearbeiteId = zeile.dataset.id;

    // Lade Stationen bevor wir Werte setzen!
    await ladeBedarfStationen();

    document.getElementById('bedarfStation').value = zeile.dataset.stationid;
    document.getElementById('bedarfRolle').value = zeile.dataset.rolle;
    document.getElementById('bedarfSchicht').value = zeile.dataset.schicht;
    document.getElementById('bedarfWochentag').value = zeile.dataset.wochentag;
    document.getElementById('bedarfSoll').value = zeile.dataset.soll;

    document.getElementById('bedarfForm').style.display = 'block';
    document.getElementById('bedarfNeuBtn').style.display = 'none';
  }

  if (e.target.classList.contains('loeschen-btn')) {
    const id = e.target.closest('tr').dataset.id;
    if (confirm('Wirklich löschen?')) {
      await fetch(`/api/personalbedarf/${id}`, { method: 'DELETE' });
      ladePersonalBedarf();
    }
  }
});

document.getElementById('bedarfForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    station_id: parseInt(document.getElementById('bedarfStation').value),
    rolle: document.getElementById('bedarfRolle').value,
    schicht: document.getElementById('bedarfSchicht').value,
    wochentag: document.getElementById('bedarfWochentag').value,
    soll: parseInt(document.getElementById('bedarfSoll').value)
  };

  if (bearbeiteId) {
    await fetch(`/api/personalbedarf/${bearbeiteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch('/api/personalbedarf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  bearbeiteId = null;
  document.getElementById('bedarfForm').reset();
  document.getElementById('bedarfForm').style.display = 'none';
  ladePersonalBedarf();
});

document.getElementById('bedarfAbbrechenBtn').addEventListener('click', () => {
  bearbeiteId = null;
  document.getElementById('bedarfForm').reset();
  document.getElementById('bedarfForm').style.display = 'none';
});

async function ladePersonalBedarf() {
  const tableBody = document.querySelector('#bedarfTable tbody');
  const info = document.getElementById('bedarfInfo');
  tableBody.innerHTML = '<tr><td colspan="8">Lade Daten...</td></tr>';

  try {
    const res = await fetch('/api/personalbedarf');
    if (!res.ok) throw new Error('Fehler beim Laden des Personalbedarfs');

    const daten = await res.json();
    tableBody.innerHTML = '';

    daten.forEach(eintrag => {
      const tr = document.createElement('tr');

      // Speichern der Daten für späteres Bearbeiten
      tr.dataset.id = eintrag.id;
      tr.dataset.stationid = eintrag.station_id;
      tr.dataset.rolle = eintrag.rolle;
      tr.dataset.schicht = eintrag.schicht;
      tr.dataset.wochentag = eintrag.wochentag;
      tr.dataset.soll = eintrag.soll;

      const abw = eintrag.abweichung;
      const farbe = abw < 0 ? 'red' : abw > 0 ? 'goldenrod' : 'green';
      const tooltip = abw < -1 ? 'title="Starke Unterdeckung!"' : '';

      tr.innerHTML = `
        <td>${eintrag.station_id}</td>
        <td>${eintrag.rolle}</td>
        <td>${eintrag.schicht}</td>
        <td>${eintrag.wochentag}</td>
        <td>${eintrag.soll}</td>
        <td>${eintrag.ist}</td>
        <td style="color:${farbe}; text-align:center;" ${tooltip}>
          ${abw > 0 ? '+' : ''}${abw}
        </td>
        <td>
          <button class="bearbeiten-btn">🖊️</button>
          <button class="loeschen-btn">🗑️</button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    info.textContent = '';
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="8" style="color:red;">Fehler: ${err.message}</td></tr>`;
    info.textContent = '';
  }
}

async function ladeEreignisse() {
  const div = document.querySelector('#ereignisseContent');
  if (div) div.innerHTML = "Lade Daten...";
  try {
    const res = await fetch('/api/ereignisse');
    if (!res.ok) throw new Error('Fehler beim Laden der Ereignisse');
    const daten = await res.json();
    if (!daten.length) {
      div.innerHTML = "Keine Ereignisse gefunden.";
      return;
    }
    div.innerHTML = "<ul>" + daten.map(e => 
      `<li>${e.titel || ''} (${e.datum || ''})</li>`
    ).join('') + "</ul>";
  } catch (err) {
    div.innerHTML = "<span style='color:#f00;'>Fehler beim Laden!</span>";
  }
}
function ladeEreignisse() {
  const ereignisse = [
    { titel: 'Grippewelle', datum: '01.02.2025', massnahmen: [
      'Mehr Krankheitsvertretungen einplanen',
      'Fahrzeugaufbereiter mit Urlaubsvertretung ausstatten',
      'Stationsleiter mit Krankheitsvertretung bestücken'
    ] },
    { titel: 'Naturereignis (z. B. Sturm)', datum: '03.03.2025', massnahmen: [
      'Fahrzeuge aus Gefahrenzonen verlagern',
      'Notfallteams einrichten',
      'Stationsleiter auf Notfallmanagement schulen'
    ] },
    { titel: 'Technische Störung', datum: '15.04.2025', massnahmen: [
      'Techniker zur Fehlerbehebung bereitstellen',
      'Stationsleiter mit alternativen Arbeitsabläufen ausstatten',
      'Kommunikation zu den Kunden intensivieren'
    ] },
    { titel: 'Hitzewelle', datum: '28.06.2025', massnahmen: [
      'Personal mit genügend Pausen einplanen',
      'Wasserstationen aufstellen',
      'Arbeitszeiten flexibel gestalten'
    ] },
    { titel: 'Streik im öffentlichen Verkehr', datum: '12.07.2025', massnahmen: [
      'Fahrzeuge für längere Mietperioden einplanen',
      'Kommunikation über alternative Transportmöglichkeiten verstärken',
      'Stationsleiter für Notfälle vorbereiten'
    ] },
    { titel: 'Wintereinbruch', datum: '05.12.2025', massnahmen: [
      'Fahrzeugaufbereiter auf Winterbetrieb vorbereiten',
      'Straßenbedingungen regelmäßig überwachen',
      'Stationsleiter für wetterbedingte Verzögerungen sensibilisieren'
    ] },
    { titel: 'Überbuchung von Mietstationen', datum: '15.08.2025', massnahmen: [
      'Weitere Fahrzeuge kurzfristig organisieren',
      'Personal für zusätzliche Buchungsabwicklungen bereitstellen',
      'Kunden für Alternativstandorte informieren'
    ] },
    { titel: 'Unfall in der Mietstation', datum: '20.09.2025', massnahmen: [
      'Sofortige Meldung an die Notfallabteilung',
      'Personal für die Schadensabwicklung einplanen',
      'Stationsleiter für rechtliche Schritte vorbereiten'
    ] },
    { titel: 'Schwankende Nachfrage während Feiertagen', datum: '25.12.2025', massnahmen: [
      'Personal für längere Arbeitszeiten einplanen',
      'Fahrzeuge für längere Mietperioden bereitstellen',
      'Stationsleiter auf höhere Kundenfrequenz vorbereiten'
    ] },
    { titel: 'Covid-19-Infektionswelle', datum: '01.01.2025', massnahmen: [
      'Hygienevorkehrungen im Betrieb verstärken',
      'Kontaktfreie Fahrzeugübergabe ermöglichen',
      'Personal im Schichtbetrieb einteilen'
    ] }
  ];

  const div = document.querySelector('#ereignisseContent');
  if (div) {
    div.innerHTML = "<ul>" + ereignisse.map(e =>
      `<li><strong>${e.titel}</strong> (${e.datum})<ul>${e.massnahmen.map(m => `<li>${m}</li>`).join('')}</ul></li>`
    ).join('') + "</ul>";
  }
}

// Diese Funktion beim Laden der Seite aufrufen
document.addEventListener('DOMContentLoaded', function() {
  ladeEreignisse();
});
function ladeFeiertage() {
  const feiertage = [
    { name: 'Neujahrstag', datum: '01.01.2025' },
    { name: 'Karfreitag', datum: '18.04.2025' },
    { name: 'Ostermontag', datum: '21.04.2025' },
    { name: 'Tag der Arbeit', datum: '01.05.2025' },
    { name: 'Christi Himmelfahrt', datum: '29.05.2025' },
    { name: 'Pfingstmontag', datum: '09.06.2025' },
    { name: 'Fronleichnam', datum: '19.06.2025' },
    { name: 'Tag der Deutschen Einheit', datum: '03.10.2025' },
    { name: 'Weihnachtstag', datum: '25.12.2025' },
    { name: 'Zweiter Weihnachtstag', datum: '26.12.2025' }
  ];

  const div = document.querySelector('#feiertageContent');
  if (div) {
    div.innerHTML = "<ul>" + feiertage.map(f =>
      `<li><strong>${f.name}</strong> (${f.datum})</li>`
    ).join('') + "</ul>";
  }
}

// Diese Funktion beim Laden der Seite aufrufen
document.addEventListener('DOMContentLoaded', function() {
  ladeFeiertage();
});
