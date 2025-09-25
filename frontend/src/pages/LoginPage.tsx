import React, { useState } from 'react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeSwitcher from '../components/ThemeSwitcher';

type Props = { onLogin: (token: string) => void };

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError(data?.error || 'Błąd logowania');
      } else if (data?.token) {
        onLogin(data.token);
      } else {
        setError('Nieprawidłowa odpowiedź serwera');
      }
    } catch (e: any) {
      setError(e?.message || 'Błąd sieci');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 12 }}>
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: 360, background: 'var(--card-bg, #fff)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: 24 }}>
          <h2 style={{ margin: '0 0 16px' }}>Logowanie</h2>
          <p style={{ margin: '0 0 20px', opacity: 0.7 }}>Zaloguj się, aby kontynuować</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Login</label>
              <input value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Hasło</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }} />
            </div>
            {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
            <button type="submit" disabled={!username || !password || loading} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: '#2f6df2', color: '#fff', cursor: 'pointer' }}>{loading ? 'Logowanie...' : 'Zaloguj'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


