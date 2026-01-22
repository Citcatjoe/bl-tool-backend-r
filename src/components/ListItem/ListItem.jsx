import s from './ListItem.module.scss';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase'; // Assurez-vous que le chemin d'importation de db est correct
import { useState, useRef, useEffect } from 'react';

function ListItem({ embed, iconPoll, iconCalendar, iconTeaser, iconFolder, iconTinder, iconQuiz, iconTestimony, iconJersey, iconDotsVertical, iconEye, iconCopy, iconEdit, iconTrash, iconDownload, onEdit, onDataChange, user, devMode }) {
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

  const handleDownloadMessages = async () => {
    if (embed.type !== 'testimony') return;
    
    try {
      // Récupérer tous les documents de la sous-collection 'messages'
      const messagesRef = collection(db, 'embeds', embed.id, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      if (messagesSnapshot.empty) {
        alert('Aucun message trouvé pour ce témoignage.');
        return;
      }
      
      // Convertir les messages en format texte
      const messages = [];
      messagesSnapshot.forEach((doc) => {
        const data = doc.data();
        const timeSent = data.timeSent?.toDate ? data.timeSent.toDate() : new Date(data.timeSent);
        
        messages.push({
          email: data.email || 'Email non renseigné',
          name: data.name || 'Nom non renseigné',
          text: data.text || 'Message vide',
          timeSent: timeSent
        });
      });
      
      // Trier par date (plus récent en premier)
      messages.sort((a, b) => b.timeSent - a.timeSent);
      
      // Formater en texte
      let textContent = `Messages du témoignage: ${embed.title || 'Sans titre'}\n`;
      textContent += `Nombre de messages: ${messages.length}\n`;
      textContent += `Exporté le: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      textContent += '='.repeat(50) + '\n\n';
      
      messages.forEach((message, index) => {
        // Numéroter de manière chronologique (message 1 = le plus ancien)
        const messageNumber = messages.length - index;
        textContent += `Message ${messageNumber}\n`;
        textContent += `Date: ${message.timeSent.toLocaleDateString('fr-FR')} à ${message.timeSent.toLocaleTimeString('fr-FR')}\n`;
        textContent += `Nom: ${message.name}\n`;
        textContent += `Email: ${message.email}\n`;
        textContent += `Message:\n${message.text}\n\n`;
        textContent += '-'.repeat(30) + '\n\n';
      });
      
      // Créer et télécharger le fichier
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `messages_${embed.title || 'testimony'}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`${messages.length} messages téléchargés pour le témoignage ${embed.id}`);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement des messages:', error);
      alert('Erreur lors du téléchargement des messages. Veuillez réessayer.');
    }
  };

  const handleSocialView = () => {
    let url = '';
    if (embed.type === 'poll') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-poll/?pollDoc=${embed.id}&postMode=true`;
    } else {
      console.warn('Type d\'embed non supporté pour la vue sociale:', embed.type);
      return;
    }
    window.open(url, '_blank');
    console.log('Vue sociale ouverte:', url);
  };

  const handleCopy = () => {
    let url = '';
    if (embed.type === 'calendar') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-calendar/?calendarDoc=${embed.id}`;
    } else if (embed.type === 'poll') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-poll/?pollDoc=${embed.id}`;
    } else if (embed.type === 'teaser') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-teaser/?teaserDoc=${embed.id}`;
    } else if (embed.type === 'folder') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-folder/?folderDoc=${embed.id}`;
     } else if (embed.type === 'tinder') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-tinder/?tinderDoc=${embed.id}`; 
    } else if (embed.type === 'quiz') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-quiz/?quizDoc=${embed.id}`; 
    } else if (embed.type === 'testimony') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-testimony/?testimonyDoc=${embed.id}`; 
    } else if (embed.type === 'potm') {
      url = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-potm/?potmDoc=${embed.id}`; 
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

  const handleCopyId = () => { 
    navigator.clipboard.writeText(embed.id)
      .then(() => {
        console.log('ID copié dans le presse-papier:', embed.id);
      })
      .catch((err) => {
        console.error('Erreur lors de la copie de l\'ID dans le presse-papier:', err);
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
              ? ((embed.teaserTitle || embed.teaserLabel || 'Titre').replace(/\\n/g, ' '))
              : embed.type === 'folder'
                ? ((embed.folderName || 'Dossier').replace(/\\n/g, ' '))
                : embed.type === 'tinder'
                  ? (embed.tinderTitle || 'Tinder')
                  : embed.type === 'quiz'
                    ? (embed.title || 'Quiz')
                    : embed.type === 'testimony'
                      ? (embed.title || 'Témoignage')
                      : embed.type === 'potm'
                        ? ('Joueur·euse du match' + (embed.context?.text ? (' (' + embed.context.text + ')') : ''))
                        : 'Titre'} 
      </div>
      <div className="icon-container text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
        {/* Affichage de l'icône en fonction du type d'embed */}
        {embed.type === 'poll' && <img src={iconPoll} alt="poll" />}
        {embed.type === 'calendar' && <img src={iconCalendar} alt="calendar" />}
        {embed.type === 'teaser' && <img src={iconTeaser} alt="teaser" />}
        {embed.type === 'folder' && <img src={iconFolder} alt="folder" />}
        {embed.type === 'tinder' && <img src={iconTinder} alt="tinder" />}
        {embed.type === 'quiz' && <img src={iconQuiz} alt="quiz" />}
        {embed.type === 'testimony' && <img src={iconTestimony} alt="testimony" />}
        {embed.type === 'potm' && <img src={iconJersey} alt="potm" />}
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
          : embed.type === 'quiz'
            ? (
                embed.statsGlobal && embed.statsGlobal.scoreDistribution && typeof embed.statsGlobal.scoreDistribution === 'object'
                  ? Object.values(embed.statsGlobal.scoreDistribution).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)
                  : 0
              )
          : embed.type === 'potm'
            ? (embed.totalVotes || 0)
            : <span className="text-gray-400">n/a</span>}
      </div>

      {devMode && (
        <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
          {/* Affichage du nombre de vues */}
          {typeof embed.counterViews === 'number' ? embed.counterViews : 0}
        </div>
      )}

      {devMode && (
        <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
          {/* Affichage du rapport performance/counterViews */}
          {(() => {
            // Calcul de la performance selon le type
            let performance = 0;
            if (embed.type === 'poll') {
              performance = Array.isArray(embed.answerCounters)
                ? embed.answerCounters.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)
                : 0;
            } else if (embed.type === 'tinder') {
              performance = embed.tinderVotes && typeof embed.tinderVotes === 'object'
                ? Object.values(embed.tinderVotes).reduce((acc, vote) => acc + (vote.yes || 0) + (vote.no || 0), 0)
                : 0;
            } else if (embed.type === 'quiz') {
              performance = embed.statsGlobal && embed.statsGlobal.scoreDistribution && typeof embed.statsGlobal.scoreDistribution === 'object'
                ? Object.values(embed.statsGlobal.scoreDistribution).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)
                : 0;
            } else if (embed.type === 'potm') {
              performance = embed.totalVotes || 0;
            } else {
              return <span className="text-gray-400">n/a</span>;
            }
            
            // Calcul du rapport
            const counterViews = typeof embed.counterViews === 'number' ? embed.counterViews : 0;
            if (counterViews === 0) {
              return <span className="text-gray-400">n/a</span>;
            }
            
            const ratio = ((performance / counterViews) * 100).toFixed(1);
            return `${ratio}%`;
          })()}
        </div>
      )}
     
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
                {embed.type === 'testimony' && (
                  <li 
                    className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4"
                    onClick={() => {
                      handleDownloadMessages();
                      setIsMenuVisible(false);
                    }}
                  >
                    <img src={iconDownload} alt="" className="mr-5 w-5 h-5" />
                    Télécharger messages
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
                {user?.email === 'cesargreppin@gmail.com' && (
                  <li 
                    className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4"
                    onClick={() => {
                      handleCopyId();
                      setIsMenuVisible(false);
                    }}
                  >
                    <img src={iconCopy} alt="" className="mr-5 w-5 h-5" />
                    Copier l'ID
                  </li>
                )}
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
