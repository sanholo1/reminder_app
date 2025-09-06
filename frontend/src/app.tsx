import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthorPage from './pages/AuthorPage';
import ContactPage from './pages/ContactPage';
import LoadingPage from './components/LoadingPage';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeSwitcher from './components/ThemeSwitcher';
import NotificationToast from './components/NotificationToast';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './app.css';
import { ConnectionService } from './connectionService';

let appInitializationDone = false;

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// Funkcja do żądania uprawnień do powiadomień
const requestNotificationPermission = async (
  t: (key: string) => string,
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => string,
  removeToast: (id: string) => void
) => {
  // Sprawdź czy przeglądarka wspiera powiadomienia
  if (!('Notification' in window)) {
    console.log(t('notifications.browserNotSupported'));
    showToast(t('notifications.browserNotSupported'), 'warning');
    return;
  }

  // Sprawdź aktualne uprawnienia
  if (Notification.permission === 'default') {
    console.log(t('notifications.permissionRequest'));
    const infoToastId = showToast(t('notifications.permissionRequest'), 'info');
    try {
      const permission = await Notification.requestPermission();
      removeToast(infoToastId);
      if (permission === 'granted') {
        console.log(t('notifications.permissionGranted'));
        showToast(t('notifications.permissionGranted'), 'success');
      } else if (permission === 'denied') {
        console.log(t('notifications.permissionDenied'));
        showToast(t('notifications.permissionDenied'), 'warning');
      }
    } catch (error) {
      console.warn('Błąd podczas żądania uprawnień do powiadomień:', error);
      removeToast(infoToastId);
      showToast(t('notifications.permissionError'), 'error');
    }
  } else if (Notification.permission === 'granted') {
    console.log('✅ Uprawnienia już przyznane - pomijam toast');
    // Nie pokazuj toastu jeśli uprawnienia już są przyznane
  } else {
    console.log(t('notifications.permissionAlreadyDenied'));
    showToast(t('notifications.permissionAlreadyDenied'), 'warning');
  }
};

const AppContent: React.FC = () => {
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null);
  const [dailyResetAt, setDailyResetAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Ładowanie aplikacji...");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const notificationPermissionChecked = useRef(false);
  const connectionService = new ConnectionService();
  const { t } = useLanguage();

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Inicjalizacja aplikacji - tylko raz
  useEffect(() => {
    if (appInitializationDone) {
      return;
    }
    appInitializationDone = true;

    const initializeApp = async () => {
      try {
        setLoadingMessage(t('loading.server'));
        await new Promise(resolve => setTimeout(resolve, 500)); // Minimal loading time
        
        setLoadingMessage(t('loading.data'));
        const res = await connectionService.request<any>('/reminders');
        if (res.dailyRemaining !== undefined) setDailyRemaining(res.dailyRemaining);
        if (res.dailyResetAt) setDailyResetAt(res.dailyResetAt);
        
        setLoadingMessage(t('loading.finalizing'));
        await new Promise(resolve => setTimeout(resolve, 300)); // Smooth transition
        
        // Żądaj uprawnień do powiadomień tylko raz po załadowaniu aplikacji
        if (!notificationPermissionChecked.current) {
          await requestNotificationPermission(t, showToast, removeToast);
          notificationPermissionChecked.current = true;
        }
        
      } catch (error) {
        console.error(t('errors.initApp'), error);
        // Continue loading even if there's an error
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []); // Pusta tablica zależności - tylko raz

  if (isLoading) {
    return <LoadingPage message={loadingMessage} />;
  }

  return (
    <Router>
      <LanguageSwitcher />
      <ThemeSwitcher />
      <div className="container">
        <nav className="nav">
          <Link to="/">{t('navigation.home')}</Link>
          <Link to="/author">{t('navigation.author')}</Link>
          <Link to="/contact">{t('navigation.contact')}</Link>
        </nav>
        {dailyRemaining !== null && (
          <div className="usage-badge">
            {t('usage.remainingAttempts')} {dailyRemaining}
          </div>
        )}
        <Routes>
          <Route path="/" element={<HomePage onRefreshUsage={async () => {
            try {
              const res = await connectionService.request<any>('/reminders');
              if (res.dailyRemaining !== undefined) setDailyRemaining(res.dailyRemaining);
              if (res.dailyResetAt) setDailyResetAt(res.dailyResetAt);
            } catch {}
          }} />} />
          <Route path="/author" element={<AuthorPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </div>
      <footer className="footer">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
      
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <NotificationToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
