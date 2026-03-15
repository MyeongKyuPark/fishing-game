import {
  doc, setDoc, deleteDoc, collection,
  onSnapshot, serverTimestamp, query, where,
} from 'firebase/firestore';
import { db } from './firebase';

export async function updatePlayerPresence(nickname, roomId, x, y, state, facing, rod, info = {}) {
  try {
    await setDoc(doc(db, 'players', `${roomId}_${nickname}`), {
      nickname, roomId, x, y, state, facing, rod,
      ...info,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('presence update failed', e);
  }
}

export async function removePlayerPresence(nickname, roomId) {
  try {
    await deleteDoc(doc(db, 'players', `${roomId}_${nickname}`));
  } catch (e) {
    console.warn('presence remove failed', e);
  }
}

// Subscribe to other players in the same room, excluding self, filtering stale (>30s)
export function subscribeOtherPlayers(myNickname, roomId, callback) {
  const q = query(collection(db, 'players'), where('roomId', '==', roomId));
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const players = snap.docs
      .map(d => d.data())
      .filter(p => p.nickname !== myNickname)
      .filter(p => {
        if (!p.updatedAt) return true;
        try { return (now - p.updatedAt.toMillis()) < 30000; }
        catch { return true; }
      });
    callback(players);
  }, err => console.warn('subscribe players error', err));
}
