# ZTM Trójmiasto (Tristar) - Integracja Home Assistant

Niestandardowa integracja (Custom Component) dla Home Assistant, dostarczająca informacje o rzeczywistych czasach odjazdów komunikacji miejskiej w Trójmieście (Gdańsk, Gdynia, Sopot). Integracja korzysta z otwartych danych systemu TRISTAR.

![Logo Integracji](logo.png)

## ✨ Możliwości

* **Wyszukiwanie po nazwie:** Nie musisz znać ID słupka. Wpisz "Dworzec" lub "Wołkowyska", a integracja wyświetli listę pasujących przystanków.
* **Dane na żywo:** Uwzględnia opóźnienia rzeczywiste (Real-time).
* **Inteligentne formatowanie:** Czas wyświetlany jako "Teraz", "za X min" lub godzina odjazdu (np. 14:35).
* **Mapowanie linii nocnych:** Automatycznie zamienia numery techniczne (np. 406) na oznaczenia nocne (N6).
* **Dwa sensory dla każdego przystanku:**
    * `..._wszystkie`: Pełna lista odjazdów w atrybutach.
    * `..._najblizsze_5`: Lista skrócona do 5 najbliższych połączeń.

## 📥 Instalacja

### Metoda 1: HACS (Zalecane)
1.  Dodaj to repozytorium jako **Niestandardowe repozytorium** (Custom Repository) w HACS.
2.  Wyszukaj "ZTM Trójmiasto" i zainstaluj.
3.  Zrestartuj Home Assistant.

### Metoda 2: Ręczna
1.  Pobierz folder `custom_components/ztm_trojmiasto` z tego repozytorium.
2.  Skopiuj go do folderu `/config/custom_components/` w swojej instalacji Home Assistant.
3.  Zrestartuj Home Assistant.

## ⚙️ Konfiguracja

Integracja jest w pełni konfigurowalna przez interfejs użytkownika (UI).

1.  Przejdź do **Ustawienia** -> **Urządzenia i usługi**.
2.  Kliknij przycisk **Dodaj integrację**.
3.  Wyszukaj **ZTM Trójmiasto**.
4.  Wpisz nazwę przystanku (np. `Wołkowyska`), a następnie wybierz właściwy słupek z listy.

## 📊 Sensory

Dla każdego dodanego przystanku tworzone są dwie encje (gdzie `XXXX` to ID słupka):

* `sensor.autobusy_[nazwa]_wszystkie` (Pełna lista w atrybutach)
* `sensor.autobusy_[nazwa]_najblizsze_5` (Lista skrócona)

## 🎨 Wygląd Dashboardu (Flex Table Card)

Do wyświetlania tabeli odjazdów zalecana jest karta **Flex Table Card**. Pozwala ona na sortowanie, filtrowanie i zaawansowane stylowanie HTML.

**Wymagania:**
* Zainstaluj dodatek **Flex Table Card** przez HACS (Frontend).

### Kod karty:

Utwórz nową kartę "Manual" (Ręczna konfiguracja) na swoim dashboardzie i wklej poniższy kod. Pamiętaj, aby **podmienić ID sensora** (`entities.include`).

```yaml
type: custom:flex-table-card
title: Odjazdy Wołkowyska
entities:
  # ▼▼▼ WKLEJ TUTAJ ID SWOJEGO SENSORA ▼▼▼
  include: sensor.autobusy_wolkowyska_01_wszystkie
columns:
  - name: Linia
    data: wszystkie_odjazdy
    modify: x.linia
    align: center
    prefix: '<span class="line-badge">'
    suffix: '</span>'
  - name: Kierunek
    data: wszystkie_odjazdy
    modify: x.kierunek
    align: left
  - name: Czas
    data: wszystkie_odjazdy
    align: right
    # Logika kolorowania czasu (Czerwony dla "Teraz", Zielony dla przyszłości)
    modify: >-
      (x.czas === 'Teraz' ? '<span class="time-now">' : '<span class="time-future">') + x.czas + '</span>'
css:
  table+: 'padding: 10px; width: 100%; border-collapse: collapse;'
  thead th: 'color: var(--secondary-text-color); font-weight: normal; padding-bottom: 10px; border-bottom: 1px solid var(--divider-color);'
  tbody tr: 'height: 40px; border-bottom: 1px solid var(--divider-color);'
  tbody tr:last-child: 'border-bottom: none;'
style: |
  .line-badge {
    background-color: var(--primary-color);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    display: inline-block;
    min-width: 30px;
  }
  .time-now {
    color: var(--error-color);
    font-weight: bold;
  }
  .time-future {
    color: var(--success-color);
    font-weight: bold;
  }