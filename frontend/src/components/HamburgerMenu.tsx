import React, { useEffect, useRef, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

type Props = {
  username?: string | null;
  onLogout: () => void;
};

const menuBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 24,
  cursor: 'pointer',
  padding: '4px 8px'
};

const containerStyle: React.CSSProperties = {
  position: 'relative',
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 8px)',
  background: 'var(--menu-bg, #fff)',
  border: '1px solid #ddd',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  padding: 12,
  minWidth: 260,
  zIndex: 1000
};

export const HamburgerMenu: React.FC<Props> = ({ username, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [appeared, setAppeared] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      setAppeared(false);
      const id = requestAnimationFrame(() => setAppeared(true));
      return () => cancelAnimationFrame(id);
    } else {
      setAppeared(false);
    }
  }, [open]);

  return (
    <div style={containerStyle} ref={ref}>
      {username && <div style={{ opacity: 0.8, fontSize: 14 }}>👤 {username}</div>}
      <button aria-label={t('menu.openMenu')} style={menuBtnStyle} onClick={() => setOpen(!open)}>☰</button>
      {open && (
        <div className="menu-dropdown" style={{
          ...dropdownStyle,
          opacity: appeared ? 1 : 0,
          transform: appeared ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)',
          transition: 'opacity 160ms ease, transform 180ms ease'
        }}>
          <div className="menu-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <span className="menu-title" style={{ fontWeight: 600, fontSize: 14 }}>{t('menu.settings')}</span>
          </div>
          <div className="menu-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
            <span className="menu-label">{t('menu.language')}</span>
            <div style={{ position: 'static' }}>
              <LanguageSwitcher inline />
            </div>
          </div>
          <div className="menu-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
            <span className="menu-label">{t('menu.theme')}</span>
            <div style={{ position: 'static' }}>
              <ThemeSwitcher inline />
            </div>
          </div>
          <div style={{ height: 6 }} />
          <hr style={{ margin: '8px 0', border: 0, borderTop: '1px solid #eee' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/change-password" onClick={() => setOpen(false)} style={{
              padding: '8px 12px',
              borderRadius: 20,
              border: '1px solid #ddd',
              background: 'rgba(0,0,0,0.03)'
            }}>{t('menu.changePassword')}</Link>
            <button onClick={onLogout} style={{
              textAlign: 'left',
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid #ddd',
              color: '#ff4444',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 20,
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}>{t('menu.logout')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;


