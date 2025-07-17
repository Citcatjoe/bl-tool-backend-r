import React, { useState, useCallback } from 'react';
import s from './Form.module.scss';
import PollForm from './PollForm';
import CalendarForm from './CalendarForm';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getAuth } from 'firebase/auth';

function Form({ formVisible, formMode, formType, currentEmbed, onClose }) {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Déterminer le titre selon le mode et le type
  const getFormTitle = () => {
    if (formMode === 'create') {
      return formType === 'poll' ? 'Nouveau sondage' : 'Nouveau calendrier';
    } else if (formMode === 'edit') {
      return formType === 'poll' ? 'Éditer le sondage' : 'Éditer le calendrier';
    }
    return 'Formulaire';
  };

  // Handler pour fermer le formulaire
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Handler pour les changements dans les sous-formulaires (optimisé avec useCallback)
  const handleFormDataChange = useCallback((data) => {
    setFormData(data);
  }, []);

  // Handler pour la sauvegarde
  const handleSave = async () => {
    if (!formData || Object.keys(formData).length === 0) {
      alert('Veuillez remplir les champs requis');
      return;
    }

    setIsLoading(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      let saveData = {};

      // Construction des données selon le type
      if (formData.type === 'poll') {
        // Validation spécifique aux sondages
        if (!formData.pollTxt || !formData.answers || formData.answers.length < 2) {
          alert('Un sondage doit avoir une question et au moins 2 réponses');
          return;
        }

        // Vérifier que les réponses ne sont pas vides
        const validAnswers = formData.answers.filter(answer => answer.answerTxt && answer.answerTxt.trim() !== '');
        if (validAnswers.length < 2) {
          alert('Un sondage doit avoir au moins 2 réponses non vides');
          return;
        }

        saveData = {
          type: 'poll',
          pollTxt: formData.pollTxt,
          answers: formData.answers
            .filter(answer => answer.answerTxt && answer.answerTxt.trim() !== '')
            .map(answer => ({
              answerTxt: answer.answerTxt.trim(),
              answerCounter: formMode === 'edit' ? answer.answerCounter : 0
            })),
          timeCreated: formMode === 'create' ? serverTimestamp() : currentEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };

        // L'auteur et le champ deleted ne sont définis que lors de la création
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
        
      } else if (formData.type === 'calendar') {
        // Validation spécifique aux calendriers
        if (!formData.calName || !formData.dates || formData.dates.length === 0) {
          alert('Un calendrier doit avoir un titre et au moins une date');
          return;
        }

        // Vérifier que toutes les dates ont un texte et une date
        const hasEmptyDates = formData.dates.some(date => !date.text || !date.date);
        if (hasEmptyDates) {
          alert('Toutes les dates doivent avoir un texte et une date');
          return;
        }

        saveData = {
          type: 'calendar',
          calName: formData.calName,
          dates: formData.dates,
          linkGlobalTxt: formData.linkGlobalTxt || '',
          linkGlobalHref: formData.linkGlobalHref || '',
          linkGlobalNewTab: formData.linkGlobalNewTab || false,
          timeCreated: formMode === 'create' ? serverTimestamp() : currentEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };
        
        // L'auteur et le champ deleted ne sont définis que lors de la création
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
      }

      // Sauvegarde selon le mode
      if (formMode === 'create') {
        // Création d'un nouvel élément
        const docRef = await addDoc(collection(db, 'embeds'), saveData);
        console.log('Nouvel élément créé avec ID:', docRef.id);
        alert(`${formData.type === 'poll' ? 'Sondage' : 'Calendrier'} créé avec succès !`);
        
      } else if (formMode === 'edit') {
        // Mise à jour d'un élément existant
        if (!currentEmbed?.id) {
          throw new Error('ID de l\'élément à éditer manquant');
        }
        
        const docRef = doc(db, 'embeds', currentEmbed.id);
        await updateDoc(docRef, saveData);
        console.log('Élément mis à jour:', currentEmbed.id);
        alert(`${formData.type === 'poll' ? 'Sondage' : 'Calendrier'} modifié avec succès !`);
      }
      
      handleClose();
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="form" className={s.form + (formVisible ? ' ' + s.isVisible : '') + ' max-w-3xl w-full h-auto overflow-y-auto fixed top-1/2 left-1/2 bg-white rounded-xl shadow-lg z-40'}>
      <div className="p-6">
        {/* En-tête avec titre et bouton fermer */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{getFormTitle()}</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            title="Fermer"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Debug info (à supprimer plus tard) */}
        {/* <div className="mb-4 p-2 bg-gray-100 text-xs">
          <p>Mode: {formMode}</p>
          <p>Type: {formType}</p>
          <p>ID: {currentEmbed?.id || 'Nouveau'}</p>
        </div> */}

        {/* Contenu du formulaire selon le type */}
        {formType === 'poll' && (
          <PollForm
            currentEmbed={currentEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'calendar' && (
          <CalendarForm
            currentEmbed={currentEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={handleClose}
            className="w-1/2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="w-1/2 btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Form;
