import React, { useState, useEffect } from 'react';
import teamsData from '../../data/teams.json';

function PotmForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du POTM
  const [sport, setSport] = useState('Football');
  const [category, setCategory] = useState('Messieurs');
  const [matchText, setMatchText] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [players, setPlayers] = useState([
    { id: Date.now() + '-0', name: '', position: 'Attaquant', team: 'Suisse', votes: 0 },
    { id: Date.now() + '-1', name: '', position: 'Attaquant', team: 'Suisse', votes: 0 }
  ]);

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setSport(currentEmbed.context?.sport || 'Football');
      setCategory(currentEmbed.context?.category || 'Messieurs');
      setMatchText(currentEmbed.context?.text || '');
      
      // Convertir le Timestamp Firebase en format date
      if (currentEmbed.context?.date) {
        const timestamp = currentEmbed.context.date;
        let dateString = '';
        
        if (timestamp.toDate) {
          // C'est un Timestamp Firebase
          const date = timestamp.toDate();
          dateString = date.toISOString().slice(0, 10); // Format: YYYY-MM-DD
        } else if (typeof timestamp === 'string') {
          // C'est déjà une string
          dateString = timestamp.slice(0, 10);
        }
        
        setMatchDate(dateString);
      }
      
      // Récupérer les joueurs existants
      if (Array.isArray(currentEmbed.players) && currentEmbed.players.length > 0) {
        // Ajouter un ID aux joueurs qui n'en ont pas (anciens documents)
        const playersWithIds = currentEmbed.players.map((player, index) => ({
          ...player,
          id: player.id || `legacy-${currentEmbed.id}-${index}`
        }));
        setPlayers(playersWithIds);
      }
    }
  }, [formMode, currentEmbed]);

  // Notification des changements au parent
  useEffect(() => {
    onChange({
      context: {
        sport,
        category,
        text: matchText,
        date: matchDate
      },
      players, // Les positions sont déjà adaptées selon la catégorie
      type: 'potm'
    });
  }, [sport, category, matchText, matchDate, players, onChange]);

  // Adapter les positions des joueurs quand la catégorie change
  useEffect(() => {
    setPlayers(prevPlayers => 
      prevPlayers.map(player => ({
        ...player,
        position: getPositionForCategory(player.position, category)
      }))
    );
  }, [category]);

  const handlePlayerChange = (index, field, value) => {
    const newPlayers = [...players];
    
    // Si on change la position, adapter selon la catégorie actuelle
    if (field === 'position') {
      newPlayers[index][field] = getPositionForCategory(value, category);
    } else {
      newPlayers[index][field] = value;
    }
    
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    const defaultPosition = getPositionForCategory('Attaquant', category);
    setPlayers([...players, { id: Date.now() + '-' + players.length, name: '', position: defaultPosition, team: 'Suisse', votes: 0 }]);
  };

  const removePlayer = (index) => {
    if (players.length > 2) { // Minimum 2 joueurs
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const movePlayerUp = (index) => {
    if (index === 0) return; // Déjà en haut
    const newPlayers = [...players];
    [newPlayers[index - 1], newPlayers[index]] = [newPlayers[index], newPlayers[index - 1]];
    setPlayers(newPlayers);
  };

  const movePlayerDown = (index) => {
    if (index === players.length - 1) return; // Déjà en bas
    const newPlayers = [...players];
    [newPlayers[index], newPlayers[index + 1]] = [newPlayers[index + 1], newPlayers[index]];
    setPlayers(newPlayers);
  };

  // Fonction pour obtenir le label de position selon la catégorie
  const getPositionForCategory = (position, targetCategory) => {
    // Mapping masculin <-> féminin
    const positions = {
      'Attaquant': { masculine: 'Attaquant', feminine: 'Attaquante' },
      'Attaquante': { masculine: 'Attaquant', feminine: 'Attaquante' },
      'Défenseur': { masculine: 'Défenseur', feminine: 'Défenseuse' },
      'Défenseuse': { masculine: 'Défenseur', feminine: 'Défenseuse' },
      'Milieu': { masculine: 'Milieu', feminine: 'Milieu' },
      'Gardien': { masculine: 'Gardien', feminine: 'Gardienne' },
      'Gardienne': { masculine: 'Gardien', feminine: 'Gardienne' }
    };
    
    const positionData = positions[position];
    if (!positionData) return position;
    
    return targetCategory === 'Dames' ? positionData.feminine : positionData.masculine;
  };

  return (
    <div className="space-y-4">
      {/* Section 1: Sport et Catégorie */}
      <div className="flex gap-4">
        {/* Sport */}
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sport *
          </label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Football">Football</option>
            <option value="Hockey">Hockey</option>
          </select>
        </div>

        {/* Catégorie */}
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Messieurs">Messieurs</option>
            <option value="Dames">Dames</option>
          </select>
        </div>
      </div>

      {/* Section 2: Label et Date du match */}
      <div className="flex gap-4">
        {/* Label du match */}
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Label du sondage *
          </label>
          <input
            type="text"
            value={matchText}
            onChange={(e) => setMatchText(e.target.value)}
            placeholder="Ex: France - Suisse"
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Date du match */}
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date du match *
          </label>
          <input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Section 3: Candidats */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Candidats *
        </label>
        <div className="bg-gray-50 border border-gray-300 p-4 rounded-md">
          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={index} className="flex items-center gap-2">
                {/* Nom */}
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                  placeholder="Nom du joueur"
                  className="field mb-0 flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                
                {/* Position */}
                <select
                  value={player.position}
                  onChange={(e) => handlePlayerChange(index, 'position', e.target.value)}
                  className="field mb-0 w-32 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Attaquant">{getPositionForCategory('Attaquant', category)}</option>
                  <option value="Défenseur">{getPositionForCategory('Défenseur', category)}</option>
                  <option value="Milieu">{getPositionForCategory('Milieu', category)}</option>
                  <option value="Gardien">{getPositionForCategory('Gardien', category)}</option>
                </select>

                {/* Team */}
                <select
                  value={player.team}
                  onChange={(e) => handlePlayerChange(index, 'team', e.target.value)}
                  className="field mb-0 w-32 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {teamsData.teams.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              {/* Boutons de réordonnancement */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => movePlayerUp(index)}
                  disabled={index === 0}
                  className="h-4 w-8 text-xs text-gray-500 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Monter"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => movePlayerDown(index)}
                  disabled={index === players.length - 1}
                  className="h-4 w-8 text-xs text-gray-500 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Descendre"
                >
                  ▼
                </button>
              </div>
                {/* Bouton supprimer */}
                {players.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePlayer(index)}
                    className="btn-form btn-delete h-10 w-10 text-xl font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                    title="Supprimer ce candidat"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPlayer}
            className="text-blick hover:underline text-sm mt-3 font-medium flex items-center"
          >
            + Ajouter un candidat
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Il faut au moins 2 candidats.
        </p>
      </div>
    </div>
  );
}

export default PotmForm;