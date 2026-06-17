import React from 'react';

function RepeatableBlockActions({ index, total, onMoveUp, onMoveDown, onRemove, title }) {
  return (
    <div className="flex justify-between items-center bg-gray-200 px-4 h-10 border-b border-gray-300">
      <div className="font-semibold text-sm text-gray-700 select-none">
        {title || `Élément ${index + 1}`}
      </div>
      <div className="flex gap-1">
        {onMoveUp && (
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="h-6 w-6 text-xs text-gray-600 bg-white hover:text-blue-600 hover:border-blue-300 disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center border border-gray-300 rounded shadow-sm transition-colors"
            title="Monter"
          >
            ▲
          </button>
        )}
        {onMoveDown && (
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            className="h-6 w-6 text-xs text-gray-600 bg-white hover:text-blue-600 hover:border-blue-300 disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center border border-gray-300 rounded shadow-sm transition-colors"
            title="Descendre"
          >
            ▼
          </button>
        )}
        {total > 1 && onRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="h-6 w-6 text-xs text-red-500 bg-white hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center border border-red-200 rounded shadow-sm transition-colors ml-2"
            title="Supprimer"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default RepeatableBlockActions;
