import React, { useState, useCallback, useMemo } from 'react';
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
import NatinotesForm from './NatinotesForm';
import { collection, addDoc, updateDoc, doc, serverTimestamp, runTransaction, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@rms/services';
import {
  transformWidgetData,
  validatePoll, buildPollSaveData,
  validateCalendar, buildCalendarSaveData,
  validateTinder, buildTinderSaveData,
  validateQuiz, buildQuizSaveData,
  validateTeaser, buildTeaserSaveData,
  validateFolder, buildFolderSaveData, FOLDER_LABEL_COLORS,
  validateNatinotes, buildNatinotesSaveData,
  validatePotm, buildPotmSaveData, POTM_POSITIONS, potmPositionForCategory,
  validateFacts, buildFactsSaveData, FACTS_ITEM_FIELDS,
  validateProno, buildPronoSaveData,
  validateTestimony, buildTestimonySaveData
} from '@rms/widget-model';
import { getAuth } from 'firebase/auth';

/**
 * Intitulé affiché par FactsForm pour le champ `key` d'un fait marquant (sert à surligner le champ
 * fautif d'une erreur `items[i].<key>`) ; `null` si ce type n'affiche pas ce champ.
 */
function factsItemLabel(item, key) {
  const type = item?.type;
  if (key === 'type') return 'Type';
  if (!FACTS_ITEM_FIELDS[type]?.includes(key)) return null;
  switch (key) {
    case 'icon': return 'Icône';
    case 'title': return type === 'rating' ? 'Question posée' : 'Titre';
    case 'text': return type === 'quote' ? 'Citation' : type === 'number' ? 'Description' : 'Contenu';
    case 'author': return 'Auteur de la citation';
    case 'caption': return 'Crédit';
    case 'src': return 'Image';
    case 'picture': return 'Personne détourée';
    case 'value': return 'Le chiffre';
    default: return null;
  }
}

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
        el.classList.add('text-ink');
      });
      formElement.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500', 'focus:ring-red-500');
        el.classList.add('border-line-strong', 'focus:ring-accent');
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
        targetLabel.classList.remove('text-ink', 'text-muted');
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
          input.classList.remove('border-line-strong', 'focus:ring-accent');
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
        // Validation et préparation partagées avec l'API (@rms/widget-model).
        // Options avancées des dates masquées (SHOW_ADVANCED_DATE_OPTIONS) : transmises pour
        // conserver celles d'un calendrier existant, sans validation propre au formulaire.
        const calendarInput = {
          theme: formData.theme,
          title: formData.calName,
          dates: (formData.dates || []).map(d => ({
            text: d.text,
            complement: d.complement,
            start: d.date ? new Date(d.date) : null,
            end: d.endDate ? new Date(d.endDate) : null,
            showBadge: d.showBadge === true,
            liveLinkEnabled: d.liveLinkEnabled === true,
            liveLinkUrl: d.liveLinkUrl || ''
          })),
          nbElemsToShow: (!formData.nbElements || formData.nbElements === 'tous') ? undefined : Number(formData.nbElements),
          linkGlobal: { text: formData.linkGlobalTxt, href: formData.linkGlobalHref, newTab: !!formData.linkGlobalNewTab },
          brand: formData.brand
        };
        const [firstError] = validateCalendar(calendarInput);
        if (firstError) {
          const dateMatch = firstError.field.match(/^dates\[(\d+)\](?:\.(\w+))?$/);
          const calendarFieldLabels = {
            theme: 'Rubrique',
            title: 'Wording du calendrier',
            dates: 'Dates',
            nbElemsToShow: 'Nb. d\'éléments affichés',
            'linkGlobal.href': 'Url du lien global',
            'linkGlobal.text': 'Texte de lien global',
            brand: 'Brand'
          };
          if (dateMatch) {
            const n = Number(dateMatch[1]) + 1;
            triggerValidationError(dateMatch[2] === 'start' ? `Start de la date ${n}` : `Wording de la date ${n}`);
          } else {
            triggerValidationError(calendarFieldLabels[firstError.field] || 'Url du lien global');
          }
          return;
        }

        saveData = {
          ...buildCalendarSaveData(calendarInput, { toTimestamp: (d) => Timestamp.fromDate(d) }),
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
        // Validation et préparation partagées avec l'API (@rms/widget-model).
        // TeaserForm remonte le titre avec des `\n` littéraux : on rend les vrais retours à la ligne.
        const teaserInput = {
          theme: formData.theme,
          label: formData.teaserLabel,
          title: typeof formData.teaserTitle === 'string' ? formData.teaserTitle.replace(/\\n/g, '\n') : formData.teaserTitle,
          img: formData.img,
          button: { text: formData.linkGlobalTxt, href: formData.linkGlobalHref, newTab: !!formData.linkGlobalNewTab },
          brand: formData.brand
        };
        const [firstError] = validateTeaser(teaserInput);
        if (firstError) {
          const teaserFieldLabels = {
            theme: 'Rubrique',
            label: 'Label du teaser',
            title: 'Titre du teaser',
            img: 'Image du teaser',
            'button.text': 'Label du bouton',
            'button.href': 'Lien du bouton',
            'button.newTab': 'Ouvrir dans un nouvel onglet',
            brand: 'Brand'
          };
          triggerValidationError(teaserFieldLabels[firstError.field]);
          return;
        }

        saveData = {
          ...buildTeaserSaveData(teaserInput),
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        } else {
          // En édition, les compteurs existants viennent de Firestore (_originalStats)
          delete saveData.counterViews;
          delete saveData.counterClicks;
        }
        
      } else if (formData.type === 'folder') {
        // Validation et préparation partagées avec l'API (@rms/widget-model).
        // FolderForm remonte le titre avec des `\n` littéraux et la couleur en classe (`bg-brand`).
        const folderLabelColor = Object.keys(FOLDER_LABEL_COLORS).find((key) => FOLDER_LABEL_COLORS[key] === formData.folderLabelColor);
        const folderInput = {
          theme: formData.theme,
          label: formData.folderLabel,
          labelColor: formData.folderLabelColor ? (folderLabelColor ?? formData.folderLabelColor) : undefined,
          name: typeof formData.folderName === 'string' ? formData.folderName.replace(/\\n/g, '\n') : formData.folderName,
          img: formData.img,
          buttons: Array.isArray(formData.buttons)
            ? formData.buttons.map(b => ({ id: b.id, text: b.buttonTxt, href: b.buttonUrl, newTab: !!b.buttonOpensNewTab }))
            : formData.buttons,
          brand: formData.brand
        };
        const [firstError] = validateFolder(folderInput);
        if (firstError) {
          const buttonMatch = firstError.field.match(/^buttons\[(\d+)\](?:\.(\w+))?$/);
          const folderFieldLabels = {
            theme: 'Rubrique',
            label: 'Label du dossier',
            labelColor: 'Couleur du label',
            name: 'Titre du dossier',
            img: 'Image du dossier',
            buttons: 'Texte du bouton #1',
            brand: 'Brand'
          };
          if (buttonMatch) {
            const n = Number(buttonMatch[1]) + 1;
            triggerValidationError(buttonMatch[2] === 'href' ? `Url du bouton #${n}` : `Texte du bouton #${n}`);
          } else {
            triggerValidationError(folderFieldLabels[firstError.field]);
          }
          return;
        }

        const folderSaveData = buildFolderSaveData(folderInput);
        if (formMode === 'edit') {
          // Compteur par bouton : celui chargé avec le widget ; la transaction plus bas relit Firestore
          folderSaveData.buttons.forEach((button, index) => {
            button.buttonCounterClicks = formData.buttons[index].buttonCounterClicks || 0;
          });
        }
        saveData = {
          ...folderSaveData,
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };

        // L'auteur et le champ deleted ne sont définis que lors de la création
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
      } else if (formData.type === 'tinder') {
        // Validation et préparation partagées avec l'API (@rms/widget-model)
        const tinderInput = {
          theme: formData.theme,
          label: formData.tinderLabel,
          title: formData.tinderTitle,
          cards: Array.isArray(formData.tinderCards)
            ? formData.tinderCards.map(c => ({ id: c.id, label: c.tinderCardLabel, title: c.tinderCardTitle }))
            : formData.tinderCards,
          legend: formData.tinderLegend,
          tinderVotes: formData.tinderVotes,
          brand: formData.brand
        };
        const [firstError] = validateTinder(tinderInput);
        if (firstError) {
          const cardMatch = firstError.field.match(/^cards\[(\d+)\](?:\.(\w+))?$/);
          const tinderFieldLabels = {
            theme: 'Rubrique',
            label: 'Label du Tinder',
            title: 'Titre du Tinder',
            cards: 'Label de la carte #1',
            legend: 'Légende',
            brand: 'Brand'
          };
          if (cardMatch) {
            const n = Number(cardMatch[1]) + 1;
            triggerValidationError(cardMatch[2] === 'title' ? `Titre de la carte #${n}` : `Label de la carte #${n}`);
          } else {
            triggerValidationError(tinderFieldLabels[firstError.field]);
          }
          return;
        }

        saveData = {
          ...buildTinderSaveData(tinderInput),
          counterViews: formMode === 'create' ? 0 : (formData.counterViews ?? 0),
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
          timeUpdated: serverTimestamp()
        };
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
      } else if (formData.type === 'quiz') {
        // Validation et préparation partagées avec l'API (@rms/widget-model).
        // Les compteurs par id produits ici sont fusionnés avec Firestore en édition (transaction plus bas).
        const quizInput = {
          theme: formData.theme,
          title: formData.title,
          questions: formData.questions,
          conclusion: formData.conclusion,
          brand: formData.brand
        };
        const [firstError] = validateQuiz(quizInput);
        if (firstError) {
          const { field } = firstError;
          const questionMatch = field.match(/^questions\[(\d+)\](.*)$/);
          const quizFieldLabels = {
            theme: 'Rubrique',
            title: 'Titre du quiz',
            questions: 'Texte de la question #1',
            'conclusion.text1': 'Score : 0% - 33%',
            'conclusion.text2': 'Score : 34% - 66%',
            'conclusion.text3': 'Score : 67% - 100%',
            brand: 'Brand'
          };
          if (questionMatch) {
            const n = Number(questionMatch[1]) + 1;
            const rest = questionMatch[2];
            const answerMatch = rest.match(/^\.answers\[(\d+)\]/);
            if (answerMatch) {
              triggerValidationError(`Réponse ${Number(answerMatch[1]) + 1} de la question #${n}`);
            } else if (rest === '.answers') {
              triggerValidationError(`Réponse 1 de la question #${n}`);
            } else if (rest === '.correctAnswer') {
              triggerValidationError(`Réponses possibles (Cochez la réponse correcte) #${n}`);
            } else {
              triggerValidationError(`Texte de la question #${n}`);
            }
          } else {
            triggerValidationError(quizFieldLabels[field]);
          }
          return;
        }

        saveData = {
          ...buildQuizSaveData(quizInput),
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
        };
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
        // Toujours mettre à jour timeUpdated
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'testimony') {
        // Validation et préparation partagées avec l'API (@rms/widget-model). La date limite
        // (datetime-local) est lue à l'heure du navigateur, comme avant.
        const testimonyInput = {
          theme: formData.theme,
          title: formData.title,
          subject: formData.subject,
          question: formData.question,
          timeExpires: typeof formData.timeExpires === 'string' && formData.timeExpires.trim() !== ''
            ? new Date(formData.timeExpires)
            : undefined,
          brand: formData.brand
        };
        const [firstError] = validateTestimony(testimonyInput);
        if (firstError) {
          const testimonyFieldLabels = { theme: 'Rubrique', title: 'Titre de la box', subject: 'Sujet', question: 'Question', timeExpires: 'Date limite de réponse', brand: 'Brand' };
          triggerValidationError(testimonyFieldLabels[firstError.field]);
          return;
        }

        const testimonySaveData = buildTestimonySaveData(testimonyInput, { toTimestamp: (d) => Timestamp.fromDate(d) });
        saveData = {
          ...testimonySaveData,
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
        };
        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        } else {
          // En édition, les compteurs restent ceux de Firestore (_originalStats)
          delete saveData.counterViews;
          delete saveData.counterMsgSent;
        }
        // Toujours mettre à jour timeUpdated
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'potm') {
        // Validation et préparation partagées avec l'API (@rms/widget-model).
        // PotmForm remonte le poste déjà accordé (« Attaquante ») : on repasse au poste neutre,
        // `buildPotmSaveData` l'accorde de nouveau selon la catégorie.
        const potmContext = formData.context || {};
        const potmDate = typeof potmContext.date === 'string' && potmContext.date.trim() !== ''
          ? new Date(potmContext.date + 'T12:00:00')
          : undefined;
        const potmInput = {
          theme: formData.theme,
          context: potmContext.context,
          category: potmContext.category,
          text: potmContext.text,
          date: potmDate,
          players: Array.isArray(formData.players)
            ? formData.players.map((player) => ({
              id: player.id,
              name: player.name,
              position: POTM_POSITIONS.find((position) => potmPositionForCategory(position, 'Dames') === player.position) || player.position,
              team: player.team
            }))
            : formData.players,
          brand: formData.brand
        };
        const [firstError] = validatePotm(potmInput);
        if (firstError) {
          const playerMatch = firstError.field.match(/^players\[(\d+)\](?:\.(\w+))?$/);
          const potmFieldLabels = { theme: 'Rubrique', context: 'Contexte', category: 'Catégorie', text: 'Label du match', date: 'Date du match', players: 'Candidats', brand: 'Brand' };
          if (playerMatch && playerMatch[2] === 'position') {
            triggerValidationError('Position', undefined, Number(playerMatch[1]));
          } else if (playerMatch && playerMatch[2] === 'team') {
            triggerValidationError('Équipe', undefined, Number(playerMatch[1]));
          } else if (playerMatch) {
            triggerValidationError(`Nom du joueur #${Number(playerMatch[1]) + 1}`);
          } else {
            triggerValidationError(potmFieldLabels[firstError.field]);
          }
          return;
        }

        const potmSaveData = buildPotmSaveData(potmInput, { toTimestamp: (d) => Timestamp.fromDate(d) });
        if (formMode === 'edit') {
          // Votes par candidat : ceux chargés avec le widget ; la transaction plus bas relit Firestore
          potmSaveData.players.forEach((player, index) => {
            player.votes = formData.players[index].votes || 0;
          });
        }
        saveData = {
          ...potmSaveData,
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
        // Validation et préparation partagées avec l'API (@rms/widget-model). L'identité des joueurs
        // (nom, équipe, portrait, cadrage) est recopiée des effectifs chargés par NatinotesForm ; en
        // édition, les joueurs déjà enregistrés restent admis (même archivés) avec leur instantané.
        const natinotesInput = {
          theme: formData.theme,
          title: formData.title,
          // `label` n'est plus saisi ; on préserve celui des widgets déjà publiés
          label: formData.label ?? legacyEmbed?.label,
          players: Array.isArray(formData.players)
            ? formData.players.map((player) => ({
              id: player.id,
              blickRating: player.blickRating === '' || player.blickRating == null ? undefined : Number(player.blickRating),
              comment: player.comment
            }))
            : formData.players,
          showRecap: formData.showRecap !== false,
          brand: formData.brand
        };
        const natinotesDeps = {
          teams: formData.teams || [],
          previousPlayers: formMode === 'edit' ? (legacyEmbed?.players || []) : []
        };
        const [firstError] = validateNatinotes(natinotesInput, natinotesDeps);
        if (firstError) {
          // `index` cible le label du joueur fautif (les cartes partagent les mêmes intitulés)
          const playerMatch = firstError.field.match(/^players\[(\d+)\](?:\.(\w+))?$/);
          const natinotesFieldLabels = { theme: 'Rubrique', title: 'Événement', players: 'Ajouter des joueurs', showRecap: 'Récap des avis', brand: 'Brand' };
          if (playerMatch && playerMatch[2] === 'blickRating') {
            triggerValidationError('Note Blick', undefined, Number(playerMatch[1]));
          } else if (playerMatch && playerMatch[2] === 'comment') {
            triggerValidationError('Paragraphe', undefined, Number(playerMatch[1]));
          } else if (playerMatch) {
            // Joueur inconnu, archivé ou en double (le picker les écarte déjà à la saisie)
            triggerValidationError('Ajouter des joueurs');
          } else {
            triggerValidationError(natinotesFieldLabels[firstError.field]);
          }
          return;
        }

        saveData = {
          ...buildNatinotesSaveData(natinotesInput, natinotesDeps),
          counterViews: formMode === 'create' ? 0 : (legacyEmbed?.counterViews || 0),
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'prono') {
        // Validation et préparation partagées avec l'API (@rms/widget-model). Les couleurs des
        // barres choisies dans PronoForm remplacent celles des équipes (teams.json).
        const pronoData = formData.pronoData || {};
        const pronoInput = {
          theme: formData.theme,
          event: pronoData.event,
          date: pronoData.date || undefined,
          team1: pronoData.item1?.name,
          team2: pronoData.item2?.name,
          color1: pronoData.item1?.color,
          color2: pronoData.item2?.color,
          brand: formData.brand
        };
        const [firstError] = validateProno(pronoInput);
        if (firstError) {
          const pronoFieldLabels = { theme: 'Rubrique', event: 'Contexte', date: 'Date', team1: 'Équipe 1', team2: 'Équipe 2', brand: 'Brand' };
          if (firstError.field === 'color1' || firstError.field === 'color2') {
            triggerValidationError('Couleur de la barre', undefined, firstError.field === 'color1' ? 0 : 1);
          } else {
            triggerValidationError(pronoFieldLabels[firstError.field]);
          }
          return;
        }

        const pronoSaveData = buildPronoSaveData(pronoInput, { toTimestamp: (d) => Timestamp.fromDate(d) });
        if (formMode === 'edit') {
          // Votes chargés avec le widget ; la transaction plus bas relit Firestore
          ['item1', 'item2', 'item3'].forEach((key) => {
            pronoSaveData.pronoData[key].votes = pronoData[key]?.votes || 0;
          });
        }
        saveData = {
          ...pronoSaveData,
          counterViews: formMode === 'create' ? 0 : (legacyEmbed?.counterViews || 0),
          timeCreated: formMode === 'create' ? serverTimestamp() : legacyEmbed.timeCreated,
        };

        if (formMode === 'create') {
          saveData.author = currentUser.email;
          saveData.deleted = false;
        }
        saveData.timeUpdated = serverTimestamp();
      } else if (formData.type === 'facts') {
        // Validation et préparation partagées avec l'API (@rms/widget-model). FactsForm garde dans
        // chaque élément les champs des types essayés : seuls ceux du type choisi sont transmis.
        const factsFormData = formData.factsData || {};
        const factsItems = Array.isArray(factsFormData.items)
          ? factsFormData.items.map((item) => {
            const fields = FACTS_ITEM_FIELDS[item?.type];
            if (!fields) return item;
            const input = { id: item.id, type: item.type };
            fields.forEach((key) => {
              if (key === 'value') input.value = item.value === '' || item.value == null ? undefined : Number(item.value);
              else input[key] = item[key];
            });
            return input;
          })
          : factsFormData.items;
        const factsInput = {
          theme: formData.theme,
          title: factsFormData.rencontre,
          date: typeof factsFormData.date === 'string' && factsFormData.date.trim() !== ''
            ? new Date(factsFormData.date + 'T12:00:00')
            : undefined,
          items: factsItems,
          // ratingStats chargées avec le widget (ou `null` si la note du match a été retirée)
          ratingStats: formData.ratingStats !== undefined ? formData.ratingStats : formData.voteStats,
          brand: formData.brand
        };
        const [firstError] = validateFacts(factsInput);
        if (firstError) {
          const itemMatch = firstError.field.match(/^items\[(\d+)\](?:\.(\w+))?$/);
          const factsFieldLabels = { theme: 'Rubrique', title: 'Rencontre', date: 'Date', items: 'Faits marquants', brand: 'Brand' };
          if (itemMatch && itemMatch[2]) {
            // Les éléments partagent les mêmes intitulés : on cible celui de l'élément fautif
            const index = Number(itemMatch[1]);
            const label = factsItemLabel(factsItems[index], itemMatch[2]);
            const occurrence = factsItems.slice(0, index).filter((item) => factsItemLabel(item, itemMatch[2]) === label).length;
            triggerValidationError(label || 'Faits marquants', undefined, label ? occurrence : 0);
          } else {
            triggerValidationError(itemMatch ? 'Faits marquants' : factsFieldLabels[firstError.field]);
          }
          return;
        }

        saveData = {
          ...buildFactsSaveData(factsInput, { toTimestamp: (d) => Timestamp.fromDate(d) }),
          counterViews: formMode === 'create' ? 0 : (legacyEmbed?.counterViews || 0)
        };

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
    <div id="form" className={s.form + (formVisible ? ' ' + s.isVisible : '') + ' max-w-4xl w-full h-auto overflow-y-auto fixed top-1/2 left-1/2 bg-surface border border-line rounded-lg shadow-pop z-40 flex flex-col'}>
      {/* En-tête avec titre et bouton fermer */}
      <div className="flex justify-between items-center pl-6 pr-3 py-2 border-b border-line">
        <h2 className="title-lg text-ink m-0">{getFormTitle()}</h2>
        <button 
          onClick={handleClose}
          className="w-11 h-11 flex items-center justify-center rounded-pill text-muted hover:text-ink hover:bg-ground text-2xl transition-colors"
          type="button"
          aria-label="Fermer"
          title="Fermer"
          disabled={isLoading}
        >
          ×
        </button>
      </div>

      <div className="p-6">

        {/* Debug info (visible uniquement en mode développeur) */}
        {devMode && (
          <div className="mb-4 p-2 bg-ground text-xs">
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
            className="w-1/2 h-11 px-4 text-ink font-medium bg-surface border border-line rounded-pill hover:bg-ground"
            disabled={isLoading || isSuccess}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className={`w-1/2 h-11 rounded-pill font-semibold transition-all duration-300 ${
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
