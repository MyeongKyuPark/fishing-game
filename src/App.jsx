import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import GameCanvas from './GameCanvas';
import { playFishCatch, playFishingStart, playOreMined, playCookComplete, playSellSound, playEnterRoom, playNpcInteract, playLevelUp } from './soundManager';
import { playBgm, stopBgm, setBgmVolume, getBgmVolume } from './bgm';
import IndoorCanvas from './IndoorCanvas';
import Chat from './Chat';
import Joystick from './Joystick';
import Leaderboard from './Leaderboard';
import RankSidebar from './RankSidebar';
import ChannelLobby from './ChannelLobby';
import { saveFishRecord, saveOverallFishRecord, savePlayerTitle, broadcastAnnouncement, subscribeAnnouncements, incrementServerStat, subscribeServerStats } from './ranking';
import { updatePlayerPresence, removePlayerPresence, subscribeOtherPlayers } from './multiplay';
import { FISH, RODS, ORES, BOOTS, BAIT, COOKWARE, HERBS, MARINE_GEAR, PICKAXES, GATHER_TOOLS,
  SMELT_RECIPES, JEWELRY_RECIPES, POTION_RECIPES, DISH_RECIPES, SEEDS, MAX_FARM_PLOTS,
  weightedPick, randInt, TILE_SIZE,
  getAbilityFishTable, rodEnhanceCost, rodEnhanceMatsNeeded, rodEnhanceSuccessRate, rodEnhanceEffect,
  pickaxeEnhanceCost, pickaxeEnhanceMatsNeeded, pickaxeEnhanceSuccessRate, pickaxeEnhanceEffect,
  ZONE_FISH, FISHING_ZONES } from './gameData';
import { DEFAULT_ABILITIES, ABILITY_DEFS, gainAbility, doGradeUp, gradeRareBonus,
  FISH_ABILITY_GAIN, ORE_ABILITY_GAIN, COOK_ABILITY_GAIN,
  SELL_ABILITY_PER_100G, STAMINA_GAIN, ENHANCE_ABILITY_GAIN } from './abilityData';
import { getTitle, TITLES } from './titleData';
import { getWeather, msUntilNextWeather } from './weatherData';
import { nearestChair, nearShop, nearCooking, isInMineZone, isInForestZone, isOnWater, CHAIR_RANGE, pickOre, pickHerb, DOOR_TRIGGERS, nearFarm } from './mapData';
import { ACHIEVEMENTS, checkAchievements } from './achievementData';
import { PETS, PET_RARITY_COLOR, PET_EXP_THRESHOLDS, PET_MAX_LEVEL, PET_LEVEL_MULT } from './petData';
import { NPCS, getAffinityLevel, getShopDiscount } from './npcData';
import { EXPLORE_ZONES, checkZoneUnlock } from './explorationData';

const SKIN_PRESETS = ['#f6cc88', '#e8a870', '#c8845a', '#a06040', '#7a4830', '#fddbb4'];

function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [gender, setGender] = useState('male');
  const [hairColor, setHairColor] = useState('#5a3010');
  const [bodyColor, setBodyColor] = useState('#5a7aaa');
  const [skinColor, setSkinColor] = useState('#f6cc88');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setErr('닉네임을 입력해주세요.'); return; }
    if (trimmed.length < 2) { setErr('2글자 이상 입력해주세요.'); return; }
    if (trimmed.length > 12) { setErr('12글자 이하로 입력해주세요.'); return; }
    onLogin(trimmed, { hairColor, bodyColor, skinColor, gender });
  };

  return (
    <div className="login-bg">
      <div className="login-box">
        <div className="login-icon">🎣</div>
        <h1 className="login-title">Tidehaven</h1>
        <p className="login-sub">낚시와 채굴의 조용한 마을</p>
        <form className="login-form" onSubmit={submit}>
          <label className="login-label">닉네임</label>
          <input
            className="login-input"
            type="text"
            placeholder="2~12글자"
            value={name}
            onChange={e => { setName(e.target.value); setErr(''); }}
            autoFocus
            maxLength={12}
          />

          {/* Gender */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            {['male', 'female'].map(g => (
              <button key={g} type="button" onClick={() => setGender(g)} style={{
                padding: '6px 20px', borderRadius: 8, border: `2px solid ${gender === g ? '#88ccff' : 'rgba(255,255,255,0.2)'}`,
                background: gender === g ? 'rgba(100,180,255,0.2)' : 'rgba(255,255,255,0.06)',
                color: gender === g ? '#88ccff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13,
              }}>
                {g === 'male' ? '♂ 남성' : '♀ 여성'}
              </button>
            ))}
          </div>

          {/* Skin color presets */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textAlign: 'center' }}>피부색</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {SKIN_PRESETS.map(c => (
                <button key={c} type="button" onClick={() => setSkinColor(c)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: `3px solid ${skinColor === c ? '#fff' : 'transparent'}`,
                  outline: 'none', padding: 0,
                }} />
              ))}
            </div>
          </div>

          {/* Hair & Body colors */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              머리색
              <input type="color" value={hairColor} onChange={e => setHairColor(e.target.value)} style={{ width: 36, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
            </label>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              옷 색
              <input type="color" value={bodyColor} onChange={e => setBodyColor(e.target.value)} style={{ width: 36, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
            </label>
          </div>

          {err && <div className="login-err">{err}</div>}
          <button className="login-btn" type="submit">입장하기</button>
        </form>
        <p className="login-hint">방향키로 이동 · !낚시 · !광질 · !도움말</p>
      </div>
    </div>
  );
}

const QUEST_POOL = [
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

function getDailyQuests() {
  const dateStr = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  const picked = [];
  const pool = [...QUEST_POOL];
  for (let i = 0; i < 4 && pool.length > 0; i++) {
    const idx = hash % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
    hash = (hash * 1664525 + 1013904223) >>> 0;
  }
  return picked;
}

const DEFAULT_STATE = {
  money: 100,
  rod: '초급낚시대',
  ownedRods: ['초급낚시대'],
  rodEnhance: { 초급낚시대: 0 }, // { rodKey: enhanceLevel }
  fishInventory: [],
  oreInventory: { 철광석: 0, 구리광석: 0, 수정: 0, 금광석: 0 },
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
  fishRecords: {},             // { fishName: { size: float, caughtAt: timestamp } }
  firstLoginDate: null,
  marineGear: null,
  ownedMarineGear: [],
  pickaxe: '나무곡괭이',
  ownedPickaxes: ['나무곡괭이'],
  pickaxeEnhance: { 나무곡괭이: 0 },
  gatherTool: '맨손',
  ownedGatherTools: ['맨손'],
  processedOreInventory: {},  // { 정제철: 2, ... }
  jewelryInventory: [],       // [{ id, name, ... }]
  equippedJewelry: {},        // { ring: '수정반지', necklace: '황금목걸이' }
  potionInventory: {},        // { 이동속도포션: 2, ... }
  activePotion: null,         // { type, effectKey, value, expiresAt }
  // Achievements
  achievements: [],           // array of completed achievement ids
  achStats: {},               // { fishCaught, oreMined, legendaryCount, mythicCount, speciesCount, herbGathered, maxMoney, totalSold, enhanceCount, smeltCount, cookCount, loginStreak }
  // Pets
  petEggs: {},                // { petKey: { boughtAt: timestamp, hatchAt: timestamp } }
  activePet: null,            // petKey string
  petLevels: {},              // { petKey: 1-5 }
  petExp: {},                 // { petKey: totalExp }
  // Inn
  innBuff: null,              // { expiresAt: ms } or null
  innRestAt: null,            // timestamp of last free rest
  // NPC Affinity
  npcAffinity: { 상인: 0, 요리사: 0, 여관주인: 0 },  // 0~100 affinity per NPC
  // Exploration
  exploredZones: [],          // ['비밀낚시터', '심층광맥', '신비의숲', '고대유적']
  // Farming
  farmPlots: [],              // [{ id, seed, plantedAt, harvestAt, watered, harvested }]
  cropInventory: {},          // { '감자': 3, '당근': 1, ... }
  // Bank
  bankDeposit: 0,             // deposited gold amount
  bankLastInterest: null,     // timestamp of last interest payment
  bankLoan: 0,                // current loan amount (for future use)
};

function saveKey(nickname) { return `fishingGame_v1_${nickname}`; }

function loadSave(nickname) {
  try {
    const s = JSON.parse(localStorage.getItem(saveKey(nickname)));
    if (!s) return DEFAULT_STATE;
    // Merge abilities per-key — default { value:0, grade:0 } for any missing
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
      oreInventory: { ...DEFAULT_STATE.oreInventory, ...s.oreInventory },
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
      activePet: s.activePet ?? null,
      petLevels: s.petLevels ?? {},
      petExp: s.petExp ?? {},
      innBuff: s.innBuff ?? null,
      innRestAt: s.innRestAt ?? null,
      npcAffinity: { 상인: 0, 요리사: 0, 여관주인: 0, ...(s.npcAffinity ?? {}) },
      exploredZones: s.exploredZones ?? [],
      farmPlots: s.farmPlots ?? [],
      cropInventory: s.cropInventory ?? {},
      bankDeposit: s.bankDeposit ?? 0,
      bankLastInterest: s.bankLastInterest ?? null,
      bankLoan: s.bankLoan ?? 0,
    };
  } catch { return DEFAULT_STATE; }
}

const DAILY_BONUS = 300; // G per day

function checkDailyBonus(nickname) {
  const dailyKey = `fishingGame_daily_${nickname}`;
  const streakKey = `fishingGame_streak_${nickname}`;
  const today = new Date().toDateString();
  const last = localStorage.getItem(dailyKey);
  if (last === today) return { bonus: 0, streak: (() => { try { return JSON.parse(localStorage.getItem(streakKey))?.streak ?? 1; } catch { return 1; } })() };

  // Calculate streak
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

function rarityColor(r) {
  return { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' }[r] ?? '#fff';
}

export default function App() {
  const gameRef = useRef({});
  const stateRef = useRef(null);
  const weatherRef = useRef(null);
  const fishSurgeRef = useRef(null);
  const tabId = useRef(Date.now() + '-' + Math.random());
  const channelRef = useRef(null);
  const nicknameRef = useRef('');
  const otherPlayersRef = useRef([]);
  const prevOtherPlayersRef = useRef([]);
  const lastPosRef = useRef({});
  const cmdTimestampsRef = useRef([]); // spam prevention
  const addMsgRef = useRef((text, type) => setMessages(prev => [...prev.slice(-120), { text, type }]));

  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [roomTitle, setRoomTitle] = useState('');
  useEffect(() => { nicknameRef.current = nickname; }, [nickname]);
  const [blocked, setBlocked] = useState(false);
  const [fishSurgeEvent, setFishSurgeEvent] = useState(null);

  const [gs, setGs] = useState(DEFAULT_STATE);
  const [messages, setMessages] = useState([
    { type: 'system', text: '⚓ 낚시 마을에 오신 걸 환영합니다!' },
    { type: 'system', text: '방향키로 이동, !도움말 로 명령어 확인' },
  ]);
  const [activity, setActivity] = useState(null);
  const [showInv, setShowInv] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [sellQty, setSellQty] = useState({});
  const [showRank, setShowRank] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showQuest, setShowQuest] = useState(false);
  const [statsTab, setStatsTab] = useState('장비');
  const [inspectPlayer, setInspectPlayer] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [indoorRoom, setIndoorRoom] = useState(null);
  const [nearDoor, setNearDoor] = useState(null);
  const [nearIndoorNpc, setNearIndoorNpc] = useState(null);
  const prevTitleRef = useRef(null);
  const prevServerStatsRef = useRef({});
  const [serverAnnouncements, setServerAnnouncements] = useState([]);
  const [serverStats, setServerStats] = useState({});
  const [showDex, setShowDex] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [appearanceDraft, setAppearanceDraft] = useState(null); // { hairColor, bodyColor, skinColor }
  const [bankInput, setBankInput] = useState('');

  // BroadcastChannel: 중복 탭 방지
  useEffect(() => {
    const ch = new BroadcastChannel('fishingGame_session');
    channelRef.current = ch;

    ch.onmessage = (e) => {
      if (e.data.tabId === tabId.current) return;
      if (e.data.type === 'gameStart') setBlocked(true);
      if (e.data.type === 'leave') setBlocked(false);
    };

    return () => {
      ch.postMessage({ type: 'leave', tabId: tabId.current });
      ch.close();
    };
  }, []);

  // Keep stateRef in sync
  useEffect(() => { stateRef.current = gs; }, [gs]);

  // Save title to leaderboard whenever it changes
  useEffect(() => {
    if (!nickname) return;
    const t = getTitle(gs);
    if (prevTitleRef.current === t.label) return;
    prevTitleRef.current = t.label;
    const idx = TITLES.findIndex(ti => ti.label === t.label);
    savePlayerTitle(nickname, t.label, t.color, idx);
  }, [nickname, gs]);

  // Multiplayer: subscribe to other players in same room + join/leave notifications
  useEffect(() => {
    if (!nickname || !roomId) return;
    let firstCall = true;
    const unsub = subscribeOtherPlayers(nickname, roomId, (players) => {
      if (!firstCall) {
        const prev = prevOtherPlayersRef.current;
        const prevNicks = new Set(prev.map(p => p.nickname));
        const currNicks = new Set(players.map(p => p.nickname));
        for (const p of players) {
          if (!prevNicks.has(p.nickname))
            addMsgRef.current(`👤 ${p.nickname}님이 입장했습니다.`, 'system');
        }
        for (const p of prev) {
          if (!currNicks.has(p.nickname))
            addMsgRef.current(`👤 ${p.nickname}님이 퇴장했습니다.`, 'system');
        }
      }
      firstCall = false;
      prevOtherPlayersRef.current = players;
      otherPlayersRef.current = players;
    });
    return () => { unsub(); prevOtherPlayersRef.current = []; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname, roomId]);

  // Multiplayer: throttled position sync (5×/sec, only on change) + immediate write on join
  useEffect(() => {
    if (!nickname || !roomId) return;
    const buildInfo = () => {
      const s = stateRef.current;
      if (!s) return {};
      const t = getTitle(s);
      return {
        title: t.label,
        titleColor: t.color,
        boots: s.boots ?? '기본신발',
        abilityVals: Object.fromEntries(Object.keys(DEFAULT_ABILITIES).map(k => [k, s.abilities?.[k]?.value ?? 0])),
        abilityGrades: Object.fromEntries(Object.keys(DEFAULT_ABILITIES).map(k => [k, s.abilities?.[k]?.grade ?? 0])),
        fishCaught: s.fishCaught ?? 0,
        money: s.money ?? 0,
      };
    };
    // Write immediately so others see us right away
    const writeNow = () => {
      const p = gameRef.current?.player;
      if (!p) return;
      lastPosRef.current = { x: p.x, y: p.y, state: p.state, facing: p.facing };
      updatePlayerPresence(nickname, roomId, p.x, p.y, p.state, p.facing, stateRef.current?.rod ?? '초급낚시대', buildInfo());
    };
    const initTimer = setTimeout(writeNow, 300);
    const id = setInterval(() => {
      const p = gameRef.current?.player;
      if (!p) return;
      const last = lastPosRef.current;
      if (p.x === last.x && p.y === last.y && p.state === last.state && p.facing === last.facing) return;
      lastPosRef.current = { x: p.x, y: p.y, state: p.state, facing: p.facing };
      updatePlayerPresence(nickname, roomId, p.x, p.y, p.state, p.facing, stateRef.current?.rod ?? '초급낚시대', buildInfo());
    }, 200);
    return () => { clearTimeout(initTimer); clearInterval(id); };
  }, [nickname, roomId]);

  // Multiplayer: cleanup on page close
  const roomIdRef = useRef(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  const indoorRoomRef = useRef(null);
  useEffect(() => { indoorRoomRef.current = indoorRoom; }, [indoorRoom]);

  // BGM: switch track on room change (only when in a channel)
  useEffect(() => {
    if (!roomId) return;
    const track = indoorRoom ?? 'outdoor';
    playBgm(track);
    return () => {};
  }, [indoorRoom, roomId]);

  // Stop BGM on unmount / tab hide
  useEffect(() => {
    const onHide = () => stopBgm();
    const onShow = () => playBgm(indoorRoomRef.current ?? 'outdoor');
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) onHide(); else onShow();
    });
    return () => stopBgm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const onUnload = () => {
      if (nicknameRef.current && roomIdRef.current)
        removePlayerPresence(nicknameRef.current, roomIdRef.current);
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      if (nicknameRef.current && roomIdRef.current)
        removePlayerPresence(nicknameRef.current, roomIdRef.current);
    };
  }, []);

  // Subscribe to server announcements when logged in
  useEffect(() => {
    if (!nickname || !roomId) return;
    return subscribeAnnouncements(setServerAnnouncements);
  }, [nickname, roomId]);
  // Auto-hide announcement banner after 5 seconds
  useEffect(() => {
    if (serverAnnouncements.length === 0) return;
    setShowAnnounce(true);
    const t = setTimeout(() => setShowAnnounce(false), 5000);
    return () => clearTimeout(t);
  }, [serverAnnouncements]);

  // 전설어 출몰 이벤트: 20~40분마다 랜덤 희귀 물고기 30분 출몰 부스트
  useEffect(() => { fishSurgeRef.current = fishSurgeEvent; }, [fishSurgeEvent]);
  useEffect(() => {
    if (!nickname) return;
    const RARE_FISH = ['감성돔', '우럭', '뱀장어', '황새치', '용고기', '고대어'];
    const scheduleNext = () => {
      const delay = (20 + Math.floor(Math.random() * 20)) * 60 * 1000; // 20~40분
      return setTimeout(() => {
        const fish = RARE_FISH[Math.floor(Math.random() * RARE_FISH.length)];
        const until = Date.now() + 30 * 60 * 1000; // 30분
        setFishSurgeEvent({ fish, until });
        const fd = FISH[fish];
        const rarityLabel = fd?.rarity === '신화' ? '🌟 신화' : '⭐ 전설';
        addMsgRef.current(`📣 [이벤트] ${rarityLabel} ${fish} 출몰! 30분간 출현 확률 상승!`, 'catch');
        const clearTimer = setTimeout(() => {
          setFishSurgeEvent(null);
          addMsgRef.current(`📣 [이벤트] ${fish} 출몰 이벤트가 종료되었습니다.`, 'system');
        }, 30 * 60 * 1000);
        const nextTimer = scheduleNext();
        return () => { clearTimeout(clearTimer); clearTimeout(nextTimer); };
      }, delay);
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, [nickname]);

  // Subscribe to server-wide stats when logged in
  useEffect(() => {
    if (!nickname || !roomId) return;
    return subscribeServerStats(setServerStats);
  }, [nickname, roomId]);

  // Sync speed bonus to game loop (boots + speed potion)
  useEffect(() => {
    if (!gameRef.current) return;
    const bootsBonus = BOOTS[gs.boots]?.speedBonus ?? 0;
    const potionBonus = (gs.activePotion?.effect?.speedBonus ?? 0);
    gameRef.current.speedBonus = bootsBonus + potionBonus;
  }, [gs.boots, gs.activePotion]);

  // Sync marine gear to game loop
  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.marineGear = gs.marineGear ?? null;
  }, [gs.marineGear]);

  // Sync pet bonus to game loop (with level scaling)
  useEffect(() => {
    if (!gameRef.current) return;
    const pet = gs.activePet ? PETS[gs.activePet] : null;
    if (!pet) { gameRef.current.petBonus = {}; return; }
    const level = (gs.petLevels ?? {})[gs.activePet] ?? 1;
    const mult = PET_LEVEL_MULT[Math.min(level, PET_MAX_LEVEL) - 1] ?? 1.0;
    const scaledBonus = {};
    for (const [k, v] of Object.entries(pet.bonus)) {
      if (k.endsWith('Mult')) {
        // Mult values like 0.85 = 15% speed boost; scale the effect portion
        scaledBonus[k] = 1 - (1 - v) * mult;
      } else {
        scaledBonus[k] = v * mult;
      }
    }
    gameRef.current.petBonus = scaledBonus;
  }, [gs.activePet, gs.petLevels]);

  // Sync inn buff to game loop
  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.innBuff = gs.innBuff;
  }, [gs.innBuff]);

  // Sync equipped items visuals to game loop
  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.equippedItems = {
      boots: gs.boots ?? '기본신발',
      ring: gs.equippedJewelry?.ring ?? null,
      necklace: gs.equippedJewelry?.necklace ?? null,
      gatherTool: gs.gatherTool ?? '맨손',
      pickaxe: gs.pickaxe ?? '나무곡괭이',
    };
  }, [gs.boots, gs.equippedJewelry, gs.gatherTool, gs.pickaxe]);

  // Weather: deterministic per room+time, update when period changes
  const [weather, setWeather] = useState(() => getWeather(null, Date.now()));
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { if (gameRef.current) gameRef.current.weather = weather; }, [weather]);
  useEffect(() => { if (gameRef.current) gameRef.current.farmPlots = gs.farmPlots ?? []; }, [gs.farmPlots]);

  // Rain auto-waters unwatered growing crops
  useEffect(() => {
    if (weather?.id !== 'rain') return;
    setGs(prev => {
      const now = Date.now();
      const anyUnwatered = (prev.farmPlots ?? []).some(p => !p.watered && now < p.harvestAt);
      if (!anyUnwatered) return prev;
      const newPlots = (prev.farmPlots ?? []).map(p =>
        (!p.watered && now < p.harvestAt)
          ? { ...p, watered: true, harvestAt: p.harvestAt - Math.floor((p.harvestAt - now) * 0.25) }
          : p
      );
      setTimeout(() => addMsg('🌧️ 비가 내려 작물에 물을 줬습니다! (성장 25% 단축)', 'catch'), 0);
      return { ...prev, farmPlots: newPlots };
    });
  }, [weather?.id, addMsg]);
  useEffect(() => {
    if (!roomId) return;
    setWeather(getWeather(roomId, Date.now()));
    const update = () => setWeather(getWeather(roomId, Date.now()));
    const ms = msUntilNextWeather(Date.now());
    const t = setTimeout(() => {
      update();
      const id = setInterval(update, 8 * 60 * 1000);
      return () => clearInterval(id);
    }, ms);
    return () => clearTimeout(t);
  }, [roomId]);

  // Load save when nickname is established (nickname-keyed, room-independent)
  useEffect(() => {
    if (!nickname) return;
    const saved = loadSave(nickname);
    const { bonus, streak } = checkDailyBonus(nickname);
    const today = new Date().toDateString();
    const quests = getDailyQuests();
    const isNewDay = saved.questDate !== today;
    const questProgress = isNewDay ? {} : (saved.questProgress ?? {});
    const questClaimed = isNewDay ? {} : (saved.questClaimed ?? {});
    const base = { ...saved, dailyQuests: quests, questProgress, questClaimed, questDate: today,
      achStats: { ...(saved.achStats ?? {}), loginStreak: Math.max(saved.achStats?.loginStreak ?? 0, streak) } };
    if (!saved.firstLoginDate) {
      base.firstLoginDate = new Date().toISOString();
    }
    const now2 = Date.now();
    const awayMs = Math.max(0, now2 - (saved.lastSaveTime ?? now2));
    const awayMins = Math.floor(awayMs / 60000);
    const maxMins = 120;
    const effectiveMins = Math.min(awayMins, maxMins);
    const offlineReward = Math.floor(effectiveMins * 8);
    if (bonus > 0) {
      if (streak >= 7) {
        setGs({ ...base, money: saved.money + bonus,
          baitInventory: { ...(base.baitInventory ?? {}), 전설미끼: ((base.baitInventory ?? {})['전설미끼'] ?? 0) + 1 },
          ownedBait: base.ownedBait?.includes('전설미끼') ? base.ownedBait : [...(base.ownedBait ?? []), '전설미끼'],
        });
      } else {
        setGs({ ...base, money: saved.money + bonus });
      }
      setTimeout(() => {
        addMsgRef.current(`🎁 오늘의 출석 보너스 +${bonus}G! (${streak}일 연속 접속)`, 'catch');
        if (streak >= 14) addMsgRef.current(`🏆 14일 연속 접속! +1000G 추가 보너스!`, 'catch');
        else if (streak >= 7) addMsgRef.current(`🌟 7일 연속 접속! +500G + 전설 미끼 1개 지급!`, 'catch');
        else if (streak >= 3) addMsgRef.current(`⭐ 3일 연속 접속! +200G 추가 보너스!`, 'catch');
      }, 1200);
    } else {
      setGs(base);
      if (streak > 1) {
        setTimeout(() => addMsgRef.current(`🔥 ${streak}일 연속 접속 중!`, 'system'), 1200);
      }
    }
    if (offlineReward > 0 && awayMins >= 5) {
      setGs(prev => ({ ...prev, money: prev.money + offlineReward }));
      setTimeout(() => addMsgRef.current(`💤 자리 비운 ${awayMins}분 동안 +${offlineReward}G 획득! (최대 2시간)`, 'catch'), 1800);
    }
  }, [nickname]);

  // Save to localStorage keyed by nickname
  useEffect(() => {
    if (!nickname) return;
    localStorage.setItem(saveKey(nickname), JSON.stringify({ ...gs, lastSaveTime: Date.now() }));
  }, [gs, nickname]);


  const addMsg = useCallback((text, type = 'system') => {
    setMessages(prev => [...prev.slice(-120), { text, type }]);
  }, []);
  useEffect(() => { addMsgRef.current = addMsg; }, [addMsg]);

  // Expire active potion (after addMsg to avoid TDZ)
  useEffect(() => {
    if (!gs.activePotion) return;
    const remaining = gs.activePotion.expiresAt - Date.now();
    if (remaining <= 0) { setGs(prev => ({ ...prev, activePotion: null })); return; }
    const t = setTimeout(() => {
      setGs(prev => ({ ...prev, activePotion: null }));
      addMsg('포션 효과가 종료됐습니다.', 'error');
    }, remaining);
    return () => clearTimeout(t);
  }, [gs.activePotion, addMsg]);

  // Expire inn buff
  useEffect(() => {
    if (!gs.innBuff) return;
    const remaining = gs.innBuff.expiresAt - Date.now();
    if (remaining <= 0) { setGs(prev => ({ ...prev, innBuff: null })); return; }
    const t = setTimeout(() => {
      setGs(prev => ({ ...prev, innBuff: null }));
      addMsg('💤 여관 휴식 버프가 종료됐습니다.', 'info');
    }, remaining);
    return () => clearTimeout(t);
  }, [gs.innBuff, addMsg]);

  // Bank interest: 2% per real-hour, capped at 24h offline
  useEffect(() => {
    if (!nickname) return;
    const deposit = gs.bankDeposit ?? 0;
    if (deposit <= 0) return;
    const now = Date.now();
    const lastInterest = gs.bankLastInterest ?? now;
    const elapsedMs = Math.min(now - lastInterest, 24 * 60 * 60 * 1000); // max 24h
    const hoursElapsed = elapsedMs / (60 * 60 * 1000);
    if (hoursElapsed < 0.01) return; // less than 36 seconds, skip
    const interest = Math.floor(deposit * 0.02 * hoursElapsed);
    if (interest <= 0) return;
    setGs(prev => ({ ...prev, money: prev.money + interest, bankLastInterest: now }));
    addMsg(`🏦 은행 이자 +${interest}G (${deposit.toLocaleString()}G × 2%/시간 × ${hoursElapsed.toFixed(2)}시간)`, 'catch');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname, gs.bankDeposit]);

  // Server collective quest milestone announcements
  useEffect(() => {
    const prev = prevServerStatsRef.current;
    const curr = serverStats;
    const milestones = [1000, 5000, 10000, 50000, 100000];
    for (const m of milestones) {
      if ((prev.totalFishCaught ?? 0) < m && (curr.totalFishCaught ?? 0) >= m) {
        addMsg(`🌍 서버 전체 물고기 ${m.toLocaleString()}마리 달성! 모든 플레이어 +500G 보상!`, 'catch');
        setGs(prev2 => ({ ...prev2, money: prev2.money + 500 }));
      }
    }
    prevServerStatsRef.current = curr;
  }, [serverStats, addMsg]);

  // Grant ability EXP; shows grade-available message if reached 100
  const grantAbility = useCallback((abilName, amount) => {
    const current = stateRef.current?.abilities?.[abilName] ?? { value: 0, grade: 0 };
    const partyBonus = (otherPlayersRef.current?.length ?? 0) > 0;
    const firstLogin = stateRef.current?.firstLoginDate;
    const isNewPlayer = firstLogin && (Date.now() - new Date(firstLogin).getTime()) < 7 * 24 * 60 * 60 * 1000;
    const newPlayerMult = isNewPlayer ? 2 : 1;
    const petAbilMult = gameRef.current?.petBonus?.abilGainMult ?? 1;
    const result = gainAbility(current, amount * newPlayerMult * petAbilMult, partyBonus);
    if (result.reachedMax && current.value < 100) {
      const def = ABILITY_DEFS[abilName];
      setTimeout(() => addMsg(`🌟 ${def?.icon ?? ''} ${abilName} 100.00 달성! 스킬창에서 그레이드업 가능!`, 'catch'), 0);
      if (gameRef.current) {
        gameRef.current.levelUpEffect = { age: 0, type: 'max', abilName, icon: def?.icon, color: def?.color };
      }
    }
    // Level-up flash at 25/50/75 milestones (only if not already at max)
    if (!result.reachedMax || current.value >= 100) {
      const milestones = [25, 50, 75];
      const crossedMilestone = milestones.some(m => current.value < m && result.value >= m);
      if (crossedMilestone && gameRef.current) {
        gameRef.current.levelUpEffect = { age: 0 };
      }
    }
    setGs(prev => ({
      ...prev,
      abilities: { ...(prev.abilities ?? DEFAULT_ABILITIES), [abilName]: { value: result.value, grade: result.grade } },
    }));
  }, []);

  const advanceQuest = useCallback((type, amount = 1) => {
    setGs(prev => {
      const quests = prev.dailyQuests ?? [];
      const progress = { ...(prev.questProgress ?? {}) };
      const messages = [];
      for (const q of quests) {
        if (q.type !== type) continue;
        const prev_val = progress[q.id] ?? 0;
        if (prev_val >= q.goal) continue;
        const next_val = Math.min(q.goal, prev_val + amount);
        progress[q.id] = next_val;
        if (next_val >= q.goal && prev_val < q.goal) {
          messages.push(`🎉 퀘스트 달성: ${q.label}! 퀘스트창에서 수령하세요.`);
        }
      }
      if (messages.length > 0) {
        setTimeout(() => { messages.forEach(m => addMsg(m, 'catch')); }, 0);
      }
      return { ...prev, questProgress: progress };
    });
  }, [addMsg]);

  const checkAndGrantAchievements = useCallback((updatedStats) => {
    setGs(prev => {
      const stats = updatedStats ?? prev.achStats ?? {};
      const already = prev.achievements ?? [];
      const newIds = checkAchievements(stats, already);
      if (newIds.length === 0) return prev;
      let bonusMoney = 0;
      const msgs = [];
      for (const id of newIds) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (!ach) continue;
        bonusMoney += ach.reward?.money ?? 0;
        msgs.push(`${ach.icon} 업적 달성: [${ach.label}]! +${ach.reward?.money ?? 0}G`);
      }
      setTimeout(() => { msgs.forEach(m => addMsgRef.current(m, 'catch')); }, 0);
      return { ...prev, achievements: [...already, ...newIds], money: prev.money + bonusMoney };
    });
  }, []);

  const gainNpcAffinity = useCallback((npcKey, amount) => {
    setGs(prev => {
      const current = prev.npcAffinity?.[npcKey] ?? 0;
      const newVal = Math.min(100, current + amount);
      const npcThresholds = NPCS[npcKey]?.thresholds ?? [];
      const crossed = npcThresholds.find(t => current < t.at && newVal >= t.at);
      if (crossed) {
        setTimeout(() => addMsg(`💖 ${NPCS[npcKey]?.name}와의 관계: [${crossed.label}] 달성! ${crossed.reward}`, 'catch'), 0);
      }
      return { ...prev, npcAffinity: { ...(prev.npcAffinity ?? {}), [npcKey]: newVal } };
    });
  }, [addMsg]);

  // ── Callbacks from game loop ──────────────────────────────────────────────

  const applyBoosts = useCallback((table, boostMap) => {
    return table.map(e => ({ ...e, w: e.w * (boostMap[FISH[e.f]?.rarity] ?? 1) }));
  }, []);

  const onFishCaught = useCallback((rodKey, weatherId) => {
    const rod = RODS[rodKey];
    if (!rod) return;
    const s = stateRef.current;
    const fishAbil  = s?.abilities?.낚시?.value  ?? 0;
    const fishGrade = s?.abilities?.낚시?.grade  ?? 0;
    const speechAbil = s?.abilities?.화술?.value ?? 0;

    // Zone-based fish table selection
    const zone = gameRef.current?.fishingZone ?? '강';
    const zoneDef = FISHING_ZONES[zone];
    let table;
    if (zone === '심해' || zone === '민물' || zone === '바다' || zone === '황금연못') {
      table = ZONE_FISH[zone] ?? getAbilityFishTable(fishAbil);
    } else {
      // '강' — use normal ability-gated table
      table = getAbilityFishTable(fishAbil);
    }

    // Grade rare bonus — boost rare/legendary/mythic weights
    const gradeBoostPct = gradeRareBonus(fishGrade);
    if (gradeBoostPct > 0) {
      table = applyBoosts(table, { 보통: 1 + gradeBoostPct * 0.5, 희귀: 1 + gradeBoostPct, 전설: 1 + gradeBoostPct * 1.5, 신화: 1 + gradeBoostPct * 2 });
    }

    // Party rarity bonus: when 2+ other players nearby, boost rare fish odds
    const partySize = otherPlayersRef.current?.length ?? 0;
    if (partySize >= 1) {
      const partyBoost = Math.min(0.3, partySize * 0.08); // up to 30% boost for 4 players
      table = applyBoosts(table, { 희귀: 1 + partyBoost, 전설: 1 + partyBoost * 1.5, 신화: 1 + partyBoost * 2 });
    }

    // Marine gear rare boost (스쿠버다이빙세트 / 보트)
    const marineKey = s?.marineGear;
    const marineData = marineKey ? MARINE_GEAR[marineKey] : null;
    if (marineData && gameRef.current?.player?.seaFishing) {
      const boost = {};
      for (const r of (marineData.rareBoostRarities ?? [])) boost[r] = marineData.rareMult;
      table = applyBoosts(table, boost);
    }

    // 전설어 출몰 이벤트 부스트
    const surge = fishSurgeRef.current;
    if (surge && Date.now() < surge.until) {
      table = table.map(e => e.f === surge.fish ? { ...e, w: e.w * 4.0 } : e);
    }

    // Potion rare boost
    const potionRareBonus = s?.activePotion?.effect?.rareBonus ?? 0;
    if (potionRareBonus > 0) {
      table = applyBoosts(table, { 희귀: 1 + potionRareBonus, 전설: 1 + potionRareBonus * 1.5, 신화: 1 + potionRareBonus * 2 });
    }

    // Bait boost
    const baitKey = s?.equippedBait;
    const baitData = baitKey ? BAIT[baitKey] : null;
    if (baitData) table = applyBoosts(table, baitData.boost);

    // Apply exploration zone fish boosts
    const explored = s?.exploredZones ?? [];
    for (const zoneId of ['비밀낚시터', '고대유적']) {
      const zone = EXPLORE_ZONES.find(z => z.id === zoneId);
      if (zone && explored.includes(zoneId) && zone.fishBoost) {
        table = applyBoosts(table, zone.fishBoost);
      }
    }

    // Weather fish multiplier embedded in weight boost
    const wMult = weatherRef.current?.fishMult ?? 1.0;
    if (wMult !== 1.0) table = table.map(e => ({ ...e, w: e.w * wMult }));

    const name = weightedPick(table);
    const fd = FISH[name];
    if (!fd) return;
    const size = parseFloat((Math.random() * (fd.maxSz - fd.minSz) + fd.minSz).toFixed(1));
    const avgSz = (fd.minSz + fd.maxSz) / 2;

    // Price: base × size × 화술 ability × rod enhance bonus
    const enhLevel = s?.rodEnhance?.[rodKey] ?? 0;
    const enhEffect = rodEnhanceEffect(enhLevel);
    const price = Math.round(
      fd.price * (size / avgSz)
      * (1 + speechAbil * 0.005 + fishAbil * 0.002 + enhEffect.priceBonus)
    );

    const seaBonus = zoneDef?.seaBonus ?? (gameRef.current?.player?.seaFishing ? 1.5 : 1.0);
    const petSellBonus = 1 + (gameRef.current?.petBonus?.sellBonus ?? 0);
    const finalPrice = Math.round(price * seaBonus * petSellBonus);
    const seaMsg = seaBonus > 1 ? ` 🌊 [${zoneDef?.name ?? zone}] 보너스!` : '';

    // 3% line snap — lose the fish
    if (Math.random() < 0.03) {
      addMsg(`💔 낚싯줄이 끊어졌습니다! ${name} 놓쳤어요...`, 'error');
      if (gameRef.current?.player)
        gameRef.current.player.floatText = { text: '줄 끊김 💔', age: 0, color: '#ff4444' };
      return;
    }

    // 2% treasure chest
    if (Math.random() < 0.02) {
      const treasure = randInt(200, 800);
      setGs(prev => ({ ...prev, money: prev.money + treasure }));
      addMsg(`💰 낚시 중 보물상자 발견! +${treasure}G`, 'catch');
      if (gameRef.current?.player)
        gameRef.current.player.floatText = { text: `보물상자 +${treasure}G`, age: 0, color: '#ffdd00' };
      if (gameRef.current) gameRef.current.treasureEffect = { age: 0, amount: treasure };
    }

    if (baitData?.type === 'once') {
      setGs(prev => {
        const bi = { ...(prev.baitInventory ?? {}), [baitKey]: Math.max(0, (prev.baitInventory?.[baitKey] ?? 1) - 1) };
        return { ...prev, baitInventory: bi, equippedBait: bi[baitKey] <= 0 ? null : prev.equippedBait };
      });
    }
    const id = Date.now() + Math.random();
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const newFishCaught = (prevStats.fishCaught ?? 0) + 1;
      const newLegendary = (prevStats.legendaryCount ?? 0) + (fd.rarity === '전설' ? 1 : 0);
      const newMythic = (prevStats.mythicCount ?? 0) + (fd.rarity === '신화' ? 1 : 0);
      const newSpeciesCount = (prev.caughtSpecies ?? []).includes(name)
        ? (prevStats.speciesCount ?? (prev.caughtSpecies ?? []).length)
        : (prevStats.speciesCount ?? (prev.caughtSpecies ?? []).length) + 1;
      const newMoney = prev.money;
      const newMaxMoney = Math.max(prevStats.maxMoney ?? 0, newMoney);
      const updatedStats = {
        ...prevStats,
        fishCaught: newFishCaught,
        legendaryCount: newLegendary,
        mythicCount: newMythic,
        speciesCount: newSpeciesCount,
        maxMoney: newMaxMoney,
      };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      const prevRecord = prev.fishRecords?.[name]?.size ?? 0;
      const isNewRecord = size > prevRecord;
      return {
        ...prev,
        fishInventory: [...prev.fishInventory, { name, size, price: finalPrice, id }],
        fishCaught: (prev.fishCaught ?? 0) + 1,
        achStats: updatedStats,
        fishRecords: isNewRecord
          ? { ...prev.fishRecords, [name]: { size, caughtAt: Date.now() } }
          : prev.fishRecords,
      };
    });
    const prevRecord = stateRef.current?.fishRecords?.[name]?.size ?? 0;
    const isNewRecord = size > prevRecord;
    addMsg(`🐟 ${name} ${size}cm 낚음! (${finalPrice}G)${seaMsg}${isNewRecord ? ' 🏆 신기록!' : ''}`, 'catch');
    playFishCatch(fd.rarity);
    if (nicknameRef.current) saveFishRecord(nicknameRef.current, name, size);
    if (nicknameRef.current) saveOverallFishRecord(nicknameRef.current, name, size, fd.rarity);
    if (gameRef.current?.player)
      gameRef.current.player.floatText = { text: `${name} ${size}cm`, age: 0, color: rarityColor(fd.rarity) };

    // Legendary/Mythic broadcast + rare visual effect
    if (fd.rarity === '전설' || fd.rarity === '신화') {
      broadcastAnnouncement(`${nicknameRef.current}님이 ${size}cm ${name}을(를) 낚았습니다! ${fd.rarity === '신화' ? '🌟 신화어 출현!' : '⭐ 전설어!'}`);
      if (gameRef.current) gameRef.current.rareEffect = { age: 0, color: rarityColor(fd.rarity), rarity: fd.rarity, fishName: name, size };
    }

    // Spawn fish jump particles for rare+
    if (fd.rarity === '전설' || fd.rarity === '신화' || fd.rarity === '희귀') {
      const p = gameRef.current?.player;
      if (p) {
        const emoji = fd.rarity === '신화' ? '🌟' : fd.rarity === '전설' ? '⭐' : '✨';
        const particles = [];
        for (let i = 0; i < 5; i++) {
          particles.push({
            x: p.x + (Math.random() - 0.5) * 30,
            y: p.y - 20,
            vx: (Math.random() - 0.5) * 3,
            vy: -(3 + Math.random() * 4),
            emoji,
            age: 0,
          });
        }
        gameRef.current.fishParticles = [...(gameRef.current.fishParticles ?? []), ...particles];
      }
    }

    // Fish encyclopedia (caughtSpecies)
    setGs(prev => {
      if (!prev.caughtSpecies?.includes(name)) {
        const newSpecies = [...(prev.caughtSpecies ?? []), name];
        const totalSpecies = Object.keys(FISH).length;
        setTimeout(() => {
          addMsg(`📖 새 물고기 발견! ${name} 도감 등록 (${newSpecies.length}/${totalSpecies})`, 'catch');
          if (newSpecies.length === totalSpecies) {
            addMsg('🏆 도감 완성! 특별 칭호 "박물학자"를 획득했습니다!', 'catch');
            broadcastAnnouncement(`${nicknameRef.current}님이 물고기 도감을 완성했습니다! 🎉`);
          }
        }, 0);
        return { ...prev, caughtSpecies: newSpecies };
      }
      return prev;
    });

    // Server-wide stat
    incrementServerStat('totalFishCaught');

    grantAbility('낚시', FISH_ABILITY_GAIN[fd.rarity] ?? 0.30);
    grantAbility('체력', STAMINA_GAIN);
    advanceQuest('fish');

  }, [addMsg, grantAbility, advanceQuest, checkAndGrantAchievements]);

  const onOreMined = useCallback((oreName) => {
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const updatedStats = { ...prevStats, oreMined: (prevStats.oreMined ?? 0) + 1 };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      return {
        ...prev,
        oreInventory: { ...prev.oreInventory, [oreName]: (prev.oreInventory[oreName] || 0) + 1 },
        achStats: updatedStats,
      };
    });
    addMsg(`⛏ ${oreName} 1개 채굴!`, 'mine');
    playOreMined();
    if (gameRef.current?.player)
      gameRef.current.player.floatText = { text: `+${oreName}`, age: 0, color: ORES[oreName]?.color ?? '#fa4' };
    // Windfall: base 3%, boosted by 두더지 pet windfallBonus
    const windfallChance = 0.03 + (gameRef.current?.petBonus?.windfallBonus ?? 0);
    const windfall = Math.random() < windfallChance;
    if (windfall) {
      const extra = randInt(4, 9);
      setGs(prev => ({
        ...prev,
        oreInventory: { ...prev.oreInventory, [oreName]: (prev.oreInventory[oreName] || 0) + extra },
      }));
      addMsg(`💥 대박! ${oreName} ${extra}개 추가 획득!`, 'catch');
      if (gameRef.current?.player)
        gameRef.current.player.floatText = { text: `💥 ${oreName} ×${extra+1}!`, age: 0, color: '#ffdd00' };
      if (gameRef.current) gameRef.current.shakeEffect = { age: 0, intensity: 8 };
    }
    grantAbility('채굴', ORE_ABILITY_GAIN[oreName] ?? 0.40);
    grantAbility('체력', STAMINA_GAIN);
    advanceQuest('ore');
  }, [addMsg, grantAbility, advanceQuest, checkAndGrantAchievements]);

  const onHerbGathered = useCallback((herbName) => {
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const updatedStats = { ...prevStats, herbGathered: (prevStats.herbGathered ?? 0) + 1 };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      return {
        ...prev,
        herbInventory: { ...(prev.herbInventory ?? {}), [herbName]: ((prev.herbInventory ?? {})[herbName] || 0) + 1 },
        achStats: updatedStats,
      };
    });
    addMsg(`🌿 ${herbName} 1개 채집!`, 'catch');
    if (gameRef.current?.player)
      gameRef.current.player.floatText = { text: `+${herbName}`, age: 0, color: HERBS[herbName]?.color ?? '#8c4' };
    grantAbility('체력', 0.1);
    grantAbility('채집', 0.5);
    advanceQuest('herb');
  }, [addMsg, grantAbility, advanceQuest, checkAndGrantAchievements]);

  const onActivityChange = useCallback((act) => setActivity(act), []);

  // ── Command handler ───────────────────────────────────────────────────────

  const handleCommand = useCallback((input) => {
    const now0 = Date.now();
    const stamps = cmdTimestampsRef.current;
    // Keep only timestamps in last 4 seconds
    cmdTimestampsRef.current = stamps.filter(t => now0 - t < 4000);
    if (cmdTimestampsRef.current.length >= 5) {
      addMsg('⚠️ 너무 빠르게 명령어를 입력하고 있습니다.', 'error');
      return;
    }
    cmdTimestampsRef.current.push(now0);

    const cmd = input.trim().toLowerCase();
    addMsg(`> ${input}`, 'user');

    const g = gameRef.current;
    if (!g?.player) return;
    const player = g.player;
    const s = stateRef.current;

    if (cmd === '!도움말') {
      ['!낚시  – 낚시 시작 (낚시 의자 근처)',
       '!광질  – 채굴 시작 (광산 지역, 동쪽)',
       '!채집  – 허브 채집 (숲 지역)',
       '!그만  – 현재 활동 중지',
       '!요리  – 물고기 요리 (요리소 근처)',
       '!요리책  – 특별 요리 레시피 목록',
       '!요리 [요리명] – 특별 요리 만들기 (요리소 근처)',
       '!상점  – 상점 열기 (상점 건물 근처)',
       '!판매  – 물고기 전체 판매 (상점 근처)',
       '!인벤  – 인벤토리 열기/닫기',
       '!랭킹  – 랭킹 보기',
       '!스탯  – 캐릭터 스탯 보기',
       '!퀘스트 – 오늘의 퀘스트 확인',
       '!탐험  – 새 탐험 구역 발견 시도',
       '!씨앗    – 씨앗 목록 확인',
       '!심기 [씨앗명] – 씨앗 심기 (농장 근처)',
       '!물주기  – 작물에 물 주기 (성장 25% 단축)',
       '!수확   – 다 자란 작물 수확 (농장 근처)',
       '!펫먹이 [물고기명] – 활성 펫에게 물고기 먹이주기 (레벨업)',
       '!여관휴식 – 500G로 10분 낚시속도 +20% (여관 내)',
      ].forEach(t => addMsg(t));
      return;
    }

    if (cmd === '!인벤' || cmd === '!인벤토리') {
      setShowInv(v => !v);
      return;
    }

    if (cmd === '!랭킹') {
      setShowRank(v => !v);
      return;
    }

    if (cmd === '!스탯' || cmd === '!캐릭터') {
      setShowStats(v => !v);
      return;
    }

    if (cmd === '!퀘스트') {
      const quests = stateRef.current?.dailyQuests ?? [];
      const progress = stateRef.current?.questProgress ?? {};
      addMsg('📋 오늘의 퀘스트:');
      quests.forEach(q => {
        const cur = Math.min(q.goal, progress[q.id] ?? 0);
        const done = cur >= q.goal ? ' ✅' : '';
        addMsg(`  ${q.label} (${cur}/${q.goal}) → 보상 ${q.reward}G${done}`);
      });
      setShowQuest(true);
      return;
    }

    if (cmd === '!요리') {
      if (!nearCooking(player.x, player.y) && indoorRoomRef.current !== 'cooking') {
        addMsg('🍳 요리소 근처로 이동하세요! (지도 북쪽 요리소)', 'error');
        return;
      }
      const cw = stateRef.current?.cookware;
      if (!cw) {
        addMsg('🍳 요리 도구가 없습니다. 상점에서 구매하세요!', 'error');
        return;
      }
      const baseMult = COOKWARE[cw]?.mult ?? 1;
      const cookAbil = stateRef.current?.abilities?.요리?.value ?? 0;
      const totalMult = baseMult + cookAbil * 0.01; // up to +1.0x at 100
      const raw = stateRef.current.fishInventory.filter(f => !f.cooked);
      if (raw.length === 0) { addMsg('요리할 생선이 없습니다.'); return; }
      setGs(prev => ({
        ...prev,
        fishInventory: prev.fishInventory.map(f =>
          f.cooked ? f : { ...f, price: Math.round(f.price * totalMult), cooked: true }
        ),
      }));
      addMsg(`🍳 생선 ${raw.length}마리 요리 완료! (x${totalMult.toFixed(2)})`, 'catch');
      playCookComplete();
      grantAbility('요리', COOK_ABILITY_GAIN * raw.length);
      advanceQuest('cook', raw.length);
      gainNpcAffinity('요리사', 3);
      setGs(prev => {
        const prevStats = prev.achStats ?? {};
        const updatedStats = { ...prevStats, cookCount: (prevStats.cookCount ?? 0) + raw.length };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        return { ...prev, achStats: updatedStats };
      });
      return;
    }

    if (cmd === '!그만') {
      if (player.state === 'idle') { addMsg('활동 중이 아닙니다.'); return; }
      player.state = 'idle';
      player.activityStart = null;
      player.activityProgress = 0;
      player.seaFishing = false;
      if (gameRef.current) gameRef.current.fishingZone = '강';
      setActivity(null);
      addMsg('활동을 중지했습니다.');
      return;
    }

    if (cmd === '!낚시') {
      if (player.state !== 'idle') { addMsg('먼저 !그만 으로 중지하세요.'); return; }
      if (weatherRef.current?.canFish === false) {
        addMsg(`${weatherRef.current.icon} 폭풍 중에는 낚시할 수 없습니다!`, 'error');
        return;
      }

      // Marine gear: can fish on water without a chair
      const hasMarine = s.marineGear != null;
      if (hasMarine && isOnWater(player.x, player.y)) {
        const gear = MARINE_GEAR[s.marineGear];
        player.state = 'fishing';
        player.currentRod = s.rod;
        player.seaFishing = true;
        player.vx = 0; player.vy = 0;
        const fishAbil = s.abilities?.낚시?.value ?? 0;
        if (gameRef.current) gameRef.current.fishingZone = (s.marineGear === '스쿠버다이빙세트' && fishAbil >= 50) ? '심해' : '바다';
        const stamAbil = s.abilities?.체력?.value ?? 0;
        const enhLevel = s.rodEnhance?.[s.rod] ?? 0;
        const enhEffect = rodEnhanceEffect(enhLevel);
        const potionFishBonus = (s.activePotion?.effect?.fishSpeedBonus ?? 0);
        const petFishMult = gameRef.current?.petBonus?.fishTimeMult ?? 1.0;
        const innBuffMult = (gameRef.current?.innBuff?.expiresAt ?? 0) > Date.now() ? 0.8 : 1.0;
        const timeMult = Math.max(0.3,
          (1 - fishAbil * 0.004) * (1 - stamAbil * 0.003) * (1 - enhEffect.timeReduction) * (1 - potionFishBonus) * petFishMult * innBuffMult
        );
        const [mn, mx] = RODS[s.rod].catchTimeRange.map(t => Math.max(1000, Math.round(t * timeMult)));
        if (gameRef.current) gameRef.current.fishTimeMult = timeMult;
        player.activityStart = performance.now();
        player.activityDuration = randInt(mn, mx);
        player.activityProgress = 0;
        setActivity('fishing');
        addMsg(`🌊 ${gear.name}으로 해상 낚시 시작! (희귀도 보너스 ×${gear.rareMult})`);
        playFishingStart();
        return;
      }

      // Chair fishing
      const nearest = nearestChair(player.x, player.y);
      if (!nearest || nearest.dist > CHAIR_RANGE) {
        if (hasMarine) addMsg('🌊 바다 위에서 해상 낚시가 가능합니다! 현재는 낚시 의자 근처로 이동하세요.', 'error');
        else addMsg('🪑 낚시 의자 근처로 이동하세요! (지도 아래쪽 낚시터)', 'error');
        return;
      }
      const chairOccupied = otherPlayersRef.current.some(op =>
        op.state === 'fishing' &&
        Math.hypot(op.x - nearest.cx, op.y - nearest.cy) < 2 * TILE_SIZE
      );
      if (chairOccupied) {
        addMsg('🪑 이미 다른 플레이어가 앉아 있습니다! 다른 의자를 이용하세요.', 'error');
        return;
      }
      // Golden pond access check
      if (nearest.zone === '황금연못') {
        const fishGrade = s?.abilities?.낚시?.grade ?? 0;
        const explored = stateRef.current?.exploredZones ?? [];
        if (fishGrade < 1 && !explored.includes('비밀낚시터')) {
          addMsg('✨ 황금 연못: 낚시 그레이드 1 이상 또는 비밀 낚시터 탐험 완료 필요!', 'error');
          return;
        }
      }
      player.x = nearest.cx;
      player.y = nearest.cy - TILE_SIZE / 2;
      player.vx = 0; player.vy = 0;
      player.facing = 'down';
      player.state = 'fishing';
      player.currentRod = s.rod;
      player.seaFishing = nearest.seaFishing ?? false;
      if (gameRef.current) gameRef.current.fishingZone = nearest.zone ?? '강';
      const fishAbil = s.abilities?.낚시?.value ?? 0;
      const stamAbil = s.abilities?.체력?.value ?? 0;
      const enhLevel = s.rodEnhance?.[s.rod] ?? 0;
      const enhEffect = rodEnhanceEffect(enhLevel);
      const potionFishBonus2 = (s.activePotion?.effect?.fishSpeedBonus ?? 0);
      const petFishMult2 = gameRef.current?.petBonus?.fishTimeMult ?? 1.0;
      const innBuffMult2 = (gameRef.current?.innBuff?.expiresAt ?? 0) > Date.now() ? 0.8 : 1.0;
      const timeMult = Math.max(0.3,
        (1 - fishAbil * 0.004) * (1 - stamAbil * 0.003) * (1 - enhEffect.timeReduction) * (1 - potionFishBonus2) * petFishMult2 * innBuffMult2
      );
      const [mn, mx] = RODS[s.rod].catchTimeRange.map(t => Math.max(1000, Math.round(t * timeMult)));
      if (gameRef.current) gameRef.current.fishTimeMult = timeMult;
      player.activityStart = performance.now();
      player.activityDuration = randInt(mn, mx);
      player.activityProgress = 0;
      setActivity('fishing');
      addMsg(`🎣 ${RODS[s.rod].name}으로 낚시 시작! (방향키로 취소)`);
      playFishingStart();
      return;
    }

    if (cmd === '!광질') {
      if (player.state !== 'idle') { addMsg('먼저 !그만 으로 중지하세요.'); return; }
      if (!isInMineZone(player.x, player.y)) {
        addMsg('⛏ 광산 지역(동쪽)으로 이동하세요!', 'error');
        return;
      }
      // Apply 심층광맥 ore boost if explored
      const oreExplored = s.exploredZones ?? [];
      let ore;
      if (oreExplored.includes('심층광맥')) {
        const deepZone = EXPLORE_ZONES.find(z => z.id === '심층광맥');
        const oreBoosts = deepZone?.oreBoost ?? {};
        const oreEntries = Object.entries(ORES).map(([k, v]) => ({ f: k, w: v.w * (oreBoosts[k] ?? 1.0) }));
        ore = weightedPick(oreEntries);
      } else {
        ore = pickOre();
      }
      player.state = 'mining';
      player.currentOre = ore;
      const mineAbil = s.abilities?.채굴?.value ?? 0;
      const mineStamAbil = s.abilities?.체력?.value ?? 0;
      const pickaxeKey = s.pickaxe ?? '나무곡괭이';
      const pickaxeEnhLv = s.pickaxeEnhance?.[pickaxeKey] ?? 0;
      const { timeReduction: paxTimeRed } = pickaxeEnhanceEffect(pickaxeEnhLv);
      const paxMult = PICKAXES[pickaxeKey]?.timeMult ?? 1.0;
      const potionMineBonus = (s.activePotion?.effect?.mineSpeedBonus ?? 0);
      const petMineMult = gameRef.current?.petBonus?.mineTimeMult ?? 1.0;
      const mineMult = Math.max(0.25, (1 - mineAbil * 0.004) * (1 - mineStamAbil * 0.003) * paxMult * (1 - paxTimeRed) * (1 - potionMineBonus) * petMineMult);
      const [mn, mx] = ORES[ore].mineRange.map(t => Math.max(800, Math.round(t * mineMult)));
      if (gameRef.current) gameRef.current.mineTimeMult = mineMult;
      player.activityStart = performance.now();
      player.activityDuration = randInt(mn, mx);
      player.activityProgress = 0;
      setActivity('mining');
      addMsg('⛏ 광질 시작! (방향키로 취소)');
      return;
    }

    if (cmd === '!채집') {
      if (player.state !== 'idle') { addMsg('먼저 !그만 으로 중지하세요.'); return; }
      if (!isInForestZone(player.x, player.y)) {
        addMsg('🌿 숲 지역(동쪽 초록 지대)으로 이동하세요!', 'error');
        return;
      }
      // Apply 신비의숲 herb boost if explored
      const herbExplored = s.exploredZones ?? [];
      let herb;
      if (herbExplored.includes('신비의숲')) {
        const forestZone = EXPLORE_ZONES.find(z => z.id === '신비의숲');
        const hBoost = forestZone?.herbBoost ?? 1.0;
        const weights = { 들풀: 50, 버섯: 30, 희귀허브: 10 };
        const herbEntries = Object.keys(HERBS).map(k => ({ f: k, w: (weights[k] ?? 10) * (k === '희귀허브' ? hBoost : 1.0) }));
        herb = weightedPick(herbEntries);
      } else {
        herb = pickHerb();
      }
      player.state = 'gathering';
      player.currentHerb = herb;
      const gatherAbil = s.abilities?.채집?.value ?? 0;
      const gatherToolKey = s.gatherTool ?? '맨손';
      const gatherToolMult = GATHER_TOOLS[gatherToolKey]?.timeMult ?? 1.0;
      const potionGatherBonus = s.activePotion?.effect?.gatherSpeedBonus ?? 0;
      const gatherMult = Math.max(0.3, (1 - gatherAbil * 0.004) * gatherToolMult * (1 - potionGatherBonus));
      if (gameRef.current) gameRef.current.gatherTimeMult = gatherMult;
      const [mn, mx2] = HERBS[herb].gatherRange.map(t2 => Math.max(800, Math.round(t2 * gatherMult)));
      player.activityStart = performance.now();
      player.activityDuration = randInt(mn, mx2);
      player.activityProgress = 0;
      setActivity('gathering');
      addMsg('🌿 채집 시작! (방향키로 취소)');
      return;
    }

    if (cmd === '!상점') {
      if (!nearShop(player.x, player.y)) {
        addMsg('🏪 상점 건물 근처(북쪽)로 이동하세요!', 'error');
        return;
      }
      setShowShop(true);
      return;
    }

    if (cmd === '!판매') {
      if (!nearShop(player.x, player.y)) {
        addMsg('🏪 상점 근처로 이동하세요!', 'error');
        return;
      }
      const inv = s.fishInventory;
      if (inv.length === 0) { addMsg('판매할 물고기가 없습니다.'); return; }
      const total = inv.reduce((sum, f) => sum + f.price, 0);
      setGs(prev => ({ ...prev, money: prev.money + total, fishInventory: [] }));
      addMsg(`💰 물고기 ${inv.length}마리 → ${total}G!`, 'catch');
      playSellSound(total);
      grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
      advanceQuest('sell', total);
      return;
    }

    if (cmd === '!탐험') {
      const abilities = stateRef.current?.abilities;
      const explored = stateRef.current?.exploredZones ?? [];
      const unlockable = checkZoneUnlock(abilities, explored);
      if (unlockable.length === 0) {
        const allExplored = EXPLORE_ZONES.every(z => explored.includes(z.id));
        if (allExplored) { addMsg('🗺 모든 탐험 구역을 이미 발견했습니다!'); }
        else { addMsg('🗺 아직 조건을 만족하는 새 탐험 구역이 없습니다. 숙련도를 높여보세요!'); }
        return;
      }
      const newZones = unlockable.map(z => z.id);
      setGs(prev => ({ ...prev, exploredZones: [...(prev.exploredZones ?? []), ...newZones] }));
      for (const z of unlockable) {
        addMsg(`🗺 새 구역 발견: ${z.icon} ${z.name}! ${z.benefit}`, 'catch');
        if (gameRef.current) gameRef.current.levelUpEffect = { age: 0 };
      }
      return;
    }

    if (cmd === '!씨앗') {
      const lines = Object.entries(SEEDS).map(([, seedData]) =>
        `${seedData.name} ${seedData.price}G (${Math.round(seedData.growMs/60000)}분, 수확: ${seedData.yield.item})`
      );
      addMsg('🌱 씨앗 목록: ' + lines.join(' | '));
      return;
    }

    if (input.trim().startsWith('!심기 ')) {
      const seedKey = input.trim().slice(4).trim();
      if (!nearFarm(player.x, player.y)) { addMsg('🌱 농장 근처로 이동하세요! (지도 동쪽 숲 남쪽)', 'error'); return; }
      const seed = SEEDS[seedKey];
      if (!seed) { addMsg('알 수 없는 씨앗입니다. !씨앗 으로 목록 확인', 'error'); return; }
      const plots = stateRef.current?.farmPlots ?? [];
      if (plots.length >= MAX_FARM_PLOTS) { addMsg(`🌱 농장 칸이 꽉 찼습니다! (최대 ${MAX_FARM_PLOTS}칸)`, 'error'); return; }
      if ((stateRef.current?.money ?? 0) < seed.price) { addMsg(`💰 골드 부족 (${seed.price}G 필요)`, 'error'); return; }
      const nowMs = Date.now();
      const plot = { id: nowMs, seed: seedKey, plantedAt: nowMs, harvestAt: nowMs + seed.growMs, watered: false, harvested: false };
      setGs(prev => ({ ...prev, money: prev.money - seed.price, farmPlots: [...(prev.farmPlots ?? []), plot] }));
      addMsg(`🌱 ${seed.name} 심기 완료! ${Math.round(seed.growMs / 60000)}분 후 수확 가능`, 'catch');
      return;
    }

    if (cmd === '!물주기') {
      if (!nearFarm(player.x, player.y)) { addMsg('💧 농장 근처로 이동하세요!', 'error'); return; }
      const plots = stateRef.current?.farmPlots ?? [];
      const waterable = plots.filter(p => !p.watered && Date.now() < p.harvestAt);
      if (waterable.length === 0) { addMsg('💧 물을 줄 수 있는 작물이 없습니다. (이미 완료되거나 모두 물줌)', 'error'); return; }
      const now = Date.now();
      setGs(prev => {
        const newPlots = (prev.farmPlots ?? []).map(p => {
          if (!p.watered && now < p.harvestAt) {
            const remaining = p.harvestAt - now;
            return { ...p, watered: true, harvestAt: p.harvestAt - Math.floor(remaining * 0.25) };
          }
          return p;
        });
        return { ...prev, farmPlots: newPlots };
      });
      addMsg(`💧 물 주기 완료! ${waterable.length}개 작물 성장 25% 단축`, 'catch');
      grantAbility('채집', 0.5 * waterable.length);
      return;
    }

    if (cmd === '!수확') {
      if (!nearFarm(player.x, player.y)) { addMsg('🌾 농장 근처로 이동하세요!', 'error'); return; }
      const nowMs = Date.now();
      const plots = stateRef.current?.farmPlots ?? [];
      const ready = plots.filter(p => !p.harvested && nowMs >= p.harvestAt);
      if (ready.length === 0) { addMsg('🌾 수확 가능한 작물이 없습니다.', 'error'); return; }
      const gained = {};
      for (const p of ready) {
        const seedData = SEEDS[p.seed];
        if (!seedData) continue;
        const [min, max] = seedData.yield.qty;
        const qty = min + Math.floor(Math.random() * (max - min + 1));
        gained[seedData.yield.item] = (gained[seedData.yield.item] ?? 0) + qty;
      }
      setGs(prev => {
        const readyIds = new Set(ready.map(r => r.id));
        const newPlots = prev.farmPlots.filter(p => !readyIds.has(p.id));
        const newCrop = { ...(prev.cropInventory ?? {}) };
        for (const [item, qty] of Object.entries(gained)) newCrop[item] = (newCrop[item] ?? 0) + qty;
        return { ...prev, farmPlots: newPlots, cropInventory: newCrop };
      });
      const totalHarvested = Object.values(gained).reduce((s, n) => s + n, 0);
      const summary = Object.entries(gained).map(([k, v]) => `${k} ${v}개`).join(', ');
      addMsg(`🌾 수확 완료! ${summary}`, 'catch');
      grantAbility('채집', 0.3 * ready.length);
      advanceQuest('farm', totalHarvested);
      setGs(prev => {
        const prevStats = prev.achStats ?? {};
        const updatedStats = { ...prevStats, cropsHarvested: (prevStats.cropsHarvested ?? 0) + totalHarvested };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        return { ...prev, achStats: updatedStats };
      });
      return;
    }

    if (cmd === '!요리책') {
      const lines = Object.entries(DISH_RECIPES).map(([key, r]) =>
        `${r.icon} ${r.name}: ${r.desc} → ${r.price}G`
      );
      addMsg('🍽 특별 요리 레시피 (!요리 [요리명]):');
      lines.forEach(l => addMsg(l));
      return;
    }

    if (input.trim().startsWith('!요리 ')) {
      const dishKey = input.trim().slice(4).trim();
      const recipe = DISH_RECIPES[dishKey];
      if (!recipe) { addMsg('알 수 없는 요리. !요리책 으로 목록 확인', 'error'); return; }
      if (!nearCooking(player.x, player.y) && indoorRoomRef.current !== 'cooking') {
        addMsg('🍳 요리소 근처로 이동하세요!', 'error'); return;
      }
      const crops = stateRef.current?.cropInventory ?? {};
      for (const [item, qty] of Object.entries(recipe.crops ?? {})) {
        if ((crops[item] ?? 0) < qty) { addMsg(`🌾 ${item} 부족 (${qty}개 필요, 보유: ${crops[item] ?? 0})`, 'error'); return; }
      }
      let consumedFish = null;
      if (recipe.fish) {
        const inv = stateRef.current?.fishInventory ?? [];
        if (recipe.fish.name) {
          consumedFish = inv.find(f => f.name === recipe.fish.name);
        } else if (recipe.fish.rarity) {
          consumedFish = inv.find(f => FISH[f.name]?.rarity === recipe.fish.rarity);
        }
        if (!consumedFish) {
          const need = recipe.fish.name ?? `${recipe.fish.rarity} 등급 생선`;
          addMsg(`🐟 ${need} 이(가) 인벤토리에 없습니다.`, 'error'); return;
        }
      }
      // Consume ingredients
      setGs(prev => {
        const newCrops = { ...(prev.cropInventory ?? {}) };
        for (const [item, qty] of Object.entries(recipe.crops ?? {})) newCrops[item] = Math.max(0, (newCrops[item] ?? 0) - qty);
        let removedOne = false;
        const newFishInv = consumedFish
          ? prev.fishInventory.filter(f => {
              if (!removedOne && f === consumedFish) { removedOne = true; return false; }
              return true;
            })
          : prev.fishInventory;
        const prevStats = prev.achStats ?? {};
        const updatedStats = { ...prevStats, dishCooked: (prevStats.dishCooked ?? 0) + 1, cookCount: (prevStats.cookCount ?? 0) + 1 };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        return { ...prev, cropInventory: newCrops, fishInventory: newFishInv, money: prev.money + recipe.price, achStats: updatedStats };
      });
      addMsg(`${recipe.icon} ${recipe.name} 완성! +${recipe.price}G`, 'catch');
      grantAbility('요리', 5);
      advanceQuest('dish', 1);
      advanceQuest('cook', 1);
      gainNpcAffinity('요리사', 3);
      return;
    }

    // ── 펫 먹이주기 ──────────────────────────────────────────────────────────
    if (input.trim().startsWith('!펫먹이 ')) {
      const fishName = input.trim().slice(5).trim();
      const activePet = s.activePet;
      if (!activePet) { addMsg('펫이 장착되지 않았습니다.', 'error'); return; }
      const petInfo = PETS[activePet];
      const egg = (s.petEggs ?? {})[activePet];
      if (!egg || Date.now() < egg.hatchAt) { addMsg('펫이 아직 부화하지 않았습니다.', 'error'); return; }
      const fishIdx = s.fishInventory.findIndex(f => f === fishName);
      if (fishIdx === -1) { addMsg(`인벤토리에 ${fishName}이/가 없습니다.`, 'error'); return; }
      const fishInfo = FISH[fishName];
      const expGain = Math.max(1, Math.ceil((fishInfo?.price ?? 20) / 40));
      const curExp = (s.petExp ?? {})[activePet] ?? 0;
      const curLevel = (s.petLevels ?? {})[activePet] ?? 1;
      const newExp = curExp + expGain;
      let newLevel = curLevel;
      for (let lv = curLevel; lv < PET_MAX_LEVEL; lv++) {
        if (newExp >= PET_EXP_THRESHOLDS[lv - 1]) newLevel = lv + 1;
        else break;
      }
      setGs(prev => {
        const newFishInv = [...prev.fishInventory];
        newFishInv.splice(newFishInv.findIndex(f => f === fishName), 1);
        return {
          ...prev,
          fishInventory: newFishInv,
          petExp: { ...prev.petExp, [activePet]: newExp },
          petLevels: { ...prev.petLevels, [activePet]: newLevel },
        };
      });
      addMsg(`${petInfo.icon} ${petInfo.name}에게 ${fishName} 먹이주기! EXP +${expGain} (${newExp}/${PET_EXP_THRESHOLDS[newLevel - 1] ?? '최대'})`, 'catch');
      if (newLevel > curLevel) addMsg(`🎉 ${petInfo.name} Lv.${curLevel} → Lv.${newLevel}! 보너스 강화!`, 'legend');
      return;
    }

    // ── 여관 특별 휴식 ────────────────────────────────────────────────────────
    if (cmd === '!여관휴식') {
      if (indoorRoomRef.current !== 'inn') { addMsg('여관 안에서만 사용할 수 있습니다.', 'error'); return; }
      const buff = s.innBuff;
      if (buff && Date.now() < buff.expiresAt) {
        const remain = Math.ceil((buff.expiresAt - Date.now()) / 60000);
        addMsg(`이미 휴식 효과가 활성 중입니다. (${remain}분 남음)`, 'error'); return;
      }
      if (s.money < 500) { addMsg('골드 500G가 필요합니다.', 'error'); return; }
      const expiresAt = Date.now() + 10 * 60 * 1000;
      setGs(prev => ({ ...prev, money: prev.money - 500, innBuff: { expiresAt } }));
      addMsg('💤 특별 휴식: 10분간 낚시 속도 +20%! (-500G)', 'catch');
      gainNpcAffinity('여관주인', 2);
      return;
    }

    addMsg(`알 수 없는 명령어. !도움말 확인`, 'error');
  }, [addMsg, advanceQuest, grantAbility, gainNpcAffinity]);

  // ── Shop actions ─────────────────────────────────────────────────────────

  const buyRod = (rodKey) => {
    const rod = RODS[rodKey];
    if (gs.ownedRods.includes(rodKey)) { addMsg('이미 보유 중'); return; }
    const needMoney = rod.price > 0;
    const discount = getShopDiscount(gs.npcAffinity);
    const discountedPrice = needMoney ? Math.round(rod.price * (1 - discount)) : 0;
    const canAfford = !needMoney || gs.money >= discountedPrice;
    const hasMats = rod.upgradeMats
      ? Object.entries(rod.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
      : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${discountedPrice}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (rod.upgradeMats) for (const [ore, n] of Object.entries(rod.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: needMoney ? prev.money - discountedPrice : prev.money, oreInventory: ores, ownedRods: [...prev.ownedRods, rodKey], rod: rodKey };
    });
    if (gameRef.current?.player) gameRef.current.player.currentRod = rodKey;
    addMsg(`🎣 ${rod.name} ${needMoney ? '구매' : '획득'}!${discount > 0 ? ` (${Math.round(discount * 100)}% 할인)` : ''}`, 'catch');
    gainNpcAffinity('상인', 2);
    setShowShop(false);
  };

  const equipRod = (rodKey) => {
    setGs(prev => ({ ...prev, rod: rodKey }));
    if (gameRef.current?.player) gameRef.current.player.currentRod = rodKey;
    addMsg(`🎣 ${RODS[rodKey].name} 장착`);
  };

  const buyBoots = (key) => {
    const boot = BOOTS[key];
    if ((gs.ownedBoots ?? []).includes(key)) { addMsg('이미 보유 중'); return; }
    const discount = getShopDiscount(gs.npcAffinity);
    const discountedPrice = Math.round(boot.price * (1 - discount));
    const canAfford = gs.money >= discountedPrice;
    const hasMats = boot.upgradeMats
      ? Object.entries(boot.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
      : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${discountedPrice}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (boot.upgradeMats) for (const [ore, n] of Object.entries(boot.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: prev.money - discountedPrice, oreInventory: ores, ownedBoots: [...(prev.ownedBoots ?? ['기본신발']), key], boots: key };
    });
    addMsg(`👟 ${boot.name} 구매!${discount > 0 ? ` (${Math.round(discount * 100)}% 할인)` : ''}`, 'catch');
    gainNpcAffinity('상인', 2);
  };

  const equipBoots = (key) => {
    setGs(prev => ({ ...prev, boots: key }));
    addMsg(`👟 ${BOOTS[key].name} 장착`);
  };

  const buyBait = (key) => {
    const bait = BAIT[key];
    if (bait.type === 'permanent' && (gs.ownedBait ?? []).includes(key)) { addMsg('이미 보유 중'); return; }
    const discount = getShopDiscount(gs.npcAffinity);
    const discountedPrice = Math.round(bait.price * (1 - discount));
    if (gs.money < discountedPrice) { addMsg(`💰 골드 부족 (${discountedPrice}G 필요)`, 'error'); return; }
    if (bait.type === 'permanent') {
      setGs(prev => ({ ...prev, money: prev.money - discountedPrice, ownedBait: [...(prev.ownedBait ?? []), key], equippedBait: key }));
      addMsg(`🪝 ${bait.name} 구매 및 장착!${discount > 0 ? ` (${Math.round(discount * 100)}% 할인)` : ''}`, 'catch');
    } else {
      setGs(prev => ({ ...prev, money: prev.money - discountedPrice, baitInventory: { ...(prev.baitInventory ?? {}), [key]: ((prev.baitInventory ?? {})[key] ?? 0) + 1 } }));
      addMsg(`🪝 ${bait.name} 구매!${discount > 0 ? ` (${Math.round(discount * 100)}% 할인)` : ''}`, 'catch');
    }
    gainNpcAffinity('상인', 2);
  };

  const equipBait = (key) => {
    setGs(prev => ({ ...prev, equippedBait: prev.equippedBait === key ? null : key }));
    addMsg(`🪝 ${BAIT[key]?.name} ${gs.equippedBait === key ? '해제' : '장착'}`);
  };

  const buyMarineGear = (key) => {
    const gear = MARINE_GEAR[key];
    if ((gs.ownedMarineGear ?? []).includes(key)) { addMsg('이미 보유 중'); return; }
    const discount = getShopDiscount(gs.npcAffinity);
    const discountedPrice = Math.round(gear.price * (1 - discount));
    const canAfford = gs.money >= discountedPrice;
    const hasMats = gear.upgradeMats
      ? Object.entries(gear.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
      : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${discountedPrice}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (gear.upgradeMats) for (const [ore, n] of Object.entries(gear.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: prev.money - discountedPrice, oreInventory: ores,
        ownedMarineGear: [...(prev.ownedMarineGear ?? []), key], marineGear: key };
    });
    addMsg(`🌊 ${gear.name} 구매 및 장착!${discount > 0 ? ` (${Math.round(discount * 100)}% 할인)` : ''}`, 'catch');
    gainNpcAffinity('상인', 2);
  };

  const equipMarineGear = (key) => {
    setGs(prev => ({ ...prev, marineGear: prev.marineGear === key ? null : key }));
    addMsg(`🌊 ${MARINE_GEAR[key]?.name} ${gs.marineGear === key ? '해제' : '장착'}`);
  };

  const buyCookware = (key) => {
    const cw = COOKWARE[key];
    if ((gs.ownedCookware ?? []).includes(key)) { addMsg('이미 보유 중'); return; }
    const discount = getShopDiscount(gs.npcAffinity);
    const discountedPrice = Math.round(cw.price * (1 - discount));
    const canAfford = gs.money >= discountedPrice;
    const hasMats = cw.upgradeMats ? Object.entries(cw.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n) : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${discountedPrice}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (cw.upgradeMats) for (const [ore, n] of Object.entries(cw.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: prev.money - discountedPrice, oreInventory: ores, ownedCookware: [...(prev.ownedCookware ?? []), key], cookware: key };
    });
    addMsg(`🍳 ${cw.name} 구매!${discount > 0 ? ` (${Math.round(discount * 100)}% 할인)` : ''}`, 'catch');
    gainNpcAffinity('상인', 2);
  };

  const equipCookware = (key) => {
    setGs(prev => ({ ...prev, cookware: key }));
    addMsg(`🍳 ${COOKWARE[key].name} 장착`);
  };

  const buyGatherTool = (key) => {
    const gt = GATHER_TOOLS[key];
    if ((gs.ownedGatherTools ?? ['맨손']).includes(key)) { addMsg('이미 보유 중'); return; }
    const discount = getShopDiscount(gs.npcAffinity);
    const discountedPrice = gt.price > 0 ? Math.round(gt.price * (1 - discount)) : 0;
    const canAfford = gs.money >= discountedPrice;
    const hasMats = gt.upgradeMats ? Object.entries(gt.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n) : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${discountedPrice}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (gt.upgradeMats) for (const [ore, n] of Object.entries(gt.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: discountedPrice > 0 ? prev.money - discountedPrice : prev.money, oreInventory: ores,
        ownedGatherTools: [...(prev.ownedGatherTools ?? ['맨손']), key], gatherTool: key };
    });
    addMsg(`🌿 ${gt.name} 구매!${discount > 0 && gt.price > 0 ? ` (${Math.round(discount * 100)}% 할인)` : ''}`, 'catch');
    if (gt.price > 0) gainNpcAffinity('상인', 2);
  };

  const equipGatherTool = (key) => {
    setGs(prev => ({ ...prev, gatherTool: key }));
    addMsg(`🌿 ${GATHER_TOOLS[key].name} 장착`);
  };

  const buyPickaxe = (key) => {
    const px = PICKAXES[key];
    if ((gs.ownedPickaxes ?? ['나무곡괭이']).includes(key)) { addMsg('이미 보유 중'); return; }
    const discount = getShopDiscount(gs.npcAffinity);
    const discountedPrice = px.price > 0 ? Math.round(px.price * (1 - discount)) : 0;
    const canAfford = gs.money >= discountedPrice;
    const hasMats = px.upgradeMats ? Object.entries(px.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n) : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${discountedPrice}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (px.upgradeMats) for (const [ore, n] of Object.entries(px.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: discountedPrice > 0 ? prev.money - discountedPrice : prev.money, oreInventory: ores,
        ownedPickaxes: [...(prev.ownedPickaxes ?? ['나무곡괭이']), key], pickaxe: key,
        pickaxeEnhance: { ...(prev.pickaxeEnhance ?? {}), [key]: 0 } };
    });
    addMsg(`⛏ ${px.name} 구매!${discount > 0 && px.price > 0 ? ` (${Math.round(discount * 100)}% 할인)` : ''}`, 'catch');
    if (px.price > 0) gainNpcAffinity('상인', 2);
  };

  const equipPickaxe = (key) => {
    setGs(prev => ({ ...prev, pickaxe: key }));
    addMsg(`⛏ ${PICKAXES[key].name} 장착`);
  };

  const enhancePickaxe = () => {
    const key = gs.pickaxe ?? '나무곡괭이';
    const enhLevel = gs.pickaxeEnhance?.[key] ?? 0;
    if (enhLevel >= 100) { addMsg('최대 강화 완료!'); return; }
    const cost = pickaxeEnhanceCost(enhLevel);
    const mats = pickaxeEnhanceMatsNeeded(enhLevel);
    const canAfford = gs.money >= cost;
    const hasMats = Object.entries(mats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n);
    if (!canAfford) { addMsg(`💰 골드 부족 (${cost}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    const rate = pickaxeEnhanceSuccessRate(enhLevel, gs.abilities?.강화?.value ?? 0);
    const success = Math.random() < rate;
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      for (const [ore, n] of Object.entries(mats)) ores[ore] = Math.max(0, (ores[ore] ?? 0) - n);
      const newEnhance = { ...(prev.pickaxeEnhance ?? {}), [key]: success ? enhLevel + 1 : enhLevel };
      return { ...prev, money: prev.money - cost, oreInventory: ores, pickaxeEnhance: newEnhance };
    });
    if (success) {
      addMsg(`⛏ 곡괭이 강화 성공! (${enhLevel} → ${enhLevel + 1})`, 'catch');
      setGs(prev => {
        const prevStats = prev.achStats ?? {};
        const updatedStats = { ...prevStats, enhanceCount: (prevStats.enhanceCount ?? 0) + 1 };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        return { ...prev, achStats: updatedStats };
      });
    } else addMsg(`강화 실패… (${Math.round(rate * 100)}% 확률)`, 'error');
  };

  const sellAll = () => {
    const total = gs.fishInventory.reduce((s, f) => s + f.price, 0);
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + total, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + total) };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      return { ...prev, money: prev.money + total, fishInventory: [], achStats: updatedStats };
    });
    addMsg(`💰 전체 판매 +${total}G`, 'catch');
    playSellSound(total);
    grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
    advanceQuest('sell', total);
    gainNpcAffinity('상인', Math.max(1, Math.floor(total / 200)));
  };

  const sellOne = (id) => {
    const fish = gs.fishInventory.find(f => f.id === id);
    if (!fish) return;
    setGs(prev => ({ ...prev, money: prev.money + fish.price, fishInventory: prev.fishInventory.filter(f => f.id !== id) }));
    grantAbility('화술', Math.max(0.01, Math.floor(fish.price / 100) * SELL_ABILITY_PER_100G));
  };

  const handleLogin = (name, appearance) => {
    channelRef.current?.postMessage({ type: 'gameStart', tabId: tabId.current });
    setBlocked(false);
    setNickname(name);
    if (appearance) {
      setGs(prev => ({ ...prev,
        hairColor: appearance.hairColor,
        bodyColor: appearance.bodyColor,
        skinColor: appearance.skinColor ?? prev.skinColor,
        gender: appearance.gender ?? prev.gender,
      }));
    }
  };

  const handleJoinRoom = (id, title) => {
    setRoomId(id);
    setRoomTitle(title);
    setMessages([
      { type: 'system', text: `🌊 [${title}]에 입장했습니다!` },
      { type: 'system', text: `👤 ${nickname} · 방향키로 이동 · !도움말` },
    ]);
  };

  const takeOver = () => {
    channelRef.current?.postMessage({ type: 'gameStart', tabId: tabId.current });
    setBlocked(false);
  };

  const handleNpcInteract = useCallback((npcName) => {
    playNpcInteract();
    if (npcName === '민준') {
      setShowShop(true);
    } else if (npcName === '수연') {
      const cw = stateRef.current?.cookware;
      if (!cw) { addMsg('🍳 요리 도구가 없습니다. 상점에서 구매하세요!', 'error'); return; }
      const baseMult = COOKWARE[cw]?.mult ?? 1;
      const cookAbil = stateRef.current?.abilities?.요리?.value ?? 0;
      const totalMult = baseMult + cookAbil * 0.01;
      const raw = stateRef.current.fishInventory.filter(f => !f.cooked);
      if (raw.length === 0) { addMsg('🍳 수연: "요리할 생선이 없네요!"'); return; }
      setGs(prev => ({
        ...prev,
        fishInventory: prev.fishInventory.map(f =>
          f.cooked ? f : { ...f, price: Math.round(f.price * totalMult), cooked: true }
        ),
      }));
      addMsg(`🍳 수연이 생선 ${raw.length}마리를 요리해줬어요! (x${totalMult.toFixed(2)})`, 'catch');
      playCookComplete();
      grantAbility('요리', COOK_ABILITY_GAIN * raw.length);
      advanceQuest('cook', raw.length);
      gainNpcAffinity('요리사', 3);
    } else if (npcName === '미나') {
      const lastRest = stateRef.current?.innRestAt ?? 0;
      const cooldownMs = 60 * 60 * 1000;
      if (Date.now() - lastRest < cooldownMs) {
        const remainMin = Math.ceil((cooldownMs - (Date.now() - lastRest)) / 60000);
        addMsg(`🏨 미나: "아직 피로가 덜 쌓였어요! ${remainMin}분 후에 다시 오세요."`, 'info');
      } else {
        addMsg('🏨 미나: "편히 쉬고 가세요! 내일 퀘스트도 화이팅~"', 'info');
        addMsg('💤 여관에서 휴식했습니다. 체력 어빌리티 +0.5!', 'catch');
        grantAbility('체력', 0.5);
        gainNpcAffinity('여관주인', 1);
        setGs(prev => ({ ...prev, innRestAt: Date.now() }));
      }
      const buff = stateRef.current?.innBuff;
      if (buff && Date.now() < buff.expiresAt) {
        const remain = Math.ceil((buff.expiresAt - Date.now()) / 60000);
        addMsg(`✨ 휴식 버프 활성 중: 낚시 속도 +20% (${remain}분 남음)`, 'catch');
      } else {
        addMsg('💰 500G로 특별 휴식 가능! (!여관휴식) → 낚시 속도 10분 +20%', 'info');
      }
    } else if (npcName === '철수') {
      const inv = stateRef.current?.oreInventory ?? {};
      const lines = Object.entries(inv)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${k} ${n}개`);
      if (lines.length > 0) {
        addMsg(`⛏ 철수: "현재 광석: ${lines.join(', ')}. 상점에서 팔 수 있어요!"`, 'info');
      } else {
        addMsg('⛏ 철수: "광산에서 광석을 캐보세요! 희귀할수록 값이 비싸답니다."', 'info');
      }
    } else if (npcName === '은행원') {
      setShowBank(true);
    }
  }, [addMsg, grantAbility, advanceQuest, gainNpcAffinity, stateRef]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!nickname) return <LoginScreen onLogin={handleLogin} />;
  if (!roomId) return <ChannelLobby nickname={nickname} onJoin={handleJoinRoom} />;

  if (blocked) return (
    <div className="login-bg">
      <div className="login-box">
        <div className="login-icon">⚠️</div>
        <h1 className="login-title" style={{ fontSize: 20 }}>다른 탭에서 접속됨</h1>
        <p className="login-sub" style={{ marginBottom: 24 }}>
          다른 탭에서 게임이 실행 중입니다.<br />이 탭에서 계속하려면 아래 버튼을 누르세요.
        </p>
        <button className="login-btn" onClick={takeOver}>이 탭에서 계속하기</button>
        <p className="login-hint" style={{ marginTop: 16 }}>다른 탭은 자동으로 중단됩니다.</p>
      </div>
    </div>
  );

  const totalFishVal = gs.fishInventory.reduce((s, f) => s + f.price, 0);
  const myTitle = getTitle(gs);

  const handleEnterRoom = (id) => { playEnterRoom(); setIndoorRoom(id); };
  const handleExitRoom = () => {
    // Teleport player to the door exit position
    const door = DOOR_TRIGGERS.find(d => d.id === indoorRoom);
    if (door && gameRef.current?.player) {
      gameRef.current.player.x = door.exitWx;
      gameRef.current.player.y = door.exitWy;
    }
    setIndoorRoom(null);
  };

  return (
    <div className="root">
      <div className="canvas-area">
        {/* GameCanvas always mounted to preserve player state */}
        <GameCanvas
          gameRef={gameRef}
          onFishCaught={onFishCaught}
          onOreMined={onOreMined}
          onHerbGathered={onHerbGathered}
          onActivityChange={onActivityChange}
          nickname={nickname}
          title={myTitle.label}
          titleColor={myTitle.color}
          otherPlayersRef={otherPlayersRef}
          onPlayerInspect={setInspectPlayer}
          onEnterRoom={handleEnterRoom}
          onNearDoorChange={setNearDoor}
          hairColor={gs.hairColor}
          bodyColor={gs.bodyColor}
          skinColor={gs.skinColor}
          gender={gs.gender}
        />
        {/* IndoorCanvas overlays when inside a room */}
        {indoorRoom && (
          <IndoorCanvas
            roomId={indoorRoom}
            nickname={nickname}
            gameRef={gameRef}
            onExit={handleExitRoom}
            onNpcInteract={handleNpcInteract}
            onNearNpcChange={setNearIndoorNpc}
            hairColor={gs.hairColor}
            bodyColor={gs.bodyColor}
            skinColor={gs.skinColor}
            gender={gs.gender}
          />
        )}

        {/* HUD */}
        {!indoorRoom && <div className="hud">
          <div className="hud-chip hud-nick">👤 {nickname}</div>
          <div className="hud-chip" style={{ color: myTitle.color, fontSize: 11 }}>[{myTitle.label}]</div>
          <div className="hud-chip" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>🏠 {roomTitle}</div>
          <div className="hud-chip">💰 {gs.money.toLocaleString()}G</div>
          <div className="hud-chip" style={{ color: RODS[gs.rod]?.color }}>
            🎣 {RODS[gs.rod]?.name}
          </div>
          {weather && (
            <div className="hud-chip" style={{ fontSize: 11 }}>{weather.icon} {weather.label}</div>
          )}
          {gs.innBuff && Date.now() < gs.innBuff.expiresAt && (
            <div className="hud-chip" style={{ color: '#88ccff', fontSize: 11 }}>
              💤 휴식 {Math.ceil((gs.innBuff.expiresAt - Date.now()) / 60000)}분
            </div>
          )}
          {activity && (
            <div className={`hud-chip hud-active ${activity}`}>
              {activity === 'fishing' ? '🐟 낚시 중…' : activity === 'gathering' ? '🌿 채집 중…' : '⛏ 채굴 중…'}
            </div>
          )}
          {serverStats.totalFishCaught > 0 && (
            <div className="hud-chip" style={{ color: 'rgba(255,220,100,0.7)', fontSize: 10 }}>
              🌐 서버 {serverStats.totalFishCaught?.toLocaleString()}마리
            </div>
          )}
        </div>}
        {!indoorRoom && weather?.canFish === false && (
          <div className="weather-warning" style={{ position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', background: 'rgba(30,20,0,0.85)', color: '#ffcc44', border: '1px solid #ffaa00', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 700, zIndex: 50, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            ⛈ 폭풍 중에는 낚시할 수 없습니다!
          </div>
        )}
        {showAnnounce && serverAnnouncements.length > 0 && (
          <div className="server-announce-bar">
            {serverAnnouncements.slice(0, 1).map(a => (
              <div key={a.id} className="server-announce-msg">
                📢 {a.message}
              </div>
            ))}
          </div>
        )}


        {/* Rank sidebar (desktop only) */}
        {!indoorRoom && <RankSidebar myNickname={nickname} />}

        {/* Shortcut buttons (desktop only) */}
        {!indoorRoom && <div className="shortcut-bar">
          <button tabIndex={-1} onClick={() => setShowInv(v => !v)}>🎒 인벤</button>
          <button tabIndex={-1} onClick={() => setShowShop(v => !v)}>🏪 상점</button>
          <button tabIndex={-1} onClick={() => setShowStats(v => !v)}>📊 상태</button>
          <button tabIndex={-1} onClick={() => setShowRank(v => !v)}>🏆 랭킹</button>
          <button tabIndex={-1} onClick={() => setShowQuest(v => !v)}>📋 퀘스트</button>
          <button tabIndex={-1} onClick={() => setShowDex(v => !v)}>📖 도감</button>
        </div>}

        {/* Mobile controls: joystick + action buttons */}
        <div className="mobile-controls">
          <Joystick gameRef={gameRef} />
          <div className="action-btns">
            <button className="action-btn" tabIndex={-1} onClick={() => setShowMobileMenu(v => !v)}>
              <span>☰</span><span className="action-btn-label">메뉴</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!낚시')}>
              <span>🎣</span><span className="action-btn-label">낚시</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!광질')}>
              <span>⛏</span><span className="action-btn-label">광질</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!채집')}>
              <span>🌿</span><span className="action-btn-label">채집</span>
            </button>
            <button className="action-btn action-btn-stop" tabIndex={-1} onClick={() => handleCommand('!그만')}>
              <span>🛑</span><span className="action-btn-label">그만</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!요리')}>
              <span>🍳</span><span className="action-btn-label">요리</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => setShowRank(true)}>
              <span>🏆</span><span className="action-btn-label">랭킹</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => setShowQuest(v => !v)}>
              <span>📋</span><span className="action-btn-label">퀘스트</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => setShowDex(v => !v)}>
              <span>📖</span><span className="action-btn-label">도감</span>
            </button>
            {nearDoor && !indoorRoom && (
              <button className="action-btn action-btn-enter" tabIndex={-1} onClick={() => gameRef.current?.enterRoom?.()}>
                <span>🚪</span><span className="action-btn-label">입장</span>
              </button>
            )}
            {nearIndoorNpc && indoorRoom && (
              <button className="action-btn action-btn-enter" tabIndex={-1} onClick={() => handleNpcInteract(nearIndoorNpc.name)}>
                <span>💬</span><span className="action-btn-label">대화</span>
              </button>
            )}
            {indoorRoom === 'inn' && !(gs.innBuff && Date.now() < gs.innBuff.expiresAt) && (
              <button className="action-btn" tabIndex={-1} style={{ background: 'rgba(0,100,200,0.7)', borderColor: '#4488ff' }}
                onClick={() => handleCommand('!여관휴식')}>
                <span>💤</span><span className="action-btn-label">특별 휴식 (500G)</span>
              </button>
            )}
            {indoorRoom === 'inn' && gs.innBuff && Date.now() < gs.innBuff.expiresAt && (
              <div className="action-btn" style={{ background: 'rgba(0,60,140,0.6)', borderColor: '#2266cc', cursor: 'default' }}>
                <span>💤</span><span className="action-btn-label">휴식 중 {Math.ceil((gs.innBuff.expiresAt - Date.now()) / 60000)}분</span>
              </div>
            )}
            {indoorRoom === 'inn' && (
              <button className="action-btn" tabIndex={-1} style={{ background: 'rgba(120,60,160,0.7)', borderColor: '#aa66ff' }}
                onClick={() => { setAppearanceDraft({ hairColor: gs.hairColor, bodyColor: gs.bodyColor, skinColor: gs.skinColor }); setShowAppearance(true); }}>
                <span>✂</span><span className="action-btn-label">외모 변경</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile slide-in menu */}
        {showMobileMenu && (
          <div className="mobile-menu-backdrop" onClick={() => setShowMobileMenu(false)}>
            <div className="mobile-menu-drawer" onClick={e => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <span>메뉴</span>
                <button className="mobile-menu-close" onClick={() => setShowMobileMenu(false)}>✕</button>
              </div>
              <div className="mobile-menu-items">
                <button className="mobile-menu-item" onClick={() => { setShowInv(true); setShowMobileMenu(false); }}>
                  <span className="mobile-menu-icon">🎒</span><span>인벤토리</span>
                </button>
                <button className="mobile-menu-item" onClick={() => { setShowShop(true); setShowMobileMenu(false); }}>
                  <span className="mobile-menu-icon">🏪</span><span>상점</span>
                </button>
                <button className="mobile-menu-item" onClick={() => { setShowStats(true); setShowMobileMenu(false); }}>
                  <span className="mobile-menu-icon">📊</span><span>어빌리티</span>
                </button>
                <button className="mobile-menu-item" onClick={() => { setShowRank(true); setShowMobileMenu(false); }}>
                  <span className="mobile-menu-icon">🏆</span><span>랭킹</span>
                </button>
              </div>
              <div className="mobile-menu-status">
                <div style={{ color: myTitle.color, fontWeight: 700 }}>[{myTitle.label}]</div>
                <div>💰 {gs.money.toLocaleString()}G</div>
                <div style={{ color: RODS[gs.rod]?.color }}>🎣 {RODS[gs.rod]?.name}</div>
                {weather && <div>{weather.icon} {weather.label}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      <Chat messages={messages} onCommand={handleCommand} />

      {/* Inventory modal */}
      {showInv && (() => {
        const RARITY_ORDER = { 신화: 5, 전설: 4, 희귀: 3, 보통: 2, 흔함: 1 };
        const groups = {};
        for (const f of gs.fishInventory) {
          if (!groups[f.name]) groups[f.name] = [];
          groups[f.name].push(f);
        }
        const sortedGroups = Object.entries(groups).sort(([a], [b]) =>
          (RARITY_ORDER[FISH[b]?.rarity] ?? 0) - (RARITY_ORDER[FISH[a]?.rarity] ?? 0)
        );
        const sellSpecies = (name) => {
          const total = groups[name].reduce((s, f) => s + f.price, 0);
          setGs(prev => ({ ...prev, money: prev.money + total, fishInventory: prev.fishInventory.filter(f => f.name !== name) }));
          addMsg(`💰 ${name} ${groups[name].length}마리 판매 +${total}G`, 'catch');
          grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
        };
        return (
          <div className="overlay" onClick={() => setShowInv(false)}>
            <div className="panel" onClick={e => e.stopPropagation()}>
              <div className="panel-head">
                <span>🎒 인벤토리</span>
                <button tabIndex={-1} onClick={() => setShowInv(false)}>✕</button>
              </div>

              <div className="section">
                <div className="section-title">물고기 ({gs.fishInventory.length}마리)</div>
                {gs.fishInventory.length === 0
                  ? <div className="empty">물고기가 없습니다.</div>
                  : <>
                      <button tabIndex={-1} className="sell-all-btn" onClick={sellAll}>
                        전체 판매 ({totalFishVal}G)
                      </button>
                      <div className="fish-list">
                        {sortedGroups.map(([species, fishes]) => {
                          const fd = FISH[species];
                          const rc = rarityColor(fd?.rarity);
                          const speciesVal = fishes.reduce((s, f) => s + f.price, 0);
                          const sorted = [...fishes].sort((a, b) => b.size - a.size);
                          return (
                            <div key={species} className="species-group">
                              <div className="species-header">
                                <span className="species-rarity" style={{ color: rc }}>[{fd?.rarity}]</span>
                                <span className="species-name" style={{ color: rc }}>{species}</span>
                                <span className="species-count">{fishes.length}마리</span>
                                <span className="species-val">{speciesVal}G</span>
                                <button tabIndex={-1} className="sell-btn" onClick={() => sellSpecies(species)}>전체판매</button>
                              </div>
                              <div className="species-fish-list">
                                {sorted.map(f => (
                                  <div key={f.id} className="fish-row fish-row-compact">
                                    <span className="grow">{f.size.toFixed(1)}cm{f.cooked ? ' 🍳' : ''}</span>
                                    <span className="gold">{f.price}G</span>
                                    <button tabIndex={-1} className="sell-btn" onClick={() => sellOne(f.id)}>판매</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                }
              </div>

              <div className="section">
                <div className="section-title">광물</div>
                {Object.entries(gs.oreInventory).map(([ore, cnt]) => (
                  <div key={ore} className="ore-row">
                    <span className="grow">{ore}</span>
                    <span className="dim">{cnt}개</span>
                    <span className="gold">{(ORES[ore]?.price ?? 0) * cnt}G 상당</span>
                  </div>
                ))}
              </div>

              <div className="section">
                <div className="section-title">허브</div>
                {Object.keys(gs.herbInventory ?? {}).filter(k => (gs.herbInventory[k] ?? 0) > 0).length === 0
                  ? <div className="empty">허브 없음 (숲에서 채집)</div>
                  : Object.entries(gs.herbInventory ?? {}).filter(([, n]) => n > 0).map(([herb, cnt]) => (
                    <div key={herb} className="ore-row">
                      <span className="grow" style={{ color: HERBS[herb]?.color ?? '#8c4' }}>🌿 {herb}</span>
                      <span className="dim">{cnt}개</span>
                      <span className="gold">{(HERBS[herb]?.price ?? 0) * cnt}G 상당</span>
                    </div>
                  ))
                }
              </div>

              <div className="section">
                <div className="section-title">미끼</div>
                {Object.entries(BAIT).map(([key, bait]) => {
                  const owned = bait.type === 'permanent' ? (gs.ownedBait ?? []).includes(key) : ((gs.baitInventory ?? {})[key] ?? 0) > 0;
                  if (!owned) return null;
                  const equipped = gs.equippedBait === key;
                  return (
                    <div key={key} className="fish-row">
                      <span style={{ color: bait.color }}>🪝 {bait.name}</span>
                      {bait.type === 'once' && <span className="dim">{(gs.baitInventory ?? {})[key] ?? 0}개</span>}
                      <span className="grow" />
                      <button tabIndex={-1} className={equipped ? 'btn-eq' : 'sell-btn'} onClick={() => equipBait(key)}>
                        {equipped ? '장착중' : '장착'}
                      </button>
                    </div>
                  );
                })}
                {!Object.values(BAIT).some((b, i) => {
                  const key = Object.keys(BAIT)[i];
                  return b.type === 'permanent' ? (gs.ownedBait ?? []).includes(key) : ((gs.baitInventory ?? {})[key] ?? 0) > 0;
                }) && <div className="empty">미끼 없음 (상점에서 구매)</div>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Status modal (장비 + 어빌리티 tabs) */}
      {showStats && (
        <div className="overlay" onClick={() => setShowStats(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>📊 상태창</span>
              <button tabIndex={-1} onClick={() => setShowStats(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div className="stats-tabs">
              {['장비', '어빌리티', '제련/제작', '업적', '펫', '관계도', '탐험', '농장'].map(tab => (
                <button key={tab} tabIndex={-1}
                  className={`stats-tab ${statsTab === tab ? 'stats-tab-active' : ''}`}
                  onClick={() => setStatsTab(tab)}>{tab}</button>
              ))}
            </div>

            {/* ── 장비 tab ── */}
            {statsTab === '장비' && (() => {
              const rodData   = RODS[gs.rod];
              const bootData  = BOOTS[gs.boots];
              const baitData  = gs.equippedBait ? BAIT[gs.equippedBait] : null;
              const cwData    = gs.cookware ? COOKWARE[gs.cookware] : null;
              const enhLv     = gs.rodEnhance?.[gs.rod] ?? 0;

              // Slot renderer
              const Slot = ({ icon, label, color, sub, locked }) => (
                <div className={`doll-slot ${locked ? 'doll-slot-locked' : label ? 'doll-slot-filled' : 'doll-slot-empty'}`}>
                  <div className="doll-slot-icon">{icon}</div>
                  {label
                    ? <div className="doll-slot-name" style={{ color: color ?? '#ccc' }}>{label}</div>
                    : <div className="doll-slot-name doll-slot-none">{locked ? '준비 중' : '없음'}</div>
                  }
                  {sub && <div className="doll-slot-sub">{sub}</div>}
                </div>
              );

              return (
                <div className="doll-wrap">
                  {/* Left column — body slots */}
                  <div className="doll-col doll-col-left">
                    <Slot icon="🎩" label={null} locked={true} />
                    <Slot icon="🥋" label={null} locked={true} />
                    <Slot icon="💍" label={null} locked={true} />
                    <Slot icon="👖" label={null} locked={true} />
                    <Slot icon="🪢" label={null} locked={true} />
                    <Slot icon="👟"
                      label={bootData?.name ?? gs.boots}
                      color={bootData?.color}
                      sub={bootData?.speedBonus > 0 ? `+${bootData.speedBonus} 속도` : null}
                    />
                  </div>

                  {/* Center — character silhouette */}
                  <div className="doll-center">
                    <div className="doll-char">
                      <div className="doll-char-head">
                        <div className="doll-char-face" />
                      </div>
                      <div className="doll-char-body" />
                      <div className="doll-char-legs" />
                    </div>
                    <div className="doll-char-name" style={{ color: myTitle.color }}>[{myTitle.label}]</div>
                    <div className="doll-char-nick">{nickname}</div>
                    <div className="doll-char-money">💰 {gs.money.toLocaleString()}G</div>
                  </div>

                  {/* Right column — activity slots */}
                  <div className="doll-col doll-col-right">
                    <Slot icon="🎣"
                      label={rodData?.name ?? gs.rod}
                      color={rodData?.color}
                      sub={enhLv > 0 ? `+${enhLv} 강화` : null}
                    />
                    <Slot icon="🪝"
                      label={baitData?.name ?? null}
                      color={baitData?.color}
                    />
                    <Slot icon="🍳"
                      label={cwData?.name ?? null}
                      color={cwData?.color}
                      sub={cwData ? `×${cwData.mult} 요리` : null}
                    />
                  </div>
                </div>
              );
            })()}

            {/* ── 어빌리티 tab ── */}
            {statsTab === '어빌리티' && (
              <>
                {(otherPlayersRef.current?.length ?? 0) > 0 && (
                  <div className="party-banner">🎉 파티 중 — 어빌리티 획득 시 20% 확률로 2배!</div>
                )}
                <div className="section">
                  <div className="skill-grid">
                    {Object.entries(ABILITY_DEFS).map(([name, def]) => {
                      const ab = gs.abilities?.[name] ?? { value: 0, grade: 0 };
                      const pct = Math.min(100, ab.value);
                      const canGrade = ab.value >= 100;
                      return (
                        <div key={name} className="skill-card">
                          <div className="skill-top">
                            <span className="skill-icon">{def.icon}</span>
                            <span className="skill-name" style={{ color: def.color }}>{name}</span>
                            <span className="skill-lv">{ab.value.toFixed(2)}</span>
                            {ab.grade > 0 && <span className="grade-badge">G{ab.grade}</span>}
                          </div>
                          <div className="skill-bar-wrap">
                            <div className="skill-bar-fill" style={{ width: `${pct}%`, background: def.color }} />
                          </div>
                          <div className="skill-exp-txt">{ab.value.toFixed(2)} / 100.00</div>
                          <div className="skill-source">{def.desc}</div>
                          {canGrade && (
                            <button className="btn-buy grade-up-btn" onClick={() => {
                              setGs(prev => ({
                                ...prev,
                                abilities: { ...(prev.abilities ?? DEFAULT_ABILITIES),
                                  [name]: doGradeUp(prev.abilities?.[name] ?? { value: 100, grade: 0 }) },
                              }));
                              addMsg(`🌟 ${def.icon} ${name} 그레이드 ${ab.grade + 1} 달성! 희귀 보너스 +${((ab.grade + 1) * 10)}%`, 'catch');
                              playLevelUp();
                              if (gameRef.current) gameRef.current.gradeUpEffect = {
                                age: 0,
                                abilName: name,
                                grade: ab.grade + 1,
                                color: def.color,
                                icon: def.icon,
                              };
                            }}>
                              ⬆️ 그레이드업 → G{ab.grade + 1}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="section">
                  <div className="section-title">🔨 낚싯대 강화</div>
                  {gs.ownedRods.map(rodKey => {
                    const rod = RODS[rodKey];
                    const enhLv = gs.rodEnhance?.[rodKey] ?? 0;
                    const cost = rodEnhanceCost(enhLv);
                    const mats = rodEnhanceMatsNeeded(enhLv);
                    const ganghwaAbil = gs.abilities?.강화?.value ?? 0;
                    const rate = rodEnhanceSuccessRate(enhLv, ganghwaAbil);
                    const canAfford = gs.money >= cost;
                    const hasMats = Object.entries(mats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n);
                    const matsStr = Object.entries(mats).map(([k, n]) => `${k}×${n}`).join(' ');
                    const eff = rodEnhanceEffect(enhLv);
                    return (
                      <div key={rodKey} className="rod-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ color: rod.color, fontWeight: 700 }}>🎣 {rod.name}</span>
                          <span className="badge" style={{ background: enhLv >= 80 ? '#ff4400' : enhLv >= 50 ? '#ffaa00' : '#446688' }}>
                            +{enhLv}
                          </span>
                        </div>
                        <div className="rod-meta">효과: 낚시 -{(eff.timeReduction*100).toFixed(0)}% · 판매 +{(eff.priceBonus*100).toFixed(0)}%</div>
                        <div className="rod-meta">강화비: {cost}G{matsStr ? ` + ${matsStr}` : ''} · 성공률 {(rate*100).toFixed(0)}%</div>
                        <div className="rod-meta" style={{ color: canAfford && hasMats ? '#88ff88' : '#ff8888' }}>
                          보유: {gs.money.toLocaleString()}G
                          {Object.entries(mats).map(([ore, n]) => (
                            <span key={ore} style={{ marginLeft: 6, color: (gs.oreInventory[ore] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                              · {ore} {gs.oreInventory[ore] || 0}/{n}
                            </span>
                          ))}
                        </div>
                        <button
                          className={canAfford && hasMats ? 'btn-buy' : 'btn-dis'}
                          disabled={!canAfford || !hasMats || enhLv >= 100}
                          onClick={() => {
                            if (enhLv >= 100) return;
                            const success = Math.random() < rodEnhanceSuccessRate(enhLv, gs.abilities?.강화?.value ?? 0);
                            setGs(prev => {
                              const ores = { ...prev.oreInventory };
                              for (const [ore, n] of Object.entries(mats)) ores[ore] = Math.max(0, (ores[ore] || 0) - n);
                              return { ...prev, money: prev.money - cost, oreInventory: ores,
                                rodEnhance: { ...(prev.rodEnhance ?? {}), [rodKey]: success ? enhLv + 1 : enhLv } };
                            });
                            if (success) {
                              addMsg(`🔨 ${rod.name} +${enhLv + 1} 강화 성공!`, 'catch');
                              grantAbility('강화', ENHANCE_ABILITY_GAIN);
                              setGs(prev2 => {
                                const ps = prev2.achStats ?? {};
                                const us = { ...ps, enhanceCount: (ps.enhanceCount ?? 0) + 1 };
                                setTimeout(() => checkAndGrantAchievements(us), 0);
                                return { ...prev2, achStats: us };
                              });
                            } else addMsg(`🔨 강화 실패... (${rod.name} +${enhLv} 유지)`, 'error');
                          }}
                        >
                          {enhLv >= 100 ? '최대 강화' : `강화 (+${enhLv} → +${enhLv + 1})`}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* ── Pickaxe enhancement ── */}
                <div className="section">
                  <div className="section-title">⛏ 곡괭이 강화</div>
                  {(gs.ownedPickaxes ?? ['나무곡괭이']).map(pxKey => {
                    const px = PICKAXES[pxKey];
                    const enhLv = gs.pickaxeEnhance?.[pxKey] ?? 0;
                    const cost = pickaxeEnhanceCost(enhLv);
                    const mats = pickaxeEnhanceMatsNeeded(enhLv);
                    const ganghwaAbil = gs.abilities?.강화?.value ?? 0;
                    const rate = pickaxeEnhanceSuccessRate(enhLv, ganghwaAbil);
                    const canAfford = gs.money >= cost;
                    const hasMats = Object.entries(mats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n);
                    const matsStr = Object.entries(mats).map(([k, n]) => `${k}×${n}`).join(' ');
                    const eff = pickaxeEnhanceEffect(enhLv);
                    return (
                      <div key={pxKey} className="rod-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ color: px.color, fontWeight: 700 }}>⛏ {px.name}</span>
                          <span className="badge" style={{ background: enhLv >= 80 ? '#ff4400' : enhLv >= 50 ? '#ffaa00' : '#446688' }}>
                            +{enhLv}
                          </span>
                        </div>
                        <div className="rod-meta">효과: 채굴 -{(eff.timeReduction * 100).toFixed(0)}%</div>
                        <div className="rod-meta">강화비: {cost}G{matsStr ? ` + ${matsStr}` : ''} · 성공률 {(rate * 100).toFixed(0)}%</div>
                        <div className="rod-meta" style={{ color: canAfford && hasMats ? '#88ff88' : '#ff8888' }}>
                          보유: {gs.money.toLocaleString()}G
                          {Object.entries(mats).map(([ore, n]) => (
                            <span key={ore} style={{ marginLeft: 6, color: (gs.oreInventory[ore] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                              · {ore} {gs.oreInventory[ore] || 0}/{n}
                            </span>
                          ))}
                        </div>
                        <button
                          className={canAfford && hasMats ? 'btn-buy' : 'btn-dis'}
                          disabled={!canAfford || !hasMats || enhLv >= 100}
                          onClick={() => {
                            if (enhLv >= 100) return;
                            const success = Math.random() < pickaxeEnhanceSuccessRate(enhLv, gs.abilities?.강화?.value ?? 0);
                            setGs(prev => {
                              const ores = { ...prev.oreInventory };
                              for (const [ore, n] of Object.entries(mats)) ores[ore] = Math.max(0, (ores[ore] || 0) - n);
                              return { ...prev, money: prev.money - cost, oreInventory: ores,
                                pickaxeEnhance: { ...(prev.pickaxeEnhance ?? {}), [pxKey]: success ? enhLv + 1 : enhLv } };
                            });
                            if (success) { addMsg(`⛏ ${px.name} +${enhLv + 1} 강화 성공!`, 'catch'); grantAbility('강화', ENHANCE_ABILITY_GAIN); }
                            else addMsg(`⛏ 강화 실패... (+${enhLv} 유지)`, 'error');
                          }}
                        >
                          {enhLv >= 100 ? '최대 강화' : `강화 (+${enhLv} → +${enhLv + 1})`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── 제련/제작 tab ── */}
            {statsTab === '제련/제작' && (() => {
              const smeltAbil = gs.abilities?.제련?.value ?? 0;
              const successBonus = smeltAbil * 0.005; // up to +50% at 100
              return (
                <>
                  {/* Smelting */}
                  <div className="section">
                    <div className="section-title">🔥 광물 제련 (제련 어빌 {smeltAbil.toFixed(0)})</div>
                    {Object.entries(SMELT_RECIPES).map(([key, recipe]) => {
                      const hasMats = Object.entries(recipe.input).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n);
                      const baseRate = 0.60 + successBonus;
                      const rate = Math.min(0.98, baseRate);
                      return (
                        <div key={key} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ color: recipe.color, fontWeight: 700 }}>🔥 {recipe.name}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>성공률 {(rate * 100).toFixed(0)}%</span>
                          </div>
                          <div className="rod-meta">{recipe.desc}</div>
                          <div className="rod-meta" style={{ color: hasMats ? '#88ff88' : '#ff8888' }}>
                            재료: {Object.entries(recipe.input).map(([ore, n]) => (
                              <span key={ore} style={{ marginRight: 6, color: (gs.oreInventory[ore] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                                {ore} {gs.oreInventory[ore] || 0}/{n}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                            보유: {gs.processedOreInventory?.[key] ?? 0}개
                          </div>
                          <button className={hasMats ? 'btn-buy' : 'btn-dis'} disabled={!hasMats} onClick={() => {
                            const success = Math.random() < rate;
                            setGs(prev => {
                              const ores = { ...prev.oreInventory };
                              for (const [ore, n] of Object.entries(recipe.input)) ores[ore] = Math.max(0, (ores[ore] || 0) - n);
                              const proc = { ...(prev.processedOreInventory ?? {}) };
                              if (success) proc[key] = (proc[key] ?? 0) + 1;
                              return { ...prev, oreInventory: ores, processedOreInventory: proc };
                            });
                            grantAbility('제련', 2);
                            if (success) {
                              addMsg(`🔥 ${recipe.name} 제련 성공!`, 'catch');
                              setGs(prev2 => {
                                const ps = prev2.achStats ?? {};
                                const us = { ...ps, smeltCount: (ps.smeltCount ?? 0) + 1 };
                                setTimeout(() => checkAndGrantAchievements(us), 0);
                                return { ...prev2, achStats: us };
                              });
                            } else addMsg(`🔥 제련 실패… 재료 소모됨`, 'error');
                          }}>제련하기</button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Jewelry crafting */}
                  <div className="section">
                    <div className="section-title">💍 장신구 제작</div>
                    {Object.entries(JEWELRY_RECIPES).map(([key, recipe]) => {
                      const hasMats = Object.entries(recipe.input).every(([mat, n]) => (gs.processedOreInventory?.[mat] || 0) >= n);
                      const smeltRate = Math.min(0.98, 0.50 + successBonus);
                      const equipped = gs.equippedJewelry?.[recipe.slot] === key;
                      const owned = (gs.jewelryInventory ?? []).some(j => j.name === key);
                      return (
                        <div key={key} className="rod-card" style={equipped ? { borderColor: 'rgba(255,215,0,0.4)' } : {}}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ color: recipe.color, fontWeight: 700 }}>{recipe.icon} {recipe.name}</span>
                            {equipped && <span className="badge">장착됨</span>}
                            {owned && !equipped && <span className="badge owned">보유</span>}
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>성공률 {(smeltRate * 100).toFixed(0)}%</span>
                          </div>
                          <div className="rod-meta">{recipe.desc}</div>
                          <div className="rod-meta" style={{ color: hasMats ? '#88ff88' : '#ff8888' }}>
                            재료: {Object.entries(recipe.input).map(([mat, n]) => (
                              <span key={mat} style={{ marginRight: 6, color: (gs.processedOreInventory?.[mat] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                                {mat} {gs.processedOreInventory?.[mat] || 0}/{n}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button className={hasMats ? 'btn-buy' : 'btn-dis'} disabled={!hasMats} onClick={() => {
                              const success = Math.random() < smeltRate;
                              setGs(prev => {
                                const proc = { ...(prev.processedOreInventory ?? {}) };
                                for (const [mat, n] of Object.entries(recipe.input)) proc[mat] = Math.max(0, (proc[mat] || 0) - n);
                                const jewelry = success ? [...(prev.jewelryInventory ?? []), { id: Date.now(), name: key, ...recipe }] : (prev.jewelryInventory ?? []);
                                return { ...prev, processedOreInventory: proc, jewelryInventory: jewelry };
                              });
                              grantAbility('제련', 5);
                              if (success) addMsg(`${recipe.icon} ${recipe.name} 제작 성공!`, 'catch');
                              else addMsg(`제작 실패… 재료 소모됨`, 'error');
                            }}>제작</button>
                            {owned && (
                              <button className={equipped ? 'btn-dis' : 'btn-eq'} disabled={equipped} onClick={() => {
                                setGs(prev => ({ ...prev, equippedJewelry: { ...(prev.equippedJewelry ?? {}), [recipe.slot]: equipped ? null : key } }));
                                addMsg(`${recipe.icon} ${recipe.name} ${equipped ? '해제' : '장착'}`);
                              }}>{equipped ? '해제' : '장착'}</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Potion crafting */}
                  <div className="section">
                    <div className="section-title">🧪 포션 제작</div>
                    {Object.entries(POTION_RECIPES).map(([key, recipe]) => {
                      const herbOk = Object.entries(recipe.input ?? {}).every(([h, n]) => (gs.herbInventory?.[h] || 0) >= n);
                      const cropOk = Object.entries(recipe.cropInput ?? {}).every(([c, n]) => (gs.cropInventory?.[c] || 0) >= n);
                      const hasMats = herbOk && cropOk;
                      const stock = gs.potionInventory?.[key] ?? 0;
                      const isActive = gs.activePotion?.type === key;
                      return (
                        <div key={key} className="rod-card" style={isActive ? { borderColor: 'rgba(100,200,255,0.4)' } : {}}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ color: recipe.color, fontWeight: 700 }}>{recipe.icon} {recipe.name}</span>
                            {stock > 0 && <span className="badge owned">×{stock}</span>}
                            {isActive && <span className="badge" style={{ background: '#1a88cc' }}>효과 중</span>}
                          </div>
                          <div className="rod-meta">{recipe.desc}</div>
                          <div className="rod-meta">
                            재료:{' '}
                            {Object.entries(recipe.input ?? {}).map(([herb, n]) => (
                              <span key={herb} style={{ marginRight: 6, color: (gs.herbInventory?.[herb] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                                {herb} {gs.herbInventory?.[herb] || 0}/{n}
                              </span>
                            ))}
                            {Object.entries(recipe.cropInput ?? {}).map(([crop, n]) => (
                              <span key={crop} style={{ marginRight: 6, color: (gs.cropInventory?.[crop] || 0) >= n ? '#88ff88' : '#ff8888' }}>
                                🌾{crop} {gs.cropInventory?.[crop] || 0}/{n}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button className={hasMats ? 'btn-buy' : 'btn-dis'} disabled={!hasMats} onClick={() => {
                              setGs(prev => {
                                const herbs = { ...(prev.herbInventory ?? {}) };
                                for (const [herb, n] of Object.entries(recipe.input ?? {})) herbs[herb] = Math.max(0, (herbs[herb] || 0) - n);
                                const crops = { ...(prev.cropInventory ?? {}) };
                                for (const [crop, n] of Object.entries(recipe.cropInput ?? {})) crops[crop] = Math.max(0, (crops[crop] || 0) - n);
                                const pots = { ...(prev.potionInventory ?? {}), [key]: (prev.potionInventory?.[key] ?? 0) + 1 };
                                return { ...prev, herbInventory: herbs, cropInventory: crops, potionInventory: pots };
                              });
                              addMsg(`${recipe.icon} ${recipe.name} 제조 완료!`, 'catch');
                            }}>제조</button>
                            {stock > 0 && !isActive && (
                              <button className="btn-eq" onClick={() => {
                                const expiresAt = Date.now() + recipe.effect.duration;
                                setGs(prev => ({
                                  ...prev,
                                  potionInventory: { ...(prev.potionInventory ?? {}), [key]: prev.potionInventory[key] - 1 },
                                  activePotion: { type: key, effect: recipe.effect, expiresAt },
                                }));
                                addMsg(`${recipe.icon} ${recipe.name} 사용! (${recipe.effect.duration / 1000}초)`, 'catch');
                              }}>사용</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dish recipes */}
                  <div className="section">
                    <div className="section-title">🍽 특별 요리 레시피</div>
                    <div className="rod-meta" style={{ marginBottom: 8, color: 'rgba(255,255,255,0.45)' }}>요리소 근처에서 !요리 [요리명] 또는 버튼 클릭</div>
                    {Object.entries(DISH_RECIPES).map(([key, recipe]) => {
                      const cropOk = Object.entries(recipe.crops ?? {}).every(([c, n]) => (gs.cropInventory?.[c] ?? 0) >= n);
                      const fishNeeded = recipe.fish;
                      const fishOk = !fishNeeded || (() => {
                        const inv = gs.fishInventory ?? [];
                        return fishNeeded.name
                          ? inv.some(f => f.name === fishNeeded.name)
                          : inv.some(f => FISH[f.name]?.rarity === fishNeeded.rarity);
                      })();
                      const canCook = cropOk && fishOk;
                      return (
                        <div key={key} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 18 }}>{recipe.icon}</span>
                            <span style={{ fontWeight: 700, color: '#ffe0a0' }}>{recipe.name}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>+{recipe.price}G</span>
                          </div>
                          <div className="rod-meta">{recipe.desc}</div>
                          <div className="rod-meta" style={{ marginTop: 3 }}>
                            {Object.entries(recipe.crops ?? {}).map(([c, n]) => (
                              <span key={c} style={{ marginRight: 6, color: (gs.cropInventory?.[c] ?? 0) >= n ? '#88ff88' : '#ff8888' }}>
                                🌾{c} {gs.cropInventory?.[c] ?? 0}/{n}
                              </span>
                            ))}
                            {fishNeeded && (
                              <span style={{ color: fishOk ? '#88ff88' : '#ff8888' }}>
                                🐟{fishNeeded.name ?? fishNeeded.rarity + ' 생선'} {fishOk ? '✓' : '✗'}
                              </span>
                            )}
                          </div>
                          <button tabIndex={-1} className={canCook ? 'btn-buy' : 'btn-dis'}
                            style={{ marginTop: 6, fontSize: 11 }} disabled={!canCook}
                            onClick={() => handleCommand(`!요리 ${key}`)}>
                            요리하기 (+{recipe.price}G)
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {/* ── 업적 tab ── */}
            {statsTab === '업적' && (
              <div className="section">
                <div className="section-title">업적 ({(gs.achievements ?? []).length} / {ACHIEVEMENTS.length})</div>
                {ACHIEVEMENTS.map(ach => {
                  const val = gs.achStats?.[ach.type] ?? 0;
                  const done = (gs.achievements ?? []).includes(ach.id);
                  const pct = Math.min(100, Math.round((val / ach.goal) * 100));
                  return (
                    <div key={ach.id} className="rod-card" style={{ opacity: done ? 0.6 : 1, borderColor: done ? 'rgba(255,215,0,0.3)' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 18 }}>{ach.icon}</span>
                        <span style={{ fontWeight: 700, color: done ? '#ffdd44' : '#ffe0a0' }}>{ach.label}</span>
                        {done && <span className="badge" style={{ background: '#886600' }}>완료</span>}
                      </div>
                      <div className="rod-meta">{ach.desc}</div>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden', margin: '4px 0' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: done ? '#886600' : '#4488ff', borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{Math.min(val, ach.goal)} / {ach.goal} · 보상 {ach.reward.money}G</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── 펫 tab ── */}
            {statsTab === '펫' && (() => {
              const now = Date.now();
              const petLevels = gs.petLevels ?? {};
              const petExp = gs.petExp ?? {};
              const innBuff = gs.innBuff;
              const innBuffActive = innBuff && now < innBuff.expiresAt;
              return (
                <>
                  {innBuffActive && (
                    <div className="section">
                      <div className="rod-card" style={{ borderColor: 'rgba(100,200,255,0.5)', background: 'rgba(0,100,200,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>💤</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#88ccff' }}>여관 휴식 버프 활성</div>
                            <div className="rod-meta">낚시 속도 +20% · {Math.ceil((innBuff.expiresAt - now) / 60000)}분 남음</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {gs.activePet && (() => {
                    const pet = PETS[gs.activePet];
                    const level = petLevels[gs.activePet] ?? 1;
                    const exp = petExp[gs.activePet] ?? 0;
                    const nextThresh = level < PET_MAX_LEVEL ? PET_EXP_THRESHOLDS[level - 1] : null;
                    const mult = PET_LEVEL_MULT[level - 1] ?? 1.0;
                    return (
                      <div className="section">
                        <div className="section-title">활성 펫</div>
                        <div className="rod-card" style={{ borderColor: 'rgba(255,170,0,0.4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 24 }}>{pet?.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: PET_RARITY_COLOR[pet?.rarity] ?? '#fff' }}>
                                {pet?.name} <span style={{ color: '#ffcc44', fontSize: 12 }}>Lv.{level}</span>
                                {level >= PET_MAX_LEVEL && <span style={{ color: '#ff8844', fontSize: 11, marginLeft: 4 }}>MAX</span>}
                              </div>
                              <div className="rod-meta">{pet?.desc} · 보너스 ×{mult.toFixed(2)}</div>
                              {level < PET_MAX_LEVEL && (
                                <div style={{ marginTop: 4 }}>
                                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                                    EXP {exp} / {nextThresh} (Lv.{level + 1}까지)
                                  </div>
                                  <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                                    <div style={{ width: `${Math.min(100, (exp / nextThresh) * 100)}%`, height: '100%', background: '#ffcc44', borderRadius: 2 }} />
                                  </div>
                                </div>
                              )}
                            </div>
                            <button className="btn-dis" style={{ fontSize: 11 }}
                              onClick={() => { setGs(prev => ({ ...prev, activePet: null })); addMsg('펫 해제됨', 'system'); }}>
                              해제
                            </button>
                          </div>
                          {level < PET_MAX_LEVEL && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                물고기로 먹이주기 (!펫먹이 [물고기명]):
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {[...new Set(gs.fishInventory ?? [])].slice(0, 6).map(fname => (
                                  <button key={fname} className="btn-eq" style={{ fontSize: 11, padding: '2px 6px' }}
                                    onClick={() => handleCommand(`!펫먹이 ${fname}`)}>
                                    {fname} (+{Math.max(1, Math.ceil((FISH[fname]?.price ?? 20) / 40))}exp)
                                  </button>
                                ))}
                                {(gs.fishInventory?.length ?? 0) === 0 && (
                                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>인벤토리에 물고기 없음</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="section">
                    <div className="section-title">내 펫 / 알</div>
                    {Object.keys(PETS).every(k => !(gs.petEggs ?? {})[k]) && !gs.activePet
                      ? <div className="empty">보유한 펫 또는 알이 없습니다. 상점에서 구매하세요.</div>
                      : Object.entries(PETS).map(([key, pet]) => {
                          const egg = (gs.petEggs ?? {})[key];
                          if (!egg) return null;
                          const hatched = now >= egg.hatchAt;
                          const isActive = gs.activePet === key;
                          const remainMs = Math.max(0, egg.hatchAt - now);
                          const remainMin = Math.ceil(remainMs / 60000);
                          const level = petLevels[key] ?? 1;
                          return (
                            <div key={key} className="rod-card">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 22 }}>{hatched ? pet.icon : '🥚'}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, color: PET_RARITY_COLOR[pet.rarity] ?? '#fff' }}>
                                    {hatched ? pet.name : `${pet.name} 알`}
                                    {hatched && <span style={{ color: '#ffcc44', fontSize: 11, marginLeft: 4 }}>Lv.{level}</span>}
                                  </div>
                                  <div className="rod-meta">
                                    {hatched ? pet.desc : `부화까지 ${remainMin}분 남음`}
                                  </div>
                                </div>
                                {hatched && !isActive && (
                                  <button className="btn-eq" onClick={() => {
                                    setGs(prev => ({ ...prev, activePet: key }));
                                    addMsg(`${pet.icon} ${pet.name} 장착!`, 'catch');
                                  }}>장착</button>
                                )}
                                {isActive && <span className="badge">장착됨</span>}
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                  <div className="section">
                    <div className="section-title" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>펫 레벨업 안내</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                      물고기를 먹이면 EXP를 얻어 레벨이 오릅니다.<br/>
                      레벨이 높을수록 보너스 효과가 증가합니다.<br/>
                      Lv.2: ×1.25 / Lv.3: ×1.5 / Lv.4: ×1.75 / Lv.5: ×2.0
                    </div>
                  </div>
                </>
              );
            })()}

            {/* ── 관계도 tab ── */}
            {statsTab === '관계도' && (
              <div className="section">
                <div className="section-title">NPC 관계도</div>
                {Object.entries(NPCS).map(([npcKey, npc]) => {
                  const affinity = gs.npcAffinity?.[npcKey] ?? 0;
                  const level = getAffinityLevel(affinity, npcKey);
                  const next = npc.thresholds.find(t => affinity < t.at);
                  return (
                    <div key={npcKey} className="rod-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>{npc.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: npc.color }}>{npc.name}</div>
                          <div className="rod-meta">{npc.desc}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 12 }}>
                          <div style={{ color: level ? npc.color : '#888', fontWeight: 700 }}>
                            {level ? `[${level.label}]` : '[일반]'}
                          </div>
                          <div style={{ color: '#ffcc44' }}>{affinity} / 100</div>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ width: `${affinity}%`, height: '100%', background: npc.color, borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                      {level && <div style={{ fontSize: 11, color: '#88ff88', marginBottom: 2 }}>혜택: {level.reward}</div>}
                      {next && <div style={{ fontSize: 11, color: '#aaa' }}>다음: [{next.label}] (호감도 {next.at} 달성 시) — {next.reward}</div>}
                      {!next && <div style={{ fontSize: 11, color: npc.color }}>최고 관계 달성!</div>}
                    </div>
                  );
                })}
                {(() => {
                  const discount = getShopDiscount(gs.npcAffinity);
                  if (discount > 0) return (
                    <div style={{ padding: '8px 0', fontSize: 12, color: '#ffcc44' }}>
                      현재 상점 할인: {Math.round(discount * 100)}%
                    </div>
                  );
                  return null;
                })()}
              </div>
            )}

            {/* ── 탐험 tab ── */}
            {statsTab === '탐험' && (
              <div className="section">
                <div className="section-title">탐험 구역 ({(gs.exploredZones ?? []).length} / {EXPLORE_ZONES.length} 발견)</div>
                {EXPLORE_ZONES.map(zone => {
                  const unlocked = (gs.exploredZones ?? []).includes(zone.id);
                  const canUnlock = Object.entries(zone.reqAbil).every(([abil, req]) => (gs.abilities?.[abil]?.value ?? 0) >= req);
                  return (
                    <div key={zone.id} className="rod-card" style={{ opacity: unlocked ? 1 : 0.7, borderColor: unlocked ? 'rgba(100,220,100,0.3)' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>{zone.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: unlocked ? '#88ff88' : '#ffe0a0' }}>
                            {unlocked ? '✓ ' : '🔒 '}{zone.name}
                          </div>
                          <div className="rod-meta">{zone.desc}</div>
                        </div>
                        {unlocked && <span className="badge" style={{ background: '#1a7a1a' }}>발견됨</span>}
                      </div>
                      {unlocked
                        ? <div style={{ fontSize: 11, color: '#88ff88' }}>혜택: {zone.benefit}</div>
                        : <>
                            <div style={{ fontSize: 11, color: canUnlock ? '#ffcc44' : '#888' }}>
                              조건: {zone.reqLabel}
                            </div>
                            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                              {Object.entries(zone.reqAbil).map(([abil, req]) => {
                                const cur = gs.abilities?.[abil]?.value ?? 0;
                                return (
                                  <span key={abil} style={{ marginRight: 8, color: cur >= req ? '#88ff88' : '#ff8888' }}>
                                    {abil} {cur.toFixed(0)}/{req}
                                  </span>
                                );
                              })}
                            </div>
                          </>
                      }
                    </div>
                  );
                })}
                <div style={{ marginTop: 8 }}>
                  <button className="btn-buy" onClick={() => handleCommand('!탐험')}>
                    🗺 탐험 실행 (!탐험)
                  </button>
                </div>
              </div>
            )}

            {/* ── 농장 tab ── */}
            {statsTab === '농장' && (() => {
              const now = Date.now();
              const plots = gs.farmPlots ?? [];
              const cropInv = gs.cropInventory ?? {};
              const cropEntries = Object.entries(cropInv).filter(([, n]) => n > 0);
              // Find sellPrice for a crop from SEEDS
              const getCropSellPrice = (itemName) => {
                for (const sd of Object.values(SEEDS)) {
                  if (sd.yield.item === itemName) return sd.yield.sellPrice;
                }
                return 0;
              };
              return (
                <>
                  <div className="section">
                    <div className="section-title">🌱 농장 현황 ({plots.length}/{MAX_FARM_PLOTS}칸)</div>
                    {plots.length === 0 && (
                      <div className="empty">심은 작물이 없습니다. !심기 [씨앗명] 으로 씨앗을 심으세요.</div>
                    )}
                    {plots.map(plot => {
                      const sd = SEEDS[plot.seed];
                      if (!sd) return null;
                      const isReady = now >= plot.harvestAt;
                      const elapsed = now - plot.plantedAt;
                      const total = plot.harvestAt - plot.plantedAt;
                      const pct = Math.min(100, Math.round((elapsed / total) * 100));
                      const remainMs = Math.max(0, plot.harvestAt - now);
                      const remainMin = Math.ceil(remainMs / 60000);
                      return (
                        <div key={plot.id} className="rod-card" style={{ borderColor: isReady ? 'rgba(100,220,100,0.4)' : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 18 }}>🌱</span>
                            <span style={{ fontWeight: 700, color: isReady ? '#88ff88' : '#ffe0a0' }}>{sd.name}</span>
                            {isReady && <span className="badge" style={{ background: '#1a7a1a' }}>수확 가능!</span>}
                            {!isReady && plot.watered && <span className="badge" style={{ background: '#1a4a8a' }}>💧 물줌</span>}
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: isReady ? '#44ff88' : plot.watered ? '#44aaff' : '#4488ff', borderRadius: 4 }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>
                            {isReady ? `✅ 수확 준비 완료! (수확: ${sd.yield.item})` : `⏳ ${remainMin}분 남음 (${pct}%)${plot.watered ? ' · 물 줌 ✓' : ''}`}
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {plots.some(p => now >= p.harvestAt) && (
                        <button className="btn-buy" onClick={() => handleCommand('!수확')}>
                          🌾 전체 수확
                        </button>
                      )}
                      {plots.some(p => !p.watered && now < p.harvestAt) && (
                        <button className="btn-eq" onClick={() => handleCommand('!물주기')}>
                          💧 물 주기 (성장 25%↑)
                        </button>
                      )}
                    </div>
                    {plots.length < MAX_FARM_PLOTS && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>씨앗 심기 (농장 근처에서):</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {Object.entries(SEEDS).map(([key, sd]) => (
                            <button key={key} className={gs.money >= sd.price ? 'btn-buy' : 'btn-dis'}
                              style={{ fontSize: 11 }}
                              disabled={gs.money < sd.price}
                              onClick={() => handleCommand(`!심기 ${key}`)}>
                              🌱 {sd.name} ({sd.price}G)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="section">
                    <div className="section-title">🌾 수확물 창고</div>
                    {cropEntries.length === 0
                      ? <div className="empty">수확한 작물이 없습니다.</div>
                      : cropEntries.map(([itemName, count]) => {
                          const sp = getCropSellPrice(itemName);
                          const total = sp * count;
                          return (
                            <div key={itemName} className="rod-card">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, color: '#88ff88' }}>🌾 {itemName} ×{count}</span>
                                <span style={{ color: '#ffcc44', fontSize: 12 }}>{sp}G/개 (총 {total}G)</span>
                              </div>
                              <button className="btn-buy" style={{ fontSize: 11 }} onClick={() => {
                                setGs(prev => {
                                  const newCrop = { ...(prev.cropInventory ?? {}), [itemName]: 0 };
                                  return { ...prev, money: prev.money + total, cropInventory: newCrop };
                                });
                                addMsg(`💰 ${itemName} ${count}개 판매 +${total}G`, 'catch');
                                advanceQuest('sell', total);
                              }}>
                                전체 판매 ({total}G)
                              </button>
                            </div>
                          );
                        })
                    }
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Ranking modal */}
      {showRank && <Leaderboard onClose={() => setShowRank(false)} myNickname={nickname} />}

      {/* Player inspect modal */}
      {inspectPlayer && (
        <div className="overlay" onClick={() => setInspectPlayer(null)}>
          <div className="panel inspect-panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>👤 플레이어 정보</span>
              <button tabIndex={-1} onClick={() => setInspectPlayer(null)}>✕</button>
            </div>
            <div className="inspect-header">
              <div className="inspect-title" style={{ color: inspectPlayer.titleColor ?? '#aaa' }}>
                [{inspectPlayer.title ?? '신입'}]
              </div>
              <div className="inspect-name">{inspectPlayer.nickname}</div>
              <div className="inspect-sub">🐟 {inspectPlayer.fishCaught ?? 0}마리 낚음</div>
            </div>
            <div className="section">
              <div className="section-title">장비</div>
              <div className="inspect-equip-row">
                <span style={{ color: RODS[inspectPlayer.rod]?.color ?? '#fff' }}>
                  🎣 {RODS[inspectPlayer.rod]?.name ?? inspectPlayer.rod}
                </span>
              </div>
              <div className="inspect-equip-row">
                <span style={{ color: BOOTS[inspectPlayer.boots]?.color ?? '#aaa' }}>
                  👟 {BOOTS[inspectPlayer.boots]?.name ?? inspectPlayer.boots ?? '기본 신발'}
                </span>
              </div>
            </div>
            <div className="section">
              <div className="section-title">어빌리티</div>
              <div className="inspect-skill-list">
                {Object.entries(ABILITY_DEFS).map(([name, def]) => {
                  const val = inspectPlayer.abilityVals?.[name] ?? 0;
                  const grade = inspectPlayer.abilityGrades?.[name] ?? 0;
                  return (
                    <div key={name} className="inspect-skill-row">
                      <span className="inspect-skill-icon">{def.icon}</span>
                      <span className="inspect-skill-name" style={{ color: def.color }}>{name}</span>
                      <div className="inspect-skill-bar-wrap">
                        <div className="inspect-skill-bar-fill"
                          style={{ width: `${Math.min(100, val)}%`, background: def.color }} />
                      </div>
                      <span className="inspect-skill-lv">{val.toFixed(1)}{grade > 0 ? ` G${grade}` : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quest modal */}
      {showQuest && (
        <div className="overlay" onClick={() => setShowQuest(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>📋 오늘의 퀘스트</span>
              <button tabIndex={-1} onClick={() => setShowQuest(false)}>✕</button>
            </div>
            <div className="section">
              {(gs.dailyQuests ?? []).map(q => {
                const cur = Math.min(q.goal, (gs.questProgress ?? {})[q.id] ?? 0);
                const done = cur >= q.goal;
                const claimed = !!(gs.questClaimed ?? {})[q.id];
                const pct = Math.round((cur / q.goal) * 100);
                return (
                  <div key={q.id} className="quest-card" style={{ opacity: claimed ? 0.45 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: claimed ? '#aaa' : done ? '#88ff88' : '#ffe0a0' }}>
                        {claimed ? '☑ ' : done ? '✅ ' : ''}{q.label}
                      </span>
                      <span style={{ color: '#ffcc44', fontSize: 12 }}>+{q.reward}G</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: claimed ? '#666' : done ? '#44ff88' : '#4488ff', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{cur} / {q.goal}</span>
                      {done && !claimed && (
                        <button
                          style={{ background: 'rgba(255,220,50,0.25)', color: '#ffdd44', border: '1px solid rgba(255,220,50,0.5)', borderRadius: 6, padding: '3px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                          onClick={() => {
                            setGs(prev => ({
                              ...prev,
                              money: prev.money + q.reward,
                              questClaimed: { ...(prev.questClaimed ?? {}), [q.id]: true },
                            }));
                            addMsg(`🎁 퀘스트 보상 수령: +${q.reward}G!`, 'catch');
                            if (gameRef.current) gameRef.current.questCompleteEffect = { age: 0 };
                          }}
                        >
                          🎁 수령
                        </button>
                      )}
                      {claimed && <span style={{ fontSize: 11, color: '#888' }}>수령 완료</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '8px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              퀘스트는 매일 자정에 초기화됩니다
            </div>
          </div>
        </div>
      )}

      {/* Fish encyclopedia modal */}
      {showDex && (
        <div className="overlay" onClick={() => setShowDex(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>📖 물고기 도감</span>
              <button tabIndex={-1} onClick={() => setShowDex(false)}>✕</button>
            </div>
            <div style={{ padding: '0 16px 8px' }}>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                수집: {(gs.caughtSpecies ?? []).length} / {Object.keys(FISH).length}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, marginBottom: 12 }}>
                <div style={{ width: `${((gs.caughtSpecies?.length ?? 0) / Object.keys(FISH).length) * 100}%`, height: '100%', background: '#44ffaa', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(() => {
                  const FISH_HINT = {
                    붕어: '낚시 0+ · 부두에서 낚시', 잉어: '낚시 0+ · 부두에서 낚시',
                    미꾸라지: '낚시 0+ · 부두에서 낚시', 메기: '낚시 0+ · 부두에서 낚시',
                    멸치: '낚시 10+ · 부두 낚시', 배스: '낚시 10+ · 부두 낚시',
                    송어: '낚시 10+ · 부두 낚시',
                    꽁치: '낚시 20+ · 미끼 추천', 강꼬치고기: '낚시 20+ · 미끼 추천',
                    황다랑어: '낚시 20+ · 미끼 추천', 금눈돔: '낚시 20+ · 미끼 추천',
                    연어: '낚시 30+ · 심해 부두 추천', 황금붕어: '낚시 30+ · 황금 미끼',
                    오징어: '낚시 30+ · 심해 부두', 낙지: '낚시 30+ · 심해 부두',
                    참치: '낚시 40+ · 바다 낚시', 광어: '낚시 40+ · 바다 낚시',
                    감성돔: '낚시 40+ · 전설 미끼',
                    우럭: '낚시 50+ · 바다·전설 미끼', 뱀장어: '낚시 50+ · 바다 낚시',
                    황새치: '낚시 50+ · 신화 미끼 추천',
                    용고기: '낚시 70+ · 바다·신화 미끼', 고대어: '낚시 70+ · 신화 미끼 필수',
                  };
                  return Object.entries(FISH).map(([fishName, fd]) => {
                    const caught = (gs.caughtSpecies ?? []).includes(fishName);
                    const record = (gs.fishRecords ?? {})[fishName];
                    const isMaxSize = record && record.size >= fd.maxSz * 0.97;
                    return (
                      <div key={fishName} style={{
                        background: caught ? (isMaxSize ? 'rgba(255,200,0,0.12)' : 'rgba(68,255,170,0.1)') : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${caught ? (isMaxSize ? 'rgba(255,200,0,0.5)' : 'rgba(68,255,170,0.3)') : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 6, padding: '6px 10px',
                        opacity: caught ? 1 : 0.65,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: caught ? (isMaxSize ? '#ffcc44' : '#44ffaa') : '#aaa' }}>
                          {caught ? (isMaxSize ? '🏆 ' : '✓ ') : '🔍 '}{fishName}
                        </div>
                        {caught
                          ? <>
                              <div style={{ fontSize: 10, color: '#888' }}>{fd.rarity} · {fd.price}G~</div>
                              {record && (
                                <div style={{ fontSize: 10, color: isMaxSize ? '#ffcc44' : '#aaa' }}>
                                  최대: {record.size}cm {isMaxSize ? '(최고 크기!)' : `/ ${fd.maxSz}cm`}
                                </div>
                              )}
                            </>
                          : <div style={{ fontSize: 10, color: '#7ab' }}>{FISH_HINT[fishName] ?? '낚시 중 발견 가능'}</div>
                        }
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop modal */}
      {showShop && (
        <div className="overlay" onClick={() => setShowShop(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>🏪 상점</span>
              <button tabIndex={-1} onClick={() => setShowShop(false)}>✕</button>
            </div>
            <div className="shop-money">보유: {gs.money.toLocaleString()}G
              {getShopDiscount(gs.npcAffinity) > 0 && (
                <span style={{ marginLeft: 10, color: '#88ff88', fontSize: 12 }}>
                  🧑‍💼 상인 할인 -{Math.round(getShopDiscount(gs.npcAffinity) * 100)}%
                </span>
              )}
            </div>

            {/* ── Rods ── */}
            <div className="section">
              <div className="section-title">낚시대</div>
              {Object.entries(RODS).map(([key, rod]) => {
                const owned = gs.ownedRods.includes(key);
                const equipped = gs.rod === key;
                const needMoney = rod.price > 0;
                const canAfford = !needMoney || gs.money >= rod.price;
                const hasMats = rod.upgradeMats
                  ? Object.entries(rod.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const matsStr = rod.upgradeMats
                  ? Object.entries(rod.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ')
                  : null;
                const canBuy = canAfford && hasMats;
                const [tMin, tMax] = rod.catchTimeRange;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: rod.color, fontWeight: 700 }}>🎣 {rod.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {needMoney ? `${rod.price}G` : '무료'}
                      {matsStr ? ` + 재료: ${matsStr}` : ''}
                      {' · '}낚시 {tMin/1000}~{tMax/1000}초
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipRod(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyRod(key)} disabled={!canBuy}>
                            {canBuy ? (needMoney ? `${rod.price}G + 재료` : '획득') : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Boots ── */}
            <div className="section">
              <div className="section-title">신발 (이동속도)</div>
              {Object.entries(BOOTS).map(([key, boot]) => {
                const owned = (gs.ownedBoots ?? ['기본신발']).includes(key);
                const equipped = gs.boots === key;
                const canAfford = gs.money >= boot.price;
                const hasMats = boot.upgradeMats
                  ? Object.entries(boot.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = boot.upgradeMats ? Object.entries(boot.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: boot.color, fontWeight: 700 }}>👟 {boot.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {boot.price > 0 ? `${boot.price}G` : '무료'}
                      {matsStr ? ` + 재료: ${matsStr}` : ''}
                      {' · '}속도 +{boot.speedBonus > 0 ? `${Math.round(boot.speedBonus / 3.5 * 100)}%` : '기본'}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipBoots(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyBoots(key)} disabled={!canBuy}>
                            {canBuy ? (boot.price > 0 ? `${boot.price}G 구매` : '획득') : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Bait ── */}
            <div className="section">
              <div className="section-title">미끼</div>
              {Object.entries(BAIT).map(([key, bait]) => {
                const isPerm = bait.type === 'permanent';
                const owned = isPerm ? (gs.ownedBait ?? []).includes(key) : false;
                const equipped = gs.equippedBait === key;
                const stock = (gs.baitInventory ?? {})[key] ?? 0;
                const canAfford = gs.money >= bait.price;
                return (
                  <div key={key} className="rod-card" style={equipped ? { borderColor: 'rgba(170,68,255,0.4)', background: 'rgba(170,68,255,0.07)' } : {}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ color: bait.color, fontWeight: 700 }}>🪝 {bait.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {isPerm && owned && !equipped && <span className="badge owned">보유</span>}
                      {!isPerm && stock > 0 && <span className="badge owned">×{stock}</span>}
                    </div>
                    <div className="rod-meta">{bait.price}G · {bait.desc}</div>
                    <div style={{ marginTop: 5, display: 'flex', gap: 6 }}>
                      {isPerm && owned
                        ? <button tabIndex={-1} className={equipped ? 'btn-dis' : 'btn-eq'} onClick={() => equipBait(key)} disabled={equipped}>
                            {equipped ? '장착중' : '장착'}
                          </button>
                        : <button tabIndex={-1} className={canAfford ? 'btn-buy' : 'btn-dis'} onClick={() => buyBait(key)} disabled={!canAfford}>
                            {canAfford ? `${bait.price}G 구매` : '💰 부족'}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Cookware ── */}
            <div className="section">
              <div className="section-title">요리 도구</div>
              {Object.entries(COOKWARE).map(([key, cw]) => {
                const owned = (gs.ownedCookware ?? []).includes(key);
                const equipped = gs.cookware === key;
                const canAfford = gs.money >= cw.price;
                const hasMats = cw.upgradeMats ? Object.entries(cw.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n) : true;
                const matsStr = cw.upgradeMats ? Object.entries(cw.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                const canBuy = canAfford && hasMats;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ color: cw.color, fontWeight: 700 }}>🍳 {cw.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {cw.price}G{matsStr ? ` + ${matsStr}` : ''} · {cw.desc}
                    </div>
                    <div style={{ marginTop: 5 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipCookware(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyCookware(key)} disabled={!canBuy}>
                            {canBuy ? `${cw.price}G 구매` : (!canAfford ? '💰 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Marine Gear ── */}
            <div className="section">
              <div className="section-title">🌊 해양 장비 (바다 낚시)</div>
              {Object.entries(MARINE_GEAR).map(([key, gear]) => {
                const owned = (gs.ownedMarineGear ?? []).includes(key);
                const equipped = gs.marineGear === key;
                const canAfford = gs.money >= gear.price;
                const hasMats = gear.upgradeMats
                  ? Object.entries(gear.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = gear.upgradeMats ? Object.entries(gear.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: gear.color, fontWeight: 700 }}>🌊 {gear.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {gear.price}G{matsStr ? ` + 재료: ${matsStr}` : ''} · {gear.desc}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? <button tabIndex={-1} className={equipped ? 'btn-dis' : 'btn-eq'} onClick={() => equipMarineGear(key)}>
                            {equipped ? '해제' : '장착'}
                          </button>
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyMarineGear(key)} disabled={!canBuy}>
                            {canBuy ? `${gear.price}G 구매` : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pickaxes ── */}
            <div className="section">
              <div className="section-title">⛏ 곡괭이 (채굴 도구)</div>
              {Object.entries(PICKAXES).map(([key, px]) => {
                const owned = (gs.ownedPickaxes ?? ['나무곡괭이']).includes(key);
                const equipped = gs.pickaxe === key;
                const canAfford = gs.money >= px.price;
                const hasMats = px.upgradeMats
                  ? Object.entries(px.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = px.upgradeMats ? Object.entries(px.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: px.color, fontWeight: 700 }}>⛏ {px.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {px.price > 0 ? `${px.price}G` : '무료'}
                      {matsStr ? ` + 재료: ${matsStr}` : ''}
                      {' · '}{px.desc}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipPickaxe(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyPickaxe(key)} disabled={!canBuy}>
                            {canBuy ? (px.price > 0 ? `${px.price}G 구매` : '획득') : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Gather tools ── */}
            <div className="section">
              <div className="section-title">🌿 채집 도구</div>
              {Object.entries(GATHER_TOOLS).map(([key, gt]) => {
                const owned = (gs.ownedGatherTools ?? ['맨손']).includes(key);
                const equipped = gs.gatherTool === key;
                const canAfford = gs.money >= gt.price;
                const hasMats = gt.upgradeMats
                  ? Object.entries(gt.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
                  : true;
                const canBuy = canAfford && hasMats;
                const matsStr = gt.upgradeMats ? Object.entries(gt.upgradeMats).map(([k, n]) => `${k}×${n}`).join(', ') : null;
                return (
                  <div key={key} className={`rod-card ${equipped ? 'equipped' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: gt.color, fontWeight: 700 }}>🌿 {gt.name}</span>
                      {equipped && <span className="badge">장착됨</span>}
                      {owned && !equipped && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">
                      {gt.price > 0 ? `${gt.price}G` : '무료'}
                      {matsStr ? ` + 재료: ${matsStr}` : ''}
                      {' · '}{gt.desc}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {owned
                        ? (!equipped && <button tabIndex={-1} className="btn-eq" onClick={() => equipGatherTool(key)}>장착</button>)
                        : <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} onClick={() => buyGatherTool(key)} disabled={!canBuy}>
                            {canBuy ? (gt.price > 0 ? `${gt.price}G 구매` : '획득') : (!canAfford ? '💰 골드 부족' : '재료 부족')}
                          </button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pet eggs ── */}
            <div className="section">
              <div className="section-title">🥚 펫 에그</div>
              {Object.entries(PETS).map(([key, pet]) => {
                const egg = (gs.petEggs ?? {})[key];
                const canAfford = gs.money >= pet.eggPrice;
                const hatchMs = pet.hatchMs;
                const hatchMin = Math.round(hatchMs / 60000);
                return (
                  <div key={key} className="rod-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 20 }}>{pet.icon}</span>
                      <span style={{ fontWeight: 700, color: PET_RARITY_COLOR[pet.rarity] ?? '#fff' }}>{pet.name}</span>
                      <span style={{ fontSize: 11, color: PET_RARITY_COLOR[pet.rarity] ?? '#aaa' }}>[{pet.rarity}]</span>
                      {egg && <span className="badge owned">보유</span>}
                    </div>
                    <div className="rod-meta">{pet.desc}</div>
                    <div className="rod-meta">{pet.eggPrice}G · 부화 {hatchMin}분</div>
                    <div style={{ marginTop: 5 }}>
                      {egg ? (
                        <span style={{ fontSize: 11, color: '#aaa' }}>
                          {Date.now() >= egg.hatchAt ? '부화 완료! 스탯창 펫 탭에서 확인' : `부화까지 ${Math.ceil((egg.hatchAt - Date.now()) / 60000)}분`}
                        </span>
                      ) : (
                        <button tabIndex={-1} className={canAfford ? 'btn-buy' : 'btn-dis'} disabled={!canAfford}
                          onClick={() => {
                            if (gs.money < pet.eggPrice) { addMsg('💰 골드 부족', 'error'); return; }
                            const boughtAt = Date.now();
                            const hatchAt = boughtAt + pet.hatchMs;
                            setGs(prev => ({
                              ...prev,
                              money: prev.money - pet.eggPrice,
                              petEggs: { ...(prev.petEggs ?? {}), [key]: { boughtAt, hatchAt } },
                            }));
                            addMsg(`🥚 ${pet.name} 알 구매! ${hatchMin}분 후 부화됩니다.`, 'catch');
                          }}>
                          {canAfford ? `${pet.eggPrice}G 구매` : '💰 골드 부족'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Sell ore ── */}
            <div className="section">
              <div className="section-title">광석 판매</div>
              {Object.entries(gs.oreInventory ?? {}).every(([, n]) => n === 0)
                ? <div className="empty">판매할 광석 없음</div>
                : <div>
                    {Object.entries(gs.oreInventory ?? {}).filter(([, n]) => n > 0).map(([ore, count]) => {
                      const oreColors = { 철광석: '#cc8844', 구리광석: '#44ccaa', 수정: '#aa66ff', 금광석: '#ffd700' };
                      const price = ORES[ore]?.price ?? 100;
                      const qtyKey = `ore_${ore}`;
                      const qty = Math.min(count, Math.max(1, parseInt(sellQty[qtyKey] ?? count) || count));
                      const total = price * qty;
                      return (
                        <div key={ore} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: oreColors[ore] ?? '#fff', fontWeight: 700 }}>⛏ {ore} ×{count}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>{price}G/개</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min={1} max={count} value={sellQty[qtyKey] ?? count}
                              onChange={e => setSellQty(prev => ({ ...prev, [qtyKey]: e.target.value }))}
                              style={{ width: 60, padding: '3px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                            <span style={{ color: '#ffcc44', fontSize: 12, flex: 1 }}>{total.toLocaleString()}G</span>
                            <button tabIndex={-1} className="btn-eq" style={{ fontSize: 11 }} onClick={() => setSellQty(prev => ({ ...prev, [qtyKey]: count }))}>전체</button>
                            <button tabIndex={-1} className="btn-buy" onClick={() => {
                              setGs(prev => ({ ...prev, money: prev.money + total, oreInventory: { ...prev.oreInventory, [ore]: count - qty } }));
                              addMsg(`💰 ${ore} ${qty}개 → ${total}G!`, 'catch');
                              advanceQuest('sell', total);
                              setSellQty(prev => ({ ...prev, [qtyKey]: '' }));
                            }}>판매</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>

            {/* ── Sell herbs ── */}
            <div className="section">
              <div className="section-title">허브 판매</div>
              {Object.keys(gs.herbInventory ?? {}).filter(k => (gs.herbInventory[k] ?? 0) > 0).length === 0
                ? <div className="empty">판매할 허브 없음</div>
                : <div>
                    {Object.entries(gs.herbInventory ?? {}).filter(([, n]) => n > 0).map(([herb, count]) => {
                      const price = HERBS[herb]?.price ?? 0;
                      const qtyKey = `herb_${herb}`;
                      const qty = Math.min(count, Math.max(1, parseInt(sellQty[qtyKey] ?? count) || count));
                      const total = price * qty;
                      return (
                        <div key={herb} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: HERBS[herb]?.color ?? '#8c4', fontWeight: 700 }}>🌿 {herb} ×{count}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>{price}G/개</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min={1} max={count} value={sellQty[qtyKey] ?? count}
                              onChange={e => setSellQty(prev => ({ ...prev, [qtyKey]: e.target.value }))}
                              style={{ width: 60, padding: '3px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                            <span style={{ color: '#ffcc44', fontSize: 12, flex: 1 }}>{total.toLocaleString()}G</span>
                            <button tabIndex={-1} className="btn-eq" style={{ fontSize: 11 }} onClick={() => setSellQty(prev => ({ ...prev, [qtyKey]: count }))}>전체</button>
                            <button tabIndex={-1} className="btn-buy" onClick={() => {
                              setGs(prev => ({ ...prev, money: prev.money + total, herbInventory: { ...(prev.herbInventory ?? {}), [herb]: count - qty } }));
                              addMsg(`💰 ${herb} ${qty}개 → ${total}G!`, 'catch');
                              advanceQuest('sell', total);
                              setSellQty(prev => ({ ...prev, [qtyKey]: '' }));
                            }}>판매</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>

            {/* ── Sell fish ── */}
            <div className="section">
              <div className="section-title">물고기 판매</div>
              {gs.fishInventory.length === 0
                ? <div className="empty">판매할 물고기 없음</div>
                : <>
                    <button tabIndex={-1} className="sell-all-btn" onClick={() => { sellAll(); }}>
                      전체 판매 ({totalFishVal}G)
                    </button>
                    {/* Group by species */}
                    {Object.entries(
                      gs.fishInventory.reduce((acc, f) => {
                        if (!acc[f.name]) acc[f.name] = { items: [], totalPrice: 0 };
                        acc[f.name].items.push(f);
                        acc[f.name].totalPrice += f.price;
                        return acc;
                      }, {})
                    ).map(([species, { items, totalPrice }]) => {
                      const fd = FISH[species];
                      const rarityColors = { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' };
                      const qtyKey = `fish_${species}`;
                      const count = items.length;
                      const qty = Math.min(count, Math.max(1, parseInt(sellQty[qtyKey] ?? count) || count));
                      const unitPrice = Math.round(totalPrice / count);
                      const sellTotal = items.slice(0, qty).reduce((s, f) => s + f.price, 0);
                      return (
                        <div key={species} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: rarityColors[fd?.rarity] ?? '#fff', fontWeight: 700 }}>🐟 {species} ×{count}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>~{unitPrice}G/개</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min={1} max={count} value={sellQty[qtyKey] ?? count}
                              onChange={e => setSellQty(prev => ({ ...prev, [qtyKey]: e.target.value }))}
                              style={{ width: 60, padding: '3px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }} />
                            <span style={{ color: '#ffcc44', fontSize: 12, flex: 1 }}>{sellTotal.toLocaleString()}G</span>
                            <button tabIndex={-1} className="btn-eq" style={{ fontSize: 11 }} onClick={() => setSellQty(prev => ({ ...prev, [qtyKey]: count }))}>전체</button>
                            <button tabIndex={-1} className="btn-buy" onClick={() => {
                              const toSell = items.slice(0, qty);
                              const ids = new Set(toSell.map(f => f.id));
                              const earned = toSell.reduce((s, f) => s + f.price, 0);
                              setGs(prev => ({ ...prev, money: prev.money + earned, fishInventory: prev.fishInventory.filter(f => !ids.has(f.id)) }));
                              addMsg(`💰 ${species} ${qty}마리 → ${earned}G!`, 'catch');
                              advanceQuest('sell', earned);
                              playSellSound(earned);
                              setSellQty(prev => ({ ...prev, [qtyKey]: '' }));
                            }}>판매</button>
                          </div>
                        </div>
                      );
                    })}
                  </>
              }
            </div>

            {/* ── Buy seeds ── */}
            <div className="section">
              <div className="section-title">🌱 씨앗 구매</div>
              {Object.entries(SEEDS).map(([key, sd]) => {
                const discount = getShopDiscount(gs.npcAffinity);
                const discPrice = Math.round(sd.price * (1 - discount));
                const canBuy = gs.money >= discPrice;
                return (
                  <div key={key} className="rod-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 16 }}>🌱</span>
                      <span style={{ fontWeight: 700, color: '#88ff88' }}>{sd.name}</span>
                      <span style={{ fontSize: 11, color: '#ffcc44', marginLeft: 'auto' }}>{discPrice}G</span>
                    </div>
                    <div className="rod-meta">
                      {sd.yield.item} {sd.yield.qty[0]}~{sd.yield.qty[1]}개 수확 · 성장 {Math.round(sd.growMs / 60000)}분
                    </div>
                    <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                      style={{ marginTop: 4, fontSize: 11 }}
                      onClick={() => {
                        if (!canBuy) return;
                        // Find an empty plot and plant directly
                        const plots = stateRef.current?.farmPlots ?? [];
                        const emptyIdx = Array.from({ length: MAX_FARM_PLOTS }, (_, i) => i).find(i => !plots.some(p => p.id === i && !p.harvested));
                        if (emptyIdx === undefined) {
                          addMsg('🌱 빈 농장 자리가 없습니다!', 'error'); return;
                        }
                        const now = Date.now();
                        const newPlot = { id: emptyIdx, seed: key, plantedAt: now, harvestAt: now + sd.growMs, watered: false, harvested: false };
                        setGs(prev => ({ ...prev, money: prev.money - discPrice, farmPlots: [...(prev.farmPlots ?? []).filter(p => p.id !== emptyIdx || p.harvested), newPlot] }));
                        addMsg(`🌱 ${sd.name} 구매 & 심기 완료! (-${discPrice}G)`, 'catch');
                        gainNpcAffinity('상인', 1);
                      }}>
                      {canBuy ? `${discPrice}G 구매 & 심기` : '💰 골드 부족'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── Pet food ── */}
            <div className="section">
              <div className="section-title">🍖 펫 간식</div>
              {!gs.activePet ? (
                <div className="empty">활성 펫이 없습니다. 펫을 장착하세요.</div>
              ) : (() => {
                const petKey = gs.activePet;
                const pet = PETS[petKey];
                const level = (gs.petLevels ?? {})[petKey] ?? 1;
                const exp = (gs.petExp ?? {})[petKey] ?? 0;
                if (level >= PET_MAX_LEVEL) {
                  return <div className="empty">{pet?.icon} {pet?.name}은 이미 최대 레벨입니다!</div>;
                }
                const foodItems = [
                  { name: '작은 간식', price: 300, exp: 5, desc: 'EXP +5' },
                  { name: '특별 간식', price: 800, exp: 15, desc: 'EXP +15' },
                  { name: '전설 간식', price: 2500, exp: 50, desc: 'EXP +50' },
                ];
                return foodItems.map(food => {
                  const canBuy = gs.money >= food.price;
                  return (
                    <div key={food.name} className="rod-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>🍖</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700 }}>{food.name}</span>
                          <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>{food.desc}</span>
                        </div>
                        <span style={{ color: '#ffcc44', fontSize: 12 }}>{food.price}G</span>
                      </div>
                      <button tabIndex={-1} className={canBuy ? 'btn-buy' : 'btn-dis'} disabled={!canBuy}
                        style={{ marginTop: 4, fontSize: 11, width: '100%' }}
                        onClick={() => {
                          if (!canBuy) return;
                          const newExp = exp + food.exp;
                          let newLevel = level;
                          for (let lv = level; lv < PET_MAX_LEVEL; lv++) {
                            if (newExp >= PET_EXP_THRESHOLDS[lv - 1]) newLevel = lv + 1;
                            else break;
                          }
                          setGs(prev => ({
                            ...prev,
                            money: prev.money - food.price,
                            petExp: { ...prev.petExp, [petKey]: newExp },
                            petLevels: { ...prev.petLevels, [petKey]: newLevel },
                          }));
                          addMsg(`${pet?.icon} ${pet?.name}에게 ${food.name}! EXP +${food.exp} (${newExp}/${PET_EXP_THRESHOLDS[newLevel - 1] ?? '최대'})`, 'catch');
                          if (newLevel > level) addMsg(`🎉 ${pet?.name} Lv.${level} → Lv.${newLevel}! 보너스 강화!`, 'legend');
                        }}>
                        {canBuy ? `${food.price}G 구매` : '💰 골드 부족'}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            {/* ── Sell crops ── */}
            <div className="section">
              <div className="section-title">🌾 작물 판매</div>
              {Object.entries(gs.cropInventory ?? {}).filter(([, n]) => n > 0).length === 0
                ? <div className="empty">판매할 작물 없음 (농장에서 수확)</div>
                : <div>
                    {Object.entries(gs.cropInventory ?? {}).filter(([, n]) => n > 0).map(([itemName, count]) => {
                      const sp = (() => {
                        for (const sd of Object.values(SEEDS)) {
                          if (sd.yield.item === itemName) return sd.yield.sellPrice;
                        }
                        return 0;
                      })();
                      const total = sp * count;
                      return (
                        <div key={itemName} className="rod-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: '#88ff88', fontWeight: 700 }}>🌾 {itemName} ×{count}</span>
                            <span style={{ color: '#ffcc44', fontSize: 12 }}>{sp}G/개</span>
                          </div>
                          <button tabIndex={-1} className="btn-buy" onClick={() => {
                            setGs(prev => {
                              const newCrop = { ...(prev.cropInventory ?? {}), [itemName]: 0 };
                              return { ...prev, money: prev.money + total, cropInventory: newCrop };
                            });
                            addMsg(`💰 ${itemName} ${count}개 → ${total}G!`, 'catch');
                            advanceQuest('sell', total);
                          }}>전체 판매 ({total}G)</button>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* Appearance modal */}
      {showAppearance && appearanceDraft && (
        <div className="overlay" onClick={() => setShowAppearance(false)}>
          <div className="panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 320 }}>
            <div className="panel-head">
              <span>✂ 외모 변경 (200G)</span>
              <button tabIndex={-1} onClick={() => setShowAppearance(false)}>✕</button>
            </div>
            <div className="section">
              <div className="section-title">피부색</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['#f6cc88', '#e8a878', '#c68642', '#8d5524', '#ffdab9', '#ffe0bd'].map(c => (
                  <div key={c} onClick={() => setAppearanceDraft(d => ({ ...d, skinColor: c }))}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: `3px solid ${appearanceDraft.skinColor === c ? '#fff' : 'transparent'}` }} />
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-title">머리색</div>
              <input type="color" value={appearanceDraft.hairColor}
                onChange={e => setAppearanceDraft(d => ({ ...d, hairColor: e.target.value }))}
                style={{ width: 48, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
            </div>
            <div className="section">
              <div className="section-title">옷 색상</div>
              <input type="color" value={appearanceDraft.bodyColor}
                onChange={e => setAppearanceDraft(d => ({ ...d, bodyColor: e.target.value }))}
                style={{ width: 48, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <button className={gs.money >= 200 ? 'btn-buy' : 'btn-dis'} style={{ width: '100%' }}
                disabled={gs.money < 200}
                onClick={() => {
                  if (gs.money < 200) { addMsg('💰 200G 필요', 'error'); return; }
                  setGs(prev => ({
                    ...prev,
                    money: prev.money - 200,
                    hairColor: appearanceDraft.hairColor,
                    bodyColor: appearanceDraft.bodyColor,
                    skinColor: appearanceDraft.skinColor,
                  }));
                  if (gameRef.current?.player) {
                    gameRef.current.player.hairColor = appearanceDraft.hairColor;
                    gameRef.current.player.bodyColor = appearanceDraft.bodyColor;
                    gameRef.current.player.skinColor = appearanceDraft.skinColor;
                  }
                  addMsg('✂ 외모가 변경됐습니다! (-200G)', 'catch');
                  gainNpcAffinity('여관주인', 1);
                  setShowAppearance(false);
                }}>
                {gs.money >= 200 ? '200G 변경 완료' : '💰 골드 부족'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank modal */}
      {showBank && (
        <div className="overlay" onClick={() => setShowBank(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>🏦 은행</span>
              <button tabIndex={-1} onClick={() => setShowBank(false)}>✕</button>
            </div>
            <div className="section">
              <div className="section-title">예금 현황</div>
              <div className="rod-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#ffcc44' }}>💰 지갑</span>
                  <span style={{ color: '#ffcc44' }}>{gs.money.toLocaleString()}G</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#44ccff' }}>🏦 예금</span>
                  <span style={{ color: '#44ccff' }}>{(gs.bankDeposit ?? 0).toLocaleString()}G</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  이자율: 2%/시간 (최대 24시간 소급 적용)
                  {gs.bankLastInterest && (
                    <span style={{ marginLeft: 8 }}>
                      · 다음 이자: {Math.max(0, 60 - Math.floor((Date.now() - gs.bankLastInterest) / 60000))}분 후
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="section">
              <div className="section-title">입금 / 출금</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="number" min={1} placeholder="금액 입력"
                  value={bankInput}
                  onChange={e => setBankInput(e.target.value)}
                  style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13 }}
                />
                <button tabIndex={-1} className="btn-buy" onClick={() => {
                  const amt = Math.floor(Number(bankInput));
                  if (!amt || amt <= 0) { addMsg('금액을 입력하세요.', 'error'); return; }
                  if (amt > gs.money) { addMsg('💰 지갑 잔액 부족', 'error'); return; }
                  const nowTs = Date.now();
                  setGs(prev => {
                    const prevStats = prev.achStats ?? {};
                    const updatedStats = { ...prevStats, totalDeposited: (prevStats.totalDeposited ?? 0) + amt };
                    setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
                    return {
                      ...prev,
                      money: prev.money - amt,
                      bankDeposit: (prev.bankDeposit ?? 0) + amt,
                      bankLastInterest: prev.bankLastInterest ?? nowTs,
                      achStats: updatedStats,
                    };
                  });
                  advanceQuest('deposit', amt);
                  addMsg(`🏦 ${amt.toLocaleString()}G 입금 완료!`, 'catch');
                  setBankInput('');
                }}>입금</button>
                <button tabIndex={-1} className="btn-eq" onClick={() => {
                  const amt = Math.floor(Number(bankInput));
                  if (!amt || amt <= 0) { addMsg('금액을 입력하세요.', 'error'); return; }
                  if (amt > (gs.bankDeposit ?? 0)) { addMsg('🏦 예금 잔액 부족', 'error'); return; }
                  setGs(prev => ({
                    ...prev,
                    money: prev.money + amt,
                    bankDeposit: (prev.bankDeposit ?? 0) - amt,
                  }));
                  addMsg(`🏦 ${amt.toLocaleString()}G 출금 완료!`, 'catch');
                  setBankInput('');
                }}>출금</button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button tabIndex={-1} className="btn-dis" style={{ fontSize: 11 }}
                  onClick={() => setBankInput(String(gs.money))}>전액 입금</button>
                <button tabIndex={-1} className="btn-dis" style={{ fontSize: 11 }}
                  onClick={() => setBankInput(String(gs.bankDeposit ?? 0))}>전액 출금</button>
              </div>
            </div>
            {(gs.bankDeposit ?? 0) > 0 && (
              <div className="section">
                <div className="section-title">이자 계산</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  1시간 후 예상 이자: +{Math.floor((gs.bankDeposit ?? 0) * 0.02)}G<br />
                  24시간 후 누적 이자: +{Math.floor((gs.bankDeposit ?? 0) * 0.02 * 24)}G
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
