// ── Phase 12-3: 마을 발전 시스템 ─────────────────────────────────────────────
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export const TOWN_BUILDINGS = {
  항구: {
    name: '항구', icon: '⚓', maxLv: 5,
    desc: '어부들의 항구. 레벨당 물고기 판매가 +3%',
    contributeItem: '물고기',
    contributeItemType: 'fish',
    lvReqs: [50, 150, 300, 600],
    bonus: (lv) => ({ fishSellBonus: lv * 0.03 }),
  },
  광산길: {
    name: '광산길', icon: '⛏', maxLv: 5,
    desc: '광산으로 가는 길. 레벨당 채굴 속도 +4%',
    contributeItem: '광석',
    contributeItemType: 'ore',
    lvReqs: [50, 150, 300, 600],
    bonus: (lv) => ({ mineSpeedBonus: lv * 0.04 }),
  },
  허브밭: {
    name: '허브밭', icon: '🌿', maxLv: 3,
    desc: '마을 허브밭. 레벨당 허브 수확량 +20%',
    contributeItem: '허브',
    contributeItemType: 'herb',
    lvReqs: [30, 100],
    bonus: (lv) => ({ herbYieldBonus: lv * 0.20 }),
  },
  요리학교: {
    name: '요리학교', icon: '🍳', maxLv: 3,
    desc: '마을 요리학교. 레벨당 요리 판매가 +10%',
    contributeItem: '요리',
    contributeItemType: 'dish',
    lvReqs: [30, 100],
    bonus: (lv) => ({ cookSellBonus: lv * 0.10 }),
  },
};

export function getTownBonuses(townLevels) {
  const bonuses = { fishSellBonus: 0, mineSpeedBonus: 0, herbYieldBonus: 0, cookSellBonus: 0 };
  for (const [key, building] of Object.entries(TOWN_BUILDINGS)) {
    const lv = townLevels?.[key] ?? 0;
    if (lv > 0) {
      const b = building.bonus(lv);
      for (const [bk, bv] of Object.entries(b)) bonuses[bk] = (bonuses[bk] ?? 0) + bv;
    }
  }
  return bonuses;
}

export async function subscribeTownProgress(callback) {
  const buildings = Object.keys(TOWN_BUILDINGS);
  const unsubs = buildings.map(id =>
    onSnapshot(doc(db, 'town_progress', id), snap => {
      callback(id, snap.exists() ? snap.data() : { level: 0, totalContribution: 0 });
    })
  );
  return () => unsubs.forEach(u => u());
}

export async function contributeTown(buildingId, amount) {
  const ref = doc(db, 'town_progress', buildingId);
  const snap = await getDoc(ref);
  const current = snap.exists() ? snap.data() : { level: 0, totalContribution: 0 };
  const building = TOWN_BUILDINGS[buildingId];
  const newTotal = (current.totalContribution ?? 0) + amount;
  let newLevel = current.level ?? 0;
  const maxLv = building.maxLv;
  let cumulative = 0;
  for (let i = 0; i < building.lvReqs.length; i++) {
    cumulative += building.lvReqs[i];
    if (newTotal >= cumulative && newLevel <= i) newLevel = i + 1;
  }
  newLevel = Math.min(newLevel, maxLv);
  await setDoc(ref, { level: newLevel, totalContribution: newTotal }, { merge: true });
  return newLevel;
}
