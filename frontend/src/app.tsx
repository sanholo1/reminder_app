import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthorPage from './pages/AuthorPage';
import './app.css';
import { ConnectionService } from './connectionService';

function App() {
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null);
  const [dailyResetAt, setDailyResetAt] = useState<string | null>(null);
  const connectionService = new ConnectionService();

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await connectionService.request<any>('/reminders');
        if (res.dailyRemaining !== undefined) setDailyRemaining(res.dailyRemaining);
        if (res.dailyResetAt) setDailyResetAt(res.dailyResetAt);
      } catch {}
    };
    fetchUsage();
  }, []);

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
