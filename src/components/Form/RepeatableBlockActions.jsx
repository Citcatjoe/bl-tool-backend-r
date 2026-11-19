import React from 'react';

function RepeatableBlockActions({ index, total, onMoveUp, onMoveDown, onRemove, title, allowRemoveAll = false }) {
  return (
    <div className="flex justify-between items-center bg-accent-soft px-4 h-10 border-b border-line">
      <h4 className="font-semibold text-sm text-ink select-none m-0">
        {title || `Élément ${index + 1}`}
      </h4>
      <div className="flex gap-1">
        {onMoveUp && (
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="h-6 w-6 text-xs text-muted bg-surface hover:text-accent hover:border-accent disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted disabled:cursor-not-allowed flex items-center justify-center border border-line rounded transition-colors"
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
            className="h-6 w-6 text-xs text-muted bg-surface hover:text-accent hover:border-accent disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted disabled:cursor-not-allowed flex items-center justify-center border border-line rounded transition-colors"
            title="Descendre"
          >
            ▼
          </button>
        )}
        {(allowRemoveAll || total > 1) && onRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="h-6 w-6 text-xs text-red-500 bg-surface hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center border border-red-200 rounded transition-colors ml-2"
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
