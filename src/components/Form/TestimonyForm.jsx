import React, { useState, useEffect } from 'react';

function TestimonyForm({ currentEmbed, formMode, onChange }) {
  // État du formulaire
  const [contentTitle, setContentTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [timeExpires, setTimeExpires] = useState('');
  // Brand & theme (rubrique)
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

  // Initialisation en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setContentTitle(currentEmbed.content?.title || '');
      setSubject(currentEmbed.content?.subject || '');
      setQuestion(currentEmbed.content?.question || '');
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);
      
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
      title: contentTitle, // On utilise contentTitle comme titre pour l'affichage dans la liste
      brand,
      theme,
      content: {
        title: contentTitle,
        subject,
        question,
        timeExpires
      }
    });
  }, [contentTitle, brand, theme, subject, question, timeExpires, onChange]);

  return (
    <div className="space-y-6">
      {/* Brand choice & Rubrique */}
      <div className="flex gap-6 items-start">
        {/* Brand */}
        <div className="flex-none w-44">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand
          </label>
          <div className="flex gap-4 items-center h-12">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="brand"
                value="blick"
                checked={brand === 'blick'}
                onChange={() => setBrand('blick')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Blick</span>
            </label>
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module d'appel à témoignage n'est pas encore compatible avec la brand PME.">
              <input
                type="radio"
                name="brand"
                value="pme"
                checked={brand === 'pme'}
                onChange={() => setBrand('pme')}
                disabled
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-not-allowed"
              />
              <span className="text-sm text-gray-400">Pme</span>
            </label>
          </div>
        </div>

        {/* Rubrique */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rubrique *
          </label>
          <select
            value={theme || ''}
            onChange={(e) => setTheme(e.target.value || null)}
            className={`field mb-0 w-full px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer ${!theme ? 'text-gray-400' : 'text-gray-700'
              }`}
            required
          >
            <option value="" disabled hidden>Sélectionner...</option>
            <option value="Suisse" className="text-gray-700">Suisse</option>
            <option value="Inter" className="text-gray-700">Inter</option>
            <option value="Sport" className="text-gray-700">Sport</option>
          </select>
        </div>
      </div>

      <div className="py-2">
        <hr className="border-gray-200" />
      </div>

      {/* Titre de l'appel à témoignage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre de l'appel à témoignage *
        </label>
        <input
          type="text"
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={contentTitle}
          onChange={e => setContentTitle(e.target.value)}
          placeholder="Témoignages sur l'expérience utilisateur..."
          required
        />
      </div>

      {/* Sujet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sujet *
        </label>
        <input
          type="text"
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Retour d'expérience produit"
          required
        />
      </div>

      {/* Question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question posée *
        </label>
        <textarea
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y bg-white"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Pouvez-vous nous partager votre expérience avec notre produit ? Qu'est-ce qui a le mieux fonctionné pour vous ?"
          required
        />
      </div>

      {/* Date d'expiration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date limite de réponse
        </label>
        <input
          type="datetime-local"
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={timeExpires}
          onChange={e => setTimeExpires(e.target.value)}
        />
        <p className="text-sm text-gray-500 mt-1">
          Optionnel - Définit une date limite pour recevoir les témoignages
        </p>
      </div>
    </div>
  );
}

export default TestimonyForm;