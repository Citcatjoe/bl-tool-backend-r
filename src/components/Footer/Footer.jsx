import React from 'react';
import Pagination from '../Pagination/Pagination';
import s from './Footer.module.scss';

function Footer({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <footer className={s.footer}>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </footer>
  );
}

export default Footer;
