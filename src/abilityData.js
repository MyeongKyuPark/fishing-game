// ── Illyria-style Ability System (0.00 ~ 100.00) ────────────────────────────

export const ABILITY_DEFS = {
  낚시: { icon: '🎣', color: '#66aaff', desc: '물고기를 낚을 때 숙련도 상승',    grindable: true },
  채굴: { icon: '⛏',  color: '#ffaa44', desc: '광석을 캘 때 숙련도 상승',      grindable: true },
  요리: { icon: '🍳', color: '#ff8844', desc: '요리할 때 숙련도 상승',          grindable: true },
  화술: { icon: '💬', color: '#ffcc44', desc: '판매할 때 숙련도 상승',          grindable: true },
  체력: { icon: '❤️', color: '#ff6666', desc: '활동 완료마다 숙련도 상승',       grindable: true },
  강화: { icon: '🔨', color: '#cc8844', desc: '낚싯대 강화 시 숙련도 상승',     grindable: true },
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

// ── EXP amounts per event ────────────────────────────────────────────────────
export const FISH_ABILITY_GAIN = { 흔함: 0.30, 보통: 0.60, 희귀: 1.10, 전설: 2.00, 신화: 3.50 };
export const ORE_ABILITY_GAIN  = { 철광석: 0.40, 구리광석: 0.75, 수정: 1.30 };
export const COOK_ABILITY_GAIN        = 0.20;  // per fish cooked
export const SELL_ABILITY_PER_100G    = 0.08;  // 화술 per 100G sold
export const STAMINA_GAIN             = 0.25;  // 체력 per activity
export const ENHANCE_ABILITY_GAIN     = 0.80;  // 강화 per successful enhance
