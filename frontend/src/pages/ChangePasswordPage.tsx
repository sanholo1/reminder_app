import React, { useState } from 'react';

const ChangePasswordPage: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (newPassword !== confirm) {
      setError('Hasła nie są takie same');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Błąd zmiany hasła');
      setOk(true);
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (e: any) {
      setError(e?.message || 'Błąd zmiany hasła');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Zmiana hasła</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>Stare hasło</label>
          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Nowe hasło</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Powtórz nowe hasło</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={{ width: '100%' }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        {ok && <div style={{ color: 'green', marginBottom: 12 }}>Hasło zmienione</div>}
        <button type="submit" disabled={!oldPassword || !newPassword || loading}>{loading ? 'Zapisywanie...' : 'Zmień hasło'}</button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;


