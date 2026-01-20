// // filepath: /Users/gre/Documents/___www/bl-tool-calendar-r/src/api.js
// import { db } from './firebase';
// import { collection, getDocs, onSnapshot } from 'firebase/firestore';

// export function listenToEmbeds(callback) {
//   const embedsCol = collection(db, 'embeds');
//   return onSnapshot(embedsCol, (snapshot) => {
//     const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     callback(data);
//   });
// }

// export async function fetchData() {
//   // devMode doit être passé en paramètre
//   try {
//     const embedsCol = collection(db, 'embeds');
//     const snapshot = await getDocs(embedsCol);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//   } catch (error) {
//     throw error;
//   }
// }


// filepath: /Users/gre/Documents/___www/bl-tool-calendar-r/src/api.js
import { db } from './firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

/**
 * Écoute en temps réel la collection 'embeds'
 * Utilise Firestore déjà configuré avec long polling pour éviter les blocages WebSocket
 */
export function listenToEmbeds(callback) {
  try {
    const embedsCol = collection(db, 'embeds');
    // onSnapshot utilisera le fallback HTTP si WebSocket est bloqué
    return onSnapshot(
      embedsCol,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      },
      (error) => {
        console.error('Erreur lors de l’écoute Firestore :', error);
      }
    );
  } catch (err) {
    console.error('Impossible de démarrer l’écoute Firestore :', err);
  }
}

/**
 * Récupère la collection 'embeds' une seule fois 
 */
export async function fetchData() {
  try {
    const embedsCol = collection(db, 'embeds');
    const snapshot = await getDocs(embedsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erreur lors du fetch Firestore :', error);
    throw error;
  }
}
