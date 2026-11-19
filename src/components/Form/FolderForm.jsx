import React, { useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader';
import RepeatableBlockActions from './RepeatableBlockActions';

function FolderForm({ currentEmbed, formMode, onChange }) {
  const [folderName, setFolderName] = useState('');
  const [folderLabel, setFolderLabel] = useState('');
  const [folderLabelColor, setFolderLabelColor] = useState('bg-brand');
  const [img, setImg] = useState('');
  const [buttons, setButtons] = useState([
    { id: crypto.randomUUID(), buttonTxt: '', buttonUrl: '', buttonOpensNewTab: false }
  ]);
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

  // Charger les données existantes en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      // Convertir \n en vrais retours à la ligne pour le textarea
      const folderNameWithLineBreaks = (currentEmbed.folderName || '').replace(/\\n/g, '\n');
      setFolderName(folderNameWithLineBreaks);
      setFolderLabel(currentEmbed.folderLabel || '');
      setFolderLabelColor(currentEmbed.folderLabelColor || 'bg-brand');
      setImg(currentEmbed.img || '');
      
      const loadedButtons = (currentEmbed.buttons || [{ buttonTxt: '', buttonUrl: '', buttonOpensNewTab: false }]).map((btn, index) => ({
        ...btn,
        id: btn.id || crypto.randomUUID(),
      }));
      setButtons(loadedButtons);
      
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);
    }
  }, [formMode, currentEmbed]);

  // Fonction pour remonter les données au composant parent
  useEffect(() => {
    // Convertir les vrais retours à la ligne en \n pour la BDD
    const folderNameForDb = folderName.replace(/\n/g, '\\n');
    const formData = {
      type: 'folder',
      folderName: folderNameForDb,
      folderLabel,
      folderLabelColor,
      img,
      buttons,
      brand,
      theme
    };
    onChange(formData);
  }, [folderName, folderLabel, folderLabelColor, img, buttons, brand, theme, onChange]);

  // Gestion des boutons
  const addButton = () => {
    if (buttons.length < 4) {
      setButtons([...buttons, { id: crypto.randomUUID(), buttonTxt: '', buttonUrl: '', buttonOpensNewTab: false }]);
    }
  };

  const removeButton = (index) => {
    if (buttons.length > 1) {
      const newButtons = buttons.filter((_, i) => i !== index);
      setButtons(newButtons);
    }
  };

  const updateButton = (index, field, value) => {
    const newButtons = buttons.map((button, i) => 
      i === index ? { ...button, [field]: value } : button
    );
    setButtons(newButtons);
  };

  const moveButtonUp = (index) => {
    if (index === 0) return;
    const newButtons = [...buttons];
    [newButtons[index - 1], newButtons[index]] = [newButtons[index], newButtons[index - 1]];
    setButtons(newButtons);
  };

  const moveButtonDown = (index) => {
    if (index === buttons.length - 1) return;
    const newButtons = [...buttons];
    [newButtons[index], newButtons[index + 1]] = [newButtons[index + 1], newButtons[index]];
    setButtons(newButtons);
  };

  return (
    <div className="space-y-6">
      {/* Brand choice & Rubrique */}
      <div className="flex gap-6 items-start">
        {/* Brand */}
        <div className="flex-none w-44">
          <label className="block text-sm font-medium text-ink mb-2">
            Brand
          </label>
          <div className="flex gap-4 items-center h-12">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="brand"
                value="blick"
                checked={brand === 'blick'}
                onChange={() => setBrand('blick')}
                className="w-4 h-4 text-accent border-line focus:ring-accent cursor-pointer"
              />
              <span className="text-sm text-ink">Blick</span>
            </label>
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module de dossier n'est pas encore compatible avec la brand PME.">
              <input
                type="radio"
                name="brand"
                value="pme"
                checked={brand === 'pme'}
                onChange={() => setBrand('pme')}
                disabled
                className="w-4 h-4 text-accent border-line focus:ring-accent cursor-not-allowed"
              />
              <span className="text-sm text-muted">Pme</span>
            </label>
          </div>
        </div>

        {/* Rubrique */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink mb-2">
            Rubrique *
          </label>
          <select
            value={theme || ''}
            onChange={(e) => setTheme(e.target.value || null)}
            className={`field mb-0 w-full px-3 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface cursor-pointer ${!theme ? 'text-muted' : 'text-ink'
              }`}
            required
          >
            <option value="" disabled hidden>Sélectionner...</option>
            <option value="Suisse" className="text-ink">Suisse</option>
            <option value="Inter" className="text-ink">Inter</option>
            <option value="Sport" className="text-ink">Sport</option>
          </select>
        </div>
      </div>

      <div className="py-4">
        <hr className="border-line" />
      </div>

      {/* Label du dossier */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">
          Label du dossier *
        </label>
        <input
          type="text"
          value={folderLabel}
          onChange={(e) => setFolderLabel(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
          placeholder="Sport"
          required
        />
      </div>

      {/* Couleur du label */}
      <div>
        <label className="block text-sm font-medium text-ink mb-3">
          Couleur du label *
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center">
              <input
                type="radio"
                id="color-blick"
                name="folderLabelColor"
                value="bg-brand"
                checked={folderLabelColor === 'bg-brand'}
                onChange={(e) => setFolderLabelColor(e.target.value)}
                className="mr-3 cursor-pointer"
              />
              <label htmlFor="color-blick" className="flex items-center select-none cursor-pointer">
                <span className="inline-block w-4 h-4 bg-accent rounded mr-2"></span>
                Blick (bg-brand)
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="color-sport"
                name="folderLabelColor"
                value="bg-sport"
                checked={folderLabelColor === 'bg-sport'}
                onChange={(e) => setFolderLabelColor(e.target.value)}
                className="mr-3 cursor-pointer"
              />
              <label htmlFor="color-sport" className="flex items-center select-none cursor-pointer">
                <span className="inline-block w-4 h-4 bg-green-600 rounded mr-2"></span>
                Sport (bg-sport)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Nom du dossier */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">
          Titre du dossier *
        </label>
        <textarea
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[115px] bg-surface"
          placeholder="Ne manquez aucune information sur les Jeux Olympiques&#10;Vous pouvez utiliser plusieurs lignes"
          rows={3}
          required
        />
      </div>

      {/* Image */}
      <div>
        <ImageUploader
          type="folder"
          initialUrl={img}
          oldUrl={formMode === 'edit' ? img : ''}
          label="Image du dossier *"
          disabled={false}
          onUpload={setImg}
        />
      </div>

      {/* Boutons */}
      <div>
        <label className="block text-sm font-medium text-ink mb-3">
          Boutons (1-4) *
        </label>

        <div className="space-y-4">
          {buttons.map((button, index) => (
            <div key={index} className="bg-ground border border-line rounded-md overflow-hidden ">
              <RepeatableBlockActions
                index={index}
                total={buttons.length}
                onMoveUp={moveButtonUp}
                onMoveDown={moveButtonDown}
                onRemove={buttons.length > 1 ? removeButton : null}
                title={`Bouton ${index + 1}`}
              />

              <div className="p-4 bg-surface space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Texte du bouton */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Texte du bouton <span className="sr-only">#{index + 1}</span> *
                    </label>
                    <input
                      type="text"
                      value={button.buttonTxt}
                      onChange={(e) => updateButton(index, 'buttonTxt', e.target.value)}
                      className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
                      placeholder="Texte du bouton"
                      required
                    />
                  </div>

                  {/* URL du bouton */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Url du bouton <span className="sr-only">#{index + 1}</span> *
                    </label>
                    <input
                      type="url"
                      value={button.buttonUrl}
                      onChange={(e) => updateButton(index, 'buttonUrl', e.target.value)}
                      className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                </div>

                {/* Ouvrir dans un nouvel onglet */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`buttonOpensNewTab-${index}`}
                    checked={button.buttonOpensNewTab}
                    onChange={(e) => updateButton(index, 'buttonOpensNewTab', e.target.checked)}
                    className="h-4 w-4 text-accent focus:ring-accent border-line rounded mr-2 cursor-pointer"
                  />
                  <label htmlFor={`buttonOpensNewTab-${index}`} className="block text-sm text-ink select-none cursor-pointer">
                    Ouvrir dans un nouvel onglet
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {buttons.length < 4 && (
          <button
            type="button"
            onClick={addButton}
            className="text-accent hover:underline text-sm mt-4 font-medium flex items-center"
          >
            + Ajouter un bouton
          </button>
        )}
      </div>
    </div>
  );
}

export default FolderForm;