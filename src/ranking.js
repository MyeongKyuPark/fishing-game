import {
  doc, collection, query, orderBy, limit, setDoc,
  onSnapshot, serverTimestamp, runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';

// Save personal best for a specific fish species (subcollection per species)
export async function saveFishRecord(nickname, fishName, size) {
  const ref = doc(db, 'fish_records', fishName, 'top', nickname);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().size < size) {
        tx.set(ref, { nickname, size, caughtAt: serverTimestamp() });
      }
    });
  } catch (e) {
    console.warn('fish record save failed', e);
  }
}

// Subscribe to top 10 for a specific fish species, ordered by size desc
export function subscribeFishRankings(fishName, callback) {
  const q = query(
    collection(db, 'fish_records', fishName, 'top'),
    orderBy('size', 'desc'),
    limit(10),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, err => console.warn('fish ranking subscribe error', err));
}

// Save player title record (upsert by nickname)
export async function savePlayerTitle(nickname, titleLabel, titleColor, titleIndex) {
  try {
    await setDoc(doc(db, 'title_records', nickname), {
      nickname, titleLabel, titleColor, titleIndex,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('title record save failed', e);
  }
}

// Subscribe to top 30 players ordered by title index desc
export function subscribePlayerTitleRankings(callback) {
  const q = query(
    collection(db, 'title_records'),
    orderBy('titleIndex', 'desc'),
    limit(30),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, err => console.warn('title ranking subscribe error', err));
}
