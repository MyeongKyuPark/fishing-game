// ── Marketplace / Auction System ──────────────────────────────────────────────
// Players can list fish, ore, herbs for sale. Others can purchase.
// Firebase collection: marketplace

import {
  collection, query, orderBy, limit, where,
  onSnapshot, serverTimestamp, runTransaction, addDoc, doc, deleteDoc, getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

/** List an item for sale */
export async function listItem(seller, itemType, itemName, qty, price, extra = {}) {
  try {
    await addDoc(collection(db, 'marketplace'), {
      seller, itemType, itemName, qty, price,
      createdAt: serverTimestamp(),
      ...extra,
    });
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

/** Buy a listed item — transactional to prevent double-buy */
export async function buyItem(listingId, buyer) {
  const ref = doc(db, 'marketplace', listingId);
  try {
    let listing = null;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('매물이 사라졌습니다.');
      if (snap.data().seller === buyer) throw new Error('자신의 매물은 구매할 수 없습니다.');
      listing = { id: snap.id, ...snap.data() };
      tx.delete(ref);
    });
    return { ok: true, listing };
  } catch (e) { return { ok: false, err: e.message }; }
}

/** Cancel a listing (only the seller can cancel) */
export async function cancelListing(listingId, nickname) {
  try {
    const snap = await getDoc(doc(db, 'marketplace', listingId));
    if (!snap.exists()) return { ok: false, err: '매물 없음' };
    if (snap.data().seller !== nickname) return { ok: false, err: '본인 매물만 취소 가능' };
    await deleteDoc(doc(db, 'marketplace', listingId));
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

/** Subscribe to marketplace listings (newest 50) */
export function subscribeMarket(callback) {
  const q = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => callback([]));
}

/** Subscribe to a player's own listings */
export function subscribeMyListings(nickname, callback) {
  const q = query(collection(db, 'marketplace'), where('seller', '==', nickname));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => callback([]));
}
