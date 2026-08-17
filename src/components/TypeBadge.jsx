import { WIDGET_TYPES } from '../data/widgetTypes';

const FALLBACK_COLOR = 'bg-gray-100 text-gray-600';

/**
 * Pastille colorée identifiant un type de widget. Couleur tirée du registre
 * `WIDGET_TYPES` (source de vérité unique), pour un rappel visuel cohérent entre
 * la liste des widgets (`ListItem`) et la modale de création (`NewWidgetPicker`).
 * Affiche la chaîne `type` brute, comme dans la liste.
 */
function TypeBadge({ type, className = '' }) {
  const color = WIDGET_TYPES.find((w) => w.type === type)?.color || FALLBACK_COLOR;
  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${color} ${className}`}>
      {type || 'unknown'}
    </span>
  );
}

export default TypeBadge;
