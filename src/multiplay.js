import {
  doc, setDoc, deleteDoc, collection,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export async function updatePlayerPresence(nickname, x, y, state, facing, rod) {
  try {
    await setDoc(doc(db, 'players', nickname), {
      nickname, x, y, state, facing, rod,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('presence update failed', e);
  }
}

export async function removePlayerPresence(nickname) {
  try {
    await deleteDoc(doc(db, 'players', nickname));
  } catch (e) {
    console.warn('presence remove failed', e);
  }
}

// Returns unsubscribe fn. Filters out self and stale players (>30s).
export function subscribeOtherPlayers(myNickname, callback) {
  return onSnapshot(collection(db, 'players'), (snap) => {
    const now = Date.now();
    const players = snap.docs
      .map(d => d.data())
      .filter(p => p.nickname !== myNickname)
      .filter(p => !p.updatedAt || (now - p.updatedAt.toMillis()) < 30000);
    callback(players);
  }, err => console.warn('subscribe players error', err));
}
