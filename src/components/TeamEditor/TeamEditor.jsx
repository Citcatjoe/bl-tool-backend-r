import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllTeams, fetchTeam, saveTeamTransactional } from '@rms/services';
import BlackOverlay from '../BlackOverlay/BlackOverlay';
import PortraitUploader from '../PortraitUploader';
import FieldHint from '../FieldHint';
import { slugifyPlayerName, teamIdFor, byTeamOrder } from '../../data/teams';
import { DEFAULT_FOCAL } from '@rms/widget-model';

function TeamEditor({ isOpen, teamId, onClose }) {
  const [teams, setTeams] = useState([]);
  const [activeId, setActiveId] = useState(teamId || '');
  const [players, setPlayers] = useState([]);
  const [loadedAt, setLoadedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  // URL du portrait choisi pour le joueur en cours d'ajout (vide si aucun)
  const [newPortrait, setNewPortrait] = useState('');
  // Cadrage du portrait en cours d'ajout, réinitialisé après chaque ajout
  const [newFocal, setNewFocal] = useState({ ...DEFAULT_FOCAL });
  // Nom de l'équipe en cours de création, `null` quand le champ est replié
  const [draftName, setDraftName] = useState(null);

  const meta = teams.find((t) => t.id === activeId) || null;

  /** Liste des équipes existantes. Aucune n'est créée d'office. */
  const loadTeams = useCallback(async (preferredId) => {
    try {
      const list = (await fetchAllTeams()).sort(byTeamOrder);
      setTeams(list);
      setActiveId((current) => {
        const wanted = preferredId || current;
        if (wanted && list.some((t) => t.id === wanted)) return wanted;
        return list[0]?.id || '';
      });
      return list;
    } catch {
      setError('La liste des équipes n’a pas pu être chargée.');
      return [];
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadTeams(teamId || undefined);
  }, [isOpen, teamId, loadTeams]);

  const load = useCallback(async (id) => {
    if (!id) {
      setPlayers([]);
      setLoadedAt(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchTeam(id);
      setPlayers(data?.players || []);
      setLoadedAt(data?.timeUpdated?.toMillis?.() ?? null);
    } catch {
      setError('Impossible de charger l’équipe.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load(activeId);
  }, [isOpen, activeId, load]);

  const updatePlayer = (id, field, value) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  /**
   * Liste augmentée du nom en cours de saisie, s'il y en a un.
   *
   * Utilisée par « + Ajouter » **et** par « Sauvegarder » : sans cela, taper un
   * nom puis sauvegarder directement perdait la saisie en silence, le document
   * partant sans le nouveau joueur.
   *
   * Retourne `null` si l'ajout est impossible (identifiant déjà pris).
   */
  const withPendingPlayer = (list) => {
    const name = newName.trim();
    if (!name) return list;

    const id = slugifyPlayerName(name);
    if (list.some((p) => p.id === id)) {
      setError(`Un joueur porte déjà l’identifiant « ${id} ». Précisez le nom pour le distinguer.`);
      return null;
    }

    return [...list, { id, name, team: meta?.name || '', img: newPortrait || null, focal: { ...newFocal }, archived: false }];
  };

  const addPlayer = () => {
    const next = withPendingPlayer(players);
    if (!next || next === players) return;
    setPlayers(next);
    setNewName('');
    setNewPortrait('');
    setNewFocal({ ...DEFAULT_FOCAL });
    setError('');
  };

  /**
   * Archivage plutôt que suppression : un joueur retiré reste résoluble pour
   * les widgets déjà publiés qui le référencent. Il disparaît simplement des
   * choix proposés à la création d'un nouveau widget.
   */
  const toggleArchived = (id) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, archived: !p.archived } : p)));
  };

  /** Crée le document d'équipe, vide, et bascule dessus pour la saisie. */
  const createTeam = async () => {
    const name = (draftName || '').trim();
    if (!name) {
      setError('Donnez un nom à l’équipe.');
      return;
    }

    const id = teamIdFor(name);
    if (teams.some((t) => t.id === id)) {
      setError('Une équipe porte déjà ce nom.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await saveTeamTransactional(id, { name, players: [] }, null);
      setDraftName(null);
      await loadTeams(id);
    } catch {
      setError('La création de l’équipe a échoué.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!meta) return;
    if (players.some((p) => !p.name.trim())) {
      setError('Un joueur ne peut pas avoir un nom vide.');
      return;
    }

    // Un nom saisi mais pas encore ajouté à la liste part quand même
    const finalPlayers = withPendingPlayer(players);
    if (!finalPlayers) return;

    setSaving(true);
    setError('');
    try {
      await saveTeamTransactional(activeId, {
        name: meta.name,
        players: finalPlayers.map((p) => ({ ...p, name: p.name.trim() }))
      }, loadedAt);

      setPlayers(finalPlayers);
      setNewName('');
      setNewPortrait('');
      setNewFocal({ ...DEFAULT_FOCAL });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose(true);
      }, 900);
    } catch (e) {
      if (e.code === 'TEAM_CONFLICT') {
        setError(
          'Cette équipe a été modifiée par quelqu’un d’autre pendant votre édition. ' +
          'Rien n’a été enregistré — rechargez pour repartir de la version à jour.'
        );
      } else {
        setError('L’enregistrement a échoué.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <BlackOverlay formVisible={isOpen} onClick={() => onClose(false)} />

      {/*
        Le panneau reste monté et n'est piloté que par ses classes : un
        montage conditionnel apparaîtrait d'un coup, sans transition. Mêmes
        valeurs que Form.module.scss — 0.15s, glissement de 40px.
      */}
      <div
        id="team-editor"
        className={`max-w-4xl w-full h-auto overflow-y-auto fixed top-1/2 left-1/2 max-h-[80vh] bg-surface border border-line rounded-lg shadow-pop z-40 flex flex-col -translate-x-1/2 transition-all duration-150 ease-in-out ${
          isOpen
            ? 'opacity-100 visible -translate-y-1/2'
            : 'opacity-0 invisible translate-y-[calc(-50%+40px)]'
        }`}
      >
        {/* En-tête, calqué sur celui du formulaire de widget */}
        <div className="flex justify-between items-center pl-6 pr-3 py-2 border-b border-line">
          <h2 className="title-lg text-ink m-0">Éditer les effectifs</h2>
          <button
            onClick={() => onClose(false)}
            className="w-11 h-11 flex items-center justify-center rounded-pill text-muted hover:text-ink hover:bg-ground text-2xl transition-colors"
            type="button"
            aria-label="Fermer"
            title="Fermer"
            disabled={saving}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="block text-sm font-medium text-ink">Équipe *</label>
                {draftName === null && (
                  <button
                    type="button"
                    onClick={() => { setDraftName(''); setError(''); }}
                    className="text-accent hover:underline text-sm font-medium cursor-pointer"
                  >
                    + Nouvelle équipe
                  </button>
                )}
              </div>

              {teams.length > 0 ? (
                <select
                  value={activeId}
                  onChange={(e) => setActiveId(e.target.value)}
                  className="field mb-0 w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface cursor-pointer"
                >
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              ) : (
                draftName === null && (
                  <p className="text-sm text-muted">
                    Aucune équipe pour l’instant. Créez-en une pour commencer.
                  </p>
                )
              )}
            </div>

            {draftName !== null && (
              <div className="p-4 bg-ground border border-line rounded-md">
                <label className="flex items-center text-sm font-medium text-ink mb-2">
                  Nom de la nouvelle équipe
                  <FieldHint text="Le nom est le seul critère de distinction : donnez-en un sans ambiguïté, sport et genre compris." />
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createTeam(); } }}
                    placeholder="Suisse M – Football"
                    className="field mb-0 flex-1 px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
                  />
                  <button
                    type="button"
                    onClick={createTeam}
                    disabled={saving}
                    title="Créer l’équipe"
                    className="bg-surface text-muted border border-line w-12 h-12 rounded-md flex items-center justify-center hover:bg-ground hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-none"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            {meta && (
              <div>
                <label className="block text-sm font-medium text-ink mb-3">Joueurs</label>

                {loading ? (
                  <p className="text-sm text-muted py-6 text-center">Chargement…</p>
                ) : (
                  <>
                    {players.length === 0 && (
                      <p className="text-center text-sm text-muted py-8">
                        Cette équipe n’a encore aucun joueur.
                      </p>
                    )}

                    <div className="space-y-2">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 bg-ground ${
                            player.archived ? 'opacity-60' : ''
                          }`}
                        >
                          {/* Portrait : cliquer pour cadrer / changer */}
                          <PortraitUploader
                            value={player.img || ''}
                            onChange={(url) => updatePlayer(player.id, 'img', url)}
                            focal={player.focal}
                            onFocalChange={(f) => updatePlayer(player.id, 'focal', f)}
                            disabled={saving}
                            size={36}
                          />
                          {/* Nom éditable en ligne : style discret, pas la box .field */}
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                            className="flex-1 min-w-0 bg-transparent px-2 py-1 text-sm font-medium text-ink rounded border border-transparent hover:border-line focus:bg-surface focus:border-accent focus:outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => toggleArchived(player.id)}
                            className="text-xs text-muted hover:text-ink shrink-0 cursor-pointer"
                          >
                            {player.archived ? 'Réactiver' : 'Archiver'}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-ink mb-2">Ajouter un joueur</label>
                      <div className="flex gap-3 items-center">
                        <PortraitUploader
                          value={newPortrait}
                          onChange={setNewPortrait}
                          focal={newFocal}
                          onFocalChange={setNewFocal}
                          disabled={saving}
                          size={40}
                        />
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPlayer(); } }}
                          placeholder="Nom du joueur ou de la joueuse"
                          className="field mb-0 flex-1 px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
                        />
                        <button
                          type="button"
                          onClick={addPlayer}
                          title="Ajouter ce joueur à l’équipe"
                          className="bg-surface text-muted border border-line w-12 h-12 rounded-md flex items-center justify-center hover:bg-ground hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-none"
                        >
                          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Boutons d'action, calqués sur ceux du formulaire de widget */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => onClose(false)}
              className="w-1/2 h-11 px-4 text-ink font-medium bg-surface border border-line rounded-pill hover:bg-ground"
              disabled={saving || isSuccess}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className={`w-1/2 h-11 rounded-pill font-semibold transition-all duration-300 ${
                isSuccess ? 'text-white border-green-600' : 'btn-primary'
              }`}
              style={isSuccess
                ? { backgroundColor: '#22c55e', borderColor: '#22c55e', color: 'white', cursor: 'default' }
                : {}}
              disabled={saving || loading || isSuccess || !meta}
            >
              {isSuccess ? '✓ Enregistré !' : (saving ? 'Sauvegarde...' : 'Sauvegarder')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default TeamEditor;
