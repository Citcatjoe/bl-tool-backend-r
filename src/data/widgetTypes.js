/**
 * Registre unique des types de widgets créables depuis le dashboard.
 *
 * Source de vérité pour la modale de création (`NewWidgetPicker`) ET pour
 * l'étiquette de type partagée (`TypeBadge`, réutilisée dans `ListItem`). Ajouter
 * un type ici suffit à le faire apparaître partout, sans toucher aux composants.
 *
 * - `type`  : valeur attendue par `Form` (`formType`).
 * - `label` : libellé français (étiquette de type).
 * - `tone`  : suffixe des variables de teinte `--type-<tone>-bg` / `--type-<tone>-fg`
 *             (src/styles/tokens.css).
 * - `desc`  : phrase de description affichée dans la modale de création.
 */
export const WIDGET_TYPES = [
  { type: 'poll',      label: 'Sondage',              tone: 'sondage',    desc: 'Une question, plusieurs réponses votables.' },
  { type: 'calendar',  label: 'Calendrier',           tone: 'calendrier', desc: 'Dates et lives à venir.' },
  { type: 'teaser',    label: 'Teaser',               tone: 'teaser',     desc: 'Accroche + bouton vers un article.' },
  { type: 'folder',    label: 'Dossier',              tone: 'dossier',    desc: 'Regroupe plusieurs liens ou articles.' },
  { type: 'tinder',    label: 'Tinder',               tone: 'tinder',     desc: 'Swipe oui/non sur une série de cartes.' },
  { type: 'quiz',      label: 'Quiz',                 tone: 'quiz',       desc: 'QCM avec bonne réponse et score.' },
  { type: 'testimony', label: 'Appel à témoignage',   tone: 'temoignage', desc: 'Formulaire de collecte auprès des lecteurs.' },
  { type: 'potm',      label: 'Joueur·euse du match', tone: 'potm',       desc: 'Élection du meilleur joueur d’un match.' },
  { type: 'prono',     label: 'Pronostic',            tone: 'prono',      desc: 'Prédictions de résultats.' },
  { type: 'facts',     label: 'Faits marquants',      tone: 'facts',      desc: 'Chiffres et faits clés d’un événement.' },
  { type: 'natinotes', label: 'NatiNotes',            tone: 'natinotes',  desc: 'Notes des joueurs par le journaliste et le public.' },
];
