import s from './ListItem.module.scss';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase'; // Assurez-vous que le chemin d'importation de db est correct

function ListItem({ embed, iconPoll, iconCalendar, iconCopy, iconEdit, iconTrash }) {
  // Handlers séparés pour chaque action (déclarés AVANT le return)
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
    // TODO: logique d'édition réelle
  };
  const handleDelete = () => {
    console.log('Suppression demandée pour', embed.id);
    // TODO: logique de suppression réelle
    const updateDeletedField = async () => {
        try {
            const docRef = doc(db, 'embeds', embed.id);
            await updateDoc(docRef, { deleted: true });
            console.log('Champ "deleted" mis à FALSE pour', embed.id);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du champ "deleted":', error);
        }
    };

    updateDeletedField();
  };

  return (
    <li className={`${s.elemListItem} relative h-20 w-full bg-white border-b`}>
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
      <div className={`${s.elemListItemActions} relative h-full text-sm text-gray-600 px-4 absolute top-1/2 -translate-y-1/2 flex items-center`}>
        <button id="btn-copy" className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4 ml-auto mr-1" title="Copier l'URL" onClick={handleCopy}>
          <img src={iconCopy} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
        <button className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4 mr-1" title="Éditer" onClick={handleEdit}>
          <img src={iconEdit} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
        <button className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4" title="Supprimer" onClick={handleDelete}>
          <img src={iconTrash} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
      </div>
    </li>
  );
}

export default ListItem;
