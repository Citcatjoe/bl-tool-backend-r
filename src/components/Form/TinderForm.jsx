import React, { useState, useEffect } from 'react';
import RepeatableBlockActions from './RepeatableBlockActions';

const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

function getInitialCard() {
  return {
    id: generateId(),
    tinderCardLabel: '',
    tinderCardTitle: '',
    tinderCardVotes: {
      tinderCardVotesYes: 0,
      tinderCardVotesNo: 0,
    },
  };
}

function TinderForm({ currentEmbed, formMode, onChange, currentUser }) {
  const getEmbedData = () => currentEmbed?.data || currentEmbed || {};

  const [tinderLabel, setTinderLabel] = useState(() => getEmbedData().tinderLabel || '');
  const [tinderTitle, setTinderTitle] = useState(() => getEmbedData().tinderTitle || '');
  const [brand, setBrand] = useState(() => currentEmbed?.brand || 'blick');
  const [theme, setTheme] = useState(() => currentEmbed?.theme || null);

  // Initialisation à 3 cartes (création ou édition)
  const getInitialCards = () => {
    const data = getEmbedData();
    let cards = [];
    if (data.tinderCards?.length === 3) cards = data.tinderCards;
    else if (data.tinderCards?.length) {
      cards = [...data.tinderCards];
      while (cards.length < 3) cards.push(getInitialCard());
    } else {
      cards = [getInitialCard(), getInitialCard(), getInitialCard()];
    }
    // S'assure que chaque carte possède un UUID robuste
    return cards.map(c => c.id ? c : { ...c, id: generateId() });
  };
  const [tinderCards, setTinderCards] = useState(() => getInitialCards());

  // Initialiser les votes basés sur l'ID
  const getInitialVotes = (cards) => {
    const sourceVotes = currentEmbed?.stats?.tinderVotes || currentEmbed?.tinderVotes || {};
    const votes = {};
    cards.forEach((card, i) => {
      let cardVotes = { yes: 0, no: 0 };
      if (sourceVotes[card.id] !== undefined) {
         cardVotes = sourceVotes[card.id];
      } else if (sourceVotes[i] !== undefined) {
         cardVotes = sourceVotes[i];
      }
      votes[card.id] = cardVotes;
    });
    return votes;
  };
  const [tinderVotes, setTinderVotes] = useState(() => getInitialVotes(tinderCards));
  const [legendTxt, setLegendTxt] = useState(() => getEmbedData().tinderLegend?.txt || '');
  const [legendDisplay, setLegendDisplay] = useState(() => getEmbedData().tinderLegend?.display ?? false);

  // Charger les données existantes en mode édition (une seule fois par document)
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      const data = getEmbedData();
      setTinderLabel(data.tinderLabel || '');
      setTinderTitle(data.tinderTitle || '');
      const initialCards = getInitialCards();
      setTinderCards(initialCards);
      setTinderVotes(getInitialVotes(initialCards));
      setLegendTxt(data.tinderLegend?.txt || '');
      setLegendDisplay(data.tinderLegend?.display ?? false);
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);
    }
  }, [formMode, currentEmbed?.id, currentEmbed?.meta?.id]);

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
      // Plus besoin de réindexer les votes, ils sont liés à l'ID (c.id)
    }
  };

  const moveCardDown = (idx) => {
    if (idx < tinderCards.length - 1) {
      const newCards = [...tinderCards];
      [newCards[idx], newCards[idx + 1]] = [newCards[idx + 1], newCards[idx]];
      setTinderCards(newCards);
      // Plus besoin de réindexer les votes, ils sont liés à l'ID (c.id)
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
          <label className="block text-sm font-medium text-ink mb-2">
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
                className="w-4 h-4 text-accent border-line focus:ring-accent cursor-pointer"
              />
              <span className="text-sm text-ink">Blick</span>
            </label>
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module de tinder n'est pas encore compatible avec la brand PME.">
              <input
                type="radio"
                name="brand"
                value="pme"
                checked={brand === 'pme'}
                onChange={() => setBrand('pme')}
                disabled
                className="w-4 h-4 text-accent border-line focus:ring-accent cursor-not-allowed"
              />
              <span className="text-sm text-muted">Pme</span>
            </label>
          </div>
        </div>

        {/* Rubrique */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink mb-2">
            Rubrique *
          </label>
          <select
            value={theme || ''}
            onChange={(e) => setTheme(e.target.value || null)}
            className={`field mb-0 w-full px-3 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface cursor-pointer ${!theme ? 'text-muted' : 'text-ink'
              }`}
            required
          >
            <option value="" disabled hidden>Sélectionner...</option>
            <option value="Suisse" className="text-ink">Suisse</option>
            <option value="Inter" className="text-ink">Inter</option>
            <option value="Sport" className="text-ink">Sport</option>
          </select>
        </div>
      </div>

      <div className="py-4">
        <hr className="border-line" />
      </div>

      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">
          Label du Tinder *
        </label>
        <input
          id="tinderLabel"
          type="text"
          value={tinderLabel}
          onChange={e => setTinderLabel(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
          placeholder="Donnez votre avis"
          required
        />
      </div>

      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">
          Titre du Tinder *
        </label>
        <input
          id="tinderTitle"
          type="text"
          value={tinderTitle}
          onChange={e => setTinderTitle(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
          placeholder="Sur le même sujet, quel article vous intéresserait ?"
          required
        />
      </div>

      {/* Sujets proposés */}
      <div>
        <label className="block text-sm font-medium text-ink mb-3">
          Sujets proposés (3) *
        </label>
        <div className="space-y-4">
          {tinderCards.map((card, idx) => (
            <div key={idx} className="bg-ground border border-line rounded-md overflow-hidden ">
              <RepeatableBlockActions
                index={idx}
                total={tinderCards.length}
                onMoveUp={moveCardUp}
                onMoveDown={moveCardDown}
                onRemove={null}
                title={`Sujet ${idx + 1}`}
              />

              <div className="p-4 bg-surface space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Label de la carte */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Label de la carte <span style={{ display: 'none' }}>#{idx + 1}</span> *
                    </label>
                    <input
                      type="text"
                      placeholder="Suisse"
                      value={card.tinderCardLabel}
                      onChange={e => handleCardChange(idx, 'tinderCardLabel', e.target.value)}
                      className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
                      required
                    />
                  </div>

                  {/* Titre de la carte */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Titre de la carte <span style={{ display: 'none' }}>#{idx + 1}</span> *
                    </label>
                    <input
                      type="text"
                      placeholder="En Suisse, pensez-vous que nous soyons trop tolérants ?"
                      value={card.tinderCardTitle}
                      onChange={e => handleCardChange(idx, 'tinderCardTitle', e.target.value)}
                      className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
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
        <label className="block text-sm font-medium text-ink mb-2">
          Légende {legendDisplay && '*'}
        </label>
        <input
          id="legendTxt"
          type="text"
          value={legendTxt}
          onChange={e => setLegendTxt(e.target.value)}
          className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
          placeholder="Texte de la légende"
        />
        <div className="flex items-center mt-3">
          <input
            type="checkbox"
            id="legendDisplay"
            checked={legendDisplay}
            onChange={e => setLegendDisplay(e.target.checked)}
            className="h-4 w-4 text-accent focus:ring-accent border-line rounded mr-2 cursor-pointer"
          />
          <label htmlFor="legendDisplay" className="block text-sm text-ink select-none cursor-pointer">
            Afficher la légende
          </label>
        </div>
      </div>
    </div>
  );
}

export default TinderForm;