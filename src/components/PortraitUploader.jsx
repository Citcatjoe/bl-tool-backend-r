import React, { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { slugify } from '../data/teams';
import { DEFAULT_FOCAL, focalStyle } from '../data/portraitFocal';
import PortraitFocalEditor from './PortraitFocalEditor';

/**
 * Compresse un portrait en WebP < 10 Ko et l'upload sur Firebase Storage.
 *
 * Copie assumée de la logique d'`ImageUploader` mais avec des réglages propres
 * au portrait : petite dimension (le client l'affiche à 72 px max) et cible de
 * poids très basse. `fileType: 'image/webp'` fait la conversion **et** la
 * compression en une passe — pas besoin du canvas manuel de l'original.
 *
 */
async function uploadPortrait(file) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.01,          // ~10 Ko
    maxWidthOrHeight: 200,    // large pour un affichage à 72 px (retina compris)
    fileType: 'image/webp',
    initialQuality: 0.8,
    useWebWorker: true,
  });

  if (compressed.size > 10 * 1024) {
    console.warn(`Portrait à ${Math.round(compressed.size / 1024)} Ko : au-dessus de la cible de 10 Ko.`);
  }

  const base = slugify(file.name.replace(/\.[^/.]+$/, '')) || 'portrait';

  const storageRef = ref(getStorage(), `portraits/${Date.now()}_${base}.webp`);
  await uploadBytes(storageRef, compressed);
  return getDownloadURL(storageRef);
}

/**
 * Supprime un objet Storage à partir de son URL de download, comme le fait
 * `ImageUploader` : un changement de portrait ne laisse pas l'ancien fichier.
 * Best-effort — un échec (droits, déjà supprimé) est juste logué.
 *
 * ⚠️ Contrepartie du gel : un widget déjà publié qui a figé cette URL affichera
 * une image cassée si le portrait de l'équipe change ensuite.
 */
async function deletePortrait(url) {
  const match = url && url.match(/\/o\/([^?]*)/);
  if (!match) return;
  try {
    await deleteObject(ref(getStorage(), decodeURIComponent(match[1])));
  } catch (err) {
    console.error('Suppression du portrait échouée :', err);
  }
}

/**
 * Pastille de portrait circulaire, cliquable pour choisir/cadrer l'image.
 * Affiche un placeholder gris (comme le reste de l'app) tant qu'aucune photo,
 * la vignette cadrée une fois uploadée. Cliquer une vignette ouvre l'éditeur de
 * cadrage (`PortraitFocalEditor`), depuis lequel on change ou retire aussi la photo.
 *
 * `focal` / `onFocalChange` sont optionnels : sans `onFocalChange`, la vignette
 * reste affichée mais le cadrage n'est pas éditable (le composant se contente de
 * restituer `focal`).
 */
function PortraitUploader({ value, onChange, focal, onFocalChange, disabled = false, size = 36 }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const dim = { width: size, height: size };

  const emitFocal = (f) => { if (onFocalChange) onFocalChange(f); };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // autorise le re-choix du même fichier
    if (!file) return;
    setUploading(true);
    setError('');
    const previous = value;
    try {
      const url = await uploadPortrait(file);
      onChange(url);
      emitFocal({ ...DEFAULT_FOCAL }); // nouvelle image → cadrage repart de zéro
      if (previous) deletePortrait(previous); // l'ancien fichier ne traîne pas
      if (onFocalChange) setEditing(true); // ouvre le cadrage dans la foulée
    } catch (err) {
      console.error('Échec de l’upload du portrait :', err);
      setError('Échec du portrait.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    const previous = value;
    onChange('');
    emitFocal({ ...DEFAULT_FOCAL });
    setEditing(false);
    if (previous) deletePortrait(previous);
  };

  // Clic sur une vignette : ouvre l'éditeur si le cadrage est éditable, sinon
  // (compat) retombe sur le retrait direct.
  const handleThumbClick = () => {
    if (onFocalChange) setEditing(true);
    else handleRemove();
  };

  const hasPortrait = value && !uploading;

  return (
    <div className="flex items-center gap-2 flex-none">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={disabled || uploading}
      />

      {/*
        Portrait présent : la vignette applique le cadrage (`focalStyle`) et
        s'ouvre au clic dans l'éditeur (où l'on cadre, change ou retire la
        photo). Un picto « recadrer » apparaît au survol. Portrait absent : le
        cercle pointillé ouvre le sélecteur de fichier.
      */}
      {hasPortrait ? (
        <button
          type="button"
          onClick={handleThumbClick}
          disabled={disabled}
          title={onFocalChange ? 'Cadrer le portrait' : 'Retirer le portrait'}
          className="relative rounded-full flex-none overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={dim}
        >
          {/* Le `scale` du cadrage fait déborder l'image : le parent
              `overflow-hidden` la reclippe au cercle. */}
          <img src={value} alt="" className="w-full h-full object-cover bg-gray-200" style={focalStyle(focal)} />
          {/* Voile + picto révélés au survol / focus seulement. */}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
            {onFocalChange ? (
              <svg viewBox="0 0 24 24" className="w-1/2 h-1/2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-1/2 h-1/2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            )}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          title="Ajouter un portrait"
          className="relative rounded-full flex-none overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={dim}
        >
          {uploading ? (
            <span className="text-[10px] text-gray-400 animate-pulse">…</span>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 8v8M8 12h8" />
            </svg>
          )}
        </button>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}

      {/* Éditeur de cadrage. `key={value}` : un changement de photo le remonte
          avec la nouvelle image (et ses dimensions naturelles). */}
      {editing && value && onFocalChange && (
        <PortraitFocalEditor
          key={value}
          url={value}
          focal={focal}
          onSave={(f) => { emitFocal(f); setEditing(false); }}
          onChangePhoto={() => inputRef.current?.click()}
          onRemove={handleRemove}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

export default PortraitUploader;
