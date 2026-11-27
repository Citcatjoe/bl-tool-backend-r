import { useState, useEffect, useRef } from 'react';
import './App.scss';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';
import BlackOverlay from './components/BlackOverlay/BlackOverlay';
import Header from './components/Header/Header';
import { db } from '@rms/services'; // Importez votre instance Firebase
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore'; // Import des fonctions Firestore
import Login from './components/Login/Login';
import { isForeignGoogleSession } from './components/Login/auth';
import TeamEditor from './components/TeamEditor/TeamEditor';
import NewWidgetPicker from './components/NewWidgetPicker/NewWidgetPicker';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchData, listenToEmbeds } from '@rms/services';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import iconPoll from './assets/img/icon-poll.svg';
import iconCalendar from './assets/img/icon-calendar.svg';
import iconTeaser from './assets/img/icon-teaser.svg';
import iconFolder from './assets/img/icon-folder.svg';
import iconTinder from './assets/img/icon-tinder.svg';
import iconQuiz from './assets/img/icon-quiz.svg';
import iconTestimony from './assets/img/icon-testimony.svg';
import iconJersey from './assets/img/icon-jersey.svg';
import iconProno from './assets/img/icon-percent.svg';
import iconStar from './assets/img/icon-star.svg';
import PollListItem from './components/PollListItem/PollListItem';
import CalendarListItem from './components/CalendarListItem/CalendarListItem';
import ListItem from './components/ListItem/ListItem';
import Form from './components/Form/Form';
import Footer from './components/Footer/Footer';
import TestEnvBanner from './components/TestEnvBanner/TestEnvBanner';

function App() {
    const [docId, setDocId] = useState(null);
    const [question, setQuestion] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false); // Nouvel état pour empêcher plusieurs votes
    const [formVisible, setFormVisible] = useState(false);
    const [loading, setLoading] = useState(true); // Par défaut, l'overlay est visible
    const [user, setUser] = useState(null);
    // Modale de choix du type de widget à créer (remplace l'ancien menu « + »)
    const [newPickerOpen, setNewPickerOpen] = useState(false);
    const [teamEditorOpen, setTeamEditorOpen] = useState(false);
    // Ouverture de l'éditeur des effectifs via `?teams` ou `?teams=<teamId>` (lien depuis le Hub Rédaction).
    // `null` : pas de demande ; '' : éditeur sans équipe imposée ; sinon id de l'équipe à afficher.
    const [teamsRequestId, setTeamsRequestId] = useState(() => new URLSearchParams(window.location.search).get('teams'));
    const [editorTeamId, setEditorTeamId] = useState(null);
    const [embeds, setEmbeds] = useState([]);
    const [embedsLoaded, setEmbedsLoaded] = useState(false); // liste déjà chargée (une fois / live)
    // Ouverture d'un widget en édition via `?edit=<id>` (lien depuis le Hub Rédaction).
    const [editRequestId, setEditRequestId] = useState(() => new URLSearchParams(window.location.search).get('edit') || null);
    const [editNotFound, setEditNotFound] = useState(false);
    const editHandledRef = useRef(false);
    const [searchTerm, setSearchTerm] = useState(''); // State pour la recherche
    const [typeFilter, setTypeFilter] = useState('all'); // State pour le filtre de type ('all', 'poll', 'calendar')
    const [currentPage, setCurrentPage] = useState(1); // Page courante (1-indexed)
    const itemsPerPage = 8; // Nombre d'éléments par page

    // Réinitialiser la pagination lors d'un changement de filtre ou d'une recherche
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter]);

    // States pour la gestion sécurisée du formulaire
    const [formMode, setFormMode] = useState(null); // 'create' | 'edit' | null
    const [formType, setFormType] = useState(null); // 'poll' | 'calendar' | null
    const [currentEmbed, setCurrentEmbed] = useState(null); // Élément en cours d'édition

    // States pour mode développeur
    const [devMode, setDevMode] = useState(false); // Mode développeur
    const [readCount, setReadCount] = useState(0); // Compteur de lectures Firebase
    const [isRealTime, setIsRealTime] = useState(false); // Mode temps réel ou chargement unique
    const [isRefreshing, setIsRefreshing] = useState(false); // État de rafraîchissement manuel

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            // Une session Google hors @ringier.ch ne doit pas entrevoir le
            // dashboard le temps que signInWithGoogle() la déconnecte.
            if (firebaseUser && await isForeignGoogleSession(firebaseUser)) {
                signOut(auth);
                return;
            }
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isRealTime) {
            // MODE TEMPS RÉEL
            const unsubscribe = listenToEmbeds((data) => {
                setEmbeds(data);
                setEmbedsLoaded(true);
                console.log('Données Firestore widgets (live):', data);
                // Compter les lectures en mode dev
                if (devMode) {
                    setReadCount(prevCount => prevCount + data.length);
                }
            }, 'widgets');
            return () => unsubscribe();
        } else {
            // MODE CHARGEMENT UNIQUE
            loadEmbedsOnce();
        }
    }, [devMode, isRealTime]);

    // Fonction de chargement unique
    const loadEmbedsOnce = async () => {
        try {
            const data = await fetchData(devMode, 'widgets');
            console.log('Données Firestore widgets (once):', data);
            setEmbeds(data);
            setEmbedsLoaded(true);
            setReadCount(prevCount => prevCount + data.length);
        } catch (error) {
            // Removed error log
        }
    };

    // Fonction de rafraîchissement manuel
    const handleRefresh = async () => {
        if (isRealTime) return; // Pas besoin de rafraîchir en mode temps réel
        setIsRefreshing(true);
        try {
            await loadEmbedsOnce();
        } catch (error) {
        } finally {
            setIsRefreshing(false);
        }
    };

    // Callback pour rafraîchir automatiquement après une opération CRUD en mode non temps réel
    const handleDataChange = async () => {
        console.log("enter handleDataChange")
        if (!isRealTime) {
            try {
                console.log("try await loadEmbedsOnce")
                await loadEmbedsOnce();
            } catch (error) {
                console.error('Erreur lors du rafraîchissement auto après CRUD:', error);
            }
        }
    };

    const handleLogin = (firebaseUser) => {
        setUser(firebaseUser);
    };

    const handleLogout = async () => {
        const auth = getAuth();
        await signOut(auth);
        setUser(null);
    };

    // Handlers pour la gestion sécurisée du formulaire
    /**
     * Ouvre le formulaire de création pour un type de widget donné. Remplace les
     * 11 anciens `handleNew*` identiques : la modale `NewWidgetPicker` fournit le
     * `type` depuis le registre `WIDGET_TYPES`.
     */
    const openCreate = (type) => {
        setFormMode('create');
        setFormType(type);
        setCurrentEmbed(null);
        setFormVisible(true);
        setNewPickerOpen(false);
    };



    const handleEditEmbed = (embed) => {
        setFormMode('edit');
        setFormType(embed.type); // poll ou calendar
        setCurrentEmbed(embed); // Élément à éditer
        setFormVisible(true);
    };

    // `?edit=<id>` : après connexion ET chargement de la liste, ouvrir le widget en édition.
    // Tant qu'on n'est pas connecté, le paramètre reste dans l'adresse (on l'ouvrira ensuite).
    useEffect(() => {
        if (!user || !editRequestId || editHandledRef.current) return;
        if (!embedsLoaded) return;
        editHandledRef.current = true;

        const target = embeds.find((embed) => (embed.meta?.id || embed.id) === editRequestId);

        // Retirer le paramètre pour qu'un rechargement ne rouvre pas le formulaire.
        const url = new URL(window.location.href);
        url.searchParams.delete('edit');
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);

        if (target) {
            setFormMode('edit');
            setFormType(target.type);
            setCurrentEmbed(target);
            setFormVisible(true);
        } else {
            setEditNotFound(true);
        }
        setEditRequestId(null);
    }, [user, embedsLoaded, embeds, editRequestId]);

    // `?teams[=<teamId>]` : après connexion, ouvrir l'éditeur des effectifs (sur l'équipe demandée
    // si elle existe, sinon sur la première). Le paramètre reste dans l'adresse tant qu'on n'est pas connecté.
    useEffect(() => {
        if (!user || teamsRequestId === null) return;

        // Retirer le paramètre pour qu'un rechargement ne rouvre pas l'éditeur.
        const url = new URL(window.location.href);
        url.searchParams.delete('teams');
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);

        setEditorTeamId(teamsRequestId || null);
        setTeamEditorOpen(true);
        setTeamsRequestId(null);
    }, [user, teamsRequestId]);

    const handleCloseTeamEditor = () => {
        setTeamEditorOpen(false);
        setEditorTeamId(null);
    };

    const handleCloseForm = () => {
        setFormVisible(false);
        setTimeout(() => {
            setFormMode(null);
            setFormType(null);
            setCurrentEmbed(null);
        }, 250);
    };

    // Fonction de filtrage des embeds selon le terme de recherche et le type
    const filteredEmbeds = embeds
        .filter(embed => {
            const isDeleted = embed.meta?.deleted || false;
            
            // 1. Gestion de la corbeille vs éléments actifs
            if (typeFilter === 'deleted') {
                if (!isDeleted) return false;
            } else {
                if (isDeleted) return false;

                // 2. Filtrage par type
                if (typeFilter !== 'all' && embed.type !== typeFilter) {
                    return false;
                }
            }

            // 3. Filtrage par recherche textuelle (valable pour tous les modes)
            if (!searchTerm.trim()) return true;
            
            let title = embed.meta?.title || embed.data?.question || embed.meta?.label || 'Sans titre';
            if (embed.type === 'prono') {
                const pronoData = embed.data?.pronoData || embed.pronoData;
                if (pronoData?.item1?.name && pronoData?.item2?.name) {
                    title = `Pronostic : ${pronoData.item1.name} - ${pronoData.item2.name}`;
                }
            } else if (embed.type === 'potm') {
                const contextText = embed.data?.context?.text || embed.context?.text;
                if (contextText) {
                    title = `Joueur.euse du match : ${contextText}`;
                }
            }
            
            return title.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            // Gestion robuste des Timestamps Firebase
            const timeA = a.meta?.timeCreated?.seconds || a.meta?.timeCreated?.toMillis?.() || 0;
            const timeB = b.meta?.timeCreated?.seconds || b.meta?.timeCreated?.toMillis?.() || 0;
            return timeB - timeA; // Ordre décroissant (plus récent en premier)
        });

    // Identifier les documents sans timeCreated valide
    if (devMode && embeds.length > 0) {
        const problematicDocs = embeds.filter(embed => {
            const time = embed.meta?.timeCreated?.seconds || embed.meta?.timeCreated?.toMillis?.() || 0;
            return time === 0;
        }).map(embed => ({
            id: embed.meta?.id || embed.id,
            type: embed.type,
            title: (() => {
                if (embed.type === 'prono') {
                    const pronoData = embed.data?.pronoData || embed.pronoData;
                    if (pronoData?.item1?.name && pronoData?.item2?.name) {
                        return `Pronostic : ${pronoData.item1.name} - ${pronoData.item2.name}`;
                    }
                } else if (embed.type === 'potm') {
                    const contextText = embed.data?.context?.text || embed.context?.text;
                    if (contextText) {
                        return `Joueur.euse du match : ${contextText}`;
                    }
                }
                return embed.meta?.title || embed.data?.question || 'Sans titre';
            })(),
            author: embed.meta?.author || 'Inconnu'
        }));

        if (problematicDocs.length > 0) {
            console.warn('🚨 DOCUMENTS SANS timeCreated VALIDE:', problematicDocs);
            console.table(problematicDocs);
        }
    }

    if (loading) {
        return <><TestEnvBanner /><LoadingOverlay /></>;
    }

    if (!user) {
        return <><TestEnvBanner /><Login onLogin={handleLogin} /></>;
    }

    return (
        <div className="App relative bg-ground h-screen flex flex-col overflow-hidden">

            <TestEnvBanner />

            <BlackOverlay formVisible={formVisible} onClick={handleCloseForm} />

            {/* Choix du type de widget à créer — remplace l'ancien menu « + » */}
            <NewWidgetPicker
                isOpen={newPickerOpen}
                onClose={() => setNewPickerOpen(false)}
                onPick={openCreate}
            />

            {/* Édition des catalogues de joueurs — données de référence, hors widgets */}
            <TeamEditor
                isOpen={teamEditorOpen}
                teamId={editorTeamId}
                onClose={handleCloseTeamEditor}
            />

            <Header
                onLogout={handleLogout}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                user={user}
                onEditTeams={() => setTeamEditorOpen(true)}
            />

            <Form
                formVisible={formVisible}
                formMode={formMode}
                formType={formType}
                currentEmbed={currentEmbed}
                onClose={handleCloseForm}
                onDataChange={handleDataChange}
                devMode={devMode}
            />

            <div className="flex-1 overflow-y-auto px-6 py-10">

                {editNotFound && (
                    <div className="max-w-[1080px] w-full mx-auto mb-6 px-6 py-4 bg-surface border border-line rounded-lg text-ink">
                        Widget introuvable.
                    </div>
                )}

                {/* <button
                    className="fixed bottom-6 left-6 w-8 h-8 bg-amber-600 z-40"
                    onClick={() => setFormVisible((v) => !v)}
                >
                    form mode
                </button> */}
                <div className="max-w-[1080px] w-full mx-auto mb-5 flex flex-wrap gap-3 items-center">
                    {/* Menu déroulant de filtrage par type */}
                    <div className="relative flex items-center flex-[1_1_260px] min-w-0">
                    <select
                        id="type-filter"
                        aria-label="Type de contenu"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="appearance-none w-full h-[52px] rounded-lg border border-line-strong bg-surface text-ink text-base font-medium pl-4 pr-11 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer"
                    >
                        <option value="all">Tous les contenus</option>
                        <option value="poll">Sondages</option>
                        <option value="calendar">Calendriers</option>
                        <option value="teaser">Teasers</option>
                        <option value="folder">Dossiers</option>
                        <option value="tinder">Tinders</option>
                        <option value="quiz">Quiz</option>
                        <option value="testimony">Appels à témoignage</option>
                        <option value="potm">Joueur·euse du match</option>
                        <option value="natinotes">NatiNotes</option>
                        <option value="prono">Pronostics</option>
                        <option value="facts">Faits marquants</option>
                        {user?.email === 'cesargreppin@gmail.com' && (
                            <option value="deleted">Corbeille</option>
                        )}
                    </select>
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-4 pointer-events-none text-ink">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                    </div>

                    <div id="searchbar" className="flex-[2_1_320px] min-w-0 h-[52px] flex items-center gap-2.5 px-4 rounded-lg border border-line-strong bg-surface text-ink focus-within:ring-2 focus-within:ring-accent focus-within:border-accent">
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none block text-ink">
                            <circle cx="11" cy="11" r="6" />
                            <path d="M20 20l-4.5-4.5" />
                        </svg>
                        <input
                            type="text"
                            aria-label="Rechercher un widget"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-0 h-full border-0 outline-none bg-transparent text-ink text-base placeholder:text-muted focus:outline-none focus:ring-0 focus-visible:outline-none"
                            placeholder="Rechercher un widget…"
                        />
                    </div>

                    {/* <ul id="refresh-options" className="ml-auto"> */}
                    {/* <li className="inline float-left">Mode Live</li>
                        <li className="inline"><button id="btn-refresh">Rafraichir</button></li> */}

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* {devMode && (
                                <div className="mb-4">
                                    <h1>Lectures Firebase: {readCount}</h1>
                                    
                                </div>
                            )} */}
                        {/* <button 
                                onClick={() => setIsRealTime(!isRealTime)}
                                className={`px-4 py-2 rounded text-white ${isRealTime ? 'bg-green-500' : 'bg-blue-500'}`}
                            >
                                {isRealTime ? 'Mode Live ON' : 'Mode Live OFF'}
                            </button> */}
                        {!isRealTime && (
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="h-[52px] px-[22px] inline-flex items-center gap-2 bg-accent-soft rounded-pill text-ink text-base font-semibold hover:bg-[color-mix(in_srgb,var(--accent-soft)_85%,var(--accent))] disabled:opacity-50 cursor-pointer"
                            >
                                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none block text-accent">
                                    <path d="M20 11a8 8 0 1 0-2.3 6.3" />
                                    <path d="M20 5v6h-6" />
                                </svg>
                                {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
                            </button>
                        )}

                        <button
                            id="menu-new-btn"
                            type="button"
                            aria-label="Créer un widget"
                            title="Créer un widget"
                            className="btn-primary flex-none w-14 h-14 rounded-pill inline-flex items-center justify-center shadow-fab"
                            onClick={() => setNewPickerOpen(true)}
                        >
                            <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="flex-none block">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </button>
                    </div>
                    {/* </ul> */}
                </div>

                <p className="max-w-[1080px] w-full mx-auto mb-5 text-sm leading-5 text-muted">
                    <span className="font-bold text-ink">{filteredEmbeds.length}</span> widget{filteredEmbeds.length !== 1 ? 's' : ''} trouvé{filteredEmbeds.length !== 1 ? 's' : ''}
                </p>

                <div className="max-w-[1080px] w-full mx-auto mb-8 bg-surface border border-line rounded-lg shadow-card">
                    <ul>
                        <li className="flex w-full bg-band border-b border-line rounded-t-[11px]">
                            <div className="label font-bold text-muted whitespace-nowrap px-5 py-[14px] w-[29%]">Titre</div>
                            <div className="label font-bold text-muted whitespace-nowrap px-5 py-[14px] w-[19%]">Type</div>
                            <div className="label font-bold text-muted whitespace-nowrap px-5 py-[14px] w-[17.33%]">Auteur</div>
                            {/* <div className="label font-bold text-muted whitespace-nowrap px-5 py-[14px] w-1/12">Vues</div> */}
                            <div className="label font-bold text-muted whitespace-nowrap px-5 py-[14px] w-[9%]">Inter.</div>
                            <div className="label font-bold text-muted whitespace-nowrap px-5 py-[14px] w-[9%]">Créé le</div>
                            {devMode && <div className="label font-bold text-muted whitespace-nowrap px-5 py-[14px] w-1/12">Aff.</div>}
                            {devMode && <div className="label font-bold text-muted whitespace-nowrap px-5 py-[14px] w-1/12">Eng.</div>}
                        </li>
                    </ul>

                    <ul id="elems-list" className="w-full">
                        {(() => {
                            const startIndex = (currentPage - 1) * itemsPerPage;
                            return filteredEmbeds.slice(startIndex, startIndex + itemsPerPage).map((embed, idx) => (
                                <ListItem
                                    key={embed.id || idx}
                                    embed={embed}
                                    iconPoll={iconPoll}
                                    iconCalendar={iconCalendar}
                                    iconTeaser={iconTeaser}
                                    iconFolder={iconFolder}
                                    iconTinder={iconTinder}
                                    iconQuiz={iconQuiz}
                                    iconTestimony={iconTestimony}
                                    iconJersey={iconJersey}
                                    iconProno={iconProno}
                                    iconStar={iconStar}
                                    onEdit={handleEditEmbed}
                                    onDataChange={handleDataChange}
                                    user={user}
                                    devMode={devMode}
                                />
                            ));
                        })()}
                    </ul>

                </div>

                {/* <span id="btn-new" className="fixed cursor-pointer bottom-6 right-6 aspect-square w-16 rounded-full bg-accent ">
                    <img src={iconPlusWhite} alt="Icon-add" className="absolute w-5 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </span> */}

            </div>

            <Footer
                currentPage={currentPage}
                totalPages={Math.ceil(filteredEmbeds.length / itemsPerPage)}
                onPageChange={setCurrentPage}
            />
            {/* Dashboard ou widgets ici */}

        </div>
    );
}

export default App;
