import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthorPage from './pages/AuthorPage';
import LoadingPage from './components/LoadingPage';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeSwitcher from './components/ThemeSwitcher';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './app.css';
import { ConnectionService } from './connectionService';

const AppContent: React.FC = () => {
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null);
  const [dailyResetAt, setDailyResetAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Ładowanie aplikacji...");
  const connectionService = new ConnectionService();
  const { t } = useLanguage();

  useEffect(() => {
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
        
      } catch (error) {
        console.error(t('errors.initApp'), error);
        // Continue loading even if there's an error
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, [t]);

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
        </Routes>
      </div>
      <footer className="footer">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
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
