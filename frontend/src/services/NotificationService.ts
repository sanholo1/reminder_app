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
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      
      if (this.audioContext.state === 'suspended') {
        console.log('AudioContext jest zawieszony podczas inicjalizacji, wznawiam...');
        await this.audioContext.resume();
        console.log('AudioContext state po wznowieniu:', this.audioContext.state);
      }
      
      
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
      return; 
    }

    console.log('Uruchamiam system powiadomień dźwiękowych...');
    
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      console.log('AudioContext jest zawieszony przy starcie, wznawiam...');
      this.audioContext.resume().then(() => {
        console.log('AudioContext state po wznowieniu przy starcie:', this.audioContext?.state);
      });
    }
    
    
    this.checkInterval = setInterval(() => {
      this.checkActiveReminders();
    }, 30000);

    
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
      
      
      if (!this.lastCheckedReminders.has(reminder.id)) {
        console.log(`Nowe przypomnienie! Dodaję do pamięci i pokazuję powiadomienie`);
        this.lastCheckedReminders.add(reminder.id);
        this.showNotification(reminder);
        
        this.playNotificationSound().catch(error => {
          console.warn('Błąd podczas odtwarzania dźwięku powiadomienia:', error);
        });
      } else {
        console.log(`Przypomnienie już było sprawdzane: ${reminder.id}`);
      }
    });

    
    if (this.lastCheckedReminders.size > 100) {
      const reminderIds = Array.from(this.lastCheckedReminders);
      this.lastCheckedReminders = new Set(reminderIds.slice(-50));
      console.log('Wyczyszczono stare ID z pamięci');
    }
  }

  private showNotification(reminder: ActiveReminder) {
    
    if (!('Notification' in window)) {
      console.log('Ta przeglądarka nie wspiera powiadomień');
      return;
    }


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

    
    setTimeout(() => {
      notification.close();
    }, 10000);

    
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
        
        if (this.audioContext.state === 'suspended') {
          console.log('AudioContext jest zawieszony, wznawiam...');
          await this.audioContext.resume();
          console.log('AudioContext state po wznowieniu:', this.audioContext.state);
        }
        
        
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

  
  testSound() {
    console.log('=== TEST DŹWIĘKU ===');
    console.log('AudioContext state:', this.audioContext?.state);
    console.log('NotificationSound loaded:', !!this.notificationSound);
    
    
    if (!this.notificationSound) {
      console.warn('Dźwięk powiadomienia nie został załadowany. Próbuję ponownie...');
      this.initializeAudio().then(() => {
        console.log('Ponowna inicjalizacja zakończona, odtwarzam dźwięk...');
        this.playNotificationSound();
      });
      return;
    }
    
    
    this.playNotificationSound().catch(error => {
      console.warn('Błąd podczas testowania dźwięku:', error);
    });
  }

  
  cleanup() {
    console.log('Czyszczenie NotificationService...');
    this.stopChecking();
    this.lastCheckedReminders.clear();
    console.log('NotificationService wyczyszczony');
  }
}
