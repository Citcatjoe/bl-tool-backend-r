import React from 'react';
import s from './Form.module.scss';

function Form({ editionMode }) {
  return (
    <div
      id="form"
      className={
        s.form +
        (editionMode ? ' ' + s.isVisible : '') +
        ' max-w-3xl w-full h-96 fixed top-1/2 left-1/2 bg-white rounded-xl shadow-lg z-40'
      }
    >
      {/* ...contenu du formulaire... */}
    </div>
  );
}

export default Form;
