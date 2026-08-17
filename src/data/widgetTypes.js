/**
 * Registre unique des types de widgets créables depuis le dashboard.
 *
 * Source de vérité pour la modale de création (`NewWidgetPicker`) ET pour le
 * badge coloré partagé (`TypeBadge`, réutilisé dans `ListItem`). Ajouter un type
 * ici suffit à le faire apparaître partout, sans toucher aux composants.
 *
 * - `type`  : valeur attendue par `Form` (`formType`) et affichée dans le badge.
 * - `label` : libellé humain (titre de carte, infobulle du badge dans la liste).
 * - `color` : classes Tailwind du badge (fond + texte).
 * - `desc`  : phrase de description affichée dans la modale de création.
 */
export const WIDGET_TYPES = [
  { type: 'poll',      label: 'Sondage',              color: 'bg-blue-100 text-blue-700',     desc: 'Une question, plusieurs réponses votables.' },
  { type: 'calendar',  label: 'Calendrier',           color: 'bg-green-100 text-green-700',   desc: 'Dates et lives à venir.' },
  { type: 'teaser',    label: 'Teaser',               color: 'bg-yellow-100 text-yellow-700', desc: 'Accroche + bouton vers un article.' },
  { type: 'folder',    label: 'Dossier',              color: 'bg-indigo-100 text-indigo-700', desc: 'Regroupe plusieurs liens ou articles.' },
  { type: 'tinder',    label: 'Tinder',               color: 'bg-pink-100 text-pink-700',     desc: 'Swipe oui/non sur une série de cartes.' },
  { type: 'quiz',      label: 'Quiz',                 color: 'bg-purple-100 text-purple-700', desc: 'QCM avec bonne réponse et score.' },
  { type: 'testimony', label: 'Appel à témoignage',   color: 'bg-teal-100 text-teal-700',     desc: 'Formulaire de collecte auprès des lecteurs.' },
  { type: 'potm',      label: 'Joueur·euse du match', color: 'bg-orange-100 text-orange-700', desc: 'Élection du meilleur joueur d’un match.' },
  { type: 'prono',     label: 'Pronostic',            color: 'bg-red-100 text-red-700',       desc: 'Prédictions de résultats.' },
  { type: 'facts',     label: 'Faits marquants',      color: 'bg-gray-200 text-gray-800',     desc: 'Chiffres et faits clés d’un événement.' },
  { type: 'natinotes', label: 'NatiNotes',            color: 'bg-amber-100 text-amber-700',   desc: 'Notes des joueurs par le journaliste et le public.' },
];
