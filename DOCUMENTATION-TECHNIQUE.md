# 🛠️ Documentation Technique - Blick Tools Dashboard

## 📋 Table des matières

1. [Architecture générale](#architecture-générale)
2. [Technologies utilisées](#technologies-utilisées)
3. [Structure du projet](#structure-du-projet)
4. [Configuration Firebase](#configuration-firebase)
5. [Composants React](#composants-react)
6. [Gestion d'état](#gestion-détat)
7. [Base de données Firestore](#base-de-données-firestore)
8. [Installation et développement](#installation-et-développement)
9. [API et services](#api-et-services)
10. [Tests et déploiement](#tests-et-déploiement)

## 🏗️ Architecture générale

### Vue d'ensemble
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │◄──►│   Firebase      │◄──►│   Firestore     │
│   (Frontend)    │    │   (Auth)        │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Flux de données
1. **Authentification** : Firebase Auth gère la connexion utilisateur
2. **State Management** : React hooks pour l'état local et global
3. **Temps réel** : Firestore onSnapshot pour les mises à jour live
4. **Formulaires** : Composants contrôlés avec validation
5. **Actions** : CRUD operations via Firebase SDK

## 💻 Technologies utilisées

### Frontend
- **React 18** - Library UI avec hooks
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Framework CSS utility-first
- **SCSS** - Préprocesseur CSS pour les modules

### Backend/Services
- **Firebase Auth** - Authentification email/password
- **Firestore** - Base de données NoSQL temps réel
- **Firebase SDK** - Client JavaScript

### Outils de développement
- **ESLint** - Linting JavaScript/React
- **PostCSS** - Traitement CSS
- **Git** - Contrôle de version

## 📁 Structure du projet

```
bl-tool-backend-r/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   ├── fonts/          # Polices personnalisées
│   │   └── img/            # Icônes et images
│   ├── components/
│   │   ├── BlackOverlay/   # Overlay modal
│   │   ├── Calendar/       # Composants calendrier
│   │   ├── Form/           # Formulaires
│   │   │   ├── Form.jsx          # Orchestrateur principal
│   │   │   ├── PollForm.jsx      # Formulaire sondage
│   │   │   └── CalendarForm.jsx  # Formulaire calendrier
│   │   ├── Header/         # En-tête navigation
│   │   ├── ListItem/       # Élément de liste
│   │   ├── LoadingOverlay/ # Écran de chargement
│   │   └── Login/          # Authentification
│   ├── services/
│   │   ├── analytics.js    # Analytics (à venir)
│   │   ├── api.js          # API Firestore
│   │   └── firebase.js     # Configuration Firebase
│   ├── styles/
│   │   ├── _fonts.scss     # Import polices
│   │   └── _variables.scss # Variables SCSS
│   ├── App.jsx             # Composant racine
│   ├── App.scss            # Styles globaux
│   └── main.jsx            # Point d'entrée
├── eslint.config.js        # Configuration ESLint
├── package.json            # Dépendances npm
├── postcss.config.cjs      # Configuration PostCSS
├── tailwind.config.js      # Configuration Tailwind
├── vite.config.js          # Configuration Vite
└── README.md               # Documentation projet
```

## 🔥 Configuration Firebase

### Setup initial
```javascript
// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Configuration Firebase
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Authentification
```javascript
// Connexion
import { signInWithEmailAndPassword } from 'firebase/auth';

// Écoute des changements d'état
import { onAuthStateChanged } from 'firebase/auth';
onAuthStateChanged(auth, (user) => {
  setUser(user);
});
```

### Firestore operations
```javascript
// Lecture temps réel
import { onSnapshot, collection } from 'firebase/firestore';
onSnapshot(collection(db, 'embeds'), (snapshot) => {
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
});

// Écriture
import { addDoc, updateDoc } from 'firebase/firestore';
await addDoc(collection(db, 'embeds'), data);
await updateDoc(doc(db, 'embeds', id), data);
```

## ⚛️ Composants React

### Hiérarchie des composants
```
App
├── Header (navigation, filtres)
├── BlackOverlay (modal overlay)
├── Form (orchestrateur formulaires)
│   ├── PollForm (sondages)
│   └── CalendarForm (calendriers)
└── ListItem (éléments liste)
```

### App.jsx - Composant racine
```javascript
// States principaux
const [user, setUser] = useState(null);
const [embeds, setEmbeds] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [typeFilter, setTypeFilter] = useState('all');
const [formVisible, setFormVisible] = useState(false);

// Gestion formulaire
const [formMode, setFormMode] = useState(null); // 'create' | 'edit'
const [formType, setFormType] = useState(null); // 'poll' | 'calendar'
const [currentEmbed, setCurrentEmbed] = useState(null);
```

### Form.jsx - Orchestrateur formulaires
**Props :**
- `formVisible` : boolean - Visibilité du formulaire
- `formMode` : string - Mode création/édition
- `formType` : string - Type poll/calendar
- `currentEmbed` : object - Données à éditer
- `onClose` : function - Callback fermeture

**Responsabilités :**
- Gestion du titre dynamique
- Validation des données
- Sauvegarde Firestore
- Orchestration des sous-formulaires

### PollForm.jsx - Formulaire sondages
**States :**
```javascript
const [pollTxt, setPollTxt] = useState('');
const [answers, setAnswers] = useState([
  { answerTxt: '', answerCounter: 0 },
  { answerTxt: '', answerCounter: 0 }
]);
```

**Validation :**
- Question obligatoire
- Minimum 2 réponses non vides
- Suppression automatique des réponses vides

### CalendarForm.jsx - Formulaire calendriers
**States :**
```javascript
const [calName, setCalName] = useState('');
const [dates, setDates] = useState([{ text: '', date: '' }]);
const [linkGlobalTxt, setLinkGlobalTxt] = useState('');
const [linkGlobalHref, setLinkGlobalHref] = useState('');
const [linkGlobalNewTab, setLinkGlobalNewTab] = useState(false);
```

**Fonctionnalités :**
- Gestion dynamique des dates
- Réorganisation par drag & drop virtuel
- Lien global optionnel

### ListItem.jsx - Élément de liste
**Props :**
- `embed` : object - Données de l'élément
- `onEdit` : function - Callback édition
- Icons pour les actions

**Actions :**
- Copie de l'ID
- Édition
- Suppression logique

## 🔄 Gestion d'état

### États globaux (App.jsx)
```javascript
// Authentification
const [user, setUser] = useState(null);

// Données
const [embeds, setEmbeds] = useState([]);

// Filtrage
const [searchTerm, setSearchTerm] = useState('');
const [typeFilter, setTypeFilter] = useState('all');

// Interface
const [formVisible, setFormVisible] = useState(false);
const [menuNewOpen, setMenuNewOpen] = useState(false);
```

### Filtrage des données
```javascript
const filteredEmbeds = embeds
  .filter(embed => !embed.deleted)
  .filter(embed => {
    // Filtre par type
    if (typeFilter !== 'all' && embed.type !== typeFilter) {
      return false;
    }
    
    // Filtre par recherche
    if (!searchTerm.trim()) return true;
    
    const title = embed.type === 'poll' 
      ? embed.pollTxt 
      : embed.calName;
    
    return title?.toLowerCase().includes(searchTerm.toLowerCase());
  })
  .sort((a, b) => b.timeCreated - a.timeCreated);
```

### Communication parent-enfant
- **Props down** : Données et callbacks
- **Callbacks up** : Actions et changements d'état
- **useCallback** : Optimisation des re-renders

## 🗄️ Base de données Firestore

### Collection : `embeds`

#### Structure commune
```javascript
{
  id: "document_id", // Auto-généré
  type: "poll" | "calendar",
  author: "user@email.com",
  timeCreated: Timestamp,
  timeUpdated: Timestamp,
  deleted: boolean
}
```

#### Structure Poll
```javascript
{
  ...common,
  type: "poll",
  pollTxt: "Question du sondage",
  answers: [
    {
      answerTxt: "Réponse 1",
      answerCounter: 0
    },
    {
      answerTxt: "Réponse 2", 
      answerCounter: 0
    }
  ]
}
```

#### Structure Calendar
```javascript
{
  ...common,
  type: "calendar",
  calName: "Titre du calendrier",
  dates: [
    {
      text: "Description événement",
      date: "2025-07-15"
    }
  ],
  linkGlobalTxt: "Texte du lien",
  linkGlobalHref: "https://example.com",
  linkGlobalNewTab: true
}
```

### Règles de sécurité Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /embeds/{document} {
      allow read, write: if request.auth != null;
      allow update: if request.auth != null 
        && resource.data.author == request.auth.token.email;
    }
  }
}
```

## 🚀 Installation et développement

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Firebase

### Installation
```bash
# Clone du repository
git clone <repository-url>
cd bl-tool-backend-r

# Installation des dépendances
npm install

# Configuration Firebase
# Créer src/services/firebase.js avec vos clés

# Démarrage du serveur de développement
npm run dev
```

### Scripts disponibles
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### Variables d'environnement
```bash
# .env.local
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... autres clés Firebase
```

## 📡 API et services

### services/api.js
```javascript
// Écoute temps réel des embeds
export const listenToEmbeds = (callback) => {
  return onSnapshot(collection(db, 'embeds'), (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
};

// Suppression logique
export const deleteEmbed = async (embedId) => {
  const docRef = doc(db, 'embeds', embedId);
  await updateDoc(docRef, { deleted: true });
};
```

### services/firebase.js
- Configuration Firebase
- Export des instances auth et db
- Initialisation de l'app

## 🧪 Tests et déploiement

### Tests
```bash
# Tests unitaires (à implémenter)
npm run test

# Tests e2e (à implémenter)  
npm run test:e2e
```

### Build de production
```bash
# Build optimisé
npm run build

# Preview du build
npm run preview
```

### Déploiement Firebase
```bash
# Installation Firebase CLI
npm install -g firebase-tools

# Login Firebase
firebase login

# Initialisation
firebase init hosting

# Déploiement
firebase deploy
```

## 🔧 Conventions de développement

### Nommage
- **Composants** : PascalCase (`ListItem.jsx`)
- **Fonctions** : camelCase (`handleSubmit`)
- **States** : camelCase (`formVisible`)
- **CSS Classes** : kebab-case (`form-container`)

### Structure des fichiers
```javascript
// Imports
import React from 'react';
import './Component.scss';

// Composant
function Component({ prop1, prop2 }) {
  // States
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {}, []);
  
  // Handlers
  const handleAction = () => {};
  
  // Render
  return <div></div>;
}

export default Component;
```

### Git Workflow
```bash
# Branches
main           # Production
develop        # Développement
feature/xxx    # Nouvelles fonctionnalités
fix/xxx        # Corrections de bugs

# Commits
feat: add new feature
fix: resolve bug
refactor: improve code structure
docs: update documentation
```

## 📈 Performance

### Optimisations React
- **useCallback** pour les fonctions
- **useMemo** pour les calculs coûteux
- **React.memo** pour les composants purs
- Lazy loading des composants

### Optimisations Firestore
- **onSnapshot** pour le temps réel
- **where** clauses pour filtrer
- Index composites pour les requêtes complexes
- Pagination pour les grandes listes

## 🐛 Debug et monitoring

### Outils de debug
- React DevTools
- Firebase Console
- Network tab pour Firestore
- Console.log stratégiques

### Monitoring erreurs
```javascript
// Error boundaries (à implémenter)
class ErrorBoundary extends React.Component {
  // Gestion des erreurs React
}

// Firebase monitoring
// Analytics et crash reporting
```

## 🔮 Évolutions futures

### Fonctionnalités prévues
- **Teasers** : Nouveau type d'embed
- **Analytics** : Statistiques d'utilisation
- **Partage** : URLs publiques des embeds
- **Templates** : Modèles prédéfinis
- **Collaboration** : Édition multi-utilisateur

### Améliorations techniques
- Tests automatisés
- CI/CD pipeline
- PWA capabilities
- Offline support
- Performance monitoring

---

*Documentation technique - Dernière mise à jour : Juillet 2025*
*Maintenue par : L'équipe de développement Blick Tools*
