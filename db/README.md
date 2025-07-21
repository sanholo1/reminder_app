# Baza danych MySQL - Aplikacja Przypomnień

## Struktura bazy danych

### Tabela `reminders`
- `id` - Unikalny identyfikator przypomnienia (VARCHAR 255)
- `activity` - Opis aktywności (VARCHAR 500)
- `datetime` - Data i czas przypomnienia (DATETIME)
- `created_at` - Data utworzenia wpisu (TIMESTAMP)

## Instalacja

1. Upewnij się, że masz zainstalowany MySQL Server
2. Uruchom skrypt inicjalizacyjny:
   ```bash
   mysql -u root -p < db/init.sql
   ```

## Konfiguracja połączenia

W plikach backendu ustaw parametry połączenia:
- host: localhost
- port: 3306
- user: root (lub inny użytkownik)
- password: twoje_hasło
- database: reminder_app

## Backup i restore

### Backup:
```bash
mysqldump -u root -p reminder_app > backup.sql
```

### Restore:
```bash
mysql -u root -p reminder_app < backup.sql
``` 