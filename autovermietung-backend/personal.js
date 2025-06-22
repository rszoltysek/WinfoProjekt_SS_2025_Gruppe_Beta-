// Tab-System für die Sidebar
document.querySelectorAll('.sidebar-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    // alle Buttons deaktivieren
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    // alle Sections ausblenden
    document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
    // gewählte Section einblenden
    document.getElementById(this.dataset.target).style.display = 'block';
  });
});
// Seite: Beim Laden nur die erste Section zeigen
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
  document.getElementById('kpi').style.display = 'block';
});

    
    
    // PERSONAL-TABELLE + CHART
    async function ladePersonal() {
      const res = await fetch('/api/personal');
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
            <td>${p.stationId || ''}</td>
            <td>${p.telefon || ''}</td>
            <td>${p.email || ''}</td>
          </tr>
        `;
      });
      personalChart(daten);
    }

    // CHART: Verteilung der Mitarbeiter pro Station
    function personalChart(personal) {
      const stations = {};
      personal.forEach(p => {
        const id = p.stationId || 'Unbekannt';
        stations[id] = (stations[id] || 0) + 1;
      });
      const labels = Object.keys(stations);
      const werte = Object.values(stations);
      if (window.kpiChartInstanz) window.kpiChartInstanz.destroy();
      const ctx = document.getElementById('kpiChart').getContext('2d');
      window.kpiChartInstanz = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
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
   async function ladeEinsaetze() {
  const [personalRes, einsatzRes] = await Promise.all([
    fetch('/api/personal'),
    fetch('/api/personaleinsaetze')
  ]);
  const personal = await personalRes.json();
  const einsaetze = await einsatzRes.json();
  const personalMap = {};
  personal.forEach(p => personalMap[p.id] = p);
  const tbody = document.querySelector('#einsatzTable tbody');
  tbody.innerHTML = '';

  if (!einsaetze.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Keine Einsätze geplant</td></tr>`;
    return;
  }

  function getEinsaetzeInWoche(personalId, startDate) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Montag
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return einsaetze.filter(e => 
      e.personalId === personalId &&
      new Date(e.start) >= weekStart &&
      new Date(e.start) <= weekEnd
    );
  }

  einsaetze.forEach(e => {
    const p = personalMap[e.personalId] || {};
    // Arbeitszeit-Check: Wie viele Stunden diese Woche?
    const einsaetzeWoche = getEinsaetzeInWoche(e.personalId, e.start);
    let stundenDieseWoche = 0;
    einsaetzeWoche.forEach(wk => {
      if (wk.start && wk.ende) {
        const st = new Date(wk.start);
        const en = new Date(wk.ende);
        stundenDieseWoche += (en - st) / (1000*60*60);
      }
    });

    // Schichtübergang-Check (Ruhezeit)
    let ruheVerletzt = false;
    const eigeneEinsaetze = einsaetze
      .filter(e2 => e2.personalId === e.personalId && e2.start && e2.ende)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
    eigeneEinsaetze.forEach((eins, idx) => {
      if (idx > 0) {
        const prevEnde = new Date(eigeneEinsaetze[idx-1].ende);
        const nextStart = new Date(eins.start);
        const ruheStunden = (nextStart - prevEnde) / (1000*60*60);
        if (ruheStunden < (p.ruhezeitMinStunden || 11)) {
          if (eins.id === e.id) ruheVerletzt = true;
        }
      }
    });

    // Überschreitung Soll-Stunden?
    let warnung = '';
    if (stundenDieseWoche > (p.wochenstundenSoll || 40)) warnung += '⚠️ Über Soll-Wochenstunden! ';
    if (ruheVerletzt) warnung += '⚠️ Ruhezeit verletzt!';

    tbody.innerHTML += `
      <tr${warnung ? ' style="background:#39151d;color:#f87171;font-weight:bold;"' : ''}>
        <td>${p.name || '-'}</td>
        <td>${e.rolle || p.rolle || '-'}</td>
        <td>${e.stationId || '-'}</td>
        <td>${e.start ? e.start.replace('T', ' ') : '-'}</td>
        <td>${e.ende ? e.ende.replace('T', ' ') : '-'}</td>
        <td>${warnung || '-'}</td>
      </tr>
    `;
  });
}

    // Beim Laden beides holen:
    ladePersonal();
    ladeEinsaetze();


    async function ladeAbwesenheiten() {
  const [personalRes, abwRes] = await Promise.all([
    fetch('/api/personal'),
    fetch('/api/abwesenheiten')
  ]);
  const personal = await personalRes.json();
  const abwesenheiten = await abwRes.json();
  const personalMap = {};
  personal.forEach(p => personalMap[p.id] = p);

  const tbody = document.querySelector('#abwesenheitTable tbody');
  tbody.innerHTML = '';
  if (!abwesenheiten.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Keine Abwesenheiten eingetragen</td></tr>`;
    return;
  }
  abwesenheiten.forEach(a => {
    const p = personalMap[a.personalId] || {};
    tbody.innerHTML += `
      <tr>
        <td>${p.name || '-'}</td>
        <td>${a.art || '-'}</td>
        <td>${a.start || '-'}</td>
        <td>${a.ende || '-'}</td>
      </tr>
    `;
  });
}
ladeAbwesenheiten();


async function ladeSaisonalitaet() {
  const [saisonRes, stationRes] = await Promise.all([
    fetch('/api/saisonalitaet'),
    fetch('/api/mietstationen')
  ]);
  const saison = await saisonRes.json();
  const stationen = await stationRes.json();
  const stationMap = {};
  stationen.forEach(s => stationMap[s.id] = s.name || s.stationsname || s.id);

  const tbody = document.querySelector('#saisonTable tbody');
  tbody.innerHTML = '';
  if (!saison.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Keine saisonalen Ereignisse eingetragen</td></tr>`;
    return;
  }
  saison.forEach(ev => {
    const betroffene = (ev.betroffeneStationen || []).map(id => stationMap[id] || id).join(', ');
    tbody.innerHTML += `
      <tr>
        <td>${ev.typ || '-'}</td>
        <td>${ev.beschreibung || '-'}</td>
        <td>${ev.start || '-'}</td>
        <td>${ev.ende || '-'}</td>
        <td>${betroffene}</td>
      </tr>
    `;
  });
}
ladeSaisonalitaet();

async function ladeEreignisse() {
  const [ereignisRes, stationRes] = await Promise.all([
    fetch('/api/ereignisse'),
    fetch('/api/mietstationen')
  ]);
  const ereignisse = await ereignisRes.json();
  const stationen = await stationRes.json();
  const stationMap = {};
  stationen.forEach(s => stationMap[s.id] = s.name || s.stationsname || s.id);

  const tbody = document.querySelector('#ereignisTable tbody');
  tbody.innerHTML = '';
  if (!ereignisse.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Keine aktuellen Ereignisse eingetragen</td></tr>`;
    return;
  }
  ereignisse.forEach(ev => {
    const betroffene = (ev.betroffeneStationen || []).map(id => stationMap[id] || id).join(', ');
    tbody.innerHTML += `
      <tr>
        <td>${ev.typ || '-'}</td>
        <td>${ev.beschreibung || '-'}</td>
        <td>${ev.start || '-'}</td>
        <td>${ev.ende || '-'}</td>
        <td>${betroffene}</td>
      </tr>
    `;
  });
}
ladeEreignisse();

async function ladeSkillMatrix() {
  const res = await fetch('/api/personal');
  const personal = await res.json();

  const tbody = document.querySelector('#skillTable tbody');
  tbody.innerHTML = '';
  if (!personal.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Keine Mitarbeitenden gefunden</td></tr>`;
    return;
  }
  personal.forEach(p => {
    // Primäre Rolle: p.rolle
    // Weitere Skills: alles in p.skills außer p.rolle
    const weitereSkills = (p.skills || [])
      .filter(skill => skill !== p.rolle)
      .join(', ') || '-';
    tbody.innerHTML += `
      <tr>
        <td>${p.name || '-'}</td>
        <td>${p.rolle || '-'}</td>
        <td>${weitereSkills}</td>
      </tr>
    `;
  });
}
ladeSkillMatrix();

async function ladeReserven() {
  const res = await fetch('/api/personal');
  const personal = await res.json();
  const tbody = document.querySelector('#reserveTable tbody');
  tbody.innerHTML = '';
  if (!personal.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Keine Daten</td></tr>`;
    return;
  }
  personal.forEach(p => {
    // Zeige alle, die Reserve, Überstunden oder extern sind
    if (p.reserve || (p.ueberstunden && p.ueberstunden !== 0) || p.extern) {
      tbody.innerHTML += `
        <tr>
          <td>${p.name || '-'}</td>
          <td>${p.rolle || '-'}</td>
          <td>${p.stationId || '-'}</td>
          <td>${p.reserve ? '✔️' : '-'}</td>
          <td>${p.ueberstunden !== undefined ? p.ueberstunden : '-'}</td>
          <td>${p.extern ? '✔️' : '-'}</td>
        </tr>
      `;
    }
  });
}
ladeReserven();

async function ladePersonalBedarf() {
  const [bedarfRes, einsatzRes, stationRes] = await Promise.all([
    fetch('/api/personalbedarf'),
    fetch('/api/personaleinsaetze'),
    fetch('/api/mietstationen')
  ]);
  const bedarf = await bedarfRes.json();
  const einsaetze = await einsatzRes.json();
  const stationen = await stationRes.json();
  const stationMap = {};
  stationen.forEach(s => stationMap[s.id] = s.name || s.stationsname || s.id);

  const tbody = document.querySelector('#bedarfTable tbody');
  tbody.innerHTML = '';
  if (!bedarf.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Kein Bedarfsplan hinterlegt</td></tr>`;
    return;
  }

  let unterbesetzt = false;
  bedarf.forEach(b => {
    // Zähle Ist-Besetzung: Einsätze mit passender Station, Schicht, Tag
    const ist = einsaetze.filter(e => {
      const d = new Date(e.start);
      const wtag = d.toLocaleDateString('de-DE', { weekday: 'long' });
      return e.stationId === b.stationId
        && (b.wochentag === wtag)
        && (b.schicht ? (e.schicht === b.schicht) : true);
    }).length;
    const abweichung = ist - b.sollPersonal;
    let abwTxt = '';
    const prozent = b.sollPersonal ? (ist / b.sollPersonal) : 1;
    if (prozent < 0.9) {
      abwTxt = `🚨 Unterbesetzt (${ist}/${b.sollPersonal} | ${Math.round(prozent*100)}%)`;
      unterbesetzt = true;
    }
    else if (abweichung > 0) abwTxt = `👍 Überbesetzt (+${abweichung})`;
    else abwTxt = '✔️ Soll erfüllt';

    tbody.innerHTML += `
      <tr${prozent < 0.9 ? ' style="background:#39151d;color:#f87171;font-weight:bold;"' : ''}>
        <td>${stationMap[b.stationId] || b.stationId}</td>
        <td>${b.schicht || '-'}</td>
        <td>${b.wochentag || '-'}</td>
        <td>${b.sollPersonal}</td>
        <td>${ist}</td>
        <td>${abwTxt}</td>
      </tr>
    `;
  });

  // Zeige/oder verstecke Alert oben
  document.getElementById('kapazitaetsAlert').style.display = unterbesetzt ? 'block' : 'none';
}
ladePersonalBedarf();

async function ladeKPIDashboard() {
  // Daten parallel laden
  const [bedarfRes, einsatzRes, personalRes, abwRes] = await Promise.all([
    fetch('/api/personalbedarf'),
    fetch('/api/personaleinsaetze'),
    fetch('/api/personal'),
    fetch('/api/abwesenheiten')
  ]);
  const bedarf = await bedarfRes.json();
  const einsaetze = await einsatzRes.json();
  const personal = await personalRes.json();
  const abwesenheiten = await abwRes.json();

  // 1. Besetzungsquote: Anteil aller geplanten Ist-Einsätze zum Soll aller Bedarfe
  let sollGesamt = 0, istGesamt = 0;
  bedarf.forEach(b => {
    sollGesamt += b.sollPersonal;
    istGesamt += einsaetze.filter(e => {
      const d = new Date(e.start);
      const wtag = d.toLocaleDateString('de-DE', { weekday: 'long' });
      return e.stationId === b.stationId
        && (b.wochentag === wtag)
        && (b.schicht ? (e.schicht === b.schicht) : true);
    }).length;
  });
  let besetzungsquote = sollGesamt ? Math.round((istGesamt / sollGesamt) * 100) : 100;

  // 2. Überstundenquote: Summe aller Überstunden im Team (aus personal.json)
  let ueberstundenGesamt = 0;
  personal.forEach(p => { if (p.ueberstunden) ueberstundenGesamt += p.ueberstunden; });

  // 3. Ungeplante Ausfälle (Krank, "Sonstiges" etc.)
  const ungeplant = abwesenheiten.filter(a =>
    a.art && (a.art.toLowerCase().includes("krank") || a.art.toLowerCase().includes("sonst"))
  ).length;

  // In KPIs anzeigen
  document.getElementById('kpiBesetzungsquote').textContent = besetzungsquote + " %";
  document.getElementById('kpiUeberstunden').textContent = ueberstundenGesamt + " h";
  document.getElementById('kpiAusfaelle').textContent = ungeplant;

  // (Optional) Farbige Warnung, wenn kritisch:
  if (besetzungsquote < 90) {
    document.getElementById('kpiBesetzungsquote').style.color = '#f87171';
  } else {
    document.getElementById('kpiBesetzungsquote').style.color = '#facc15';
  }
}
ladeKPIDashboard();
