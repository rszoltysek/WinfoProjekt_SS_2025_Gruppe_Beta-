/**
 * // ID´s müssen angepasst werden, damit sie mit dem HTML übereinstimmen 
    * // und die Daten aus der data.json geladen werden können. 
 * @file script.js
 * @description Dieses Skript definiert die Kernlogik zur Verwaltung und Berechnung von Leistungskennzahlen (KPIs)
 * für Mietstationen. Es ruft Daten von einem Node.js-Backend ab und erstellt ein Dashboard
 * zur Visualisierung dieser Daten.
 */

// --- Hilfsfunktion für Nachrichtenanzeige (ersetzt alert()) ---
/**
 * Zeigt eine temporäre Nachricht in einem Nachrichtenfeld an.
 * @param {string} message - Die anzuzeigende Nachricht.
 * @param {string} type - Der Typ der Nachricht ('success', 'error', 'info').
 */
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');

    messageText.textContent = message;
    messageBox.className = `fixed bottom-4 right-4 p-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} block`;

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000); // Nachricht verschwindet nach 3 Sekunden
}


// --- E2.1 Leistungskennziffern definieren ---

/**
 * Klasse zur Definition einer Leistungskennziffer (KPI).
 * Ermöglicht die Festlegung von Name, Beschreibung, Einheit und der Berechnungsformel.
 */
class KPI {
    /**
     * Erstellt eine Instanz von KPI.
     * @param {string} id - Eine eindeutige ID für den KPI (z.B. 'utilization_by_car_type').
     * @param {string} name - Der Anzeigename des KPI (z.B. 'Auslastung nach Fahrzeugtyp').
     * @param {string} description - Eine detaillierte Beschreibung des KPI.
     * @param {string} unit - Die Einheit des KPI (z.B. '%', '€', 'Tage', 'Anzahl').
     * @param {function(Array<Object>, Object): number} calculationFunction - Eine Funktion, die die KPI berechnet.
     * Sie erhält die Rohdaten (Buchungsdaten, Schadensdaten etc.) und optional zusätzliche Parameter (z.B. Fahrzeugtyp)
     * und gibt den berechneten Wert zurück.
     * @param {string[]} categories - Eine Liste von Kategorien, zu denen dieser KPI gehört (z.B. ['Auslastung', 'Fahrzeuge']).
     * @param {string} [group='Allgemein'] - Die Gruppe, zu der dieser KPI gehört.
     */
    constructor(id, name, description, unit, calculationFunction, categories = [], group = 'Allgemein') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.unit = unit;
        this.calculationFunction = calculationFunction;
        this.categories = categories;
        this.group = group;
    }
}

/**
 * Ein Singleton-Objekt zur Verwaltung aller definierten KPIs.
 * Ermöglicht das Hinzufügen, Abrufen und Gruppieren von KPIs.
 */
const kpiDefinitions = {
    _kpis: {}, // Internes Objekt zur Speicherung der KPIs, Schlüssel ist die KPI-ID

    /**
     * Fügt einen neuen KPI zur Definition hinzu.
     * @param {KPI} kpi - Die zu definierende KPI-Instanz.
     */
    addKPI: function(kpi) {
        if (!(kpi instanceof KPI)) {
            console.error("Fehler: Das hinzugefügte Element ist keine KPI-Instanz.");
            return;
        }
        if (this._kpis[kpi.id]) {
            console.warn(`Warnung: KPI mit ID '${kpi.id}' existiert bereits und wird überschrieben.`);
        }
        this._kpis[kpi.id] = kpi;
    },

    /**
     * Ruft einen KPI anhand seiner ID ab.
     * @param {string} id - Die ID des abzurufenden KPI.
     * @returns {KPI|undefined} Die KPI-Instanz oder undefined, falls nicht gefunden.
     */
    getKPI: function(id) {
        return this._kpis[id];
    },

    /**
     * Ruft alle definierten KPIs ab.
     * @returns {KPI[]} Ein Array aller KPI-Instanzen.
     */
    getAllKPIs: function() {
        return Object.values(this._kpis);
    },

    /**
     * Ruft KPIs basierend auf einer Kategorie ab.
     * @param {string} categoryName - Der Name der Kategorie.
     * @returns {KPI[]} Ein Array von KPIs, die dieser Kategorie zugeordnet sind.
     */
    getKPIsByCategory: function(categoryName) {
        return this.getAllKPIs().filter(kpi => kpi.categories.includes(categoryName));
    },

    /**
     * Ruft KPIs basierend auf einer Gruppe ab.
     * @param {string} groupName - Der Name der Gruppe.
     * @returns {KPI[]} Ein Array von KPIs, die dieser Gruppe zugeordnet sind.
     */
    getKPIsByGroup: function(groupName) {
        return this.getAllKPIs().filter(kpi => kpi.group === groupName);
    }
};

// Beispiel: Definition von KPIs
kpiDefinitions.addKPI(new KPI(
    'utilization_by_car_type',
    'Auslastung der Mietstation (nach Fahrzeugtyp)',
    'Zeigt die prozentuale Auslastung der Fahrzeuge einer bestimmten Kategorie pro Mietstation an.',
    '%',
    (data, params) => {
        // data enthält bookingData und stationFleetData
        const { bookingData, stationFleetData } = data;
        const { stationId, carType } = params;

        if (!stationId || !carType || !stationFleetData[stationId] || typeof stationFleetData[stationId][carType] === 'undefined') {
            console.warn(`Für die Auslastungsberechnung fehlen Parameter oder Flottendaten für Station '${stationId}', Fahrzeugtyp '${carType}'.`);
            return 0; // Oder ein geeigneter Fehlerwert
        }

        const totalAvailableCars = stationFleetData[stationId][carType];

        // Filtert Buchungen für die spezifische Station und den Fahrzeugtyp im Zeitraum.
        // In einer echten Anwendung müsste hier die genaue Dauer der Anmietung
        // über den Zeitraum berücksichtigt werden (z.B. Tage belegt / Tage verfügbar).
        // Hier vereinfacht: Anzahl der Buchungen, die in den Zeitraum fallen.
        const relevantBookings = bookingData.filter(booking =>
            booking.stationId === stationId && booking.carType === carType
        );

        // Eine genauere Berechnung der Auslastung würde die Summe der Miettage
        // im Verhältnis zur Summe der verfügbaren Tage für den Fahrzeugtyp berechnen.
        // Für dieses Beispiel verwenden wir eine vereinfachte Zählung der Buchungen.
        const bookedCarsCount = relevantBookings.length; // Vereinfacht: Anzahl der Buchungen

        return totalAvailableCars > 0 ? (bookedCarsCount / totalAvailableCars) * 100 : 0;
    },
    ['Auslastung', 'Fahrzeuge'],
    'Operative KPIs'
));

kpiDefinitions.addKPI(new KPI(
    'revenue_per_station',
    'Umsatz pro Mietstation',
    'Gesamter Mietumsatz, generiert pro Mietstation.',
    '€',
    (data, params) => {
        const { bookingData } = data;
        const { stationId } = params;
        if (!stationId) {
            console.warn("Für die Umsatzberechnung fehlt der Parameter stationId.");
            return 0;
        }
        const stationRevenue = bookingData
            .filter(booking => booking.stationId === stationId)
            .reduce((sum, booking) => sum + (booking.price || 0), 0); // Annahme: Buchung hat 'price' Eigenschaft
        return stationRevenue;
    },
    ['Finanzen', 'Umsatz'],
    'Finanzielle KPIs'
));

kpiDefinitions.addKPI(new KPI(
    'average_rental_duration',
    'Durchschnittliche Mietdauer',
    'Die durchschnittliche Dauer aller Anmietungen an einer Station in Tagen.',
    'Tage',
    (data, params) => {
        const { bookingData } = data;
        const { stationId } = params;
        if (!stationId) {
            console.warn("Für die Mietdauerberechnung fehlt der Parameter stationId.");
            return 0;
        }
        const stationBookings = bookingData.filter(booking => booking.stationId === stationId);
        if (stationBookings.length === 0) return 0;

        const totalDuration = stationBookings.reduce((sum, booking) => {
            // Annahme: booking.startDate und booking.endDate sind Date-Objekte oder parsable Strings
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime()); // getTime() für Millisekunden
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Millisekunden in Tage umrechnen
            return sum + diffDays;
        }, 0);
        return totalDuration / stationBookings.length;
    },
    ['Servicequalität']
));

kpiDefinitions.addKPI(new KPI(
    'damages_per_station',
    'Anzahl der Schäden pro Mietstation',
    'Die Gesamtzahl der gemeldeten Schäden pro Mietstation.',
    'Anzahl',
    (data, params) => {
        const { damageData } = data; // damageData wäre hier ein separates Dataset
        const { stationId } = params;
        if (!stationId) {
            console.warn("Für die Schadensanzahl fehlt der Parameter stationId.");
            return 0;
        }
        // Annahme: damageData ist ein Array von Schadensobjekten, z.B. { stationId: 'A', damageType: 'Kratzer' }
        const stationDamages = damageData.filter(damage => damage.stationId === stationId);
        return stationDamages.length;
    },
    ['Qualität', 'Schäden']
));


// --- E2.2 Leistungskennziffern der einzelnen Mietstationen auswerten ---

/**
 * Ruft Daten vom Node.js-Backend ab.
 * @returns {Object} Ein Objekt, das die abgerufenen Buchungs-, Schadens- und Flottendaten enthält.
 */
async function fetchDataFromBackend() {
    try {
        // Ruft Mietstationen ab (aus data.json)
        const stationsResponse = await fetch('http://localhost:3000/api/stations');git
        const mietstationen = await stationsResponse.json();

        // Ruft simulierte Buchungsdaten ab
        const bookingsResponse = await fetch('http://localhost:3000/api/bookings');
        const simulatedBookingData = await bookingsResponse.json();

        // Ruft simulierte Schadensdaten ab
        const damagesResponse = await fetch('http://localhost:3000/api/damages');
        const simulatedDamageData = await damagesResponse.json();

        // Ruft simulierte Flottendaten ab
        const fleetResponse = await fetch('http://localhost:3000/api/fleet');
        const simulatedStationFleetData = await fleetResponse.json();

        return { mietstationen, simulatedBookingData, simulatedDamageData, simulatedStationFleetData };
    } catch (error) {
        console.error("Fehler beim Abrufen der Daten vom Backend:", error);
        showMessage("Fehler beim Laden der Daten vom Server. Bitte stellen Sie sicher, dass der Node.js-Server läuft.", 'error');
        return { mietstationen: [], simulatedBookingData: [], simulatedDamageData: [], simulatedStationFleetData: {} };
    }
}

/**
 * Berechnet alle definierten KPIs für eine gegebene Mietstation über einen bestimmten Zeitraum.
 * @param {string} stationId - Die ID der Mietstation.
 * @param {Object} rawData - Die importierten Rohdaten (Buchungen, Schäden, Flotte).
 * @param {Date} [startDate] - Der Beginn des Auswertungszeitraums.
 * @param {Date} [endDate] - Das Ende des Auswertungszeitraums.
 * @returns {Object} Ein Objekt, das die berechneten KPI-Werte für die Station enthält.
 */
function calculateKPIsForStation(stationId, rawData, startDate, endDate) {
    const calculatedKPIs = {};
    const kpisToCalculate = kpiDefinitions.getAllKPIs();

    // Filter Buchungsdaten nach Zeitraum
    const filteredBookingData = rawData.simulatedBookingData.filter(booking => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        const periodStart = startDate || new Date('1970-01-01');
        const periodEnd = endDate || new Date('2100-01-01');

        // Eine Buchung ist relevant, wenn sie den Zeitraum überlappt
        return (bookingEnd >= periodStart && bookingStart <= periodEnd);
    });

    // Filter Schadensdaten nach Zeitraum
    const filteredDamageData = rawData.simulatedDamageData.filter(damage => {
        const damageDate = new Date(damage.date);
        const periodStart = startDate || new Date('1970-01-01');
        const periodEnd = endDate || new Date('2100-01-01');
        return (damageDate >= periodStart && damageDate <= periodEnd);
    });

    // Datenobjekt für die KPI-Berechnungsfunktionen
    const dataForKpiCalculation = {
        bookingData: filteredBookingData,
        damageData: filteredDamageData,
        stationFleetData: rawData.simulatedStationFleetData
    };

    kpisToCalculate.forEach(kpi => {
        let value;
        // Parameter, die an die KPI-Berechnungsfunktion übergeben werden
        const params = { stationId: stationId };

        // Spezielle Handhabung für 'utilization_by_car_type', da es zusätzliche Parameter benötigt
        if (kpi.id === 'utilization_by_car_type') {
            const stationCars = rawData.simulatedStationFleetData[stationId];
            if (stationCars) {
                // Berechne die Auslastung für jeden Fahrzeugtyp separat
                const utilizationByType = {};
                for (const carType in stationCars) {
                    utilizationByType[carType] = kpi.calculationFunction(
                        dataForKpiCalculation, // Übergabe des gesamten Datenobjekts
                        { stationId: stationId, carType: carType } // Spezifische Parameter für diese KPI
                    );
                }
                value = utilizationByType;
            } else {
                value = "N/A - Fahrzeugdaten fehlen";
            }
        } else {
            // Für andere KPIs wird das gesamte Datenobjekt übergeben
            value = kpi.calculationFunction(dataForKpiCalculation, params);
        }

        calculatedKPIs[kpi.id] = {
            value: value,
            unit: kpi.unit,
            name: kpi.name,
            description: kpi.description,
            categories: kpi.categories,
            group: kpi.group
        };
    });

    return calculatedKPIs;
}

/**
 * Sammelt und berechnet KPIs für alle Mietstationen.
 * @param {Array<string>} stationIds - Ein Array von IDs aller zu analysierenden Mietstationen.
 * @param {Object} rawData - Die importierten Rohdaten (Buchungen, Schäden, Flotte).
 * @param {string} period - Der Auswertungszeitraum (z.B. 'daily', 'weekly', 'monthly', 'yearly').
 * @returns {Object<string, Object>} Ein Objekt, dessen Schlüssel die Station-IDs sind und deren Werte die berechneten KPIs enthalten.
 */
function evaluateAllStations(stationIds, rawData, period = 'monthly') {
    const performanceReport = {};
    const now = new Date();
    let startDate, endDate;

    // Festlegung des Auswertungszeitraums
    switch (period.toLowerCase()) {
        case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case 'weekly':
            // Setzt das Datum auf den letzten Sonntag (Anfang der Woche)
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Letzter Tag des Monats
            break;
        case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        default:
            console.warn(`Unbekannter Zeitraum: '${period}'. Berechne für den aktuellen Monat.`);
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    stationIds.forEach(stationId => {
        performanceReport[stationId] = calculateKPIsForStation(
            stationId,
            rawData, // Gesamte Rohdaten übergeben
            startDate,
            endDate
        );
    });
    return performanceReport;
}

// --- E2.3 Performance-Dashboard erstellen ---


/**
 * Rendert das Performance-Dashboard in den DOM.
 * @param {Object} performanceData - Die berechneten Performance-Daten für alle Stationen.
 */
function renderDashboard(performanceData) {
    const dashboardContainer = document.getElementById('dashboard-container');
    dashboardContainer.innerHTML = ''; // Vorherige Inhalte löschen

    for (const stationId in performanceData) {
        const stationKPIs = performanceData[stationId];

        const stationCard = document.createElement('div');
        stationCard.className = 'station-card';

        const stationTitle = document.createElement('h2');
        stationTitle.className = 'text-2xl font-semibold text-blue-800 mb-4';
        stationTitle.textContent = `Mietstation: ${stationId}`;
        stationCard.appendChild(stationTitle);

        const kpiList = document.createElement('div');
        kpiList.className = 'grid grid-cols-1 gap-4'; // KPIs in einem Raster anordnen

        for (const kpiId in stationKPIs) {
            const kpi = stationKPIs[kpiId];

            const kpiCard = document.createElement('div');
            kpiCard.className = 'kpi-card';

            const kpiName = document.createElement('h3');
            kpiName.className = 'text-lg font-medium text-gray-700 mb-1';
            kpiName.textContent = kpi.name;
            kpiCard.appendChild(kpiName);

            const kpiValue = document.createElement('p');
            kpiValue.className = 'text-2xl font-bold text-blue-600';

            let displayValue = kpi.value;

            // Spezielle Formatierung für Auslastung nach Fahrzeugtyp (Drill-Down-Beispiel)
            if (kpiId === 'utilization_by_car_type' && typeof kpi.value === 'object') {
                const ul = document.createElement('ul');
                ul.className = 'list-disc list-inside text-gray-600 text-base';
                for (const type in kpi.value) {
                    const li = document.createElement('li');
                    li.textContent = `${type}: ${kpi.value[type].toFixed(2)}${kpi.unit}`;
                    ul.appendChild(li);
                }
                kpiCard.appendChild(ul); // Füge die Liste zur KPI-Karte hinzu
                kpiValue.textContent = 'Details siehe unten'; // Standardtext für aggregierten KPI
                kpiValue.className = 'text-lg font-bold text-blue-600'; // Kleinere Schrift
            } else if (typeof kpi.value === 'number') {
                displayValue = kpi.value.toFixed(2); // Auf zwei Dezimalstellen runden
                kpiValue.textContent = `${displayValue} ${kpi.unit}`;
            } else {
                kpiValue.textContent = `${displayValue} ${kpi.unit}`;
            }
            kpiCard.appendChild(kpiValue);

            const kpiDescription = document.createElement('p');
            kpiDescription.className = 'text-sm text-gray-500 mt-2';
            kpiDescription.textContent = kpi.description;
            kpiCard.appendChild(kpiDescription);

            kpiList.appendChild(kpiCard);
        }
        stationCard.appendChild(kpiList);
        dashboardContainer.appendChild(stationCard);
    }
}

/**
 * Simuliert den Export als PDF.
 * In einer realen Anwendung würde hier eine Bibliothek wie jsPDF verwendet und möglicherweise
 * eine Server-Route aufgerufen, um den Export serverseitig zu generieren.
 * @param {Object} data - Die zu exportierenden Daten.
 */
function exportAsPDF(data) {
    console.log("Exportiere Performance-Bericht als PDF...");
    showMessage("Bericht wird als PDF exportiert (simuliert)...", 'info');
    // Hier würde die Logik für den PDF-Export stehen (z.B. mit jsPDF Bibliothek)
    // Oder ein Fetch-Aufruf an das Backend, um den PDF-Export zu triggern.
}

/**
 * Simuliert den Export als Excel.
 * In einer realen Anwendung würde hier eine Bibliothek wie SheetJS/xlsx verwendet und möglicherweise
 * eine Server-Route aufgerufen, um den Export serverseitig zu generieren.
 * @param {Object} data - Die zu exportierenden Daten.
 */
function exportAsExcel(data) {
    console.log("Exportiere Performance-Bericht als Excel...");
    showMessage("Bericht wird als Excel exportiert (simuliert)...", 'info');
    // Hier würde die Logik für den Excel-Export stehen (z.B. mit SheetJS/xlsx Bibliothek)
    // Oder ein Fetch-Aufruf an das Backend, um den Excel-Export zu triggern.
}


// --- Ausführung des Systems beim Laden der Seite ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Daten vom Backend abrufen
    const rawData = await fetchDataFromBackend();
    console.log("Daten erfolgreich vom Backend importiert.");
    console.log("Mietstationen aus data.json:", rawData.mietstationen.map(s => s.name));

    // 2. Liste der zu analysierenden Mietstationen aus den abgerufenen Mietstationen
    const stationIds = rawData.mietstationen.map(station => station.name);

    // 3. Leistungskennziffern für alle Stationen auswerten (z.B. für den aktuellen Monat)
    const performanceReport = evaluateAllStations(stationIds, rawData, 'monthly');
    console.log("\nLeistungskennziffern erfolgreich berechnet.");
    // console.log(JSON.stringify(performanceReport, null, 2)); // Zum Debuggen: gesamten Bericht anzeigen

    // 4. Performance-Dashboard erstellen und anzeigen
    renderDashboard(performanceReport);
    showMessage("Dashboard erfolgreich geladen!", 'success');

    // Event Listener für Export-Buttons
    document.getElementById('exportPdfBtn').addEventListener('click', () => exportAsPDF(performanceReport));
    document.getElementById('exportExcelBtn').addEventListener('click', () => exportAsExcel(performanceReport));
});
