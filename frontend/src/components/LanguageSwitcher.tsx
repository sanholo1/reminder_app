import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

type Props = { inline?: boolean };

const LanguageSwitcher: React.FC<Props> = ({ inline }) => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: 'pl' | 'en') => {
    setLanguage(newLanguage);
  };

  return (
    <div className={`language-switcher${inline ? ' inline' : ''}`}>
      <button
        className={`language-button ${language === 'pl' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('pl')}
        title={t('language.polish')}
      >
        <span className="switcher-icon" aria-hidden>🇵🇱</span>
        <span className="switcher-label">PL</span>
      </button>
      <button
        className={`language-button ${language === 'en' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('en')}
        title={t('language.english')}
      >
        <span className="switcher-icon" aria-hidden>🇬🇧</span>
        <span className="switcher-label">EN</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
