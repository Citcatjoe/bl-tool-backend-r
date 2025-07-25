import { useState } from 'react';
import s from './Header.module.scss';
import logo from '../../assets/img/blick-tools-logo.svg';
import iconUser from '../../assets/img/icon-user.svg';

function Header({ onLogout, typeFilter, onTypeFilterChange, user }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Handler pour les changements de filtre
  const handleFilterClick = (filterType) => {
    onTypeFilterChange(filterType);
  };

  // Fonction pour déterminer les classes CSS selon l'état actif
  const getFilterClasses = (filterType) => {
    return typeFilter === filterType 
      ? "font-blickb underline decoration-2 cursor-pointer"
      : "cursor-pointer hover:font-blickb";
  };

  return (
    <header className={`${s.header} bg-white fixed top-0 w-full bg-white border-b -mx-6 z-10`}>
      <img src={logo} alt="logo blick tools" className="absolute left-4 top-1/2 -translate-y-1/2"/>
      <ul id="filter" className="font-blickr flex gap-10 h-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
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
          className="cursor-pointer hover:font-blickb opacity-20"
          title="Fonctionnalité non disponible"
        >
          Teasers
        </li>
      </ul>
      <div id="menu-user" className="absolute top-0 right-0 h-full aspect-square">
        <button
          id="menu-user-btn"
          className="btn-white hover:bg-gray-200 btn-secondary h-full aspect-square border-l"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <img src={iconUser} alt="Icon-add" className="absolute w-5 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
        <ul
          className={
            `${s.menuUserItems} absolute bg-white py-2 -bottom-4 w-60 text-left right-4 rounded-xl shadow-lg${menuOpen ? ' ' + s.isVisible : ''}`
          }
        >
          <li id="user-info" className="text-sm text-gray-400 border-b h-16 flex items-center px-4">
            Connecté en tant que : {user?.email || 'Utilisateur inconnu'}
          </li>
          <li id="logout" className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4" onClick={onLogout}>Déconnexion</li>
        </ul>
      </div>
    </header>
  );
}

export default Header;
