# ZTM Trójmiasto - Integracja dla Home Assistant

Integracja do wyświetlania odjazdów autobusów i tramwajów w czasie rzeczywistym dla ZTM Gdańsk, Gdynia i Sopot.

## 🚀 Funkcje

### ✨ Kluczowe możliwości
- **Odjazdy w czasie rzeczywistym** - aktualizacja co 60 sekund
- **Automatyczne mapowanie linii nocnych** (401→N1, 403→N3 itd.)
- **Inteligentne wyświetlanie czasu**
  - "Teraz" - dla odjazdów za 0-1 min (czerwony, opcjonalnie migający)
  - "za X min" - dla odjazdów < 60 min (czerwony gdy bliski odjazd)
  - Godzina "HH:MM" - dla dalszych odjazdów (zielony)
- **Interaktywne filtry linii** - kliknij przycisk aby filtrować po konkretnej linii
- **Ikony pojazdów** - automatyczne rozpoznawanie tramwajów (🚋) i autobusów (🚌)
- **Edytor wizualny** - łatwa konfiguracja karty bezpośrednio z UI
- **Wyszukiwarka przystanków** - znajdź przystanek po nazwie podczas dodawania
- **Przywracanie filtrów** - zapamiętuje wybrane linie po restarcie
- **Konfigurowalny próg czerwonej czcionki** - ustaw kiedy czas ma się wyświetlać na czerwono

### 🎨 Niestandardowa karta Lovelace

Integracja zawiera dedykowaną kartę `ztm-departures-card` z funkcjami:
- Przyciski filtrowania linii (Wszystkie / konkretne linie)
- Responsywny design dopasowany do motywu HA
- Kolorowe oznaczenia czasów odjazdu
- Limit wyświetlanych wierszy (domyślnie 10)
- Automatyczna rejestracja w zasobach Lovelace
- Opcja migania dla "Teraz" (włącz/wyłącz)
- Konfigurowalne wyświetlanie czerwonej czcionki (próg w minutach, 0 = wyłączone)

---

## 📥 Instalacja

### Metoda 1: HACS (zalecana)

1. Otwórz **HACS** w Home Assistant
2. Kliknij **Integracje** → Menu (⋮) → **Repozytoria niestandardowe**
3. Dodaj URL: `https://github.com/jakubex12/ztm-3city`
4. Kategoria: **Integracja**
5. Znajdź **ZTM Trójmiasto** i kliknij **Pobierz**
6. **Zrestartuj Home Assistant**

### Metoda 2: Ręczna instalacja

1. Pobierz folder `ztm_trojmiasto` z tego repozytorium
2. Skopiuj go do `config/custom_components/ztm_trojmiasto`
3. Struktura powinna wyglądać tak:
   ```
   config/
   └── custom_components/
       └── ztm_trojmiasto/
           ├── __init__.py
           ├── sensor.py
           ├── text.py
           ├── config_flow.py
           ├── manifest.json
           ├── strings.json
           └── ztm-departures-card.js
   ```
4. **Zrestartuj Home Assistant**

---

## ⚙️ Konfiguracja

### Dodawanie przystanku

1. Przejdź do **Ustawienia** → **Urządzenia i usługi**
2. Kliknij **+ Dodaj integrację**
3. Wyszukaj **"ZTM Trójmiasto"**
4. Wpisz nazwę przystanku (np. "Wrzeszcz", "Dworzec")
5. Wybierz właściwy przystanek z listy
6. Gotowe! Sensor zostanie automatycznie utworzony

### Struktura encji

Dla każdego przystanku tworzone są **2 encje**:

#### 1. Sensor odjazdów
- **Nazwa**: `sensor.autobusy_[nazwa_przystanku]`
- **Stan**: Liczba kursów w kolejce
- **Atrybuty**:
  ```yaml
  wszystkie_odjazdy:
    - linia: "138"
      kierunek: "Główna"
      czas: "za 3 min"
      minuty: 3
    - linia: "N3"
      kierunek: "Oliwa"
      czas: "23:45"
      minuty: 12
  ```

#### 2. Encja filtra (text)
- **Nazwa**: `text.filtr_linii_[nazwa_przystanku]`
- **Wartość**: `"all"` lub numer linii (np. `"138"`)
- Służy do zapamiętywania wybranego filtra

---

## 🎴 Karta Lovelace

### Automatyczna rejestracja

Karta **automatycznie rejestruje się** w zasobach Lovelace przy pierwszym uruchomieniu integracji. Nie musisz ręcznie dodawać pliku JS!

### Dodawanie karty do dashboardu

#### Metoda 1: Edytor wizualny (UI)
1. Edytuj dashboard → **+ Dodaj kartę**
2. Przewiń w dół i wybierz **"ZTM Trójmiasto"**
3. Skonfiguruj w edytorze:
   - **Wybierz sensor** - lista dostępnych sensorów ZTM
   - **Tytuł karty** - np. "Przystanek Wołkowyska"
   - **Limit wierszy** - ile odjazdów wyświetlać (1-50)
   - **Miganie "Teraz"** - czy status "Teraz" ma migać (domyślnie: tak)
   - **Próg czerwonej czcionki** - po ilu minutach zmienić kolor na czerwony (0 = wyłączone, domyślnie: 6)

#### Metoda 2: Ręczna konfiguracja YAML
```yaml
type: custom:ztm-departures-card
entity: sensor.autobusy_wrzeszcz_pkp_1001
title: Przystanek Wrzeszcz PKP
limit: 10
blink_now: true
red_threshold: 6
```

### Parametry karty

| Parametr | Typ | Domyślnie | Opis |
|----------|-----|-----------|------|
| `entity` | string | **wymagane** | ID sensora ZTM (np. `sensor.autobusy_wrzeszcz_pkp_1001`) |
| `title` | string | "Odjazdy" | Tytuł wyświetlany w nagłówku karty |
| `limit` | number | 10 | Maksymalna liczba wyświetlanych odjazdów (1-50) |
| `blink_now` | boolean | true | Czy status "Teraz" ma migać |
| `red_threshold` | number | 6 | Po ilu minutach czcionka zmienia się na czerwoną (0 = wyłączone) |

---

## 🎯 Przykłady użycia

### Dashboard z kilkoma przystankami
```yaml
type: vertical-stack
cards:
  - type: custom:ztm-departures-card
    entity: sensor.autobusy_wrzeszcz_pkp_1001
    title: Wrzeszcz PKP
    limit: 8
    blink_now: false
    red_threshold: 5

  - type: custom:ztm-departures-card
    entity: sensor.autobusy_dworzec_glowny_1848
    title: Dworzec Główny
    limit: 6
    red_threshold: 0
```

### Automatyzacja: Powiadomienie o nadchodzącym autobusie
```yaml
alias: "Powiadomienie: Bus za 5 min"
trigger:
  - platform: state
    entity_id: sensor.autobusy_wrzeszcz_pkp_1001
condition:
  - condition: template
    value_template: >
      {% set odjazdy = state_attr('sensor.autobusy_wrzeszcz_pkp_1001', 'wszystkie_odjazdy') %}
      {{ odjazdy | selectattr('linia', 'eq', '138') | selectattr('minuty', 'le', 5) | list | length > 0 }}
action:
  - service: notify.mobile_app
    data:
      message: "Twój autobus 138 odjeżdża za {{ state_attr('sensor.autobusy_wrzeszcz_pkp_1001', 'wszystkie_odjazdy') | selectattr('linia', 'eq', '138') | map(attribute='czas') | first }}!"
```

### Skrypt: Pokaż tylko nocne linie
```yaml
service: text.set_value
target:
  entity_id: text.filtr_linii_wrzeszcz_pkp_1001
data:
  value: "N3"
```

---

## 🛠️ Troubleshooting

### Problem: Karta nie pojawia się na liście
**Rozwiązanie**:
1. Sprawdź logi Home Assistant (`Ustawienia → System → Dzienniki`)
2. Upewnij się, że plik `ztm-departures-card.js` istnieje w `custom_components/ztm_trojmiasto/`
3. Zrestartuj Home Assistant
4. Wymuś odświeżenie przeglądarki (Ctrl+F5)
5. Jeśli nadal nie działa, dodaj ręcznie zasób:
   - `Ustawienia → Dashboardy → Zasoby → + Dodaj zasób`
   - URL: `/ztm_trojmiasto/ztm-departures-card.js`
   - Typ: Moduł JavaScript

### Problem: "Encja niedostępna"
**Przyczyny**:
- Nieprawidłowy ID przystanku
- Brak połączenia z API ZTM
- Sensor jeszcze się nie zaktualizował (poczekaj 60 sekund)

**Rozwiązanie**: Sprawdź stan sensora w `Narzędzia programisty → Stany`

### Problem: Nie widać niektórych kursów
**Przyczyny**:
- Kurs już odjechał (filtrowane są kursy starsze niż 2 min)
- Aktywny filtr linii (kliknij "Wszystkie")
- Limit wierszy (zwiększ parametr `limit`)

### Problem: Filtry nie zapamiętują się
**Rozwiązanie**: Sprawdź czy encja `text.filtr_linii_*` istnieje i ma prawidłową wartość

---

## 📊 Specyfikacja techniczna

### Źródło danych
- **API**: `https://ckan2.multimediagdansk.pl/departures`
- **Lista przystanków**: `https://ckan.multimediagdansk.pl/.../stopsingdansk.json`
- **Częstotliwość aktualizacji**: 60 sekund
- **Typ połączenia**: `cloud_polling`

### Mapowanie linii nocnych
```python
NIGHT_LINE_MAP = {
    '401': 'N1', '403': 'N3', '404': 'N4', '405': 'N5', 
    '406': 'N6', '408': 'N8', '409': 'N9', '411': 'N11',
    '412': 'N12', '413': 'N13', '414': 'N14', '415': 'N15'
}
```

### Rozpoznawanie tramwajów
- **Linie tramwajowe**: 1-13
- **Nocne tramwaje**: N1, N3-N6, N8-N9, N11-N15
- **Pozostałe**: autobusy

---

## 🤝 Współtworzenie

Zgłaszaj błędy i sugestie przez [Issues](https://github.com/jakubex12/ztm-3city/issues)

### Roadmapa
- [ ] Obsługa SKM/PKM (pociągi)
- [ ] Prognozy spóźnień
- [ ] Mapa przystanków
- [ ] Powiadomienia push o opóźnieniach
- [ ] Ulubione linie w edytorze

---

## 📄 Licencja

MIT License - zobacz [LICENSE](LICENSE)

## 👨‍💻 Autor

[@jakubex12](https://github.com/jakubex12)

---

## ⭐ Wsparcie projektu

Jeśli podoba Ci się ta integracja:
- ⭐ **Oznacz gwiazdką** to repozytorium
- 🐛 **Zgłaszaj bugi** przez Issues
- 💡 **Sugeruj funkcje** w Discussions

---

**Wersja**: 2026.1.rc5  
**Status**: Rozwojowa

**Testowane z Home Assistant**: >= 2024.1.0
