/**
 * Les équipes ne sont plus une liste figée : elles vivent dans la collection
 * Firestore `teams` et sont créées à la demande depuis le backend.
 *
 * Une équipe n'est qu'un **nom** : ni sport ni genre ne sont saisis, c'est au
 * journaliste de nommer sans ambiguïté (« Suisse M – Football »). Le nom est
 * donc le seul critère de distinction, et la clé du document.
 */

/**
 * Slug générique, utilisé pour les identifiants d'équipe et de joueur.
 * Retire les diacritiques pour que « Wälti » et « Waelti » ne produisent pas
 * deux clés différentes.
 */
export function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Slug d'identité d'un joueur, généré **uniquement à la création**.
 * Corriger un nom ensuite ne le recalcule jamais : l'id est la clé de
 * `stats.playerRatings` dans tous les widgets publiés (spec §6).
 */
export const slugifyPlayerName = slugify;

/** Identifiant du document d'équipe, dérivé de son seul nom. */
export const teamIdFor = (name) => slugify(name);

/** Tri des équipes dans les menus. */
export const byTeamOrder = (a, b) => a.name.localeCompare(b.name);
