document.addEventListener('DOMContentLoaded', async () => {
  const downloadPdfButton = document.getElementById('downloadPdf');
  const downloadExcelButton = document.getElementById('downloadExcel');
  const aktualisierenButton = document.getElementById('aktualisieren');
  const kpiOutput = document.getElementById('kpi-json');

  let kostenData = [];
  let fahrzeugeData = {};
  let fahrzeugTypenData = {};
  let vermietungenData = [];
  let mietstationenData = {};
  let mietstationenList = [];

  // ========== Supabase-kompatibles fetchJson ==========
  async function fetchJson(apiEndpoint) {
    try {
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${apiEndpoint}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${apiEndpoint}:`, error);
      return null;
    }
  }

  // ========== Daten laden über API ==========
  async function loadAllData() {
    // Kosten
    kostenData = await fetchJson('/api/kosten') || [];

    // Fahrzeuge
    const fahrzeugeRaw = await fetchJson('/api/fahrzeuge');
    if (Array.isArray(fahrzeugeRaw)) {
      fahrzeugeData = fahrzeugeRaw.reduce((acc, vehicle) => {
        acc[vehicle.id] = vehicle;
        return acc;
      }, {});
    }

    // Fahrzeugtypen
    const fahrzeugTypenRaw = await fetchJson('/api/fahrzeugtypen');
    if (Array.isArray(fahrzeugTypenRaw)) {
      fahrzeugTypenData = fahrzeugTypenRaw.reduce((acc, type) => {
        acc[type.id] = type;
        return acc;
      }, {});
    }

    // Vermietungen
    vermietungenData = await fetchJson('/api/vermietungen') || [];

    // Mietstationen
    const mietstationenRaw = await fetchJson('/api/mietstationen');
    if (Array.isArray(mietstationenRaw)) {
      mietstationenData = mietstationenRaw.reduce((acc, station) => {
        acc[station.id] = station;
        return acc;
      }, {});
      mietstationenList = mietstationenRaw;
    }
  }

  // ========== KPI-Berechnung ==========
  function calculateKPIs() {
    if (!vermietungenData.length || !Object.keys(fahrzeugeData).length || !Object.keys(mietstationenData).length || !kostenData.length) {
      console.error("Daten nicht vollständig geladen.");
      return {};
    }
    let totalRevenue = 0;
    let totalVariableCosts = 0;
    let totalFixedCosts = 0;
    let totalProfit = 0;
    let totalRentals = vermietungenData.length;
    let vehiclesWithDamage = 0;
    let totalRentalDays = 0;
    let totalVehicles = Object.keys(fahrzeugeData).length;
    let availableVehicles = 0;
    let totalDamageReports = 0;

    // Charts
    const rentalCountsByStation = {};
    const revenueByStation = {};
    const revenueByMonth = {};
    const revenueByVehicleType = {};
    const damageReportedCounts = { true: 0, false: 0 };

    // Station-Init
    for (const stationId in mietstationenData) {
      rentalCountsByStation[mietstationenData[stationId].name] = 0;
      revenueByStation[mietstationenData[stationId].name] = 0;
    }

    // Kosten (fix/variabel)
    kostenData.forEach(cost => {
      if (cost.period === 'yearly') {
        if (cost.type === 'fixed') {
          totalFixedCosts += cost.amount;
        } else if (cost.type === 'variable_general') {
          totalVariableCosts += cost.amount;
        }
      }
    });

    // Vermietungen
    vermietungenData.forEach(rental => {
      totalRevenue += rental.totalRevenue || 0;
      totalVariableCosts += rental.variableCosts || 0;
      totalRentalDays += (new Date(rental.endDate) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24);
      if (rental.isDamageReported) {
        totalDamageReports++;
      }
    });

    // Fahrzeuge
    for (const vehicleId in fahrzeugeData) {
      if (fahrzeugeData[vehicleId].verfuegbar) {
        availableVehicles++;
      }
    }

    // KPIs
    const kpis = {
      "Gesamter Umsatz": `${totalRevenue.toFixed(2)} €`,
      "Gesamte variable Kosten": `${totalVariableCosts.toFixed(2)} €`,
      "Gesamte Fixkosten (jährlich)": `${totalFixedCosts.toFixed(2)} €`,
      "Gesamtkosten": `${(totalVariableCosts + totalFixedCosts).toFixed(2)} €`,
      "Gewinn (Umsatz - Gesamtkosten)": `${(totalRevenue - (totalVariableCosts + totalFixedCosts)).toFixed(2)} €`,
      "Anzahl der Vermietungen": vermietungenData.length,
      "Gesamtzahl der Miettage": Math.round(totalRentalDays),
        "Durchschnittlicher Umsatz pro Miettag": totalRentalDays > 0 ? `${(totalRevenue / totalRentalDays).toFixed(2)} €` : "0.00 €",
      "Anzahl Fahrzeuge im Fuhrpark": totalVehicles,
      "Verfügbare Fahrzeuge": availableVehicles,
      "Auslastungsrate der Flotte": totalVehicles > 0 ? `${((totalVehicles - availableVehicles) / totalVehicles * 100).toFixed(2)} %` : "0.00 %",
      "Anzahl gemeldeter Schäden": totalDamageReports,
      "Schadensrate (pro Vermietung)": vermietungenData.length > 0 ? `${(totalDamageReports / vermietungenData.length * 100).toFixed(2)} %` : "0.00 %",
      "Durchschnittliche Mieteinnahmen pro Fahrzeug": totalVehicles > 0 ? `${(totalRevenue / totalVehicles).toFixed(2)} €` : "0.00 €",
      "Fahrzeug mit den höchsten Einnahmen (ID)": getTopPerformingVehicleId(),
      "Station mit den meisten Vermietungen (ID)": getTopStationByRentalsId(),
      "Durchschnittliche Vermietungsdauer (Tage)": vermietungenData.length > 0 ? `${(totalRentalDays / vermietungenData.length).toFixed(2)} Tage` : "0.00 Tage",
    };
    return kpis;
  }

  function getTopPerformingVehicleId() {
    const vehicleRevenue = {};
    vermietungenData.forEach(rental => {
      if (vehicleRevenue[rental.fahrzeugId]) {
        vehicleRevenue[rental.fahrzeugId] += rental.totalRevenue;
      } else {
        vehicleRevenue[rental.fahrzeugId] = rental.totalRevenue;
      }
    });
    let topVehicleId = null;
    let maxRevenue = 0;
    for (const id in vehicleRevenue) {
      if (vehicleRevenue[id] > maxRevenue) {
        maxRevenue = vehicleRevenue[id];
        topVehicleId = id;
      }
    }
    return topVehicleId || "N/A";
  }

  function getTopStationByRentalsId() {
    const stationRentalCounts = {};
    vermietungenData.forEach(rental => {
      if (stationRentalCounts[rental.stationId]) {
        stationRentalCounts[rental.stationId]++;
      } else {
        stationRentalCounts[rental.stationId] = 1;
      }
    });
    let topStationId = null;
    let maxRentals = 0;
    for (const id in stationRentalCounts) {
      if (stationRentalCounts[id] > maxRentals) {
        maxRentals = stationRentalCounts[id];
        topStationId = id;
      }
    }
    return topStationId || "N/A";
  }

  // ========== PDF Generation ==========
  async function generatePdf(kpis) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("KPI Auswertung der Fahrzeugflotte", 10, 20);
    doc.setFontSize(12);
    let y = 40;
    for (const key in kpis) {
      doc.text(`${key}: ${kpis[key]}`, 10, y);
      y += 10;
    }
    doc.save("KPI_Auswertung.pdf");
  }

  // ========== Excel Generation ==========
  function generateExcel(kpis) {
    const ws_data = [
      ["KPI", "Wert"]
    ];
    for (const key in kpis) {
      ws_data.push([key, kpis[key]]);
    }
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KPIs");
    XLSX.writeFile(wb, "KPI_Auswertung.xlsx");
  }

  // ========== Events ==========
  if (downloadPdfButton) downloadPdfButton.addEventListener('click', async () => {
    const kpis = calculateKPIs();
    await generatePdf(kpis);
  });
  if (downloadExcelButton) downloadExcelButton.addEventListener('click', () => {
    const kpis = calculateKPIs();
    generateExcel(kpis);
  });
  if (aktualisierenButton) aktualisierenButton.addEventListener('click', async () => {
    await loadAllData();
    const kpis = calculateKPIs();
    kpiOutput.textContent = JSON.stringify(kpis, null, 2);
  });

  // ========== Initialisierung ==========
  await loadAllData();
  const initialKpis = calculateKPIs();
  kpiOutput.textContent = JSON.stringify(initialKpis, null, 2);
});
