// filepath: /Users/gre/Documents/___www/bl-tool-calendar-r/src/api.js
import { db } from './firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

export function listenToEmbeds(callback) {
  const embedsCol = collection(db, 'embeds');
  return onSnapshot(embedsCol, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}

export async function fetchData() {
  // devMode doit être passé en paramètre
  try {
    const embedsCol = collection(db, 'embeds');
    const snapshot = await getDocs(embedsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
}