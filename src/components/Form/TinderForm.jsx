
import React, { useState, useEffect } from 'react';

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
				author: currentUser?.email || '',
				counterViews: currentEmbed?.counterViews ?? 0,
				deleted: currentEmbed?.deleted ?? false,
				timeCreated: currentEmbed?.timeCreated ?? Date.now(),
				type: 'tinder',
			};
			onChange && onChange(embed);
		}, [tinderLabel, tinderTitle, tinderCards, tinderVotes, legendTxt, legendDisplay, currentUser, currentEmbed, onChange]);

	// Ajout d'une carte

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
		<form className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Label *</label>
				<input
					id="tinderLabel"
					type="text"
					value={tinderLabel}
					onChange={e => setTinderLabel(e.target.value)}
					className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
				<input
					id="tinderTitle"
					type="text"
					value={tinderTitle}
					onChange={e => setTinderTitle(e.target.value)}
					className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-3">Sujets proposés</label>
				<div className="space-y-4">
								{tinderCards.map((card, idx) => (
									<div key={idx} className="border border-gray-300 rounded-md p-4 bg-gray-50">
										<div className="flex justify-between items-center mb-3">
											<span className="text-sm font-medium text-gray-700">Sujet {idx + 1}</span>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => moveCardUp(idx)}
													disabled={idx === 0}
													className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
													title="Déplacer vers le haut"
												>↑</button>
												<button
													type="button"
													onClick={() => moveCardDown(idx)}
													disabled={idx === tinderCards.length - 1}
													className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
													title="Déplacer vers le bas"
												>↓</button>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<input
												type="text"
												placeholder="Label de la carte"
												value={card.tinderCardLabel}
												onChange={e => handleCardChange(idx, 'tinderCardLabel', e.target.value)}
												className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
											<input
												type="text"
												placeholder="Titre de la carte"
												value={card.tinderCardTitle}
												onChange={e => handleCardChange(idx, 'tinderCardTitle', e.target.value)}
												className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
												required
											/>
											{/* Affichage des votes (lecture seule) */}
											{/* <span className="text-xs text-gray-400 col-span-2">Votes: Oui {tinderVotes[idx]?.yes ?? 0} / Non {tinderVotes[idx]?.no ?? 0}</span> */}
										</div>
									</div>
								))}
				</div>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Légende</label>
				<input
					id="legendTxt"
					type="text"
					value={legendTxt}
					onChange={e => setLegendTxt(e.target.value)}
					className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<label className="flex text-sm items-center gap-2 mt-2">
					<input
						type="checkbox"
						checked={legendDisplay}
						onChange={e => setLegendDisplay(e.target.checked)}
					/>
					Afficher la légende
				</label>
			</div>
		</form>
	);
}

export default TinderForm;