import { useState, useEffect } from 'react'; 
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
import PollListItem from './components/PollListItem/PollListItem';
import CalendarListItem from './components/CalendarListItem/CalendarListItem';
import ListItem from './components/ListItem/ListItem';
import Form from './components/Form/Form';

function App() {
    const [docId, setDocId] = useState(null);
    const [question, setQuestion] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false); // Nouvel état pour empêcher plusieurs votes
    const [editionMode, setEditionMode] = useState(false);
    const [loading, setLoading] = useState(true); // Par défaut, l'overlay est visible
    const [user, setUser] = useState(null);
    const [menuNewOpen, setMenuNewOpen] = useState(false);
    const [embeds, setEmbeds] = useState([]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = listenToEmbeds((data) => {
            setEmbeds(data);
            console.log('Données Firestore embeds (live):', data);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = (firebaseUser) => {
        setUser(firebaseUser);
    };

    const handleLogout = async () => {
        const auth = getAuth();
        await signOut(auth);
        setUser(null);
    };

    if (loading) {
        return <LoadingOverlay />;
    }

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className={`App relative bg-gray px-6 pt-40`}>

                <BlackOverlay editionMode={editionMode} />
                <Header onLogout={handleLogout} />
                
                <Form editionMode={editionMode} />
                
                <button
                    className="fixed bottom-6 left-6 w-8 h-8 bg-amber-600 z-40"
                    onClick={() => setEditionMode((v) => !v)}
                >
                    form mode
                </button>
                <div className="container max-w-5xl mx-auto mb-8">
                    <div id="searchbar" className="flex w-96 relative">
                        <img src={iconManifier} alt="" className="absolute top-1/2 -translate-y-1/2 left-4" />
                        <input type="text" className="w-full h-14 rounded-full border-gray-300 bg-transparent border pl-14 pr-4" placeholder="Rechercher..." />
                    </div>
                </div>

                <div className="container max-w-5xl mx-auto mb-8">
                    <ul className="font-i">
                        <li className="h-12 w-full bg-gray-200 rounded-t-lg">
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-4/12">Titre</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Type</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-3/12">Auteur</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-left flex items-center w-1/12">Perf.</div>
                            <div className="text-xs text-gray-600 px-4 h-full float-right flex items-center"></div>
                        </li>
                    </ul>

                    <ul id="elems-list" className="w-full">
                        {embeds
                            .filter(embed => !embed.deleted)
                            .sort((a, b) => b.timeCreated - a.timeCreated) // tri du plus récent au plus ancien
                            .map((embed, idx) => (
                                <ListItem
                                    key={embed.id || idx}
                                    embed={embed}
                                    iconPoll={iconPoll}
                                    iconCalendar={iconCalendar}
                                    iconCopy={iconCopy}
                                    iconEdit={iconEdit}
                                    iconTrash={iconTrash}
                                />
                            ))}
                    </ul>
                </div>

                {/* <span id="btn-new" className="fixed cursor-pointer bottom-6 right-6 aspect-square w-16 rounded-full bg-blick shadow-lg">
                    <img src={iconPlusWhite} alt="Icon-add" className="absolute w-5 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </span> */}

                <div id="menu-new" className="fixed bottom-6 right-6 z-10">
                    <button
                        id="menu-new-btn"
                        className="menu-new-btn h-16 w-16 rounded-full bg-blick shadow-lg relative"
                        onClick={() => setMenuNewOpen(v => !v)}
                    >
                        <img src={iconPlusWhite} alt="Icon-add" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </button>
                    <ul
                        id="menu-new-items"
                        className={`absolute bg-white py-2 -top-4 w-60 right-0 rounded-xl shadow-lg${menuNewOpen ? ' isVisible' : ''}`}
                    >
                        <li id="btn-new-poll" className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4">Nouveau sondage</li>
                        <li id="btn-new-calendar" className="hover:bg-gray-200 cursor-pointer  h-12 flex items-center px-4">Nouveau calendrier</li>
                    </ul>
                </div>
            {/* Dashboard ou widgets ici */}
        </div>
    );
}

export default App;
