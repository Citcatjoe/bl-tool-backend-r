import s from './PollListItem.module.scss';

function PollListItem({ embed, iconPoll, iconCopy, iconEdit, iconTrash }) {
  return (
    <li className={`${s.poll} elem-list-item relative h-20 w-full bg-white border-b`}>
      <div className="font-blickb elem-title text-sm text-gray-600 px-4 h-full float-left flex items-center w-4/12">
        {embed.pollTxt || 'Titre du sondage'}
      </div>
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
        <img src={iconPoll} alt="card-type" />
      </div>
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-3/12">
        {embed.author || 'Auteur inconnu'}
      </div>
      <div className="text-sm text-gray-600 px-4 h-full float-left flex items-center w-1/12">
        {Array.isArray(embed.answers)
          ? embed.answers.reduce((acc, a) => acc + (a.answerCounter || 0), 0)
          : 0}
      </div>
      <div className="menu-actions relative h-full text-sm text-gray-600 px-4 absolute top-1/2 -translate-y-1/2 flex items-center">
        <button className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4 ml-auto mr-1" title="Copier l'URL" onClick={() => {/* handleCopy(embed.id) */}}>
          <img src={iconCopy} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
        <button className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4 mr-1" title="Éditer" onClick={() => {/* handleEdit(embed.id) */}}>
          <img src={iconEdit} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
        <button className="hover:bg-gray-200 relative btn-white aspect-square h-8 rounded-md px-4" title="Supprimer" onClick={() => {/* handleDelete(embed.id) */}}>
          <img src={iconTrash} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </button>
      </div>
    </li>
  );
}

export default PollListItem;
