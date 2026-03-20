// ── Guild System (길드 시스템) ──────────────────────────────────────────────

import {
  doc, collection, query, where, orderBy, limit,
  setDoc, deleteDoc, addDoc, getDoc, updateDoc,
  onSnapshot, serverTimestamp, runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';

/** Create a new guild */
export async function createGuild(guildId, name, master) {
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'guilds', guildId);
      const snap = await tx.get(ref);
      if (snap.exists()) throw new Error('이미 존재하는 길드 ID입니다.');
      tx.set(ref, { guildId, name, master, memberCount: 1, createdAt: serverTimestamp(), notice: '' });
    });
    // Add master as member
    await setDoc(doc(db, 'guild_members', `${guildId}_${master}`), {
      guildId, nickname: master, role: 'master', joinedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

/** Join an existing guild */
export async function joinGuild(guildId, nickname) {
  try {
    const guildRef = doc(db, 'guilds', guildId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(guildRef);
      if (!snap.exists()) throw new Error('존재하지 않는 길드입니다.');
      if (snap.data().memberCount >= 30) throw new Error('길드 정원이 가득 찼습니다. (최대 30명)');
      tx.update(guildRef, { memberCount: snap.data().memberCount + 1 });
    });
    await setDoc(doc(db, 'guild_members', `${guildId}_${nickname}`), {
      guildId, nickname, role: 'member', joinedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

/** Leave guild */
export async function leaveGuild(guildId, nickname) {
  try {
    await deleteDoc(doc(db, 'guild_members', `${guildId}_${nickname}`));
    const guildRef = doc(db, 'guilds', guildId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(guildRef);
      if (snap.exists()) {
        const newCount = Math.max(0, snap.data().memberCount - 1);
        if (newCount === 0) tx.delete(guildRef);
        else tx.update(guildRef, { memberCount: newCount });
      }
    });
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

/** Subscribe to guild info */
export function subscribeGuild(guildId, callback) {
  return onSnapshot(doc(db, 'guilds', guildId), snap => {
    callback(snap.exists() ? snap.data() : null);
  }, () => callback(null));
}

/** Subscribe to guild members */
export function subscribeGuildMembers(guildId, callback) {
  const q = query(collection(db, 'guild_members'), where('guildId', '==', guildId));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, () => callback([]));
}

/** Subscribe to guild list (top 20 by memberCount) */
export function subscribeGuildList(callback) {
  const q = query(collection(db, 'guilds'), orderBy('memberCount', 'desc'), limit(20));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, () => callback([]));
}

/** Send guild chat message */
export async function sendGuildChat(guildId, nickname, message) {
  try {
    await addDoc(collection(db, 'guild_chat'), {
      guildId, nickname, message, createdAt: serverTimestamp(),
    });
  } catch (e) { console.warn('guild chat failed', e); }
}

/** Subscribe to guild chat */
export function subscribeGuildChat(guildId, callback) {
  const q = query(
    collection(db, 'guild_chat'),
    where('guildId', '==', guildId),
    orderBy('createdAt', 'desc'),
    limit(30),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()).reverse());
  }, () => callback([]));
}

/** Contribute to guild quest */
export async function contributeGuildQuest(guildId, field, amount = 1) {
  const ref = doc(db, 'guild_quests', guildId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data()[field] ?? 0) : 0;
      tx.set(ref, { [field]: current + amount }, { merge: true });
    });
  } catch (e) { console.warn('guild quest contribute failed', e); }
}

/** Subscribe to guild quest progress */
export function subscribeGuildQuest(guildId, callback) {
  return onSnapshot(doc(db, 'guild_quests', guildId), snap => {
    callback(snap.exists() ? snap.data() : {});
  }, () => callback({}));
}

// ── Guild vs Guild Weekly Competition ─────────────────────────────────────────

/** Returns ISO week string like "2026-W12" */
function getGuildWeekKey(now = Date.now()) {
  const d = new Date(now);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Increment a guild's weekly competition score */
export async function incrementGuildWeeklyScore(guildId, amount = 1) {
  const week = getGuildWeekKey();
  const ref = doc(db, 'guild_competition', `${week}_${guildId}`);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data().score ?? 0) : 0;
      tx.set(ref, { guildId, week, score: current + amount }, { merge: false });
    });
  } catch (e) { console.warn('guild weekly score failed', e); }
}

/** Subscribe to top 20 guilds this week by score */
export function subscribeGuildCompetition(callback) {
  const week = getGuildWeekKey();
  const q = query(
    collection(db, 'guild_competition'),
    where('week', '==', week),
    orderBy('score', 'desc'),
    limit(20),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, () => callback([]));
}
