import React, { useState, useCallback, useMemo } from 'react';
import s from './Form.module.scss';
import PollForm from './PollForm';
import CalendarForm, { SHOW_ADVANCED_DATE_OPTIONS } from './CalendarForm';
import TeaserForm from './TeaserForm';
import FolderForm from './FolderForm';
import TinderForm from './TinderForm';
import QuizForm from './QuizForm';
import TestimonyForm from './TestimonyForm';
import PotmForm from './PotmForm';
import PronoForm from './PronoForm';
import FactsForm from './FactsForm';
import NatinotesForm from './NatinotesForm';
import { normalizeFocal } from '../../data/portraitFocal';
import { collection, addDoc, updateDoc, doc, serverTimestamp, runTransaction, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@rms/services';
import { transformWidgetData, validatePoll, buildPollSaveData } from '@rms/widget-model';
import { getAuth } from 'firebase/auth';

function Form({ formVisible, formMode, formType, currentEmbed, onClose, onDataChange, devMode }) {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Adaptateur pour transformer la structure 'widgets' en structure flat legacy
  const getLegacyEmbed = (embed) => {
    if (!embed) return null;
    if (!embed.meta && !embed.data && !embed.stats) return embed;
    return {
      ...embed,
      ...embed.meta,
      ...embed.stats,
      ...embed.data,
      pollTxt: embed.data?.question || embed.data?.title || embed.meta?.title || embed.pollTxt,
      calWording: embed.data?.title || embed.meta?.title || embed.calWording,
      folderName: embed.data?.folderName || embed.data?.title || embed.meta?.title || embed.folderName,
      folderLabel: embed.data?.folderLabel || embed.data?.label || embed.meta?.label || embed.folderLabel,
      tinderTitle: embed.data?.tinderTitle || embed.data?.title || embed.meta?.title || embed.tinderTitle,
      tinderLabel: embed.data?.tinderLabel || embed.data?.label || embed.meta?.label || embed.tinderLabel,
      teaserTitle: embed.data?.title || embed.meta?.title || embed.teaserTitle,
      teaserLabel: embed.data?.label || embed.meta?.label || embed.teaserLabel,
      rencontre: embed.data?.title || embed.meta?.title || embed.rencontre,
      title: embed.data?.title || embed.meta?.title || embed.title,
      potmTitle: embed.data?.title || embed.meta?.title || embed.potmTitle,
      // `?? true` : les widgets natinotes publiés avant ce réglage gardent le récap
      showRecap: embed.data?.showRecap ?? embed.showRecap ?? true,
      playerRatings: embed.stats?.playerRatings || embed.playerRatings || {},
      counterViews: embed.stats?.views ?? embed.counterViews ?? 0,
      counterReveal: embed.stats?.reveal ?? embed.counterReveal ?? 0,
      counterClicks: embed.stats?.clicks ?? embed.counterClicks ?? 0,
      counterSeeAllClicks: embed.stats?.seeAllClicks ?? embed.counterSeeAllClicks ?? 0,
      counterMsgSent: embed.stats?.msgSent ?? embed.counterMsgSent ?? 0,
      id: embed.meta?.id || embed.id,
      _originalStats: embed.stats || {},
      factsData: embed.data?.factsData || embed.factsData || {
          rencontre: embed.data?.title || embed.meta?.title || embed.rencontre || '',
          date: embed.data?.date || embed.date || '',
          items: embed.data?.items || embed.items || []
      },
    };
  };

  const legacyEmbed = useMemo(() => getLegacyEmbed(currentEmbed), [currentEmbed]);

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
      if (formType === 'natinotes') return 'Nouvelles notes des joueur·euse·s';
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
      if (formType === 'natinotes') return 'Éditer les notes des joueur·euse·s';
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
    console.log("DEBUG legacyEmbed.counterViews:", legacyEmbed?.counterViews, "legacyEmbed.counterSeeAllClicks:", legacyEmbed?.counterSeeAllClicks);

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

    const triggerValidationError = (labelText, inputSelector = 'input, textarea, select', occurrence = 0) => {
      setIsLoading(false);

      if (!formElement || !labelText) return;

      // Recherche du label par son texte. `occurrence` sélectionne le N-ième
      // label correspondant : indispensable quand plusieurs items partagent le
      // même intitulé (ex. « Note Blick » / « Paragraphe » d'un joueur natinotes),
      // pour surligner celui qui bloque réellement et non le premier de la liste.
      const matching = Array.from(formElement.querySelectorAll('label, h3, h4')).filter(label => {
        const text = label.textContent.toLowerCase();
        return text.includes(labelText.toLowerCase());
      });
      const targetLabel = matching[occurrence] || matching[0];

      if (targetLabel) {
        // Appliquer la couleur rouge au label
        targetLabel.classList.remove('text-gray-700', 'text-gray-500');
        targetLabel.classList.add('text-red-600', 'font-bold');
        
        // Appliquer la bordure rouge au champ de saisie associé
        let containerElement = targetLabel.parentElement;
        let input = containerElement ? containerElement.querySelector(inputSelector) : null;
        
        // Remonter dans l'arbre DOM jusqu'à trouver un conteneur qui possède l'input
        // On limite la recherche au formulaire pour éviter de remonter trop haut
        while (containerElement && !input && containerElement !== formElement) {
          containerElement = containerElement.parentElement;
          if (containerElement) {
            input = containerElement.querySelector(inputSelector);
          }
        }

        if (input) {
          input.classList.remove('border-gray-300', 'focus:ring-blue-500');
          input.classList.add('border-red-500', 'focus:ring-red-500');
          input.focus();
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
      
      // Récupérer les données les plus récentes de Firestore si on est en mode édition
      // Cela évite d'écraser les compteurs avec des données "stale" si la liste n'a pas été rafraîchie
      let latestStats = {};
      if (formMode === 'edit') {
        try {
          const targetId = currentEmbed?.meta?.id || currentEmbed?.id;
          if (targetId) {
            const docRef = doc(db, 'widgets', targetId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              latestStats = docSnap.data().stats || {};
            }
          }
        } catch (err) {
          console.error("Erreur lors de la récupération des stats à jour:", err);
        }
      }

      // Construction des données selon le type
      if (formData.type === 'poll') {
        // Validation et préparation partagées avec l'API (@rms/widget-model)
        const pollInput = {
          question: formData.pollTxt,
          answers: formData.answerTxts,
          answerCounters: formData.answerCounters,
          brand: formData.brand,
          theme: formData.theme
        };
        const [firstError] = validatePoll(pollInput);
        if (firstError) {
          const answerIndex = firstError.field.match(/^answers\[(\d+)\]$/)?.[1];
          const pollFieldLabels = { theme: 'Rubrique', question: 'Question du sondage', answers: 'Réponses possibles', brand: 'Brand' };
          triggerValidationError(answerIndex !== undefined ? `Réponse ${Number(answerIndex) + 1}` : pollFieldLabels[firstError.field]);
          return;
        }

        saveData = {
          ...buildPollSaveData(pollInput),
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };

        if (formMode === 'edit') {
          saveData._originalStats = latestStats;
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
        // (champs End / badges / lien live masqués : pas de validation sur des champs invisibles)
        for (let i = 0; i < formData.dates.length; i++) {
          const date = formData.dates[i];
          if (!date.text || date.text.trim() === '') {
            triggerValidationError(`Wording de la date ${i + 1}`);
            return;
          }
          if (!date.date) {
            triggerValidationError(`Start de la date ${i + 1}`);
            return;
          }
          if (SHOW_ADVANCED_DATE_OPTIONS && date.showBadge) {
            if (!date.endDate) {
              triggerValidationError(`Fin de la date ${i + 1}`);
              return;
            }
            if (new Date(date.endDate) <= new Date(date.date)) {
              triggerValidationError(`Fin de la date ${i + 1}`);
              // Optionnel: On pourrait aussi afficher un message d'erreur spécifique pour indiquer pourquoi c'est invalide, 
              // mais pour rester cohérent avec la fonction triggerValidationError qui met en surbrillance, 
              // mettre en surbrillance la date de fin est la meilleure approche.
              return;
            }
          }
          if (SHOW_ADVANCED_DATE_OPTIONS && date.liveLinkEnabled && (!date.liveLinkUrl || date.liveLinkUrl.trim() === '')) {
            triggerValidationError(`URL du live de la date ${i + 1}`);
            return;
          }
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
             complement: d.complement?.trim() || '',
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
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
          timeUpdated: serverTimestamp(),
          counterSeeAllClicks: formMode === 'create' ? 0 : ((latestStats.seeAllClicks ?? legacyEmbed?.counterSeeAllClicks) || 0),
          counterViews: formMode === 'create' ? 0 : ((latestStats.views ?? legacyEmbed?.counterViews) || 0),
        };
        
        if (formMode === 'edit') {
          saveData._originalStats = latestStats;
        }

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
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
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
        if (!formData.folderLabel) {
          triggerValidationError('Label du dossier');
          return;
        }
        if (!formData.folderName) {
          triggerValidationError('Titre du dossier');
          return;
        }
        
        if (!formData.img || formData.img.trim() === '') {
          triggerValidationError('Image du dossier');
          return;
        }

        // Vérifier que chaque bouton présent est entièrement rempli
        if (!formData.buttons || formData.buttons.length === 0) {
          triggerValidationError('Texte du bouton #1');
          return;
        }

        for (let i = 0; i < formData.buttons.length; i++) {
          const btn = formData.buttons[i];
          const hasTxt = btn.buttonTxt && btn.buttonTxt.trim() !== '';
          const hasUrl = btn.buttonUrl && btn.buttonUrl.trim() !== '';
          
          if (!hasTxt) {
            triggerValidationError(`Texte du bouton #${i + 1}`);
            return;
          }
          if (!hasUrl) {
            triggerValidationError(`Url du bouton #${i + 1}`);
            return;
          }
        }

        const validButtons = formData.buttons; // Tous les boutons sont valides à ce stade

        saveData = {
          type: 'folder',
          folderName: formData.folderName,
          folderLabel: formData.folderLabel,
          folderLabelColor: formData.folderLabelColor || 'bg-brand',
          img: formData.img || '',
          buttons: validButtons.map(button => ({
            id: button.id || crypto.randomUUID(),
            buttonTxt: button.buttonTxt.trim(),
            buttonUrl: button.buttonUrl.trim(),
            buttonOpensNewTab: button.buttonOpensNewTab || false,
            buttonCounterClicks: button.buttonCounterClicks || 0
          })),
          brand: formData.brand || 'blick',
          theme: formData.theme,
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
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
        
        if (legend.display && (!legend.txt || legend.txt.trim() === '')) {
          triggerValidationError('Légende');
          return;
        }

        saveData = {
          type: 'tinder',
          tinderLabel: formData.tinderLabel,
          tinderTitle: formData.tinderTitle,
          tinderCards: formData.tinderCards.map(card => ({
            id: card.id,
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
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
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
          const prevScoreDist = legacyEmbed?.statsGlobal?.scoreDistribution || {};
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

          // Préserver statsQuestions si le nombre de questions n'a pas changé, ou si c'est la nouvelle structure (objet)
          if (legacyEmbed?.statsQuestions) {
            if (Array.isArray(legacyEmbed.statsQuestions)) {
              if (legacyEmbed.statsQuestions.length === n) {
                statsQuestionsToSave = legacyEmbed.statsQuestions;
              }
            } else if (typeof legacyEmbed.statsQuestions === 'object') {
              statsQuestionsToSave = legacyEmbed.statsQuestions;
            }
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
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
        };
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
        // Toujours mettre à jour timeUpdated
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'testimony') {
        // Validation spécifique aux témoignages
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }

        if (!formData.title || formData.title.trim() === '') {
          triggerValidationError("Titre de la box");
          return;
        }

        if (!formData.subject || formData.subject.trim() === '') {
          triggerValidationError('Sujet');
          return;
        }

        if (!formData.question || formData.question.trim() === '') {
          triggerValidationError('Question');
          return;
        }

        // Conversion de timeExpires en Timestamp Firebase si défini
        let timeExpiresTimestamp = null;
        if (formData.timeExpires && formData.timeExpires.trim() !== '') {
          try {
            // Convertir la string datetime-local en Date puis en Timestamp Firebase
            const dateObj = new Date(formData.timeExpires);
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
          subject: formData.subject.trim(),
          question: formData.question.trim(),
          timeExpires: timeExpiresTimestamp,
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
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
          counterViews: formMode === 'create' ? 0 : (legacyEmbed?.counterViews || 0),
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
        // Toujours mettre à jour timeUpdated
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'natinotes') {
        // Validation spécifique aux notes des joueurs
        if (!formData.theme) {
          triggerValidationError('Rubrique');
          return;
        }
        if (!formData.title || formData.title.trim() === '') {
          triggerValidationError('Événement');
          return;
        }
        if (!Array.isArray(formData.players) || formData.players.length < 1) {
          triggerValidationError('Ajouter des joueurs');
          return;
        }

        // Note Blick et paragraphe sont obligatoires pour chaque joueur.
        // `index` cible le label du joueur fautif (les cartes partagent les
        // mêmes intitulés) plutôt que le premier de la liste.
        for (let index = 0; index < formData.players.length; index++) {
          const player = formData.players[index];
          if (!player.name || player.name.trim() === '') {
            triggerValidationError('Ajouter des joueurs');
            return;
          }
          if (!player.blickRating) {
            triggerValidationError('Note Blick', undefined, index);
            return;
          }
          if (!player.comment || player.comment.trim() === '') {
            triggerValidationError('Paragraphe', undefined, index);
            return;
          }
        }

        // L'id est la clé de stats.playerRatings : il doit être unique dans le widget
        const natinotesIds = formData.players.map((p) => p.id);
        if (new Set(natinotesIds).size !== natinotesIds.length) {
          triggerValidationError('Joueurs (doublon)');
          return;
        }

        const natinotesPlayers = formData.players.map((player) => ({
          id: player.id,
          name: player.name.trim(),
          // Le nom d'équipe vient du catalogue ; plus de valeur par défaut
          // depuis que les équipes sont créées librement dans le backend.
          team: player.team || '',
          img: player.img ?? null,
          // Cadrage du portrait gelé avec l'image ; borné avant écriture.
          focal: normalizeFocal(player.focal),
          blickRating: Number(player.blickRating),
          comment: player.comment,
        }));

        saveData = {
          type: 'natinotes',
          title: formData.title.trim(),
          // `label` n'est plus saisi ; on préserve celui des widgets déjà publiés
          label: (formData.label ?? legacyEmbed?.label ?? '').trim(),
          players: natinotesPlayers,
          showRecap: formData.showRecap !== false,
          brand: formData.brand || 'blick',
          theme: formData.theme,
          counterViews: formMode === 'create' ? 0 : (legacyEmbed?.counterViews || 0),
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
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
          counterViews: formMode === 'create' ? 0 : (legacyEmbed?.counterViews || 0),
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
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
            id: item.id || crypto.randomUUID(),
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
          counterViews: formMode === 'create' ? 0 : (legacyEmbed?.counterViews || 0)
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

      // Si saveData n'a pas encore _originalStats (pour les autres widgets), utiliser latestStats
      if (formMode === 'edit') {
        if (!saveData._originalStats) {
          saveData._originalStats = latestStats || (legacyEmbed?._originalStats || {});
        }
        // Préserver l'auteur, la création, et autres meta qui étaient écrasés à chaque édition
        saveData.author = legacyEmbed?.author || legacyEmbed?.meta?.author || '';
        saveData.deleted = legacyEmbed?.deleted || legacyEmbed?.meta?.deleted || false;
        saveData.brand = formData.brand || legacyEmbed?.brand || legacyEmbed?.meta?.brand || '';
        saveData.theme = formData.theme || legacyEmbed?.theme || legacyEmbed?.meta?.theme || '';
        saveData.timeCreated = legacyEmbed?.timeCreated || legacyEmbed?.meta?.timeCreated || serverTimestamp();
      }

      // ADAPTATEUR partagé avec l'API : enregistrement plat → document `widgets` 4 blocs
      const finalWidgetData = transformWidgetData(saveData, { serverTimestamp });
      console.log("DEBUG finalWidgetData:", finalWidgetData);

      // Sauvegarde selon le mode
      if (formMode === 'create') {
        // Création d'un nouvel élément
        const docRef = await addDoc(collection(db, 'widgets'), finalWidgetData);
        // Assurer que le nouveau document contient son id dans meta.id
        await updateDoc(docRef, { 'meta.id': docRef.id });
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
        else if (formData.type === 'natinotes') successMessage = 'Notes des joueur·euse·s créées avec succès !';
        else if (formData.type === 'prono') successMessage = 'Pronostic créé avec succès !';
        else if (formData.type === 'facts') successMessage = 'Faits marquants créés avec succès !';
        
        console.log(successMessage);
        
} else if (formMode === 'edit') {
        // Mise à jour d'un élément existant
        if (!currentEmbed?.id && !currentEmbed?.meta?.id) {
          throw new Error('ID de l\'élément à éditer manquant');
        }
        
        const targetId = currentEmbed.meta?.id || currentEmbed.id;
        finalWidgetData.meta.id = targetId;
        const docRef = doc(db, 'widgets', targetId);
        
        // Pour les dossiers et potm, utiliser une transaction pour préserver les compteurs
        if (formData.type === 'folder') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error('Le document n\'existe pas');
            }
            
            const currentData = currentDoc.data();
            const currentButtonClicks = currentData.stats?.buttonClicks || {};
            const currentLegacyButtons = currentData.data?.buttons || [];
            
            const updatedButtonClicks = {};

            finalWidgetData.data.buttons.forEach((newButton) => {
               let currentClicks = 0;
               if (currentButtonClicks[newButton.id]) {
                   currentClicks = currentButtonClicks[newButton.id];
               } else {
                   let existingButton = currentLegacyButtons.find(b => b.id === newButton.id) || 
                                        currentLegacyButtons.find(existing => existing.buttonUrl === newButton.buttonUrl && existing.buttonTxt === newButton.buttonTxt) ||
                                        currentLegacyButtons.find(existing => existing.buttonUrl === newButton.buttonUrl);
                   
                   if (existingButton && existingButton.buttonCounterClicks) {
                       currentClicks = existingButton.buttonCounterClicks;
                   }
               }
               updatedButtonClicks[newButton.id] = currentClicks;
            });
            
            finalWidgetData.stats.buttonClicks = updatedButtonClicks;
            transaction.update(docRef, finalWidgetData);
          });
          
          console.log('Dossier mis à jour avec préservation des compteurs');
        } else if (formData.type === 'quiz') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error('Le document n\'existe pas');
            }
            
            const currentData = currentDoc.data();
            const currentStatsQuestions = currentData.stats?.statsQuestions || currentData.statsQuestions || {};
            
            const updatedStatsQuestions = {};

            finalWidgetData.data.questions.forEach((q, idx) => {
               if (currentStatsQuestions[q.id]) {
                   updatedStatsQuestions[q.id] = currentStatsQuestions[q.id];
               } else if (currentStatsQuestions[idx]) {
                   // Legacy fallback si tableau
                   updatedStatsQuestions[q.id] = currentStatsQuestions[idx];
               } else {
                   updatedStatsQuestions[q.id] = { correct: 0, incorrect: 0 };
               }
            });
            
            finalWidgetData.stats.statsQuestions = updatedStatsQuestions;

            // Recalcul de scoreDistribution avec les données FRAÎCHES
            const currentScoreDist = currentData.stats?.statsGlobal?.scoreDistribution || currentData.statsGlobal?.scoreDistribution || {};
            const n = finalWidgetData.data.questions.length;
            const updatedScoreDist = { ...currentScoreDist };
            
            for (let i = 0; i <= n; i++) {
              if (!(i in updatedScoreDist)) {
                updatedScoreDist[i] = 0;
              }
            }
            Object.keys(updatedScoreDist)
              .map(k => parseInt(k))
              .filter(k => k < 0 || k > n)
              .forEach(k => { delete updatedScoreDist[k]; });
              
            if (!finalWidgetData.stats.statsGlobal) {
                finalWidgetData.stats.statsGlobal = {};
            }
            finalWidgetData.stats.statsGlobal.scoreDistribution = updatedScoreDist;

            transaction.update(docRef, finalWidgetData);
          });
          
          console.log('Quiz mis à jour avec préservation des compteurs par UUID');
        } else if (formData.type === 'potm') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error('Le document n\'existe pas');
            }
            
            const currentData = currentDoc.data();
            const currentPlayersVotes = currentData.stats?.playersVotes || {};
            const currentLegacyPlayers = currentData.data?.players || [];
            
            const updatedPlayersVotes = {};

            finalWidgetData.data.players.forEach((newPlayer) => {
               let currentVotes = 0;
               if (currentPlayersVotes[newPlayer.id]) {
                   currentVotes = currentPlayersVotes[newPlayer.id];
               } else {
                   let existingPlayer = currentLegacyPlayers.find(p => p.id === newPlayer.id) || currentLegacyPlayers.find(p => p.name === newPlayer.name);
                   if (existingPlayer && existingPlayer.votes) {
                       currentVotes = existingPlayer.votes;
                   }
               }
               updatedPlayersVotes[newPlayer.id] = currentVotes;
            });
            
            finalWidgetData.stats.playersVotes = updatedPlayersVotes;
            transaction.update(docRef, finalWidgetData);
          });
          
          console.log('POTM mis à jour avec préservation des compteurs');
        } else if (formData.type === 'natinotes') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error("Le document n'existe pas");
            }

            const currentData = currentDoc.data();
            const currentRatings = currentData.stats?.playerRatings || {};

            // On repart des distributions réellement en base (et non de celles
            // chargées à l'ouverture du formulaire) pour ne perdre aucune note
            // déposée pendant l'édition. Les joueurs retirés du widget voient
            // leur distribution supprimée — décision spec §3.
            const updatedRatings = {};
            finalWidgetData.data.players.forEach((player) => {
              if (currentRatings[player.id]) {
                updatedRatings[player.id] = currentRatings[player.id];
              }
            });

            finalWidgetData.stats.playerRatings = updatedRatings;
            transaction.update(docRef, finalWidgetData);
          });

          console.log('Natinotes mis à jour avec préservation des notes');
        } else if (formData.type === 'prono') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error("Le document n'existe pas");
            }
            const currentData = currentDoc.data();
            
            const currentItemVotes = currentData.stats?.itemVotes || {};
            const updatedItemVotes = {};
            
            ['item1', 'item2', 'item3'].forEach(k => {
                if (finalWidgetData.data.pronoData[k]) {
                    let votes = 0;
                    if (currentItemVotes[k]) {
                        votes = currentItemVotes[k];
                    } else if (currentData.data?.pronoData?.[k]?.votes) {
                        votes = currentData.data.pronoData[k].votes;
                    }
                    updatedItemVotes[k] = votes;
                }
            });
            
            finalWidgetData.stats.itemVotes = updatedItemVotes;
            transaction.update(docRef, finalWidgetData);
          });
          console.log('Pronostic mis à jour avec transaction:', targetId);
        } else if (formData.type === 'facts') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error("Le document n'existe pas");
            }
            const currentData = currentDoc.data();
            
            finalWidgetData.stats.ratingStats = currentData.stats?.ratingStats || currentData.ratingStats || {};
            
            // Delete itemCounters if they exist in finalWidgetData to avoid recreating them
            delete finalWidgetData.stats.itemCounters;

            transaction.update(docRef, finalWidgetData);
          });
          console.log('Faits marquants mis à jour avec transaction:', targetId);
        } else if (formData.type === 'poll') {
          await runTransaction(db, async (transaction) => {
            const currentDoc = await transaction.get(docRef);
            if (!currentDoc.exists()) {
              throw new Error('Le document n\'existe pas');
            }
            
            const currentData = currentDoc.data();
            const currentCounters = currentData.stats?.answerCounters || {};
            
            const updatedCounters = {};

            finalWidgetData.data.answerTxts.forEach((ans) => {
               updatedCounters[ans.id] = currentCounters[ans.id] || 0;
            });
            
            finalWidgetData.stats.answerCounters = updatedCounters;
            transaction.update(docRef, finalWidgetData);
          });
          console.log('Sondage mis à jour avec transaction:', targetId);
        } else {
          // Mise à jour standard pour les autres types
          await updateDoc(docRef, finalWidgetData);
          console.log('Élément mis à jour:', targetId);
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
        else if (formData.type === 'natinotes') successMessage = 'Notes des joueur·euse·s modifiées avec succès !';
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
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'calendar' && (
          <CalendarForm
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'teaser' && (
          <TeaserForm
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'folder' && (
          <FolderForm
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'tinder' && (
          <TinderForm
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'quiz' && (
          <QuizForm
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'testimony' && (
          <TestimonyForm
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'potm' && (
          <PotmForm
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'natinotes' && (
          <NatinotesForm
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'prono' && (
          <PronoForm
            currentEmbed={legacyEmbed}
            formMode={formMode}
            onChange={handleFormDataChange}
          />
        )}

        {formType === 'facts' && (
          <FactsForm
            currentEmbed={legacyEmbed}
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
