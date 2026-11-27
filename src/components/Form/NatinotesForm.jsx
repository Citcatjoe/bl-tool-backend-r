import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAllTeams } from '@rms/services';
import FieldHint from '../FieldHint';
import defaultPortrait from '../../assets/img/default.jpg';
import { byTeamOrder } from '../../data/teams';
import { DEFAULT_FOCAL, focalStyle } from '@rms/widget-model';

// Barème du lecteur — repris tel quel côté app cliente
const RATINGS = [6, 5, 4, 3, 2, 1];

/**
 * Un item de la liste est un **instantané figé** : nom, équipe et image sont
 * recopiés au moment de l'ajout et ne dépendent plus du catalogue. On n'y édite
 * ensuite que la note Blick et le paragraphe. Changer d'identité = retirer puis
 * ré-ajouter depuis le picker.
 */
const emptyPlayer = () => ({
  id: '', name: '', team: '', img: null, focal: { ...DEFAULT_FOCAL }, blickRating: '', comment: ''
});

const byName = (a, b) => a.name.localeCompare(b.name);

/** Entités produites par `sanitizeRichText` pour du texte simple, ramenées à leur caractère. */
const BASIC_ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const decodeBasicEntities = (text) => text.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => BASIC_ENTITIES[entity]);

function NatinotesForm({ currentEmbed, formMode, onChange }) {
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);
  const [title, setTitle] = useState('');
  const [players, setPlayers] = useState([]);
  const [showRecap, setShowRecap] = useState(true);
  // Sélecteur d'ajout — état transitoire, jamais enregistré
  const [picker, setPicker] = useState({ teamId: '', id: '' });
  // Équipes complètes (joueurs inclus) — un seul chargement sert le picker
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState('');

  // Initialisation en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);
      setTitle(currentEmbed.title || '');
      // `!== false` : les widgets publiés avant l'ajout du réglage n'ont pas le
      // champ et doivent garder le récap, conformément au défaut activé.
      setShowRecap(currentEmbed.showRecap !== false);

      if (Array.isArray(currentEmbed.players)) {
        setPlayers(currentEmbed.players.map((p) => ({
          ...emptyPlayer(),
          ...p,
          // Paragraphe nettoyé à l'enregistrement (sanitizeRichText) : on rend au textarea
          // le texte tapé (`&amp;` → `&`), ré-échappé à la prochaine sauvegarde.
          comment: decodeBasicEntities(p.comment || '')
        })));
      }
    }
  }, [formMode, currentEmbed]);

  /**
   * `fetchAllTeams` renvoie les documents complets, joueurs compris : un seul
   * appel suffit à alimenter le picker, quel que soit le nombre d'équipes.
   */
  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    setTeamsError('');
    try {
      setTeams((await fetchAllTeams()).sort(byTeamOrder));
    } catch {
      setTeams([]);
      setTeamsError('La liste des effectifs n’a pas pu être chargée.');
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  // Le picker démarre sur le premier effectif dès que les équipes sont là
  useEffect(() => {
    if (teams.length === 0) return;
    setPicker((prev) => (prev.teamId ? prev : { teamId: teams[0].id, id: '' }));
  }, [teams]);

  /**
   * Re-résolution de l'identité figée à l'édition.
   *
   * Le portrait, le nom et l'équipe d'un joueur sont gelés dans le widget à la
   * sélection. Or l'effectif peut avoir bougé depuis (portrait ajouté après
   * coup, changé, nom corrigé). À l'ouverture d'un widget existant, on relit ces
   * champs depuis l'effectif courant **par `id`** et on les rafraîchit — les
   * notes ne bougent pas (elles sont indexées par ce même `id`). Un joueur
   * disparu de l'effectif garde sa valeur figée. Effet : rouvrir puis
   * resauvegarder suffit à propager un portrait à jour, sans manipulation.
   */
  useEffect(() => {
    if (formMode !== 'edit' || teams.length === 0) return;
    const roster = new Map();
    teams.forEach((t) => (t.players || []).forEach((rp) => roster.set(rp.id, { ...rp, team: t.name })));
    setPlayers((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const live = roster.get(p.id);
        if (!live) return p;
        const img = live.img ?? null;
        // Le cadrage se rafraîchit avec l'image (même règle que `img`) : rouvrir
        // puis resauvegarder un widget propage un recadrage fait dans l'effectif.
        const focal = live.focal ?? p.focal ?? { ...DEFAULT_FOCAL };
        const sameFocal = JSON.stringify(focal) === JSON.stringify(p.focal ?? null);
        if (live.name === p.name && (live.team ?? '') === (p.team ?? '') && img === p.img && sameFocal) return p;
        changed = true;
        return { ...p, name: live.name, team: live.team ?? p.team, img, focal };
      });
      return changed ? next : prev;
    });
  }, [teams, formMode, currentEmbed]);

  // Remontée au parent — le picker reste en dehors, il ne concerne que la saisie.
  // Les effectifs accompagnent la saisie : Form.jsx y recopie l'identité des joueurs.
  useEffect(() => {
    onChange({ type: 'natinotes', brand, theme, title, players, showRecap, teams });
  }, [brand, theme, title, players, showRecap, teams, onChange]);

  const takenIds = useMemo(() => new Set(players.map((p) => p.id)), [players]);

  /**
   * Joueurs proposés à l'ajout : l'effectif choisi, moins les archivés, moins
   * ceux déjà présents dans la liste (tous effectifs confondus). On écarte le
   * doublon à la source — deux homonymes partageraient le même identifiant,
   * donc la même distribution de notes.
   */
  const pickerCatalogue = useMemo(() => {
    const roster = teams.find((t) => t.id === picker.teamId)?.players || [];
    return roster
      .filter((p) => !p.archived && !takenIds.has(p.id))
      .sort(byName);
  }, [teams, picker.teamId, takenIds]);

  const handlePickerTeam = (teamId) => setPicker({ teamId, id: '' });
  const handlePickerPlayer = (id) => setPicker((prev) => ({ ...prev, id }));

  /**
   * Ajoute le joueur sélectionné à la liste et remet le picker sur « aucun
   * joueur », en conservant l'effectif — la plupart des ajouts s'enchaînent
   * dans la même équipe, mais rien n'empêche d'en changer.
   */
  const addPickedPlayer = () => {
    const picked = pickerCatalogue.find((p) => p.id === picker.id);
    if (!picked) return;
    const rosterName = teams.find((t) => t.id === picker.teamId)?.name || '';
    setPlayers((prev) => [
      ...prev,
      {
        id: picked.id,
        name: picked.name,
        team: picked.team || rosterName,
        img: picked.img ?? null,
        focal: picked.focal ?? { ...DEFAULT_FOCAL },
        blickRating: '',
        comment: ''
      }
    ]);
    setPicker((prev) => ({ ...prev, id: '' }));
  };

  const handlePlayerChange = (index, field, value) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const removePlayer = (index) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const movePlayer = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= players.length) return;
    setPlayers((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const canAdd = Boolean(picker.id);

  return (
    <div className="space-y-6">
      {/* Brand & Rubrique */}
      <div className="flex gap-6 items-start">
        <div className="flex-none w-44">
          <label className="block text-sm font-medium text-ink mb-2">Brand</label>
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
            <label
              className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none"
              title="Le module notes des joueurs n'est pas encore compatible avec la brand PME."
            >
              <input type="radio" name="brand" value="pme" checked={false} disabled className="w-4 h-4 cursor-not-allowed" />
              <span className="text-sm text-muted">Pme</span>
            </label>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-ink mb-2">Rubrique *</label>
          <select
            value={theme || ''}
            onChange={(e) => setTheme(e.target.value || null)}
            className={`field mb-0 w-full px-3 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface cursor-pointer ${!theme ? 'text-muted' : 'text-ink'}`}
            required
          >
            <option value="" disabled hidden>Sélectionner...</option>
            <option value="Suisse" className="text-ink">Suisse</option>
            <option value="Inter" className="text-ink">Inter</option>
            <option value="Sport" className="text-ink">Sport</option>
          </select>
        </div>
      </div>

      <div className="py-4"><hr className="border-line" /></div>

      <div>
        <label className="flex items-center text-sm font-medium text-ink mb-2">
          Événement *
          <FieldHint text="Sert à retrouver le widget dans la liste. Non affiché côté lecteur." />
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notes du match Suisse - France du 13.02.2026"
          className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
          required
        />
      </div>

      {/* Joueurs */}
      <div>
        {/* Zone d'ajout boxée : label + effectif + joueur + bouton. */}
        <div className="bg-ground border border-line rounded-md p-4">
        {/*
          ⚠️ Le texte de l'infobulle fait partie du textContent de ce <label>
          (FieldHint rend sa bulle à l'intérieur). La validation repère les
          champs par le texte de leur label : ne PAS y écrire les intitulés
          exacts « Note Blick » ni « Paragraphe », sinon ce label devient un
          faux match et décale la mise en évidence du joueur fautif.
        */}
        <label className="flex items-center text-sm font-medium text-ink mb-3">
          Ajouter des joueurs *
          <FieldHint text="Au moins 1 joueur. La note et le texte sont obligatoires pour chacun. Un joueur peut venir de n’importe quel effectif." />
        </label>

        {teamsError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
            {teamsError}
          </p>
        )}

        {teamsLoading && (
          <p className="text-xs text-muted mb-3">Chargement des effectifs…</p>
        )}

        {!teamsLoading && !teamsError && teams.length === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
            Aucun effectif. Créez-en un depuis le menu « Éditer les effectifs ».
          </p>
        )}

        {/* Picker : effectif → joueur → +. Transitoire, non enregistré. */}
        {!teamsLoading && !teamsError && teams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Effectif source</label>
              <select
                value={picker.teamId}
                onChange={(e) => handlePickerTeam(e.target.value)}
                className="field mb-0 w-full px-3 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface cursor-pointer"
              >
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Joueur</label>
              <select
                value={picker.id}
                onChange={(e) => handlePickerPlayer(e.target.value)}
                disabled={pickerCatalogue.length === 0}
                className="field mb-0 w-full px-3 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface cursor-pointer disabled:bg-ground disabled:cursor-not-allowed"
              >
                <option value="" disabled hidden>
                  {pickerCatalogue.length > 0 ? 'Sélectionner un joueur…' : 'Aucun joueur disponible'}
                </option>
                {pickerCatalogue.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={addPickedPlayer}
              disabled={!canAdd}
              title="Ajouter ce joueur à la liste"
              className="bg-surface text-muted border border-line w-12 h-12 rounded-md flex items-center justify-center hover:bg-ground hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        )}

        {/* Séparation par le layout : exploration/validation ↔ liste effective. */}
        <hr className="border-line my-4" />

        {/* Vide : message centré. Rempli : grille 3 par ligne. */}
        {players.length === 0 ? (
          <p className="text-center text-sm text-muted py-8">
            Aucun joueur sélectionné. Ajoutez-en depuis le sélecteur ci-dessus.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {players.map((player, index) => (
                <div
                  key={`${player.id}-${index}`}
                  className="natinotes-player-card flex flex-col bg-surface border border-line rounded-md overflow-hidden "
                >
                  {/* En-tête : portrait + nom + contrôles */}
                  <div className="flex items-center gap-2 px-3 h-14 bg-ground border-b border-line">
                    {/* Photo figée du joueur (non éditable ici — le cadrage se
                        règle dans l'éditeur d'équipes). Repli sur default.jpg si
                        l'URL est absente OU cassée (portrait supprimé du référentiel). */}
                    <span className="w-9 h-9 rounded-full overflow-hidden flex-none bg-ground block">
                      <img
                        src={player.img || defaultPortrait}
                        alt=""
                        onError={(e) => {
                          if (e.currentTarget.dataset.fallback) return;
                          e.currentTarget.dataset.fallback = '1';
                          e.currentTarget.src = defaultPortrait;
                        }}
                        className="w-full h-full object-cover"
                        style={focalStyle(player.focal)}
                      />
                    </span>
                    <span className="font-semibold text-sm text-ink truncate flex-1 min-w-0" title={player.name}>
                      {player.name}
                    </span>
                    <div className="flex gap-1 flex-none">
                      <button
                        type="button"
                        onClick={() => movePlayer(index, -1)}
                        disabled={index === 0}
                        className="h-6 w-6 text-xs text-muted bg-surface hover:text-accent hover:border-accent disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted disabled:cursor-not-allowed flex items-center justify-center border border-line rounded transition-colors"
                        title="Monter"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => movePlayer(index, 1)}
                        disabled={index === players.length - 1}
                        className="h-6 w-6 text-xs text-muted bg-surface hover:text-accent hover:border-accent disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted disabled:cursor-not-allowed flex items-center justify-center border border-line rounded transition-colors"
                        title="Descendre"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlayer(index)}
                        className="h-6 w-6 text-xs text-red-500 bg-surface hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center border border-red-200 rounded transition-colors"
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Corps : note puis paragraphe */}
                  <div className="flex flex-col gap-3 p-3">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Note Blick *</label>
                      <select
                        value={player.blickRating}
                        onChange={(e) => handlePlayerChange(index, 'blickRating', e.target.value ? Number(e.target.value) : '')}
                        className="field mb-0 w-24 px-3 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface cursor-pointer"
                        required
                      >
                        <option value="" disabled hidden>—</option>
                        {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Paragraphe *</label>
                      <textarea
                        value={player.comment}
                        onChange={(e) => handlePlayerChange(index, 'comment', e.target.value)}
                        placeholder="Son match en quelques lignes…"
                        rows={5}
                        className="w-full h-[120px] px-3 py-2 border border-line rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>{/* fin box composition */}
      </div>

      <div className="py-4"><hr className="border-line" /></div>

      {/* Récap des avis — bloc de classement affiché en bas de l'app cliente */}
      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="natinotesShowRecap"
            checked={showRecap}
            onChange={(e) => setShowRecap(e.target.checked)}
            className="h-4 w-4 text-accent focus:ring-accent border-line rounded mr-2 cursor-pointer"
          />
          <label htmlFor="natinotesShowRecap" className="flex items-center text-sm font-medium text-ink select-none cursor-pointer">
            Récap des avis
          </label>
          <FieldHint text="Classement des joueurs selon trois points de vue : Blick, le lecteur, la communauté. Décocher masque ce bloc — les notes continuent d’être collectées." />
        </div>
      </div>

    </div>
  );
}

export default NatinotesForm;
