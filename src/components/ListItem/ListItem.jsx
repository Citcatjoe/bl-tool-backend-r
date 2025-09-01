import s from './ListItem.module.scss';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase'; // Assurez-vous que le chemin d'importation de db est correct
import { useState, useRef, useEffect } from 'react';

function ListItem({ embed, iconPoll, iconCalendar, iconTeaser, iconFolder, iconTinder, iconDotsVertical, iconEye, iconCopy, iconEdit, iconTrash, onEdit, onDataChange, user }) {
  // Handler pour la modification de la structure d'un poll
  // const handleModifyPollData = async () => {
  //   if (embed.type !== 'poll') return;
  //   if (!Array.isArray(embed.answers)) {
  //     alert('Aucune donnée answers à migrer.');
  //     return;
  //   }
  //   // Extraire les textes et compteurs
  //   const answerTxts = embed.answers.map(a => a.answerTxt || '');
  //   const answerCounters = embed.answers.map(a => typeof a.answerCounter === 'number' ? a.answerCounter : 0);
  //   try {
  //     const docRef = doc(db, 'embeds', embed.id);
  //     await updateDoc(docRef, {
  //       answerTxts,
  //       answerCounters
  //     });
  //     console.log('Migration réussie pour', embed.id, answerTxts, answerCounters);
  //     alert('Migration réussie !');
  //     if (onDataChange) onDataChange();
  //   } catch (error) {
  //     console.error('Erreur lors de la migration des réponses:', error);
  //     alert('Erreur lors de la migration. Veuillez réessayer.');
  //   }
  // };
    // Suppression définitive du document Firestore
    const handleDeleteForReal = async () => {
      if (!window.confirm('Supprimer pour de vrai ? Cette action est IRRÉVERSIBLE !')) return;
      try {
        const docRef = doc(db, 'embeds', embed.id);
        await docRef.delete ? docRef.delete() : await import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(docRef));
        console.log('Document supprimé pour de vrai:', embed.id);
        alert('Document supprimé définitivement !');
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error('Erreur lors de la suppression définitive:', error);
        alert('Erreur lors de la suppression définitive. Veuillez réessayer.');
      }
    };
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
    } else if (embed.type === 'teaser') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-teaser/?teaserDoc=${embed.id}`;
    } else if (embed.type === 'folder') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-folder/?folderDoc=${embed.id}`;
     } else if (embed.type === 'tinder') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-tinder/?tinderDoc=${embed.id}`; // Les dossiers n'ont pas d'URL d'embed
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
            
            // Déclencher un rafraîchissement des données si en mode non temps réel
            if (onDataChange) {
              onDataChange();
            }
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
        {embed.type === 'poll'
          ? (embed.pollTxt || 'Titre')
          : embed.type === 'calendar'
            ? (embed.calName || 'Titre')
            : embed.type === 'teaser'
              ? (embed.teaserTitle || embed.teaserLabel || 'Titre')
              : embed.type === 'folder'
                ? (embed.folderName || 'Dossier')
                : embed.type === 'tinder'
                  ? (embed.tinderTitle || 'Tinder')
                  : 'Titre'}
      </div>
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
        {/* Affichage de l'icône en fonction du type d'embed */}
        {embed.type === 'poll' && <img src={iconPoll} alt="poll" />}
        {embed.type === 'calendar' && <img src={iconCalendar} alt="calendar" />}
        {embed.type === 'teaser' && <img src={iconTeaser} alt="teaser" />}
        {embed.type === 'folder' && <img src={iconFolder} alt="folder" />}
        {embed.type === 'tinder' && <img src={iconTinder} alt="tinder" />}
      </div>
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-3/12">
        {/* Affichage de l'auteur */}
        {embed.author || 'Auteur inconnu'}
      </div>
      {/* <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
          {typeof embed.counterViews === 'number' ? embed.counterViews : 0}
      </div> */}
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
        {/* Affichage de la performance ou du nombre de réponses */}
        {embed.type === 'poll'
          ? (Array.isArray(embed.answerCounters)
              ? embed.answerCounters.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)
              : 0)
          : embed.type === 'tinder'
            ? (embed.tinderVotes && typeof embed.tinderVotes === 'object'
                ? Object.values(embed.tinderVotes).reduce((acc, vote) => acc + (vote.yes || 0) + (vote.no || 0), 0)
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
                {user?.email === 'cesargreppin@gmail.com' && (
                  <li 
                    className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4"
                    onClick={() => {
                      handleDeleteForReal();
                      setIsMenuVisible(false);
                    }}
                  >
                    <img src={iconTrash} alt="" className="mr-5 w-5 h-5" />
                    Supprimer pour de vrai
                  </li>
                )}
                {/* <li 
                  id="menu-action-modify-this-poll-data" 
                  className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4"
                  onClick={() => {
                    handleModifyPollData();
                    setIsMenuVisible(false);
                  }}
                >
                  GO!!
                </li> */}
            </ul>
        </div>
    </li>
  );
}

export default ListItem;
