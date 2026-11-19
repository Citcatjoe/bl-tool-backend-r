import { useState, useRef, useEffect } from 'react';
import s from './Header.module.scss';
import logo from '../../assets/brand/widget-studio-logo.svg';

function Header({ onLogout, user, onEditTeams }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuUserRef = useRef(null);

  // Fermer le menu #menu-user si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuUserRef.current && !menuUserRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Filtres par type désactivés (bloc <ul id="filter"> commenté plus bas) :
  // handleFilterClick / getFilterClasses avaient été retirés pour garder le
  // lint propre. À restaurer avec le bloc si le filtre revient un jour.

  return (
    <header className={`${s.header} relative z-30 w-full flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 bg-surface border-b border-line`}>
      <img src={logo} alt="Widget Studio" className="block h-[22px] w-auto" />
      {/* <ul id="filter" className="font-sans flex gap-10 h-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
        <li 
          id="filter-all" 
          className={getFilterClasses('all')}
          onClick={() => handleFilterClick('all')}
        >
          Tous
        </li>
        <li 
          id="filter-poll" 
          className={getFilterClasses('poll')}
          onClick={() => handleFilterClick('poll')}
        >
          Sondages
        </li>
        <li 
          id="filter-calendar" 
          className={getFilterClasses('calendar')}
          onClick={() => handleFilterClick('calendar')}
        >
          Calendriers
        </li>
        <li 
          id="filter-teaser" 
          className={getFilterClasses('teaser')}
          onClick={() => handleFilterClick('teaser')}
        >
          Teasers
        </li>
        <li 
          id="filter-folder" 
          className={getFilterClasses('folder')}
          onClick={() => handleFilterClick('folder')}
        >
          Dossiers
        </li>
        <li 
          id="filter-tinder" 
          className={getFilterClasses('tinder')}
          onClick={() => handleFilterClick('tinder')}
        >
          Tinders
        </li>
        <li 
          id="filter-quiz" 
          className={getFilterClasses('quiz')}
          onClick={() => handleFilterClick('quiz')}
        >
          Quiz
        </li>
        <li 
          id="filter-testimony" 
          className={getFilterClasses('testimony')}
          onClick={() => handleFilterClick('testimony')}
        >
          Témoignages
        </li>
        {user?.email === 'cesargreppin@gmail.com' && (
          <li 
            id="filter-deleted"
            className={typeFilter === 'deleted' ? "font-blickb underline decoration-2 cursor-pointer" : "cursor-pointer hover:font-blickb"}
            onClick={() => handleFilterClick('deleted')}
          >
            Corbeille
          </li>
        )}
      </ul> */}
      <div className="flex items-center gap-2">
        {/* Éditer les effectifs — données de référence, à gauche du profil */}
        <button
          id="edit-teams-btn"
          type="button"
          onClick={onEditTeams}
          className="inline-flex items-center min-h-[44px] px-2 text-[15px] font-medium text-ink hover:text-muted cursor-pointer whitespace-nowrap"
        >
          Éditer les effectifs
        </button>

        <div id="menu-user" className="relative" ref={menuUserRef}>
          <button
            id="menu-user-btn"
            type="button"
            aria-label="Mon compte"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center justify-center w-11 h-11 rounded-pill text-ink hover:bg-ground cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </button>
          <ul
            className={
              `${s.menuUserItems} absolute right-0 top-full mt-2 w-60 py-2 text-left bg-surface border border-line rounded-lg shadow-pop${menuOpen ? ' ' + s.isVisible : ''}`
            }
          >
            <li id="user-info" className="text-sm text-muted border-b border-line min-h-16 py-3 flex items-center px-4 break-all">
              Connecté en tant que : {user?.email || 'Utilisateur inconnu'}
            </li>
            <li id="logout" className="hover:bg-ground text-ink cursor-pointer h-12 flex items-center px-4" onClick={onLogout}>Déconnexion</li>
          </ul>
        </div>
      </div>
    </header>
  );
}

export default Header;
