// personal.js – Ohne Pagination, wie gehabt, aber optimiert

// ===== Personal laden und suchen (ohne Pagination) =====
async function ladePersonal(name = "") {
  setLadeindikator('#personalTable', 6);
  let url = '/api/personal';
  if (name) url += `?name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fehler beim Laden der Personaldaten');
  const daten = await res.json();
  fuellePersonalTabelle(daten);
}

function fuellePersonalTabelle(daten) {
  const tbody = document.querySelector('#personalTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    if (!daten || !daten.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Keine Mitarbeiter gefunden</td></tr>`;
      return;
    }
    daten.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.name || ''}</td>
          <td>${p.rolle || ''}</td>
          <td>${p.arbeitszeitmodell || ''}</td>
          <td>${p.station_id || ''}</td>
          <td>${p.telefon || ''}</td>
          <td>${p.email || ''}</td>
        </tr>
      `;
    });
  }
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

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
  document.getElementById('kpi').style.display = 'block';
  ladeKPIParallel();
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

// ===== Beispielhafte Anbindungen für die restlichen Tabs =====
function ladeKPIParallel() {
  setLadeindikator('#personalTable', 6);
  Promise.all([
    ladePersonal(),
    ladeEinsaetze(),
    ladeAbwesenheiten()
  ]).then(([_, __, ___]) => {
    // Personal-Chart nur, wenn Personal-Daten geladen sind
    fetch('/api/personal').then(res => res.json()).then(personal => personalChart(personal));
  }).catch(err => {
    setLadeindikator('#personalTable', 6, true);
    alert('❌ Fehler beim parallelen Laden!');
    console.error('PARALLEL-FEHLER:', err);
  });
}

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
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Keine Abwesenheiten gefunden</td></tr>`;
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
        </tr>
      `;
    });
  }
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

async function ladePersonalBedarf() {
  setLadeindikator('#bedarfTable', 6);
  const res = await fetch('/api/personalbedarf');
  if (!res.ok) throw new Error('Fehler beim Laden des Personalbedarfs');
  const daten = await res.json();
  fuellePersonalBedarfTabelle(daten);
}

function fuellePersonalBedarfTabelle(daten) {
  const tbody = document.querySelector('#bedarfTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    if (!daten || !daten.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Keine Bedarfsdaten gefunden</td></tr>`;
      return;
    }
    daten.forEach(b => {
      tbody.innerHTML += `
        <tr>
          <td>${b.station || ''}</td>
          <td>${b.schicht || ''}</td>
          <td>${b.wochentag || ''}</td>
          <td>${b.soll || ''}</td>
          <td>${b.ist || ''}</td>
          <td>${b.abweichung || ''}</td>
        </tr>
      `;
    });
  }
}

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
