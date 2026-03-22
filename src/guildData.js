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

// ── Guild Level & Warehouse ────────────────────────────────────────────────────

/**
 * Guild level thresholds (cumulative XP needed to reach level N)
 * Level 1: 0, Level 2: 100, Level 3: 300, Level 4: 700, Level 5: 1500
 */
export const GUILD_LEVEL_XP = [0, 100, 300, 700, 1500];

/** Max warehouse slots per guild level (index = level - 1) */
export const GUILD_WAREHOUSE_SLOTS = [4, 8, 12, 16, 20];

/** Guild level bonuses per level (index = level - 1) */
export const GUILD_LEVEL_BONUSES = [
  { label: '창고 4슬롯' },
  { label: '창고 8슬롯 + 판매가 +3%' },
  { label: '창고 12슬롯 + 낚시 속도 +5%' },
  { label: '창고 16슬롯 + 채굴 속도 +5%' },
  { label: '창고 20슬롯 + 모든 보너스 +5% 추가' },
];

/** Contribute XP to guild (increments xp and auto-calculates level) */
export async function contributeGuildXP(guildId, amount = 1) {
  const ref = doc(db, 'guilds', guildId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      const newXP = (data.xp ?? 0) + amount;
      let level = 1;
      for (let i = GUILD_LEVEL_XP.length - 1; i >= 0; i--) {
        if (newXP >= GUILD_LEVEL_XP[i]) { level = i + 1; break; }
      }
      tx.update(ref, { xp: newXP, level });
    });
  } catch (e) { console.warn('guild xp failed', e); }
}

/** Fetch guild warehouse items */
export async function fetchGuildWarehouse(guildId) {
  try {
    const snap = await getDoc(doc(db, 'guild_warehouse', guildId));
    return snap.exists() ? (snap.data().items ?? []) : [];
  } catch (e) { console.warn('warehouse fetch failed', e); return []; }
}

/** Add item to guild warehouse (max slots based on guild level) */
export async function addToGuildWarehouse(guildId, guildLevel, fromNickname, item) {
  const maxSlots = GUILD_WAREHOUSE_SLOTS[Math.min(guildLevel - 1, GUILD_WAREHOUSE_SLOTS.length - 1)] ?? 4;
  const ref = doc(db, 'guild_warehouse', guildId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists() ? (snap.data().items ?? []) : [];
      if (existing.length >= maxSlots) throw new Error('창고가 가득 찼습니다.');
      const newItem = { ...item, addedBy: fromNickname, addedAt: Date.now() };
      tx.set(ref, { items: [...existing, newItem] }, { merge: false });
    });
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

/** Remove item from guild warehouse by index (take item) */
export async function removeFromGuildWarehouse(guildId, itemIndex) {
  const ref = doc(db, 'guild_warehouse', guildId);
  try {
    let removed = null;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const items = [...(snap.data().items ?? [])];
      if (itemIndex < 0 || itemIndex >= items.length) return;
      [removed] = items.splice(itemIndex, 1);
      tx.set(ref, { items }, { merge: false });
    });
    return { ok: true, item: removed };
  } catch (e) { return { ok: false, err: e.message }; }
}

/** Subscribe to guild warehouse */
export function subscribeGuildWarehouse(guildId, callback) {
  return onSnapshot(doc(db, 'guild_warehouse', guildId), snap => {
    callback(snap.exists() ? (snap.data().items ?? []) : []);
  }, () => callback([]));
}
