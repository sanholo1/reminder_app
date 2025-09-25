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
        🇵🇱 PL
      </button>
      <button
        className={`language-button ${language === 'en' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('en')}
        title={t('language.english')}
      >
        🇬🇧 EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
