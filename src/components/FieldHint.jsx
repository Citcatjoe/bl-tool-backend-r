import React from 'react';

/**
 * Pastille « ? » cerclée reprenant le style de tooltip du dashboard
 * (`.tooltip-trigger` / `.tooltip-content`, cf. ListItem), bulle ancrée à
 * gauche (`tooltip-left`) pour ne pas déborder d'un conteneur à overflow.
 */
function FieldHint({ text }) {
  return (
    <span className="tooltip-trigger">
      ?
      <span className="tooltip-content tooltip-left">{text}</span>
    </span>
  );
}

export default FieldHint;
