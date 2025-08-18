# System Powiadomień Dźwiękowych - Reminder App

## Jak to działa

Aplikacja teraz automatycznie sprawdza co 30 sekund, czy są aktywne przypomnienia (przypomnienia, które powinny się uruchomić w danym momencie). Gdy znajdzie aktywne przypomnienie:

1. **Pokazuje powiadomienie systemowe** (jeśli przeglądarka to wspiera)
2. **Odtwarza dźwięk powiadomienia**
3. **Zapobiega duplikatom** - każde przypomnienie jest odtwarzane tylko raz

## Wymagania

### Backend
- Uruchom backend na porcie 3001
- Wykonaj migracje bazy danych:
  ```bash
  cd backend
  npm run typeorm migration:run
  ```

### Frontend
- Uruchom frontend na porcie 3000
- Zastąp plik `frontend/public/notification-sound.mp3` własnym dźwiękiem

## Jak dodać własny dźwięk

1. Znajdź dźwięk w formacie MP3 (możesz użyć darmowych z):
   - https://freesound.org/
   - https://mixkit.co/free-sound-effects/
   - https://www.zapsplat.com/

2. Zmień nazwę na `notification-sound.mp3`

3. Umieść w folderze `frontend/public/`

## Testowanie

1. Uruchom aplikację
2. Kliknij przycisk "🔊 Testuj dźwięk" aby sprawdzić czy dźwięk działa
3. Utwórz przypomnienie na kilka minut w przyszłość
4. Poczekaj aż przypomnienie się uruchomi - powinieneś usłyszeć dźwięk i zobaczyć powiadomienie

## Uwagi techniczne

- System sprawdza przypomnienia co 30 sekund
- Uwzględnia margines 1 minuty przed i po zaplanowanym czasie
- Powiadomienia są wyświetlane tylko dla nowych przypomnień (nie duplikowane)
- Dźwięk działa tylko gdy karta przeglądarki jest otwarta
- System automatycznie prosi o uprawnienia do powiadomień

## Rozwiązywanie problemów

### Dźwięk nie działa
- Sprawdź czy plik `notification-sound.mp3` istnieje w `frontend/public/`
- Sprawdź czy przeglądarka nie blokuje autoodtwarzania
- Sprawdź konsolę przeglądarki pod kątem błędów

### Powiadomienia nie działają
- Sprawdź czy przeglądarka wspiera powiadomienia
- Sprawdź uprawnienia w ustawieniach przeglądarki
- Sprawdź czy nie są zablokowane przez system operacyjny

### Backend nie odpowiada
- Sprawdź czy backend działa na porcie 3001
- Sprawdź czy baza danych jest uruchomiona
- Wykonaj migracje bazy danych
