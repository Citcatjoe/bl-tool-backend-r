import React, { useState, useEffect } from 'react';
import RepeatableBlockActions from './RepeatableBlockActions';

function CalendarForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du calendrier
  const [calName, setCalName] = useState('');
  const [calWording, setCalWording] = useState('');
  const [nbElements, setNbElements] = useState('tous');
  const [dates, setDates] = useState([
    { id: Math.random().toString(36).substr(2, 9), text: '', date: '', endDate: '', showBadge: false, liveLinkEnabled: false, liveLinkUrl: '' }
  ]);
  const [linkGlobalTxt, setLinkGlobalTxt] = useState('');
  const [linkGlobalHref, setLinkGlobalHref] = useState('');
  const [linkGlobalNewTab, setLinkGlobalNewTab] = useState(false);
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setCalName(currentEmbed.calName || currentEmbed.calWording || '');
      setCalWording(currentEmbed.calWording || currentEmbed.calName || '');
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);
      // Map nbElemsToShow -> nbElements
      const loadedNb = currentEmbed.nbElemsToShow;
      setNbElements(loadedNb === 100 || loadedNb === '100' || loadedNb === 'tous' ? 'tous' : (loadedNb || 'tous'));
      
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
      brand,
      theme,
      type: 'calendar'
    });
  }, [calName, calWording, nbElements, dates, linkGlobalTxt, linkGlobalHref, linkGlobalNewTab, brand, theme, onChange]);

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
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module de calendrier n'est pas encore compatible avec la brand PME.">
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

      {/* Section 1 : Wording et Nb éléments affichés */}
      <div className="flex gap-4">
        <div className="w-[75%]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wording du calendrier *
          </label>
          <input
            type="text"
            value={calWording}
            onChange={(e) => {
              setCalWording(e.target.value);
              setCalName(e.target.value);
            }}
            placeholder="Ne ratez aucun match de la Nati"
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required
          />
        </div>
        <div className="w-[25%]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nb. d'éléments affichés
          </label>
          <select
            value={nbElements}
            onChange={(e) => {
              const val = e.target.value;
              setNbElements(val === 'tous' ? 'tous' : parseInt(val, 10));
            }}
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            <option value="tous">Tous</option>
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
            <div key={dateItem.id} className="bg-gray-50 border border-gray-300 rounded-md overflow-hidden shadow-sm">
              <RepeatableBlockActions
                index={index}
                total={dates.length}
                onRemove={dates.length > 1 ? removeDate : null}
                title={`Date ${index + 1}`}
              />
              
              <div className="p-4 bg-white space-y-4">
                {/* Champs principaux : Label, Date, Terminé */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Libellé (50%) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Wording 
                    </label>
                    <input
                      type="text"
                      value={dateItem.text}
                      onChange={(e) => handleDateChange(index, 'text', e.target.value)}
                      placeholder="Suisse - France"
                      className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                        className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                        className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                        className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      />
                    </div>
                  )}
                </div>
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
