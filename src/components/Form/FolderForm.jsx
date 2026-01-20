import React, { useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader';

function FolderForm({ currentEmbed, formMode, onChange }) {
  const [folderName, setFolderName] = useState('');
  const [folderLabel, setFolderLabel] = useState('');
  const [folderLabelColor, setFolderLabelColor] = useState('bg-brand');
  const [img, setImg] = useState('');
  const [buttons, setButtons] = useState([
    { buttonTxt: '', buttonUrl: '', buttonOpensNewTab: false }
  ]);

  // Charger les données existantes en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      // Convertir \n en vrais retours à la ligne pour le textarea
      const folderNameWithLineBreaks = (currentEmbed.folderName || '').replace(/\\n/g, '\n');
      setFolderName(folderNameWithLineBreaks);
      setFolderLabel(currentEmbed.folderLabel || '');
      setFolderLabelColor(currentEmbed.folderLabelColor || 'bg-brand');
      setImg(currentEmbed.img || '');
      setButtons(currentEmbed.buttons || [{ buttonTxt: '', buttonUrl: '', buttonOpensNewTab: false }]);
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
      buttons
    };
    onChange(formData);
  }, [folderName, folderLabel, folderLabelColor, img, buttons, onChange]);

  // Gestion des boutons
  const addButton = () => {
    if (buttons.length < 4) {
      setButtons([...buttons, { buttonTxt: '', buttonUrl: '', buttonOpensNewTab: false }]);
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

  const moveButton = (index, direction) => {
    const newButtons = [...buttons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < buttons.length) {
      [newButtons[index], newButtons[targetIndex]] = [newButtons[targetIndex], newButtons[index]];
      setButtons(newButtons);
    }
  };

  return (
    <div className="space-y-4">
      {/* Nom du dossier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre du dossier *
        </label>
        <textarea
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[115px]"
          placeholder="Entrez le titre du dossier&#10;Vous pouvez utiliser plusieurs lignes"
          rows={3}
          required
        />
      </div>

      {/* Label du dossier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Label du dossier *
        </label>
        <input
          type="text"
          value={folderLabel}
          onChange={(e) => setFolderLabel(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Entrez le label du dossier"
          required
        />
      </div>

      {/* Couleur du label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
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
                className="mr-3"
              />
              <label htmlFor="color-blick" className="flex items-center">
                <span className="inline-block w-4 h-4 bg-blick rounded mr-2"></span>
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
                className="mr-3"
              />
              <label htmlFor="color-sport" className="flex items-center">
                <span className="inline-block w-4 h-4 bg-green-600 rounded mr-2"></span>
                Sport (bg-sport)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Image */}
      <div>
        <ImageUploader
          type="folder"
          initialUrl={img}
          oldUrl={formMode === 'edit' ? img : ''}
          label="Image du dossier"
          disabled={false}
          onUpload={setImg}
        />
      </div>

      {/* Boutons */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Boutons (1-4) *
        </label>

        <div className="space-y-4">
          {buttons.map((button, index) => (
            <div key={index} className="border border-gray-300 rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700">Bouton {index + 1}</h4>
                <div className="flex gap-2">
                  {/* Boutons de déplacement toujours présents, désactivés si inutilisables */}
                  <button
                    type="button"
                    onClick={() => moveButton(index, 'up')}
                    className="btn-form"
                    title="Monter"
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveButton(index, 'down')}
                    className="btn-form"
                    title="Descendre"
                    disabled={index === buttons.length - 1}
                  >
                    ↓
                  </button>
                  {/* Bouton de suppression masqué si un seul bouton */}
                  {buttons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeButton(index)}
                      className="btn-form btn-delete"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Texte du bouton */}
                <div>
                  <input
                    type="text"
                    value={button.buttonTxt}
                    onChange={(e) => updateButton(index, 'buttonTxt', e.target.value)}
                    className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Texte du bouton"
                    required
                  />
                </div>

                {/* URL du bouton */}
                <div>
                  <input
                    type="url"
                    value={button.buttonUrl}
                    onChange={(e) => updateButton(index, 'buttonUrl', e.target.value)}
                    className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                    required
                  />
                </div>
              </div>

              {/* Ouvrir dans un nouvel onglet */}
              <div className="mt-3">
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={button.buttonOpensNewTab}
                    onChange={(e) => updateButton(index, 'buttonOpensNewTab', e.target.checked)}
                    className="mr-2"
                  />
                  Ouvrir dans un nouvel onglet
                </label>
              </div>
            </div>
          ))}
        </div>

        {buttons.length < 4 && (
          <button
            type="button"
            onClick={addButton}
            className="text-blick text-sm mt-3"
          >
            + Ajouter un bouton
          </button>
        )}
      </div>
    </div>
  );
}

export default FolderForm;