// ── Game State: constants, pure functions, and useGameState hook ─────────────
import { useState, useEffect, useRef } from 'react';
import { DEFAULT_ABILITIES } from '../abilityData';

export const SKIN_PRESETS = ['#f6cc88', '#e8a870', '#c8845a', '#a06040', '#7a4830', '#fddbb4'];

export const QUEST_POOL = [
  { id: 'fish5',   label: '생선 5마리 잡기',      goal: 5,    type: 'fish', reward: 100 },
  { id: 'fish10',  label: '생선 10마리 잡기',     goal: 10,   type: 'fish', reward: 200 },
  { id: 'fish25',  label: '생선 25마리 잡기',     goal: 25,   type: 'fish', reward: 500 },
  { id: 'fish50',  label: '생선 50마리 잡기',     goal: 50,   type: 'fish', reward: 1200 },
  { id: 'ore3',    label: '광석 3개 채굴',         goal: 3,    type: 'ore',  reward: 150 },
  { id: 'ore5',    label: '광석 5개 채굴',         goal: 5,    type: 'ore',  reward: 300 },
  { id: 'ore15',   label: '광석 15개 채굴',        goal: 15,   type: 'ore',  reward: 700 },
  { id: 'ore30',   label: '광석 30개 채굴',        goal: 30,   type: 'ore',  reward: 1500 },
  { id: 'cook3',   label: '생선 3마리 요리',       goal: 3,    type: 'cook', reward: 150 },
  { id: 'cook5',   label: '생선 5마리 요리',       goal: 5,    type: 'cook', reward: 250 },
  { id: 'cook15',  label: '생선 15마리 요리',      goal: 15,   type: 'cook', reward: 600 },
  { id: 'sell200', label: '200G 이상 판매',        goal: 200,  type: 'sell', reward: 200 },
  { id: 'sell500', label: '500G 이상 판매',        goal: 500,  type: 'sell', reward: 400 },
  { id: 'sell2000',label: '2000G 이상 판매',       goal: 2000, type: 'sell', reward: 1000 },
  { id: 'sell8000',label: '8000G 이상 판매',       goal: 8000, type: 'sell', reward: 3000 },
  { id: 'herb3',   label: '허브 3개 채집',         goal: 3,    type: 'herb', reward: 120 },
  { id: 'herb10',  label: '허브 10개 채집',        goal: 10,   type: 'herb', reward: 350 },
  { id: 'farm1',   label: '작물 1개 수확',          goal: 1,    type: 'farm', reward: 150 },
  { id: 'farm3',   label: '작물 3개 수확',          goal: 3,    type: 'farm', reward: 400 },
  { id: 'farm5',   label: '작물 5개 수확',          goal: 5,    type: 'farm', reward: 800 },
  { id: 'dep500',  label: '은행에 500G 예금',       goal: 500,  type: 'deposit', reward: 200 },
  { id: 'dep2000', label: '은행에 2000G 예금',      goal: 2000, type: 'deposit', reward: 600 },
  { id: 'dep8000', label: '은행에 8000G 예금',      goal: 8000, type: 'deposit', reward: 1500 },
  { id: 'dish1',   label: '요리 레시피 1개 만들기', goal: 1,    type: 'dish',    reward: 250 },
  { id: 'dish3',   label: '요리 레시피 3개 만들기', goal: 3,    type: 'dish',    reward: 700 },
  { id: 'dish5',   label: '요리 레시피 5개 만들기', goal: 5,    type: 'dish',    reward: 1400 },
];

// Mine depth system: ore weight multipliers per depth (index = depth-1)
export const MINE_DEPTH_ORE_MULT = {
  철광석:  [1.00, 0.75, 0.55, 0.40, 0.25],
  구리광석: [1.00, 1.00, 0.85, 0.70, 0.55],
  수정:    [1.00, 1.50, 2.00, 2.50, 3.00],
  금광석:  [1.00, 2.00, 3.50, 5.00, 7.00],
};
export const MINE_DEPTH_REQ = [0, 0, 10, 25, 50, 80]; // required 채굴 ability per depth
export const MINE_DEPTH_TIME = [1.00, 0.88, 0.76, 0.65, 0.55]; // time multiplier per depth (deeper = faster)

export function getDailyQuests(extraCount = 0) {
  const dateStr = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  const picked = [];
  const pool = [...QUEST_POOL];
  for (let i = 0; i < 4 + extraCount && pool.length > 0; i++) {
    const idx = hash % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
    hash = (hash * 1664525 + 1013904223) >>> 0;
  }
  return picked;
}

const WEEKLY_GOAL_POOL = [
  { id: 'wg_fish100',  label: '주간 물고기 100마리', type: 'fish',  goal: 100,   reward: { money: 5000 } },
  { id: 'wg_sell50k',  label: '주간 50,000G 판매',   type: 'sell',  goal: 50000, reward: { money: 8000 } },
  { id: 'wg_ore200',   label: '주간 광석 200개',      type: 'ore',   goal: 200,   reward: { money: 4000 } },
  { id: 'wg_rare20',   label: '주간 전설+ 20마리',    type: 'rare',  goal: 20,    reward: { money: 12000 } },
  { id: 'wg_herb80',   label: '주간 허브 80개',       type: 'herb',  goal: 80,    reward: { money: 3500 } },
  { id: 'wg_cook30',   label: '주간 요리 30회',       type: 'cook',  goal: 30,    reward: { money: 4500 } },
  { id: 'wg_party10',  label: '파티 낚시 10회',       type: 'party', goal: 10,    reward: { money: 6000 } },
  { id: 'wg_boss2',    label: '월드 보스 2회 참전',   type: 'boss',  goal: 2,     reward: { money: 15000 } },
];

export function getWeeklyGoals() {
  const d = new Date();
  // Week key: year + ISO week number
  const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - dayOfWeek + 1);
  const weekStr = `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
  let hash = 0;
  for (let i = 0; i < weekStr.length; i++) hash = (hash * 31 + weekStr.charCodeAt(i)) >>> 0;
  const picked = [];
  const pool = [...WEEKLY_GOAL_POOL];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = hash % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
    hash = (hash * 1664525 + 1013904223) >>> 0;
  }
  return { goals: picked, weekKey: weekStr };
}

export const DEFAULT_STATE = {
  money: 100,
  rod: '초급낚시대',
  ownedRods: ['초급낚시대'],
  rodEnhance: { 초급낚시대: 0 },
  fishInventory: [],
  oreInventory: { 철광석: 0, 구리광석: 0, 수정: 0, 금광석: 0, 고대광석: 0, 빙정광석: 0 },
  fishCaught: 0,
  boots: '기본신발',
  ownedBoots: ['기본신발'],
  abilities: { ...DEFAULT_ABILITIES },
  equippedBait: null,
  ownedBait: [],
  baitInventory: {},
  cookware: null,
  ownedCookware: [],
  dailyQuests: [],
  questProgress: {},
  questClaimed: {},
  questDate: '',
  herbInventory: {},
  lastSaveTime: Date.now(),
  hairColor: '#5a3010',
  bodyColor: '#5a7aaa',
  skinColor: '#f6cc88',
  gender: 'male',
  caughtSpecies: [],
  fishRecords: {},
  firstLoginDate: null,
  marineGear: null,
  ownedMarineGear: [],
  pickaxe: '나무곡괭이',
  ownedPickaxes: ['나무곡괭이'],
  pickaxeEnhance: { 나무곡괭이: 0 },
  gatherTool: '맨손',
  ownedGatherTools: ['맨손'],
  processedOreInventory: {},
  jewelryInventory: [],
  equippedJewelry: {},
  potionInventory: {},
  activePotion: null,
  achievements: [],
  achStats: {},
  petEggs: {},
  activePet: null,
  petLevels: {},
  petExp: {},
  innBuff: null,
  innRestAt: null,
  npcAffinity: { 상인: 0, 요리사: 0, 여관주인: 0, 채굴사: 0, 은행원: 0, 행상인: 0, 노련한광부: 0, 산신령: 0, 심해탐험가: 0, 어시장상인: 0, 선장: 0, 유물학자: 0, 설인: 0 },
  exploredZones: [],
  farmPlots: [],
  farmExpansionCount: 0,
  cropInventory: {},
  bankDeposit: 0,
  bankLastInterest: null,
  bankLoan: 0,
  mineDepth: 1,
  merchantBaitDate: '',
  sanSinryeongBuffDate: '',
  mountainBuff: null,
  npcQuestStep: {},
  npcChatAt: {},
  selectedJob: null,
  shownSeasonStories: [],
  rodSkins: [],
  ownedCostumes: [],
  activeCostume: null,
  trophyFish: [],
  hat: null,
  ownedHats: [],
  outfit: '기본낚시복',
  ownedOutfits: ['기본낚시복'],
  top: '기본상의',
  ownedTops: ['기본상의'],
  bottom: '기본하의',
  ownedBottoms: ['기본하의'],
  belt: null,
  ownedBelts: [],
  activeRodSkin: '기본스킨',
  ownedRodSkins: ['기본스킨'],
  spotDecos: [],
  shownChapters: [],
  tutorialDone: false,
  seenFeatures: [], // list of feature keys that user has seen
  // 주거 시스템
  cottage: {
    furniture: [],      // [{ id, key, x, y }] — 배치된 가구 목록
    achieveDisplay: [], // 최대 6개 업적 키 — 벽 전시
    trophyWall: [],     // 최대 12개 { fishName, size } — 트로피 벽
    visited: 0,         // 방문자 수
  },
  // Phase 8: 도감 로그 (per-item counts for encyclopedia)
  herbLog: {},    // { 들풀: n, 버섯: n, 희귀허브: n }
  oreLog: {},     // { 철광석: n, 구리광석: n, 수정: n, 금광석: n }
  dishLog: {},    // { dishKey: n }
  smeltLog: {},   // { smeltKey: n }
  jewelLog: {},   // { jewelKey: n }
  potionLog: {},  // { potionKey: n }
  cropLog: {},    // { cropName: n }
  // Phase 8-2: 납품 주문
  deliveryOrders: [],   // [{ id, npc, item, itemType, qty, reward, deadline }]
  deliveryDate: '',     // last order generation date
  // Phase 8-2: 미끼 DIY
  diyBaitLog: {},       // { baitKey: n }
  // Phase 8-2: 레시피 발견 시스템
  discoveredRecipes: [], // [dishKey, ...] — 발견된 요리 레시피 목록
  // Phase 9-6: NPC Story Conclusion
  seenChapter4: false,
  seenChapter5: false,
  // Phase 9-1: Prestige
  prestigeCount: 0,
  prestigePermanentSellBonus: 0,
  prestigePending: false,
  // Phase 9-3: Season Pass
  seasonPassXP: 0,
  seasonPassTier: 0,
  seasonPassClaimedTiers: [],
  lastSeasonReset: '',
  equippedTitle: null,   // null = 자동 (최고 달성 칭호), string = 장착한 칭호 label
  // World zones
  worldZone: '마을',
  visitedZones: ['마을'],
  zoneMastery: {},
  playerX: null,
  playerY: null,
  // Character stats (STR/DEX/INT/VIT/LUK)
  stats: { str: 0, dex: 0, int: 0, vit: 0, luk: 0 },
  charXP: 0,
  // Phase 12-1: 펫 진화
  evolvedPets: {},
  specialItems: {},
  evolutionGemDate: '',
  // Phase 12-2: 계절 축제
  festivalEndDate: null,
  festivalSeasonSeen: [],
  festivalParticipated: [],
  // Phase 12-3: 마을 발전
  myTownContributions: {},
  // Phase 12-4: 전문 직업
  jobClass: null,
  // Phase 12-5: 활동 포인트
  activityPoints: 0,
  totalPointsEarned: 0,
  ownedPointTitles: [],
  ownedSpecialFurniture: [],
  // Phase 13: new zone actions
  setiDrinkDate: '',        // 설인 따뜻한 음료 1일 1회
  harborFishCount: 0,       // 항구마을 낚시 마릿수 (업적용)
  harborFishSellTotal: 0,   // 항구마을 판매 누적 골드 (칭호용)
  templeOreCount: 0,        // 고대신전 고대광석 채굴 수 (업적용)
  snowMasteryTime: 0,       // 설산정상 활동 exp (업적용)
  // Phase 14: 존 일일 챌린지
  zoneChallengeDate: '',    // 마지막 챌린지 날짜 (reset 감지)
  zoneChallengeProgress: {}, // { [zone]: { id, progress, claimed } }
  // Phase 15-2: NPC 선물 시스템
  npcGiftDate: '',
  npcGiftCountToday: 0,
  npcGiftFavoriteCount: 0, // 업적용: 선호 아이템 선물 총 횟수
  npcGiftTotalCount: 0,    // 업적용: 선물 총 횟수
  // Phase 15-4: 존별 낚시 미니게임
  tidalGameWins: 0,
  iceHoleGameWins: 0,
  // Phase 15-5: 오두막 업그레이드
  cottageLevel: 1,
  // Phase 15-3: 시즌 보상
  seasonRewardClaimed: {},
  // Phase 15-1: 보스 기여 이력
  bossContribHistory: [],
  // Phase 16-1: 낚시 마스터리 특성 트리
  masteryPerks: {},
  masteryPerkPoints: 0,
  miningPerks: {},
  miningPerkPoints: 0,
  // Phase 16-2: 장인 작업대
  artisanLog: {},
  // Phase 16-3: 동적 날씨 이벤트
  weatherEventHistory: [],
  // Phase 16-4: 친구 & 주간 목표
  friends: [],
  weeklyGoals: {},
  weeklyGoalDate: '',
  // Phase 16-5: 외곽 NPC S2 퀘스트
  npcQuestS2Done: [],
  // Zone mini-game progression
  zoneMiniGameLevels: { mine: 0, fishing: 0, farm: 0 },
  zoneTutorialSeen: { mine: false, fishing: false, farm: false },
  zoneMiniGamePerks: { mine: [], fishing: [], farm: [] },
  zoneMiniGamePerkPoints: { mine: 0, fishing: 0, farm: 0 },
};

export const SAVE_VERSION = 2;
export function saveKey(nickname) { return `fishingGame_v2_${nickname}`; }
export function saveKeyV1(nickname) { return `fishingGame_v1_${nickname}`; }

// In-memory save cache — replaces localStorage to prevent client-side manipulation
const _saveCache = {};
export function setSaveCache(nickname, data) { _saveCache[nickname] = data; }
export function getSaveCache(nickname) { return _saveCache[nickname] ?? null; }

export function loadSave(nickname) {
  try {
    const raw = _saveCache[nickname] ?? null;
    const s = JSON.parse(raw);
    if (!s) return DEFAULT_STATE;
    const savedAbil = s.abilities ?? {};
    const abilities = Object.fromEntries(
      Object.keys(DEFAULT_ABILITIES).map(k => [
        k,
        (savedAbil[k] && typeof savedAbil[k].value === 'number')
          ? savedAbil[k]
          : { value: 0.00, grade: 0 },
      ])
    );
    const rod = s.rod ?? '초급낚시대';
    const ownedRods = s.ownedRods ?? ['초급낚시대'];
    const rodEnhance = s.rodEnhance ?? Object.fromEntries(ownedRods.map(r => [r, 0]));
    return {
      money: s.money ?? 100,
      rod,
      ownedRods,
      rodEnhance,
      fishInventory: s.fishInventory ?? [],
      oreInventory: { 철광석: 0, 구리광석: 0, 수정: 0, 금광석: 0, 고대광석: 0, 빙정광석: 0, ...(s.oreInventory ?? {}) },
      fishCaught: s.fishCaught ?? 0,
      boots: s.boots ?? '기본신발',
      ownedBoots: s.ownedBoots ?? ['기본신발'],
      abilities,
      equippedBait: s.equippedBait ?? null,
      ownedBait: s.ownedBait ?? [],
      baitInventory: s.baitInventory ?? {},
      cookware: s.cookware ?? null,
      ownedCookware: s.ownedCookware ?? [],
      dailyQuests: s.dailyQuests ?? [],
      questProgress: s.questProgress ?? {},
      questClaimed: s.questClaimed ?? {},
      questDate: s.questDate ?? '',
      herbInventory: s.herbInventory ?? {},
      lastSaveTime: s.lastSaveTime ?? Date.now(),
      hairColor: s.hairColor ?? '#5a3010',
      bodyColor: s.bodyColor ?? '#5a7aaa',
      skinColor: s.skinColor ?? '#f6cc88',
      gender: s.gender ?? 'male',
      caughtSpecies: s.caughtSpecies ?? [],
      fishRecords: s.fishRecords ?? {},
      firstLoginDate: s.firstLoginDate ?? null,
      marineGear: s.marineGear ?? null,
      ownedMarineGear: s.ownedMarineGear ?? [],
      pickaxe: s.pickaxe ?? '나무곡괭이',
      ownedPickaxes: s.ownedPickaxes ?? ['나무곡괭이'],
      pickaxeEnhance: s.pickaxeEnhance ?? { 나무곡괭이: 0 },
      gatherTool: s.gatherTool ?? '맨손',
      ownedGatherTools: s.ownedGatherTools ?? ['맨손'],
      processedOreInventory: s.processedOreInventory ?? {},
      jewelryInventory: s.jewelryInventory ?? [],
      equippedJewelry: s.equippedJewelry ?? {},
      potionInventory: s.potionInventory ?? {},
      activePotion: s.activePotion ?? null,
      achievements: s.achievements ?? [],
      achStats: s.achStats ?? {},
      petEggs: s.petEggs ?? {},
      activePet: typeof s.activePet === 'string' ? s.activePet : null,
      petLevels: Object.fromEntries(Object.entries(s.petLevels ?? {}).map(([k, v]) => [k, typeof v === 'number' ? v : 1])),
      petExp: Object.fromEntries(Object.entries(s.petExp ?? {}).map(([k, v]) => [k, typeof v === 'number' ? v : 0])),
      innBuff: s.innBuff ?? null,
      innRestAt: s.innRestAt ?? null,
      npcAffinity: { 상인: 0, 요리사: 0, 여관주인: 0, 채굴사: 0, 은행원: 0, 행상인: 0, 노련한광부: 0, 산신령: 0, 심해탐험가: 0, 어시장상인: 0, 선장: 0, 유물학자: 0, 설인: 0, ...(s.npcAffinity ?? {}) },
      exploredZones: s.exploredZones ?? [],
      farmPlots: s.farmPlots ?? [],
      farmExpansionCount: s.farmExpansionCount ?? 0,
      cropInventory: s.cropInventory ?? {},
      bankDeposit: s.bankDeposit ?? 0,
      bankLastInterest: s.bankLastInterest ?? null,
      bankLoan: s.bankLoan ?? 0,
      mineDepth: s.mineDepth ?? 1,
      merchantBaitDate: s.merchantBaitDate ?? '',
      sanSinryeongBuffDate: s.sanSinryeongBuffDate ?? '',
      mountainBuff: s.mountainBuff ?? null,
      npcQuestStep: s.npcQuestStep ?? {},
      npcChatAt: s.npcChatAt ?? {},
      selectedJob: s.selectedJob ?? null,
      shownSeasonStories: s.shownSeasonStories ?? [],
      rodSkins: s.rodSkins ?? [],
      ownedCostumes: s.ownedCostumes ?? [],
      activeCostume: s.activeCostume ?? null,
      trophyFish: s.trophyFish ?? [],
      hat: s.hat ?? null,
      ownedHats: s.ownedHats ?? [],
      outfit: s.outfit ?? '기본낚시복',
      ownedOutfits: s.ownedOutfits ?? ['기본낚시복'],
      top: s.top ?? '기본상의',
      ownedTops: s.ownedTops ?? ['기본상의'],
      bottom: s.bottom ?? '기본하의',
      ownedBottoms: s.ownedBottoms ?? ['기본하의'],
      belt: s.belt ?? null,
      ownedBelts: s.ownedBelts ?? [],
      activeRodSkin: s.activeRodSkin ?? '기본스킨',
      ownedRodSkins: s.ownedRodSkins ?? ['기본스킨'],
      spotDecos: s.spotDecos ?? [],
      shownChapters: s.shownChapters ?? [],
      cottage: s.cottage ?? {
        furniture: [], achieveDisplay: [], trophyWall: [], visited: 0,
      },
      tutorialDone: s.tutorialDone ?? false,
      seenFeatures: s.seenFeatures ?? [],
      herbLog: s.herbLog ?? {},
      oreLog: s.oreLog ?? {},
      dishLog: s.dishLog ?? {},
      smeltLog: s.smeltLog ?? {},
      jewelLog: s.jewelLog ?? {},
      potionLog: s.potionLog ?? {},
      cropLog: s.cropLog ?? {},
      deliveryOrders: s.deliveryOrders ?? [],
      deliveryDate: s.deliveryDate ?? '',
      diyBaitLog: s.diyBaitLog ?? {},
      discoveredRecipes: s.discoveredRecipes ?? [],
      seenChapter4: s.seenChapter4 ?? false,
      seenChapter5: s.seenChapter5 ?? false,
      prestigeCount: s.prestigeCount ?? 0,
      prestigePermanentSellBonus: s.prestigePermanentSellBonus ?? 0,
      prestigePending: false,
      seasonPassXP: s.seasonPassXP ?? 0,
      seasonPassTier: s.seasonPassTier ?? 0,
      seasonPassClaimedTiers: s.seasonPassClaimedTiers ?? [],
      lastSeasonReset: s.lastSeasonReset ?? '',
      equippedTitle: s.equippedTitle ?? null,
      worldZone: s.worldZone ?? '마을',
      visitedZones: s.visitedZones ?? ['마을'],
      zoneMastery: s.zoneMastery ?? {},
      playerX: s.playerX ?? null,
      playerY: s.playerY ?? null,
      stats: {
        str: s.stats?.str ?? 0,
        dex: s.stats?.dex ?? 0,
        int: s.stats?.int ?? 0,
        vit: s.stats?.vit ?? 0,
        luk: s.stats?.luk ?? 0,
      },
      charXP: s.charXP ?? 0,
      // Phase 12-1
      evolvedPets: s.evolvedPets ?? {},
      specialItems: s.specialItems ?? {},
      evolutionGemDate: s.evolutionGemDate ?? '',
      // Phase 12-2
      festivalEndDate: s.festivalEndDate ?? null,
      festivalSeasonSeen: s.festivalSeasonSeen ?? [],
      festivalParticipated: s.festivalParticipated ?? [],
      // Phase 12-3
      myTownContributions: s.myTownContributions ?? {},
      // Phase 12-4
      jobClass: s.jobClass ?? null,
      // Phase 12-5
      activityPoints: s.activityPoints ?? 0,
      totalPointsEarned: s.totalPointsEarned ?? 0,
      ownedPointTitles: s.ownedPointTitles ?? [],
      ownedSpecialFurniture: s.ownedSpecialFurniture ?? [],
      // Phase 13
      setiDrinkDate: s.setiDrinkDate ?? '',
      harborFishCount: s.harborFishCount ?? 0,
      harborFishSellTotal: s.harborFishSellTotal ?? 0,
      templeOreCount: s.templeOreCount ?? 0,
      snowMasteryTime: s.snowMasteryTime ?? 0,
      // Phase 14
      zoneChallengeDate: s.zoneChallengeDate ?? '',
      zoneChallengeProgress: s.zoneChallengeProgress ?? {},
      // Phase 15
      npcGiftDate: s.npcGiftDate ?? '',
      npcGiftCountToday: s.npcGiftCountToday ?? 0,
      npcGiftFavoriteCount: s.npcGiftFavoriteCount ?? 0,
      npcGiftTotalCount: s.npcGiftTotalCount ?? 0,
      tidalGameWins: s.tidalGameWins ?? 0,
      iceHoleGameWins: s.iceHoleGameWins ?? 0,
      cottageLevel: s.cottageLevel ?? 1,
      seasonRewardClaimed: s.seasonRewardClaimed ?? {},
      bossContribHistory: s.bossContribHistory ?? [],
      masteryPerks: s.masteryPerks ?? {},
      masteryPerkPoints: s.masteryPerkPoints ?? 0,
      miningPerks: s.miningPerks ?? {},
      miningPerkPoints: s.miningPerkPoints ?? 0,
      artisanLog: s.artisanLog ?? {},
      weatherEventHistory: s.weatherEventHistory ?? [],
      friends: s.friends ?? [],
      weeklyGoals: s.weeklyGoals ?? {},
      weeklyGoalDate: s.weeklyGoalDate ?? '',
      npcQuestS2Done: s.npcQuestS2Done ?? [],
      zoneMiniGameLevels: { mine: 0, fishing: 0, farm: 0, ...(s.zoneMiniGameLevels ?? {}) },
      zoneTutorialSeen: { mine: false, fishing: false, farm: false, ...(s.zoneTutorialSeen ?? {}) },
      zoneMiniGamePerks: { mine: [], fishing: [], farm: [], ...(s.zoneMiniGamePerks ?? {}) },
      zoneMiniGamePerkPoints: { mine: 0, fishing: 0, farm: 0, ...(s.zoneMiniGamePerkPoints ?? {}) },
    };
  } catch { return DEFAULT_STATE; }
}

export const DAILY_BONUS = 300;

export const STORY_CHAPTERS = [
  {
    id: 0,
    trigger: 1,
    title: '챕터 0: 낚시 마을의 시작',
    lines: [
      '📖 [챕터 0] 낚시 마을 타이드헤이븐에 첫 발을 내딛은 당신...',
      '💬 민준: "드디어 오셨군요! 이 마을은 낚시와 채굴로 살아가는 조용한 곳이에요."',
      '💬 미나: "여관에 언제든 들러주세요. 몸이 지치면 쉬어야 멀리 갈 수 있답니다~"',
      '🗺️ 탐험을 시작하세요! 마을 곳곳에 숨겨진 비밀이 기다리고 있습니다.',
    ],
  },
  {
    id: 1,
    trigger: 50,
    title: '챕터 1: 바다의 부름',
    lines: [
      '📖 [챕터 1] 물고기 50마리... 마을 사람들이 당신을 알아보기 시작했습니다.',
      '💬 민준: "실력이 많이 늘었네요! 이제 더 좋은 낚싯대를 써볼 때가 됐어요."',
      '💬 철수: "광산도 도전해보세요. 깊이 파고들수록 귀한 광석이 나온답니다!"',
      '💬 수연: "음식 재료를 구해오면 특별 요리를 가르쳐드릴게요. 어때요?"',
      '🗺️ 새로운 탐험 구역이 개방되었을지도 몰라요. 마을 주변을 탐색해보세요!',
    ],
  },
  {
    id: 2,
    trigger: 200,
    title: '챕터 2: 전설의 흔적',
    lines: [
      '📖 [챕터 2] 물고기 200마리... 당신은 이제 타이드헤이븐의 유명인사가 됐습니다.',
      '💬 미나: "마을 사람들이 당신 이야기를 해요! 전설의 물고기를 잡을 수 있는 낚시꾼이라고요."',
      '💬 민준: "옛날에 이 바다에서 전설의 용고기가 목격됐다는 기록이 있어요... 정말일까요?"',
      '💬 철수: "광산 깊은 곳에는 고대 문명의 흔적이 있다는 소문이 있어요. 광산유적 말이에요."',
      '🔮 전설급 탐험 구역이 해금되었을 수 있습니다. 능력치를 올려 도전해보세요!',
    ],
  },
  {
    id: 3,
    trigger: 500,
    title: '챕터 3: 신화의 경지',
    lines: [
      '📖 [챕터 3] 물고기 500마리... 당신의 이름은 전설이 되었습니다.',
      '💬 민준: "이 바다의 모든 물고기를 도감에 담으면 진정한 바다의 주인이 될 거예요!"',
      '💬 수연: "신화 물고기 요리... 전설에 따르면 먹는 순간 시간이 멈춘다고 해요. 정말일까요?"',
      '💬 철수: "광산 최하층... 5층에는 고대 보석이 잠들어 있어요. 당신만이 찾을 수 있을 거예요."',
      '💬 미나: "모든 여정의 끝에는 새로운 시작이 있죠. 타이드헤이븐은 언제나 여기 있을 거예요."',
      '🌟 당신은 타이드헤이븐의 신화가 되었습니다. 도전은 계속됩니다!',
    ],
  },
];

export function checkDailyBonus(nickname) {
  const dailyKey = `fishingGame_daily_${nickname}`;
  const streakKey = `fishingGame_streak_${nickname}`;
  const today = new Date().toDateString();
  const last = localStorage.getItem(dailyKey);
  if (last === today) return { bonus: 0, streak: (() => { try { return JSON.parse(localStorage.getItem(streakKey))?.streak ?? 1; } catch { return 1; } })() };

  let streak = 1;
  try {
    const streakData = JSON.parse(localStorage.getItem(streakKey));
    if (streakData) {
      const lastDate = new Date(streakData.lastDate);
      const todayDate = new Date(today);
      const diffDays = Math.round((todayDate - lastDate) / 86400000);
      if (diffDays === 1) {
        streak = (streakData.streak ?? 1) + 1;
      } else if (diffDays === 0) {
        streak = streakData.streak ?? 1;
      } else {
        streak = 1;
      }
    }
  } catch { streak = 1; }

  localStorage.setItem(dailyKey, today);
  localStorage.setItem(streakKey, JSON.stringify({ streak, lastDate: today }));

  let bonus = DAILY_BONUS;
  if (streak >= 14) bonus += 1000;
  else if (streak >= 7) bonus += 500;
  else if (streak >= 3) bonus += 200;

  return { bonus, streak };
}

// Standard rarity colors
const RARITY_COLORS_STD = { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' };
// Colorblind-friendly rarity colors (uses shapes via text + color contrast)
const RARITY_COLORS_CB  = { 흔함: '#999999', 보통: '#4499ee', 희귀: '#ee6600', 전설: '#ffcc00', 신화: '#cc88ff' };

export function rarityColor(r, colorBlind = false) {
  return (colorBlind ? RARITY_COLORS_CB : RARITY_COLORS_STD)[r] ?? '#fff';
}

// useGameState hook: manages gs state and stateRef
export function useGameState() {
  const [gs, setGs] = useState(DEFAULT_STATE);
  const stateRef = useRef(null);
  useEffect(() => { stateRef.current = gs; }, [gs]);
  return { gs, setGs, stateRef };
}
