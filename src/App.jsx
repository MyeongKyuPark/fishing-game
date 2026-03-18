import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import GameCanvas from './GameCanvas';
import { playFishCatch, playFishingStart, playOreMined, playCookComplete, playSellSound, playEnterRoom, playNpcInteract, playLevelUp } from './soundManager';
import IndoorCanvas from './IndoorCanvas';
import Chat from './Chat';
import Joystick from './Joystick';
import Leaderboard from './Leaderboard';
import RankSidebar from './RankSidebar';
import ChannelLobby from './ChannelLobby';
import { saveFishRecord, savePlayerTitle, broadcastAnnouncement, subscribeAnnouncements, incrementServerStat, subscribeServerStats } from './ranking';
import { updatePlayerPresence, removePlayerPresence, subscribeOtherPlayers } from './multiplay';
import { FISH, RODS, ORES, BOOTS, BAIT, COOKWARE, HERBS, MARINE_GEAR, weightedPick, randInt, TILE_SIZE,
  getAbilityFishTable, rodEnhanceCost, rodEnhanceMatsNeeded, rodEnhanceSuccessRate, rodEnhanceEffect } from './gameData';
import { DEFAULT_ABILITIES, ABILITY_DEFS, gainAbility, doGradeUp, gradeRareBonus,
  FISH_ABILITY_GAIN, ORE_ABILITY_GAIN, COOK_ABILITY_GAIN,
  SELL_ABILITY_PER_100G, STAMINA_GAIN, ENHANCE_ABILITY_GAIN } from './abilityData';
import { getTitle, TITLES } from './titleData';
import { getWeather, msUntilNextWeather } from './weatherData';
import { nearestChair, nearShop, nearCooking, isInMineZone, isInForestZone, isOnWater, CHAIR_RANGE, pickOre, pickHerb } from './mapData';

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
  { id: 'fish10', label: '생선 10마리 잡기', goal: 10, type: 'fish', reward: 200 },
  { id: 'fish25', label: '생선 25마리 잡기', goal: 25, type: 'fish', reward: 500 },
  { id: 'ore5', label: '광석 5개 채굴', goal: 5, type: 'ore', reward: 300 },
  { id: 'ore15', label: '광석 15개 채굴', goal: 15, type: 'ore', reward: 700 },
  { id: 'cook5', label: '생선 5마리 요리', goal: 5, type: 'cook', reward: 250 },
  { id: 'sell500', label: '500G 이상 판매', goal: 500, type: 'sell', reward: 400 },
  { id: 'sell2000', label: '2000G 이상 판매', goal: 2000, type: 'sell', reward: 1000 },
];

function getDailyQuests() {
  const dateStr = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  const picked = [];
  const pool = [...QUEST_POOL];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
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
  questDate: '',
  herbInventory: {},
  lastSaveTime: Date.now(),
  hairColor: '#5a3010',
  bodyColor: '#5a7aaa',
  skinColor: '#f6cc88',
  gender: 'male',
  caughtSpecies: [],
  firstLoginDate: null,
  marineGear: null,
  ownedMarineGear: [],
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
      questDate: s.questDate ?? '',
      herbInventory: s.herbInventory ?? {},
      lastSaveTime: s.lastSaveTime ?? Date.now(),
      hairColor: s.hairColor ?? '#5a3010',
      bodyColor: s.bodyColor ?? '#5a7aaa',
      skinColor: s.skinColor ?? '#f6cc88',
      gender: s.gender ?? 'male',
      caughtSpecies: s.caughtSpecies ?? [],
      firstLoginDate: s.firstLoginDate ?? null,
      marineGear: s.marineGear ?? null,
      ownedMarineGear: s.ownedMarineGear ?? [],
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
            addMsg(`👤 ${p.nickname}님이 입장했습니다.`, 'system');
        }
        for (const p of prev) {
          if (!currNicks.has(p.nickname))
            addMsg(`👤 ${p.nickname}님이 퇴장했습니다.`, 'system');
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
        addMsg(`📣 [이벤트] ${rarityLabel} ${fish} 출몰! 30분간 출현 확률 상승!`, 'catch');
        const clearTimer = setTimeout(() => {
          setFishSurgeEvent(null);
          addMsg(`📣 [이벤트] ${fish} 출몰 이벤트가 종료되었습니다.`, 'system');
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

  // Sync speed bonus to game loop
  useEffect(() => {
    if (!gameRef.current) return;
    const bootsBonus = BOOTS[gs.boots]?.speedBonus ?? 0;
    gameRef.current.speedBonus = bootsBonus;
  }, [gs.boots]);

  // Sync marine gear to game loop
  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.marineGear = gs.marineGear ?? null;
  }, [gs.marineGear]);

  // Weather: deterministic per room+time, update when period changes
  const [weather, setWeather] = useState(() => getWeather(null, Date.now()));
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { if (gameRef.current) gameRef.current.weather = weather; }, [weather]);
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
    const questProgress = saved.questDate === today ? (saved.questProgress ?? {}) : {};
    const base = { ...saved, dailyQuests: quests, questProgress, questDate: today };
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
        addMsg(`🎁 오늘의 출석 보너스 +${bonus}G! (${streak}일 연속 접속)`, 'catch');
        if (streak >= 14) addMsg(`🏆 14일 연속 접속! +1000G 추가 보너스!`, 'catch');
        else if (streak >= 7) addMsg(`🌟 7일 연속 접속! +500G + 전설 미끼 1개 지급!`, 'catch');
        else if (streak >= 3) addMsg(`⭐ 3일 연속 접속! +200G 추가 보너스!`, 'catch');
      }, 1200);
    } else {
      setGs(base);
      if (streak > 1) {
        setTimeout(() => addMsg(`🔥 ${streak}일 연속 접속 중!`, 'system'), 1200);
      }
    }
    if (offlineReward > 0 && awayMins >= 5) {
      setGs(prev => ({ ...prev, money: prev.money + offlineReward }));
      setTimeout(() => addMsg(`💤 자리 비운 ${awayMins}분 동안 +${offlineReward}G 획득! (최대 2시간)`, 'catch'), 1800);
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
    const result = gainAbility(current, amount * newPlayerMult, partyBonus);
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
      let moneyBonus = 0;
      const messages = [];
      for (const q of quests) {
        if (q.type !== type) continue;
        const prev_val = progress[q.id] ?? 0;
        if (prev_val >= q.goal) continue;
        const next_val = Math.min(q.goal, prev_val + amount);
        progress[q.id] = next_val;
        if (next_val >= q.goal && prev_val < q.goal) {
          moneyBonus += q.reward;
          messages.push(`🎉 퀘스트 완료: ${q.label} → +${q.reward}G!`);
        }
      }
      if (messages.length > 0) {
        setTimeout(() => {
          messages.forEach(m => addMsg(m, 'catch'));
          if (gameRef.current) gameRef.current.questCompleteEffect = { age: 0 };
        }, 0);
      }
      return { ...prev, questProgress: progress, money: prev.money + moneyBonus };
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

    // Ability-gated fish table
    let table = getAbilityFishTable(fishAbil);

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

    // Bait boost
    const baitKey = s?.equippedBait;
    const baitData = baitKey ? BAIT[baitKey] : null;
    if (baitData) table = applyBoosts(table, baitData.boost);

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

    const seaBonus = gameRef.current?.player?.seaFishing ? 1.5 : 1.0;
    const finalPrice = Math.round(price * seaBonus);
    const seaMsg = seaBonus > 1 ? ' 🌊 바다낚시 보너스!' : '';

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
    setGs(prev => ({ ...prev, fishInventory: [...prev.fishInventory, { name, size, price: finalPrice, id }], fishCaught: (prev.fishCaught ?? 0) + 1 }));
    addMsg(`🐟 ${name} ${size}cm 낚음! (${finalPrice}G)${seaMsg}`, 'catch');
    playFishCatch(fd.rarity);
    if (nicknameRef.current) saveFishRecord(nicknameRef.current, name, size);
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

  }, [addMsg, grantAbility, advanceQuest]);

  const onOreMined = useCallback((oreName) => {
    setGs(prev => ({
      ...prev,
      oreInventory: { ...prev.oreInventory, [oreName]: (prev.oreInventory[oreName] || 0) + 1 },
    }));
    addMsg(`⛏ ${oreName} 1개 채굴!`, 'mine');
    playOreMined();
    if (gameRef.current?.player)
      gameRef.current.player.floatText = { text: `+${oreName}`, age: 0, color: ORES[oreName]?.color ?? '#fa4' };
    // 3% windfall: extra 5–10 ores
    const windfall = Math.random() < 0.03;
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
  }, [addMsg, grantAbility, advanceQuest]);

  const onHerbGathered = useCallback((herbName) => {
    setGs(prev => ({
      ...prev,
      herbInventory: { ...(prev.herbInventory ?? {}), [herbName]: ((prev.herbInventory ?? {})[herbName] || 0) + 1 },
    }));
    addMsg(`🌿 ${herbName} 1개 채집!`, 'catch');
    if (gameRef.current?.player)
      gameRef.current.player.floatText = { text: `+${herbName}`, age: 0, color: HERBS[herbName]?.color ?? '#8c4' };
    grantAbility('체력', 0.1);
  }, [addMsg, grantAbility]);

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
       '!상점  – 상점 열기 (상점 건물 근처)',
       '!판매  – 물고기 전체 판매 (상점 근처)',
       '!인벤  – 인벤토리 열기/닫기',
       '!랭킹  – 랭킹 보기',
       '!스탯  – 캐릭터 스탯 보기',
       '!퀘스트 – 오늘의 퀘스트 확인',
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
      if (!nearCooking(player.x, player.y)) {
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
      return;
    }

    if (cmd === '!그만') {
      if (player.state === 'idle') { addMsg('활동 중이 아닙니다.'); return; }
      player.state = 'idle';
      player.activityStart = null;
      player.activityProgress = 0;
      player.seaFishing = false;
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
        const stamAbil = s.abilities?.체력?.value ?? 0;
        const enhLevel = s.rodEnhance?.[s.rod] ?? 0;
        const enhEffect = rodEnhanceEffect(enhLevel);
        const timeMult = Math.max(0.3,
          (1 - fishAbil * 0.004) * (1 - stamAbil * 0.003) * (1 - enhEffect.timeReduction)
        );
        const [mn, mx] = RODS[s.rod].catchTimeRange.map(t => Math.max(1000, Math.round(t * timeMult)));
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
      player.x = nearest.cx;
      player.y = nearest.cy - TILE_SIZE / 2;
      player.vx = 0; player.vy = 0;
      player.facing = 'down';
      player.state = 'fishing';
      player.currentRod = s.rod;
      player.seaFishing = nearest.seaFishing ?? false;
      const fishAbil = s.abilities?.낚시?.value ?? 0;
      const stamAbil = s.abilities?.체력?.value ?? 0;
      const enhLevel = s.rodEnhance?.[s.rod] ?? 0;
      const enhEffect = rodEnhanceEffect(enhLevel);
      const timeMult = Math.max(0.3,
        (1 - fishAbil * 0.004) * (1 - stamAbil * 0.003) * (1 - enhEffect.timeReduction)
      );
      const [mn, mx] = RODS[s.rod].catchTimeRange.map(t => Math.max(1000, Math.round(t * timeMult)));
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
      const ore = pickOre();
      player.state = 'mining';
      player.currentOre = ore;
      const mineAbil = s.abilities?.채굴?.value ?? 0;
      const mineStamAbil = s.abilities?.체력?.value ?? 0;
      const mineMult = Math.max(0.3, (1 - mineAbil * 0.004) * (1 - mineStamAbil * 0.003));
      const [mn, mx] = ORES[ore].mineRange.map(t => Math.max(1000, Math.round(t * mineMult)));
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
      const herb = pickHerb();
      player.state = 'gathering';
      player.currentHerb = herb;
      const gatherAbil = s.abilities?.체력?.value ?? 0;
      const gatherMult = Math.max(0.4, 1 - gatherAbil * 0.003);
      const [mn, mx2] = HERBS[herb].gatherRange.map(t2 => Math.max(1000, Math.round(t2 * gatherMult)));
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

    addMsg(`알 수 없는 명령어. !도움말 확인`, 'error');
  }, [addMsg, advanceQuest, grantAbility]);

  // ── Shop actions ─────────────────────────────────────────────────────────

  const buyRod = (rodKey) => {
    const rod = RODS[rodKey];
    if (gs.ownedRods.includes(rodKey)) { addMsg('이미 보유 중'); return; }
    const needMoney = rod.price > 0;
    const canAfford = !needMoney || gs.money >= rod.price;
    const hasMats = rod.upgradeMats
      ? Object.entries(rod.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
      : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${rod.price}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (rod.upgradeMats) for (const [ore, n] of Object.entries(rod.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: needMoney ? prev.money - rod.price : prev.money, oreInventory: ores, ownedRods: [...prev.ownedRods, rodKey], rod: rodKey };
    });
    if (gameRef.current?.player) gameRef.current.player.currentRod = rodKey;
    addMsg(`🎣 ${rod.name} ${needMoney ? '구매' : '획득'}!`, 'catch');
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
    const canAfford = gs.money >= boot.price;
    const hasMats = boot.upgradeMats
      ? Object.entries(boot.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
      : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${boot.price}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (boot.upgradeMats) for (const [ore, n] of Object.entries(boot.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: prev.money - boot.price, oreInventory: ores, ownedBoots: [...(prev.ownedBoots ?? ['기본신발']), key], boots: key };
    });
    addMsg(`👟 ${boot.name} 구매!`, 'catch');
  };

  const equipBoots = (key) => {
    setGs(prev => ({ ...prev, boots: key }));
    addMsg(`👟 ${BOOTS[key].name} 장착`);
  };

  const buyBait = (key) => {
    const bait = BAIT[key];
    if (bait.type === 'permanent' && (gs.ownedBait ?? []).includes(key)) { addMsg('이미 보유 중'); return; }
    if (gs.money < bait.price) { addMsg(`💰 골드 부족 (${bait.price}G 필요)`, 'error'); return; }
    if (bait.type === 'permanent') {
      setGs(prev => ({ ...prev, money: prev.money - bait.price, ownedBait: [...(prev.ownedBait ?? []), key], equippedBait: key }));
      addMsg(`🪝 ${bait.name} 구매 및 장착!`, 'catch');
    } else {
      setGs(prev => ({ ...prev, money: prev.money - bait.price, baitInventory: { ...(prev.baitInventory ?? {}), [key]: ((prev.baitInventory ?? {})[key] ?? 0) + 1 } }));
      addMsg(`🪝 ${bait.name} 구매!`, 'catch');
    }
  };

  const equipBait = (key) => {
    setGs(prev => ({ ...prev, equippedBait: prev.equippedBait === key ? null : key }));
    addMsg(`🪝 ${BAIT[key]?.name} ${gs.equippedBait === key ? '해제' : '장착'}`);
  };

  const buyMarineGear = (key) => {
    const gear = MARINE_GEAR[key];
    if ((gs.ownedMarineGear ?? []).includes(key)) { addMsg('이미 보유 중'); return; }
    const canAfford = gs.money >= gear.price;
    const hasMats = gear.upgradeMats
      ? Object.entries(gear.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n)
      : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${gear.price}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (gear.upgradeMats) for (const [ore, n] of Object.entries(gear.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: prev.money - gear.price, oreInventory: ores,
        ownedMarineGear: [...(prev.ownedMarineGear ?? []), key], marineGear: key };
    });
    addMsg(`🌊 ${gear.name} 구매 및 장착!`, 'catch');
  };

  const equipMarineGear = (key) => {
    setGs(prev => ({ ...prev, marineGear: prev.marineGear === key ? null : key }));
    addMsg(`🌊 ${MARINE_GEAR[key]?.name} ${gs.marineGear === key ? '해제' : '장착'}`);
  };

  const buyCookware = (key) => {
    const cw = COOKWARE[key];
    if ((gs.ownedCookware ?? []).includes(key)) { addMsg('이미 보유 중'); return; }
    const canAfford = gs.money >= cw.price;
    const hasMats = cw.upgradeMats ? Object.entries(cw.upgradeMats).every(([ore, n]) => (gs.oreInventory[ore] || 0) >= n) : true;
    if (!canAfford) { addMsg(`💰 골드 부족 (${cw.price}G 필요)`, 'error'); return; }
    if (!hasMats) { addMsg('재료 부족', 'error'); return; }
    setGs(prev => {
      const ores = { ...prev.oreInventory };
      if (cw.upgradeMats) for (const [ore, n] of Object.entries(cw.upgradeMats)) ores[ore] -= n;
      return { ...prev, money: prev.money - cw.price, oreInventory: ores, ownedCookware: [...(prev.ownedCookware ?? []), key], cookware: key };
    });
    addMsg(`🍳 ${cw.name} 구매!`, 'catch');
  };

  const equipCookware = (key) => {
    setGs(prev => ({ ...prev, cookware: key }));
    addMsg(`🍳 ${COOKWARE[key].name} 장착`);
  };

  const sellAll = () => {
    const total = gs.fishInventory.reduce((s, f) => s + f.price, 0);
    setGs(prev => ({ ...prev, money: prev.money + total, fishInventory: [] }));
    addMsg(`💰 전체 판매 +${total}G`, 'catch');
    playSellSound(total);
    grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
    advanceQuest('sell', total);
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
    } else if (npcName === '미나') {
      addMsg('🏨 미나: "편히 쉬고 가세요! 내일 퀘스트도 화이팅~"', 'info');
      addMsg('💤 여관에서 휴식했습니다. 체력 어빌리티 +0.5!', 'catch');
      grantAbility('체력', 0.5);
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
    }
  }, [addMsg, grantAbility, advanceQuest, stateRef]);

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
  const handleExitRoom = () => setIndoorRoom(null);

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
        {serverAnnouncements.length > 0 && (
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
              {['장비', '어빌리티'].map(tab => (
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
                            if (success) { addMsg(`🔨 ${rod.name} +${enhLv + 1} 강화 성공!`, 'catch'); grantAbility('강화', ENHANCE_ABILITY_GAIN); }
                            else addMsg(`🔨 강화 실패... (${rod.name} +${enhLv} 유지)`, 'error');
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
                const pct = Math.round((cur / q.goal) * 100);
                return (
                  <div key={q.id} className="quest-card" style={{ opacity: done ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: done ? '#88ff88' : '#ffe0a0' }}>{done ? '✅ ' : ''}{q.label}</span>
                      <span style={{ color: '#ffcc44', fontSize: 12 }}>+{q.reward}G</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 3 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: done ? '#44ff88' : '#4488ff', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{cur} / {q.goal} {done ? '완료!' : ''}</div>
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
                {Object.entries(FISH).map(([fishName, fd]) => {
                  const caught = (gs.caughtSpecies ?? []).includes(fishName);
                  return (
                    <div key={fishName} style={{
                      background: caught ? 'rgba(68,255,170,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${caught ? 'rgba(68,255,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 6, padding: '6px 10px',
                      opacity: caught ? 1 : 0.5,
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: caught ? '#44ffaa' : '#888' }}>
                        {caught ? '✓ ' : '? '}{fishName}
                      </div>
                      {caught && <div style={{ fontSize: 10, color: '#888' }}>{fd.rarity} · {fd.price}G~</div>}
                    </div>
                  );
                })}
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
            <div className="shop-money">보유: {gs.money.toLocaleString()}G</div>

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

            {/* ── Sell ore ── */}
            <div className="section">
              <div className="section-title">광석 판매</div>
              {Object.entries(gs.oreInventory ?? {}).every(([, n]) => n === 0)
                ? <div className="empty">판매할 광석 없음</div>
                : <div>
                    {Object.entries(gs.oreInventory ?? {}).filter(([, n]) => n > 0).map(([ore, count]) => {
                      const price = { 철광석: 80, 구리광석: 150, 수정: 400 }[ore] ?? 100;
                      return (
                        <div key={ore} className="rod-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: { 철광석: '#cc8844', 구리광석: '#44ccaa', 수정: '#aa66ff' }[ore] ?? '#fff', fontWeight: 700 }}>
                            ⛏ {ore} ×{count}
                          </span>
                          <span style={{ color: '#ffcc44', fontSize: 12 }}>{(price * count).toLocaleString()}G</span>
                          <button tabIndex={-1} className="btn-buy" onClick={() => {
                            const total = price * count;
                            setGs(prev => ({ ...prev, money: prev.money + total, oreInventory: { ...prev.oreInventory, [ore]: 0 } }));
                            addMsg(`💰 ${ore} ${count}개 → ${total}G!`, 'catch');
                            advanceQuest('sell', total);
                          }}>판매</button>
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
                      return (
                        <div key={herb} className="rod-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: HERBS[herb]?.color ?? '#8c4', fontWeight: 700 }}>
                            🌿 {herb} ×{count}
                          </span>
                          <span style={{ color: '#ffcc44', fontSize: 12 }}>{(price * count).toLocaleString()}G</span>
                          <button tabIndex={-1} className="btn-buy" onClick={() => {
                            const total = price * count;
                            setGs(prev => ({ ...prev, money: prev.money + total, herbInventory: { ...(prev.herbInventory ?? {}), [herb]: 0 } }));
                            addMsg(`💰 ${herb} ${count}개 → ${total}G!`, 'catch');
                            advanceQuest('sell', total);
                          }}>판매</button>
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
                : <button tabIndex={-1} className="sell-all-btn" onClick={() => { sellAll(); }}>
                    전체 판매 ({totalFishVal}G)
                  </button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
