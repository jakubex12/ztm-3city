class ZtmDeparturesCard extends HTMLElement {
    set hass(hass) {
        this._hass = hass;
        const entityId = this.config.entity;
        const state = hass.states[entityId];

        if (!state) {
            this.innerHTML = `
                <ha-card class="error">
                    <div style="padding: 20px; color: red;">
                        Encja <b>${entityId}</b> niedostępna.
                    </div>
                </ha-card>`;
            return;
        }

        if (this._lastStateStr === JSON.stringify(state.attributes)) {
            return; 
        }
        this._lastStateStr = JSON.stringify(state.attributes);
        this.departures = state.attributes.wszystkie_odjazdy || [];

        // Inicjalizacja zbioru wybranych linii (Set zapewnia unikalność)
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
            throw new Error("Musisz podać 'entity'");
        }
        this.config = config;
        // Resetujemy wybór przy zmianie konfiguracji
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
                /* Styl dla aktywnego przycisku */
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

        // Obsługa kliknięć (Event Delegation)
        this.filters.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;

            const filter = btn.getAttribute('data-filter');
            this.toggleFilter(filter);
        });
    }

    updateFilters() {
        // Pobieramy dostępne linie z danych
        const lines = [...new Set(this.departures.map(d => d.linia))].sort();
        
        // Logika: Jeśli zbiór jest pusty -> przycisk "Wszystkie" jest aktywny
        const isAllActive = this.selectedLines.size === 0;

        let html = `<button class="filter-btn ${isAllActive ? 'active' : ''}" data-filter="all">Wszystkie</button>`;
        
        lines.forEach(line => {
            // Sprawdzamy czy dana linia jest w zbiorze wybranych
            const isActive = this.selectedLines.has(line) ? 'active' : '';
            html += `<button class="filter-btn ${isActive}" data-filter="${line}">${line}</button>`;
        });

        this.filters.innerHTML = html;
    }

    toggleFilter(line) {
        if (line === 'all') {
            // Kliknięcie "Wszystkie" czyści wybór
            this.selectedLines.clear();
        } else {
            // Logika przełączania (Toggle)
            if (this.selectedLines.has(line)) {
                this.selectedLines.delete(line); // Odznacz
            } else {
                this.selectedLines.add(line);    // Zaznacz
            }
        }

        this.updateFilters(); // Odśwież wygląd przycisków
        this.updateTable();   // Odśwież tabelę
    }

    updateTable() {
        if (!this.content) return;

        // Jeśli zbiór pusty = pokaż wszystkie. Jeśli nie = filtruj.
        const filtered = this.selectedLines.size === 0 
            ? this.departures 
            : this.departures.filter(d => this.selectedLines.has(d.linia));

        const limit = this.config.limit || 10;
        const limited = filtered.slice(0, limit);

        if (limited.length === 0) {
            // Wyświetlamy informację, jakie linie są wybrane, ale nie mają kursów
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

customElements.define('ztm-departures-card', ZtmDeparturesCard);