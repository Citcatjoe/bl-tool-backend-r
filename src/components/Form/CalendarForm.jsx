import React, { useState, useEffect } from 'react';

function CalendarForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du calendrier
  const [calName, setCalName] = useState('');
  const [dates, setDates] = useState([
    { text: '', date: '' }
  ]);
  const [linkGlobalTxt, setLinkGlobalTxt] = useState('');
  const [linkGlobalHref, setLinkGlobalHref] = useState('');
  const [linkGlobalNewTab, setLinkGlobalNewTab] = useState(false);

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setCalName(currentEmbed.calName || '');
      setDates(currentEmbed.dates || currentEmbed.events || [
        { text: '', date: '' }
      ]);
      // Support de l'ancien format globalLink et du nouveau format
      if (currentEmbed.globalLink) {
        setLinkGlobalTxt(currentEmbed.globalLink.text || '');
        setLinkGlobalHref(currentEmbed.globalLink.url || '');
        setLinkGlobalNewTab(false); // valeur par défaut pour l'ancien format
      } else {
        setLinkGlobalTxt(currentEmbed.linkGlobalTxt || '');
        setLinkGlobalHref(currentEmbed.linkGlobalHref || '');
        setLinkGlobalNewTab(currentEmbed.linkGlobalNewTab || false);
      }
    }
  }, [formMode, currentEmbed]);

  // Notification des changements au parent
  useEffect(() => {
    onChange({
      calName,
      dates,
      linkGlobalTxt,
      linkGlobalHref,
      linkGlobalNewTab,
      type: 'calendar'
    });
  }, [calName, dates, linkGlobalTxt, linkGlobalHref, linkGlobalNewTab]); // Suppression de onChange des dépendances

  // Gestion des dates
  const handleDateChange = (index, field, value) => {
    const newDates = [...dates];
    newDates[index][field] = value;
    setDates(newDates);
  };

  const addDate = () => {
    setDates([...dates, { text: '', date: '' }]);
  };

  const removeDate = (index) => {
    if (dates.length > 1) { // Minimum 1 date
      const newDates = dates.filter((_, i) => i !== index);
      setDates(newDates);
    }
  };

  const moveDateUp = (index) => {
    if (index > 0) {
      const newDates = [...dates];
      [newDates[index - 1], newDates[index]] = [newDates[index], newDates[index - 1]];
      setDates(newDates);
    }
  };

  const moveDateDown = (index) => {
    if (index < dates.length - 1) {
      const newDates = [...dates];
      [newDates[index], newDates[index + 1]] = [newDates[index + 1], newDates[index]];
      setDates(newDates);
    }
  };

  // Gestion du lien global
  const handleLinkGlobalTxtChange = (value) => {
    setLinkGlobalTxt(value);
  };

  const handleLinkGlobalHrefChange = (value) => {
    setLinkGlobalHref(value);
  };

  const handleLinkGlobalNewTabChange = (value) => {
    setLinkGlobalNewTab(value);
  };

  return (
    <div className="calendar-form">
      {/* Titre du calendrier */}
      <div className="mb-4">
        <label className="minilabel">
          Titre du calendrier *
        </label>
        <input
          type="text"
          value={calName}
          onChange={(e) => setCalName(e.target.value)}
          placeholder="Titre de votre calendrier"
          className="field mb-2"
          required
        />
      </div>

      {/* Dates (couples texte + date) */}
      <div className="mb-4">
        <label className="minilabel">
          Dates *
        </label>
        {dates.map((dateItem, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-3 mb-3 bg-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="minilabel">Date {index + 1}</span>
              <div className="flex gap-1">
                {/* Boutons de réorganisation */}
                <button
                  type="button"
                  onClick={() => moveDateUp(index)}
                  disabled={index === 0}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  title="Déplacer vers le haut"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDateDown(index)}
                  disabled={index === dates.length - 1}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  title="Déplacer vers le bas"
                >
                  ↓
                </button>
                {/* Bouton de suppression */}
                {dates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDate(index)}
                    className="px-2 py-1 text-xs text-red-500 hover:text-red-700"
                    title="Supprimer cette date"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            {/* Texte de la date */}
            <div className="mb-2">
              <input
                type="text"
                value={dateItem.text}
                onChange={(e) => handleDateChange(index, 'text', e.target.value)}
                placeholder="Description de la date"
                className="field mb-2"
                required
              />
            </div>
            
            {/* Date */}
            <div>
              <input
                type="date"
                value={dateItem.date}
                onChange={(e) => handleDateChange(index, 'date', e.target.value)}
                className="field mb-2"
                required
              />
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addDate}
          className="text-blick text-sm"
        >
          + Ajouter une date
        </button>
      </div>

      {/* Lien global (facultatif) */}
      <div className="mb-4">
        <label className="minilabel">
          Lien global (optionnel)
        </label>
        <div className="border border-gray-200 rounded-md p-3 bg-gray-100">
          <div className="mb-2">
            <input
              type="text"
              value={linkGlobalTxt}
              onChange={(e) => handleLinkGlobalTxtChange(e.target.value)}
              placeholder="Texte du lien (ex: Plus d'informations)"
              className="field mb-2"
            />
          </div>
          <div className="mb-2">
            <input
              type="url"
              value={linkGlobalHref}
              onChange={(e) => handleLinkGlobalHrefChange(e.target.value)}
              placeholder="URL du lien (ex: https://example.com)"
              className="field mb-2"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="linkGlobalNewTab"
              checked={linkGlobalNewTab}
              onChange={(e) => handleLinkGlobalNewTabChange(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="linkGlobalNewTab" className="text-sm text-gray-700">
              Ouvrir dans une nouvelle fenêtre
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarForm;
