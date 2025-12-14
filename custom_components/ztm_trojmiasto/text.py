from homeassistant.components.text import TextEntity
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
import logging

from . import DOMAIN

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Konfiguracja platformy text z config entry."""
    stop_id = config_entry.data["stop_id"]
    stop_name = config_entry.data["stop_name"]

    # Tworzymy jedną encję filtra dla tego przystanku
    async_add_entities([ZTMFilterEntity(stop_name, stop_id)])


class ZTMFilterEntity(TextEntity, RestoreEntity):
    """Encja tekstowa do przechowywania filtra linii."""

    def __init__(self, stop_name, stop_id):
        self._stop_name = stop_name
        self._stop_id = stop_id
        # Unikalne ID, np. 1848_line_filter
        self._attr_unique_id = f"{stop_id}_line_filter"
        self._attr_name = f"Filtr Linii {stop_name}"
        self._attr_icon = "mdi:filter-variant"
        # Domyślna wartość to "all" (wszystkie)
        self._attr_native_value = "all"
        
        # Przypisanie do tego samego urządzenia co sensory
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, stop_id)},
            name=stop_name,
            manufacturer="ZTM Gdańsk / Tristar",
        )

    async def async_added_to_hass(self):
        """Przywracanie stanu po restarcie HA."""
        await super().async_added_to_hass()
        state = await self.async_get_last_state()
        if state and state.state not in [None, "unknown", "unavailable"]:
            self._attr_native_value = state.state

    @property
    def native_value(self):
        """Zwraca aktualną wartość filtra."""
        return self._attr_native_value

    async def async_set_value(self, value: str) -> None:
        """Ustawia nową wartość filtra (wywoływane przez dashboard)."""
        self._attr_native_value = value
        self.async_write_ha_state()