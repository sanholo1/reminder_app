import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher">
      <button
        className={`theme-button ${theme === 'light' ? 'active' : ''}`}
        onClick={() => setTheme('light')}
        title="Light mode"
      >
        ☀️ Light
      </button>
      <button
        className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
        title="Dark mode"
      >
        🌙 Dark
      </button>
    </div>
  );
};

export default ThemeSwitcher;
