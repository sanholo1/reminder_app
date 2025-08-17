import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthorPage from './pages/AuthorPage';
import LoadingPage from './components/LoadingPage';
import './app.css';
import { ConnectionService } from './connectionService';

function App() {
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null);
  const [dailyResetAt, setDailyResetAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Ładowanie aplikacji...");
  const connectionService = new ConnectionService();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingMessage("Sprawdzanie połączenia z serwerem...");
        await new Promise(resolve => setTimeout(resolve, 500)); // Minimal loading time
        
        setLoadingMessage("Pobieranie danych aplikacji...");
        const res = await connectionService.request<any>('/reminders');
        if (res.dailyRemaining !== undefined) setDailyRemaining(res.dailyRemaining);
        if (res.dailyResetAt) setDailyResetAt(res.dailyResetAt);
        
        setLoadingMessage("Finalizowanie ładowania...");
        await new Promise(resolve => setTimeout(resolve, 300)); // Smooth transition
        
      } catch (error) {
        console.error('Błąd podczas inicjalizacji aplikacji:', error);
        // Continue loading even if there's an error
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  if (isLoading) {
    return <LoadingPage message={loadingMessage} />;
  }

  return (
    <Router>
      <div className="container">
        <nav className="nav">
          <Link to="/">Strona główna</Link>
          <Link to="/author">O autorze</Link>
        </nav>
        {dailyRemaining !== null && (
          <div className="usage-badge">
            Pozostałe użycia: {dailyRemaining}
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
        © {new Date().getFullYear()} sanholo1
      </footer>
    </Router>
  );
}

export default App;
