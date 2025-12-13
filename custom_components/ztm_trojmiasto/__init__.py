"""The ZTM Trójmiasto component."""
import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.lovelace import DOMAIN as LOVELACE_DOMAIN
from homeassistant.components.lovelace.resources import ResourceStorageCollection

DOMAIN = "ztm_trojmiasto"
PLATFORMS = ["sensor", "text"]
CARD_URL = "/ztm_trojmiasto/ztm-departures-card.js"

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up platform from a config entry."""

    # 1. Rejestracja pliku JS (serwowanie pliku)
    hass.http.register_static_path(
        CARD_URL,
        hass.config.path("custom_components/ztm_trojmiasto/ztm-departures-card.js"),
        True
    )

    # 2. Automatyczne dodanie do Zasobów Lovelace (Auto-register)
    await _async_register_lovelace_resource(hass, CARD_URL)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_forward_entry_unloads(entry, PLATFORMS)
    return unload_ok

async def _async_register_lovelace_resource(hass: HomeAssistant, url: str):
    """Automatycznie dodaje kartę do zasobów Lovelace."""
    # Pobieramy instancję zasobów Lovelace
    resources: ResourceStorageCollection = hass.data.get(LOVELACE_DOMAIN, {}).get("resources")
    
    # Jeśli system zasobów nie jest jeszcze załadowany, odpuszczamy (użytkownik doda ręcznie lub po restarcie wejdzie)
    if not resources or not resources.loaded:
        return

    # Sprawdzamy, czy ten URL już istnieje
    for resource in resources.async_items():
        if resource["url"] == url:
            return  # Już jest, nic nie robimy

    # Jeśli nie ma - dodajemy
    _LOGGER.info("Automatyczne dodawanie karty ZTM do zasobów Lovelace: %s", url)
    try:
        await resources.async_create_item({"res_type": "module", "url": url})
    except Exception as ex:
        _LOGGER.warning("Nie udało się automatycznie dodać zasobu: %s", ex)