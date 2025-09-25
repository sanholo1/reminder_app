import React, { useEffect, useState } from 'react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

type Props = { onLogin: (token: string) => void };

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        // Check if it's an invalid credentials error and use translation
        console.log('Server error:', data?.error); // Debug log
        if (data?.error === 'Invalid login credentials' || data?.error === 'Nieprawidłowe dane logowania') {
          setError(t('login.invalidCredentials'));
        } else {
          setError(data?.error || t('login.error'));
        }
      } else if (data?.token) {
        onLogin(data.token);
      } else {
        setError(t('login.invalidResponse'));
      }
    } catch (e: any) {
      setError(e?.message || t('login.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <LanguageSwitcher inline />
        <ThemeSwitcher inline />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="login-card" style={{ width: 360, background: 'var(--card-bg, #fff)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>{t('login.title')}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label className="login-label" style={{ display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{t('login.username')}</label>
              <input className="login-input" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="login-label" style={{ display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{t('login.password')}</label>
              <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }} />
            </div>
            {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
            <button className="login-submit" type="submit" disabled={!username || !password || loading} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>{loading ? t('login.logging') : t('login.submit')}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


