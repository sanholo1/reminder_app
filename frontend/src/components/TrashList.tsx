import React from 'react';

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

const TrashList: React.FC<TrashListProps> = ({ trashItems, loadingTrash, onRestoreItem }) => (
  <div className="trash-section">
    <h2 className="trash-title">🗑️ Kosz</h2>
    {loadingTrash ? (
      <div className="loading">Ładowanie kosza...</div>
    ) : trashItems.length === 0 ? (
      <div className="no-trash">Kosz jest pusty</div>
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
                Usunięto: {item.deleted_at}
              </div>
            </div>
            <button 
              className="restore-button" 
              onClick={() => onRestoreItem(item.id)}
              title="Przywróć przypomnienie"
            >
              🔄 Przywróć
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default TrashList;
