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
                .line-badge {
                    background: var(--primary-color);
                    color: white;
                    font-weight: bold;
                    border-radius: 4px;
                    min-width: 36px;
                    text-align: center;
                    padding: 4px 0;
                    margin-right: 12px;
                    font-size: 14px;
                }
                .direction { flex: 1; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .time { font-weight: bold; font-size: 15px; text-align: right; min-width: 70px; }
                .time-now { color: var(--error-color, #db4437); }
                .time-future { color: var(--success-color, #43a047); }
                .no-data { padding: 20px; text-align: center; opacity: 0.6; }
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
            const timeClass = kurs.czas === 'Teraz' ? 'time-now' : 'time-future';
            return `
                <div class="row">
                    <div class="line-badge">${kurs.linia}</div>
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
