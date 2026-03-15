import {
  doc, setDoc, collection, query,
  orderBy, limit, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export async function saveRanking(nickname, money, fishCaught) {
  try {
    await setDoc(doc(db, 'rankings', nickname), {
      nickname,
      money,
      fishCaught,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('ranking save failed', e);
  }
}

// Returns unsubscribe fn. Calls callback with array of { nickname, money, fishCaught, updatedAt }
export function subscribeRankings(callback) {
  const q = query(
    collection(db, 'rankings'),
    orderBy('money', 'desc'),
    limit(20),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data()));
  }, (err) => {
    console.warn('ranking subscribe error', err);
  });
}
