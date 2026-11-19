import React, { useRef, useState } from 'react';
import { normalizeFocal, focalStyle, DEFAULT_FOCAL } from '../data/portraitFocal';

/**
 * Éditeur de cadrage d'un portrait — modale ouverte depuis `PortraitUploader`.
 *
 * WYSIWYG : l'aperçu circulaire applique **exactement** le même CSS que la
 * restitution (`object-cover` + `object-position` + `transform: scale`), donc ce
 * que le journaliste voit ici est ce que verra le lecteur.
 *
 * - Glisser l'image = déplace le point focal (`object-position`). Le mapping
 *   px→% tient compte du zoom pour un déplacement 1:1 sous le curseur.
 * - Slider = zoom (`scale`).
 *
 * ⚠️ Limite connue : `object-position` ne peut panner que l'axe qui déborde
 * réellement du cercle (l'axe « long » de l'image). Pour un portrait vertical ou
 * carré c'est l'axe **vertical** (= la hauteur du visage, le besoin principal).
 * L'axe court reste centré, ce qui convient à un visage.
 */
const PREVIEW = 240; // px — côté de l'aperçu carré

function PortraitFocalEditor({ url, focal, onSave, onChangePhoto, onRemove, onClose }) {
  const [draft, setDraft] = useState(() => normalizeFocal(focal));
  // Dimensions naturelles de l'image, nécessaires au mapping px→% du drag.
  const natural = useRef({ w: 0, h: 0 });
  const drag = useRef(null);

  const clamp = (v) => Math.min(100, Math.max(0, v));

  const onImgLoad = (e) => {
    natural.current = { w: e.target.naturalWidth, h: e.target.naturalHeight };
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: draft.x, y: draft.y };
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    const { w, h } = natural.current;
    if (!w || !h) return;

    // Débordement de l'image en `object-fit: cover` (avant zoom) : c'est la
    // course disponible pour `object-position` sur chaque axe.
    const cover = Math.max(PREVIEW / w, PREVIEW / h);
    const overflowX = Math.max(w * cover - PREVIEW, 0);
    const overflowY = Math.max(h * cover - PREVIEW, 0);

    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    const z = draft.zoom; // le scale magnifie le déplacement visuel → on divise

    // Glisser l'image dans un sens la fait suivre le curseur (object-position décroît).
    const nx = overflowX ? drag.current.x - (dx / (overflowX * z)) * 100 : drag.current.x;
    const ny = overflowY ? drag.current.y - (dy / (overflowY * z)) * 100 : drag.current.y;
    setDraft((d) => ({ ...d, x: clamp(nx), y: clamp(ny) }));
  };

  const endDrag = (e) => {
    drag.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--ink)_50%,transparent)] p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-line rounded-lg shadow-pop w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="title-md text-ink m-0">Cadrer le portrait</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-pill text-muted hover:text-ink hover:bg-ground text-xl leading-none cursor-pointer"
            aria-label="Fermer"
            title="Fermer"
          >
            ×
          </button>
        </div>

        {/* Aperçu circulaire = pastille finale. touch-none pour capter le drag au doigt. */}
        <div className="flex justify-center">
          <div
            className="relative rounded-full overflow-hidden bg-ground cursor-grab active:cursor-grabbing touch-none select-none ring-1 ring-line"
            style={{ width: PREVIEW, height: PREVIEW }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <img
              src={url}
              alt=""
              draggable={false}
              onLoad={onImgLoad}
              className="w-full h-full object-cover pointer-events-none"
              style={focalStyle(draft)}
            />
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-2">
          Glissez l’image pour positionner le visage
        </p>

        {/* Zoom */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs font-medium text-muted w-10 flex-none">Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.02"
            value={draft.zoom}
            onChange={(e) => setDraft((d) => ({ ...d, zoom: Number(e.target.value) }))}
            className="flex-1 cursor-pointer accent-accent"
          />
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULT_FOCAL })}
            className="text-xs text-muted hover:text-ink underline flex-none cursor-pointer"
            title="Réinitialiser le cadrage"
          >
            Réinit.
          </button>
        </div>

        {/* Actions secondaires */}
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onChangePhoto}
            className="flex-1 px-3 py-2 text-ink border border-line rounded-md hover:bg-ground cursor-pointer"
          >
            Changer la photo
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex-1 px-3 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 cursor-pointer"
          >
            Retirer
          </button>
        </div>

        {/* Validation */}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 px-3 py-2 text-muted border border-line rounded-md hover:bg-ground cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="w-1/2 btn-primary rounded-md px-3 py-2 font-bold cursor-pointer"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

export default PortraitFocalEditor;
