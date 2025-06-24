// PERSONAL.js für Supabase/Express-API (modernisiert)

// Tab-System für die Sidebar
document.querySelectorAll('.sidebar-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(this.dataset.target).style.display = 'block';
  });
});

// Seite: Beim Laden nur die KPI-Section zeigen
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
  document.getElementById('kpi').style.display = 'block';

  ladePersonal();
  ladeEinsaetze();
  ladeAbwesenheiten();
  ladeSaisonalitaet();
  ladeEreignisse();
  ladeSkillMatrix();
  ladeReserven();
  ladePersonalBedarf();
  ladeKPIDashboard();
});

// ========== PERSONAL-TABELLE + CHART ==========
async function ladePersonal() {
  try {
    const res = await fetch('/api/personal');
    if (!res.ok) throw new Error('Fehler beim Laden der Personaldaten');
    const daten = await res.json();
    const tbody = document.querySelector('#personalTable tbody');
    tbody.innerHTML = '';

    if (!daten.length) {
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

    personalChart(daten);
  } catch (err) {
    alert('❌ Personal konnte nicht geladen werden!');
    console.error(err);
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

// ========== (Rest wie in deiner aktuellen Datei; alle anderen Funktionen sind schon Supabase-ready) ==========

// Alle anderen lade*()-Funktionen kannst du **genauso lassen**, sie greifen schon korrekt auf die Supabase-API zu!
// Falls du ein **Personal-Formular** für POST/PUT/DELETE brauchst, sag Bescheid – ich baue dir die Logik sofort aus!

// Beispiel für "Personal anlegen" (optional):
async function personalAnlegen(payload) {
  try {
    const res = await fetch('/api/personal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Fehler beim Anlegen');
    alert('✅ Personal angelegt!');
    ladePersonal();
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

// Beispiel für "Personal bearbeiten" (optional):
async function personalBearbeiten(id, payload) {
  try {
    const res = await fetch(`/api/personal/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Fehler beim Bearbeiten');
    alert('✅ Personal bearbeitet!');
    ladePersonal();
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

// Beispiel für "Personal löschen" (optional):
async function personalLoeschen(id) {
  try {
    const res = await fetch(`/api/personal/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Fehler beim Löschen');
    alert('✅ Personal gelöscht!');
    ladePersonal();
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

