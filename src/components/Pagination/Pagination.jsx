import React from 'react';
import s from './Pagination.module.scss';

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 2) {
      end = 3;
    } else if (currentPage >= totalPages - 1) {
      start = totalPages - 2;
    }

    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className={s.paginationContainer}>
      {/* Bouton Précédent */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={s.navButton}
      >
        Précédent
      </button>

      {/* Numéros de pages */}
      {pages.map((page, idx) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${idx}`} className={s.ellipsis}>
              ...
            </span>
          );
        }
        return (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page)}
            className={`${s.pageButton} ${currentPage === page ? s.active : ''}`}
          >
            {page}
          </button>
        );
      })}

      {/* Bouton Suivant */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={s.navButton}
      >
        Suivant
      </button>
    </div>
  );
}

export default Pagination;
