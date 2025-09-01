import { useState, useEffect, useRef } from 'react'; 
import './App.scss';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';
import BlackOverlay from './components/BlackOverlay/BlackOverlay';
import Header from './components/Header/Header';
import { db } from './services/firebase'; // Importez votre instance Firebase
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore'; // Import des fonctions Firestore
import Login from './components/Login/Login';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchData, listenToEmbeds } from './services/api';
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
import iconArrowTurn from './assets/img/icon-arrow-turn.svg';
import PollListItem from './components/PollListItem/PollListItem';
import CalendarListItem from './components/CalendarListItem/CalendarListItem';
import ListItem from './components/ListItem/ListItem';
import Form from './components/Form/Form';

function App() {
    const [docId, setDocId] = useState(null);
    const [question, setQuestion] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false); // Nouvel état pour empêcher plusieurs votes
    const [formVisible, setFormVisible] = useState(false);
    const [loading, setLoading] = useState(true); // Par défaut, l'overlay est visible
    const [user, setUser] = useState(null);
    const [menuNewOpen, setMenuNewOpen] = useState(false);
    const menuNewRef = useRef(null);
    // Fermer le menu #menu-new si on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuNewRef.current && !menuNewRef.current.contains(event.target)) {
                setMenuNewOpen(false);
            }
        };
        if (menuNewOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuNewOpen]);
    const [embeds, setEmbeds] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // State pour la recherche
    const [typeFilter, setTypeFilter] = useState('all'); // State pour le filtre de type ('all', 'poll', 'calendar')
    
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
                console.log('Données Firestore embeds (live):', data);
                // Compter les lectures en mode dev
                if (devMode) {
                    setReadCount(prevCount => prevCount + data.length);
                }
            });
            return () => unsubscribe();
        } else {
            // MODE CHARGEMENT UNIQUE
            loadEmbedsOnce();
        }
    }, [devMode, isRealTime]);

    // Fonction de chargement unique
    const loadEmbedsOnce = async () => {
        try {
            const data = await fetchData(devMode);
            console.log('Données Firestore embeds (once):', data);
            setEmbeds(data);
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
    const handleNewPoll = () => {
        setFormMode('create');
        setFormType('poll');
        setCurrentEmbed(null); // Pas d'élément existant
        setFormVisible(true);
        setMenuNewOpen(false);
    };

    const handleNewCalendar = () => {
        setFormMode('create');
        setFormType('calendar');
        setCurrentEmbed(null);
        setFormVisible(true);
        setMenuNewOpen(false);
    };

    const handleNewTeaser = () => {
        setFormMode('create');
        setFormType('teaser');
        setCurrentEmbed(null);
        setFormVisible(true);
        setMenuNewOpen(false);
    };

    const handleNewFolder = () => {
        setFormMode('create');
        setFormType('folder');
        setCurrentEmbed(null);
        setFormVisible(true);
        setMenuNewOpen(false);
    };

    const handleNewTinder = () => {
        setFormMode('create');
        setFormType('tinder');
        setCurrentEmbed(null);
        setFormVisible(true);
        setMenuNewOpen(false);
    };

    const handleEditEmbed = (embed) => {
        setFormMode('edit');
        setFormType(embed.type); // poll ou calendar
        setCurrentEmbed(embed); // Élément à éditer
        setFormVisible(true);
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
            if (typeFilter === 'deleted') {
                return embed.deleted === true;
            } else {
                if (embed.deleted) return false;
                if (typeFilter !== 'all' && embed.type !== typeFilter) {
                    return false;
                }
                // Filtre par recherche textuelle
                if (!searchTerm.trim()) return true;
                let title = '';
                if (embed.type === 'poll') {
                    title = embed.pollTxt;
                } else if (embed.type === 'calendar') {
                    title = embed.calName;
                } else if (embed.type === 'teaser') {
                    title = embed.teaserTitle || embed.teaserLabel;
                } else if (embed.type === 'folder') {
                    title = embed.folderName;
                } else if (embed.type === 'tinder') {
                    title = embed.tinderTitle;
                }
                return title?.toLowerCase().includes(searchTerm.toLowerCase());
            }
        })
        .sort((a, b) => b.timeCreated - a.timeCreated);

    if (loading) {
        return <LoadingOverlay />;
    }

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className={`App relative bg-gray px-6 pt-40 overflow-auto`}>
                
                <BlackOverlay formVisible={formVisible} onClick={handleCloseForm} />
                <Header 
                    onLogout={handleLogout} 
                    typeFilter={typeFilter} 
                    onTypeFilterChange={setTypeFilter}
                    user={user}
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
                
                {/* <button
                    className="fixed bottom-6 left-6 w-8 h-8 bg-amber-600 z-40"
                    onClick={() => setFormVisible((v) => !v)}
                >
                    form mode
                </button> */}
                <div className="container max-w-5xl mx-auto mb-8 flex">
                    <div id="searchbar" className="flex w-96 relative">
                        <img src={iconManifier} alt="" className="absolute top-1/2 -translate-y-1/2 left-4" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 rounded-full border-gray-300 bg-transparent border pl-14 pr-4" 
                            placeholder="Rechercher..." 
                        />
                    </div>

                    {/* <ul id="refresh-options" className="ml-auto"> */}
                        {/* <li className="inline float-left">Mode Live</li>
                        <li className="inline"><button id="btn-refresh">Rafraichir</button></li> */}

                        <div className="ml-auto flex gap-2 mt-2">
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
                                    className="btn-secondary px-4 hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <img src={iconArrowTurn} alt="" className="mr-1 w-4" />
                                    {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
                                </button>
                            )}
                        </div>
                    {/* </ul> */}
                </div>

                <div className="container max-w-5xl mx-auto mb-8">
                    <ul className="font-i">
                        <li className="h-12 w-full bg-gray-200 rounded-t-lg">
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-4/12">Titre</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Type</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-3/12">Auteur</div>
                            {/* <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Vues</div> */}
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Inter.</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-right flex items-center"></div>
                        </li>
                    </ul>

                    <ul id="elems-list" className="w-full">
                        {filteredEmbeds.map((embed, idx) => (
                            <ListItem
                                key={embed.id || idx}
                                embed={embed}
                                iconPoll={iconPoll}
                                iconCalendar={iconCalendar}
                                iconTeaser={iconTeaser}
                                iconFolder={iconFolder}
                                iconTinder={iconTinder}
                                iconDotsVertical={iconDotsVertical}
                                iconEye={iconEye}
                                iconCopy={iconCopy}
                                iconEdit={iconEdit}
                                iconTrash={iconTrash}
                                onEdit={handleEditEmbed}
                                onDataChange={handleDataChange}
                                user={user}
                            />
                        ))}
                    </ul>
                </div>

                {/* <span id="btn-new" className="fixed cursor-pointer bottom-6 right-6 aspect-square w-16 rounded-full bg-blick shadow-lg">
                    <img src={iconPlusWhite} alt="Icon-add" className="absolute w-5 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </span> */}

                <div id="menu-new" className="fixed bottom-6 right-6 z-10" ref={menuNewRef}>
                    <button id="menu-new-btn" className="menu-new-btn h-16 w-16 rounded-full bg-blick shadow-lg relative" onClick={() => setMenuNewOpen(v => !v)}>
                        <img src={iconPlusWhite} alt="Icon-add" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </button>
                    <ul id="menu-new-items" className={`absolute bg-white py-2 -top-4 w-60 right-0 rounded-xl shadow-lg${menuNewOpen ? ' isVisible' : ''}`}>
                        <li id="btn-new-poll" className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4" onClick={handleNewPoll}>Nouveau sondage</li>
                        <li id="btn-new-calendar" className="hover:bg-gray-200 cursor-pointer  h-12 flex items-center px-4" onClick={handleNewCalendar}>Nouveau calendrier</li>
                        <li id="btn-new-teaser" className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4" onClick={handleNewTeaser}>Nouveau teaser</li>
                        <li id="btn-new-folder" className="h-12 flex items-center px-4 text-gray-400 cursor-not-allowed opacity-50" title="Fonctionnalité en cours de développement">Nouveau dossier</li>
                        <li id="btn-new-tinder" className="hover:bg-gray-200 cursor-pointer  h-12 flex items-center px-4" onClick={handleNewTinder}>Nouveau tinder</li>
                    </ul>
                </div>
            {/* Dashboard ou widgets ici */}
            
        </div>
    );
}

export default App;
