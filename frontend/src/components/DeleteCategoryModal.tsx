import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  category: string;
  reminderCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  category,
  reminderCount,
  onConfirm,
  onCancel,
  isDeleting
}) => {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  const getReminderWord = (count: number) => {
    if (count === 1) return 'przypomnienie';
    if (count < 5) return 'przypomnienia';
    return 'przypomnień';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{t('modals.deleteCategory.title')}</h3>
        </div>
        <div className="modal-body">
          <p>
            {t('modals.deleteCategory.confirm', { category })}
          </p>
          <p>
            {t('modals.deleteCategory.warning', { 
              count: reminderCount, 
              word: getReminderWord(reminderCount) 
            })}
          </p>
          <p className="warning-text">
            {t('modals.deleteCategory.irreversible')}
          </p>
        </div>
        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={onCancel}
            disabled={isDeleting}
          >
            {t('modals.deleteCategory.cancel')}
          </button>
          <button 
            className="delete-button" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? t('modals.deleteCategory.deleting') : t('modals.deleteCategory.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryModal;
