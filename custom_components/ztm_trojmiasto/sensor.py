from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, CoordinatorEntity, UpdateFailed
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.util import dt as dt_util

from datetime import timedelta
import logging
import asyncio

_LOGGER = logging.getLogger(__name__)

DOMAIN = "ztm_trojmiasto"
SCAN_INTERVAL = timedelta(seconds=60)
API_URL = "https://ckan2.multimediagdansk.pl/departures"

NIGHT_LINE_MAP = {
    '401': 'N1', '403': 'N3', '404': 'N4', '405': 'N5', '406': 'N6', 
    '408': 'N8', '409': 'N9', '411': 'N11', '412': 'N12', '413': 'N13', 
    '414': 'N14', '415': 'N15' 
}

async def async_setup_entry(hass, config_entry, async_add_entities):
    """Set up the sensor platform from a config entry."""
    
    # Pobieramy dane zapisane w UI
    stop_id = config_entry.data["stop_id"]
    stop_name = config_entry.data["stop_name"]
    
    # Koordynator
    coordinator = ZTMTrojmiastoDataUpdateCoordinator(hass, stop_id)
    await coordinator.async_refresh()

    # Dodawanie encji
    async_add_entities([
        ZTMDepartureSensor(coordinator, stop_name, stop_id, True),  # WSZYSTKIE
        ZTMDepartureSensor(coordinator, stop_name, stop_id, False), # 5 NAJBLIŻSZYCH
    ])
    
    return True


class ZTMTrojmiastoDataUpdateCoordinator(DataUpdateCoordinator):
    """Zarządza pobieraniem danych z API."""

    def __init__(self, hass, stop_id):
        super().__init__(
            hass,
            _LOGGER,
            name=f"ZTM Stop {stop_id}",
            update_interval=SCAN_INTERVAL,
        )
        self.stop_id = stop_id
        self.websession = async_get_clientsession(hass)

    async def _async_update_data(self):
        """Pobiera i przetwarza dane."""
        url = f"{API_URL}?stopId={self.stop_id}"
        try:
            async with self.websession.get(url) as response:
                if response.status != 200:
                    raise UpdateFailed(f"Błąd API: {response.status}")
                
                data = await response.json()
                raw_departures = data.get('departures', [])
                
                # Przekazujemy do przetworzenia
                return self._process_departures(raw_departures)

        except Exception as err:
            _LOGGER.error(f"Błąd połączenia z API dla przystanku {self.stop_id}: {err}")
            raise UpdateFailed(f"Błąd API: {err}")

    def _process_departures(self, raw_departures):
        """Logika przetwarzania (mapowanie linii, czas lokalny)."""
        processed_list = []
        teraz = dt_util.now() # Czas lokalny HA

        for kurs in raw_departures:
            try:
                route_id = str(kurs.get('routeId'))
                route_fixed = NIGHT_LINE_MAP.get(route_id, route_id)
                headsign = kurs.get('headsign', 'Brak')
                
                czas_str = kurs.get('estimatedTime') or kurs.get('theoreticalTime')
                if not czas_str:
                    continue

                # 1. Parsowanie daty z API (jest w UTC, kończy się na 'Z')
                data_kursu = dt_util.parse_datetime(czas_str)
                
                # 2. Konwersja na strefę czasową Home Assistanta
                if data_kursu:
                    data_kursu = dt_util.as_local(data_kursu)
                else:
                    continue

                # 3. Obliczenie minut do odjazdu
                diff = int((data_kursu - teraz).total_seconds() / 60)

                # Formatowanie tekstu "za X min"
                if diff <= 0:
                    wynik_czas = "Teraz"
                elif diff < 60:
                    wynik_czas = f"za {diff} min"
                else:
                    wynik_czas = data_kursu.strftime('%H:%M')

                # Dodajemy kurs, jeśli jest w przyszłości lub uciekł max 2 min temu
                if diff >= -2:
                    processed_list.append({
                        "linia": route_fixed, 
                        "kierunek": headsign,
                        "czas": wynik_czas,
                        "minuty": diff
                    })

            except Exception as e:
                # Ignorujemy pojedyncze błędy kursów, żeby nie wywalić całej listy
                continue

        # Sortowanie: najpierw te co zaraz odjadą
        processed_list.sort(key=lambda x: x['minuty'])
        
        return processed_list


class ZTMDepartureSensor(CoordinatorEntity, SensorEntity):
    """Sensor, który automatycznie aktualizuje się z koordynatorem."""

    def __init__(self, coordinator, stop_name, stop_id, full_list):
        super().__init__(coordinator) # To kluczowa zmiana - łączy sensor z danymi
        self._stop_name = stop_name
        self._stop_id = stop_id
        self._full_list = full_list
        
        # Generowanie ID encji
        if full_list:
            self._attr_unique_id = f"{stop_id}_all_departures"
            self._attr_name = f"Autobusy {stop_name} WSZYSTKIE"
        else:
            self._attr_unique_id = f"{stop_id}_najblizsze_5"
            self._attr_name = f"Autobusy {stop_name} Najbliższe 5"
            
        self._attr_icon = "mdi:bus-clock"

    @property
    def native_value(self):
        """Zwraca główny stan sensora (state)."""
        data = self.coordinator.data or []
        
        if self._full_list:
            # Dla listy wszystkich: stanem jest liczba kursów
            return str(len(data))
        else:
            # Dla najbliższych 5: stanem jest info o pierwszym autobusie
            if data:
                next_bus = data[0]
                return f"{next_bus['linia']} ({next_bus['czas']})"
            return "Brak kursów"

    @property
    def extra_state_attributes(self):
        """Zwraca atrybuty (listę odjazdów dla Dashboardu)."""
        data = self.coordinator.data or []
        
        if self._full_list:
            return {"wszystkie_odjazdy": data}
        else:
            return {"najblizsze_5": data[:5]}