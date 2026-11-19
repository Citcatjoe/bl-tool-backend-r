import { WIDGET_TYPES } from '../data/widgetTypes';

/**
 * Étiquette de type de widget : teinte propre au type (variables
 * `--type-<tone>-bg` / `--type-<tone>-fg` de tokens.css) et libellé français,
 * tirés du registre `WIDGET_TYPES`. Type inconnu : teinte neutre `accent-soft`.
 * Réutilisée par la liste (`ListItem`) et la modale de création (`NewWidgetPicker`).
 */
function TypeBadge({ type, className = '' }) {
  const entry = WIDGET_TYPES.find((w) => w.type === type);
  const style = entry
    ? { backgroundColor: `var(--type-${entry.tone}-bg)`, color: `var(--type-${entry.tone}-fg)` }
    : { backgroundColor: 'var(--accent-soft)', color: 'var(--ink)' };
  return (
    <span
      className={`inline-block px-[9px] py-1 rounded-sm text-[11px] leading-[14px] font-bold uppercase tracking-[0.06em] whitespace-nowrap ${className}`}
      style={style}
    >
      {entry?.label || type || 'Inconnu'}
    </span>
  );
}

export default TypeBadge;
