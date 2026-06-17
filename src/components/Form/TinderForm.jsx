import React, { useState, useEffect } from 'react';
import RepeatableBlockActions from './RepeatableBlockActions';

function getInitialCard() {
  return {
    tinderCardLabel: '',
    tinderCardTitle: '',
    tinderCardVotes: {
      tinderCardVotesYes: 0,
      tinderCardVotesNo: 0,
    },
  };
}

function TinderForm({ currentEmbed, formMode, onChange, currentUser }) {
  const [tinderLabel, setTinderLabel] = useState(currentEmbed?.tinderLabel || '');
  const [tinderTitle, setTinderTitle] = useState(currentEmbed?.tinderTitle || '');
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

  // Initialisation à 3 cartes (création ou édition)
  const getInitialCards = () => {
    if (currentEmbed?.tinderCards?.length === 3) return currentEmbed.tinderCards;
    if (currentEmbed?.tinderCards?.length) {
      // Si moins de 3, compléter
      const cards = [...currentEmbed.tinderCards];
      while (cards.length < 3) cards.push(getInitialCard());
      return cards;
    }
    // Création : 3 cartes vides
    return [getInitialCard(), getInitialCard(), getInitialCard()];
  };
  const [tinderCards, setTinderCards] = useState(getInitialCards());

  // Initialiser les votes à la racine
  const getInitialVotes = () => {
    if (currentEmbed?.tinderVotes && typeof currentEmbed.tinderVotes === 'object') {
      // S'assurer que chaque carte a un vote
      const votes = { ...currentEmbed.tinderVotes };
      for (let i = 0; i < getInitialCards().length; i++) {
        if (!votes[i]) votes[i] = { yes: 0, no: 0 };
      }
      return votes;
    }
    // Générer des votes par défaut
    const votes = {};
    for (let i = 0; i < getInitialCards().length; i++) {
      votes[i] = { yes: 0, no: 0 };
    }
    return votes;
  };
  const [tinderVotes, setTinderVotes] = useState(getInitialVotes());
  const [legendTxt, setLegendTxt] = useState(currentEmbed?.tinderLegend?.txt || '');
  const [legendDisplay, setLegendDisplay] = useState(currentEmbed?.tinderLegend?.display ?? false);

  // Charger les données existantes en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setTinderLabel(currentEmbed.tinderLabel || '');
      setTinderTitle(currentEmbed.tinderTitle || '');
      setTinderCards(currentEmbed.tinderCards || [getInitialCard(), getInitialCard(), getInitialCard()]);
      setTinderVotes(currentEmbed.tinderVotes || getInitialVotes());
      setLegendTxt(currentEmbed.tinderLegend?.txt || '');
      setLegendDisplay(currentEmbed.tinderLegend?.display ?? false);
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);
    }
  }, [formMode, currentEmbed]);

  // Mise à jour du parent à chaque changement
  useEffect(() => {
    const embed = {
      tinderLabel,
      tinderTitle,
      tinderCards,
      tinderVotes,
      tinderLegend: {
        txt: legendTxt,
        display: legendDisplay,
      },
      brand,
      theme,
      author: currentUser?.email || '',
      counterViews: currentEmbed?.counterViews ?? 0,
      deleted: currentEmbed?.deleted ?? false,
      timeCreated: currentEmbed?.timeCreated ?? Date.now(),
      type: 'tinder',
    };
    onChange && onChange(embed);
  }, [tinderLabel, tinderTitle, tinderCards, tinderVotes, legendTxt, legendDisplay, brand, theme, currentUser, currentEmbed, onChange]);

  // Réordonner les cartes
  const moveCardUp = (idx) => {
    if (idx > 0) {
      const newCards = [...tinderCards];
      [newCards[idx - 1], newCards[idx]] = [newCards[idx], newCards[idx - 1]];
      setTinderCards(newCards);
      // Synchroniser les votes en réindexant
      const votesArr = Object.values(tinderVotes);
      [votesArr[idx - 1], votesArr[idx]] = [votesArr[idx], votesArr[idx - 1]];
      const newVotes = {};
      for (let i = 0; i < votesArr.length; i++) {
        newVotes[i] = votesArr[i];
      }
      setTinderVotes(newVotes);
    }
  };

  const moveCardDown = (idx) => {
    if (idx < tinderCards.length - 1) {
      const newCards = [...tinderCards];
      [newCards[idx], newCards[idx + 1]] = [newCards[idx + 1], newCards[idx]];
      setTinderCards(newCards);
      // Synchroniser les votes en réindexant
      const votesArr = Object.values(tinderVotes);
      [votesArr[idx], votesArr[idx + 1]] = [votesArr[idx + 1], votesArr[idx]];
      const newVotes = {};
      for (let i = 0; i < votesArr.length; i++) {
        newVotes[i] = votesArr[i];
      }
      setTinderVotes(newVotes);
    }
  };

  // Modification d'une carte
  const handleCardChange = (idx, field, value) => {
    setTinderCards(cards => cards.map((card, i) => i === idx ? { ...card, [field]: value } : card));
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
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module de tinder n'est pas encore compatible avec la brand PME.">
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

      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Label du Tinder *
        </label>
        <input
          id="tinderLabel"
          type="text"
          value={tinderLabel}
          onChange={e => setTinderLabel(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Donnez votre avis"
          required
        />
      </div>

      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre du Tinder *
        </label>
        <input
          id="tinderTitle"
          type="text"
          value={tinderTitle}
          onChange={e => setTinderTitle(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Sur le même sujet, quel article vous intéresserait ?"
          required
        />
      </div>

      {/* Sujets proposés */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Sujets proposés (3) *
        </label>
        <div className="space-y-4">
          {tinderCards.map((card, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-300 rounded-md overflow-hidden shadow-sm">
              <RepeatableBlockActions
                index={idx}
                total={tinderCards.length}
                onMoveUp={moveCardUp}
                onMoveDown={moveCardDown}
                onRemove={null}
                title={`Sujet ${idx + 1}`}
              />

              <div className="p-4 bg-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Label de la carte */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Label de la carte <span style={{ display: 'none' }}>#{idx + 1}</span> *
                    </label>
                    <input
                      type="text"
                      placeholder="Suisse"
                      value={card.tinderCardLabel}
                      onChange={e => handleCardChange(idx, 'tinderCardLabel', e.target.value)}
                      className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>

                  {/* Titre de la carte */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Titre de la carte <span style={{ display: 'none' }}>#{idx + 1}</span> *
                    </label>
                    <input
                      type="text"
                      placeholder="En Suisse, pensez-vous que nous soyons trop tolérants ?"
                      value={card.tinderCardTitle}
                      onChange={e => handleCardChange(idx, 'tinderCardTitle', e.target.value)}
                      className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Légende
        </label>
        <input
          id="legendTxt"
          type="text"
          value={legendTxt}
          onChange={e => setLegendTxt(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Texte de la légende"
        />
        <div className="flex items-center mt-3">
          <input
            type="checkbox"
            id="legendDisplay"
            checked={legendDisplay}
            onChange={e => setLegendDisplay(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2 cursor-pointer"
          />
          <label htmlFor="legendDisplay" className="block text-sm text-gray-700 select-none cursor-pointer">
            Afficher la légende
          </label>
        </div>
      </div>
    </div>
  );
}

export default TinderForm;