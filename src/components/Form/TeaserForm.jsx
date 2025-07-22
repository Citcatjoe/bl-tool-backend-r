import React, { useState, useEffect } from 'react';

function TeaserForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du teaser
  const [teaserLabel, setTeaserLabel] = useState('');
  const [teaserTitle, setTeaserTitle] = useState('');
  const [linkGlobalTxt, setLinkGlobalTxt] = useState('');
  const [linkGlobalHref, setLinkGlobalHref] = useState('');
  const [linkGlobalNewTab, setLinkGlobalNewTab] = useState(false);
  const [img, setImg] = useState('');

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setTeaserLabel(currentEmbed.teaserLabel || '');
      setTeaserTitle(currentEmbed.teaserTitle || '');
      setLinkGlobalTxt(currentEmbed.linkGlobalTxt || '');
      setLinkGlobalHref(currentEmbed.linkGlobalHref || '');
      setLinkGlobalNewTab(currentEmbed.linkGlobalNewTab || false);
      setImg(currentEmbed.img || '');
    }
  }, [formMode, currentEmbed]);

  // Notification des changements au parent
  useEffect(() => {
    onChange({
      teaserLabel,
      teaserTitle,
      linkGlobalTxt,
      linkGlobalHref,
      linkGlobalNewTab,
      img,
      type: 'teaser'
    });
  }, [teaserLabel, teaserTitle, linkGlobalTxt, linkGlobalHref, linkGlobalNewTab, img, onChange]);

  return (
    <div className="teaser-form">
      {/* Label du teaser */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Label du teaser *
        </label>
        <input
          type="text"
          value={teaserLabel}
          onChange={(e) => setTeaserLabel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Nouveau produit"
          required
        />
      </div>

      {/* Titre du teaser */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre du teaser *
        </label>
        <input
          type="text"
          value={teaserTitle}
          onChange={(e) => setTeaserTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Découvrez notre nouvelle gamme"
          required
        />
      </div>

      {/* Image du teaser */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image du teaser
        </label>
        <input
          type="text"
          value={img}
          onChange={(e) => setImg(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: teaser-product.jpg"
        />
        <p className="text-xs text-gray-500 mt-1">
          Nom du fichier image (à uploader manuellement sur le serveur)
        </p>
      </div>

      {/* Section Bouton d'action */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Bouton d'action</h3>
        
        {/* Texte du bouton */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texte du bouton
          </label>
          <input
            type="text"
            value={linkGlobalTxt}
            onChange={(e) => setLinkGlobalTxt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: En savoir plus"
          />
        </div>

        {/* Lien du bouton */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lien du bouton
          </label>
          <input
            type="url"
            value={linkGlobalHref}
            onChange={(e) => setLinkGlobalHref(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: https://example.com"
          />
        </div>

        {/* Case à cocher pour nouvel onglet */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="linkGlobalNewTab"
            checked={linkGlobalNewTab}
            onChange={(e) => setLinkGlobalNewTab(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="linkGlobalNewTab" className="ml-2 block text-sm text-gray-700">
            Ouvrir dans un nouvel onglet
          </label>
        </div>
      </div>

      {/* Aperçu si tous les champs principaux sont remplis */}
      {teaserLabel && teaserTitle && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu :</h4>
          <div className="text-xs text-gray-600">
            <div><strong>Label:</strong> {teaserLabel}</div>
            <div><strong>Titre:</strong> {teaserTitle}</div>
            {img && <div><strong>Image:</strong> {img}</div>}
            {linkGlobalTxt && <div><strong>Bouton:</strong> {linkGlobalTxt}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeaserForm;
