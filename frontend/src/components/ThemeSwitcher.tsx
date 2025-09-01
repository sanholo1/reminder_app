import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="theme-switcher">
      <button
        className={`theme-button ${theme === 'light' ? 'active' : ''}`}
        onClick={() => setTheme('light')}
        title={`${t('theme.light')} mode`}
      >
        ☀️ {t('theme.light')}
      </button>
      <button
        className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
        title={`${t('theme.dark')} mode`}
      >
        🌙 {t('theme.dark')}
      </button>
    </div>
  );
};

export default ThemeSwitcher;
