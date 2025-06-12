const fs = require('fs');
const path = require('path');


/**
 * Liest eine JSON-Datei. Wenn die Datei nicht existiert oder leer ist,
 * wird eine Standarddatei mit den gegebenen Standarddaten erstellt.
 * @param {string} filePath - Der Pfad zur JSON-Datei.
 * @param {object | Array} defaultData - Die Standarddaten, die erstellt werden sollen, wenn die Datei fehlt.
 * @returns {Promise<object | Array>} - Die geparsten JSON-Daten.
 */
async function loadJsonFile(filePath, defaultData) {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    if (!data.trim()) { // Prüft, ob die Datei leer ist
      console.warn(`WARNUNG: Die Datei ${filePath} ist leer. Erzeuge Standarddaten.`);
      await fs.promises.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`WARNUNG: Datei ${filePath} nicht gefunden. Erzeuge neue Datei mit Standarddaten.`);
      await fs.promises.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    } else {
      console.error(`FEHLER beim Laden von ${filePath}:`, error);
      // Wenn die Datei korrupt ist, versuchen wir, sie zu überschreiben
      console.warn(`WARNUNG: Datei ${filePath} ist möglicherweise korrupt. Überschreibe mit Standarddaten.`);
      await fs.promises.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
  }
}

/**
 * Speichert Daten in eine JSON-Datei.
 * @param {string} filePath - Der Pfad zur JSON-Datei.
 * @param {object | Array} data - Die zu speichernden Daten.
 */
async function saveJsonFile(filePath, data) {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Daten erfolgreich in ${filePath} gespeichert.`);
  } catch (error) {
    console.error(`FEHLER beim Speichern von ${filePath}:`, error);
  }
}

/**
 * Berechnet die KPIs für jede Mietstation.
 * @param {Array<object>} mietstationen - Array der Mietstationen.
 * @param {Array<object>} fahrzeuge - Array der Fahrzeuge.
 * @param {Array<object>} vermietungen - Array der Vermietungen.
 * @param {Array<object>} kosten - Array der Kosten (fix und variabel_general).
 * @returns {object} Ein Objekt mit KPIs pro Station.
 */
function calculateKpis(mietstationen, fahrzeuge, vermietungen, kosten) {
  const kpisByStation = {};

  // Initialisiere KPIs für jede Station
  mietstationen.forEach(station => {
    kpisByStation[station.id] = {
      name: station.name,
      totalRevenue: 0,
      totalVariableCosts: 0,
      totalProfit: 0,
      totalRentalDays: 0,
      totalFleetCapacityDays: 0,
      totalVehicles: 0,
      rentalsCount: 0,
      damagedRentalsCount: 0
    };
  });

  // Aggregiere Fahrzeugdaten pro Station
  const vehiclesByStation = fahrzeuge.reduce((acc, vehicle) => {
    if (!acc[vehicle.stationId]) {
      acc[vehicle.stationId] = [];
    }
    acc[vehicle.stationId].push(vehicle);
    return acc;
  }, {});

  // Verarbeite Vermietungen
  vermietungen.forEach(rental => {
    const stationKpis = kpisByStation[rental.stationId];
    if (stationKpis) {
      stationKpis.totalRevenue += rental.totalRevenue || 0;
      stationKpis.totalVariableCosts += rental.variableCosts || 0;
      stationKpis.rentalsCount++;

      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 um den Endtag einzuschließen
      stationKpis.totalRentalDays += rentalDays;

      if (rental.isDamageReported) {
        stationKpis.damagedRentalsCount++;
      }
    }
  });

  // Berechne weitere stationenspezifische KPIs
  Object.keys(kpisByStation).forEach(stationId => {
    const stationKpis = kpisByStation[stationId];
    const stationVehicles = vehiclesByStation[stationId] || [];
    stationKpis.totalVehicles = stationVehicles.length;

    // Annahme: Eine Fahrzeugkapazität wird über ein Jahr berechnet (365 Tage)
    // Realistischer wäre, wenn man die Verfügbarkeit der Fahrzeuge im Zeitverlauf trackt.
    // Da wir keine Zeitstempel in Fahrzeugen oder eine detaillierte Verfügbarkeitsplanung haben,
    // nehmen wir eine einfache Pauschale an.
    const availableDaysPerVehicle = 365; // Tage pro Jahr, die ein Fahrzeug maximal verfügbar sein könnte
    stationKpis.totalFleetCapacityDays = stationKpis.totalVehicles * availableDaysPerVehicle;

    // Finanzielle Kennziffern
    stationKpis.totalProfit = stationKpis.totalRevenue - stationKpis.totalVariableCosts;

    // Operative Kennziffern
    stationKpis.occupancyRate = stationKpis.totalFleetCapacityDays > 0
      ? (stationKpis.totalRentalDays / stationKpis.totalFleetCapacityDays) * 100
      : 0;

    stationKpis.avgRentalDuration = stationKpis.rentalsCount > 0
      ? stationKpis.totalRentalDays / stationKpis.rentalsCount
      : 0;
    
    stationKpis.revenuePerVehicle = stationKpis.totalVehicles > 0
      ? stationKpis.totalRevenue / stationKpis.totalVehicles
      : 0;

    // Kundenbezogene Kennziffern (rudimentär ohne Kunden-Tracking, nur Schadensquote)
    stationKpis.damageRate = stationKpis.rentalsCount > 0
      ? (stationKpis.damagedRentalsCount / stationKpis.rentalsCount) * 100
      : 0;
  });

  // Berücksichtige globale fixe Kosten (verteilen wir nicht pro Station, da es nicht angefragt wurde)
  // oder nur globale aggregierte Werte
  let totalFixedCosts = 0;
  let totalGeneralVariableCosts = 0;
  kosten.forEach(cost => {
    if (cost.type === 'fixed') {
      totalFixedCosts += cost.amount;
    } else if (cost.type === 'variable_general') {
      totalGeneralVariableCosts += cost.amount;
    }
  });

  // Diese globalen Kosten können dann vom Gesamtprofit des Unternehmens abgezogen werden,
  // aber für stationsspezifische KPIs fokussieren wir uns auf den Deckungsbeitrag.
  // Wenn der Gesamtprofit des Unternehmens gefragt wäre, müsste man hier weiterrechnen.

  return kpisByStation;
}

/**
 * Generiert die Top 3 Mietstationen nach einem finanziellen KPI.
 * @param {object} kpisByStation - KPIs für jede Station.
 * @param {string} sortBy - Der KPI-Name, nach dem sortiert werden soll (z.B. 'totalProfit').
 * @returns {Array<object>} Die Top 3 Stationen.
 */
function getTop3Stations(kpisByStation, sortBy = 'totalProfit') {
  const sortedStations = Object.values(kpisByStation).sort((a, b) => b[sortBy] - a[sortBy]);
  return sortedStations.slice(0, 3);
}

/**
 * Aktualisiert die performance.html Datei mit den berechneten KPIs.
 * @param {string} htmlPath - Pfad zur performance.html Datei.
 * @param {object} kpisByStation - Die berechneten KPIs pro Station.
 * @param {Array<object>} top3Stations - Die Top 3 Mietstationen.
 */
async function updatePerformanceHtml(htmlPath, kpisByStation, top3Stations) {
  try {
    let htmlContent = await fs.promises.readFile(htmlPath, 'utf8');

    // Ersetze die existierenden Chart.js Daten (falls vorhanden) mit Platzhaltern oder leeren Werten
    // Da wir die Charts nicht direkt im Node.js neu generieren können, fügen wir eine neue Sektion hinzu
    // oder passen einen vorhandenen Abschnitt an, um die Top 3 anzuzeigen.

    // Suche nach dem End-Tag des <main>-Elements oder füge es am Ende des body ein
    const mainEndTag = '</main>';
    const bodyEndTag = '</body>';
    let insertionPoint = htmlContent.indexOf(mainEndTag);

    let newContent = '';

    // Tabelle für Top 3 Stationen
    if (top3Stations.length > 0) {
      newContent += `
        <section class="card mt-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-100">Top 3 Mietstationen (nach Gewinn)</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full bg-gray-800 rounded-lg shadow-md">
              <thead>
                <tr class="bg-gray-700 text-gray-200 uppercase text-sm leading-normal">
                  <th class="py-3 px-6 text-left">Station</th>
                  <th class="py-3 px-6 text-right">Gesamtumsatz (€)</th>
                  <th class="py-3 px-6 text-right">Gesamtgewinn (€)</th>
                  <th class="py-3 px-6 text-right">Auslastung (%)</th>
                  <th class="py-3 px-6 text-right">Ø Mietdauer (Tage)</th>
                </tr>
              </thead>
              <tbody class="text-gray-300 text-sm font-light">
      `;
      top3Stations.forEach(station => {
        newContent += `
                <tr class="border-b border-gray-700 hover:bg-gray-700">
                  <td class="py-3 px-6 text-left whitespace-nowrap">${station.name}</td>
                  <td class="py-3 px-6 text-right">${station.totalRevenue.toFixed(2)}</td>
                  <td class="py-3 px-6 text-right">${station.totalProfit.toFixed(2)}</td>
                  <td class="py-3 px-6 text-right">${station.occupancyRate.toFixed(2)}</td>
                  <td class="py-3 px-6 text-right">${station.avgRentalDuration.toFixed(2)}</td>
                </tr>
        `;
      });
      newContent += `
              </tbody>
            </table>
          </div>
        </section>
      `;
    } else {
      newContent += `
        <section class="card mt-8">
          <h2 class="text-2xl font-semibold mb-4 text-gray-100">Top 3 Mietstationen</h2>
          <p class="text-gray-400">Keine Daten verfügbar, um Top-Stationen zu berechnen.</p>
        </section>
      `;
    }

    // Füge die Sektion entweder vor dem Ende von <main> oder, falls <main> nicht gefunden, vor dem Ende von <body> ein
    if (insertionPoint !== -1) {
      htmlContent = htmlContent.substring(0, insertionPoint) + newContent + htmlContent.substring(insertionPoint);
    } else {
      insertionPoint = htmlContent.indexOf(bodyEndTag);
      if (insertionPoint !== -1) {
        htmlContent = htmlContent.substring(0, insertionPoint) + newContent + htmlContent.substring(insertionPoint);
      } else {
        htmlContent += newContent; // Fallback: einfach am Ende anhängen
      }
    }

    await fs.promises.writeFile(htmlPath, htmlContent, 'utf8');
    console.log(`performance.html erfolgreich aktualisiert.`);

  } catch (error) {
    console.error(`FEHLER beim Aktualisieren von performance.html:`, error);
  }
}


/**
 * Hauptfunktion zum Ausführen der KPI-Berechnung und HTML-Aktualisierung.
 */
async function main() {
  const mietstationenFilePath = path.join(__dirname, 'data.json');
  const fahrzeugeFilePath = path.join(__dirname, 'fahrzeuge.json');
  const fahrzeugtypenFilePath = path.join(__dirname, 'fahrzeugtypen.json');
  const vermietungenFilePath = path.join(__dirname, 'vermietungen.json'); // Neu erzeugte Datei
  const kostenFilePath = path.join(__dirname, 'kosten.json'); // Neu erzeugte Datei
  const performanceHtmlPath = path.join(__dirname, 'performance.html'); // Pfad zur HTML-Datei

  // Lade alle benötigten JSON-Dateien
  const mietstationenData = await loadJsonFile(mietstationenFilePath, defaultMietstationen);
  const fahrzeugeData = await loadJsonFile(fahrzeugeFilePath, defaultFahrzeuge);
  const fahrzeugtypenData = await loadJsonFile(fahrzeugtypenFilePath, defaultFahrzeugtypen);
  const vermietungenData = await loadJsonFile(vermietungenFilePath, defaultVermietungen);
  const kostenData = await loadJsonFile(kostenFilePath, defaultKosten);


  // Stelle sicher, dass die Datenobjekte korrekt sind (z.B. Array für vermietungen)
  const mietstationen = mietstationenData.mietstationen || [];
  const fahrzeuge = fahrzeugeData.fahrzeuge || [];
  const vermietungen = vermietungenData || []; // vermietungenData ist bereits ein Array
  const kosten = kostenData || []; // kostenData ist bereits ein Array

  // Berechne KPIs
  const kpis = calculateKpis(mietstationen, fahrzeuge, vermietungen, kosten);

  // Erhalte die Top 3 Stationen nach Gewinn
  const top3Stations = getTop3Stations(kpis, 'totalProfit');

  console.log('\n--- Berechnete KPIs pro Station ---');
  console.log(JSON.stringify(kpis, null, 2));

  console.log('\n--- Top 3 Mietstationen nach Gewinn ---');
  top3Stations.forEach(s => console.log(`${s.name}: ${s.totalProfit.toFixed(2)}€ Gewinn`));

  // Aktualisiere die HTML-Datei
  await updatePerformanceHtml(performanceHtmlPath, kpis, top3Stations);

  console.log('\nAlle Operationen abgeschlossen.');
}

// Führe die Hauptfunktion aus
main();