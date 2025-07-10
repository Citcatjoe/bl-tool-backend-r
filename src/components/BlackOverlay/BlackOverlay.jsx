import React from 'react';
import s from './BlackOverlay.module.scss';

function BlackOverlay({ editionMode }) {
  return (
    <div id="black-overlay" className={s.blackOverlay + (editionMode ? ' ' + s.isVisible : '')}></div>
  );
}

export default BlackOverlay;
