import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TrashItem {
  id: string;
  activity: string;
  datetime: string;
  category?: string | null;
  deleted_at: string;
  created_at: string;
}

interface TrashListProps {
  trashItems: TrashItem[];
  loadingTrash: boolean;
  onRestoreItem: (id: string) => void;
}

const TrashList: React.FC<TrashListProps> = ({ trashItems, loadingTrash, onRestoreItem }) => {
  const { t } = useLanguage();
  
  return (
    <div className="trash-section">
      <h2 className="trash-title">{t('trash.title')}</h2>
      {loadingTrash ? (
        <div className="loading">{t('trash.loading')}</div>
      ) : trashItems.length === 0 ? (
        <div className="no-trash">{t('trash.empty')}</div>
      ) : (
        <div className="trash-list">
          {trashItems.map((item) => (
            <div key={item.id} className="trash-item">
              <div className="trash-content">
                <div className="trash-activity"><strong>{item.activity}</strong></div>
                <div className="trash-datetime">{item.datetime}</div>
                {item.category && (
                  <div className="trash-category">
                    <span className="category-badge">{item.category}</span>
                  </div>
                )}
                <div className="trash-deleted-at">
                  {t('trash.deleted')} {item.deleted_at}
                </div>
              </div>
              <button 
                className="restore-button" 
                onClick={() => onRestoreItem(item.id)}
                title={t('trash.restore')}
              >
                🔄 {t('trash.restore')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashList;
