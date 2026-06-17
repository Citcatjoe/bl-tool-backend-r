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
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

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
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);
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
      brand,
      theme,
      type: 'teaser'
    });
  }, [teaserLabel, teaserTitle, linkGlobalTxt, linkGlobalHref, linkGlobalNewTab, img, brand, theme, onChange]);

  return (
    <div className="space-y-6">
      {/* Brand choice & Rubrique */}
      <div className="flex gap-6 items-start">
        {/* Brand */}
        <div className="flex-none w-44">
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Blick</span>
            </label>
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module de teaser n'est pas encore compatible avec la brand PME.">
              <input
                type="radio"
                name="brand"
                value="pme"
                checked={brand === 'pme'}
                onChange={() => setBrand('pme')}
                disabled
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-not-allowed"
              />
              <span className="text-sm text-gray-400">Pme</span>
            </label>
          </div>
        </div>

        {/* Rubrique */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rubrique *
          </label>
          <select
            value={theme || ''}
            onChange={(e) => setTheme(e.target.value || null)}
            className={`field mb-0 w-full px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer ${!theme ? 'text-gray-400' : 'text-gray-700'
              }`}
            required
          >
            <option value="" disabled hidden>Sélectionner...</option>
            <option value="Suisse" className="text-gray-700">Suisse</option>
            <option value="Inter" className="text-gray-700">Inter</option>
            <option value="Sport" className="text-gray-700">Sport</option>
          </select>
        </div>
      </div>

      <div className="py-4">
        <hr className="border-gray-200" />
      </div>

      {/* Label du teaser */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Label du teaser *
        </label>
        <input
          type="text"
          value={teaserLabel}
          onChange={(e) => setTeaserLabel(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Groenland"
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
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[115px] bg-white"
          placeholder="Ce pays que Trump veut prendre par la force&#10;Vous pouvez utiliser plusieurs lignes"
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
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Label du bouton *
              </label>
              <input
                type="text"
                value={linkGlobalTxt}
                onChange={(e) => setLinkGlobalTxt(e.target.value)}
                className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Vers l'article"
              />
            </div>

            {/* Lien du bouton */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Lien du bouton *
              </label>
              <input
                type="url"
                value={linkGlobalHref}
                onChange={(e) => setLinkGlobalHref(e.target.value)}
                className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="https://blick.ch"
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
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2 cursor-pointer"
            />
            <label htmlFor="linkGlobalNewTab" className="block text-sm text-gray-700 select-none cursor-pointer">
              Ouvrir dans un nouvel onglet
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeaserForm;
