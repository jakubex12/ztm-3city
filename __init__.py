"""The ZTM Trójmiasto component."""

DOMAIN = "ztm_trojmiasto"
PLATFORMS = ["sensor"]

async def async_setup_entry(hass, entry):
    """Set up platform from a config entry."""
    # POPRAWIONA NAZWA FUNKCJI Z 'S' NA KOŃCU
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True

async def async_unload_entry(hass, entry):
    """Unload a config entry."""
    # POPRAWIONA NAZWA FUNKCJI Z 'S' NA KOŃCU
    unload_ok = await hass.config_entries.async_forward_entry_unloads(entry, PLATFORMS)
    return unload_ok