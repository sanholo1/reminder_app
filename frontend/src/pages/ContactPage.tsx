import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>{t('contact.title')}</h2>
      <p>{t('contact.description')}</p>
      <div style={{ marginTop: '2rem' }}>
        <p>
          <strong>{t('contact.email')}:</strong>
        </p>
        <a 
          href="mailto:reminderappcontact@gmail.com"
          style={{
            color: 'var(--cuba-lime)',
            textDecoration: 'none',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          reminderappcontact@gmail.com
        </a>
      </div>
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--cuba-cream)' }}>
        <p>{t('contact.response')}</p>
      </div>
    </div>
  );
};

export default ContactPage;
