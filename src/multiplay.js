import {
  doc, setDoc, deleteDoc, collection,
  onSnapshot, serverTimestamp, query, where, addDoc, orderBy, limit,
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

// ── Party System (파티 시스템) ────────────────────────────────────────────────

/** Send a party invite to a target player */
export async function sendPartyInvite(partyId, inviterNickname, targetNickname) {
  try {
    await setDoc(doc(db, 'party_invites', targetNickname), {
      partyId, inviter: inviterNickname,
      createdAt: serverTimestamp(),
      expiresAt: Date.now() + 60000,  // 60s expiry
    });
  } catch (e) { console.warn('party invite failed', e); }
}

/** Subscribe to pending party invites for myNickname */
export function subscribePartyInvite(myNickname, callback) {
  return onSnapshot(doc(db, 'party_invites', myNickname), snap => {
    if (!snap.exists()) { callback(null); return; }
    const data = snap.data();
    const expired = data.expiresAt && Date.now() > data.expiresAt;
    callback(expired ? null : data);
  }, () => callback(null));
}

/** Delete the invite doc (after accept/decline) */
export async function clearPartyInvite(myNickname) {
  try { await deleteDoc(doc(db, 'party_invites', myNickname)); } catch {}
}

/** Upsert party membership doc */
export async function joinParty(partyId, nickname, roomId) {
  try {
    await setDoc(doc(db, 'party_members', `${partyId}_${nickname}`), {
      partyId, nickname, roomId, updatedAt: serverTimestamp(),
    });
  } catch (e) { console.warn('join party failed', e); }
}

/** Remove from party */
export async function leaveParty(partyId, nickname) {
  try { await deleteDoc(doc(db, 'party_members', `${partyId}_${nickname}`)); } catch {}
}

/** Subscribe to party members for a given partyId */
export function subscribePartyMembers(partyId, myNickname, callback) {
  const q = query(collection(db, 'party_members'), where('partyId', '==', partyId));
  return onSnapshot(q, snap => {
    const now = Date.now();
    const members = snap.docs
      .map(d => d.data())
      .filter(m => m.nickname !== myNickname)
      .filter(m => {
        if (!m.updatedAt) return true;
        try { return (now - m.updatedAt.toMillis()) < 60000; }
        catch { return true; }
      });
    callback(members);
  }, () => callback([]));
}

/** Send a party chat message */
export async function sendPartyMessage(partyId, nickname, message) {
  try {
    await addDoc(collection(db, 'party_chat'), {
      partyId, nickname, message, createdAt: serverTimestamp(),
    });
  } catch (e) { console.warn('party chat failed', e); }
}

/** Subscribe to party chat messages */
export function subscribePartyChat(partyId, callback) {
  const q = query(
    collection(db, 'party_chat'),
    where('partyId', '==', partyId),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => d.data()).reverse();
    callback(msgs);
  }, () => callback([]));
}
