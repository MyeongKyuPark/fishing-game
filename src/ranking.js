import {
  doc, collection, query, orderBy, limit, setDoc,
  onSnapshot, serverTimestamp, runTransaction, addDoc,
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

// Save overall best catch (best per player per species, stored flat for cross-species ranking)
export async function saveOverallFishRecord(nickname, fishName, size, rarity) {
  const docId = `${encodeURIComponent(nickname)}_${encodeURIComponent(fishName)}`;
  const ref = doc(db, 'best_catches', docId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().size < size) {
        tx.set(ref, { nickname, fishName, size, rarity, caughtAt: serverTimestamp() });
      }
    });
  } catch (e) {
    console.warn('overall fish record save failed', e);
  }
}

// Subscribe to top 30 overall catches ordered by size desc
export function subscribeOverallFishRankings(callback) {
  const q = query(
    collection(db, 'best_catches'),
    orderBy('size', 'desc'),
    limit(30),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, err => console.warn('overall ranking subscribe error', err));
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

// Broadcast a server-wide announcement
export async function broadcastAnnouncement(message, type = 'fish') {
  try {
    await addDoc(collection(db, 'announcements'), {
      message, type,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('broadcast failed', e);
  }
}

// Subscribe to recent announcements (last 60 seconds)
export function subscribeAnnouncements(callback) {
  const q = query(
    collection(db, 'announcements'),
    orderBy('createdAt', 'desc'),
    limit(10),
  );
  return onSnapshot(q, snap => {
    const now = Date.now();
    const recent = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(a => {
        if (!a.createdAt) return false;
        try { return now - a.createdAt.toMillis() < 60000; }
        catch { return false; }
      });
    callback(recent);
  }, () => {});
}

// Increment a server-wide stat counter
export async function incrementServerStat(field, amount = 1) {
  const ref = doc(db, 'server_stats', 'global');
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data()[field] ?? 0) : 0;
      tx.set(ref, { [field]: current + amount }, { merge: true });
    });
  } catch (e) { console.warn('server stat increment failed', e); }
}

// Subscribe to server-wide stats
export function subscribeServerStats(callback) {
  return onSnapshot(doc(db, 'server_stats', 'global'), snap => {
    callback(snap.exists() ? snap.data() : {});
  }, () => {});
}
