"""Config flow for ZTM Trójmiasto integration."""
from __future__ import annotations

import logging
from typing import Any
import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.aiohttp_client import async_get_clientsession

_LOGGER = logging.getLogger(__name__)

DOMAIN = "ztm_trojmiasto"
STOPS_URL = "https://ckan.multimediagdansk.pl/dataset/c24aa637-3619-4dc2-a171-a23eec8f2172/resource/d3e96eb6-25ad-4d6c-8651-b1eb39155945/download/stopsingdansk.json"

async def get_all_stops(hass: HomeAssistant) -> list[dict]:
    """Pobiera listę przystanków."""
    session = async_get_clientsession(hass)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/json"
    }

    try:
        async with session.get(STOPS_URL, headers=headers, timeout=20) as response:
            if response.status != 200:
                return []
            data = await response.json()
            
            if "stops" in data: return data["stops"]
            if isinstance(data, dict):
                for key, value in data.items():
                    if isinstance(value, dict) and "stops" in value: return value["stops"]
            if isinstance(data, list): return data
            return []
    except Exception:
        return []

class ZTMTrojmiastoConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Obsługa konfiguracji."""

    VERSION = 1

    def __init__(self):
        self._stops_cache = []
        self._search_query = ""

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Krok 1: Wpisanie nazwy."""
        errors: dict[str, str] = {}

        if user_input is not None:
            self._search_query = user_input["search_name"]
            return await self.async_step_pick_stop()

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Required("search_name", default=""): str,
            }),
            errors=errors
            # USUNIĘTO description_placeholders - teraz HA weźmie opis ze strings.json
        )

    async def async_step_pick_stop(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Krok 2: Wybór z listy."""
        errors: dict[str, str] = {}

        if not self._stops_cache:
            self._stops_cache = await get_all_stops(self.hass)

        if not self._stops_cache:
            return await self.async_step_manual()

        if user_input is not None:
            stop_id = user_input["selected_stop"]
            selected_stop_data = next((s for s in self._stops_cache if str(s.get("stopId")) == stop_id), None)
            
            if selected_stop_data:
                desc = selected_stop_data.get("stopDesc", "Przystanek")
                code = selected_stop_data.get("stopCode", "")
                final_name = f"{desc} [{code}]" if code else f"{desc} ({stop_id})"
            else:
                final_name = f"Przystanek {stop_id}"

            return self.async_create_entry(title=final_name, data={"stop_id": str(stop_id), "stop_name": final_name})

        options = {}
        query_lower = self._search_query.lower()

        for stop in self._stops_cache:
            desc = stop.get("stopDesc") or stop.get("stopName") or ""
            if query_lower in desc.lower():
                s_id = str(stop.get("stopId"))
                s_code = stop.get("stopCode", "")
                label = f"{desc} (słupek {s_code})" if s_code else f"{desc} (ID: {s_id})"
                options[s_id] = label

        if not options:
            return self.async_show_form(
                step_id="user",
                data_schema=vol.Schema({vol.Required("search_name", default=self._search_query): str}),
                errors={"base": "no_stops_found"}
            )

        sorted_options = dict(sorted(options.items(), key=lambda item: item[1])[:30])

        return self.async_show_form(
            step_id="pick_stop",
            data_schema=vol.Schema({vol.Required("selected_stop"): vol.In(sorted_options)}),
            errors=errors,
        )

    async def async_step_manual(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Krok awaryjny."""
        if user_input is not None:
            return self.async_create_entry(
                title=f"Przystanek {user_input['stop_id']}",
                data={"stop_id": str(user_input["stop_id"]), "stop_name": f"Przystanek {user_input['stop_id']}"}
            )

        return self.async_show_form(
            step_id="manual",
            data_schema=vol.Schema({vol.Required("stop_id"): str}),
            errors={"base": "api_error_manual_input"}
        )