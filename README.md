# ZTM 3City - Home Assistant Integration

Integracja dostarczająca dane o rzeczywistych odjazdach komunikacji miejskiej w Trójmieście (Gdańsk, Gdynia, Sopot) bezpośrednio do Home Assistant.

⚠️ **BREAKING CHANGE/ŁAMIĄCA ZMIANA (Wersja 2026.1.2+):**
Od tej wersji integracja i karta wizualna są rozdzielone. To repozytorium zawiera teraz wyłącznie **backend** (sensory). Jeśli chcesz korzystać z dedykowanej karty graficznej, zainstaluj ją osobno z linku poniżej.

## 🚀 Nowości
- Rozdzielenie frontendu od backendu (lepsza wydajność).
- Możliwość używania danych w dowolnych kartach HA.
- Dedykowana karta: [ZTM 3City Card](https://github.com/jakubex12/ztm-3city-card)

## 🛠 Instalacja
### Przez HACS (Zalecane)
1. Otwórz **HACS** -> **Integracje**.
2. Kliknij trzy kropki w prawym górnym rogu i wybierz **Niestandardowe repozytoria**.
3. Wklej link: `https://github.com/jakubex12/ztm-3city` i wybierz kategorię **Integracja**.
4. Zainstaluj, a następnie zrestartuj Home Assistant.
5. Dodaj integrację w menu **Ustawienia** -> **Urządzenia oraz usługi**.

## 📊 Sensory
Integracja tworzy sensory dla wybranych przystanków. Każdy sensor posiada atrybuty z listą najbliższych odjazdów, które mogą być konsumowane przez dedykowaną kartę lub natywne karty HA.

## 🎨 Karta Dashboard (Frontend)
Aby uzyskać estetyczny wygląd tablicy odjazdów, zainstaluj:
👉 **[ZTM 3City Departures Card](https://github.com/jakubex12/ztm-3city-card)**
