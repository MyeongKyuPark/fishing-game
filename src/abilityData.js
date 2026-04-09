// ── Illyria-style Ability System (0.00 ~ 100.00) ────────────────────────────

export const ABILITY_DEFS = {
  낚시: { icon: '🎣', color: '#66aaff', desc: '물고기를 낚을 때 숙련도 상승',    grindable: true },
  채굴: { icon: '⛏',  color: '#ffaa44', desc: '광석을 캘 때 숙련도 상승',      grindable: true },
  요리: { icon: '🍳', color: '#ff8844', desc: '요리할 때 숙련도 상승',          grindable: true },
  화술: { icon: '💬', color: '#ffcc44', desc: '판매할 때 숙련도 상승',          grindable: true },
  체력: { icon: '❤️', color: '#ff6666', desc: '활동 완료마다 숙련도 상승',       grindable: true },
  강화: { icon: '🔨', color: '#cc8844', desc: '낚싯대/곡괭이 강화 시 숙련도 상승', grindable: true },
  제련: { icon: '🔥', color: '#ff6622', desc: '광물 제련 시 숙련도 상승 (성공률 ↑)', grindable: true },
  채집: { icon: '🌿', color: '#88cc44', desc: '허브 채집 시 숙련도 상승',        grindable: true },
};

export const DEFAULT_ABILITIES = Object.fromEntries(
  Object.keys(ABILITY_DEFS).map(k => [k, { value: 0.00, grade: 0 }])
);

/**
 * Add to an ability.  partyBonus = 20% chance to double.
 * Returns { value, grade, reachedMax }
 */
export function gainAbility(ability, amount, partyBonus = false) {
  const mult = (partyBonus && Math.random() < 0.20) ? 2 : 1;
  const value = Math.min(100.00, parseFloat((ability.value + amount * mult).toFixed(2)));
  return { value, grade: ability.grade, reachedMax: value >= 100.00 };
}

/** Reset ability to 0, increment grade — call after player confirms grade-up */
export function doGradeUp(ability) {
  return { value: 0.00, grade: ability.grade + 1 };
}

/**
 * Permanent rare-weight bonus from grading.
 * Grade 1 → +10%, Grade 2 → +22%, Grade 3+ → +10% each additional
 */
export function gradeRareBonus(grade) {
  if (grade <= 0) return 0;
  return Math.min(0.80, grade * 0.10); // cap at +80%
}

// ── Mastery Perk Tree (낚시 특성 트리) ─────────────────────────────────────────
// Three paths: 빠른낚시 (speed), 황금어부 (sell price), 심해개척 (rare chance)
// Earned 1 point per grade-up of 낚시 ability
export const MASTERY_PERKS = {
  // 빠른낚시 경로 (속도 특화)
  quick_1: { path: '빠른낚시', label: '순발력',       cost: 1, bonus: { fishTimeMult: 0.97 }, req: null },
  quick_2: { path: '빠른낚시', label: '민첩한 손목',  cost: 1, bonus: { fishTimeMult: 0.94 }, req: 'quick_1' },
  quick_3: { path: '빠른낚시', label: '반사신경',      cost: 2, bonus: { fishTimeMult: 0.90 }, req: 'quick_2' },
  quick_4: { path: '빠른낚시', label: '낚시의 경지',  cost: 3, bonus: { fishTimeMult: 0.84 }, req: 'quick_3' },
  // 황금어부 경로 (판매 특화)
  gold_1:  { path: '황금어부', label: '상인의 눈',    cost: 1, bonus: { fishSellBonus: 0.05 }, req: null },
  gold_2:  { path: '황금어부', label: '품질 감별',    cost: 1, bonus: { fishSellBonus: 0.08 }, req: 'gold_1' },
  gold_3:  { path: '황금어부', label: '최상품 어획',  cost: 2, bonus: { fishSellBonus: 0.12 }, req: 'gold_2' },
  gold_4:  { path: '황금어부', label: '황금손',       cost: 3, bonus: { fishSellBonus: 0.18 }, req: 'gold_3' },
  // 심해개척 경로 (희귀도 특화)
  deep_1:  { path: '심해개척', label: '심해 적응',    cost: 1, bonus: { deepRarityBonus: 0.05 }, req: null },
  deep_2:  { path: '심해개척', label: '암류 감지',    cost: 1, bonus: { deepRarityBonus: 0.08 }, req: 'deep_1' },
  deep_3:  { path: '심해개척', label: '신화의 인도',  cost: 2, bonus: { deepRarityBonus: 0.12 }, req: 'deep_2' },
  deep_4:  { path: '심해개척', label: '심해의 군주',  cost: 3, bonus: { deepRarityBonus: 0.18 }, req: 'deep_3' },
  // 대어격투 경로 (릴 미니게임 특화)
  resist_1: { path: '대어격투', label: '낚시의 호흡', cost: 1, bonus: { resistDecayBonus: 5 },       req: null },
  resist_2: { path: '대어격투', label: '집중력',       cost: 1, bonus: { resistStressReduce: 0.10 }, req: 'resist_1' },
  resist_3: { path: '대어격투', label: '강인한 줄',    cost: 2, bonus: { resistMaxStress: 20 },      req: 'resist_2' },
  resist_4: { path: '대어격투', label: '전설사냥꾼',   cost: 3, bonus: { resistDistReduce: 0.25 },   req: 'resist_3' },
};

/** Compute cumulative mastery bonus from all unlocked perks */
export function getMasteryBonus(masteryPerks = {}) {
  let fishTimeMult = 1, fishSellBonus = 0, deepRarityBonus = 0;
  let resistDecayBonus = 0, resistStressReduce = 0, resistMaxStress = 0, resistDistReduce = 0;
  for (const [id, unlocked] of Object.entries(masteryPerks)) {
    if (!unlocked) continue;
    const p = MASTERY_PERKS[id];
    if (!p) continue;
    if (p.bonus.fishTimeMult       != null) fishTimeMult       *= p.bonus.fishTimeMult;
    if (p.bonus.fishSellBonus      != null) fishSellBonus      += p.bonus.fishSellBonus;
    if (p.bonus.deepRarityBonus    != null) deepRarityBonus    += p.bonus.deepRarityBonus;
    if (p.bonus.resistDecayBonus   != null) resistDecayBonus   += p.bonus.resistDecayBonus;
    if (p.bonus.resistStressReduce != null) resistStressReduce += p.bonus.resistStressReduce;
    if (p.bonus.resistMaxStress    != null) resistMaxStress    += p.bonus.resistMaxStress;
    if (p.bonus.resistDistReduce   != null) resistDistReduce   += p.bonus.resistDistReduce;
  }
  return { fishTimeMult, fishSellBonus, deepRarityBonus, resistDecayBonus, resistStressReduce, resistMaxStress, resistDistReduce };
}

// ── 채굴 미니게임 퍽 트리 ──────────────────────────────────────────────────────
// 채굴 어빌리티 그레이드업 시 포인트 1 획득. 5개 경로.
export const MINING_PERKS = {
  // 범위 경로 (도달 가능 타일 반경 확장)
  mrange_1: { path: '범위', label: '넓은 손길',   cost: 1, bonus: { mineRange: 1 },           req: null },
  mrange_2: { path: '범위', label: '장거리 채굴',  cost: 2, bonus: { mineRange: 1 },           req: 'mrange_1' },
  // 속도 경로 (채굴 소요 시간 단축)
  mspeed_1: { path: '속도', label: '날렵한 손',    cost: 1, bonus: { mineSpeedMult: 0.78 },    req: null },
  mspeed_2: { path: '속도', label: '숙련된 타격',  cost: 2, bonus: { mineSpeedMult: 0.68 },    req: 'mspeed_1' },
  // 시간 경로 (미니게임 지속시간 증가)
  mtime_1:  { path: '시간', label: '집중력',       cost: 1, bonus: { mineTimerBonus: 6 },      req: null },
  mtime_2:  { path: '시간', label: '광맥 분석',    cost: 2, bonus: { mineTimerBonus: 9 },      req: 'mtime_1' },
  // 수확 경로 (채굴당 보너스 광석 증가)
  myield_1: { path: '수확', label: '정밀 채굴',    cost: 1, bonus: { mineYieldBonus: 1 },      req: null },
  myield_2: { path: '수확', label: '풍부한 광맥',  cost: 2, bonus: { mineDoubleChance: 0.30 }, req: 'myield_1' },
  // 특수 경로
  mspec_1:  { path: '특수', label: '광맥 감지',    cost: 2, bonus: { mineExtraOres: 2 },       req: null },
  mspec_2:  { path: '특수', label: '연쇄 채굴',    cost: 3, bonus: { mineChainBonus: 0.50 },   req: 'mspec_1' },
};

/** Compute cumulative mining perk bonus */
export function getMiningBonus(miningPerks = {}) {
  let mineRange = 1, mineSpeedMult = 1, mineTimerBonus = 0;
  let mineYieldBonus = 0, mineDoubleChance = 0, mineExtraOres = 0, mineChainBonus = 0;
  for (const [id, unlocked] of Object.entries(miningPerks)) {
    if (!unlocked) continue;
    const p = MINING_PERKS[id];
    if (!p) continue;
    if (p.bonus.mineRange        != null) mineRange        += p.bonus.mineRange;
    if (p.bonus.mineSpeedMult    != null) mineSpeedMult    *= p.bonus.mineSpeedMult;
    if (p.bonus.mineTimerBonus   != null) mineTimerBonus   += p.bonus.mineTimerBonus;
    if (p.bonus.mineYieldBonus   != null) mineYieldBonus   += p.bonus.mineYieldBonus;
    if (p.bonus.mineDoubleChance != null) mineDoubleChance += p.bonus.mineDoubleChance;
    if (p.bonus.mineExtraOres    != null) mineExtraOres    += p.bonus.mineExtraOres;
    if (p.bonus.mineChainBonus   != null) mineChainBonus   += p.bonus.mineChainBonus;
  }
  return { mineRange, mineSpeedMult, mineTimerBonus, mineYieldBonus, mineDoubleChance, mineExtraOres, mineChainBonus };
}

// ── EXP amounts per event ────────────────────────────────────────────────────
export const FISH_ABILITY_GAIN = { 흔함: 0.30, 보통: 0.60, 희귀: 1.10, 전설: 2.00, 신화: 3.50 };
export const ORE_ABILITY_GAIN  = { 철광석: 0.40, 구리광석: 0.75, 수정: 1.30 };
export const COOK_ABILITY_GAIN        = 0.20;  // per fish cooked
export const SELL_ABILITY_PER_100G    = 0.08;  // 화술 per 100G sold
export const STAMINA_GAIN             = 0.25;  // 체력 per activity
export const ENHANCE_ABILITY_GAIN     = 0.80;  // 강화 per successful enhance
