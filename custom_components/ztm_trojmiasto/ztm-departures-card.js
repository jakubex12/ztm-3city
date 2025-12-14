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
        this.activeFilter = 'all';
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
                    transition: background 0.2s, color 0.2s;
                    color: var(--primary-text-color);
                    user-select: none; /* Zapobiega zaznaczaniu tekstu przy klikaniu */
                }
                .filter-btn:hover {
                    background: var(--secondary-text-color);
                    color: white;
                }
                .filter-btn.active {
                    background: var(--primary-color);
                    color: var(--text-primary-color, white);
                    border-color: var(--primary-color);
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

        // EVENT DELEGATION: Podpinamy nasłuchiwanie pod kontener RAZ.
        // To działa nawet jak podmieniamy przyciski w środku HTML.
        this.filters.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;

            const filter = btn.getAttribute('data-filter');
            console.log("Kliknięto filtr:", filter); // Sprawdź w konsoli F12!
            this.setFilter(filter);
        });
    }

    updateFilters() {
        const lines = [...new Set(this.departures.map(d => d.linia))].sort();
        
        let html = `<button class="filter-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">Wszystkie</button>`;
        
        lines.forEach(line => {
            const isActive = this.activeFilter === line ? 'active' : '';
            html += `<button class="filter-btn ${isActive}" data-filter="${line}">${line}</button>`;
        });

        this.filters.innerHTML = html;
    }

    setFilter(line) {
        this.activeFilter = line;
        this.updateFilters(); // Odśwież wygląd przycisków
        this.updateTable();   // Odśwież tabelę
    }

    updateTable() {
        if (!this.content) return;

        const filtered = this.activeFilter === 'all' 
            ? this.departures 
            : this.departures.filter(d => d.linia === this.activeFilter);

        const limit = this.config.limit || 10;
        const limited = filtered.slice(0, limit);

        if (limited.length === 0) {
            this.content.innerHTML = `<div class="no-data">Brak odjazdów (Linia: ${this.activeFilter})</div>`;
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