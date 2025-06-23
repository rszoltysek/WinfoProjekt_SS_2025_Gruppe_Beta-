document.addEventListener('DOMContentLoaded', async () => {
    const downloadPdfButton = document.getElementById('downloadPdf');
    const downloadExcelButton = document.getElementById('downloadExcel');
    const kpiOutput = document.getElementById('kpi-json');

    let kostenData = [];
    let fahrzeugeData = {}; // Object to store vehicles by ID for easy lookup
    let fahrzeugTypenData = {}; // Object to store vehicle types by ID
    let vermietungenData = [];
    let mietstationenData = {}; // Object to store stations by ID

    // Function to fetch JSON data
    async function fetchJson(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${filename}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${filename}:`, error);
            return null;
        }
    }

    // Load all JSON data
    async function loadAllData() {
        // Load kosten.json
        kostenData = await fetchJson('data/kosten.json');
        if (kostenData) {
            console.log('Kosten Data:', kostenData);
        }

        // Load fahrzeuge.json
        const fahrzeugeRaw = await fetchJson('data/fahrzeuge.json');
        if (fahrzeugeRaw && fahrzeugeRaw.fahrzeuge) {
            fahrzeugeData = fahrzeugeRaw.fahrzeuge.reduce((acc, vehicle) => {
                acc[vehicle.id] = vehicle;
                return acc;
            }, {});
            console.log('Fahrzeuge Data (processed):', fahrzeugeData);
        }

        // Load fahrzeugtypen.json
        const fahrzeugTypenRaw = await fetchJson('data/fahrzeugtypen.json');
        if (fahrzeugTypenRaw && fahrzeugTypenRaw.typen) {
            fahrzeugTypenData = fahrzeugTypenRaw.typen.reduce((acc, type) => {
                acc[type.id] = type;
                return acc;
            }, {});
            console.log('Fahrzeugtypen Data (processed):', fahrzeugTypenData);
        }

        // Load vermietungen.json
        vermietungenData = await fetchJson('data/vermietungen.json');
        if (vermietungenData) {
            console.log('Vermietungen Data:', vermietungenData);
        }

        // Load data (1).json (mietstationen)
        const mietstationenRaw = await fetchJson('data/data.json');
        if (mietstationenRaw && mietstationenRaw.mietstationen) {
            mietstationenData = mietstationenRaw.mietstationen.reduce((acc, station) => {
                acc[station.id] = station;
                return acc;
            }, {});
            console.log('Mietstationen Data (processed):', mietstationenData);
        }
    }

    // --- KPI Calculation Functions ---
    function calculateKPIs() {
        let totalRevenue = 0;
        let totalVariableCosts = 0;
        let totalFixedCosts = 0;
        let totalRentalDays = 0;
        let totalVehicles = Object.keys(fahrzeugeData).length;
        let availableVehicles = 0;
        let totalDamageReports = 0;

        // Calculate total fixed and general variable costs from kosten.json
        kostenData.forEach(cost => {
            if (cost.period === 'yearly') {
                if (cost.type === 'fixed') {
                    totalFixedCosts += cost.amount;
                } else if (cost.type === 'variable_general') {
                    // Assuming 'Marketingkosten' is a general variable cost not tied to individual rentals
                    totalVariableCosts += cost.amount;
                }
            }
            // Add logic for other periods if necessary (e.g., monthly costs converted to yearly)
        });

        // Calculate metrics from vermietungen.json
        vermietungenData.forEach(rental => {
            totalRevenue += rental.totalRevenue;
            totalVariableCosts += rental.variableCosts; // Variable costs per rental
            totalRentalDays += (new Date(rental.endDate) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24);
            if (rental.isDamageReported) {
                totalDamageReports++;
            }
        });

        // Calculate available vehicles
        for (const vehicleId in fahrzeugeData) {
            if (fahrzeugeData[vehicleId].verfuegbar) {
                availableVehicles++;
            }
        }

        // --- Proposed KPIs ---
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


    // --- PDF Generation ---
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

    // --- Excel Generation ---
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

    // Event Listeners for buttons
    downloadPdfButton.addEventListener('click', async () => {
        const kpis = calculateKPIs();
        await generatePdf(kpis);
    });

    downloadExcelButton.addEventListener('click', () => {
        const kpis = calculateKPIs();
        generateExcel(kpis);
    });

    // Initial load of data and display KPIs
    await loadAllData();
    const initialKpis = calculateKPIs();
    kpiOutput.textContent = JSON.stringify(initialKpis, null, 2);
});
