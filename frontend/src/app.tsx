import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import LoadingPage from './components/LoadingPage';
import HamburgerMenu from './components/HamburgerMenu';
import NotificationToast from './components/NotificationToast';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './app.css';
import { ConnectionService } from './connectionService';

const AuthorPage = React.lazy(() => import('./pages/AuthorPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));

let appInitializationDone = false;

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

const requestNotificationPermission = async (
  t: (key: string) => string,
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => string,
  removeToast: (id: string) => void
) => {
  
  if (!('Notification' in window)) {
    console.log(t('notifications.browserNotSupported'));
    showToast(t('notifications.browserNotSupported'), 'warning');
    return;
  }

  
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
    
  } else {
    console.log(t('notifications.permissionAlreadyDenied'));
    showToast(t('notifications.permissionAlreadyDenied'), 'warning');
  }
};

const AppContent: React.FC = () => {
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Ładowanie aplikacji...");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const notificationPermissionChecked = useRef(false);
  const connectionService = new ConnectionService();
  const { t } = useLanguage();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [username, setUsername] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  
  useEffect(() => {
    if (appInitializationDone) {
      return;
    }
    appInitializationDone = true;

    const initializeApp = async () => {
      try {
        setLoadingMessage(t('loading.server'));
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        if (token) {
          setLoadingMessage(t('loading.data'));
          const res = await connectionService.request<any>('/reminders');
          if (res.dailyRemaining !== undefined) setDailyRemaining(res.dailyRemaining);
        }
        
        setLoadingMessage(t('loading.finalizing'));
        await new Promise(resolve => setTimeout(resolve, 300)); 
        
        
        if (!notificationPermissionChecked.current) {
          await requestNotificationPermission(t, showToast, removeToast);
          notificationPermissionChecked.current = true;
        }
        
      } catch (error) {
        console.error(t('errors.initApp'), error);
        
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Decode username whenever token changes
  React.useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload?.username || null);
      } catch {
        setUsername(null);
      }
    } else {
      setUsername(null);
    }
  }, [token]);

  if (isLoading) {
    return <LoadingPage message={loadingMessage} />;
  }

  if (!token) {
    return <LoginPage onLogin={(tok) => { localStorage.setItem('authToken', tok); setToken(tok); try { const payload = JSON.parse(atob(tok.split('.')[1])); setUsername(payload?.username || null); } catch { setUsername(null); } }} />;
  }

  return (
    <Router>
      {/* Fixed top-right position to mimic previous language/theme controls */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
        <HamburgerMenu username={username} onLogout={() => { localStorage.removeItem('authToken'); setToken(null); }} />
      </div>

      <div className="container">
        <nav className="nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/">{t('navigation.home')}</Link>
            <Link to="/author">{t('navigation.author')}</Link>
            <Link to="/contact">{t('navigation.contact')}</Link>
          </div>
        </nav>
        {dailyRemaining !== null && (
          <div className="usage-badge" style={{ top: 64 }}>
            {t('usage.remainingAttempts')} {dailyRemaining}
          </div>
        )}
        <Routes>
          <Route path="/" element={<HomePage onRefreshUsage={async () => {
            try {
              const res = await connectionService.request<any>('/reminders');
              if (res.dailyRemaining !== undefined) setDailyRemaining(res.dailyRemaining);
            } catch {}
          }} />} />
          <Route path="/author" element={
            <React.Suspense fallback={<LoadingPage message="Ładowanie..." />}> 
              <AuthorPage />
            </React.Suspense>
          } />
          <Route path="/contact" element={
            <React.Suspense fallback={<LoadingPage message="Ładowanie..." />}> 
              <ContactPage />
            </React.Suspense>
          } />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Routes>
      </div>
      <footer className="footer">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
      
          
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
