import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const AuthorPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <p>{t('author.title')}<br/>{t('author.project')}<br/>{t('author.year')}</p>
      <p>{t('author.github')} <a href="https://github.com/sanholo1" target="_blank" rel="noopener noreferrer">sanholo1</a></p>
    </div>
  );
};

export default AuthorPage; 