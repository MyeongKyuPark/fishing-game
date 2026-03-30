// Phase 14: Zone Daily Challenge System
// Each zone has a pool of zone-specific daily challenges.
// One challenge is randomly selected per zone per day (date+zone hash).

export const ZONE_CHALLENGE_POOLS = {
  '마을': [
    { id: 'v_fish5',    label: '마을에서 물고기 5마리 낚기',  type: 'zoneFish', goal: 5,    reward: { money: 300,  masteryExp: 3 } },
    { id: 'v_ore5',     label: '마을 광산에서 광석 5개 채굴', type: 'zoneOre',  goal: 5,    reward: { money: 250,  masteryExp: 3 } },
    { id: 'v_cook3',    label: '생선 3마리 요리하기',          type: 'zoneCook', goal: 3,    reward: { money: 400,  masteryExp: 4 } },
    { id: 'v_sell500',  label: '상점에서 500G 이상 판매',     type: 'zoneSell', goal: 500,  reward: { money: 350,  masteryExp: 3 } },
    { id: 'v_herb3',    label: '허브 3개 채집하기',            type: 'zoneHerb', goal: 3,    reward: { money: 280,  masteryExp: 3 } },
  ],
  '서쪽초원': [
    { id: 'w_herb5',    label: '초원 허브 5개 채집',           type: 'zoneHerb', goal: 5,    reward: { money: 600,  masteryExp: 8 } },
    { id: 'w_herb10',   label: '초원 허브 10개 채집',          type: 'zoneHerb', goal: 10,   reward: { money: 1200, masteryExp: 15 } },
    { id: 'w_fish5',    label: '초원 강에서 낚시 5마리',       type: 'zoneFish', goal: 5,    reward: { money: 500,  masteryExp: 7 } },
    { id: 'w_sell800',  label: '초원 자원 800G 판매',          type: 'zoneSell', goal: 800,  reward: { money: 600,  masteryExp: 8 } },
  ],
  '동쪽절벽': [
    { id: 'e_ore8',     label: '절벽 광석 8개 채굴',           type: 'zoneOre',  goal: 8,    reward: { money: 700,  masteryExp: 10 } },
    { id: 'e_ore15',    label: '절벽 광석 15개 채굴',          type: 'zoneOre',  goal: 15,   reward: { money: 1500, masteryExp: 18 } },
    { id: 'e_fish5',    label: '절벽 바다 낚시 5마리',         type: 'zoneFish', goal: 5,    reward: { money: 600,  masteryExp: 8 } },
    { id: 'e_sell1000', label: '절벽 자원 1000G 판매',         type: 'zoneSell', goal: 1000, reward: { money: 700,  masteryExp: 9 } },
  ],
  '북쪽고원': [
    { id: 'n_herb8',    label: '고원 허브 8개 채집',           type: 'zoneHerb', goal: 8,    reward: { money: 800,  masteryExp: 12 } },
    { id: 'n_fish5',    label: '고원 호수 낚시 5마리',         type: 'zoneFish', goal: 5,    reward: { money: 700,  masteryExp: 10 } },
    { id: 'n_ore5',     label: '고원 광석 5개 채굴',           type: 'zoneOre',  goal: 5,    reward: { money: 600,  masteryExp: 8 } },
    { id: 'n_rare3',    label: '희귀/전설 어종 3마리 포획',    type: 'zoneRare', goal: 3,    reward: { money: 1800, masteryExp: 22 } },
  ],
  '남쪽심해': [
    { id: 's_fish8',    label: '심해 낚시 8마리',              type: 'zoneFish', goal: 8,    reward: { money: 1000, masteryExp: 12 } },
    { id: 's_fish15',   label: '심해 낚시 15마리',             type: 'zoneFish', goal: 15,   reward: { money: 2000, masteryExp: 22 } },
    { id: 's_rare2',    label: '전설/신화 어종 2마리 포획',    type: 'zoneRare', goal: 2,    reward: { money: 2500, masteryExp: 25 } },
    { id: 's_sell2000', label: '심해 생선 2000G 판매',         type: 'zoneSell', goal: 2000, reward: { money: 1500, masteryExp: 18 } },
  ],
  '항구마을': [
    { id: 'h_fish10',   label: '항구 낚시 10마리',             type: 'zoneFish', goal: 10,   reward: { money: 1500, masteryExp: 15 } },
    { id: 'h_sell2000', label: '항구에서 2000G 판매',          type: 'zoneSell', goal: 2000, reward: { money: 1200, masteryExp: 12 } },
    { id: 'h_rare3',    label: '항구 희귀+ 어종 3마리',        type: 'zoneRare', goal: 3,    reward: { money: 3000, masteryExp: 25 } },
    { id: 'h_fish5_legend', label: '심해문어 또는 날치 5마리', type: 'zoneFish', goal: 5,    reward: { money: 1800, masteryExp: 18 } },
  ],
  '고대신전': [
    { id: 't_ore5',     label: '고대광석 5개 채굴',            type: 'zoneOre',  goal: 5,    reward: { money: 2000, masteryExp: 20 } },
    { id: 't_ore10',    label: '고대광석 10개 채굴',           type: 'zoneOre',  goal: 10,   reward: { money: 4000, masteryExp: 35 } },
    { id: 't_fish5',    label: '신전 수로 낚시 5마리',         type: 'zoneFish', goal: 5,    reward: { money: 1500, masteryExp: 15 } },
    { id: 't_rare2',    label: '고대잉어 또는 신전수호어 2마리', type: 'zoneRare', goal: 2,  reward: { money: 4000, masteryExp: 30 } },
  ],
  '설산정상': [
    { id: 'sn_fish8',   label: '얼음 호수 낚시 8마리',         type: 'zoneFish', goal: 8,    reward: { money: 1800, masteryExp: 18 } },
    { id: 'sn_ore5',    label: '빙정광석 5개 채굴',            type: 'zoneOre',  goal: 5,    reward: { money: 1500, masteryExp: 15 } },
    { id: 'sn_rare3',   label: '얼음빙어 또는 설산용 3마리',   type: 'zoneRare', goal: 3,    reward: { money: 4000, masteryExp: 30 } },
    { id: 'sn_fish3_rare', label: '전설/신화 어종 3마리',      type: 'zoneRare', goal: 3,    reward: { money: 5000, masteryExp: 35 } },
  ],
};

/** Get today's challenge for a zone. Returns null if zone has no pool. */
export function getZoneDailyChallenge(zone) {
  const pool = ZONE_CHALLENGE_POOLS[zone];
  if (!pool || pool.length === 0) return null;
  const dateStr = new Date().toDateString() + zone;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

/** Returns today's date string (same format as toDateString) */
export function todayStr() {
  return new Date().toDateString();
}
