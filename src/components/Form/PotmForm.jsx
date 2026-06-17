import React, { useState, useEffect } from 'react';
import teamsData from '../../data/teams.json';
import contextsData from '../../data/contexts.json';
import RepeatableBlockActions from './RepeatableBlockActions';

function PotmForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du POTM
  const [context, setContext] = useState('national');
  const [category, setCategory] = useState('Messieurs');
  const [matchText, setMatchText] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [players, setPlayers] = useState([
    { id: Date.now() + '-0', name: '', position: 'Attaquant', team: 'Suisse', votes: 0 },
    { id: Date.now() + '-1', name: '', position: 'Attaquant', team: 'Suisse', votes: 0 }
  ]);
  // Brand & theme (rubrique)
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setContext(currentEmbed.context?.context || currentEmbed.context?.sport || 'national');
      setCategory(currentEmbed.context?.category || 'Messieurs');
      setMatchText(currentEmbed.context?.text || '');
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);
      
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
        // ET enrichir avec code/color si manquant
        const playersWithIds = currentEmbed.players.map((player, index) => {
             // Find team data (robust search)
             const teamData = teamsData.find(t => 
                 t.name === player.team || 
                 (player.team && t.name.normalize('NFC').trim() === player.team.normalize('NFC').trim())
             );
              return {
               ...player,
               id: player.id || `legacy-${currentEmbed.id}-${index}`,
               team: teamData ? teamData.name : player.team,
               code: teamData ? teamData.code : (player.code || ''),
               color: teamData ? teamData.color : (player.color || '#000000'),
               type: teamData ? teamData.type : (player.type || 'national')
              };
         });
         setPlayers(playersWithIds);
       }
     }
   }, [formMode, currentEmbed]);

  const handleContextChange = (newContext) => {
    setContext(newContext);
    
    // Mettre à jour les équipes des joueurs uniquement lors d'un changement manuel
    const validTeams = teamsData.filter(t => t.type === newContext).map(t => t.name);
    const defaultTeam = validTeams[0] || '';

    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        const isTeamValid = validTeams.includes(player.team);
        if (!isTeamValid) {
          return { ...player, team: defaultTeam };
        }
        return player;
      })
    );
  };

  // Notification des changements au parent
  useEffect(() => {
    // Enrichir les joueurs avec les données de l'équipe (code, color)
    const enrichedPlayers = players.map(player => {
        const teamData = teamsData.find(t => 
            t.name === player.team || 
            (player.team && t.name.normalize('NFC').trim() === player.team.normalize('NFC').trim())
        );
        return {
            ...player,
            code: teamData ? teamData.code : '',
            color: teamData ? teamData.color : '#000000',
            type: teamData ? teamData.type : 'national',
            img: teamData && teamData.type === 'national_league' ? (teamData.img || null) : null
        };
    });

    onChange({
      context: {
        context,
        category,
        text: matchText,
        date: matchDate
      },
      players: enrichedPlayers,
      brand,
      theme,
      type: 'potm'
    });
  }, [context, category, matchText, matchDate, players, brand, theme, onChange]);

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
    const defaultTeam = teamsData.find(t => t.type === context)?.name || '';
    setPlayers([...players, { id: Date.now() + '-' + players.length, name: '', position: defaultPosition, team: defaultTeam, votes: 0 }]);
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
      'Gardienne': { masculine: 'Gardien', feminine: 'Gardienne' },
      'Entraîneur': { masculine: 'Entraîneur', feminine: 'Entraîneur' },
      'Entraîneuse': { masculine: 'Entraîneuse', feminine: 'Entraîneuse' }
    };
    
    const positionData = positions[position];
    if (!positionData) return position;
    
    return targetCategory === 'Dames' ? positionData.feminine : positionData.masculine;
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
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module joueur du match n'est pas encore compatible avec la brand PME.">
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

      {/* Section 1: Contexte et Catégorie */}
      <div className="flex gap-4">
        {/* Contexte */}
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contexte *
          </label>
          <select
            value={context}
            onChange={(e) => handleContextChange(e.target.value)}
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            {contextsData.map((ctx) => (
              <option key={ctx.type} value={ctx.type}>{ctx.label}</option>
            ))}
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
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
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
            Label du match *
          </label>
          <input
            type="text"
            value={matchText}
            onChange={(e) => setMatchText(e.target.value)}
            placeholder="France - Suisse"
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            required
          />
        </div>
      </div>

      {/* Section 3: Candidats */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Candidats *
        </label>
        <div className="space-y-4">
          {players.map((player, index) => (
            <div key={index} className="bg-gray-50 border border-gray-300 rounded-md overflow-hidden shadow-sm">
              <RepeatableBlockActions
                index={index}
                total={players.length}
                onMoveUp={() => movePlayerUp(index)}
                onMoveDown={() => movePlayerDown(index)}
                onRemove={players.length > 2 ? () => removePlayer(index) : null}
                title={`Candidat ${index + 1}`}
              />
              
              <div className="p-4 bg-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Nom du joueur <span style={{ display: 'none' }}>#{index + 1}</span> *
                    </label>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                      placeholder="Nom du joueur"
                      className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>
                  
                  {/* Position */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Position
                    </label>
                    <select
                      value={player.position}
                      onChange={(e) => handlePlayerChange(index, 'position', e.target.value)}
                      className="field mb-0 w-full px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                    >
                      <option value="Attaquant">{getPositionForCategory('Attaquant', category)}</option>
                      <option value="Défenseur">{getPositionForCategory('Défenseur', category)}</option>
                      <option value="Milieu">{getPositionForCategory('Milieu', category)}</option>
                      <option value="Gardien">{getPositionForCategory('Gardien', category)}</option>
                      <option value="Entraîneur">{getPositionForCategory('Entraîneur', category)}</option>
                      <option value="Entraîneuse">{getPositionForCategory('Entraîneuse', category)}</option>
                    </select>
                  </div>

                  {/* Team */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Équipe
                    </label>
                    <select
                      value={player.team}
                      onChange={(e) => handlePlayerChange(index, 'team', e.target.value)}
                      className="field mb-0 w-full px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                    >
                      {teamsData
                        .filter(team => team.type === context)
                        .map((team) => (
                          <option key={team.name} value={team.name}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          type="button"
          onClick={addPlayer}
          className="text-blick hover:underline text-sm mt-4 font-medium flex items-center"
        >
          + Ajouter un candidat
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Il faut au moins 2 candidats.
        </p>
      </div>
    </div>
  );
}

export default PotmForm;