import s from './ListItem.module.scss';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@rms/services'; // Assurez-vous que le chemin d'importation de db est correct
import { buildEmbedUrl, DEFAULT_CLIENT_BASE_URL } from '@rms/widget-model';
import { useState, useRef, useEffect } from 'react';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import TypeBadge from '../TypeBadge';

// Pictogrammes du menu d'actions (trait 2px, grille 24px). Couleur via `currentColor`.
const MENU_ICONS = {
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  edit: <><path d="M12 20h8" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" /></>,
  download: <><path d="M12 4v12" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /><path d="M10 11l4 4M14 11l-4 4" /></>,
  dots: <><circle cx="12" cy="5" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="12" cy="19" r="1.2" /></>,
};

function MenuIcon({ name, className = '' }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-none block ${className}`}>
      {MENU_ICONS[name]}
    </svg>
  );
}

const MENU_ITEM = 'flex items-center gap-3 min-h-[44px] px-4 rounded-[8px] text-[15px] leading-5 font-medium text-ink whitespace-nowrap hover:bg-ground cursor-pointer';

function ListItem({ embed, iconPoll, iconCalendar, iconTeaser, iconFolder, iconTinder, iconQuiz, iconTestimony, iconJersey, iconProno, iconStar, onEdit, onDataChange, user, devMode }) {
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
    const clientBaseUrl = import.meta.env.VITE_CLIENT_BASE_URL || DEFAULT_CLIENT_BASE_URL;
    if (embed.type === 'poll') {
      url = `${clientBaseUrl}poll/?pollDoc=${embed.id}&postMode=true`;
    } else {
      console.warn('Type d\'embed non supporté pour la vue sociale:', embed.type);
      return;
    }
    window.open(url, '_blank');
    console.log('Vue sociale ouverte:', url);
  };

  const handleCopy = () => {
    // Base URL pilotée par l'environnement actif (.env-test / .env-prod),
    // pour que le lien copié pointe vers la même Firestore que le backend
    // qui l'a généré. Fallback prod si la variable n'est pas définie.
    // Même règle que l'embedUrl renvoyée par l'API (@rms/widget-model).
    const clientBaseUrl = import.meta.env.VITE_CLIENT_BASE_URL || DEFAULT_CLIENT_BASE_URL;
    const url = buildEmbedUrl({ type: embed.type || 'unknown', id: embed.id, brand: embed.brand }, clientBaseUrl);

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
    <li className="elem-list-item relative flex items-center w-full border-b border-line last:border-b-0 text-ink">
      <div className="row-title elem-title text-ink px-5 py-[18px] w-[29%]">
        <span className="line-clamp-2">{embed.meta?.title || 'Sans titre'}</span>
      </div>
      <div className="icon-container flex items-center w-[19%] px-5 py-[18px]">
        <TypeBadge type={embed.type} />
      </div>
      <div className="text-sm leading-5 text-muted px-5 py-[18px] w-[17.33%] min-w-0">
        {/* Affichage de l'auteur */}
        <span className="block truncate" title={embed.meta?.author || embed.author || undefined}>
          {embed.meta?.author || embed.author || 'Auteur inconnu'}
        </span>
      </div>
      {/* <div className="text-sm text-muted px-5 py-[18px] w-1/12">
          {typeof embed.counterViews === 'number' ? embed.counterViews : 0}
      </div> */}
      <div className="text-sm leading-5 font-semibold text-ink px-5 py-[18px] w-[9%]">
        {/* Affichage de la performance ou du nombre de réponses */}
        {(() => {
          const perf = getPerformanceVal();
          if (perf === null) {
            return <span className="font-normal text-muted">n/a</span>;
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
      <div className="text-sm leading-5 text-muted px-5 py-[18px] w-[9%] whitespace-nowrap">
        {/* Affichage de la date de création */}
        {getFormattedCreationDate()}
      </div>

      {devMode && (
        <div className="text-sm leading-5 text-muted px-5 py-[18px] w-1/12">
          {/* Affichage du nombre de vues */}
          {typeof embed.stats?.views === 'number' ? embed.stats.views : (typeof embed.counterViews === 'number' ? embed.counterViews : 0)}
        </div>
      )}

      {devMode && (
        <div className="text-sm leading-5 text-muted px-5 py-[18px] w-1/12">
          {/* Affichage du rapport performance/counterViews */}
          {(() => {
            const performance = getPerformanceVal();
            if (performance === null) {
              return <span className="text-muted">n/a</span>;
            }
            const counterViews = typeof embed.stats?.views === 'number' ? embed.stats.views : (typeof embed.counterViews === 'number' ? embed.counterViews : 0);
            if (counterViews === 0) {
              return <span className="text-muted">n/a</span>;
            }
            
            const ratio = ((performance / counterViews) * 100).toFixed(1);
            return `${ratio}%`;
          })()}
        </div>
      )}
     
            <div id="menu-actions" className="absolute right-3 items-center flex justify-center top-1/2 -translate-y-1/2" ref={menuRef}>
             <button 
               id="menu-actions-btn" 
               type="button"
               aria-label={`Actions pour ${embed.meta?.title || 'Sans titre'}`}
               aria-haspopup="menu"
               aria-expanded={isMenuVisible}
               className={`w-11 h-11 rounded-pill transition-colors duration-300 relative flex items-center justify-center ${
                 isCopied ? 'text-white' : (isMenuVisible ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-ground')
               }`}
               style={isCopied ? { backgroundColor: '#22c55e', color: 'white', cursor: 'default' } : {}}
               onClick={isCopied ? null : toggleMenu}
               disabled={isCopied}
             >
                 {isCopied ? (
                   <span className="font-bold text-base leading-none text-white select-none">✓</span>
                 ) : (
                   <MenuIcon name="dots" />
                 )}
             </button>
            <ul 
              id="menu-actions-items" 
              className={`absolute flex flex-col w-max min-w-[220px] p-2 bg-surface border border-line rounded-lg shadow-pop bottom-0 right-12 z-10 ${isMenuVisible ? 'isVisible' : ''}`}
            >
                {/* Vue RS seulement pour les polls */}
                {embed.type === 'poll' && (
                  <li 
                    className={MENU_ITEM}
                    onClick={() => {
                      handleSocialView();
                      setIsMenuVisible(false);
                    }}
                  >
                    <MenuIcon name="eye" />
                    Vue RS
                  </li>
                )}
                {embed.type === 'testimony' && (
                  <li 
                    className={MENU_ITEM}
                    onClick={() => {
                      handleDownloadMessages();
                      setIsMenuVisible(false);
                    }}
                  >
                    <MenuIcon name="download" />
                    Télécharger messages
                  </li>
                )}
                <li 
                  className={MENU_ITEM}
                  onClick={() => {
                    handleCopy();
                    setIsMenuVisible(false);
                  }}
                >
                  <MenuIcon name="copy" />
                  Copier l'URL
                </li>
                {user?.email === 'cesargreppin@gmail.com' && (
                  <li 
                    className={MENU_ITEM}
                    onClick={() => {
                      handleCopyId();
                      setIsMenuVisible(false);
                    }}
                  >
                    <MenuIcon name="copy" />
                    Copier l'ID
                  </li>
                )}
                <li 
                  className={MENU_ITEM}
                  onClick={() => {
                    handleEdit();
                    setIsMenuVisible(false);
                  }}
                >
                  <MenuIcon name="edit" />
                  Éditer
                </li>
                <li role="separator" aria-hidden="true" className="h-px my-1.5 mx-2 bg-line" />
                <li 
                  className={MENU_ITEM}
                  onClick={handleDeleteClick}
                >
                  <MenuIcon name="trash" className="text-accent" />
                  Supprimer
                </li>
                {user?.email === 'cesargreppin@gmail.com' && (
                  <li 
                    className={MENU_ITEM}
                    onClick={handleDeleteForRealClick}
                  >
                    <MenuIcon name="trash" className="text-accent" />
                    Supprimer pour de vrai
                  </li>
                )}
                {/* <li 
                  id="menu-action-modify-this-poll-data" 
                  className="hover:bg-ground cursor-pointer h-12 flex items-center px-4"
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
