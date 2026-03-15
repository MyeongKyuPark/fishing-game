export const MAX_SKILL_LV = 99;

export function expForLv(lv) { return lv * 100; } // EXP needed: lv → lv+1

// Add exp to a skill, return updated skill and whether level-up occurred
export function addSkillExp(skill, amount) {
  let { lv, exp } = skill;
  exp += amount;
  let leveledUp = false;
  while (lv < MAX_SKILL_LV && exp >= expForLv(lv)) {
    exp -= expForLv(lv);
    lv++;
    leveledUp = true;
  }
  return { lv, exp, leveledUp };
}

export const SKILL_DEFS = {
  낚시: {
    icon: '🎣', color: '#66aaff', grind: true,
    desc: '물고기를 낚을 때 경험치 획득',
    effectDesc: (lv) => `낚시 시간 -${((lv-1)*0.4).toFixed(0)}%  ·  판매가 +${((lv-1)*0.3).toFixed(0)}%`,
  },
  채굴: {
    icon: '⛏', color: '#ffaa44', grind: true,
    desc: '광석을 캘 때 경험치 획득',
    effectDesc: (lv) => `채굴 시간 -${((lv-1)*0.4).toFixed(0)}%`,
  },
  요리: {
    icon: '🍳', color: '#ff8844', grind: true,
    desc: '물고기를 요리할 때 경험치 획득',
    effectDesc: (lv) => `요리 배율 +${((lv-1)*0.03).toFixed(2)}`,
  },
  화술: {
    icon: '💬', color: '#ffcc44', grind: true,
    desc: '물고기를 팔 때 경험치 획득',
    effectDesc: (lv) => `판매가 +${((lv-1)*0.5).toFixed(0)}%`,
  },
  체력: {
    icon: '❤️', color: '#ff6666', grind: true,
    desc: '낚시·채굴 완료 시 경험치 획득',
    effectDesc: (lv) => `모든 활동 시간 -${((lv-1)*0.3).toFixed(0)}%`,
  },
  민첩: {
    icon: '🏃', color: '#66ccff', grind: false,
    desc: '퀘스트 완료 시 보상으로 경험치 획득',
    effectDesc: (lv) => `이동 속도 +${((lv-1)*0.4).toFixed(1)}`,
  },
  행운: {
    icon: '🍀', color: '#66ff88', grind: false,
    desc: '퀘스트 완료 시 보상으로 경험치 획득',
    effectDesc: (lv) => `희귀 물고기 가중치 +${((lv-1)*20).toFixed(0)}%`,
  },
};

export const DEFAULT_SKILLS = Object.fromEntries(
  Object.keys(SKILL_DEFS).map(k => [k, { lv: 1, exp: 0 }])
);

// EXP per event
export const FISH_SKILL_EXP = { 흔함: 5, 보통: 15, 희귀: 35, 전설: 70, 신화: 150 };
export const ORE_SKILL_EXP  = { 철광석: 8, 구리광석: 18, 수정: 40 };
export const COOK_SKILL_EXP = 6; // per fish cooked
export const SELL_SKILL_EXP_PER_100G = 3; // 화술 per 100G sold
export const ACTIVITY_STAMINA_EXP = 10; // 체력 per catch/mine
