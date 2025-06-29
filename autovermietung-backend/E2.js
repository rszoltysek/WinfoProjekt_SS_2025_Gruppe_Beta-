// Initialisierung des Supabase Clients
// ERSETZE DIESE PLATZHALTER mit deinen tatsächlichen Supabase-Informationen.
// Du findest sie in deinem Supabase-Dashboard unter "Settings" -> "API".
// Aus Sicherheitsgründen sollten diese Schlüssel in einer Produktivumgebung nicht direkt im Client-Code offengelegt,
// sondern über Umgebungsvariablen oder einen Backend-Service bereitgestellt werden.
const SUPABASE_URL = 'https://ztlyfswwfbwdmtsajvbe.supabase.co'; // Beispiel: 'https://abcdefghijk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bHlmc3d3ZmJ3ZG10c2FqdmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY5MzU2MCwiZXhwIjoyMDY2MjY5NTYwfQ.ni7lxh_V0AQMxu-eb7zxXPF0FzlnOCJEYjrplWgjZzo'; // Beispiel: 'eyJhbGciOiJIUzI1Ni...'

let utilizationChart, revenueChart;
let currentKpiDataRaw = {};
let currentStationKpiDataRaw = {};

if (typeof supabase === 'undefined') {
  alert("Supabase nicht geladen");
} else {
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let kostenData = [], fahrzeugeData = {}, vermietungenData = [], mietstationenList = [];

  async function loadAllData() {
    const tables = ['kosten', 'fahrzeuge', 'vermietungen', 'station'];
    for (const table of tables) {
      const { data } = await supabaseClient.from(table).select('*');
      if (table === 'kosten') kostenData = data || [];
      if (table === 'fahrzeuge') fahrzeugeData = (data || []).reduce((a, v) => { a[v.id] = v; return a; }, {});
      if (table === 'vermietungen') vermietungenData = data || [];
      if (table === 'station') mietstationenList = data || [];
    }
  }

  function calculateKPIs() {
    const stationMap = new Map();
    mietstationenList.forEach(station => {
      stationMap.set(station.id, {
        name: station.name,
        capacity: station.kapazitaet || 1,
        currentRentedVehicles: 0,
        totalRevenueStation: 0,
        totalRentalsStation: 0,
        totalVehiclesStation: 0,
        rentalDaysStation: 0 // Neu: Zähler für Miettage pro Station
      });
    });

    let totalRevenue = 0, totalVarCosts = 0, totalFixCosts = 0, rentalDays = 0, damageReports = 0;
    let availableVehicles = 0, totalVehicles = Object.keys(fahrzeugeData).length;

    kostenData.forEach(k => {
      if (k.period === 'yearly') {
        if (k.type === 'fixed') totalFixCosts += k.amount || 0;
        if (k.type === 'variable_general') totalVarCosts += k.amount || 0;
      }
    });

    vermietungenData.forEach(v => {
      totalRevenue += v.total_revenue || 0;
      totalVarCosts += v.variable_costs || 0;
      const d1 = new Date(v.start_date), d2 = new Date(v.end_date);
      const rentalDuration = (!isNaN(d1) && !isNaN(d2)) ? (d2 - d1) / 86400000 : 0;
      rentalDays += rentalDuration; // Gesamt-Miettage aktualisieren

      if (v.is_damage_reported) damageReports++;
      const s = stationMap.get(v.station_id);
      if (s) {
        s.totalRevenueStation += v.total_revenue || 0;
        s.totalRentalsStation++;
        s.rentalDaysStation += rentalDuration; // Miettage für diese Station erhöhen
      }
    });

    Object.values(fahrzeugeData).forEach(v => {
      if (v.verfuegbar) availableVehicles++;
      const s = stationMap.get(v.station_id);
      if (s) {
        if (!v.verfuegbar) {
          s.currentRentedVehicles++;
        }
        s.totalVehiclesStation++;
      }
    });

    const allStationKpis = Array.from(stationMap.values()).map(s => {
      const util = (s.currentRentedVehicles / s.capacity) * 100;
      const avgRentalDuration = s.totalRentalsStation > 0 ? (s.rentalDaysStation / s.totalRentalsStation) : 0; // Durchschnittliche Mietdauer pro Station
      return {
        name: s.name,
        utilization: +(util.toFixed(2)) || 0,
        revenue: +(s.totalRevenueStation.toFixed(2)),
        totalRentals: s.totalRentalsStation,
        totalVehicles: s.totalVehiclesStation,
        averageRentalDuration: +(avgRentalDuration.toFixed(2)) // Hinzufügen der durchschnittlichen Mietdauer pro Station
      };
    });

    const chartKpis = [...allStationKpis].sort((a, b) => b.revenue - a.revenue || b.utilization - a.utilization).slice(0, 5);

    const averageRentalDurationOverall = vermietungenData.length > 0 ? (rentalDays / vermietungenData.length) : 0; // Globale durchschnittliche Mietdauer

    const kpis = {
      "Gesamter Umsatz": `${totalRevenue.toFixed(2)} €`,
      "Variable Kosten": `${totalVarCosts.toFixed(2)} €`,
      "Fixkosten": `${totalFixCosts.toFixed(2)} €`,
      "Gesamtkosten": `${(totalVarCosts + totalFixCosts).toFixed(2)} €`,
      "Gewinn": `${(totalRevenue - totalVarCosts - totalFixCosts).toFixed(2)} €`,
      "Vermietungen": vermietungenData.length,
      "Miettage gesamt": Math.round(rentalDays),
      "Durchschnittliche Mietdauer": `${averageRentalDurationOverall.toFixed(2)} Tage`, // Hinzufügen der globalen durchschnittlichen Mietdauer
      "Fahrzeuge gesamt": totalVehicles,
      "Verfügbare Fahrzeuge": availableVehicles,
      "Flottenauslastung": totalVehicles > 0 ? `${(((totalVehicles - availableVehicles) / totalVehicles) * 100).toFixed(2)} %` : "0 %",
      "Schäden": damageReports
    };

    return { overallKpis: kpis, top5KpisForChart: chartKpis, allStationKpis: allStationKpis };
  }

  async function updateChartsAndKpis() {
    await loadAllData();
    const { overallKpis, top5KpisForChart, allStationKpis } = calculateKPIs();
    currentKpiDataRaw = overallKpis;
    currentStationKpiDataRaw = allStationKpis;

    const labels = top5KpisForChart.map(k => k.name);
    const util = top5KpisForChart.map(k => k.utilization);
    const rev = top5KpisForChart.map(k => k.revenue);

    const utilCanvas = document.getElementById('utilizationChartCanvas');
    const revCanvas = document.getElementById('revenueChartCanvas');
    const utilCtx = utilCanvas?.getContext('2d');
    const revCtx = revCanvas?.getContext('2d');

    if (utilCtx) {
      if (utilizationChart) {
        utilizationChart.data.labels = labels;
        utilizationChart.data.datasets[0].data = util;
        utilizationChart.update();
      } else {
        utilizationChart = new Chart(utilCtx, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Auslastung (%)', data: util, backgroundColor: '#60a5fa' }] },
          options: { responsive: true, scales: { y: { max: 100, beginAtZero: true } } }
        });
      }
    }

    if (revCtx) {
      if (revenueChart) {
        revenueChart.data.labels = labels;
        revenueChart.data.datasets[0].data = rev;
        revenueChart.update();
      } else {
        revenueChart = new Chart(revCtx, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Umsatz (€)', data: rev, backgroundColor: '#34d399' }] },
          options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
      }
    }

    const output = document.getElementById('kpi-json');
    if (output) output.textContent = JSON.stringify(overallKpis, null, 2);
  }

async function generatePdf(overallKpisToExport, stationKpisToExport) {
    // jsPDF korrekt initialisieren
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // AutoTable manuell registrieren (neue Methode)
    if (typeof doc.autoTable !== 'function') {
        // Alternative Initialisierung für Autotable
        window.jspdf_autotable_default(doc);
    }

    // Titel
    doc.setFontSize(18);
    doc.text("KPI Übersicht", 10, 20);

    let yOffset = 30;

    // Overall KPIs
    doc.setFontSize(14);
    doc.text("Gesamt-KPIs", 10, yOffset);
    yOffset += 10;

    const overallKpiHeaders = [["KPI", "Wert"]];
    const overallKpiBody = Object.entries(overallKpisToExport);

    doc.autoTable({
        startY: yOffset,
        head: overallKpiHeaders,
        body: overallKpiBody,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { 
            fillColor: [60, 157, 255], 
            textColor: [255, 255, 255] 
        },
        didDrawPage: (data) => {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(`Seite ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    yOffset = doc.lastAutoTable.finalY + 15;

    // Station-wise KPIs
    if (stationKpisToExport?.length > 0) {
        doc.setFontSize(14);
        doc.text("Stations-KPIs", 10, yOffset);
        yOffset += 10;

        const stationKpiHeaders = [
            ['Station', 'Auslastung (%)', 'Umsatz (€)', 'Vermietungen', 'Fahrzeuge', 'Ø Mietdauer']
        ];
        
        const stationKpiBody = stationKpisToExport.map(s => [
            s.name,
            s.utilization,
            s.revenue,
            s.totalRentals,
            s.totalVehicles,
            s.averageRentalDuration
        ]);

        doc.autoTable({
            startY: yOffset,
            head: stationKpiHeaders,
            body: stationKpiBody,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { 
                fillColor: [52, 211, 153], 
                textColor: [255, 255, 255] 
            },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                doc.text(`Seite ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });
    }

    doc.save("KPI_Auswertung.pdf");
}
  function generateExcel(overallKpisToExport, stationKpisToExport) {
    const wb = XLSX.utils.book_new();

    // Sheet for overall KPIs
    const wsOverall = XLSX.utils.aoa_to_sheet([["KPI", "Wert"], ...Object.entries(overallKpisToExport)]);
    XLSX.utils.book_append_sheet(wb, wsOverall, "Gesamt-KPIs");

    // Sheet for station-wise KPIs
    if (stationKpisToExport && stationKpisToExport.length > 0) {
      const stationNames = stationKpisToExport.map(s => s.name);
      const utilizationData = stationKpisToExport.map(s => s.utilization);
      const revenueData = stationKpisToExport.map(s => s.revenue);
      const totalRentalsData = stationKpisToExport.map(s => s.totalRentals);
      const totalVehiclesData = stationKpisToExport.map(s => s.totalVehicles);
      const averageRentalDurationData = stationKpisToExport.map(s => s.averageRentalDuration); // Neu: Daten für durchschnittliche Mietdauer pro Station

      const wsStationsData = [
        ['', ...stationNames],
        ['Auslastung (%)', ...utilizationData],
        ['Umsatz (€)', ...revenueData],
        ['Vermietungen gesamt', ...totalRentalsData],
        ['Fahrzeuge gesamt', ...totalVehiclesData],
        ['Durchschnittliche Mietdauer (Tage)', ...averageRentalDurationData] // Hinzufügen der neuen Zeile
      ];
      const wsStations = XLSX.utils.aoa_to_sheet(wsStationsData);
      XLSX.utils.book_append_sheet(wb, wsStations, "Stations-KPIs");
    }

    XLSX.writeFile(wb, "KPI_Auswertung.xlsx");
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateChartsAndKpis();
    document.getElementById("refreshButton")?.addEventListener("click", updateChartsAndKpis);
    document.getElementById("downloadPdf")?.addEventListener("click", () => generatePdf(currentKpiDataRaw));
    document.getElementById("downloadExcel")?.addEventListener("click", () => generateExcel(currentKpiDataRaw, currentStationKpiDataRaw));
  });
}
