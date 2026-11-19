import React from 'react';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmer', cancelText = 'Annuler', isDestructive = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--ink)_50%,transparent)] transition-opacity" onClick={onCancel}></div>
      
      <div className="bg-surface border border-line rounded-lg shadow-pop z-10 p-6 max-w-md w-full mx-4 relative">
        <h3 className="title-lg text-ink mb-6 text-center">{title}</h3>
        <p className="text-base text-muted text-center leading-relaxed">{message}</p>
        
        <div className="flex justify-end gap-2 mt-8">
          <button 
            onClick={onCancel}
            className="w-1/2 h-11 px-4 text-ink font-medium bg-surface border border-line rounded-pill hover:bg-ground"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`w-1/2 h-11 rounded-pill font-semibold transition-all duration-300 ${
              isDestructive ? 'btn-primary' : 'btn-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
