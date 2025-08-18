import { ConnectionService } from '../connectionService';

export interface ActiveReminder {
  id: string;
  activity: string;
  datetime: string;
  category?: string | null;
  created_at?: string;
}

export interface ActiveRemindersResponse {
  activeReminders: ActiveReminder[];
  currentTime: string;
}

export class NotificationService {
  private connectionService: ConnectionService;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckedReminders: Set<string> = new Set();
  private audioContext: AudioContext | null = null;
  private notificationSound: AudioBuffer | null = null;

  constructor(connectionService: ConnectionService) {
    this.connectionService = connectionService;
    this.initializeAudio();
  }

  public async initializeAudio() {
    try {
      // Jeśli AudioContext już istnieje, nie twórz nowego
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Upewnij się, że AudioContext jest w stanie running
      if (this.audioContext.state === 'suspended') {
        console.log('AudioContext jest zawieszony podczas inicjalizacji, wznawiam...');
        await this.audioContext.resume();
        console.log('AudioContext state po wznowieniu:', this.audioContext.state);
      }
      
      // Pobierz dźwięk powiadomienia (możesz zastąpić URL swoim dźwiękiem)
      const response = await fetch('/notification-sound.mp3');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        this.notificationSound = await this.audioContext.decodeAudioData(arrayBuffer);
        console.log('Dźwięk powiadomienia został załadowany pomyślnie');
        console.log('AudioContext state po załadowaniu dźwięku:', this.audioContext.state);
      } else {
        console.warn('Nie udało się pobrać pliku dźwięku:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('Nie udało się załadować dźwięku powiadomienia:', error);
    }
  }

  startChecking() {
    if (this.checkInterval) {
      console.log('System powiadomień już działa');
      return; // Już sprawdzamy
    }

    console.log('Uruchamiam system powiadomień dźwiękowych...');
    
    // Upewnij się, że AudioContext jest gotowy
    if (this.audioContext && this.audioContext.state === 'suspended') {
      console.log('AudioContext jest zawieszony przy starcie, wznawiam...');
      this.audioContext.resume().then(() => {
        console.log('AudioContext state po wznowieniu przy starcie:', this.audioContext?.state);
      });
    }
    
    // Sprawdzaj co 30 sekund
    this.checkInterval = setInterval(() => {
      this.checkActiveReminders();
    }, 30000);

    // Sprawdź od razu przy starcie
    this.checkActiveReminders();
  }

  stopChecking() {
    if (this.checkInterval) {
      console.log('Zatrzymuję system powiadomień dźwiękowych...');
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkActiveReminders() {
    try {
      console.log('Sprawdzam aktywne przypomnienia...');
      
      // Użyj względnego URL - backend działa na tym samym porcie co frontend
      const response = await this.connectionService.request<ActiveRemindersResponse>('/reminders/active', {
        method: 'GET'
      });

      console.log('Odpowiedź z /reminders/active:', response.data);
      
      if (response.data.activeReminders && response.data.activeReminders.length > 0) {
        console.log(`Znaleziono ${response.data.activeReminders.length} aktywnych przypomnień`);
        this.handleActiveReminders(response.data.activeReminders);
      } else {
        console.log('Brak aktywnych przypomnień');
      }
    } catch (error) {
      console.warn('Błąd podczas sprawdzania aktywnych przypomnień:', error);
    }
  }

  private handleActiveReminders(reminders: ActiveReminder[]) {
    console.log('Przetwarzam aktywne przypomnienia:', reminders);
    
    reminders.forEach(reminder => {
      console.log(`Sprawdzam przypomnienie: ${reminder.id} - ${reminder.activity}`);
      
      // Sprawdź czy to nowe przypomnienie (nie było wcześniej sprawdzane)
      if (!this.lastCheckedReminders.has(reminder.id)) {
        console.log(`Nowe przypomnienie! Dodaję do pamięci i pokazuję powiadomienie`);
        this.lastCheckedReminders.add(reminder.id);
        this.showNotification(reminder);
        // Czekaj na zakończenie odtwarzania dźwięku
        this.playNotificationSound().catch(error => {
          console.warn('Błąd podczas odtwarzania dźwięku powiadomienia:', error);
        });
      } else {
        console.log(`Przypomnienie już było sprawdzane: ${reminder.id}`);
      }
    });

    // Wyczyść stare ID z pamięci (zachowaj tylko ostatnie 100)
    if (this.lastCheckedReminders.size > 100) {
      const reminderIds = Array.from(this.lastCheckedReminders);
      this.lastCheckedReminders = new Set(reminderIds.slice(-50));
      console.log('Wyczyszczono stare ID z pamięci');
    }
  }

  private showNotification(reminder: ActiveReminder) {
    // Sprawdź czy przeglądarka wspiera powiadomienia
    if (!('Notification' in window)) {
      console.log('Ta przeglądarka nie wspiera powiadomień');
      return;
    }

    // Sprawdź uprawnienia
    if (Notification.permission === 'granted') {
      this.createNotification(reminder);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification(reminder);
        }
      });
    }
  }

  private createNotification(reminder: ActiveReminder) {
    const notification = new Notification('Przypomnienie!', {
      body: reminder.activity,
      icon: '/logo192.png',
      tag: reminder.id,
      requireInteraction: true,
      silent: false
    });

    // Automatycznie zamknij po 10 sekundach
    setTimeout(() => {
      notification.close();
    }, 10000);

    // Obsługa kliknięcia w powiadomienie
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  private async playNotificationSound() {
    console.log('Próba odtworzenia dźwięku powiadomienia...');
    console.log('AudioContext state:', this.audioContext?.state);
    console.log('NotificationSound loaded:', !!this.notificationSound);
    
    if (this.audioContext && this.notificationSound) {
      try {
        // Sprawdź czy AudioContext jest zawieszony i wznów go
        if (this.audioContext.state === 'suspended') {
          console.log('AudioContext jest zawieszony, wznawiam...');
          await this.audioContext.resume();
          console.log('AudioContext state po wznowieniu:', this.audioContext.state);
        }
        
        // Poczekaj chwilę po wznowieniu AudioContext
        if (this.audioContext.state === 'running') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.notificationSound;
        source.connect(this.audioContext.destination);
        source.start(0);
        console.log('Dźwięk powiadomienia został odtworzony pomyślnie');
      } catch (error) {
        console.warn('Błąd podczas odtwarzania dźwięku:', error);
      }
    } else {
      console.warn('Brak AudioContext lub dźwięku powiadomienia');
    }
  }

  // Metoda do testowania dźwięku
  testSound() {
    console.log('=== TEST DŹWIĘKU ===');
    console.log('AudioContext state:', this.audioContext?.state);
    console.log('NotificationSound loaded:', !!this.notificationSound);
    
    // Sprawdź czy dźwięk jest załadowany
    if (!this.notificationSound) {
      console.warn('Dźwięk powiadomienia nie został załadowany. Próbuję ponownie...');
      this.initializeAudio().then(() => {
        console.log('Ponowna inicjalizacja zakończona, odtwarzam dźwięk...');
        this.playNotificationSound();
      });
      return;
    }
    
    // Odtwórz dźwięk i obsłuż błędy
    this.playNotificationSound().catch(error => {
      console.warn('Błąd podczas testowania dźwięku:', error);
    });
  }

  // Metoda do czyszczenia pamięci
  cleanup() {
    console.log('Czyszczenie NotificationService...');
    this.stopChecking();
    this.lastCheckedReminders.clear();
    console.log('NotificationService wyczyszczony');
    // NIE zamykaj AudioContext - może być potrzebny do testowania dźwięku
    // if (this.audioContext) {
    //   this.audioContext.close();
    // }
  }
}
