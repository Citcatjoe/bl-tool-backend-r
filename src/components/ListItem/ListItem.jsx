import s from './ListItem.module.scss';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@rms/services'; // Assurez-vous que le chemin d'importation de db est correct
import { useState, useRef, useEffect } from 'react';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import TypeBadge from '../TypeBadge';
import { WIDGET_TYPES } from '../../data/widgetTypes';

function ListItem({ embed, iconPoll, iconCalendar, iconTeaser, iconFolder, iconTinder, iconQuiz, iconTestimony, iconJersey, iconProno, iconStar, iconDotsVertical, iconEye, iconCopy, iconEdit, iconTrash, iconDownload, onEdit, onDataChange, user, devMode }) {
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
  const performDeleteForReal = async () => {
    try {
      const docRef = doc(db, 'widgets', embed.id || embed.meta?.id);
      await docRef.delete ? docRef.delete() : await import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(docRef));
      console.log('Document supprimé pour de vrai:', embed.id);
      if (onDataChange) onDataChange();
      setDeleteModalConfig({ isOpen: false, type: null });
    } catch (error) {
      console.error('Erreur lors de la suppression définitive:', error);
      alert('Erreur lors de la suppression définitive. Veuillez réessayer.');
      setDeleteModalConfig({ isOpen: false, type: null });
    }
  };

  // State pour gérer la visibilité du menu d'actions
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, type: null });
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
      const messagesRef = collection(db, 'widgets', embed.id || embed.meta?.id, 'messages');
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
      
      const safeTitle = (embed.meta?.title || 'testimony').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      let textContent = `Messages du témoignage: ${embed.meta?.title || 'Sans titre'}\n`;
      textContent += `Total de messages reçus: ${messages.length}\n`;
      textContent += `Date de l'export: ${new Date().toLocaleString('fr-CH')}\n`;
      textContent += `=================================================\n\n`;

      messages.forEach((message, index) => {
        const messageNumber = messages.length - index;
        textContent += `Message ${messageNumber}\n`;
        textContent += `Date: ${message.timeSent.toLocaleDateString('fr-FR')} à ${message.timeSent.toLocaleTimeString('fr-FR')}\n`;
        textContent += `Nom: ${message.name}\n`;
        textContent += `Email: ${message.email}\n`;
        textContent += `Message:\n${message.text}\n\n`;
        textContent += '-'.repeat(30) + '\n\n';
      });

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `messages_${safeTitle}_${new Date().toISOString().split('T')[0]}.txt`;
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
    const type = embed.type || 'unknown';
    
    // Base URL facilement modifiable si l'arborescence FTP (monorepo) évolue
    // On conserve l'ancienne arborescence (Option A) pour ne rien casser
    const baseUrl = `https://storytelling.blick.ch/fr/__is_embed_somewhere/bl-tools-client-${type}/`;
    let url = `${baseUrl}?${type}Doc=${embed.id}`;
    
    // Cas spécifique pour le widget poll
    if (type === 'poll') {
      const brandParam = embed.brand || 'blick';
      url += `&brand=${brandParam}`;
    }

    navigator.clipboard.writeText(url)
      .then(() => {
        console.log('URL copiée dans le presse-papier:', url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Erreur lors de la copie dans le presse-papier:', err);
      });
  };

  const handleCopyId = () => { 
    navigator.clipboard.writeText(embed.id)
      .then(() => {
        console.log('ID copié dans le presse-papier:', embed.id);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
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
  const performDelete = async () => {
    console.log('Suppression demandée pour', embed.id);
    try {
        const docRef = doc(db, 'widgets', embed.id || embed.meta?.id);
        await updateDoc(docRef, { 'meta.deleted': true });
        console.log('Champ "deleted" mis à TRUE pour', embed.id);
        
        if (onDataChange) {
          onDataChange();
        }
        setDeleteModalConfig({ isOpen: false, type: null });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du champ "deleted":', error);
        alert('Erreur lors de la suppression. Veuillez réessayer.');
        setDeleteModalConfig({ isOpen: false, type: null });
    }
  };

  const handleDeleteClick = () => {
    setIsMenuVisible(false);
    setDeleteModalConfig({ isOpen: true, type: 'soft' });
  };

  const handleDeleteForRealClick = () => {
    setIsMenuVisible(false);
    setDeleteModalConfig({ isOpen: true, type: 'hard' });
  };

  const getPerformanceVal = () => {
    const data = embed.data || embed;
    const stats = embed.stats || embed;

    if (embed.type === 'poll') {
      if (!stats.answerCounters) return 0;
      return Array.isArray(stats.answerCounters)
        ? stats.answerCounters.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)
        : Object.values(stats.answerCounters).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
    }
    if (embed.type === 'tinder') {
      return stats.tinderVotes && typeof stats.tinderVotes === 'object'
        ? Object.values(stats.tinderVotes).reduce((acc, vote) => acc + (vote.yes || 0) + (vote.no || 0), 0)
        : 0;
    }
    if (embed.type === 'quiz') {
      return stats.statsGlobal && stats.statsGlobal.scoreDistribution && typeof stats.statsGlobal.scoreDistribution === 'object'
        ? Object.values(stats.statsGlobal.scoreDistribution).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)
        : 0;
    }
    if (embed.type === 'potm') {
      if (stats.playersVotes) {
        return Object.values(stats.playersVotes).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      }
      return stats.totalVotes || 0;
    }
    if (embed.type === 'natinotes') {
      // Somme de toutes les notes déposées, tous joueurs et toutes valeurs confondus
      if (stats.playerRatings) {
        return Object.values(stats.playerRatings).reduce(
          (acc, distribution) => acc + Object.values(distribution || {}).reduce(
            (sum, count) => sum + (typeof count === 'number' ? count : 0), 0
          ), 0
        );
      }
      return 0;
    }
    if (embed.type === 'prono') {
      if (stats.itemVotes) {
        return Object.values(stats.itemVotes).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      }
      return (data.pronoData && data.pronoData.item1 && data.pronoData.item2) 
        ? ((parseInt(data.pronoData.item1.votes) || 0) + (parseInt(data.pronoData.item2.votes) || 0) + (parseInt(data.pronoData.item3?.votes) || 0))
        : 0;
    }
    if (embed.type === 'facts') {
      const ratingStatsObj = stats.ratingStats || embed.ratingStats || {};
      const ratingSum = Object.values(ratingStatsObj).reduce((sum, val) => sum + (Number(val) || 0), 0);
      
      const itemCountersObj = stats.itemCounters || {};
      const itemsSum = Object.values(itemCountersObj).reduce((sum, item) => sum + (Number(item?.votes) || 0), 0);

      const legacyItemsSum = data.factsData?.items && typeof data.factsData.items === 'object'
          ? Object.values(data.factsData.items).reduce((sum, item) => sum + (parseInt(item?.votes) || 0), 0)
          : 0;

      return (stats.reveal || 0) + ratingSum + itemsSum + legacyItemsSum;
    }
    if (embed.type === 'testimony') {
      return stats.msgSent || embed.counterMsgSent || 0;
    }
    if (embed.type === 'folder') {
      if (stats.buttonClicks) {
        return Object.values(stats.buttonClicks).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      }
      return Array.isArray(data.buttons)
        ? data.buttons.reduce((acc, button) => acc + (typeof button?.buttonCounterClicks === 'number' ? button.buttonCounterClicks : 0), 0)
        : 0;
    }
    if (embed.type === 'teaser') {
      return stats.clicks || embed.counterClicks || 0;
    }
    return null;
  };

  const getTooltipText = () => {
    switch (embed.type) {
      case 'poll':
        return "Total des votes";
      case 'tinder':
        return "Total des votes (Oui + Non)";
      case 'quiz':
        return "Nombre de quiz complétés";
      case 'potm':
        return "Nombre total de votes";
      case 'natinotes':
        return "Nombre total de notes données";
      case 'prono':
        return "Total des pronostics";
      case 'facts':
        return "Total des reveals & notes données";
      case 'testimony':
        return "Témoignages soumis";
      case 'folder':
        return "Clics cumulés sur les boutons";
      case 'teaser':
        return "Total des clics sur le teaser";
      default:
        return "";
    }
  };

  const getFormattedCreationDate = () => {
    const timestamp = embed.meta?.timeCreated || embed.timeCreated;
    if (!timestamp) return 'n/a';
    let date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return 'n/a';
    }
    
    if (isNaN(date.getTime())) return 'n/a';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    return `${day}/${month}/${year}`;
  };

  return (
    <li className={`elem-list-item relative h-20 w-full bg-white border-b`}>
      <div className="font-blickb elem-title text-sm text-gray-600 px-4 h-full float-left flex items-center w-4/12">
        {embed.meta?.title || 'Sans titre'}
      </div>
      <div className="icon-container flex items-center w-[10%] px-4 h-full float-left">
        {(() => {
          // Libellé humain et couleur viennent du registre partagé (widgetTypes) ;
          // le badge lui-même est le composant réutilisé par la modale de création.
          const label = WIDGET_TYPES.find((w) => w.type === embed.type)?.label || 'Inconnu';
          return (
            <span className="relative group flex items-center cursor-help">
              <TypeBadge type={embed.type} />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-gray-900/95 backdrop-blur text-white text-[11px] px-2.5 py-1.5 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[999] shadow-lg border border-white/10 pointer-events-none">
                {label}
              </span>
            </span>
          );
        })()}
      </div>
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-[23.33%]">
        {/* Affichage de l'auteur */}
        {embed.meta?.author || embed.author || 'Auteur inconnu'}
      </div>
      {/* <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
          {typeof embed.counterViews === 'number' ? embed.counterViews : 0}
      </div> */}
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
        {/* Affichage de la performance ou du nombre de réponses */}
        {(() => {
          const perf = getPerformanceVal();
          if (perf === null) {
            return <span className="text-gray-400">n/a</span>;
          }
          const tooltip = getTooltipText();
          return (
            <span className="flex items-center relative">
              {perf}
              {tooltip && (
                <span className="tooltip-trigger">
                  ?
                  <span className="tooltip-content">{tooltip}</span>
                </span>
              )}
            </span>
          );
        })()}
      </div>
      <div className="text-sm text-gray-400 px-4 h-full float-left flex items-center w-1/12">
        {/* Affichage de la date de création */}
        {getFormattedCreationDate()}
      </div>

      {devMode && (
        <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
          {/* Affichage du nombre de vues */}
          {typeof embed.stats?.views === 'number' ? embed.stats.views : (typeof embed.counterViews === 'number' ? embed.counterViews : 0)}
        </div>
      )}

      {devMode && (
        <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
          {/* Affichage du rapport performance/counterViews */}
          {(() => {
            const performance = getPerformanceVal();
            if (performance === null) {
              return <span className="text-gray-400">n/a</span>;
            }
            const counterViews = typeof embed.stats?.views === 'number' ? embed.stats.views : (typeof embed.counterViews === 'number' ? embed.counterViews : 0);
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
               className={`w-8 h-8 rounded-md transition-colors duration-300 relative flex items-center justify-center ${
                 isCopied ? 'text-white' : 'hover:bg-gray-100'
               }`}
               style={isCopied ? { backgroundColor: '#22c55e', color: 'white', cursor: 'default' } : {}}
               onClick={isCopied ? null : toggleMenu}
               disabled={isCopied}
             >
                 {isCopied ? (
                   <span className="font-bold text-base leading-none text-white select-none">✓</span>
                 ) : (
                   <img src={iconDotsVertical} alt="Actions" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                 )}
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
                  onClick={handleDeleteClick}
                >
                  <img src={iconTrash} alt="" className="mr-5 w-5 h-5" />
                  Supprimer
                </li>
                {user?.email === 'cesargreppin@gmail.com' && (
                  <li 
                    className="hover:bg-gray-200 cursor-pointer h-12 flex items-center px-4"
                    onClick={handleDeleteForRealClick}
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
      <ConfirmModal 
        isOpen={deleteModalConfig.isOpen && deleteModalConfig.type === 'soft'}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action va déplacer l'élément dans la corbeille."
        onConfirm={performDelete}
        onCancel={() => setDeleteModalConfig({ isOpen: false, type: null })}
        isDestructive={true}
      />
      <ConfirmModal 
        isOpen={deleteModalConfig.isOpen && deleteModalConfig.type === 'hard'}
        title="Suppression définitive"
        message="Supprimer pour de vrai ? Cette action est IRRÉVERSIBLE !"
        onConfirm={performDeleteForReal}
        onCancel={() => setDeleteModalConfig({ isOpen: false, type: null })}
        isDestructive={true}
      />
    </li>
  );
}

export default ListItem;
