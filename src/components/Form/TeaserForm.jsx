import React, { useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader';

function TeaserForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du teaser
  const [teaserLabel, setTeaserLabel] = useState('');
  const [teaserTitle, setTeaserTitle] = useState('');
  const [linkGlobalTxt, setLinkGlobalTxt] = useState('');
  const [linkGlobalHref, setLinkGlobalHref] = useState('');
  const [linkGlobalNewTab, setLinkGlobalNewTab] = useState(false);
  const [img, setImg] = useState('');
  const [oldImg, setOldImg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setTeaserLabel(currentEmbed.teaserLabel || '');
      // Convertir \n en vrais retours à la ligne pour le textarea
      const teaserTitleWithLineBreaks = (currentEmbed.teaserTitle || '').replace(/\\n/g, '\n');
      setTeaserTitle(teaserTitleWithLineBreaks);
      setLinkGlobalTxt(currentEmbed.linkGlobalTxt || '');
      setLinkGlobalHref(currentEmbed.linkGlobalHref || '');
      setLinkGlobalNewTab(currentEmbed.linkGlobalNewTab || false);
      setImg(currentEmbed.img || '');
      setOldImg(currentEmbed.img || '');
    }
  }, [formMode, currentEmbed]);

  // Notification des changements au parent
  useEffect(() => {
    // Convertir les vrais retours à la ligne en \n pour la BDD
    const teaserTitleForDb = teaserTitle.replace(/\n/g, '\\n');
    onChange({
      teaserLabel,
      teaserTitle: teaserTitleForDb,
      linkGlobalTxt,
      linkGlobalHref,
      linkGlobalNewTab,
      img,
      type: 'teaser'
    });
  }, [teaserLabel, teaserTitle, linkGlobalTxt, linkGlobalHref, linkGlobalNewTab, img, onChange]);

  // ...existing code...
  return (
    <div className="space-y-4">
      {/* Label du teaser */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Label du teaser *
        </label>
        <input
          type="text"
          value={teaserLabel}
          onChange={(e) => setTeaserLabel(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Nouveau produit"
          required
        />
      </div>

      {/* Titre du teaser */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre du teaser *
        </label>
        <textarea
          value={teaserTitle}
          onChange={(e) => setTeaserTitle(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[115px]"
          placeholder="Ex: Découvrez notre nouvelle gamme&#10;Vous pouvez utiliser plusieurs lignes"
          rows={3}
          required
        />
      </div>

      {/* Image du teaser */}
      <div>
        <ImageUploader
          initialUrl={img}
          oldUrl={oldImg}
          label="Image du teaser"
          disabled={false}
          onUpload={(url) => {
            setImg(url);
            setOldImg(url);
          }}
        />
      </div>

      {/* Section Bouton d'action */}
      <div>
        <h3 className="block text-sm font-medium text-gray-700 mb-3">Bouton d'action</h3>
        <div className="bg-gray-50 border border-gray-300 p-4 rounded-md space-y-4">
          {/* Champs du bouton sur la même ligne */}
          <div className="grid grid-cols-2 gap-4"> 
            {/* Texte du bouton */}
            <div>
              <input
                type="text"
                value={linkGlobalTxt}
                onChange={(e) => setLinkGlobalTxt(e.target.value)}
                className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: En savoir plus"
              />
            </div>

            {/* Lien du bouton */}
            <div>
              <input
                type="url"
                value={linkGlobalHref}
                onChange={(e) => setLinkGlobalHref(e.target.value)}
                className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: https://example.com"
              />
            </div>
          </div>

          {/* Case à cocher pour nouvel onglet */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="linkGlobalNewTab"
              checked={linkGlobalNewTab}
              onChange={(e) => setLinkGlobalNewTab(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
            />
            <label htmlFor="linkGlobalNewTab" className="block text-sm text-gray-700">
              Ouvrir dans un nouvel onglet
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeaserForm;
