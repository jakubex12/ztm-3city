class ZtmDeparturesCard extends HTMLElement {
    // 1. Definicja edytora wizualnego
    static getConfigElement() {
        return document.createElement("ztm-departures-card-editor");
    }

    // 2. Domyślna konfiguracja po dodaniu karty
    static getStubConfig() {
        return {
            entity: "",
            title: "Odjazdy",
            limit: 5
        };
    }

    set hass(hass) {
        this._hass = hass;
        const entityId = this.config.entity;
        const state = hass.states[entityId];

        if (!state) {
            this.innerHTML = `
                <ha-card class="error">
                    <div style="padding: 20px; color: red;">
                        Encja <b>${entityId || '?'}</b> niedostępna.
                        <br><small>Edytuj kartę i wybierz sensor.</small>
                    </div>
                </ha-card>`;
            return;
        }

        if (this._lastStateStr === JSON.stringify(state.attributes)) {
            return; 
        }
        this._lastStateStr = JSON.stringify(state.attributes);
        this.departures = state.attributes.wszystkie_odjazdy || [];

        if (!this.selectedLines) {
            this.selectedLines = new Set();
        }

        if (!this.content) {
            this.renderBase();
        }

        this.updateFilters();
        this.updateTable();
    }

    setConfig(config) {
        if (!config.entity) {
            // Nie rzucamy błędu krytycznego, żeby edytor mógł działać
            console.warn("ZTM Card: Brak encji");
        }
        this.config = config;
        this.selectedLines = new Set(); 
    }

    // Funkcja określająca typ pojazdu na podstawie numeru linii
    getVehicleType(lineNumber) {
        // Tramwaje w Trójmieście to linie od 1 do 13 + linie nocne N1-N15
        const tramLines = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
        const nightTrams = ['N1', 'N3', 'N4', 'N5', 'N6', 'N8', 'N9', 'N11', 'N12', 'N13', 'N14', 'N15'];
        
        if (tramLines.includes(lineNumber) || nightTrams.includes(lineNumber)) {
            return 'tram';
        }
        return 'bus';
    }

    // Funkcja zwracająca ikonkę SVG
    getVehicleIcon(type) {
        if (type === 'tram') {
            return `<svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: currentColor;">
                <path d="M12,3C8.5,3 5.6,3.1 4,4.3V5H20V4.3C18.4,3.1 15.5,3 12,3M4,6V15.5C4,17.4 5.6,19 7.5,19L6,20.5V21H7L9,19H15L17,21H18V20.5L16.5,19C18.4,19 20,17.4 20,15.5V6H4M7.5,17C6.7,17 6,16.3 6,15.5C6,14.7 6.7,14 7.5,14C8.3,14 9,14.7 9,15.5C9,16.3 8.3,17 7.5,17M11,10H6V7H11V10M13,10V7H18V10H13M16.5,17C15.7,17 15,16.3 15,15.5C15,14.7 15.7,14 16.5,14C17.3,14 18,14.7 18,15.5C18,16.3 17.3,17 16.5,17M12,2L15,0H9L12,2Z" />
            </svg>`;
        } else {
            return `<svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: currentColor;">
                <path d="M18,11H6V6H18M16.5,17A1.5,1.5 0 0,1 15,15.5A1.5,1.5 0 0,1 16.5,14A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 16.5,17M7.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,14A1.5,1.5 0 0,1 9,15.5A1.5,1.5 0 0,1 7.5,17M4,16C4,16.88 4.39,17.67 5,18.22V20A1,1 0 0,0 6,21H7A1,1 0 0,0 8,20V19H16V20A1,1 0 0,0 17,21H18A1,1 0 0,0 19,20V18.22C19.61,17.67 20,16.88 20,16V6C20,2.5 16.42,2 12,2C7.58,2 4,2.5 4,6V16Z" />
            </svg>`;
        }
    }

    renderBase() {
        this.innerHTML = `
            <ha-card>
                <div class="card-header">
                    <div class="name">${this.config.title || 'Odjazdy'}</div>
                </div>
                <div id="filter-container" class="filter-container"></div>
                <div id="departures-container" class="departures-container"></div>
            </ha-card>
            <style>
                ha-card { padding-bottom: 10px; }
                .card-header { padding: 16px; font-size: 18px; font-weight: bold; }
                .filter-container { 
                    padding: 0 16px 10px 16px; 
                    display: flex; 
                    gap: 8px; 
                    flex-wrap: wrap; 
                }
                .filter-btn {
                    background: var(--secondary-background-color);
                    border: 1px solid var(--divider-color);
                    border-radius: 16px;
                    padding: 4px 12px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s;
                    color: var(--primary-text-color);
                    user-select: none;
                }
                .filter-btn:hover {
                    background: var(--secondary-text-color);
                    color: white;
                }
                .filter-btn.active {
                    background: var(--primary-color);
                    color: var(--text-primary-color, white);
                    border-color: var(--primary-color);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .departures-container { padding: 0; }
                .row {
                    display: flex;
                    align-items: center;
                    padding: 8px 16px;
                    border-bottom: 1px solid var(--divider-color);
                }
                .row:last-child { border-bottom: none; }
                .line-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-right: 12px;
                }
                .line-badge {
                    background: var(--primary-color);
                    color: white;
                    font-weight: bold;
                    border-radius: 4px;
                    min-width: 36px;
                    text-align: center;
                    padding: 4px 0;
                    font-size: 14px;
                }
                .vehicle-icon {
                    display: flex;
                    align-items: center;
                    opacity: 0.8;
                }
                .direction { flex: 1; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .time { font-weight: bold; font-size: 15px; text-align: right; min-width: 70px; }
                .time-now { 
                    color: var(--error-color, #db4437);
                    animation: blink 1s ease-in-out infinite;
                }
                .time-soon { color: var(--error-color, #db4437); }
                .time-future { color: var(--success-color, #43a047); }
                .no-data { padding: 20px; text-align: center; opacity: 0.6; }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            </style>
        `;
        this.content = this.querySelector('#departures-container');
        this.filters = this.querySelector('#filter-container');

        this.filters.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            const filter = btn.getAttribute('data-filter');
            this.toggleFilter(filter);
        });
    }

    updateFilters() {
        const lines = [...new Set(this.departures.map(d => d.linia))].sort();
        const isAllActive = this.selectedLines.size === 0;

        let html = `<button class="filter-btn ${isAllActive ? 'active' : ''}" data-filter="all">Wszystkie</button>`;
        
        lines.forEach(line => {
            const isActive = this.selectedLines.has(line) ? 'active' : '';
            html += `<button class="filter-btn ${isActive}" data-filter="${line}">${line}</button>`;
        });

        this.filters.innerHTML = html;
    }

    toggleFilter(line) {
        if (line === 'all') {
            this.selectedLines.clear();
        } else {
            if (this.selectedLines.has(line)) {
                this.selectedLines.delete(line);
            } else {
                this.selectedLines.add(line);
            }
        }
        this.updateFilters();
        this.updateTable();
    }

    updateTable() {
        if (!this.content) return;

        const filtered = this.selectedLines.size === 0 
            ? this.departures 
            : this.departures.filter(d => this.selectedLines.has(d.linia));

        const limit = this.config.limit || 10;
        const limited = filtered.slice(0, limit);

        if (limited.length === 0) {
            const selectedText = Array.from(this.selectedLines).join(", ");
            this.content.innerHTML = `<div class="no-data">Brak odjazdów dla: ${selectedText}</div>`;
            return;
        }

        this.content.innerHTML = limited.map(kurs => {
            const vehicleType = this.getVehicleType(kurs.linia);
            const vehicleIcon = this.getVehicleIcon(vehicleType);
            
            // Określanie klasy czasu - "Teraz" lub poniżej 6 minut = czerwony
            let timeClass = 'time-future';
            if (kurs.czas === 'Teraz') {
                timeClass = 'time-now';
            } else if (kurs.minuty !== undefined && kurs.minuty < 6) {
                timeClass = 'time-soon';
            }
            
            return `
                <div class="row">
                    <div class="line-info">
                        <div class="line-badge">${kurs.linia}</div>
                        <div class="vehicle-icon">${vehicleIcon}</div>
                    </div>
                    <div class="direction">${kurs.kierunek}</div>
                    <div class="time ${timeClass}">${kurs.czas}</div>
                </div>
            `;
        }).join('');
    }

    getCardSize() {
        return 3;
    }
}

// ==========================================================
// NOWA KLASA: EDYTOR WIZUALNY (UI)
// ==========================================================
class ZtmDeparturesCardEditor extends HTMLElement {
    setConfig(config) {
        this._config = config;
        this.render();
    }

    set hass(hass) {
        this._hass = hass;
        // Przekazujemy hass do pickera encji, żeby widział listę sensorów
        const entityPicker = this.querySelector("ha-entity-picker");
        if (entityPicker) {
            entityPicker.hass = hass;
        }
    }

    render() {
        if (!this.innerHTML) {
            this.innerHTML = `
                <div class="card-config">
                    <div class="option">
                        <ha-entity-picker
                            label="Wybierz sensor (ZTM)"
                            domain-filter="sensor"
                            class="entity-picker"
                        ></ha-entity-picker>
                    </div>
                    <div class="option">
                        <label class="label">Tytuł karty</label>
                        <input type="text" class="input-text" id="title-input" placeholder="np. Przystanek Wołkowyska">
                    </div>
                    <div class="option">
                        <label class="label">Ilość wierszy (Limit)</label>
                        <input type="number" class="input-number" id="limit-input" min="1" max="50">
                    </div>
                </div>
                <style>
                    .card-config { padding: 10px; display: flex; flex-direction: column; gap: 15px; }
                    .option { display: flex; flex-direction: column; gap: 5px; }
                    .label { font-size: 14px; font-weight: 500; color: var(--secondary-text-color); }
                    .input-text, .input-number {
                        padding: 8px;
                        border: 1px solid var(--divider-color);
                        border-radius: 4px;
                        background: var(--card-background-color);
                        color: var(--primary-text-color);
                        font-size: 14px;
                    }
                    ha-entity-picker { display: block; }
                </style>
            `;

            // Podpinamy zdarzenia (Events)
            this.querySelector("ha-entity-picker").addEventListener("value-changed", this._valueChanged.bind(this, "entity"));
            this.querySelector("#title-input").addEventListener("change", this._valueChanged.bind(this, "title"));
            this.querySelector("#limit-input").addEventListener("change", this._valueChanged.bind(this, "limit"));
        }

        // Ustawiamy aktualne wartości w polach
        const entityPicker = this.querySelector("ha-entity-picker");
        if (entityPicker) {
            entityPicker.hass = this._hass; // Upewniamy się, że picker ma hass
            entityPicker.value = this._config.entity || "";
        }
        
        this.querySelector("#title-input").value = this._config.title || "";
        this.querySelector("#limit-input").value = this._config.limit || 10;
    }

    _valueChanged(key, ev) {
        if (!this._config || !this._hass) return;

        const target = ev.target;
        // Dla ha-entity-picker wartość jest w .value, dla inputów też
        // Ale event ha-entity-picker to 'value-changed', a jego szczegóły są w ev.detail.value
        let newValue = target.value;
        
        if (key === "entity" && ev.detail && ev.detail.value !== undefined) {
            newValue = ev.detail.value;
        }
        
        if (key === "limit") {
            newValue = parseInt(newValue);
        }

        // Jeśli wartość jest ta sama, nie rób nic
        if (this._config[key] === newValue) return;

        // Tworzymy nową konfigurację
        const newConfig = {
            ...this._config,
            [key]: newValue,
        };

        // Wysyłamy zdarzenie do Home Assistant: "Konfiguracja się zmieniła!"
        const event = new CustomEvent("config-changed", {
            detail: { config: newConfig },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }
}

// Rejestracja obu klas
customElements.define('ztm-departures-card-editor', ZtmDeparturesCardEditor);
customElements.define('ztm-departures-card', ZtmDeparturesCard);

// To sprawia, że karta pojawia się na liście "Dodaj kartę" w UI
window.customCards = window.customCards || [];
window.customCards.push({
    type: "ztm-departures-card",
    name: "ZTM Trójmiasto",
    description: "Karta odjazdów na żywo (Gdańsk/Gdynia/Sopot)",
    preview: true // Opcjonalnie włącza podgląd
});