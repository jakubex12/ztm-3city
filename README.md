# ZTM Trójmiasto (Tristar) - Integracja Home Assistant

Niestandardowa integracja dla Home Assistant, dostarczająca **rzeczywiste czasy odjazdów** (LIVE) komunikacji miejskiej w Trójmieście (Gdańsk, Gdynia, Sopot). Integracja korzysta z otwartych danych systemu TRISTAR.

Projekt zawiera **dedykowaną kartę Lovelace**, która instaluje się automatycznie wraz z integracją.


## ✨ Możliwości

* **⚡ Dane na żywo:** Uwzględnia opóźnienia (Real-time). Jeśli autobus stoi w korku, czas zostanie zaktualizowany.
* **🔍 Wyszukiwanie przystanków:** Nie musisz znać ID słupka. Wpisz "Wołkowyska" lub "Dworzec", a integracja wyświetli listę do wyboru.
* **🎨 Dedykowana Karta:** Piękna, stylowa karta, która nie wymaga konfiguracji YAML ani zewnętrznych dodatków.
* **🔘 Interaktywne Filtrowanie:** Kliknij numer linii na karcie, aby pokazać tylko jej odjazdy. Wszystko działa natychmiastowo w przeglądarce.
* **🤖 Automatyzacje:** Dla każdego przystanku tworzona jest też encja `text`, która pamięta wybrany filtr, co pozwala na użycie jej w automatyzacjach.

## 📥 Instalacja

### HACS (Zalecane)

1.  Otwórz HACS -> Integracje.
2.  Dodaj to repozytorium jako **Niestandardowe repozytorium** (Custom Repository):
    * URL: `https://github.com/jakubex12/ztm-3city`
    * Typ: **Integracja**
3.  Kliknij **Pobierz**.
4.  **Zrestartuj Home Assistant**.

### Instalacja Ręczna

1.  Pobierz folder `custom_components/ztm_trojmiasto` z tego repozytorium.
2.  Wgraj go do folderu `/config/custom_components/` w Twoim Home Assistant.
3.  Zrestartuj Home Assistant.

## ⚙️ Konfiguracja

1.  Przejdź do **Ustawienia** -> **Urządzenia i usługi**.
2.  Kliknij **Dodaj integrację**.
3.  Wyszukaj **ZTM Trójmiasto**.
4.  Wpisz nazwę przystanku (np. `Dworzec Główny`).
5.  Wybierz właściwy słupek z listy rozwijanej.

## 🚌 Karta Dashboard (Lovelace)

Integracja automatycznie rejestruje zasób wymagany do działania karty. Nie musisz niczego pobierać ręcznie.

### Jak dodać kartę?

1.  Wejdź na swój Dashboard i kliknij **Edytuj**.
2.  Dodaj nową kartę i wybierz **"Ręczna" (Manual)** (na samym dole).
3.  Wklej poniższą konfigurację:

```yaml
type: custom:ztm-departures-card
title: 🚌 Przystanek Wołkowyska
entity: sensor.autobusy_wolkowyska_1848_wszystkie
limit: 6
```
### 🎛️ Dostępne opcje
| Opcja | Wymagane | Typ | Opis | Przykład |
| :--- | :---: | :---: | :--- | :--- |
| **`type`** | ✅ TAK | `string` | Musi być dokładnie: `custom:ztm-departures-card`. | `custom:ztm-departures-card` |
| **`entity`** | ✅ TAK | `string` | ID sensora zawierającego listę odjazdów (z końcówką `_wszystkie`). | `sensor.autobusy_wolkowyska_01_wszystkie` |
| **`title`** | ❌ NIE | `string` | Własny nagłówek karty. Jeśli nie podasz, wyświetli się "Odjazdy". | `🚌 Do Pracy` |
| **`limit`** | ❌ NIE | `number` | Maksymalna liczba wyświetlanych wierszy. Domyślnie `10`. | `5` |

## 🛠️ Rozwiązywanie problemów
🔴 "Custom element doesn't exist: ztm-departures-card"
Jeśli po dodaniu karty widzisz czerwony błąd, oznacza to, że przeglądarka wczytała Dashboard zanim integracja zdążyła zarejestrować kartę.

Rozwiązanie:

Upewnij się, że zrestartowałeś Home Assistant po instalacji.

Wyczyść pamięć podręczną przeglądarki dla Dashboardu:

Windows/Linux: Wciśnij CTRL + F5.

Mac: Wciśnij CMD + SHIFT + R.

Aplikacja mobilna: Wejdź w Ustawienia aplikacji -> Debugowanie -> Wyczyść cache frontend.

🔴 Brak przystanków przy wyszukiwaniu
Upewnij się, że wpisujesz polską nazwę poprawnie (choć wielkość liter nie ma znaczenia). Jeśli lista się nie ładuje, API Tristar może być tymczasowo niedostępne. Spróbuj ponownie za chwilę.

### 📄 Licencja
MIT License. Dane pochodzą z otwartego API systemu TRISTAR (Gdańsk/Gdynia/Sopot).