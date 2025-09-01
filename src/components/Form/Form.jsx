import React, { useState, useCallback } from 'react';
import s from './Form.module.scss';
import PollForm from './PollForm';
import CalendarForm from './CalendarForm';
import TeaserForm from './TeaserForm';
import FolderForm from './FolderForm';
import TinderForm from './TinderForm';
import { collection, addDoc, updateDoc, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getAuth } from 'firebase/auth';

function Form({ formVisible, formMode, formType, currentEmbed, onClose, onDataChange, devMode }) {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Déterminer le titre selon le mode et le type
  const getFormTitle = () => {
    if (formMode === 'create') {
      if (formType === 'poll') return 'Nouveau sondage';
      if (formType === 'calendar') return 'Nouveau calendrier';
      if (formType === 'teaser') return 'Nouveau teaser';
      if (formType === 'folder') return 'Nouveau dossier';
      if (formType === 'tinder') return 'Nouveau Tinder';
    } else if (formMode === 'edit') {
      if (formType === 'poll') return 'Éditer le sondage';
      if (formType === 'calendar') return 'Éditer le calendrier';
      if (formType === 'teaser') return 'Éditer le teaser';
      if (formType === 'folder') return 'Éditer le dossier';
      if (formType === 'tinder') return 'Éditer le tinder';
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
        if (!formData.pollTxt || !Array.isArray(formData.answerTxts) || !Array.isArray(formData.answerCounters) || formData.answerTxts.length < 2) {
          alert('Un sondage doit avoir une question et au moins 2 réponses');
          return;
        }

        // Vérifier que les réponses ne sont pas vides
        const validTxts = formData.answerTxts.filter(txt => txt && txt.trim() !== '');
        if (validTxts.length < 2) {
          alert('Un sondage doit avoir au moins 2 réponses non vides');
          return;
        }

        // Filtrer les compteurs en fonction des réponses valides
        const filteredTxts = [];
        const filteredCounters = [];
        formData.answerTxts.forEach((txt, i) => {
          if (txt && txt.trim() !== '') {
            filteredTxts.push(txt.trim());
            filteredCounters.push(formData.answerCounters[i] ?? 0);
          }
        });

        saveData = {
          type: 'poll',
          pollTxt: formData.pollTxt,
          answerTxts: filteredTxts,
          answerCounters: filteredCounters,
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
        
      } else if (formData.type === 'teaser') {
        // Validation spécifique aux teasers
        if (!formData.teaserLabel || !formData.teaserTitle) {
          alert('Un teaser doit avoir un label et un titre');
          return;
        }

        saveData = {
          type: 'teaser',
          teaserLabel: formData.teaserLabel,
          teaserTitle: formData.teaserTitle,
          linkGlobalTxt: formData.linkGlobalTxt || '',
          linkGlobalHref: formData.linkGlobalHref || '',
          linkGlobalNewTab: formData.linkGlobalNewTab || false,
          img: formData.img || '',
          timeCreated: formMode === 'create' ? serverTimestamp() : currentEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };
        
        // L'auteur et le champ deleted ne sont définis que lors de la création
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
        
      } else if (formData.type === 'folder') {
        // Validation spécifique aux dossiers
        if (!formData.folderName || !formData.folderLabel) {
          alert('Un dossier doit avoir un nom et un label');
          return;
        }

        // Vérifier qu'il y a au moins un bouton avec texte et URL
        if (!formData.buttons || formData.buttons.length === 0) {
          alert('Un dossier doit avoir au moins un bouton');
          return;
        }

        const validButtons = formData.buttons.filter(button => button.buttonTxt && button.buttonTxt.trim() !== '' && button.buttonUrl && button.buttonUrl.trim() !== '');
        if (validButtons.length === 0) {
          alert('Un dossier doit avoir au moins un bouton avec un texte et une URL');
          return;
        }

        saveData = {
          type: 'folder',
          folderName: formData.folderName,
          folderLabel: formData.folderLabel,
          folderLabelColor: formData.folderLabelColor || 'bg-brand',
          img: formData.img || '',
          buttons: validButtons.map(button => ({
            buttonTxt: button.buttonTxt.trim(),
            buttonUrl: button.buttonUrl.trim(),
            buttonOpensNewTab: button.buttonOpensNewTab || false,
            buttonCounterClicks: 0
          })),
          timeCreated: formMode === 'create' ? serverTimestamp() : currentEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };
        
        // L'auteur et le champ deleted ne sont définis que lors de la création
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
      } else if (formData.type === 'tinder') {
        // Validation spécifique aux tinder
        if (!formData.tinderLabel || !formData.tinderTitle) {
          alert('Un Tinder doit avoir un label et un titre');
          return;
        }
        if (!formData.tinderCards || formData.tinderCards.length < 1) {
          alert('Un Tinder doit avoir au moins une carte');
          return;
        }
        if (formData.tinderCards.length > 3) {
          alert('Un Tinder ne peut pas avoir plus de 3 cartes');
          return;
        }
        // Vérifier que chaque carte a un label et un titre
        const validCards = formData.tinderCards.filter(card => card.tinderCardLabel && card.tinderCardTitle);
        if (validCards.length !== formData.tinderCards.length) {
          alert('Chaque carte doit avoir un label et un titre');
          return;
        }
        // Légende
        const legend = formData.tinderLegend || { txt: '', display: true };

        saveData = {
          type: 'tinder',
          tinderLabel: formData.tinderLabel,
          tinderTitle: formData.tinderTitle,
          tinderCards: formData.tinderCards.map(card => ({
            tinderCardLabel: card.tinderCardLabel,
            tinderCardTitle: card.tinderCardTitle
          })),
          tinderVotes: formData.tinderVotes,
          tinderLegend: {
            txt: legend.txt || '',
            display: legend.display ?? true,
          },
          counterViews: formMode === 'create' ? 0 : (formData.counterViews ?? 0),
          timeCreated: formMode === 'create' ? serverTimestamp() : currentEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };
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
        
        let successMessage = 'Élément créé avec succès !';
        if (formData.type === 'poll') successMessage = 'Sondage créé avec succès !';
        else if (formData.type === 'calendar') successMessage = 'Calendrier créé avec succès !';
        else if (formData.type === 'teaser') successMessage = 'Teaser créé avec succès !';
        else if (formData.type === 'folder') successMessage = 'Dossier créé avec succès !';
        else if (formData.type === 'tinder') successMessage = 'Tinder créé avec succès !';
        
        alert(successMessage);
        
        // Déclencher un rafraîchissement des données si en mode non temps réel
        if (onDataChange) {
          onDataChange();
        }
        
      } else if (formMode === 'edit') {
        // Mise à jour d'un élément existant
        if (!currentEmbed?.id) {
          throw new Error('ID de l\'élément à éditer manquant');
        }
        
        const docRef = doc(db, 'embeds', currentEmbed.id);
        
        // Pour les dossiers, utiliser une transaction pour préserver buttonCounterClicks
        if (formData.type === 'folder') {
          await runTransaction(db, async (transaction) => {
            // Lire le document actuel
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error('Le document n\'existe pas');
            }
            
            const currentData = currentDoc.data();
            const currentButtons = currentData.buttons || [];
            
            // Fusionner les nouveaux boutons avec les compteurs existants
            // Stratégie d'identification : priorité à l'URL, puis combinaison URL+texte
            const mergedButtons = saveData.buttons.map((newButton) => {
              // Chercher d'abord par URL + texte exact
              let existingButton = currentButtons.find(existing => 
                existing.buttonUrl === newButton.buttonUrl && 
                existing.buttonTxt === newButton.buttonTxt
              );
              
              // Si pas trouvé, chercher par URL seulement (cas de correction de texte)
              if (!existingButton) {
                existingButton = currentButtons.find(existing => 
                  existing.buttonUrl === newButton.buttonUrl
                );
                
                // Marquer ce bouton comme "utilisé" pour éviter les doublons
                if (existingButton) {
                  const existingIndex = currentButtons.indexOf(existingButton);
                  currentButtons.splice(existingIndex, 1);
                }
              }
              
              return {
                ...newButton,
                // Préserver buttonCounterClicks s'il existe, sinon initialiser à 0
                buttonCounterClicks: existingButton?.buttonCounterClicks || 0
              };
            });
            
            // Mettre à jour saveData avec les boutons fusionnés
            const updatedSaveData = {
              ...saveData,
              buttons: mergedButtons
            };
            
            // Effectuer la mise à jour transactionnelle
            transaction.update(docRef, updatedSaveData);
          });
          console.log('Dossier mis à jour avec transaction:', currentEmbed.id);
        } else {
          // Pour les autres types, mise à jour classique
          await updateDoc(docRef, saveData);
          console.log('Élément mis à jour:', currentEmbed.id);
        }
        
        let successMessage = 'Élément modifié avec succès !';
        if (formData.type === 'poll') successMessage = 'Sondage modifié avec succès !';
        else if (formData.type === 'calendar') successMessage = 'Calendrier modifié avec succès !';
        else if (formData.type === 'teaser') successMessage = 'Teaser modifié avec succès !';
        else if (formData.type === 'folder') successMessage = 'Dossier modifié avec succès !';
        else if (formData.type === 'tinder') successMessage = 'Tinder modifié avec succès !';
        
        alert(successMessage);
        
        // Déclencher un rafraîchissement des données si en mode non temps réel
        if (onDataChange) {
          onDataChange();
        }
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

        {/* Debug info (visible uniquement en mode développeur) */}
        {devMode && (
          <div className="mb-4 p-2 bg-gray-100 text-xs">
            <p>Mode: {formMode}</p>
            <p>Type: {formType}</p>
            <p>ID: {currentEmbed?.id || 'Nouveau'}</p>
          </div>
        )}

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

        {formType === 'teaser' && (
          <TeaserForm
            currentEmbed={currentEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'folder' && (
          <FolderForm
            currentEmbed={currentEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'tinder' && (
          <TinderForm
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
