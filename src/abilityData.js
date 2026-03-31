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
};

/** Compute cumulative mastery bonus from all unlocked perks */
export function getMasteryBonus(masteryPerks = {}) {
  let fishTimeMult = 1, fishSellBonus = 0, deepRarityBonus = 0;
  for (const [id, unlocked] of Object.entries(masteryPerks)) {
    if (!unlocked) continue;
    const p = MASTERY_PERKS[id];
    if (!p) continue;
    if (p.bonus.fishTimeMult  != null) fishTimeMult  *= p.bonus.fishTimeMult;
    if (p.bonus.fishSellBonus != null) fishSellBonus += p.bonus.fishSellBonus;
    if (p.bonus.deepRarityBonus != null) deepRarityBonus += p.bonus.deepRarityBonus;
  }
  return { fishTimeMult, fishSellBonus, deepRarityBonus };
}

// ── EXP amounts per event ────────────────────────────────────────────────────
export const FISH_ABILITY_GAIN = { 흔함: 0.30, 보통: 0.60, 희귀: 1.10, 전설: 2.00, 신화: 3.50 };
export const ORE_ABILITY_GAIN  = { 철광석: 0.40, 구리광석: 0.75, 수정: 1.30 };
export const COOK_ABILITY_GAIN        = 0.20;  // per fish cooked
export const SELL_ABILITY_PER_100G    = 0.08;  // 화술 per 100G sold
export const STAMINA_GAIN             = 0.25;  // 체력 per activity
export const ENHANCE_ABILITY_GAIN     = 0.80;  // 강화 per successful enhance
