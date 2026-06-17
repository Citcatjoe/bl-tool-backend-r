import React, { useState, useCallback } from 'react';
import s from './Form.module.scss';
import PollForm from './PollForm';
import CalendarForm from './CalendarForm';
import TeaserForm from './TeaserForm';
import FolderForm from './FolderForm';
import TinderForm from './TinderForm';
import QuizForm from './QuizForm';
import TestimonyForm from './TestimonyForm';
import PotmForm from './PotmForm';
import PronoForm from './PronoForm';
import FactsForm from './FactsForm';
import { collection, addDoc, updateDoc, doc, serverTimestamp, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getAuth } from 'firebase/auth';

function Form({ formVisible, formMode, formType, currentEmbed, onClose, onDataChange, devMode }) {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Déterminer le titre selon le mode et le type
  const getFormTitle = () => {
    if (formMode === 'create') {
      if (formType === 'poll') return 'Nouveau sondage';
      if (formType === 'calendar') return 'Nouveau calendrier';
      if (formType === 'teaser') return 'Nouveau teaser';
      if (formType === 'folder') return 'Nouveau dossier';
      if (formType === 'tinder') return 'Nouveau Tinder';
      if (formType === 'quiz') return 'Nouveau quiz';
      if (formType === 'testimony') return 'Nouvel appel à témoignage';
      if (formType === 'potm') return 'Nouveau·elle joueur·euse du match';
      if (formType === 'prono') return 'Nouveau pronostic';
      if (formType === 'facts') return 'Nouveaux faits marquants';
    } else if (formMode === 'edit') {
      if (formType === 'poll') return 'Éditer le sondage';
      if (formType === 'calendar') return 'Éditer le calendrier';
      if (formType === 'teaser') return 'Éditer le teaser';
      if (formType === 'folder') return 'Éditer le dossier';
      if (formType === 'tinder') return 'Éditer le tinder';
      if (formType === 'quiz') return 'Éditer le quiz';
      if (formType === 'testimony') return 'Éditer l\'appel à témoignage';
      if (formType === 'potm') return 'Éditer le/la joueur·euse du match';
      if (formType === 'prono') return 'Éditer le pronostic';
      if (formType === 'facts') return 'Éditer les faits marquants';
    }
    return 'Formulaire';
  };

  // Handler pour fermer le formulaire
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    // Retarder la remise à zéro des états pour que le fondu de fermeture (150ms) soit achevé
    setTimeout(() => {
      setErrorMessage('');
      setIsSuccess(false);
    }, 300);
  };

  // Handler pour les changements dans les sous-formulaires (optimisé avec useCallback)
  const handleFormDataChange = useCallback((data) => {
    setFormData(data);
  }, []);

  // Handler pour la sauvegarde
  const handleSave = async () => {
    setErrorMessage('');
    setIsSuccess(false);

    // Effacer toutes les surbrillances rouges existantes dans le DOM
    const formElement = document.getElementById('form');
    if (formElement) {
      formElement.querySelectorAll('.text-red-600').forEach(el => {
        el.classList.remove('text-red-600', 'font-bold');
        el.classList.add('text-gray-700');
      });
      formElement.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500', 'focus:ring-red-500');
        el.classList.add('border-gray-300', 'focus:ring-blue-500');
      });
    }

    const triggerValidationError = (labelText, inputSelector = 'input, textarea, select') => {
      setIsLoading(false);
      
      if (!formElement || !labelText) return;

      // Recherche du label par son texte
      const labels = Array.from(formElement.querySelectorAll('label, h3, h4'));
      const targetLabel = labels.find(label => {
        const text = label.textContent.toLowerCase();
        return text.includes(labelText.toLowerCase());
      });

      if (targetLabel) {
        // Appliquer la couleur rouge au label
        targetLabel.classList.remove('text-gray-700', 'text-gray-500');
        targetLabel.classList.add('text-red-600', 'font-bold');
        
        // Appliquer la bordure rouge au champ de saisie associé
        const parentDiv = targetLabel.closest('div');
        if (parentDiv) {
          const input = parentDiv.querySelector(inputSelector);
          if (input) {
            input.classList.remove('border-gray-300', 'focus:ring-blue-500');
            input.classList.add('border-red-500', 'focus:ring-red-500');
            input.focus();
          }
        }
        
        // Défilement fluide vers le label problématique
        targetLabel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    if (!formData || Object.keys(formData).length === 0) {
      triggerValidationError('Question');
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
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }
        if (!formData.pollTxt) {
          triggerValidationError('Question du sondage');
          return;
        }
        if (!Array.isArray(formData.answerTxts) || formData.answerTxts.length < 2) {
          triggerValidationError('Réponses possibles');
          return;
        }

        // Vérifier que les réponses ne sont pas vides
        const validTxts = formData.answerTxts.filter(txt => txt && txt.trim() !== '');
        if (validTxts.length < 2) {
          triggerValidationError('Réponses possibles');
          return;
        }

        // Filtrer les compteurs en fonction des réponses valides
        const filteredTxts = [];
        const filteredCounters = [];
        const filteredOriginalTxts = [];
        formData.answerTxts.forEach((txt, i) => {
          if (txt && txt.trim() !== '') {
            filteredTxts.push(txt.trim());
            filteredCounters.push(formData.answerCounters[i] ?? 0);
            filteredOriginalTxts.push(formData.answerOriginalTxts?.[i] ?? '');
          }
        });

        saveData = {
          type: 'poll',
          pollTxt: formData.pollTxt,
          answerTxts: filteredTxts,
          answerCounters: filteredCounters,
          brand: formData.brand || 'blick',
          theme: formData.theme,
          timeCreated: formMode === 'create' ? serverTimestamp() : currentEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };

        if (formMode === 'edit') {
          saveData.answerOriginalTxts = filteredOriginalTxts;
        }

        // L'auteur et le champ deleted ne sont définis que lors de la création
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
        
      } else if (formData.type === 'calendar') {
        // Validation spécifique aux calendriers
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }
        if (!formData.calName) {
          triggerValidationError('Wording du calendrier');
          return;
        }
        if (!formData.dates || formData.dates.length === 0) {
          triggerValidationError('Dates');
          return;
        }

        // Vérifier que toutes les dates ont un texte et une date de début
        // Et si showBadge est true, une date de fin est requise
        const hasInvalidDates = formData.dates.some(date => {
          if (!date.text || !date.date) return true;
          if (date.showBadge && !date.endDate) return true;
          return false;
        });

        if (hasInvalidDates) {
          triggerValidationError('Dates');
          return;
        }

        // Vérifier que si liveLinkEnabled est true, liveLinkUrl est rempli
        const hasInvalidLiveLinks = formData.dates.some(date => date.liveLinkEnabled && (!date.liveLinkUrl || date.liveLinkUrl.trim() === ''));
        if (hasInvalidLiveLinks) {
          triggerValidationError('Dates');
          return;
        }

        // Vérifier que linkGlobalTxt et linkGlobalHref sont mutuellement inclusifs
        if (formData.linkGlobalTxt && !formData.linkGlobalHref) {
          triggerValidationError('Url du lien global');
          return;
        }
        if (!formData.linkGlobalTxt && formData.linkGlobalHref) {
          triggerValidationError('Texte de lien global');
          return;
        }

        const datesToSave = formData.dates.map(d => {
           let scheduleStart = null;
           let scheduleEnd = null;

           if (d.date) {
             const startDateObj = new Date(d.date);
             if (!isNaN(startDateObj.getTime())) {
               scheduleStart = Timestamp.fromDate(startDateObj);
             }
           }

           if (d.endDate) {
             const endDateObj = new Date(d.endDate);
             if (!isNaN(endDateObj.getTime())) {
               scheduleEnd = Timestamp.fromDate(endDateObj);
             }
           }
           
           return {
             text: d.text,
             scheduleStart: scheduleStart,
             scheduleEnd: scheduleEnd,
             showBadge: d.showBadge || false,
             liveLinkExists: d.liveLinkEnabled || false,
             liveLinkUrl: d.liveLinkEnabled ? d.liveLinkUrl : ''
           };
        });

        saveData = {
          type: 'calendar',
          calName: formData.calName,
          calWording: formData.calWording || '', // Keeping as optional per implementation plan notes
          nbElemsToShow: formData.nbElements === 'tous' ? 100 : (formData.nbElements || 100),
          dates: datesToSave,
          linkGlobalTxt: formData.linkGlobalTxt || '',
          linkGlobalHref: formData.linkGlobalHref || '',
          linkGlobalNewTab: formData.linkGlobalNewTab || false,
          brand: formData.brand || 'blick',
          theme: formData.theme,
          timeCreated: formMode === 'create' ? serverTimestamp() : currentEmbed.timeCreated,
          timeUpdated: serverTimestamp(),
          counterSeeAllClicks: formMode === 'create' ? 0 : (currentEmbed?.counterSeeAllClicks || 0),
          counterViews: formMode === 'create' ? 0 : (currentEmbed?.counterViews || 0),
        };
        
        // L'auteur et le champ deleted ne sont définis que lors de la création
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
        
      } else if (formData.type === 'teaser') {
        // Validation spécifique aux teasers
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }
        if (!formData.teaserLabel) {
          triggerValidationError('Label du teaser');
          return;
        }
        if (!formData.teaserTitle) {
          triggerValidationError('Titre du teaser');
          return;
        }
        if (!formData.img) {
          triggerValidationError('Image');
          return;
        }
        if (!formData.linkGlobalTxt) {
          triggerValidationError('Label du bouton');
          return;
        }
        if (!formData.linkGlobalHref) {
          triggerValidationError('Lien du bouton');
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
          brand: formData.brand || 'blick',
          theme: formData.theme,
          timeCreated: formMode === 'create' ? serverTimestamp() : currentEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };
        
        // L'auteur et le champ deleted ne sont définis que lors de la création
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
          saveData.counterViews = 0;
          saveData.counterClicks = 0;
        }
        
      } else if (formData.type === 'folder') {
        // Validation spécifique aux dossiers
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }
        if (!formData.folderName) {
          triggerValidationError('Nom du dossier');
          return;
        }
        if (!formData.folderLabel) {
          triggerValidationError('Label du dossier');
          return;
        }

        // Vérifier qu'il y a au moins un bouton avec texte et URL
        if (!formData.buttons || formData.buttons.length === 0) {
          triggerValidationError('Texte du bouton #1');
          return;
        }

        // Vérifier les erreurs de champs incomplets (texte renseigné mais pas URL, ou inversement)
        for (let i = 0; i < formData.buttons.length; i++) {
          const btn = formData.buttons[i];
          const hasTxt = btn.buttonTxt && btn.buttonTxt.trim() !== '';
          const hasUrl = btn.buttonUrl && btn.buttonUrl.trim() !== '';
          
          if (hasTxt && !hasUrl) {
            triggerValidationError(`Url du bouton #${i + 1}`);
            return;
          }
          if (!hasTxt && hasUrl) {
            triggerValidationError(`Texte du bouton #${i + 1}`);
            return;
          }
        }

        const validButtons = formData.buttons.filter(button => button.buttonTxt && button.buttonTxt.trim() !== '' && button.buttonUrl && button.buttonUrl.trim() !== '');
        if (validButtons.length === 0) {
          triggerValidationError('Texte du bouton #1');
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
          brand: formData.brand || 'blick',
          theme: formData.theme,
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
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }
        if (!formData.tinderLabel || formData.tinderLabel.trim() === '') {
          triggerValidationError('Label du Tinder');
          return;
        }
        if (!formData.tinderTitle || formData.tinderTitle.trim() === '') {
          triggerValidationError('Titre du Tinder');
          return;
        }
        if (!formData.tinderCards || formData.tinderCards.length < 1) {
          triggerValidationError('Label de la carte #1');
          return;
        }
        if (formData.tinderCards.length > 3) {
          triggerValidationError('Label de la carte #1');
          return;
        }
        // Vérifier que chaque carte a un label et un titre
        for (let i = 0; i < formData.tinderCards.length; i++) {
          const card = formData.tinderCards[i];
          const hasLabel = card.tinderCardLabel && card.tinderCardLabel.trim() !== '';
          const hasTitle = card.tinderCardTitle && card.tinderCardTitle.trim() !== '';
          
          if (!hasLabel) {
            triggerValidationError(`Label de la carte #${i + 1}`);
            return;
          }
          if (!hasTitle) {
            triggerValidationError(`Titre de la carte #${i + 1}`);
            return;
          }
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
          brand: formData.brand || 'blick',
          theme: formData.theme,
          counterViews: formMode === 'create' ? 0 : (formData.counterViews ?? 0),
          timeCreated: formMode === 'create' ? serverTimestamp() : currentEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
      } else if (formData.type === 'quiz') {
        // Validation spécifique aux quiz
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }
        // Validation minimale
        if (!formData.title || formData.title.trim() === '') {
          triggerValidationError('Titre du quiz');
          return;
        }

        if (!formData.statsQuestions || !Array.isArray(formData.statsQuestions) || formData.statsQuestions.length !== formData.questions.length) {
          triggerValidationError('Texte de la question #1');
          return;
        }

        // Validation : chaque question doit avoir un texte non vide et ses réponses valides
        if (!formData.questions || !Array.isArray(formData.questions) || formData.questions.length === 0) {
          triggerValidationError('Texte de la question #1');
          return;
        }

        for (let i = 0; i < formData.questions.length; i++) {
          const q = formData.questions[i];
          
          // 1. Texte de la question
          if (!q.text || q.text.trim() === '') {
            triggerValidationError(`Texte de la question #${i + 1}`);
            return;
          }

          // 2. Réponses (doivent être au nombre de 4 et toutes non vides)
          if (!q.answers || q.answers.length !== 4) {
            triggerValidationError(`Réponse 1 de la question #${i + 1}`);
            return;
          }

          for (let aIdx = 0; aIdx < q.answers.length; aIdx++) {
            const ans = q.answers[aIdx];
            if (!ans.text || ans.text.trim() === '') {
              triggerValidationError(`Réponse ${aIdx + 1} de la question #${i + 1}`);
              return;
            }
          }

          // 3. Cochez la réponse correcte
          const hasCorrect = q.answers.some(ans => ans.isCorrect);
          if (!hasCorrect) {
            triggerValidationError(`Réponses possibles (Cochez la réponse correcte) #${i + 1}`);
            return;
          }
        }

        // Validation : les trois champs de conclusion doivent être remplis
        const conclusion = formData.conclusion || { text1: '', text2: '', text3: '' };
        if (!conclusion.text1 || conclusion.text1.trim() === '') {
          triggerValidationError('Score : 0% - 33%');
          return;
        }
        if (!conclusion.text2 || conclusion.text2.trim() === '') {
          triggerValidationError('Score : 34% - 66%');
          return;
        }
        if (!conclusion.text3 || conclusion.text3.trim() === '') {
          triggerValidationError('Score : 67% - 100%');
          return;
        }

        // Gestion de statsGlobal.scoreDistribution
        let scoreDistribution = {};
        const n = formData.questions.length;
        let statsQuestionsToSave = formData.statsQuestions;
        if (formMode === 'create') {
          // Initialiser n+1 clés à 0
          for (let i = 0; i <= n; i++) {
            scoreDistribution[i] = 0;
          }
        } else if (formMode === 'edit') {
          // Récupérer l'existant
          const prevScoreDist = currentEmbed?.statsGlobal?.scoreDistribution || {};
          // Synchroniser toutes les clés de 0 à n
          scoreDistribution = { ...prevScoreDist };
          // Ajout des clés manquantes
          for (let i = 0; i <= n; i++) {
            if (!(i in scoreDistribution)) {
              scoreDistribution[i] = 0;
            }
          }
          // Suppression des clés en trop
          Object.keys(scoreDistribution)
            .map(k => parseInt(k))
            .filter(k => k < 0 || k > n)
            .forEach(k => { delete scoreDistribution[k]; });

          // Préserver statsQuestions si le nombre de questions n'a pas changé
          if (currentEmbed?.statsQuestions && Array.isArray(currentEmbed.statsQuestions) && currentEmbed.statsQuestions.length === n) {
            statsQuestionsToSave = currentEmbed.statsQuestions;
          }
        }
        saveData = {
          type: 'quiz',
          title: formData.title || '',
          questions: formData.questions,
          statsQuestions: statsQuestionsToSave,
          statsGlobal: {
            scoreDistribution,
          },
          conclusion,
          brand: formData.brand || 'blick',
          theme: formData.theme,
        };
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
          saveData.timeCreated = serverTimestamp();
        }
        // Toujours mettre à jour timeUpdated
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'testimony') {
        // Validation spécifique aux témoignages
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }

        if (!formData.content || !formData.content.title || formData.content.title.trim() === '') {
          triggerValidationError("Titre de l'appel à témoignage");
          return;
        }

        if (!formData.content.subject || formData.content.subject.trim() === '') {
          triggerValidationError('Sujet');
          return;
        }

        if (!formData.content.question || formData.content.question.trim() === '') {
          triggerValidationError('Question');
          return;
        }

        // Conversion de timeExpires en Timestamp Firebase si défini
        let timeExpiresTimestamp = null;
        if (formData.content.timeExpires && formData.content.timeExpires.trim() !== '') {
          try {
            // Convertir la string datetime-local en Date puis en Timestamp Firebase
            const dateObj = new Date(formData.content.timeExpires);
            if (!isNaN(dateObj.getTime())) {
              timeExpiresTimestamp = Timestamp.fromDate(dateObj);
            }
          } catch (error) {
            console.warn('Erreur lors de la conversion de timeExpires:', error);
          }
        }

        saveData = {
          type: 'testimony',
          title: formData.title.trim(),
          brand: formData.brand || 'blick',
          theme: formData.theme,
          content: {
            title: formData.content.title.trim(),
            subject: formData.content.subject.trim(),
            question: formData.content.question.trim(),
            timeExpires: timeExpiresTimestamp
          }
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
          saveData.timeCreated = serverTimestamp();
          saveData.counterViews = 0;
          saveData.counterMsgSent = 0;
        }
        // Toujours mettre à jour timeUpdated
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'potm') {
        // Validation spécifique au joueur du match
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }

        if (!formData.context || !formData.context.context) {
          triggerValidationError('Contexte');
          return;
        }
        if (!formData.context.category) {
          triggerValidationError('Catégorie');
          return;
        }

        if (!formData.context.text || formData.context.text.trim() === '') {
          triggerValidationError('Label du match');
          return;
        }

        if (!formData.context.date || (typeof formData.context.date === 'string' && formData.context.date.trim() === '')) {
          triggerValidationError('Date du match');
          return;
        }

        if (!formData.players || !Array.isArray(formData.players) || formData.players.length < 2) {
          triggerValidationError('Candidats');
          return;
        }

        // Vérifier que tous les joueurs ont un nom
        for (let i = 0; i < formData.players.length; i++) {
          const player = formData.players[i];
          if (!player.name || player.name.trim() === '') {
            triggerValidationError(`Nom du joueur #${i + 1}`);
            return;
          }
        }

        const validPlayers = formData.players;

        // Conversion de la date en Timestamp Firebase
        let matchDateTimestamp = null;
        try {
          // Ajouter l'heure à midi pour avoir un timestamp complet
          const dateObj = new Date(formData.context.date + 'T12:00:00');
          if (!isNaN(dateObj.getTime())) {
            matchDateTimestamp = Timestamp.fromDate(dateObj);
          }
        } catch (error) {
          console.warn('Erreur lors de la conversion de la date:', error);
          triggerValidationError('Date du match');
          return;
        }

        // Préserver les votes existants en mode édition
        const playersToSave = validPlayers.map((player) => {
          // Les votes sont déjà présents dans l'objet player du formulaire
          // car PotmForm les charge depuis currentEmbed en mode édition
          return {
            id: player.id, // Préserver l'ID pour le matching futur
            name: player.name.trim(),
            position: player.position,
            team: player.team,
            code: player.code || '',
            color: player.color || '#000000',
            type: player.type || 'national',
            img: player.img ?? null,
            votes: player.votes || 0,
          };
        });

        saveData = {
          type: 'potm',
          context: {
            context: formData.context.context,
            category: formData.context.category,
            text: formData.context.text.trim(),
            date: matchDateTimestamp
          },
          players: playersToSave,
          brand: formData.brand || 'blick',
          theme: formData.theme,
          counterViews: formMode === 'create' ? 0 : (currentEmbed?.counterViews || 0),
          totalVotes: formMode === 'create' ? 0 : (currentEmbed?.totalVotes || 0)
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
          saveData.timeCreated = serverTimestamp();
        }
        // Toujours mettre à jour timeUpdated
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'prono') {
        // Validation spécifique aux pronostics
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }
        if (!formData.pronoData || !formData.pronoData.event || (typeof formData.pronoData.event === 'string' && formData.pronoData.event.trim() === '')) {
          triggerValidationError("Contexte");
          return;
        }
        if (!formData.pronoData || !formData.pronoData.date) {
          triggerValidationError("Date");
          return;
        }
        if (!formData.pronoData || !formData.pronoData.item1 || !formData.pronoData.item1.name) {
          triggerValidationError('Équipe 1');
          return;
        }
        if (!formData.pronoData || !formData.pronoData.item2 || !formData.pronoData.item2.name) {
          triggerValidationError('Équipe 2');
          return;
        }

        // Conversion Date -> Timestamp
        let pronoDateTimestamp = null;
        if (formData.pronoData.date) {
            try {
                // Si c'est déjà un objet Date (venant de PronoForm)
                if (formData.pronoData.date instanceof Date) {
                    pronoDateTimestamp = Timestamp.fromDate(formData.pronoData.date);
                } 
                // Si c'est une string (devrait pas arriver avec le new PronoForm mais sécurité)
                else if (typeof formData.pronoData.date === 'string') {
                    const d = new Date(formData.pronoData.date);
                    if (!isNaN(d.getTime())) {
                        pronoDateTimestamp = Timestamp.fromDate(d);
                    }
                }
            } catch (e) {
                console.warn("Erreur date prono", e);
            }
        }

        saveData = {
          type: 'prono',
          pronoData: {
              ...formData.pronoData,
              date: pronoDateTimestamp,
              // Initialisation des votes à 1 lors de la création
              item1: {
                  ...formData.pronoData.item1,
                  votes: formMode === 'create' ? 1 : (formData.pronoData.item1.votes || 0)
              },
              item2: {
                  ...formData.pronoData.item2,
                  votes: formMode === 'create' ? 1 : (formData.pronoData.item2.votes || 0)
              },
              item3: { // Draw
                  votes: formMode === 'create' ? 1 : (formData.pronoData.item3?.votes || 0)
              }
          },
          brand: formData.brand || 'blick',
          theme: formData.theme,
          counterViews: formMode === 'create' ? 0 : (currentEmbed?.counterViews || 0)
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
          saveData.timeCreated = serverTimestamp();
        }
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'facts') {
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }
        if (!formData.factsData || !formData.factsData.rencontre || formData.factsData.rencontre.trim() === '') {
          triggerValidationError('Rencontre');
          return;
        }
        if (!formData.factsData.date || formData.factsData.date.trim() === '') {
          triggerValidationError('Date');
          return;
        }

        let factsDateTimestamp = null;
        try {
          // Ajouter l'heure à midi pour avoir un timestamp complet
          const dateObj = new Date(formData.factsData.date + 'T12:00:00');
          if (!isNaN(dateObj.getTime())) {
            factsDateTimestamp = Timestamp.fromDate(dateObj);
          }
        } catch (error) {
          console.warn('Erreur lors de la conversion de la date:', error);
          triggerValidationError('Date');
          return;
        }

        // Validation stricte des attributs requis par type d'item
        for (let i = 0; i < formData.factsData.items.length; i++) {
          const item = formData.factsData.items[i];

          if (!item.title || item.title.trim() === '') {
             triggerValidationError('Titre');
             return;
          }

          if (item.type === 'normal') {
             if (!item.text || item.text.trim() === '') {
                triggerValidationError('Contenu');
                return;
             }
          }

          if (item.type === 'quote') {
             if (!item.text || item.text.trim() === '') {
                triggerValidationError('Citation');
                return;
             }
             if (!item.author || item.author.trim() === '') {
                triggerValidationError('Auteur');
                return;
             }
          }

          if (item.type === 'picture') {
             if (!item.src || item.src.trim() === '') {
                triggerValidationError('Image');
                return;
             }
             if (!item.text || item.text.trim() === '') {
                triggerValidationError('Contenu');
                return;
             }
             if (!item.caption || item.caption.trim() === '') {
                triggerValidationError('Crédit');
                return;
             }
          }

          if (item.type === 'number') {
             if (item.value === undefined || item.value === null || item.value === '') {
                triggerValidationError('Chiffre');
                return;
             }
             if (!item.text || item.text.trim() === '') {
                triggerValidationError('Description');
                return;
             }
          }
        }

        const itemsToSave = formData.factsData.items.map(item => {
          const baseItem = {
            id: item.id || (Date.now() + Math.random().toString(36).substr(2, 9)),
            icon: item.icon || '',
            title: item.title || '',
            type: item.type || 'normal',
            text: item.text || '',
            votes: item.votes || 0,
          };
          if (item.type === 'quote') {
             baseItem.author = item.author || '';
             if (item.picture) baseItem.picture = item.picture;
          }
          if (item.type === 'picture') {
             baseItem.caption = item.caption || '';
             if (item.src) baseItem.src = item.src;
          }
          if (item.type === 'number') baseItem.value = item.value || 0;
          return baseItem;
        });

        saveData = {
          type: 'facts',
          brand: formData.brand || 'blick',
          theme: formData.theme,
          counterViews: formMode === 'create' ? 0 : (currentEmbed?.counterViews || 0)
        };

        const factsDataObj = {
          rencontre: formData.factsData.rencontre,
          date: factsDateTimestamp,
          items: itemsToSave
        };

        saveData.factsData = factsDataObj;

        // Handle ratingStats (or legacy voteStats)
        if (formData.ratingStats !== undefined) {
          saveData.ratingStats = formData.ratingStats;
        } else if (formData.voteStats !== undefined) {
          saveData.ratingStats = formData.voteStats;
        }

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
          saveData.timeCreated = serverTimestamp();
        }
        saveData.timeUpdated = serverTimestamp();
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
        else if (formData.type === 'quiz') successMessage = 'Quiz créé avec succès !';
        else if (formData.type === 'testimony') successMessage = 'Appel à témoignage créé avec succès !';
        else if (formData.type === 'potm') successMessage = 'Joueur·euse du match créé·e avec succès !';
        else if (formData.type === 'prono') successMessage = 'Pronostic créé avec succès !';
        else if (formData.type === 'facts') successMessage = 'Faits marquants créés avec succès !';
        
        console.log(successMessage);
        
      } else if (formMode === 'edit') {
        // Mise à jour d'un élément existant
        if (!currentEmbed?.id) {
          throw new Error('ID de l\'élément à éditer manquant');
        }
        
        const docRef = doc(db, 'embeds', currentEmbed.id);
        
        // Pour les dossiers et potm, utiliser une transaction pour préserver les compteurs
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
        } else if (formData.type === 'potm') {
          await runTransaction(db, async (transaction) => {
            // Lire le document actuel pour obtenir les votes à jour
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error('Le document n\'existe pas');
            }
            
            const currentData = currentDoc.data();
            const currentPlayers = currentData.players || [];
            
            // Fusionner les joueurs en préservant les votes actuels
            const mergedPlayers = saveData.players.map((newPlayer) => {
              // Chercher le joueur existant par ID (prioritaire) ou par nom (fallback)
              let existingPlayer = null;
              if (newPlayer.id) {
                existingPlayer = currentPlayers.find(p => p.id === newPlayer.id);
              }
              // Fallback: chercher par nom si pas d'ID ou pas trouvé
              if (!existingPlayer) {
                existingPlayer = currentPlayers.find(p => p.name === newPlayer.name);
              }
              
              return {
                ...newPlayer,
                // Préserver les votes s'ils existent, sinon 0
                votes: existingPlayer?.votes || 0
              };
            });
            
            // Préserver aussi totalVotes et counterViews actuels
            const updatedSaveData = {
              ...saveData,
              players: mergedPlayers,
              totalVotes: currentData.totalVotes || 0,
              counterViews: currentData.counterViews || 0
            };
            
            // Effectuer la mise à jour transactionnelle
            transaction.update(docRef, updatedSaveData);
          });
          console.log('POTM mis à jour avec transaction:', currentEmbed.id);
        } else if (formData.type === 'prono') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error("Le document n'existe pas");
            }
            const currentData = currentDoc.data();
            
            // Fusionner les données pour préserver les votes
            // IMPORTANT: Lors d'une mise à jour transactionnelle, on fusionne ce qui vient du formulaire (noms, couleurs, event, date)
            // avec les votes qui sont dans la base de données.
            
            // Note: saveData contient déjà item1/2/3 votes venant du formulaire, 
            // mais on préfère la source de vérité de la DB pour éviter les conflits de concurrence sur les votes.
            
            const updatedPronoData = {
              ...saveData.pronoData,
              item1: {
                ...saveData.pronoData.item1,
                votes: currentData.pronoData?.item1?.votes || 1 // Fallback à 1 si jamais undefined
              },
              item2: {
                ...saveData.pronoData.item2,
                votes: currentData.pronoData?.item2?.votes || 1
              },
              item3: {
                votes: currentData.pronoData?.item3?.votes || 1
              }
            };
            
            const updatedSaveData = {
              ...saveData,
              pronoData: updatedPronoData,
              counterViews: currentData.counterViews || 0
            };
            
            transaction.update(docRef, updatedSaveData);
          });
          console.log('Pronostic mis à jour avec transaction:', currentEmbed.id);
        } else if (formData.type === 'facts') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error("Le document n'existe pas");
            }
            const currentData = currentDoc.data();
            const currentFactsData = currentData.factsData || {};
            
            // Supports both old formats and new format for migrating matching
            const oldList = currentFactsData.items || [];
            let currentItems = [];
            if (Array.isArray(oldList)) {
                currentItems = oldList;
            } else if (typeof oldList === 'object') {
                const keys = Object.keys(oldList).filter(k => !isNaN(k) || k.startsWith('item')).sort();
                currentItems = keys.map(k => oldList[k]);
            } else {
                // very old item1, item2 format
                let i = 1;
                while (currentFactsData[`item${i}`]) {
                    currentItems.push(currentFactsData[`item${i}`]);
                    i++;
                }
            }

            const updatedItems = saveData.factsData.items.map((newItem, index) => {
                 let currentVotes = 0;
                 
                 // 1. Chercher par l'ID unique explicit (pour les éléments récents)
                 let matchedItem = currentItems.find(it => it && it.id === newItem.id);
                 
                 // 2. Fallback: Chercher par Titre (pour éviter la casse au reordering legacy)
                 if (!matchedItem) {
                     matchedItem = currentItems.find(it => it && it.title === newItem.title);
                 }
                 
                 if (matchedItem && matchedItem.votes) {
                      currentVotes = matchedItem.votes;
                 } else if (currentItems[index] && currentItems[index].votes) {
                      currentVotes = currentItems[index].votes;
                 }
                 
                 return {
                     ...newItem,
                     votes: currentVotes
                 };
            });

            // On reconstruit saveData.factsData en préservant les votes
            const updatedFactsData = {
              rencontre: saveData.factsData.rencontre,
              date: saveData.factsData.date,
              items: updatedItems
            };

            const updatedSaveData = {
              ...saveData,
              factsData: updatedFactsData,
              counterViews: currentData.counterViews || 0
            };
            transaction.update(docRef, updatedSaveData);
          });
          console.log('Faits marquants mis à jour avec transaction:', currentEmbed.id);
        } else if (formData.type === 'poll') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error('Le document n\'existe pas');
            }
            
            const currentData = currentDoc.data();
            const currentTxts = currentData.answerTxts || [];
            const currentCounters = currentData.answerCounters || [];
            
            const originalTxts = saveData.answerOriginalTxts || [];
            
            // Fusionner les compteurs : si le texte original existait déjà, on garde son compteur.
            // Sinon (nouveau texte ou texte modifié), on repart à 0 ou on cherche par texte.
            const mergedCounters = saveData.answerTxts.map((newTxt, idx) => {
              const origTxt = originalTxts[idx];
              if (origTxt && origTxt.trim() !== '') {
                const existingIndexByOrig = currentTxts.indexOf(origTxt.trim());
                if (existingIndexByOrig !== -1) {
                  return currentCounters[existingIndexByOrig] || 0;
                }
              }
              const existingIndexByNew = currentTxts.indexOf(newTxt);
              return existingIndexByNew !== -1 ? (currentCounters[existingIndexByNew] || 0) : 0;
            });
            
            // Retirer `answerOriginalTxts` de saveData pour ne pas polluer Firestore
            const { answerOriginalTxts, ...dataToSave } = saveData;
            const updatedSaveData = {
              ...dataToSave,
              answerCounters: mergedCounters
            };
            
            transaction.update(docRef, updatedSaveData);
          });
          console.log('Sondage mis à jour avec transaction:', currentEmbed.id);
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
        else if (formData.type === 'quiz') successMessage = 'Quiz modifié avec succès !';
        else if (formData.type === 'testimony') successMessage = 'Appel à témoignage modifié avec succès !';
        else if (formData.type === 'potm') successMessage = 'Joueur·euse du match modifié·e avec succès !';
        else if (formData.type === 'prono') successMessage = 'Pronostic modifié avec succès !';
        else if (formData.type === 'facts') successMessage = 'Faits marquants modifiés avec succès !';
        
        console.log(successMessage);
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        if (onDataChange) {
          onDataChange();
        }
        handleClose();
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setErrorMessage(`Erreur lors de la sauvegarde : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="form" className={s.form + (formVisible ? ' ' + s.isVisible : '') + ' max-w-4xl w-full h-auto overflow-y-auto fixed top-1/2 left-1/2 bg-white rounded-xl shadow-lg z-40 flex flex-col'}>
      {/* En-tête avec titre et bouton fermer */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-200 border-b border-gray-300 rounded-t-xl">
        <h2 className="text-xl font-bold text-gray-800">{getFormTitle()}</h2>
        <button 
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 text-2xl font-semibold transition-colors"
          title="Fermer"
          disabled={isLoading}
        >
          ×
        </button>
      </div>

      <div className="p-6">

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

        {formType === 'quiz' && (
          <QuizForm
            currentEmbed={currentEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'testimony' && (
          <TestimonyForm
            currentEmbed={currentEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'potm' && (
          <PotmForm
            currentEmbed={currentEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'prono' && (
          <PronoForm
            currentEmbed={currentEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'facts' && (
          <FactsForm
            currentEmbed={currentEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {errorMessage && errorMessage.startsWith('Erreur lors de la sauvegarde') && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg text-center animate-fade-in flex items-center justify-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={handleClose}
            className="w-1/2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isLoading || isSuccess}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className={`w-1/2 rounded-md font-bold transition-all duration-300 ${
              isSuccess ? 'text-white border-green-600' : 'btn-primary'
            }`}
            style={isSuccess ? { backgroundColor: '#22c55e', borderColor: '#22c55e', color: 'white', cursor: 'default' } : {}}
            disabled={isLoading || isSuccess}
          >
            {isSuccess ? '✓ Enregistré !' : (isLoading ? 'Sauvegarde...' : 'Sauvegarder')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Form;
