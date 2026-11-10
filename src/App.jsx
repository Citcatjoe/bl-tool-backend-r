import { useState, useEffect, useRef } from 'react';
import './App.scss';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';
import BlackOverlay from './components/BlackOverlay/BlackOverlay';
import Header from './components/Header/Header';
import { db } from '@rms/services'; // Importez votre instance Firebase
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore'; // Import des fonctions Firestore
import Login from './components/Login/Login';
import TeamEditor from './components/TeamEditor/TeamEditor';
import NewWidgetPicker from './components/NewWidgetPicker/NewWidgetPicker';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchData, listenToEmbeds } from '@rms/services';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import iconManifier from './assets/img/icon-manifier.svg';
import iconPlusWhite from './assets/img/icon-add.svg';
import iconPoll from './assets/img/icon-poll.svg';
import iconCalendar from './assets/img/icon-calendar.svg';
import iconCopy from './assets/img/icon-copy.svg';
import iconEdit from './assets/img/icon-edit.svg';
import iconTrash from './assets/img/icon-trash-red.svg';
import iconEye from './assets/img/icon-eye.svg';
import iconDotsVertical from './assets/img/icon-dots-vertical.svg';
import iconTeaser from './assets/img/icon-teaser.svg';
import iconFolder from './assets/img/icon-folder.svg';
import iconTinder from './assets/img/icon-tinder.svg';
import iconQuiz from './assets/img/icon-quiz.svg';
import iconTestimony from './assets/img/icon-testimony.svg';
import iconJersey from './assets/img/icon-jersey.svg';
import iconArrowTurn from './assets/img/icon-arrow-turn.svg';
import iconDownload from './assets/img/icon-download.svg';
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
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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
        <div className="App relative bg-gray h-screen flex flex-col overflow-hidden">

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
                teamId={null}
                onClose={() => setTeamEditorOpen(false)}
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

            <div className="flex-1 overflow-y-auto px-6 py-8 pt-16">

                {editNotFound && (
                    <div className="container max-w-5xl mx-auto mb-6 px-6 py-4 bg-white border border-gray-300 rounded-lg text-gray-700">
                        Widget introuvable.
                    </div>
                )}

                {/* <button
                    className="fixed bottom-6 left-6 w-8 h-8 bg-amber-600 z-40"
                    onClick={() => setFormVisible((v) => !v)}
                >
                    form mode
                </button> */}
                <div className="container max-w-5xl mx-auto mb-8 flex gap-3 items-center">
                    {/* Menu déroulant de filtrage par type */}
                    <select
                        id="type-filter"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className={`flex-1 h-14 rounded-full border-gray-300 ${typeFilter === 'all' ? 'bg-transparent' : 'bg-white'} border px-4 focus:outline-none focus:ring-0 focus:ring-gray-400 focus:border-gray-400 cursor-pointer`}
                    >
                        <option value="all">Tous les contenus</option>
                        <option value="poll">Sondages</option>
                        <option value="calendar">Calendriers</option>
                        <option value="teaser">Teasers</option>
                        <option value="folder">Dossiers</option>
                        <option value="tinder">Tinders</option>
                        <option value="quiz">Quiz</option>
                        <option value="testimony">Témoignages</option>
                        <option value="potm">Joueurs/Joueuses du match</option>
                        <option value="natinotes">Notes des joueur·euse·s</option>
                        <option value="prono">Pronostics</option>
                        <option value="facts">Faits marquants</option>
                        {user?.email === 'cesargreppin@gmail.com' && (
                            <option value="deleted">Corbeille</option>
                        )}
                    </select>

                    <div id="searchbar" className="flex-1 relative">
                        <img src={iconManifier} alt="" className="absolute top-1/2 -translate-y-1/2 left-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full h-14 rounded-full border-gray-300 ${searchTerm ? 'bg-white' : 'bg-transparent'} border pl-14 pr-4 focus:outline-none focus:ring-0 focus:ring-gray-400 focus:border-gray-400`}
                            placeholder="Rechercher..."
                        />
                    </div>

                    {/* <ul id="refresh-options" className="ml-auto"> */}
                    {/* <li className="inline float-left">Mode Live</li>
                        <li className="inline"><button id="btn-refresh">Rafraichir</button></li> */}

                    <div className="ml-auto flex gap-3 flex-shrink-0">
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
                                className="btn-secondary h-14 px-4 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center gap-2 rounded-full"
                            >
                                <img src={iconArrowTurn} alt="" className="mr-1 w-4" />
                                {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
                            </button>
                        )}

                        <div id="menu-new" className="relative z-20">
                            <button id="menu-new-btn" className="menu-new-btn h-14 w-14 rounded-full bg-blick relative" onClick={() => setNewPickerOpen(true)}>
                                <img src={iconPlusWhite} alt="Icon-add" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </button>
                        </div>
                    </div>
                    {/* </ul> */}
                </div>

                <div className="container max-w-5xl mx-auto mb-2 px-2 text-sm text-gray-500">
                    {filteredEmbeds.length} widget{filteredEmbeds.length !== 1 ? 's' : ''} trouvé{filteredEmbeds.length !== 1 ? 's' : ''}
                </div>

                <div className="container max-w-5xl mx-auto mb-8">
                    <ul className="font-i">
                        <li className="h-12 w-full bg-gray-200 rounded-t-lg">
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-4/12">Titre</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-[10%]">Type</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-[23.33%]">Auteur</div>
                            {/* <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Vues</div> */}
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Inter.</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Créé le</div>
                            {devMode && <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Aff.</div>}
                            {devMode && <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Eng.</div>}
                            <div className="text-xs text-gray-600 px-4 h-full float-right flex items-center"></div>
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
                                    iconDotsVertical={iconDotsVertical}
                                    iconEye={iconEye}
                                    iconCopy={iconCopy}
                                    iconEdit={iconEdit}
                                    iconTrash={iconTrash}
                                    iconDownload={iconDownload}
                                    onEdit={handleEditEmbed}
                                    onDataChange={handleDataChange}
                                    user={user}
                                    devMode={devMode}
                                />
                            ));
                        })()}
                    </ul>

                </div>

                {/* <span id="btn-new" className="fixed cursor-pointer bottom-6 right-6 aspect-square w-16 rounded-full bg-blick shadow-lg">
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
