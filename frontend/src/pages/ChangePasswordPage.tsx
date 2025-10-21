import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getErrorMessage } from '../utils/errorHandler';

const ChangePasswordPage: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (newPassword !== confirm) {
      setError(t('changePassword.mismatch'));
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
      if (!res.ok) throw new Error(data?.error || t('changePassword.error'));
      setOk(true);
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (e: any) {
      setError(getErrorMessage(e, t, 'changePassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <h2 className="cp-title">{t('changePassword.title')}</h2>
        <form className="change-password-form" onSubmit={submit}>
          <div className="cp-field">
            <label className="cp-label">{t('changePassword.oldPassword')}</label>
            <input className="cp-input" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
          </div>
          <div className="cp-field">
            <label className="cp-label">{t('changePassword.newPassword')}</label>
            <input className="cp-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="cp-field">
            <label className="cp-label">{t('changePassword.confirmPassword')}</label>
            <input className="cp-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          {error && <div className="cp-error">{error}</div>}
          {ok && <div className="cp-success">{t('changePassword.success')}</div>}
          <button className="cp-submit" type="submit" disabled={!oldPassword || !newPassword || loading}>{loading ? t('changePassword.saving') : t('changePassword.submit')}</button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;


