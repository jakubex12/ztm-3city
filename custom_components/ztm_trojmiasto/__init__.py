"""The ZTM Trójmiasto component."""
import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.lovelace import DOMAIN as LOVELACE_DOMAIN
from homeassistant.components.http import StaticPathConfig

DOMAIN = "ztm_trojmiasto"
PLATFORMS = ["sensor", "text"]
CARD_URL = "/ztm_trojmiasto/ztm-departures-card.js"

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up platform from a config entry."""
    
    hass.data.setdefault(DOMAIN, {})

    # ▼▼▼ ZABEZPIECZENIE: Wykonaj rejestrację TYLKO RAZ (Globalnie) ▼▼▼
    if not hass.data[DOMAIN].get("card_registered"):
        try:
            # 1. Rejestracja pliku JS (serwowanie pliku)
            await hass.http.async_register_static_paths([
                StaticPathConfig(
                    url_path=CARD_URL,
                    path=hass.config.path("custom_components/ztm_trojmiasto/ztm-departures-card.js"),
                    cache_headers=True
                )
            ])

            # 2. Automatyczne dodanie do Zasobów Lovelace
            await _async_register_lovelace_resource(hass, CARD_URL)
            
            hass.data[DOMAIN]["card_registered"] = True
            _LOGGER.debug("Zarejestrowano kartę ZTM w systemie HTTP.")
            
        except RuntimeError:
            _LOGGER.debug("Ścieżka statyczna dla ZTM już istnieje.")
    # ▲▲▲ KONIEC ZMIAN ▲▲▲

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_forward_entry_unloads(entry, PLATFORMS)
    return unload_ok

async def _async_register_lovelace_resource(hass: HomeAssistant, url: str):
    """Automatycznie dodaje kartę do zasobów Lovelace."""
    # Pobieramy obiekt Lovelace
    lovelace_data = hass.data.get(LOVELACE_DOMAIN)
    
    if not lovelace_data:
        return

    # Bezpieczny dostęp do resources
    resources = getattr(lovelace_data, "resources", None)

    if not resources or not resources.loaded:
        return

    # Sprawdzamy czy zasób już istnieje
    for resource in resources.async_items():
        if resource["url"] == url:
            return

    _LOGGER.info("Automatyczne dodawanie karty ZTM do zasobów Lovelace: %s", url)
    try:
        await resources.async_create_item({"res_type": "module", "url": url})
        
        # ▼▼▼ FIX: WYMUSZENIE ODŚWIEŻENIA PRZEGLĄDARKI ▼▼▼
        # To zdarzenie mówi frontendowi: "Przeładuj konfigurację Lovelace teraz!"
        hass.bus.async_fire("lovelace_updated")
        
    except Exception as ex:
        _LOGGER.warning("Nie udało się automatycznie dodać zasobu: %s", ex)
