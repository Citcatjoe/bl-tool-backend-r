import s from './ListItem.module.scss';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase'; // Assurez-vous que le chemin d'importation de db est correct
import { useState, useRef, useEffect } from 'react';

function ListItem({ embed, iconPoll, iconCalendar, iconDotsVertical, iconEye, iconCopy, iconEdit, iconTrash, onEdit }) {
  // State pour gérer la visibilité du menu d'actions
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const menuRef = useRef(null);

  // Toggle de la visibilité du menu
  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuVisible(false);
      }
    };

    if (isMenuVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuVisible]);

  // Handlers séparés pour chaque action (déclarés AVANT le return)

  const handleSocialView = () => {
    let url = '';
    if (embed.type === 'calendar') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-calendar/?calendarDoc=${embed.id}&postMode=true`;
    } else if (embed.type === 'poll') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-quiz/?questionDoc=${embed.id}&postMode=true`;
    } else {
      console.warn('Type d\'embed non supporté pour la vue sociale:', embed.type);
      return;
    }
    
    // Ouvrir dans un nouvel ongletß
    window.open(url, '_blank');
    console.log('Vue sociale ouverte:', url);
  };

  const handleCopy = () => {
    let url = '';
    if (embed.type === 'calendar') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-calendar/?calendarDoc=${embed.id}`;
    } else if (embed.type === 'poll') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-quiz/?questionDoc=${embed.id}`;
    } else {
      url = embed.id; // fallback
    }
    navigator.clipboard.writeText(url)
      .then(() => {
        console.log('URL copiée dans le presse-papier:', url);
      })
      .catch((err) => {
        console.error('Erreur lors de la copie dans le presse-papier:', err);
      });
  };

  const handleEdit = () => {
    console.log('Édition demandée pour', embed.id);
    // Appel du handler passé depuis App.jsx
    if (onEdit) {
      onEdit(embed);
    }
  };
  const handleDelete = () => {
    // Demander confirmation avant suppression
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?\n\nCette action ne peut pas être annulée.')) {
      return; // Annulation par l'utilisateur
    }

    console.log('Suppression demandée pour', embed.id);
    const updateDeletedField = async () => {
        try {
            const docRef = doc(db, 'embeds', embed.id);
            await updateDoc(docRef, { deleted: true });
            console.log('Champ "deleted" mis à TRUE pour', embed.id);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du champ "deleted":', error);
            alert('Erreur lors de la suppression. Veuillez réessayer.');
        }
    };

    updateDeletedField();
  };

  return (
    <li className={`elem-list-item relative h-20 w-full bg-white border-b`}>
      <div className="font-blickb elem-title text-sm text-gray-600 px-4 h-full float-left flex items-center w-4/12">
        {/* Affichage du contenu de la colonne "titre" */}
        {embed.type === 'poll' ? (embed.pollTxt || 'Titre') : (embed.type === 'calendar' ? (embed.calName || 'Titre') : 'Titre')}
      </div>
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
        {/* Affichage de l'icône en fonction du type d'embed */}
        {embed.type === 'poll' && <img src={iconPoll} alt="poll" />}
        {embed.type === 'calendar' && <img src={iconCalendar} alt="calendar" />}
      </div>
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-3/12">
        {/* Affichage de l'auteur */}
        {embed.author || 'Auteur inconnu'}
      </div>
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
        {/* Affichage de la performance ou du nombre de réponses */}
        {embed.type === 'poll'
          ? (Array.isArray(embed.answers)
              ? embed.answers.reduce((acc, a) => acc + (a.answerCounter || 0), 0)
              : 0)
          : <span className="text-gray-400">n/a</span>}
      </div>
      {/* <div className={`${s.elemListItemActions} relative h-full text-sm text-gray-600 px-4 absolute top-1/2 -translate-y-1/2 flex items-center`}>
       <button id="btn-social-view" className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4 ml-auto mr-1" title="Vue RS" onClick={handleSocialView}>
          <img src={iconEye} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
        <button id="btn-copy" className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4 mr-1" title="Copier l'URL" onClick={handleCopy}>
          <img src={iconCopy} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
        <button className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4 mr-1" title="Éditer" onClick={handleEdit}>
          <img src={iconEdit} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
        <button className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4" title="Supprimer" onClick={handleDelete}>
          <img src={iconTrash} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
      </div> */}
       <div id="menu-actions" className="absolute right-4 items-center flex justify-center top-1/2 -translate-y-1/2" ref={menuRef}>
            <button 
              id="menu-actions-btn" 
              className="w-8 h-8 rounded-md hover:bg-gray-100"
              onClick={toggleMenu}
            >
                <img src={iconDotsVertical} alt="Actions" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            </button>
            <ul 
              id="menu-actions-items" 
              className={`absolute bg-white text-base py-2 bottom-0 w-60 right-12 rounded-xl shadow-lg ${isMenuVisible ? 'isVisible' : ''}`}
            >
                {/* Vue RS seulement pour les polls */}
                {embed.type === 'poll' && (
                  <li 
                    className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4"
                    onClick={() => {
                      handleSocialView();
                      setIsMenuVisible(false);
                    }}
                  >
                    <img src={iconEye} alt="" className="mr-5 w-5 h-5" />
                    Vue RS
                  </li>
                )}
                <li 
                  className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4"
                  onClick={() => {
                    handleCopy();
                    setIsMenuVisible(false);
                  }}
                >
                  <img src={iconCopy} alt="" className="mr-5 w-5 h-5" />
                  Copier l'URL
                </li>
                <li 
                  className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4"
                  onClick={() => {
                    handleEdit();
                    setIsMenuVisible(false);
                  }}
                >
                  <img src={iconEdit} alt="" className="mr-5 w-5 h-5" />
                  Éditer
                </li>
                <li 
                  className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4"
                  onClick={() => {
                    handleDelete();
                    setIsMenuVisible(false);
                  }}
                >
                  <img src={iconTrash} alt="" className="mr-5 w-5 h-5" />
                  Supprimer
                </li>
            </ul>
        </div>
    </li>
  );
}

export default ListItem;
