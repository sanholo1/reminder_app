import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Usuń kategorię</h3>
        </div>
        <div className="modal-body">
          <p>
            Czy na pewno chcesz usunąć kategorię <strong>"{category}"</strong>?
          </p>
          <p>
            Ta operacja usunie wszystkie przypomnienia należące do tej kategorii 
            ({reminderCount} {reminderCount === 1 ? 'przypomnienie' : reminderCount < 5 ? 'przypomnienia' : 'przypomnień'}).
          </p>
          <p className="warning-text">
            ⚠️ Tej operacji nie można cofnąć!
          </p>
        </div>
        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={onCancel}
            disabled={isDeleting}
          >
            Anuluj
          </button>
          <button 
            className="delete-button" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń kategorię'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryModal;
