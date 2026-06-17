import React, { useState, useEffect } from 'react';
import teamsData from '../../data/teams.json';
import competitionsData from '../../data/competitions.json';

function PronoForm({ currentEmbed, formMode, onChange }) {
  // States
  const [event, setEvent] = useState('');
  const [date, setDate] = useState('');
  
  const [item1Name, setItem1Name] = useState('');
  const [item1Color, setItem1Color] = useState('#000000');
  
  const [item2Name, setItem2Name] = useState('');
  const [item2Color, setItem2Color] = useState('#000000');

  // We keep track of votes to preserve them
  const [item1Votes, setItem1Votes] = useState(0);
  const [item2Votes, setItem2Votes] = useState(0);
  const [item3Votes, setItem3Votes] = useState(0); // Draw votes

  // Brand & theme (rubrique)
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

  // Initialisation
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed && currentEmbed.pronoData) {
      setEvent(currentEmbed.pronoData.event || '');
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);
      
      // Handle Date/Timestamp
      if (currentEmbed.pronoData.date) {
        const timestamp = currentEmbed.pronoData.date;
        let dateString = '';
        if (timestamp.toDate) {
             dateString = timestamp.toDate().toISOString().slice(0, 10);
        } else if (typeof timestamp === 'string') {
             dateString = timestamp.slice(0, 10);
        }
        setDate(dateString);
      }

      setItem1Name(currentEmbed.pronoData.item1?.name || '');
      setItem1Color(currentEmbed.pronoData.item1?.color || '#000000');
      setItem1Votes(currentEmbed.pronoData.item1?.votes || 0);
      
      setItem2Name(currentEmbed.pronoData.item2?.name || '');
      setItem2Color(currentEmbed.pronoData.item2?.color || '#000000');
      setItem2Votes(currentEmbed.pronoData.item2?.votes || 0);

      setItem3Votes(currentEmbed.pronoData.item3?.votes || 0);
    }
  }, [formMode, currentEmbed]);

  // Helper pour gérer le changement d'équipe et la couleur auto
  const handleTeamChange = (teamName, setName, setColor) => {
    setName(teamName);
    // Vérifier si une couleur est définie pour cette équipe dans teams.json
    const team = teamsData.find(t => t.name === teamName);
    if (team && team.color) {
      setColor(team.color);
    }
  };

  // Notification des changements
  useEffect(() => {
    let dateObj = null;
    if (date) {
        // Create date at noon to avoid timezone shift issues on day boundaries
        dateObj = new Date(date + 'T12:00:00');
    }

    // Find codes for selected teams
    const team1Data = teamsData.find(t => t.name === item1Name);
    const team2Data = teamsData.find(t => t.name === item2Name);

    onChange({
      type: 'prono',
      brand,
      theme,
      pronoData: {
        event: event,
        date: dateObj, // Will be converted to Timestamp in Form.jsx or kept as Date
        item1: {
          name: item1Name,
          code: team1Data ? team1Data.code : '',
          type: team1Data ? team1Data.type : '',
          color: item1Color,
          votes: item1Votes
        },
        item2: {
          name: item2Name,
          code: team2Data ? team2Data.code : '',
          type: team2Data ? team2Data.type : '',
          color: item2Color,
          votes: item2Votes
        },
        item3: { // Draw
            votes: item3Votes
        }
      }
    });
  }, [event, date, item1Name, item1Color, item2Name, item2Color, item1Votes, item2Votes, item3Votes, brand, theme, onChange]);

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
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module de pronostic n'est pas encore compatible avec la brand PME.">
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

      {/* Contexte & Date */}
      <div className="flex gap-4 items-end">
        {/* Contexte */}
        <div className="w-[70%]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contexte *
          </label>
          <select
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className={`field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer ${!event ? 'text-gray-400' : 'text-gray-700'}`}
            required
          >
            <option value="" disabled hidden>Sélectionner une compétition</option>
            {competitionsData.map((comp) => (
              <option key={comp.name} value={comp.name}>{comp.name}</option>
            ))}
          </select>
        </div>
        {/* Date */}
        <div className="w-[30%]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            required
          />
        </div>
      </div>

      {/* Équipes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Équipes *
        </label>
        <div className="bg-gray-50 border border-gray-300 p-4 rounded-md space-y-4">
          {/* LIGNE 1 : Équipe 1 */}
          <div className="flex gap-4 items-end">
            <div className="w-[70%]">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Équipe 1 *
              </label>
              <select
                value={item1Name}
                onChange={(e) => handleTeamChange(e.target.value, setItem1Name, setItem1Color)}
                className={`field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer ${!item1Name ? 'text-gray-400' : 'text-gray-700'}`}
                required
              >
                <option value="" disabled hidden>Sélectionner une équipe</option>
                {teamsData
                  .filter(team => team.type === 'national')
                  .map((team) => (
                    <option key={team.name} value={team.name}>{team.name}</option>
                  ))}
              </select>
            </div>
            <div className="w-[30%]">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Couleur de la barre
              </label>
              <div className="flex items-center gap-2 h-10">
                <input
                  type="color"
                  value={item1Color}
                  onChange={(e) => setItem1Color(e.target.value)}
                  className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer bg-white"
                />
                <span className="text-xs text-gray-500">{item1Color}</span>
              </div>
            </div>
          </div>

          {/* LIGNE 2 : Équipe 2 */}
          <div className="flex gap-4 items-end">
            <div className="w-[70%]">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Équipe 2 *
              </label>
              <select
                value={item2Name}
                onChange={(e) => handleTeamChange(e.target.value, setItem2Name, setItem2Color)}
                className={`field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer ${!item2Name ? 'text-gray-400' : 'text-gray-700'}`}
                required
              >
                <option value="" disabled hidden>Sélectionner une équipe</option>
                {teamsData
                  .filter(team => team.type === 'national')
                  .map((team) => (
                    <option key={team.name} value={team.name}>{team.name}</option>
                  ))}
              </select>
            </div>
            <div className="w-[30%]">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Couleur de la barre
              </label>
              <div className="flex items-center gap-2 h-10">
                <input
                  type="color"
                  value={item2Color}
                  onChange={(e) => setItem2Color(e.target.value)}
                  className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer bg-white"
                />
                <span className="text-xs text-gray-500">{item2Color}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PronoForm;
