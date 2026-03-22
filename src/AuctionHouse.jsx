// Auction House — P2P marketplace for items
import { useState, useEffect, useCallback } from 'react';
import { doc, collection, setDoc, runTransaction, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { FISH, ORES, HERBS, POTION_RECIPES } from './gameData';
import { sendPlayerMail } from './ranking';

const AUCTION_CACHE_KEY = 'tidehaven_auction_cache';
const PENDING_LISTING_KEY = 'tidehaven_pending_listing';
const CACHE_TTL_MS = 30 * 1000;
const MAX_LISTINGS = 5;
const LISTING_DURATION_MS = 24 * 60 * 60 * 1000;

function rarityColor(r) {
  return { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' }[r] ?? '#fff';
}


async function fetchListings() {
  try {
    const cached = (() => {
      try {
        const raw = localStorage.getItem(AUCTION_CACHE_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (Date.now() - obj.cacheTime < CACHE_TTL_MS) return obj.listings;
        return null;
      } catch { return null; }
    })();
    if (cached) return cached;

    const q = query(
      collection(db, 'auction_house'),
      where('status', '==', 'active'),
      orderBy('listedAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    const listings = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(l => l.expiresAt?.toMillis ? l.expiresAt.toMillis() > Date.now() : (l.expiresAt > Date.now()));
    try {
      localStorage.setItem(AUCTION_CACHE_KEY, JSON.stringify({ listings, cacheTime: Date.now() }));
    } catch { /* ignore */ }
    return listings;
  } catch (e) {
    console.warn('auction fetch failed', e);
    return [];
  }
}

const PENDING_BUY_KEY = 'tidehaven_pending_buy';

export default function AuctionHouse({ onClose, gs, setGs, nickname, addMsg }) {
  const [tab, setTab] = useState('browse');
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [listForm, setListForm] = useState({ itemType: 'fish', itemName: '', qty: 1, price: 0 });
  const itemBasePrice = (itemType, name) => {
    if (itemType === 'fish') return FISH[name]?.price ?? 100;
    if (itemType === 'ore') return ORES[name]?.price ?? 100;
    if (itemType === 'herb') return HERBS[name]?.price ?? 50;
    if (itemType === 'potion') return POTION_RECIPES[name]?.price ?? 200;
    return 100;
  };
  const [listErr, setListErr] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const loadListings = useCallback(async () => {
    setLoading(true);
    const all = await fetchListings();
    setListings(all.filter(l => l.seller !== nickname));
    setMyListings(all.filter(l => l.seller === nickname));
    setLoading(false);
  }, [nickname]);

  useEffect(() => {
    if (tab === 'browse' || tab === 'my') loadListings();
  }, [tab, loadListings]);

  const handleBuy = async (listing) => {
    if (gs.money < listing.price) {
      addMsg('❌ 골드가 부족합니다.', 'error');
      return;
    }
    if (isBuying) return; // double-click guard
    setIsBuying(true);
    setLoading(true);
    // Save pending buy for crash recovery (item marked sold but setGs not yet called)
    try { localStorage.setItem(PENDING_BUY_KEY, JSON.stringify({ listingId: listing.id, listing, nickname, ts: Date.now() })); } catch { /* ignore */ }
    try {
      const ref = doc(db, 'auction_house', listing.id);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().status !== 'active') throw new Error('이미 판매된 상품입니다.');
        // Server-side expiration check
        const expiresAt = snap.data().expiresAt;
        const expiry = expiresAt?.toMillis ? expiresAt.toMillis() : expiresAt;
        if (expiry && expiry < Date.now()) throw new Error('만료된 상품입니다.');
        tx.update(ref, { status: 'sold', buyer: nickname, soldAt: serverTimestamp() });
      });
      // Add item to buyer inventory & deduct gold
      setGs(prev => {
        let updated = { ...prev, money: prev.money - listing.price };
        if (listing.itemType === 'fish') {
          const newFish = Array.from({ length: listing.qty }, (_, i) => ({
            name: listing.itemName, size: 0, price: FISH[listing.itemName]?.price ?? 0,
            id: Date.now() + Math.random() + i,
          }));
          updated = { ...updated, fishInventory: [...updated.fishInventory, ...newFish] };
        } else if (listing.itemType === 'ore') {
          updated = { ...updated, oreInventory: { ...updated.oreInventory, [listing.itemName]: (updated.oreInventory[listing.itemName] ?? 0) + listing.qty } };
        } else if (listing.itemType === 'herb') {
          updated = { ...updated, herbInventory: { ...(updated.herbInventory ?? {}), [listing.itemName]: ((updated.herbInventory ?? {})[listing.itemName] ?? 0) + listing.qty } };
        } else if (listing.itemType === 'potion') {
          updated = { ...updated, potionInventory: { ...(updated.potionInventory ?? {}), [listing.itemName]: ((updated.potionInventory ?? {})[listing.itemName] ?? 0) + listing.qty } };
        }
        return updated;
      });
      // Notify seller via mailbox
      try {
        await sendPlayerMail(listing.seller, '거래소', `${listing.itemName} ${listing.qty}개가 ${listing.price.toLocaleString()}G에 판매되었습니다.`, 0);
      } catch { /* ignore */ }
      // Invalidate cache
      try { localStorage.removeItem(AUCTION_CACHE_KEY); } catch { /* ignore */ }
      try { localStorage.removeItem(PENDING_BUY_KEY); } catch { /* ignore */ }
      setStatusMsg(`✅ ${listing.itemName} ${listing.qty}개 구매 완료! -${listing.price.toLocaleString()}G`);
      addMsg(`🛒 ${listing.itemName} ${listing.qty}개 구매! -${listing.price.toLocaleString()}G`, 'catch');
      await loadListings();
    } catch (e) {
      try { localStorage.removeItem(PENDING_BUY_KEY); } catch { /* ignore */ }
      addMsg(`❌ 구매 실패: ${e.message}`, 'error');
    }
    setLoading(false);
    setIsBuying(false);
  };

  const handleList = async () => {
    setListErr('');
    const { itemType, itemName, qty, price } = listForm;
    if (!itemName) { setListErr('아이템을 선택하세요.'); return; }
    if (qty < 1) { setListErr('수량은 1 이상이어야 합니다.'); return; }

    // Check inventory
    if (itemType === 'fish') {
      const count = (gs.fishInventory ?? []).filter(f => f.name === itemName).length;
      if (count < qty) { setListErr(`인벤토리에 ${itemName}이(가) ${count}개밖에 없습니다.`); return; }
    } else if (itemType === 'ore') {
      const count = gs.oreInventory[itemName] ?? 0;
      if (count < qty) { setListErr(`인벤토리에 ${itemName}이(가) ${count}개밖에 없습니다.`); return; }
    } else if (itemType === 'herb') {
      const count = (gs.herbInventory ?? {})[itemName] ?? 0;
      if (count < qty) { setListErr(`인벤토리에 ${itemName}이(가) ${count}개밖에 없습니다.`); return; }
    } else if (itemType === 'potion') {
      const count = (gs.potionInventory ?? {})[itemName] ?? 0;
      if (count < qty) { setListErr(`인벤토리에 ${itemName}이(가) ${count}개밖에 없습니다.`); return; }
    }

    // Price bounds
    const basePrice = itemBasePrice(itemType, itemName);
    const minPrice = Math.floor(basePrice * qty * 0.5);
    const maxPrice = Math.ceil(basePrice * qty * 3.0);
    if (price < minPrice || price > maxPrice) {
      setListErr(`가격은 ${minPrice.toLocaleString()}G ~ ${maxPrice.toLocaleString()}G 범위여야 합니다.`);
      return;
    }

    // Max listings check
    const myActiveListings = listings.concat(myListings).filter(l => l.seller === nickname && l.status === 'active');
    if (myActiveListings.length >= MAX_LISTINGS) {
      setListErr(`최대 ${MAX_LISTINGS}개까지 등록 가능합니다.`);
      return;
    }

    const listingId = crypto.randomUUID();
    const listing = {
      itemType, itemName, qty, price, seller: nickname,
      status: 'active',
      listedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + LISTING_DURATION_MS),
    };
    try {
      // Save pending listing for crash recovery before Firebase write
      try { localStorage.setItem(PENDING_LISTING_KEY, JSON.stringify({ listingId, itemType, itemName, qty, nickname, ts: Date.now() })); } catch { /* ignore */ }
      await setDoc(doc(db, 'auction_house', listingId), listing);
      // Remove from inventory
      setGs(prev => {
        if (itemType === 'fish') {
          let removed = 0;
          const newInv = prev.fishInventory.filter(f => {
            if (f.name === itemName && removed < qty) { removed++; return false; }
            return true;
          });
          return { ...prev, fishInventory: newInv };
        } else if (itemType === 'ore') {
          return { ...prev, oreInventory: { ...prev.oreInventory, [itemName]: Math.max(0, (prev.oreInventory[itemName] ?? 0) - qty) } };
        } else if (itemType === 'herb') {
          return { ...prev, herbInventory: { ...(prev.herbInventory ?? {}), [itemName]: Math.max(0, ((prev.herbInventory ?? {})[itemName] ?? 0) - qty) } };
        } else if (itemType === 'potion') {
          return { ...prev, potionInventory: { ...(prev.potionInventory ?? {}), [itemName]: Math.max(0, ((prev.potionInventory ?? {})[itemName] ?? 0) - qty) } };
        }
        return prev;
      });
      try { localStorage.removeItem(AUCTION_CACHE_KEY); } catch { /* ignore */ }
      try { localStorage.removeItem(PENDING_LISTING_KEY); } catch { /* ignore */ }
      setStatusMsg(`✅ ${itemName} ${qty}개 등록 완료!`);
      setListForm({ itemType: 'fish', itemName: '', qty: 1, price: 0 });
      setTab('my');
      await loadListings();
    } catch (e) {
      try { localStorage.removeItem(PENDING_LISTING_KEY); } catch { /* ignore */ }
      setListErr(`등록 실패: ${e.message}`);
    }
  };

  const handleCancel = async (listing) => {
    try {
      const ref = doc(db, 'auction_house', listing.id);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('등록이 이미 삭제됐습니다.');
        if (snap.data().seller !== nickname) throw new Error('취소 권한이 없습니다.');
        if (snap.data().status !== 'active') throw new Error('이미 판매된 상품입니다.');
        tx.delete(ref);
      });
      // Return item to inventory
      setGs(prev => {
        if (listing.itemType === 'fish') {
          const newFish = Array.from({ length: listing.qty }, (_, i) => ({
            name: listing.itemName, size: 0, price: FISH[listing.itemName]?.price ?? 0,
            id: Date.now() + Math.random() + i,
          }));
          return { ...prev, fishInventory: [...prev.fishInventory, ...newFish] };
        } else if (listing.itemType === 'ore') {
          return { ...prev, oreInventory: { ...prev.oreInventory, [listing.itemName]: (prev.oreInventory[listing.itemName] ?? 0) + listing.qty } };
        } else if (listing.itemType === 'herb') {
          return { ...prev, herbInventory: { ...(prev.herbInventory ?? {}), [listing.itemName]: ((prev.herbInventory ?? {})[listing.itemName] ?? 0) + listing.qty } };
        } else if (listing.itemType === 'potion') {
          return { ...prev, potionInventory: { ...(prev.potionInventory ?? {}), [listing.itemName]: ((prev.potionInventory ?? {})[listing.itemName] ?? 0) + listing.qty } };
        }
        return prev;
      });
      try { localStorage.removeItem(AUCTION_CACHE_KEY); } catch { /* ignore */ }
      setStatusMsg(`✅ 등록 취소: ${listing.itemName}`);
      await loadListings();
    } catch (e) {
      addMsg(`❌ 취소 실패: ${e.message}`, 'error');
    }
  };

  const fishItems = [...new Set((gs.fishInventory ?? []).map(f => f.name))];
  const oreItems = Object.entries(gs.oreInventory ?? {}).filter(([, n]) => n > 0).map(([k]) => k);
  const herbItems = Object.entries(gs.herbInventory ?? {}).filter(([, n]) => n > 0).map(([k]) => k);
  const potionItems = Object.entries(gs.potionInventory ?? {}).filter(([, n]) => n > 0).map(([k]) => k);
  const availableItems = listForm.itemType === 'fish' ? fishItems
    : listForm.itemType === 'ore' ? oreItems
    : listForm.itemType === 'herb' ? herbItems
    : potionItems;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="panel-head">
          <span>🏪 거래소</span>
          <button tabIndex={-1} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {[['browse','📋 거래 목록'],['list','📝 등록'],['my','👤 내 판매']].map(([k,l]) => (
            <button key={k} tabIndex={-1} onClick={() => setTab(k)} style={{
              padding: '5px 12px', borderRadius: '6px 6px 0 0', fontSize: 12, fontWeight: 600,
              background: tab === k ? 'rgba(100,160,255,0.18)' : 'transparent',
              border: 'none', color: tab === k ? '#88ccff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', borderBottom: tab === k ? '2px solid #88ccff' : '2px solid transparent',
            }}>
              {l}
            </button>
          ))}
        </div>

        {statusMsg && (
          <div style={{ padding: '6px 12px', fontSize: 12, color: '#88ff88', background: 'rgba(0,100,0,0.15)' }}>
            {statusMsg}
          </div>
        )}

        <div className="section" style={{ maxHeight: 400, overflowY: 'auto' }}>
          {loading && <div className="empty">불러오는 중…</div>}

          {/* Browse tab */}
          {!loading && tab === 'browse' && (
            <>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                내 보유 골드: {gs.money.toLocaleString()}G · 캐시 30초
              </div>
              {listings.length === 0 && <div className="empty">등록된 상품이 없습니다.</div>}
              {listings.map(l => {
                const rarity = FISH[l.itemName]?.rarity;
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: rarity ? rarityColor(rarity) : '#fff', fontWeight: 700, fontSize: 13 }}>{l.itemName}</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginLeft: 6 }}>×{l.qty}</span>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>판매자: {l.seller}</div>
                    </div>
                    <span style={{ color: '#ffd700', fontWeight: 700, fontSize: 13 }}>{l.price.toLocaleString()}G</span>
                    <button className={gs.money >= l.price && !isBuying ? 'btn-buy' : 'btn-dis'}
                      disabled={gs.money < l.price || isBuying}
                      onClick={() => handleBuy(l)}
                      style={{ fontSize: 11, padding: '4px 10px' }}>
                      구매
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {/* List item tab */}
          {!loading && tab === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>아이템 종류</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['fish','물고기'],['ore','광석'],['herb','허브'],['potion','포션']].map(([k,l]) => (
                    <button key={k} tabIndex={-1}
                      onClick={() => setListForm(f => ({ ...f, itemType: k, itemName: '' }))}
                      style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${listForm.itemType === k ? '#88ccff' : 'rgba(255,255,255,0.2)'}`,
                        background: listForm.itemType === k ? 'rgba(100,180,255,0.15)' : 'transparent',
                        color: listForm.itemType === k ? '#88ccff' : 'rgba(255,255,255,0.6)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>아이템 선택</div>
                <select value={listForm.itemName} onChange={e => setListForm(f => ({ ...f, itemName: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13 }}>
                  <option value="">선택하세요</option>
                  {availableItems.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>수량</div>
                  <input type="number" min={1} value={listForm.qty}
                    onChange={e => setListForm(f => ({ ...f, qty: Math.max(1, parseInt(e.target.value) || 1) }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>가격 (G)</div>
                  <input type="number" min={0} value={listForm.price}
                    onChange={e => setListForm(f => ({ ...f, price: Math.max(0, parseInt(e.target.value) || 0) }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              {listForm.itemName && (() => {
                const base = itemBasePrice(listForm.itemType, listForm.itemName);
                const minP = Math.floor(base * listForm.qty * 0.5);
                const maxP = Math.ceil(base * listForm.qty * 3.0);
                return <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>허용 가격: {minP.toLocaleString()}G ~ {maxP.toLocaleString()}G</div>;
              })()}
              {listErr && <div style={{ color: '#ff8888', fontSize: 12 }}>{listErr}</div>}
              <button className="btn-buy" onClick={handleList}>📝 등록하기</button>
            </div>
          )}

          {/* My sales tab */}
          {!loading && tab === 'my' && (
            <>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                내 등록: {myListings.length}/{MAX_LISTINGS}개
              </div>
              {myListings.length === 0 && <div className="empty">등록한 상품이 없습니다.</div>}
              {myListings.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{l.itemName}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginLeft: 6 }}>×{l.qty}</span>
                    <div style={{ fontSize: 11, color: '#ffd700' }}>{l.price.toLocaleString()}G</div>
                  </div>
                  <button className="btn-dis" onClick={() => handleCancel(l)} style={{ fontSize: 11, padding: '4px 10px' }}>취소</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
