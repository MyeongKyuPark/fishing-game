import {
  doc, collection, query, orderBy, limit, setDoc, where,
  onSnapshot, serverTimestamp, runTransaction, addDoc, getDoc,
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

// Save player gold record (upsert)
export async function saveGoldRecord(nickname, money) {
  try {
    await setDoc(doc(db, 'gold_records', nickname), {
      nickname, money, updatedAt: serverTimestamp(),
    });
  } catch (e) { console.warn('gold record save failed', e); }
}

// Subscribe to top 30 gold holders
export function subscribeGoldRankings(callback) {
  const q = query(collection(db, 'gold_records'), orderBy('money', 'desc'), limit(30));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, err => console.warn('gold ranking error', err));
}

// Save player total ability record (upsert)
export async function saveAbilityRecord(nickname, totalAbility) {
  try {
    await setDoc(doc(db, 'ability_records', nickname), {
      nickname, totalAbility, updatedAt: serverTimestamp(),
    });
  } catch (e) { console.warn('ability record save failed', e); }
}

// Subscribe to top 30 ability holders
export function subscribeAbilityRankings(callback) {
  const q = query(collection(db, 'ability_records'), orderBy('totalAbility', 'desc'), limit(30));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, err => console.warn('ability ranking error', err));
}

// Save player achievement count record (upsert)
export async function saveAchievementRecord(nickname, achievementCount) {
  try {
    await setDoc(doc(db, 'achievement_records', nickname), {
      nickname, achievementCount, updatedAt: serverTimestamp(),
    });
  } catch (e) { console.warn('achievement record save failed', e); }
}

// Subscribe to top 30 achievement holders
export function subscribeAchievementRankings(callback) {
  const q = query(collection(db, 'achievement_records'), orderBy('achievementCount', 'desc'), limit(30));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, err => console.warn('achievement ranking error', err));
}

// ── Server Event Scheduler ────────────────────────────────────────────────────
// Subscribe to a single active server event (endsAt > now, active == true)
export function subscribeActiveServerEvent(callback) {
  const q = query(
    collection(db, 'server_events'),
    where('active', '==', true),
    orderBy('endsAt', 'desc'),
    limit(3),
  );
  return onSnapshot(q, snap => {
    const now = Date.now();
    const active = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(e => {
        try { return e.endsAt.toMillis() > now; }
        catch { return false; }
      });
    callback(active[0] ?? null);
  }, () => callback(null));
}

// Subscribe to server-wide stats
export function subscribeServerStats(callback) {
  return onSnapshot(doc(db, 'server_stats', 'global'), snap => {
    callback(snap.exists() ? snap.data() : {});
  }, () => {});
}

// ── Weekly Tournament ─────────────────────────────────────────────────────────

/** Returns ISO week string like "2026-W12" for deterministic weekly key */
export function getWeekKey(now = Date.now()) {
  const d = new Date(now);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Submit or update a player's tournament score (total fish count for the week) */
export async function submitTournamentScore(nickname, score) {
  const week = getWeekKey();
  const docId = `${week}_${encodeURIComponent(nickname)}`;
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'tournament_entries', docId);
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().score < score) {
        tx.set(ref, { nickname, score, week, updatedAt: serverTimestamp() });
      }
    });
  } catch (e) { console.warn('tournament submit failed', e); }
}

/** Subscribe to top 20 tournament entries for the current week */
export function subscribeTournament(callback) {
  const week = getWeekKey();
  const q = query(
    collection(db, 'tournament_entries'),
    where('week', '==', week),
    orderBy('score', 'desc'),
    limit(20),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, () => callback([]));
}

// ── Season Rankings (낚시 시즌 리그) ──────────────────────────────────────────

/** Returns "YYYY-MM" month key for the current season league */
export function getSeasonKey(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Submit or update a player's season score (total fish caught this month) */
export async function submitSeasonScore(nickname, fishCaught) {
  const season = getSeasonKey();
  const docId = `${season}_${encodeURIComponent(nickname)}`;
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'season_rankings', docId);
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().fishCaught < fishCaught) {
        tx.set(ref, { nickname, fishCaught, season, updatedAt: serverTimestamp() });
      }
    });
  } catch (e) { console.warn('season score submit failed', e); }
}

/** Subscribe to top 20 season rankings for the current month */
export function subscribeSeasonRankings(callback) {
  const season = getSeasonKey();
  const q = query(
    collection(db, 'season_rankings'),
    where('season', '==', season),
    orderBy('fishCaught', 'desc'),
    limit(20),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  }, () => callback([]));
}

// ── Server Quest (공동 퀘스트) ────────────────────────────────────────────────

/** Increment shared server quest progress */
export async function incrementServerQuestProgress(field, amount = 1) {
  const ref = doc(db, 'server_quests', 'global');
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data()[field] ?? 0) : 0;
      tx.set(ref, { [field]: current + amount }, { merge: true });
    });
  } catch (e) { console.warn('server quest increment failed', e); }
}

/** Subscribe to server quest progress */
export function subscribeServerQuest(callback) {
  return onSnapshot(doc(db, 'server_quests', 'global'), snap => {
    callback(snap.exists() ? snap.data() : {});
  }, () => callback({}));
}

// ── Server Boss Event (공동 보스) ─────────────────────────────────────────────

/** Subscribe to current server boss state */
export function subscribeServerBoss(callback) {
  return onSnapshot(doc(db, 'server_boss', 'current'), snap => {
    callback(snap.exists() ? snap.data() : null);
  }, () => callback(null));
}

/** Deal damage to the server boss (1 damage per call) */
export async function damageServerBoss(amount = 1) {
  const ref = doc(db, 'server_boss', 'current');
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.hp <= 0) return; // already defeated
      const newHp = Math.max(0, data.hp - amount);
      tx.set(ref, { ...data, hp: newHp }, { merge: false });
    });
  } catch (e) { console.warn('boss damage failed', e); }
}

/** Spawn a new server boss */
export async function spawnServerBoss(name, hp) {
  try {
    await setDoc(doc(db, 'server_boss', 'current'), {
      name, hp, maxHp: hp, spawnedAt: serverTimestamp(), defeated: false,
    });
  } catch (e) { console.warn('boss spawn failed', e); }
}

// ── Cottage sharing ───────────────────────────────────────────────────────────
/** Upload this player's cottage data so others can visit */
export async function saveCottagePublic(nickname, cottageData) {
  try {
    const ref = doc(db, 'cottages', encodeURIComponent(nickname));
    await setDoc(ref, {
      nickname,
      furniture: cottageData.furniture ?? [],
      achieveDisplay: cottageData.achieveDisplay ?? [],
      trophyWall: cottageData.trophyWall ?? [],
      updatedAt: serverTimestamp(),
    });
  } catch (e) { console.warn('cottage save failed', e); }
}

/** Fetch another player's cottage data by nickname */
export async function fetchCottage(nickname) {
  try {
    const snap = await getDoc(doc(db, 'cottages', encodeURIComponent(nickname)));
    return snap.exists() ? snap.data() : null;
  } catch (e) { console.warn('cottage fetch failed', e); return null; }
}

// ── Cottage Guestbook ─────────────────────────────────────────────────────────
/** Add a guestbook entry to another player's cottage (max 20 entries, oldest removed) */
export async function addGuestbookEntry(targetNickname, fromNickname, message) {
  try {
    const ref = doc(db, 'cottage_guestbooks', encodeURIComponent(targetNickname));
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists() ? (snap.data().entries ?? []) : [];
      const newEntry = { from: fromNickname, message: message.slice(0, 100), createdAt: Date.now() };
      // Keep max 20 entries (drop oldest)
      const updated = [...existing, newEntry].slice(-20);
      tx.set(ref, { entries: updated }, { merge: false });
    });
  } catch (e) { console.warn('guestbook add failed', e); }
}

/** Fetch guestbook entries for a player's cottage */
export async function fetchGuestbook(nickname) {
  try {
    const snap = await getDoc(doc(db, 'cottage_guestbooks', encodeURIComponent(nickname)));
    return snap.exists() ? (snap.data().entries ?? []) : [];
  } catch (e) { console.warn('guestbook fetch failed', e); return []; }
}

// ── Player Mailbox ────────────────────────────────────────────────────────────
/** Send a mail to another player (max 10 mails in inbox, oldest removed) */
export async function sendPlayerMail(toNickname, fromNickname, message, gold = 0) {
  try {
    const ref = doc(db, 'player_mailbox', encodeURIComponent(toNickname));
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists() ? (snap.data().mails ?? []) : [];
      const newMail = { from: fromNickname, message: message.slice(0, 200), gold, sentAt: Date.now(), read: false };
      const updated = [...existing, newMail].slice(-10);
      tx.set(ref, { mails: updated }, { merge: false });
    });
  } catch (e) { console.warn('send mail failed', e); }
}

/** Fetch mailbox for a player */
export async function fetchMailbox(nickname) {
  try {
    const snap = await getDoc(doc(db, 'player_mailbox', encodeURIComponent(nickname)));
    return snap.exists() ? (snap.data().mails ?? []) : [];
  } catch (e) { console.warn('fetch mailbox failed', e); return []; }
}

/** Mark all mails as read / delete a specific mail */
export async function clearMailbox(nickname) {
  try {
    await setDoc(doc(db, 'player_mailbox', encodeURIComponent(nickname)), { mails: [] }, { merge: false });
  } catch (e) { console.warn('clear mailbox failed', e); }
}

/** Increment visit counter for a cottage */
export async function incrementCottageVisit(nickname) {
  try {
    const ref = doc(db, 'cottages', encodeURIComponent(nickname));
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      tx.set(ref, { ...snap.data(), visits: (snap.data().visits ?? 0) + 1 }, { merge: false });
    });
  } catch (e) { console.warn('cottage visit failed', e); }
}

