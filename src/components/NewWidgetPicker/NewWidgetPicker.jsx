import { useEffect, useRef } from 'react';
import BlackOverlay from '../BlackOverlay/BlackOverlay';
import TypeBadge from '../TypeBadge';
import { WIDGET_TYPES } from '../../data/widgetTypes';

/**
 * Modale de choix du type de widget à créer. Remplace l'ancien menu déroulant
 * « + » devenu trop haut : une grille de cartes (nom + description) qui tient la
 * charge quel que soit le nombre de types, et laisse la place de lever les
 * ambiguïtés de nommage (ex. « Joueur du match » vs « NatiNotes »).
 *
 * Réutilise l'infra modale du dashboard (`BlackOverlay` + coque animée calquée
 * sur `TeamEditor`). `onPick(type)` déclenche la création ; la fermeture se fait
 * au clic sur le voile, sur « × », ou avec Échap.
 */
/**
 * Types retirés de la grille de création (masquage temporaire lors d'un sprint
 * non encore publié). Laisser vide en temps normal.
 *
 * On filtre ici plutôt que de retirer l'entrée de `WIDGET_TYPES` : le registre
 * sert aussi au badge et au libellé des widgets déjà créés (`ListItem`,
 * `TypeBadge`) — l'en retirer les afficherait en gris avec le libellé « Inconnu ».
 */
const HIDDEN_TYPES = [];

function NewWidgetPicker({ isOpen, onClose, onPick }) {
  const firstCardRef = useRef(null);
  const visibleTypes = WIDGET_TYPES.filter((w) => !HIDDEN_TYPES.includes(w.type));

  // Échap ferme la modale, comme les autres surfaces du dashboard.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Focus la première carte à l'ouverture (navigation clavier).
  useEffect(() => {
    if (isOpen) firstCardRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      <BlackOverlay formVisible={isOpen} onClick={onClose} />

      <div
        id="new-widget-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Créer un widget"
        className={`max-w-2xl w-full h-auto overflow-y-auto fixed top-1/2 left-1/2 max-h-[80vh] bg-white rounded-xl shadow-lg z-40 flex flex-col -translate-x-1/2 transition-all duration-150 ease-in-out ${
          isOpen
            ? 'opacity-100 visible -translate-y-1/2'
            : 'opacity-0 invisible translate-y-[calc(-50%+40px)]'
        }`}
      >
        <div className="flex justify-between items-center px-6 py-4 bg-gray-200 border-b border-gray-300 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">Créer un widget</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-semibold transition-colors"
            title="Fermer"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleTypes.map((w, i) => (
              <button
                key={w.type}
                ref={i === 0 ? firstCardRef : null}
                type="button"
                onClick={() => onPick(w.type)}
                className="flex flex-col items-center text-center p-3 border border-gray-300 rounded-md hover:border-blick hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                {/* Badge = rappel visuel du même code couleur que dans la liste */}
                <TypeBadge type={w.type} />
                <div className="font-semibold text-sm text-gray-800 mt-1.5">{w.label}</div>
                <div className="text-xs text-gray-500 mt-2">{w.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default NewWidgetPicker;
