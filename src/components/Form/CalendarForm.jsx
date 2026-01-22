import React, { useState, useEffect } from 'react';

function CalendarForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du calendrier
  const [calName, setCalName] = useState('');
  const [calWording, setCalWording] = useState('');
  const [nbElements, setNbElements] = useState(3);
  const [dates, setDates] = useState([
    { id: Math.random().toString(36).substr(2, 9), text: '', date: '', endDate: '', showBadge: false, liveLinkEnabled: false, liveLinkUrl: '' }
  ]);
  const [linkGlobalTxt, setLinkGlobalTxt] = useState('');
  const [linkGlobalHref, setLinkGlobalHref] = useState('');
  const [linkGlobalNewTab, setLinkGlobalNewTab] = useState(false);

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setCalName(currentEmbed.calName || '');
      setCalWording(currentEmbed.calWording || '');
      // Map nbElemsToShow -> nbElements
      setNbElements(currentEmbed.nbElemsToShow || 3);
      
      const formatDateForInput = (timestampOrDate) => {
        if (!timestampOrDate) return '';
        let d = timestampOrDate;
        if (d.toDate) d = d.toDate(); // Handle Firestore Timestamp
        if (typeof d === 'string') d = new Date(d); // Handle string
        
        if (isNaN(d.getTime())) return '';

        // Format to YYYY-MM-DDTHH:mm for input type="datetime-local"
        const pad = (n) => n < 10 ? '0' + n : n;
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      const initialDates = currentEmbed.dates || [];
      if (initialDates.length > 0) {
        const mappedDates = initialDates.map((d, i) => ({
          id: d.id || Math.random().toString(36).substr(2, 9),
          text: d.text || '',
          // Map scheduleStart -> date
          date: formatDateForInput(d.scheduleStart || d.date), 
          // Map scheduleEnd -> endDate
          endDate: formatDateForInput(d.scheduleEnd || d.endDate),
          showBadge: d.showBadge || false,
          // Map liveLinkExists -> liveLinkEnabled
          liveLinkEnabled: d.liveLinkExists || d.liveLinkEnabled || false,
          liveLinkUrl: d.liveLinkUrl || ''
        }));

        // Sort dates chronologically
        mappedDates.sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1; // Empty dates at the end
          if (!b.date) return -1;
          return a.date.localeCompare(b.date);
        });

        setDates(mappedDates);
      } else {
        setDates([{ id: Math.random().toString(36).substr(2, 9), text: '', date: '', endDate: '', showBadge: false, liveLinkEnabled: false, liveLinkUrl: '' }]);
      }

      setLinkGlobalTxt(currentEmbed.linkGlobalTxt || '');
      setLinkGlobalHref(currentEmbed.linkGlobalHref || '');
      setLinkGlobalNewTab(currentEmbed.linkGlobalNewTab || false);
    }
  }, [formMode, currentEmbed]);

  // Notification des changements au parent
  useEffect(() => {
    onChange({
      calName,
      calWording,
      nbElements,
      dates,
      linkGlobalTxt,
      linkGlobalHref,
      linkGlobalNewTab,
      type: 'calendar'
    });
  }, [calName, calWording, nbElements, dates, linkGlobalTxt, linkGlobalHref, linkGlobalNewTab, onChange]);

  // Gestion des dates
  const handleDateChange = (index, field, value) => {
    const newDates = [...dates];
    newDates[index][field] = value;
    setDates(newDates);
  };

  const addDate = () => {
    setDates([...dates, { id: Math.random().toString(36).substr(2, 9), text: '', date: '', endDate: '', showBadge: false, liveLinkEnabled: false, liveLinkUrl: '' }]);
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
    <div className="space-y-6">
      {/* Section 1 : Titre et Wording */}
      <div className="flex gap-4">
        <div className="w-[45%]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre du calendrier *
          </label>
          <input
            type="text"
            value={calName}
            onChange={(e) => setCalName(e.target.value)}
            placeholder="Matchs de poules Suisse - Mondial 2026"
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="w-[45%]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wording du calendrier
          </label>
          <input
            type="text"
            value={calWording}
            onChange={(e) => setCalWording(e.target.value)}
            placeholder="Ex: Ne ratez aucun match de la Nati"
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-[10%]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nb start
          </label>
          <select
            value={nbElements}
            onChange={(e) => setNbElements(parseInt(e.target.value, 10))}
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 2 : Dates (couples texte + date + options) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Dates *
        </label>
        <div className="space-y-4">
          {dates.map((dateItem, index) => (
            <div key={dateItem.id} className="border border-gray-300 rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Date {index + 1}</span>
                <div className="flex gap-2">
                  {/* <button
                    type="button"
                    onClick={() => moveDateUp(index)}
                    disabled={index === 0}
                    className="btn-form"
                    title="Déplacer vers le haut"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDateDown(index)}
                    disabled={index === dates.length - 1}
                    className="btn-form"
                    title="Déplacer vers le bas"
                  >
                    ↓
                  </button> */}
                  {dates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDate(index)}
                      className="btn-form btn-delete"
                      title="Supprimer cette date"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              {/* Champs principaux : Label, Date, Terminé */}
              <div className="grid grid-cols-2 gap-4 mb-2">
                {/* Libellé (50%) */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Wording 
                  </label>
                  <input
                    type="text"
                    value={dateItem.text}
                    onChange={(e) => handleDateChange(index, 'text', e.target.value)}
                    placeholder="Ex: Suisse - France"
                    className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                {/* Dates (Start + End) aligned with column 2 */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date Début (25%) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Start
                    </label>
                    <input
                      type="datetime-local"
                      value={dateItem.date}
                      onChange={(e) => handleDateChange(index, 'date', e.target.value)}
                      className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Date Fin (25%) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      End {dateItem.showBadge && '*'}
                    </label>
                    <input
                      type="datetime-local"
                      value={dateItem.endDate}
                      onChange={(e) => handleDateChange(index, 'endDate', e.target.value)}
                      className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={dateItem.showBadge}
                    />
                  </div>
                </div>
              </div>

              {/* Options : Badges et Live Link */}
              <div className="grid grid-cols-2 gap-4 items-start">
                {/* Checkboxes */}
                <div className="flex flex-row gap-6 pt-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`showBadge-${index}`}
                      checked={dateItem.showBadge}
                      onChange={(e) => handleDateChange(index, 'showBadge', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`showBadge-${index}`} className="text-sm text-gray-700 select-none">
                      Afficher les badges
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`liveLink-${index}`}
                      checked={dateItem.liveLinkEnabled}
                      onChange={(e) => handleDateChange(index, 'liveLinkEnabled', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`liveLink-${index}`} className="text-sm text-gray-700 select-none">
                      Activer un lien live
                    </label>
                  </div>
                </div>

                {/* Champ URL Live conditionnel */}
                {dateItem.liveLinkEnabled && (
                  <div>
                    <input
                      type="url"
                      value={dateItem.liveLinkUrl}
                      onChange={(e) => handleDateChange(index, 'liveLinkUrl', e.target.value)}
                      placeholder="URL du live"
                      className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <button
          type="button"
          onClick={addDate}
          className="text-blick text-sm mt-3 font-medium hover:underline"
        >
          + Ajouter une date
        </button>
      </div>

      {/* Section 3 : Lien global */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Lien global
        </label>
        <div className="bg-gray-50 border border-gray-300 p-4 rounded-md">
          {/* Champs du lien sur la même ligne */}
          <div className="flex gap-4 items-center">
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Texte de lien global
              </label>
              <input
                type="text"
                value={linkGlobalTxt}
                onChange={(e) => handleLinkGlobalTxtChange(e.target.value)}
                placeholder="Vers la billeterie"
                className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Url du lien global
              </label>
              <input
                type="url"
                value={linkGlobalHref}
                onChange={(e) => handleLinkGlobalHrefChange(e.target.value)}
                placeholder="www.billeterie.com"
                className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Checkbox alignée */}
            <div className="flex items-center mt-5">
              <input
                type="checkbox"
                id="linkGlobalNewTab"
                checked={linkGlobalNewTab}
                onChange={(e) => handleLinkGlobalNewTabChange(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="linkGlobalNewTab" className="text-sm text-gray-700 whitespace-nowrap select-none">
                Nouvel onglet
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarForm;
