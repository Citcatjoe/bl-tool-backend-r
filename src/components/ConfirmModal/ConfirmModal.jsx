import React from 'react';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmer', cancelText = 'Annuler', isDestructive = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onCancel}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl z-10 p-6 max-w-md w-full mx-4 relative">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">{title}</h3>
        <p className="text-base text-gray-600 text-center leading-relaxed">{message}</p>
        
        <div className="flex justify-end gap-2 mt-8">
          <button 
            onClick={onCancel}
            className="w-1/2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`w-1/2 rounded-md font-bold transition-all duration-300 ${
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
