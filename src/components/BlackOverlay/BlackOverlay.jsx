import React from 'react';
import s from './BlackOverlay.module.scss';

function BlackOverlay({ formVisible, onClick }) {
  return (
    <div 
      id="black-overlay" 
      className={s.blackOverlay + (formVisible ? ' ' + s.isVisible : '')}
      onClick={onClick}
    ></div>
  );
}

export default BlackOverlay;
