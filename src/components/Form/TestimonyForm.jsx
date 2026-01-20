import React, { useState, useEffect } from 'react';

function TestimonyForm({ currentEmbed, formMode, onChange }) {
  // État du formulaire
  const [title, setTitle] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [timeExpires, setTimeExpires] = useState('');

  // Initialisation en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setTitle(currentEmbed.title || '');
      setContentTitle(currentEmbed.content?.title || '');
      setSubject(currentEmbed.content?.subject || '');
      setQuestion(currentEmbed.content?.question || '');
      
      // Conversion du Timestamp Firebase en string datetime-local
      let timeExpiresValue = '';
      if (currentEmbed.content?.timeExpires) {
        try {
          // Si c'est un Timestamp Firebase, le convertir en Date puis en string datetime-local
          let dateObj;
          if (currentEmbed.content.timeExpires.toDate) {
            // C'est un Timestamp Firebase
            dateObj = currentEmbed.content.timeExpires.toDate();
          } else if (currentEmbed.content.timeExpires instanceof Date) {
            // C'est déjà un objet Date
            dateObj = currentEmbed.content.timeExpires;
          } else if (typeof currentEmbed.content.timeExpires === 'string') {
            // C'est une string, la parser
            dateObj = new Date(currentEmbed.content.timeExpires);
          }
          
          if (dateObj && !isNaN(dateObj.getTime())) {
            // Convertir en format datetime-local (YYYY-MM-DDTHH:mm)
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            timeExpiresValue = `${year}-${month}-${day}T${hours}:${minutes}`;
          }
        } catch (error) {
          console.warn('Erreur lors de la conversion de timeExpires:', error);
        }
      }
      
      setTimeExpires(timeExpiresValue);
    }
  }, [formMode, currentEmbed]);

  // Remonter la donnée au parent
  useEffect(() => {
    onChange({
      type: 'testimony',
      title,
      content: {
        title: contentTitle,
        subject,
        question,
        timeExpires
      }
    });
  }, [title, contentTitle, subject, question, timeExpires, onChange]);

  return (
    <form className="space-y-4">
      {/* Titre de l'élément */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Titre de l'élément (uniquement pour affichage de liste) *
        </label>
        <input
          type="text"
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Appel à témoignage sur..."
          required
        />
      </div>
        
      {/* Section contenu */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-3'>Contenu de l'élément embed</label>
            <div className='border border-gray-300 rounded-md p-4 bg-gray-50'>

        
               
                <div className='mb-4'>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Titre de l'appel à témoignage *
                    </label>
                    <input
                        type="text"
                        className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contentTitle}
                        onChange={e => setContentTitle(e.target.value)}
                        placeholder="Ex: Témoignages sur l'expérience utilisateur..."
                        required
                    />
                </div>

                {/* Sujet */}
                <div className='mb-4'>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Sujet *
                    </label>
                    <input
                        type="text"
                        className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Ex: Retour d'expérience produit"
                        required
                    />
                </div>

                    {/* Question */}
                <div className='mb-4'>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Question posée *
                    </label>
                    <textarea
                        className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="Ex: Pouvez-vous nous partager votre expérience avec notre produit ? Qu'est-ce qui a le mieux fonctionné pour vous ?"
                        required
                    />
                </div>

                    {/* Date d'expiration */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Date limite de réponse
                    </label>
                    <input
                        type="datetime-local"
                        className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={timeExpires}
                        onChange={e => setTimeExpires(e.target.value)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Optionnel - Définit une date limite pour recevoir les témoignages
                    </p>
                </div>
        </div>
      </div>
    </form>
  );
}

export default TestimonyForm;