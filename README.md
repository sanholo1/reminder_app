# Aplikacja Przypomnień

Inteligentna aplikacja do tworzenia przypomnień używająca języka naturalnego w języku polskim.

## Funkcjonalności

- Tworzenie przypomnień używając języka naturalnego
- Obsługa języka polskiego - wszystkie komunikaty i parsowanie
- Baza danych MySQL - trwałe przechowywanie przypomnień
- Lista przypomnień - wyświetlanie wszystkich utworzonych przypomnień
- Responsywny design - działa na wszystkich urządzeniach

## Wymagania

- Node.js (wersja 16 lub nowsza)
- MySQL Server
- npm lub yarn

## Instalacja

### 1. Sklonuj repozytorium
```bash
git clone <repository-url>
cd reminder_app
```

### 2. Skonfiguruj bazę danych MySQL

#### a) Uruchom MySQL Server
Upewnij się, że MySQL Server jest uruchomiony na porcie 3306.

#### b) Utwórz bazę danych
```bash
mysql -u root -p < db/init.sql
```

#### c) Skonfiguruj połączenie
Edytuj dane logowania w plikach:
- `backend/src/commands/create_command.ts`
- `backend/src/queries/get_query.ts`
- `backend/src/server.ts`

```typescript
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',           // Twój użytkownik MySQL
  password: 'password',   // Twoje hasło MySQL
  database: 'reminder_app',
  // ...
};
```

### 3. Zainstaluj zależności

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

## Uruchomienie

### 1. Uruchom backend
```bash
cd backend
npm start
```
Backend będzie dostępny na `http://localhost:3001`

### 2. Uruchom frontend (w nowym terminalu)
```bash
cd frontend
npm start
```
Frontend będzie dostępny na `http://localhost:3000`

## Użycie

### Przykłady przypomnień:

#### Czasy względne:
- `kup mleko jutro o 15`
- `spotkanie za godzinę`
- `zadzwoń do mamy wieczorem`
- `wizyta u dentysty za 2 godziny`

#### Dni tygodnia:
- `sprzątanie w poniedziałek o 10`
- `spotkanie w piątek o 14:30`

#### Daty kalendarzowe:
- `urodziny 25 lipca o 18`
- `wakacje za tydzień o 8`

#### Czasy względne:
- `rano` (9:00)
- `w południe` (12:00)
- `wieczorem` (20:00)

## Struktura bazy danych

### Tabela `reminders`
- `id` - Unikalny identyfikator
- `activity` - Opis aktywności
- `datetime` - Data i czas przypomnienia
- `created_at` - Data utworzenia

## Konfiguracja

### Backend
- Port: 3001
- Baza danych: MySQL
- Język: TypeScript

### Frontend
- Port: 3000
- Framework: React + TypeScript
- Proxy: automatyczne przekierowanie na backend

## Struktura projektu

```
reminder_app/
├── backend/
│   ├── src/
│   │   ├── commands/          # Logika tworzenia przypomnień
│   │   ├── queries/           # Logika pobierania przypomnień
│   │   └── server.ts          # Serwer Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Główny komponent
│   │   └── App.css            # Style
│   └── package.json
├── db/
│   ├── schema.sql             # Schemat bazy danych
│   ├── init.sql               # Skrypt inicjalizacyjny
│   └── README.md              # Dokumentacja bazy danych
└── README.md
```

## Rozwiązywanie problemów

### Błąd połączenia z bazą danych
1. Sprawdź czy MySQL Server jest uruchomiony
2. Sprawdź dane logowania w plikach backend
3. Upewnij się, że baza `reminder_app` istnieje

### Błąd proxy w frontendzie
1. Sprawdź czy backend działa na porcie 3001
2. Sprawdź konfigurację proxy w `frontend/package.json`

### Błędy parsowania
1. Upewnij się, że używasz polskich nazw dni/miesięcy
2. Sprawdź format czasu (HH:MM lub HH)

## Wsparcie

W przypadku problemów sprawdź:
1. Logi serwera w terminalu backend
2. Logi przeglądarki (F12 → Console)
3. Status bazy danych MySQL

## Funkcjonalności do dodania

- [ ] Edycja przypomnień
- [ ] Usuwanie przypomnień
- [ ] Powiadomienia push
- [ ] Kategorie przypomnień
- [ ] Eksport/import danych 

---

## 1. **Zaloguj się do MySQL jako administrator**

Otwórz terminal i wpisz:
```bash
mysql -u root -p
```
Jeśli nie masz hasła, spróbuj:
```bash
mysql -u root
```
Jeśli nie działa, spróbuj uruchomić terminal jako administrator.

---

## 2. **Zmień hasło użytkownika `root`**

W konsoli MySQL wpisz:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'TwojeNoweHaslo';
FLUSH PRIVILEGES;
```
Zamień `TwojeNoweHaslo` na swoje własne, silne hasło.

---

## 3. **(Opcjonalnie) Utwórz nowego użytkownika do aplikacji**

To bezpieczniejsze niż używanie `root`!

```sql
CREATE USER 'reminder_user'@'localhost' IDENTIFIED BY 'TwojeHaslo';
GRANT ALL PRIVILEGES ON reminder_app.* TO 'reminder_user'@'localhost';
FLUSH PRIVILEGES;
```
- `reminder_user` – nazwa użytkownika (możesz zmienić)
- `TwojeHaslo` – hasło do tego użytkownika

---

## 4. **Zmień konfigurację w aplikacji**

W plikach backendu (`backend/src/commands/create_command.ts`, `backend/src/queries/get_query.ts`, `backend/src/server.ts`) ustaw:
```typescript
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'reminder_user',      // lub 'root'
  password: 'TwojeHaslo',     // wpisz tu swoje hasło
  database: 'reminder_app',
  // ...
};
```

---

## 5. **Zrestartuj backend**

```bash
cd backend
npm start
```

---

## 6. **Test**

Jeśli wszystko jest poprawnie ustawione, backend powinien się uruchomić bez błędów o dostępie do bazy.

---

### Jeśli pojawią się błędy — skopiuj je tutaj, pomogę rozwiązać!

---

**Podsumowanie:**  
- Najlepiej utwórz osobnego użytkownika do aplikacji.
- Ustaw silne hasło.
- Zmień konfigurację w kodzie.
- Zrestartuj backend.

Daj znać, jeśli chcesz, żebym przygotował gotowe komendy do wklejenia! 