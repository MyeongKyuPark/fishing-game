import { useState, useEffect, useRef, useCallback } from 'react';
import LZString from 'lz-string';
import './App.css';
import GameCanvas from './GameCanvas';
import { playFishCatch, playFishingStart, playOreMined, playCookComplete, playSellSound, playEnterRoom, playNpcInteract, playLevelUp } from './soundManager';
import { playBgm, stopBgm, setBgmVolume, getBgmVolume } from './bgm';
import IndoorCanvas from './IndoorCanvas';
import Joystick from './Joystick';
import Leaderboard from './Leaderboard';
import RankSidebar from './RankSidebar';
import ChannelLobby from './ChannelLobby';
import { saveFishRecord, saveOverallFishRecord, broadcastAnnouncement,
  submitTournamentScore, incrementServerQuestProgress,
  saveGoldRecord, saveAbilityRecord, saveAchievementRecord, submitSeasonScore, savePrestigeRecord,
  damageServerBoss, distributeServerBossRewards, claimSeasonReward,
  addFriend, removeFriend } from './ranking';
import { sendPartyInvite, joinParty, leaveParty, sendPartyMessage, clearPartyInvite } from './multiplay';
import { JOBS, getAvailableJobs, JOB_CLASSES } from './jobData';
import { FISH, RODS, ORES, BOOTS, BAIT, COOKWARE, HERBS, MARINE_GEAR, PICKAXES, GATHER_TOOLS,
  SMELT_RECIPES, JEWELRY_RECIPES, POTION_RECIPES, DISH_RECIPES, SEEDS, MAX_FARM_PLOTS,
  FARM_EXPANSION_PRICE, FARM_EXPANSION_SLOTS, FARM_MAX_EXPANSIONS,
  weightedPick, randInt, TILE_SIZE,
  getAbilityFishTable, rodEnhanceCost, rodEnhanceMatsNeeded, rodEnhanceSuccessRate, rodEnhanceEffect,
  pickaxeEnhanceCost, pickaxeEnhanceMatsNeeded, pickaxeEnhanceSuccessRate, pickaxeEnhanceEffect,
  ZONE_FISH, FISHING_ZONES, HATS, FISHING_OUTFITS, TOPS, BOTTOMS, BELTS, ROD_SKINS, SPOT_DECOS, FURNITURE, BAIT_RECIPES, POINT_SHOP_ITEMS,
  COTTAGE_UPGRADE_REQS, COTTAGE_LEVEL_BONUSES,
  ARTISAN_RECIPES, EQUIPMENT_SETS, getActiveSetBonus } from './gameData';
import { DEFAULT_ABILITIES, ABILITY_DEFS, gainAbility, doGradeUp, gradeRareBonus,
  FISH_ABILITY_GAIN, ORE_ABILITY_GAIN, COOK_ABILITY_GAIN,
  SELL_ABILITY_PER_100G, STAMINA_GAIN, ENHANCE_ABILITY_GAIN, getMasteryBonus } from './abilityData';
import { getTitle, getActiveTitleBonus, TITLES } from './titleData';
import { getWeather, msUntilNextWeather } from './weatherData';
import { getTimePeriod, msUntilNextTimePeriod } from './timeData';
import { nearestChair, nearShop, nearCooking, isInMineZone, isInForestZone, isOnWater, CHAIR_RANGE, pickOre, pickHerb, DOOR_TRIGGERS, nearFarm, setActiveZone, ZONE_TILES, ZONE_LABELS, ZONE_BONUSES, getActiveZone, PLAYER_START_X, PLAYER_START_Y, ZONE_UNLOCK_REQ } from './mapData';
import { setActiveTiles } from './canvas/drawMap';
import { ACHIEVEMENTS, checkAchievements } from './achievementData';
import { PETS, EVOLVED_PETS, EVOLVE_REQUIREMENTS, PET_RARITY_COLOR, PET_EXP_THRESHOLDS, PET_MAX_LEVEL, PET_LEVEL_MULT } from './petData';
import { NPCS, getAffinityLevel, getShopDiscount } from './npcData';
import { EXPLORE_ZONES, checkZoneUnlock } from './explorationData';
import MiniMap from './MiniMap';
import { NPC_QUESTS } from './npcQuestData';
import ResistanceMinigame from './ResistanceMinigame';
import MiningMinigame from './MiningMinigame';
import { SEASONS, getCurrentSeason } from './seasonData';
import { createGuild, joinGuild, leaveGuild, subscribeGuild, subscribeGuildMembers, subscribeGuildList, sendGuildChat, subscribeGuildChat, contributeGuildQuest, subscribeGuildQuest, incrementGuildWeeklyScore, subscribeGuildCompetition } from './guildData';
import { listItem, buyItem, cancelListing, subscribeMarket, subscribeMyListings } from './marketData';
// ── New module imports ────────────────────────────────────────────────────────
import { SKIN_PRESETS, QUEST_POOL, MINE_DEPTH_ORE_MULT, MINE_DEPTH_REQ, MINE_DEPTH_TIME,
  getDailyQuests, getWeeklyGoals, DEFAULT_STATE, SAVE_VERSION, saveKey, loadSave, DAILY_BONUS,
  checkDailyBonus, STORY_CHAPTERS, rarityColor, useGameState } from './hooks/useGameState';
import { getZoneDailyChallenge, todayStr } from './zoneChallengeData';
import { useOfflineReward } from './hooks/useOfflineReward';
import { useWebSocket } from './hooks/useWebSocket';
import { useKeyboard } from './hooks/useKeyboard';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ChatBox from './components/ChatBox';
import NpcDialogue from './components/NpcDialogue';
import WorldMap from './components/WorldMap';
import AdminPanel from './AdminPanel';
import AuctionHouse from './AuctionHouse';
import SeasonPass from './SeasonPass';
import TownHall from './components/TownHall';
import PointShop from './components/PointShop';
import TidalMinigame from './components/TidalMinigame';
import IceHoleMinigame from './components/IceHoleMinigame';
import ProfileCard from './components/ProfileCard';
import { TOWN_BUILDINGS, getTownBonuses, subscribeTownProgress, contributeTown } from './townData';

// Tournament rarity bonus: points added on top of fish size per rarity tier
const TOURNAMENT_RARITY_BONUS = { 흔함: 0, 보통: 10, 희귀: 25, 전설: 60, 신화: 150 };

// Zone mastery thresholds (cumulative exp → level 1-5)
const ZONE_MASTERY_THRESHOLDS = [10, 30, 60, 100, 150];

// Phase 12-2: Festival active check
function isFestivalActive(gs) {
  return !!(gs?.festivalEndDate && Date.now() < gs.festivalEndDate);
}
function getZoneMasteryLevel(zoneMastery, zone) {
  const exp = zoneMastery?.[zone] ?? 0;
  let lv = 0;
  for (const t of ZONE_MASTERY_THRESHOLDS) if (exp >= t) lv++;
  return lv;
}

function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [gender, setGender] = useState('male');
  const [hairColor, setHairColor] = useState('#5a3010');
  const [bodyColor, setBodyColor] = useState('#5a7aaa');
  const [skinColor, setSkinColor] = useState('#f6cc88');

  // D-4: Autocomplete from saved nicknames
  const savedNicknames = (() => {
    try {
      return Object.keys(localStorage)
        .filter(k => k.startsWith('fishingGame_v1_'))
        .map(k => k.replace('fishingGame_v1_', ''))
        .filter(n => n.length >= 2 && n.length <= 12);
    } catch { return []; }
  })();

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
            list="saved-nicknames"
          />
          {savedNicknames.length > 0 && (
            <datalist id="saved-nicknames">
              {savedNicknames.map(n => <option key={n} value={n} />)}
            </datalist>
          )}

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

export default function App() {
  const gameRef = useRef({});
  const { gs, setGs, stateRef } = useGameState();
  const weatherRef = useRef(null);
  const fishSurgeRef = useRef(null);
  const serverEventRef = useRef(null);
  const activeWeatherEventRef = useRef(null);
  const tabId = useRef(Date.now() + '-' + Math.random());
  const channelRef = useRef(null);
  const nicknameRef = useRef('');
  const otherPlayersRef = useRef([]);
  const prevOtherPlayersRef = useRef([]);
  const lastPosRef = useRef({});
  const cmdTimestampsRef = useRef([]); // spam prevention
  const seasonResetDoneRef = useRef(false); // prevent multiple resets per session
  const chapter5PlayedRef = useRef(false); // prevent re-trigger on snapshot reconnect
  const addMsgRef = useRef((text, type) => setMessages(prev => [...prev.slice(-120), { text, type }]));
  const [achPopup, setAchPopup] = useState(null);
  const achPopupQueueRef = useRef([]);
  const achPopupActiveRef = useRef(false);
  const [gradeUpCelebration, setGradeUpCelebration] = useState(null);

  // Party system
  const [partyId, setPartyId] = useState(null);
  const partyIdRef = useRef(null);
  const partyMembersRef = useRef([]);
  const [pendingInvite, setPendingInvite] = useState(null); // { partyId, inviter }
  const [partyMessages, setPartyMessages] = useState([]);

  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [roomTitle, setRoomTitle] = useState('');
  useEffect(() => { nicknameRef.current = nickname; }, [nickname]);
  // Weekly goals reset check
  useEffect(() => {
    const { weekKey } = getWeeklyGoals();
    setGs(prev => {
      if (prev.weeklyGoalDate === weekKey) return prev;
      return { ...prev, weeklyGoalDate: weekKey, weeklyGoals: {} };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check previous season reward on login
  useEffect(() => {
    if (!nickname) return;
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevSeason = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    claimSeasonReward(nickname, prevSeason).then(fishCaught => {
      if (fishCaught === null || fishCaught === 0) return;
      const gold = fishCaught >= 500 ? 50000 : fishCaught >= 200 ? 20000 : fishCaught >= 50 ? 8000 : 2000;
      setGs(prev => ({ ...prev, money: (prev.money ?? 0) + gold }));
      addMsgRef.current?.(`🎖 지난 시즌 보상 수령! 낚시 ${fishCaught}마리 → +${gold.toLocaleString()}G`, 'catch');
    });
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps
  const [blocked, setBlocked] = useState(false);
  const [fishSurgeEvent, setFishSurgeEvent] = useState(null);
  const [serverEvent, setServerEvent] = useState(null);
  const [activeWeatherEvent, setActiveWeatherEvent] = useState(null);
  useEffect(() => { activeWeatherEventRef.current = activeWeatherEvent; }, [activeWeatherEvent]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tournamentRanking, setTournamentRanking] = useState([]);
  const [showTournament, setShowTournament] = useState(false);
  const [serverQuest, setServerQuest] = useState({});
  const tournamentScoreRef = useRef(0); // local fish count this week
  const seasonScoreRef = useRef(0); // local fish count this month (season league)
  const [resistanceGame, setResistanceGame] = useState(null); // { active, name, fd, size, finalPrice, rodKey, seaMsg, id }
  const [miningMinigame, setMiningMinigame] = useState(null); // { oreName } — precision mining

  // Server boss
  const [serverBoss, setServerBoss] = useState(null);
  const prevBossHpRef = useRef(null);
  const prevServerQuestRef = useRef(null);
  const [seasonRanking, setSeasonRanking] = useState([]);

  // Marketplace
  const [showMarket, setShowMarket] = useState(false);
  const [marketListings, setMarketListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [marketTab, setMarketTab] = useState('전체'); // 전체 | 내 매물 | 등록
  const [marketListForm, setMarketListForm] = useState({ itemType: 'fish', itemName: '', qty: 1, price: 0 });

  // Guild system
  const [myGuildId, setMyGuildId] = useState(null);
  const myGuildIdRef = useRef(null);
  const [guildInfo, setGuildInfo] = useState(null);
  const [guildMembers, setGuildMembers] = useState([]);
  const [guildList, setGuildList] = useState([]);
  const [guildChat, setGuildChat] = useState([]);
  const [guildQuest, setGuildQuest] = useState({});
  const [showGuild, setShowGuild] = useState(false);
  const [guildChatInput, setGuildChatInput] = useState('');
  const [guildCreateName, setGuildCreateName] = useState('');
  const [guildJoinId, setGuildJoinId] = useState('');
  const [guildTab, setGuildTab] = useState('목록');
  const [guildCompetition, setGuildCompetition] = useState([]);

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
  const [nearActionZone, setNearActionZone] = useState(null);
  const [nearIndoorNpc, setNearIndoorNpc] = useState(null);
  const prevTitleRef = useRef(null);
  const [serverAnnouncements, setServerAnnouncements] = useState([]);
  const [showDex, setShowDex] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCottage, setShowCottage] = useState(false);
  const [showMailbox, setShowMailbox] = useState(false);
  const [showSeasonLeague, setShowSeasonLeague] = useState(false);
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [showAuction, setShowAuction] = useState(false);
  const [showSeasonPass, setShowSeasonPass] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  // Phase 12 state
  const [showTownHall, setShowTownHall] = useState(false);
  const [showPointShop, setShowPointShop] = useState(false);
  // Phase 15 state
  const [tidalGame, setTidalGame] = useState(null); // { name, fd, size, finalPrice, rodKey, seaMsg, id }
  const [iceHoleGame, setIceHoleGame] = useState(null); // { name, fd, size, finalPrice, rodKey, seaMsg, id }
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [mapTransitioning, setMapTransitioning] = useState(false);
  const [townLevels, setTownLevels] = useState({});
  const [returnCast, setReturnCast] = useState(null); // { expiresAt: number } | null
  const returnCastRef = useRef(null);
  const [npcDialog, setNpcDialog] = useState(null); // npcKey string | null
  const [npcQuickMenu, setNpcQuickMenu] = useState(null); // { npcId, x, y, tab } | null
  const [tutorialStep, setTutorialStep] = useState(0); // 0=hidden, 1-4=steps
  const [catchPopup, setCatchPopup] = useState(null); // { name, size, price, rarity }
  const [windfallPopup, setWindfallPopup] = useState(null); // { oreName, count }
  const [goldFloats, setGoldFloats] = useState([]); // [{ id, amount }]
  const prevGoldRef = useRef(null);
  const [seasonFadeColor, setSeasonFadeColor] = useState(null); // css color string
  const prevWeatherIdRef = useRef(null);
  const prevSeasonIdRef = useRef(null);
  const [appearanceDraft, setAppearanceDraft] = useState(null); // { hairColor, bodyColor, skinColor }
  const [bankInput, setBankInput] = useState('');

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboard({ setShowInv, setShowShop, setShowStats, setShowRank, setShowQuest, setShowDex, setShowShortcuts, setShowWorldMap });

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

  // Debounced save of gold & ability rankings (at most once per 60s)
  const rankSaveTimerRef = useRef(null);
  useEffect(() => {
    if (!nickname) return;
    clearTimeout(rankSaveTimerRef.current);
    rankSaveTimerRef.current = setTimeout(() => {
      saveGoldRecord(nickname, gs.money);
      const total = Object.values(gs.abilities ?? {}).reduce((s, a) => s + (a?.value ?? 0), 0);
      saveAbilityRecord(nickname, Math.floor(total));
      saveAchievementRecord(nickname, (gs.achievements ?? []).length);
    }, 60000);
  }, [nickname, gs.money, gs.abilities]);

  // Phase 12-3: Town development Firebase subscription
  useEffect(() => {
    if (!nickname) return;
    let unsub;
    subscribeTownProgress((id, data) => {
      setTownLevels(prev => ({ ...prev, [id]: data.level ?? 0 }));
    }).then(u => { unsub = u; });
    return () => { if (unsub) unsub(); };
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  const townBonuses = getTownBonuses(townLevels);

  // Multiplayer: cleanup on page close
  const roomIdRef = useRef(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  const indoorRoomRef = useRef(null);
  useEffect(() => { indoorRoomRef.current = indoorRoom; }, [indoorRoom]);
  const lastExitTimeRef = useRef(0);

  // Weather: deterministic per room+time, update when period changes
  const [weather, setWeather] = useState(() => getWeather(null, Date.now()));
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { if (gameRef.current) gameRef.current.weather = weather; }, [weather]);

  // Phase 15: Day/Night cycle — updates on real-clock hour boundary
  const [timePeriod, setTimePeriod] = useState(() => getTimePeriod());
  useEffect(() => { if (gameRef.current) gameRef.current.timePeriod = timePeriod; }, [timePeriod]);
  useEffect(() => {
    const schedule = () => {
      const ms = msUntilNextTimePeriod();
      return setTimeout(() => {
        setTimePeriod(getTimePeriod());
        const id = setInterval(() => setTimePeriod(getTimePeriod()), 60 * 60 * 1000);
        return () => clearInterval(id);
      }, ms);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);


  // BGM: switch track on room change (only when in a channel)
  // Outdoor track varies by season and weather
  const getOutdoorTrack = (weatherObj) => {
    const w = weatherObj ?? weatherRef.current;
    if (w?.id === 'rain' || w?.id === 'storm') return 'outdoor_rain';
    const season = getCurrentSeason();
    if (season?.id === '봄꽃축제') return 'outdoor_spring';
    if (season?.id === '여름낚시대회') return 'outdoor_summer';
    if (season?.id === '추수감사절') return 'outdoor_fall';
    if (season?.id === '겨울얼음낚시') return 'outdoor_winter';
    return 'outdoor';
  };

  useEffect(() => {
    if (!roomId) return;
    const track = indoorRoom ?? getOutdoorTrack(weather);
    playBgm(track);
    return () => {};
  }, [indoorRoom, roomId, weather?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Online/offline detection for offline mode
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Stop BGM on unmount / tab hide
  useEffect(() => {
    const onHide = () => stopBgm();
    const onShow = () => playBgm(indoorRoomRef.current ?? getOutdoorTrack()); // eslint-disable-line react-hooks/exhaustive-deps
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) onHide(); else onShow();
    });
    return () => stopBgm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide announcement banner after 5 seconds
  useEffect(() => {
    if (serverAnnouncements.length === 0) return;
    setShowAnnounce(true);
    const t = setTimeout(() => setShowAnnounce(false), 5000);
    return () => clearTimeout(t);
  }, [serverAnnouncements]);

  // Schedule midnight push notification while game is open
  useEffect(() => {
    if (!nickname) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const scheduleNext = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 5, 0); // next midnight + 5s
      const msUntil = midnight - now;
      return setTimeout(() => {
        try {
          new Notification('Tidehaven 🎣 일일 퀘스트 초기화!', {
            body: '새로운 일일 퀘스트가 준비되었습니다. 지금 바로 확인해보세요!',
            icon: '/vite.svg',
          });
        } catch { /* ignore */ }
      }, msUntil);
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, [nickname]);

  // Phase 12-4: Job class unlock notification
  useEffect(() => {
    if (!gs.jobClass && nickname) {
      const total = Object.values(gs.abilities ?? {}).reduce((sum, a) => sum + (a?.value ?? 0), 0);
      if (total >= 200 && !(gs.seenFeatures ?? []).includes('jobClass')) {
        setGs(prev => ({ ...prev, seenFeatures: [...(prev.seenFeatures ?? []), 'jobClass'] }));
        setTimeout(() => addMsgRef.current('🌟 어빌리티 합산 200 달성! 전문 직업을 선택할 수 있습니다. (상태창 → 직업 탭)', 'catch'), 1000);
      }
    }
  }, [gs.abilities, gs.jobClass, nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage keyed by nickname
  useEffect(() => {
    if (!nickname) return;
    const json = JSON.stringify({ ...gs, lastSaveTime: Date.now(), saveVersion: SAVE_VERSION });
    localStorage.setItem(saveKey(nickname), LZString.compressToUTF16(json));
  }, [gs, nickname]);


  const addMsg = useCallback((text, type = 'system') => {
    setMessages(prev => [...prev.slice(-120), { text, type }]);
  }, []);
  useEffect(() => { addMsgRef.current = addMsg; }, [addMsg]);

  useWebSocket({
    nickname, roomId, myGuildId, partyId,
    gameRef, stateRef, addMsgRef, otherPlayersRef, prevOtherPlayersRef, lastPosRef,
    weatherRef, fishSurgeRef, serverEventRef, partyMembersRef, partyIdRef, myGuildIdRef,
    prevBossHpRef, prevServerQuestRef, nicknameRef, roomIdRef,
    setGuildList, setGuildCompetition, setGuildInfo, setGuildMembers, setGuildChat, setGuildQuest,
    setMarketListings, setMyListings, setServerAnnouncements, setServerEvent, setServerQuest,
    setServerBoss, setTournamentRanking, setSeasonRanking, setFishSurgeEvent,
    setPartyMessages, setPendingInvite, setGs, setWeather, setIsOnline, setShowAnnounce,
    setActiveWeatherEvent,
    addMsg, gs, weather,
  });

  const showNextAchPopup = useCallback(() => {
    if (achPopupQueueRef.current.length === 0) { achPopupActiveRef.current = false; return; }
    const next = achPopupQueueRef.current.shift();
    setAchPopup(next);
    setTimeout(() => { setAchPopup(null); setTimeout(showNextAchPopup, 300); }, 2800);
  }, []);
  const enqueueAchPopup = useCallback((ach) => {
    achPopupQueueRef.current.push(ach);
    if (!achPopupActiveRef.current) { achPopupActiveRef.current = true; showNextAchPopup(); }
  }, [showNextAchPopup]);
  const achPopupRef = useRef(enqueueAchPopup);
  useEffect(() => { achPopupRef.current = enqueueAchPopup; }, [enqueueAchPopup]);
  const checkAndGrantAchievementsRef = useRef(null);
  useOfflineReward({ nickname, setGs, addMsgRef, checkAndGrantAchievementsRef });

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

  // Phase 9-6: Chapter 5 server event handler
  useEffect(() => {
    if (!serverEvent || serverEvent.type !== 'chapter5') return;
    if (stateRef.current?.seenChapter5) return;
    if (chapter5PlayedRef.current) return; // guard against onSnapshot reconnect re-trigger
    chapter5PlayedRef.current = true;
    const lines = [
      { text: '🌊 [서버 이벤트] 타이드헤이븐의 모든 주민들이 광장에 모였습니다!', delay: 0 },
      { text: '[민준] 여러분 덕분에 우리 마을이 여기까지 왔습니다. 감사합니다!', delay: 1500 },
      { text: '[수연] 함께 요리하고 함께 낚시하며 쌓아온 시간... 정말 행복했어요.', delay: 3000 },
      { text: '[철수] 광산 깊이 5층까지 개척한 여러분은 진정한 탐험가입니다!', delay: 4500 },
      { text: '[미나] 타이드헤이븐에 와주셔서 감사해요. 이 마을은 여러분의 집입니다.', delay: 6000 },
      { text: '[은행원] 마을의 경제를 지켜주신 모든 분들께 특별 이자 보너스를 드립니다! 🎊', delay: 7500 },
      { text: "✨ '타이드헤이븐의 전설' 칭호를 획득했습니다!", delay: 9000 },
    ];
    lines.forEach(({ text, delay }) => {
      setTimeout(() => addMsgRef.current(text, 'catch'), delay);
    });
    setTimeout(() => {
      setGs(prev => ({ ...prev, seenChapter5: true }));
    }, 9500);
  }, [serverEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  // NPC quick menu: dismiss when player moves
  useEffect(() => {
    if (!npcQuickMenu) return;
    const px = gameRef.current?.player?.x;
    const py = gameRef.current?.player?.y;
    let raf;
    const check = () => {
      const p = gameRef.current?.player;
      if (p && (Math.abs(p.x - px) > 4 || Math.abs(p.y - py) > 4)) {
        setNpcQuickMenu(null);
        return;
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [npcQuickMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  // Season pass monthly reset check
  useEffect(() => {
    if (!nickname) return;
    if (seasonResetDoneRef.current) return; // run once per session to avoid clock-skew re-reset
    seasonResetDoneRef.current = true;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`; // fix: month is 1-12
    if (gs.lastSeasonReset !== currentMonth) {
      setGs(prev => ({
        ...prev,
        seasonPassXP: 0,
        seasonPassTier: 0,
        seasonPassClaimedTiers: [],
        lastSeasonReset: currentMonth,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname]);

  // Prestige crash recovery: if app reloaded mid-prestige, complete the reset
  useEffect(() => {
    if (!nickname) return;
    if (!gs.prestigePending) return;
    setGs(prev => ({
      ...prev,
      prestigePending: false,
      abilities: Object.fromEntries(Object.keys(prev.abilities ?? {}).map(k => [k, { value: 0, grade: 0 }])),
      selectedJob: null,
    }));
    addMsg('이전에 중단된 프레스티지를 완료했습니다.', 'system');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname]);

  // Bank interest: 2%/h base, +0.5%/h at 은행원 lv20, +0.5% more at lv50, capped at 24h
  useEffect(() => {
    if (!nickname) return;
    const deposit = gs.bankDeposit ?? 0;
    if (deposit <= 0) return;
    const now = Date.now();
    const lastInterest = gs.bankLastInterest ?? now;
    const elapsedMs = Math.min(now - lastInterest, 24 * 60 * 60 * 1000); // max 24h
    const hoursElapsed = elapsedMs / (60 * 60 * 1000);
    if (hoursElapsed < 0.01) return; // less than 36 seconds, skip
    const bankAffinity = gs.npcAffinity?.은행원 ?? 0;
    // Base 2.5%/hr + 0.5%/hr at lv20 + 1%/hr at lv50 (anti-inflation cap: max 4%/hr)
    const interestRate = Math.min(0.04, 0.025 + (bankAffinity >= 50 ? 0.01 : bankAffinity >= 20 ? 0.005 : 0));
    const interest = Math.floor(deposit * interestRate * hoursElapsed);
    if (interest <= 0) return;
    setGs(prev => {
      const newMoney = prev.money + interest;
      const prevStats = prev.achStats ?? {};
      const updatedStats = { ...prevStats, maxMoney: Math.max(prevStats.maxMoney ?? 0, newMoney) };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      return { ...prev, money: newMoney, bankLastInterest: now, achStats: updatedStats };
    });
    addMsg(`🏦 은행 이자 +${interest}G (${deposit.toLocaleString()}G × ${(interestRate * 100).toFixed(1)}%/시간 × ${hoursElapsed.toFixed(2)}시간)`, 'catch');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname, gs.bankDeposit]);


  // Grant ability EXP; shows grade-available message if reached 100
  const grantAbility = useCallback((abilName, amount) => {
    const current = stateRef.current?.abilities?.[abilName] ?? { value: 0, grade: 0 };
    const partyBonus = (otherPlayersRef.current?.length ?? 0) > 0;
    const firstLogin = stateRef.current?.firstLoginDate;
    const isNewPlayer = firstLogin && (Date.now() - new Date(firstLogin).getTime()) < 7 * 24 * 60 * 60 * 1000;
    const newPlayerMult = isNewPlayer ? 2 : 1;
    const petAbilMult = gameRef.current?.petBonus?.abilGainMult ?? 1;
    const jobSpeechMult = (abilName === '화술') ? (JOBS[stateRef.current?.selectedJob]?.bonus?.speechGainMult ?? 1) : 1;
    const titleAbilMult = 1 + (getActiveTitleBonus(stateRef.current).abilExpBonus ?? 0);
    const weatherAbilMult = 1 + (activeWeatherEventRef.current?.bonus?.abilExpBonus ?? 0);
    const result = gainAbility(current, amount * newPlayerMult * petAbilMult * jobSpeechMult * titleAbilMult * weatherAbilMult, partyBonus);
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
      // Phase 12-5: quest completion gives +20 activity points
      const completedCount = messages.length;
      const questPts = completedCount * 20;
      if (questPts > 0) {
        return {
          ...prev, questProgress: progress,
          activityPoints: (prev.activityPoints ?? 0) + questPts,
          totalPointsEarned: (prev.totalPointsEarned ?? 0) + questPts,
        };
      }
      return { ...prev, questProgress: progress };
    });
  }, [addMsg]);

  // Phase 14: Zone daily challenge progress
  const advanceZoneChallenge = useCallback((zone, type, amount = 1) => {
    if (!zone) return;
    const challenge = getZoneDailyChallenge(zone);
    if (!challenge || challenge.type !== type) return;
    setGs(prev => {
      const zcp = { ...(prev.zoneChallengeProgress ?? {}) };
      const entry = zcp[zone] ?? { id: challenge.id, progress: 0, claimed: false };
      if (entry.claimed || entry.progress >= challenge.goal) return prev;
      // If challenge rotated (new day but same key still running), confirm id matches
      if (entry.id && entry.id !== challenge.id) {
        zcp[zone] = { id: challenge.id, progress: amount, claimed: false };
      } else {
        const next = Math.min(challenge.goal, (entry.progress ?? 0) + amount);
        zcp[zone] = { id: challenge.id, progress: next, claimed: false };
        if (next >= challenge.goal && (entry.progress ?? 0) < challenge.goal) {
          setTimeout(() => addMsg(`🗺 [${zone}] 존 챌린지 달성: ${challenge.label}! 보상 수령 가능`, 'catch'), 0);
        }
      }
      return { ...prev, zoneChallengeProgress: zcp };
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
      let bonusBait = {};
      let bonusPotion = {};
      for (const id of newIds) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (!ach) continue;
        bonusMoney += ach.reward?.money ?? 0;
        const itemParts = [];
        if (ach.reward?.baitInventory) {
          for (const [k, v] of Object.entries(ach.reward.baitInventory)) {
            bonusBait[k] = (bonusBait[k] ?? 0) + v;
            itemParts.push(`${k} ${v}개`);
          }
        }
        if (ach.reward?.potionInventory) {
          for (const [k, v] of Object.entries(ach.reward.potionInventory)) {
            bonusPotion[k] = (bonusPotion[k] ?? 0) + v;
            itemParts.push(`${k} ${v}개`);
          }
        }
        const itemStr = itemParts.length ? ` + ${itemParts.join(', ')}` : '';
        msgs.push(`${ach.icon} 업적 달성: [${ach.label}]! +${ach.reward?.money ?? 0}G${itemStr}`);
      }
      setTimeout(() => {
        msgs.forEach(m => addMsgRef.current(m, 'catch'));
        newIds.forEach(id => {
          const a = ACHIEVEMENTS.find(x => x.id === id);
          if (a) achPopupRef.current({ icon: a.icon, label: a.label, money: a.reward?.money ?? 0 });
        });
      }, 0);
      const newBaitInv = { ...(prev.baitInventory ?? {}) };
      for (const [k, v] of Object.entries(bonusBait)) newBaitInv[k] = (newBaitInv[k] ?? 0) + v;
      const newBaitOwned = [...(prev.ownedBait ?? [])];
      for (const k of Object.keys(bonusBait)) { if (!newBaitOwned.includes(k)) newBaitOwned.push(k); }
      const newPotionInv = { ...(prev.potionInventory ?? {}) };
      for (const [k, v] of Object.entries(bonusPotion)) newPotionInv[k] = (newPotionInv[k] ?? 0) + v;
      const achPrevStats = prev.achStats ?? {};
      return {
        ...prev, achievements: [...already, ...newIds], money: prev.money + bonusMoney,
        baitInventory: newBaitInv, ownedBait: newBaitOwned, potionInventory: newPotionInv,
        achStats: { ...achPrevStats, maxMoney: Math.max(achPrevStats.maxMoney ?? 0, prev.money + bonusMoney) },
      };
    });
  }, []);
  useEffect(() => { checkAndGrantAchievementsRef.current = checkAndGrantAchievements; }, [checkAndGrantAchievements]);

  const gainNpcAffinity = useCallback((npcKey, amount) => {
    const titleNpcMult = getActiveTitleBonus(stateRef.current).npcAffinityMult ?? 1.0;
    setGs(prev => {
      const current = prev.npcAffinity?.[npcKey] ?? 0;
      const newVal = Math.min(100, current + amount * titleNpcMult);
      const npcThresholds = NPCS[npcKey]?.thresholds ?? [];
      const crossed = npcThresholds.find(t => current < t.at && newVal >= t.at);
      if (crossed) {
        setTimeout(() => addMsg(`💖 ${NPCS[npcKey]?.name}와의 관계: [${crossed.label}] 달성! ${crossed.reward}`, 'catch'), 0);
      }
      const newAffinityMap = { ...(prev.npcAffinity ?? {}), [npcKey]: newVal };
      const npcValues = Object.values(newAffinityMap);
      const npcAt20 = npcValues.filter(v => v >= 20).length;
      const npcAt50 = npcValues.filter(v => v >= 50).length;
      const npcAt80 = npcValues.filter(v => v >= 80).length;
      const prevStats = prev.achStats ?? {};
      const outerKeys = ['행상인','노련한광부','산신령','심해탐험가','어시장상인','선장','유물학자','설인'];
      const npcQuestS2Count = outerKeys.filter(k => (prev.npcQuestStep?.[k] ?? 0) >= (NPC_QUESTS[k]?.length ?? 0) && NPC_QUESTS[k]).length;
      const npcQuestS2Full = npcQuestS2Count >= 8 && npcAt50 >= 10 ? 1 : 0;
      const updatedStats = { ...prevStats, npcAt20, npcAt50, npcAt80, npcQuestS2Count, npcQuestS2Full };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      return { ...prev, npcAffinity: newAffinityMap, achStats: updatedStats };
    });
  }, [addMsg, checkAndGrantAchievements]);

  // Phase 16-4: Weekly goal progress helper (defined early — used in onFishCaught and sell callbacks)
  const updateWeeklyGoal = useCallback((type, amount = 1) => {
    setGs(prev => {
      const { goals } = getWeeklyGoals();
      const relevant = goals.filter(g => g.type === type);
      if (relevant.length === 0) return prev;
      const wg = { ...(prev.weeklyGoals ?? {}) };
      for (const g of relevant) {
        if (!wg[g.id + '_claimed']) {
          wg[g.id] = Math.min(g.goal, (wg[g.id] ?? 0) + amount);
        }
      }
      return { ...prev, weeklyGoals: wg };
    });
  }, []);

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
    const worldZone = getActiveZone();
    let table;
    // Check world-zone specific table first, then fall back to generic zone table
    const worldZoneKey = `${worldZone}_${zone}`;
    if (ZONE_FISH[worldZoneKey]) {
      table = ZONE_FISH[worldZoneKey];
    } else if (ZONE_FISH[worldZone]) {
      // New world zones have their own dedicated fish table (항구마을, 고대신전, 설산정상)
      table = ZONE_FISH[worldZone];
    } else if (zone === '심해' || zone === '민물' || zone === '바다' || zone === '황금연못') {
      table = ZONE_FISH[zone] ?? getAbilityFishTable(fishAbil);
    } else {
      // '강' — use normal ability-gated table
      table = getAbilityFishTable(fishAbil);
    }

    // World-zone rarity bonus (남쪽심해, 북쪽고원)
    const worldZoneBonus = ZONE_BONUSES[worldZone] ?? {};
    if (worldZoneBonus.rarityBonus) {
      table = applyBoosts(table, { 희귀: 1 + worldZoneBonus.rarityBonus, 전설: 1 + worldZoneBonus.rarityBonus * 1.5, 신화: 1 + worldZoneBonus.rarityBonus * 2 });
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

    // Pet + Job + Equipment rare boost
    const petRareBonus = gameRef.current?.petBonus?.rareBonus ?? 0;
    const jobRareBonus = JOBS[s?.selectedJob]?.bonus?.rareBonus ?? 0;
    const hatRareBonus = HATS[s?.hat]?.bonus?.rareBonus ?? 0;
    const outfitRareBonus = FISHING_OUTFITS[s?.outfit]?.bonus?.rareBonus ?? 0;
    const topRareBonus = TOPS[s?.top]?.bonus?.rareBonus ?? 0;
    const bottomRareBonus = BOTTOMS[s?.bottom]?.bonus?.rareBonus ?? 0;
    const beltRareBonus = s?.belt ? (BELTS[s.belt]?.bonus?.rareBonus ?? 0) : 0;
    const masteryDeepBonus = getMasteryBonus(s?.masteryPerks ?? {}).deepRarityBonus;
    const setDeepBonus = getActiveSetBonus(s ?? {}).deepRarityBonus ?? 0;
    const weatherRareBonus = (activeWeatherEventRef.current?.bonus?.rareBonus ?? 0);
    const totalRareBonus = petRareBonus + jobRareBonus + hatRareBonus + outfitRareBonus + topRareBonus + bottomRareBonus + beltRareBonus + masteryDeepBonus + setDeepBonus + weatherRareBonus;
    if (totalRareBonus > 0) {
      table = applyBoosts(table, { 희귀: 1 + totalRareBonus, 전설: 1 + totalRareBonus * 1.5, 신화: 1 + totalRareBonus * 2 });
    }
    const weatherMythicBonus = activeWeatherEventRef.current?.bonus?.mythicBonus ?? 0;
    if (weatherMythicBonus > 0) {
      table = applyBoosts(table, { 신화: 1 + weatherMythicBonus });
    }

    // Bait boost (amplified by spot deco bait efficiency)
    const baitKey = s?.equippedBait;
    const baitData = baitKey ? BAIT[baitKey] : null;
    const diyBaitData = baitKey ? BAIT_RECIPES[baitKey] : null;
    if (baitData) {
      const baitEff = (s?.spotDecos ?? []).reduce((acc, k) => acc * (SPOT_DECOS[k]?.bonus?.baitEfficiency ?? 1.0), 1.0);
      const effBoost = Object.fromEntries(Object.entries(baitData.boost).map(([k, v]) => [k, 1 + (v - 1) * baitEff]));
      table = applyBoosts(table, effBoost);
    }
    if (diyBaitData?.rareBonus) {
      const r = diyBaitData.rareBonus;
      table = applyBoosts(table, { 희귀: 1 + r, 전설: 1 + r * 1.5, 신화: 1 + r * 2 });
    }

    // Phase 14: legendary rod rarity bonus
    const legendRodRarityBonus = RODS[s?.rod]?.rarityBonus ?? 0;
    if (legendRodRarityBonus > 0) {
      table = applyBoosts(table, { 희귀: 1 + legendRodRarityBonus, 전설: 1 + legendRodRarityBonus * 1.5, 신화: 1 + legendRodRarityBonus * 2 });
    }

    // Apply exploration zone fish boosts
    const explored = s?.exploredZones ?? [];
    for (const zoneId of ['비밀낚시터', '고대유적']) {
      const zone = EXPLORE_ZONES.find(z => z.id === zoneId);
      if (zone && explored.includes(zoneId) && zone.fishBoost) {
        table = applyBoosts(table, zone.fishBoost);
      }
    }

    // Seasonal rare fish bonus
    const seasonRareBonus = getCurrentSeason()?.rareFishBonus ?? 0;
    if (seasonRareBonus > 0) {
      table = applyBoosts(table, { 희귀: 1 + seasonRareBonus, 전설: 1 + seasonRareBonus * 1.5, 신화: 1 + seasonRareBonus * 2 });
    }

    // Server event rare boost
    const srvEvent = serverEventRef.current;
    if (srvEvent && srvEvent.type === 'rareFish') {
      const mult = srvEvent.effectValue ?? 2.0;
      table = applyBoosts(table, { 희귀: mult, 전설: mult * 1.5, 신화: mult * 2 });
    }

    // Party member rarity bonus (10% per member, up to 40% at 4-person party)
    const partyCount = partyMembersRef.current?.length ?? 0;
    if (partyCount >= 1) {
      const partyRareBoost = Math.min(0.40, partyCount * 0.10);
      table = applyBoosts(table, { 희귀: 1 + partyRareBoost, 전설: 1 + partyRareBoost * 1.5, 신화: 1 + partyRareBoost * 2 });
    }

    // 심해 원정대: party 3+ in 심해 zone → add boss fish (크라켄/해룡)
    if (zone === '심해' && partyCount >= 2) {
      // partyCount is OTHER players, so total = partyCount + 1 (self)
      const totalParty = partyCount + 1;
      if (totalParty >= 3) {
        const bossWeight = Math.min(5 + (totalParty - 3) * 3, 15); // 5 at 3p, 8 at 4p, 11+ at 5p+
        table = [...table, { f: '크라켄', w: bossWeight }, { f: '해룡', w: Math.max(1, bossWeight - 2) }];
      }
    }

    // Weather fish multiplier embedded in weight boost
    const wMult = weatherRef.current?.fishMult ?? 1.0;
    if (wMult !== 1.0) table = table.map(e => ({ ...e, w: e.w * wMult }));

    // Phase 15: time period rare bonus
    const timeFishRareBonus = getTimePeriod().fishRareBonus ?? 0;
    if (timeFishRareBonus > 0) {
      table = applyBoosts(table, { 희귀: 1 + timeFishRareBonus, 전설: 1 + timeFishRareBonus * 1.5, 신화: 1 + timeFishRareBonus * 2 });
    }

    // Filter out seasonal fish that don't match current season
    // Filter out night-exclusive fish unless it's night period
    const currentSeasonId = getCurrentSeason()?.id ?? null;
    const currentTimePeriodId = getTimePeriod().id;
    const filteredTable = table.filter(e => {
      const reqS = FISH[e.f]?.reqSeason;
      const reqT = FISH[e.f]?.reqTimePeriod;
      return (!reqS || reqS === currentSeasonId) && (!reqT || reqT === currentTimePeriodId);
    });
    const pickTable = filteredTable.length > 0 ? filteredTable : table;

    const name = weightedPick(pickTable);
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
    const jobSellBonus = 1 + (JOBS[s?.selectedJob]?.bonus?.sellBonus ?? 0);
    const seasonPriceBonus = 1 + (getCurrentSeason()?.fishPriceBonus ?? 0);
    const srvSellBonus = (srvEvent?.type === 'sellBonus') ? (1 + (srvEvent.effectValue ?? 0.2)) : 1.0;
    const prestigeSellBonus = 1 + (s?.prestigePermanentSellBonus ?? 0);
    const hatSellBonus = 1 + (HATS[s?.hat]?.bonus?.sellBonus ?? 0);
    const outfitSellBonus = 1 + (FISHING_OUTFITS[s?.outfit]?.bonus?.sellBonus ?? 0);
    const furnitureSellBonus = 1 + (s?.cottage?.furniture ?? []).reduce((sum, f) => sum + (FURNITURE[f.key]?.bonus?.sellBonus ?? 0), 0);
    const topSellBonus = 1 + (TOPS[s?.top]?.bonus?.sellBonus ?? 0);
    const bottomSellBonus = 1 + (BOTTOMS[s?.bottom]?.bonus?.sellBonus ?? 0);
    const beltSellBonus = s?.belt ? (1 + (BELTS[s.belt]?.bonus?.sellBonus ?? 0)) : 1.0;
    const titleBonusObj = getActiveTitleBonus(s);
    const titleSellBonus = 1 + (titleBonusObj.sellBonus ?? 0) + (titleBonusObj.fishSellBonus ?? 0);
    const worldZoneSellBonus = worldZoneBonus.fishSellMult ?? 1.0;
    const mtnBuffSell = gameRef.current?.mountainBuff;
    const mtnSellBonus = (mtnBuffSell?.type === 'sellPrice' && Date.now() < mtnBuffSell.expiresAt) ? 1.15 : 1.0;
    const deepMasteryLv = getZoneMasteryLevel(s?.zoneMastery, '남쪽심해');
    const deepMasteryBonus = (worldZone === '남쪽심해' && deepMasteryLv > 0) ? 1 + deepMasteryLv * 0.1 : 1.0;
    // Phase 12-2: festival fish price bonus
    const festivalFishBonus = (isFestivalActive(s) && getCurrentSeason()?.festival?.fishPriceBonus) ? (1 + getCurrentSeason().festival.fishPriceBonus) : 1.0;
    // Phase 12-3: town bonus
    const townFishSellBonus = 1 + (townBonuses.fishSellBonus ?? 0);
    // Phase 12-4: job class fish sell bonus
    const jobClassFishSellBonus = 1 + (JOB_CLASSES[s?.jobClass]?.bonus?.fishSellBonus ?? 0);
    const legendRodSellBonus = 1 + (RODS[s?.rod]?.sellBonus ?? 0);
    const masteryFishSellBonus = 1 + getMasteryBonus(s?.masteryPerks ?? {}).fishSellBonus;
    const activeSetBonus = getActiveSetBonus(s ?? {});
    const setFishSellBonus = 1 + (activeSetBonus.fishSellBonus ?? 0) + (activeSetBonus.sellBonus ?? 0);
    const activeWE = activeWeatherEventRef.current;
    const weatherFishSellBonus = (activeWE && (!activeWE.expiresAt || Date.now() < activeWE.expiresAt)) ? (1 + (activeWE.bonus?.fishSellBonus ?? 0)) : 1.0;
    const finalPrice = Math.round(price * seaBonus * petSellBonus * jobSellBonus * seasonPriceBonus * srvSellBonus * prestigeSellBonus * hatSellBonus * outfitSellBonus * topSellBonus * bottomSellBonus * beltSellBonus * titleSellBonus * furnitureSellBonus * worldZoneSellBonus * mtnSellBonus * deepMasteryBonus * festivalFishBonus * townFishSellBonus * jobClassFishSellBonus * legendRodSellBonus * masteryFishSellBonus * setFishSellBonus * weatherFishSellBonus);
    const seaMsg = seaBonus > 1 ? ` 🌊 [${zoneDef?.name ?? zone}] 보너스!` : '';

    // 3% line snap — lose the fish
    if (Math.random() < 0.03) {
      addMsg(`💔 낚싯줄이 끊어졌습니다! ${name} 놓쳤어요...`, 'error');
      if (gameRef.current?.player)
        gameRef.current.player.floatText = { text: '줄 끊김 💔', age: 0, color: '#ff4444' };
      return;
    }

    // 대어 저항 미니게임: 전설/신화 물고기는 저항 미니게임 트리거
    if (fd.rarity === '전설' || fd.rarity === '신화') {
      setResistanceGame({ active: true, name, fd, size, finalPrice, rodKey, seaMsg, id: Date.now() + Math.random() });
      addMsg(`${fd.rarity === '신화' ? '🌟' : '⭐'} ${name}이(가) 저항하고 있습니다! 타이밍을 맞춰 낚아채세요!`, 'catch');
      return;
    }

    // Phase 15-4: Zone minigame triggers (after resistance check, before normal catch)
    const catchZone = getActiveZone();
    const TIDAL_ZONES = ['항구마을', '남쪽심해'];
    const TIDAL_RARITIES = ['보통', '희귀', '전설', '신화'];
    if (TIDAL_ZONES.includes(catchZone) && TIDAL_RARITIES.includes(fd.rarity) && Math.random() < 0.10) {
      setTidalGame({ name, fd, size, finalPrice, rodKey, seaMsg, id: Date.now() + Math.random() });
      addMsg('🌊 조류가 강해집니다! 타이밍을 맞춰 낚아채세요!', 'catch');
      return;
    }
    if (catchZone === '설산정상') {
      setIceHoleGame({ name, fd, size, finalPrice, rodKey, seaMsg, id: Date.now() + Math.random() });
      return;
    }

    // 2% treasure chest
    if (Math.random() < 0.02) {
      const treasure = randInt(200, 800);
      setGs(prev => {
        const prevStats = prev.achStats ?? {};
        const updatedStats = { ...prevStats, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + treasure) };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        return { ...prev, money: prev.money + treasure, achStats: updatedStats };
      });
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
    } else if (diyBaitData?.oneTime) {
      const invKey = diyBaitData.name;
      setGs(prev => {
        const bi = { ...(prev.baitInventory ?? {}), [invKey]: Math.max(0, (prev.baitInventory?.[invKey] ?? 1) - 1) };
        return { ...prev, baitInventory: bi, equippedBait: bi[invKey] <= 0 ? null : prev.equippedBait };
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
      const isLegendaryOrMythic = fd.rarity === '전설' || fd.rarity === '신화';
      const zoneDeepFishCount = (getActiveZone() === '남쪽심해' && isLegendaryOrMythic)
        ? (prevStats.zoneDeepFishCount ?? 0) + 1
        : (prevStats.zoneDeepFishCount ?? 0);
      // Phase 12-5: activity points
      const fishPts = (fd.rarity === '전설' || fd.rarity === '신화') ? 10 : (fd.rarity === '희귀') ? 3 : 1;
      const newTotalPts = (prevStats.totalPointsEarned ?? 0) + fishPts;
      const p13Zone = getActiveZone();
      const updatedStats = {
        ...prevStats,
        fishCaught: newFishCaught,
        legendaryCount: newLegendary,
        mythicCount: newMythic,
        speciesCount: newSpeciesCount,
        maxMoney: newMaxMoney,
        zoneDeepFishCount,
        totalPointsEarned: newTotalPts,
        harborFishCount: p13Zone === '항구마을' ? (prevStats.harborFishCount ?? 0) + 1 : (prevStats.harborFishCount ?? 0),
        snowMasteryTime: p13Zone === '설산정상' ? (prevStats.snowMasteryTime ?? 0) + 1 : (prevStats.snowMasteryTime ?? 0),
      };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      const prevRecord = prev.fishRecords?.[name]?.size ?? 0;
      const isNewRecord = size > prevRecord;
      const newSpXP = (prev.seasonPassXP ?? 0) + 1;
      const newSpTier = Math.min(10, Math.floor(newSpXP / 50));
      // Zone mastery exp
      const fishActiveZone = getActiveZone();
      const fishZoneMasteryZones = ['남쪽심해', '항구마을', '고대신전', '설산정상'];
      const newZoneMastery = fishZoneMasteryZones.includes(fishActiveZone)
        ? { ...(prev.zoneMastery ?? {}), [fishActiveZone]: (prev.zoneMastery?.[fishActiveZone] ?? 0) + 1 }
        : (prev.zoneMastery ?? {});
      // Phase 13: harbor fish count tracking
      const newHarborFishCount = fishActiveZone === '항구마을' ? (prev.harborFishCount ?? 0) + 1 : (prev.harborFishCount ?? 0);
      const newSnowMasteryTime = fishActiveZone === '설산정상' ? (prev.snowMasteryTime ?? 0) + 1 : (prev.snowMasteryTime ?? 0);
      // Phase 12-2: festival participation tracking
      const festSeasonId = getCurrentSeason()?.id;
      const newFestParticipated = (isFestivalActive(prev) && festSeasonId && !(prev.festivalParticipated ?? []).includes(festSeasonId))
        ? [...(prev.festivalParticipated ?? []), festSeasonId]
        : (prev.festivalParticipated ?? []);
      if (newFestParticipated.length > (prev.festivalParticipated ?? []).length) {
        const festUpdated = { ...updatedStats, festivalParticipatedCount: newFestParticipated.length };
        Object.assign(updatedStats, festUpdated);
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      }
      return {
        ...prev,
        fishInventory: [...prev.fishInventory, { name, size, price: finalPrice, id }],
        fishCaught: (prev.fishCaught ?? 0) + 1,
        achStats: updatedStats,
        fishRecords: isNewRecord
          ? { ...prev.fishRecords, [name]: { size, caughtAt: Date.now() } }
          : prev.fishRecords,
        seasonPassXP: newSpXP,
        seasonPassTier: newSpTier,
        zoneMastery: newZoneMastery,
        activityPoints: (prev.activityPoints ?? 0) + fishPts,
        totalPointsEarned: (prev.totalPointsEarned ?? 0) + fishPts,
        festivalParticipated: newFestParticipated,
        harborFishCount: newHarborFishCount,
        snowMasteryTime: newSnowMasteryTime,
      };
    });
    const prevRecord = stateRef.current?.fishRecords?.[name]?.size ?? 0;
    const isNewRecord = size > prevRecord;
    // Phase 14: zone challenge advancement
    const fishZone = getActiveZone();
    advanceZoneChallenge(fishZone, 'zoneFish');
    if (fd.rarity === '희귀' || fd.rarity === '전설' || fd.rarity === '신화') {
      advanceZoneChallenge(fishZone, 'zoneRare');
    }
    addMsg(`🐟 ${name} ${size}cm 낚음! (${finalPrice}G)${seaMsg}${isNewRecord ? ' 🏆 신기록!' : ''}`, 'catch');
    playFishCatch(fd.rarity);
    setCatchPopup({ name, size, price: finalPrice, rarity: fd.rarity, isNewRecord });
    setTimeout(() => setCatchPopup(null), 800);
    if (nicknameRef.current) saveFishRecord(nicknameRef.current, name, size);
    if (nicknameRef.current) saveOverallFishRecord(nicknameRef.current, name, size, fd.rarity);
    if (gameRef.current?.player)
      gameRef.current.player.floatText = { text: `${name} ${size}cm`, age: 0, color: rarityColor(fd.rarity) };

    // Legendary/Mythic broadcast + rare visual effect + trophy
    if (fd.rarity === '전설' || fd.rarity === '신화') {
      broadcastAnnouncement(`${nicknameRef.current}님이 ${size}cm ${name}을(를) 낚았습니다! ${fd.rarity === '신화' ? '🌟 신화어 출현!' : '⭐ 전설어!'}`);
      if (gameRef.current) gameRef.current.rareEffect = { age: 0, color: rarityColor(fd.rarity), rarity: fd.rarity, fishName: name, size };
      // 전설어 신화 세계관: lore cutscenes for 고대어 / 용고기
      if (name === '고대어') {
        setTimeout(() => addMsgRef.current('🗿 [세계관] 고대어... 수천 년 전 이 바다에 존재했던 생명체입니다.', 'catch'), 600);
        setTimeout(() => addMsgRef.current('💬 민준: "믿을 수 없어요! 고대어는 전설 속에만 존재한다고 했는데..."', 'catch'), 2200);
        setTimeout(() => addMsgRef.current('💬 철수: "광산의 고대 벽화에서 봤어요. 이 물고기가 바다의 수호자라고..."', 'catch'), 3800);
      } else if (name === '용고기') {
        setTimeout(() => addMsgRef.current('🐉 [세계관] 용고기!! 용의 후예라 불리는 신화 속 존재가 낚싯줄에 걸렸습니다!', 'catch'), 600);
        setTimeout(() => addMsgRef.current('💬 수연: "세상에... 용고기 요리는 신에게 바치는 음식이었다고 전해져요!"', 'catch'), 2200);
        setTimeout(() => addMsgRef.current('💬 미나: "전설에 의하면 용고기를 잡은 낚시꾼은 바다의 왕이 된다고 해요..."', 'catch'), 3800);
        setTimeout(() => addMsgRef.current('🌟 타이드헤이븐 역사에 길이 남을 전설의 순간입니다!', 'catch'), 5400);
      } else if (name === '크라켄') {
        setTimeout(() => addMsgRef.current('🦑 [심해 원정대] 크라켄!! 심해의 괴물이 원정대의 힘으로 포획되었습니다!', 'catch'), 600);
        setTimeout(() => addMsgRef.current('💬 민준: "믿을 수 없어요... 파티의 힘이 심해 전설을 불렀군요!"', 'catch'), 2200);
        setTimeout(() => addMsgRef.current('🌊 타이드헤이븐 역사상 최초의 크라켄 포획! 원정대의 위업입니다!', 'catch'), 3800);
      } else if (name === '해룡') {
        setTimeout(() => addMsgRef.current('🐲 [심해 원정대] 해룡!! 심해를 지배하는 전설의 존재와 원정대가 맞닥뜨렸습니다!', 'catch'), 600);
        setTimeout(() => addMsgRef.current('💬 철수: "이건... 광산 벽화에서 본 해룡이에요! 실제로 존재했군요!"', 'catch'), 2200);
        setTimeout(() => addMsgRef.current('🌟 원정대의 승리! 해룡이 낚싯줄에 굴복했습니다!', 'catch'), 3800);
      }
      setGs(prev => {
        const entry = { name, size, rarity: fd.rarity, caughtAt: Date.now() };
        const updated = [entry, ...(prev.trophyFish ?? [])].slice(0, 20);
        return { ...prev, trophyFish: updated };
      });
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
            addMsg('🏆 도감 완성! 특별 칭호 "바다의 주인"을 획득했습니다!', 'catch');
            broadcastAnnouncement(`${nicknameRef.current}님이 물고기 도감을 완성했습니다! 🎉`);
          }
        }, 0);
        return { ...prev, caughtSpecies: newSpecies };
      }
      return prev;
    });

    // Server-wide stat

    // Tournament: track weekly total (size + rarity bonus)
    if (nicknameRef.current) {
      const rarityBonus = TOURNAMENT_RARITY_BONUS[fd.rarity] ?? 0;
      tournamentScoreRef.current = Math.round(tournamentScoreRef.current + size + rarityBonus);
      submitTournamentScore(nicknameRef.current, tournamentScoreRef.current);
      seasonScoreRef.current += 1;
      submitSeasonScore(nicknameRef.current, seasonScoreRef.current);
    }
    // Server cooperative quest: contribute fish caught
    incrementServerQuestProgress('fishCaught');

    // Guild quest contribution + weekly competition
    if (myGuildIdRef.current) {
      contributeGuildQuest(myGuildIdRef.current, 'fishCaught', 1);
      incrementGuildWeeklyScore(myGuildIdRef.current, 1);
    }

    // Server boss: deal damage on fish catch
    damageServerBoss(1, nicknameRef.current);

    const seasonStaminaMult = getCurrentSeason()?.staminaGainMult ?? 1.0;
    const outfitFishAbilGain = FISHING_OUTFITS[stateRef.current?.outfit]?.bonus?.fishAbilGain ?? 1.0;
    grantAbility('낚시', (FISH_ABILITY_GAIN[fd.rarity] ?? 0.30) * outfitFishAbilGain);
    grantAbility('체력', STAMINA_GAIN * seasonStaminaMult);
    advanceQuest('fish');
    updateWeeklyGoal('fish');
    if (fd.rarity === '전설' || fd.rarity === '신화') updateWeeklyGoal('rare');

  }, [addMsg, grantAbility, advanceQuest, checkAndGrantAchievements, updateWeeklyGoal]);

  // 대어 저항 미니게임 완료 처리
  const onResistanceSuccess = useCallback(() => {
    const rg = resistanceGame;
    if (!rg) return;
    setResistanceGame(null);
    const { name, fd, size, finalPrice, rodKey, seaMsg, id } = rg;
    const s = stateRef.current;
    const speechAbil = s?.abilities?.화술?.value ?? 0;
    // Process the catch (same as normal catch flow)
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const newFishCaught = (prevStats.fishCaught ?? 0) + 1;
      const newLegendary = (prevStats.legendaryCount ?? 0) + (fd.rarity === '전설' ? 1 : 0);
      const newMythic = (prevStats.mythicCount ?? 0) + (fd.rarity === '신화' ? 1 : 0);
      const newSpeciesCount = (prev.caughtSpecies ?? []).includes(name)
        ? (prevStats.speciesCount ?? (prev.caughtSpecies ?? []).length)
        : (prevStats.speciesCount ?? (prev.caughtSpecies ?? []).length) + 1;
      const updatedStats = { ...prevStats, fishCaught: newFishCaught, legendaryCount: newLegendary, mythicCount: newMythic, speciesCount: newSpeciesCount, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money) };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      const prevRecord = prev.fishRecords?.[name]?.size ?? 0;
      const isNewRecord = size > prevRecord;
      return {
        ...prev,
        fishInventory: [...prev.fishInventory, { name, size, price: finalPrice, id }],
        fishCaught: (prev.fishCaught ?? 0) + 1,
        achStats: updatedStats,
        fishRecords: isNewRecord ? { ...prev.fishRecords, [name]: { size, caughtAt: Date.now() } } : prev.fishRecords,
        trophyFish: [{ name, size, rarity: fd.rarity, caughtAt: Date.now() }, ...(prev.trophyFish ?? [])].slice(0, 20),
      };
    });
    setGs(prev => {
      if (!prev.caughtSpecies?.includes(name)) {
        const newSpecies = [...(prev.caughtSpecies ?? []), name];
        const totalSpecies = Object.keys(FISH).length;
        setTimeout(() => {
          addMsg(`📖 새 물고기 발견! ${name} 도감 등록 (${newSpecies.length}/${totalSpecies})`, 'catch');
          if (newSpecies.length === totalSpecies) {
            addMsg('🏆 도감 완성! 특별 칭호 "바다의 주인"을 획득했습니다!', 'catch');
            broadcastAnnouncement(`${nicknameRef.current}님이 물고기 도감을 완성했습니다! 🎉`);
          }
        }, 0);
        return { ...prev, caughtSpecies: newSpecies };
      }
      return prev;
    });
    const prevRecord = stateRef.current?.fishRecords?.[name]?.size ?? 0;
    const isNewRecord = size > prevRecord;
    addMsg(`${fd.rarity === '신화' ? '🌟' : '⭐'} ${name} ${size}cm 낚음! (${finalPrice}G)${seaMsg}${isNewRecord ? ' 🏆 신기록!' : ''} — 대어 포획 성공!`, 'catch');
    playFishCatch(fd.rarity);
    setCatchPopup({ name, size, price: finalPrice, rarity: fd.rarity, isNewRecord });
    setTimeout(() => setCatchPopup(null), 800);
    if (nicknameRef.current) { saveFishRecord(nicknameRef.current, name, size); saveOverallFishRecord(nicknameRef.current, name, size, fd.rarity); }
    broadcastAnnouncement(`${nicknameRef.current}님이 ${size}cm ${name}을(를) 낚았습니다! ${fd.rarity === '신화' ? '🌟 신화어 출현!' : '⭐ 전설어!'}`);
    if (gameRef.current) gameRef.current.rareEffect = { age: 0, color: fd.rarity === '신화' ? '#ff88ff' : '#ffdd44', rarity: fd.rarity, fishName: name, size };
    if (name === '크라켄') {
      setTimeout(() => addMsg('🦑 [심해 원정대] 크라켄!! 심해의 괴물이 원정대의 힘으로 포획되었습니다!', 'catch'), 600);
      setTimeout(() => addMsg('🌊 타이드헤이븐 역사상 최초의 크라켄 포획! 원정대의 위업입니다!', 'catch'), 2200);
    } else if (name === '해룡') {
      setTimeout(() => addMsg('🐲 [심해 원정대] 해룡!! 심해를 지배하는 전설의 존재와 원정대가 맞닥뜨렸습니다!', 'catch'), 600);
      setTimeout(() => addMsg('🌟 원정대의 승리! 해룡이 낚싯줄에 굴복했습니다!', 'catch'), 2200);
    }
    if (nicknameRef.current) { const rb = TOURNAMENT_RARITY_BONUS[fd.rarity] ?? 0; tournamentScoreRef.current = Math.round(tournamentScoreRef.current + size + rb); submitTournamentScore(nicknameRef.current, tournamentScoreRef.current); seasonScoreRef.current += 1; submitSeasonScore(nicknameRef.current, seasonScoreRef.current); }
    incrementServerQuestProgress('fishCaught');
    if (myGuildIdRef.current) {
      contributeGuildQuest(myGuildIdRef.current, 'fishCaught', 1);
      incrementGuildWeeklyScore(myGuildIdRef.current, 1);
    }
    damageServerBoss(1, nicknameRef.current);
    const seasonStaminaMult = getCurrentSeason()?.staminaGainMult ?? 1.0;
    const outfitFishAbilGain2 = FISHING_OUTFITS[stateRef.current?.outfit]?.bonus?.fishAbilGain ?? 1.0;
    grantAbility('낚시', (FISH_ABILITY_GAIN[fd.rarity] ?? 0.30) * outfitFishAbilGain2);
    grantAbility('화술', Math.floor(finalPrice / 100) * SELL_ABILITY_PER_100G * (1 + speechAbil * 0.005));
    grantAbility('체력', STAMINA_GAIN * seasonStaminaMult);
    advanceQuest('fish');
  }, [resistanceGame, addMsg, grantAbility, advanceQuest, advanceZoneChallenge, checkAndGrantAchievements]); // eslint-disable-line react-hooks/exhaustive-deps

  const onResistanceFail = useCallback(() => {
    const rg = resistanceGame;
    if (!rg) return;
    setResistanceGame(null);
    addMsg(`💔 ${rg.name}이(가) 낚싯줄을 끊고 도망쳤습니다!`, 'error');
    if (gameRef.current?.player)
      gameRef.current.player.floatText = { text: `${rg.name} 도주 💔`, age: 0, color: '#ff4444' };
  }, [resistanceGame, addMsg]);

  // Phase 15-4: Tidal minigame result
  const onTidalResult = useCallback((sizeBonus) => {
    const tg = tidalGame;
    if (!tg) return;
    setTidalGame(null);
    const { name, fd, finalPrice, seaMsg, id } = tg;
    const bonusedSize = parseFloat((tg.size * (1 + sizeBonus)).toFixed(1));
    const bonusedPrice = sizeBonus > 0 ? Math.round(finalPrice * (1 + sizeBonus)) : finalPrice;
    const s = stateRef.current;
    const speechAbil = s?.abilities?.화술?.value ?? 0;
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const updatedStats = {
        ...prevStats,
        fishCaught: (prevStats.fishCaught ?? 0) + 1,
        tidalGameWins: (prevStats.tidalGameWins ?? 0) + (sizeBonus > 0 ? 1 : 0),
      };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      const isNewRecord = bonusedSize > (prev.fishRecords?.[name]?.size ?? 0);
      return {
        ...prev,
        fishInventory: [...prev.fishInventory, { name, size: bonusedSize, price: bonusedPrice, id }],
        fishCaught: (prev.fishCaught ?? 0) + 1,
        achStats: updatedStats,
        tidalGameWins: (prev.tidalGameWins ?? 0) + (sizeBonus > 0 ? 1 : 0),
        fishRecords: isNewRecord ? { ...prev.fishRecords, [name]: { size: bonusedSize, caughtAt: Date.now() } } : prev.fishRecords,
      };
    });
    const bonusStr = sizeBonus > 0 ? ` 🌊 +${Math.round(sizeBonus * 100)}% 크기 보너스!` : '';
    addMsg(`🐟 ${name} ${bonusedSize}cm 낚음! (${bonusedPrice}G)${seaMsg}${bonusStr}`, 'catch');
    playFishCatch(fd.rarity);
    setCatchPopup({ name, size: bonusedSize, price: bonusedPrice, rarity: fd.rarity, isNewRecord: bonusedSize > (stateRef.current?.fishRecords?.[name]?.size ?? 0) });
    setTimeout(() => setCatchPopup(null), 800);
    grantAbility('낚시', FISH_ABILITY_GAIN[fd.rarity] ?? 0.30);
    grantAbility('화술', Math.floor(bonusedPrice / 100) * SELL_ABILITY_PER_100G * (1 + speechAbil * 0.005));
    grantAbility('체력', STAMINA_GAIN);
    advanceQuest('fish');
    advanceZoneChallenge(getActiveZone(), 'zoneFish');
    if (nicknameRef.current) { submitSeasonScore(nicknameRef.current, (seasonScoreRef.current ?? 0) + 1); seasonScoreRef.current = (seasonScoreRef.current ?? 0) + 1; }
    incrementServerQuestProgress('fishCaught');
    damageServerBoss(1, nicknameRef.current);
  }, [tidalGame, addMsg, grantAbility, advanceQuest, advanceZoneChallenge, checkAndGrantAchievements]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 15-4: Ice hole minigame result
  const onIceHoleResult = useCallback((upgradeRarity) => {
    const ig = iceHoleGame;
    if (!ig) return;
    setIceHoleGame(null);
    const { name, fd, size, finalPrice, seaMsg, id } = ig;
    const s = stateRef.current;
    const speechAbil = s?.abilities?.화술?.value ?? 0;
    // Upgrade rarity label for display if success (doesn't change price much, just visual)
    const displayRarity = upgradeRarity && fd.rarity === '흔함' ? '보통'
      : upgradeRarity && fd.rarity === '보통' ? '희귀' : fd.rarity;
    const finalPriceUpgraded = upgradeRarity ? Math.round(finalPrice * 1.2) : finalPrice;
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const updatedStats = {
        ...prevStats,
        fishCaught: (prevStats.fishCaught ?? 0) + 1,
        iceHoleGameWins: (prevStats.iceHoleGameWins ?? 0) + (upgradeRarity ? 1 : 0),
      };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      const isNewRecord = size > (prev.fishRecords?.[name]?.size ?? 0);
      return {
        ...prev,
        fishInventory: [...prev.fishInventory, { name, size, price: finalPriceUpgraded, id }],
        fishCaught: (prev.fishCaught ?? 0) + 1,
        achStats: updatedStats,
        iceHoleGameWins: (prev.iceHoleGameWins ?? 0) + (upgradeRarity ? 1 : 0),
        fishRecords: isNewRecord ? { ...prev.fishRecords, [name]: { size, caughtAt: Date.now() } } : prev.fishRecords,
      };
    });
    const bonusStr = upgradeRarity ? ` ❄️ 희귀도 상향! (${displayRarity})` : '';
    addMsg(`🐟 ${name} ${size}cm 낚음! (${finalPriceUpgraded}G)${seaMsg}${bonusStr}`, 'catch');
    playFishCatch(fd.rarity);
    setCatchPopup({ name, size, price: finalPriceUpgraded, rarity: displayRarity, isNewRecord: size > (stateRef.current?.fishRecords?.[name]?.size ?? 0) });
    setTimeout(() => setCatchPopup(null), 800);
    grantAbility('낚시', FISH_ABILITY_GAIN[fd.rarity] ?? 0.30);
    grantAbility('화술', Math.floor(finalPriceUpgraded / 100) * SELL_ABILITY_PER_100G * (1 + speechAbil * 0.005));
    grantAbility('체력', STAMINA_GAIN);
    advanceQuest('fish');
    advanceZoneChallenge(getActiveZone(), 'zoneFish');
    if (nicknameRef.current) { submitSeasonScore(nicknameRef.current, (seasonScoreRef.current ?? 0) + 1); seasonScoreRef.current = (seasonScoreRef.current ?? 0) + 1; }
    incrementServerQuestProgress('fishCaught');
    damageServerBoss(1, nicknameRef.current);
  }, [iceHoleGame, addMsg, grantAbility, advanceQuest, advanceZoneChallenge, checkAndGrantAchievements]); // eslint-disable-line react-hooks/exhaustive-deps

  const onOreMined = useCallback((oreName) => {
    // World-zone ore yield bonus (동쪽절벽 ×1.3, 북쪽고원 ×1.15)
    const oreActiveZone = getActiveZone();
    const oreZoneBon = ZONE_BONUSES[oreActiveZone] ?? {};
    const baseMasteryLv = getZoneMasteryLevel(stateRef.current?.zoneMastery, oreActiveZone);
    const oreMasteryBonus = (oreActiveZone === '동쪽절벽' && baseMasteryLv > 0 && Math.random() < baseMasteryLv * 0.1) ? 1 : 0;
    const oreCount = ((oreZoneBon.oreMult && Math.random() < (oreZoneBon.oreMult - 1)) ? 2 : 1) + oreMasteryBonus;
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const newOreLog = { ...(prev.oreLog ?? {}), [oreName]: ((prev.oreLog ?? {})[oreName] ?? 0) + oreCount };
      const oreSpecies = Object.keys(newOreLog).filter(k => newOreLog[k] > 0).length;
      const zoneOreCount = oreActiveZone === '동쪽절벽' ? (prevStats.zoneOreCount ?? 0) + oreCount : (prevStats.zoneOreCount ?? 0);
      const zoneRareCount = oreActiveZone === '북쪽고원' ? (prevStats.zoneRareCount ?? 0) + oreCount : (prevStats.zoneRareCount ?? 0);
      const templeOreCount = (oreActiveZone === '고대신전' && oreName === '고대광석') ? (prevStats.templeOreCount ?? 0) + oreCount : (prevStats.templeOreCount ?? 0);
      // Phase 12-5: activity points
      const updatedStats = { ...prevStats, oreMined: (prevStats.oreMined ?? 0) + oreCount, oreSpecies, zoneOreCount, zoneRareCount, templeOreCount, totalPointsEarned: (prevStats.totalPointsEarned ?? 0) + 1 };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      const newSpXP2 = (prev.seasonPassXP ?? 0) + 1;
      // Zone mastery exp: 동쪽절벽 or 북쪽고원
      const newZoneMasteryOre = { ...(prev.zoneMastery ?? {}) };
      if (oreActiveZone === '동쪽절벽') newZoneMasteryOre['동쪽절벽'] = (newZoneMasteryOre['동쪽절벽'] ?? 0) + 1;
      if (oreActiveZone === '북쪽고원') newZoneMasteryOre['북쪽고원'] = (newZoneMasteryOre['북쪽고원'] ?? 0) + 1;
      if (oreActiveZone === '고대신전') newZoneMasteryOre['고대신전'] = (newZoneMasteryOre['고대신전'] ?? 0) + 1;
      if (oreActiveZone === '설산정상') newZoneMasteryOre['설산정상'] = (newZoneMasteryOre['설산정상'] ?? 0) + 1;
      // Phase 12-2: festival participation
      const oreSeasonId = getCurrentSeason()?.id;
      const newFestPartOre = (isFestivalActive(prev) && oreSeasonId && !(prev.festivalParticipated ?? []).includes(oreSeasonId))
        ? [...(prev.festivalParticipated ?? []), oreSeasonId]
        : (prev.festivalParticipated ?? []);
      if (newFestPartOre.length > (prev.festivalParticipated ?? []).length) {
        updatedStats.festivalParticipatedCount = newFestPartOre.length;
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      }
      // Phase 12-4: job class extra ore chance
      const jobClassExtraOre = (Math.random() < (JOB_CLASSES[prev.jobClass]?.bonus?.oreExtraChance ?? 0)) ? 1 : 0;
      const totalOreCount = oreCount + jobClassExtraOre;
      return {
        ...prev,
        oreInventory: { ...prev.oreInventory, [oreName]: (prev.oreInventory[oreName] || 0) + totalOreCount },
        oreLog: { ...newOreLog, [oreName]: (newOreLog[oreName] ?? 0) + jobClassExtraOre },
        achStats: updatedStats,
        seasonPassXP: newSpXP2,
        seasonPassTier: Math.min(10, Math.floor(newSpXP2 / 50)),
        zoneMastery: newZoneMasteryOre,
        activityPoints: (prev.activityPoints ?? 0) + 1,
        totalPointsEarned: (prev.totalPointsEarned ?? 0) + 1,
        festivalParticipated: newFestPartOre,
        templeOreCount: (oreActiveZone === '고대신전' && oreName === '고대광석') ? (prev.templeOreCount ?? 0) + totalOreCount : (prev.templeOreCount ?? 0),
      };
    });
    // Phase 14: zone challenge advancement for ore
    advanceZoneChallenge(oreActiveZone, 'zoneOre', oreCount);
    addMsg(`⛏ ${oreName} ${oreCount}개 채굴!${oreCount > 1 ? ' (광물이 풍부한 지역!)' : ''}`, 'mine');
    playOreMined();
    if (gameRef.current?.player)
      gameRef.current.player.floatText = { text: `+${oreName}`, age: 0, color: ORES[oreName]?.color ?? '#fa4' };
    // Windfall: base 3%, boosted by depth, 철수 affinity 50+, and 두더지 pet bonus
    const curDepth = stateRef.current?.mineDepth ?? 1;
    const cheolsuAffinity = stateRef.current?.npcAffinity?.채굴사 ?? 0;
    const cheolsuWindfall = cheolsuAffinity >= 50 ? 0.05 : 0;
    const jobWindfallMult = JOBS[stateRef.current?.selectedJob]?.bonus?.windfallMult ?? 1.0;
    const outfitWindfallBonus = FISHING_OUTFITS[stateRef.current?.outfit]?.bonus?.windfallBonus ?? 0;
    // Phase 12-4: job class windfall bonus
    const jobClassWindfallBonus = JOB_CLASSES[stateRef.current?.jobClass]?.bonus?.windfallBonus ?? 0;
    const legendPickaxeWindfallBonus = PICKAXES[stateRef.current?.pickaxe]?.windfallBonus ?? 0;
    const windfallChance = (0.03 + (curDepth - 1) * 0.015 + cheolsuWindfall + (gameRef.current?.petBonus?.windfallBonus ?? 0) + outfitWindfallBonus + jobClassWindfallBonus + legendPickaxeWindfallBonus) * jobWindfallMult;
    const windfall = Math.random() < windfallChance;
    if (windfall) {
      const extra = randInt(4, 9);
      setGs(prev => ({
        ...prev,
        oreInventory: { ...prev.oreInventory, [oreName]: (prev.oreInventory[oreName] || 0) + extra },
        activityPoints: (prev.activityPoints ?? 0) + 5,
        totalPointsEarned: (prev.totalPointsEarned ?? 0) + 5,
      }));
      addMsg(`💥 대박! ${oreName} ${extra}개 추가 획득!`, 'catch');
      if (gameRef.current?.player)
        gameRef.current.player.floatText = { text: `💥 ${oreName} ×${extra+1}!`, age: 0, color: '#ffdd00' };
      if (gameRef.current) gameRef.current.shakeEffect = { age: 0, intensity: 8 };
      setWindfallPopup({ oreName, count: extra });
      setTimeout(() => setWindfallPopup(null), 1200);
    }
    grantAbility('채굴', ORE_ABILITY_GAIN[oreName] ?? 0.40);
    grantAbility('체력', STAMINA_GAIN);
    advanceQuest('ore');
    gainNpcAffinity('채굴사', 0.8);
    // 광석 정밀 채굴 미니게임: 수정/금광석에서 20% 확률 트리거
    if ((oreName === '수정' || oreName === '금광석') && Math.random() < 0.20 && !miningMinigame) {
      setMiningMinigame({ oreName });
    }
    // 폭풍 강화 이벤트: 폭풍 시 8% 확률로 폭풍석 획득
    if (weatherRef.current?.id === 'storm' && Math.random() < 0.08) {
      setGs(prev => ({
        ...prev,
        processedOreInventory: { ...prev.processedOreInventory, 폭풍석: (prev.processedOreInventory?.폭풍석 ?? 0) + 1 },
      }));
      addMsg('⚡ 폭풍석 1개 획득! (폭풍 이벤트)', 'catch');
    }
    // 광산유적 탐험 완료 시 5% 확률로 고대 보석 획득
    const exploredZ = stateRef.current?.exploredZones ?? [];
    if (exploredZ.includes('광산유적') && Math.random() < 0.05) {
      setGs(prev => ({
        ...prev,
        processedOreInventory: { ...prev.processedOreInventory, 고대보석: (prev.processedOreInventory?.고대보석 ?? 0) + 1 },
      }));
      addMsg('🗿 고대 보석 1개 획득! (광산 고대 유적)', 'catch');
    }
    // Phase 12-1: 신화 광석 — 북쪽고원 채굴 시 3% 확률
    if (oreActiveZone === '북쪽고원' && Math.random() < 0.03) {
      setGs(prev => ({ ...prev, specialItems: { ...(prev.specialItems ?? {}), mythicOre: (prev.specialItems?.mythicOre ?? 0) + 1 } }));
      addMsg('💎 신화 광석 1개 획득! (희귀!)', 'catch');
    }
    // Guild quest contribution + weekly competition
    if (myGuildIdRef.current) {
      contributeGuildQuest(myGuildIdRef.current, 'oreMined', 1);
      incrementGuildWeeklyScore(myGuildIdRef.current, 1);
    }
    // Server boss: deal damage on ore mined
    damageServerBoss(1, nicknameRef.current);
  }, [addMsg, grantAbility, advanceQuest, advanceZoneChallenge, gainNpcAffinity, checkAndGrantAchievements, miningMinigame]);

  const onHerbGathered = useCallback((herbName) => {
    // World-zone herb yield bonus (서쪽초원 ×1.4, 북쪽고원 ×1.2)
    const herbActiveZone = getActiveZone();
    const zoneBon = ZONE_BONUSES[herbActiveZone] ?? {};
    const herbMasteryLv = getZoneMasteryLevel(stateRef.current?.zoneMastery, herbActiveZone);
    const herbMasteryBonus = (herbActiveZone === '서쪽초원' && herbMasteryLv > 0 && Math.random() < herbMasteryLv * 0.1) ? 1 : 0;
    // Phase 12-2: festival herb yield bonus
    const festivalHerbBonus = (isFestivalActive(stateRef.current) && getCurrentSeason()?.festival?.herbYieldBonus)
      ? (Math.random() < getCurrentSeason().festival.herbYieldBonus ? 1 : 0) : 0;
    // Phase 12-3: town herb yield bonus
    const townHerbBonus = (townBonuses.herbYieldBonus > 0 && Math.random() < townBonuses.herbYieldBonus) ? 1 : 0;
    const herbCount = ((zoneBon.herbMult && Math.random() < (zoneBon.herbMult - 1)) ? 2 : 1) + herbMasteryBonus + festivalHerbBonus + townHerbBonus;
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const newHerbLog = { ...(prev.herbLog ?? {}), [herbName]: ((prev.herbLog ?? {})[herbName] ?? 0) + herbCount };
      const herbSpecies = Object.keys(newHerbLog).filter(k => newHerbLog[k] > 0).length;
      const zoneHerbCount = herbActiveZone === '서쪽초원' ? (prevStats.zoneHerbCount ?? 0) + herbCount : (prevStats.zoneHerbCount ?? 0);
      const zoneRareHerb = herbActiveZone === '북쪽고원' ? (prevStats.zoneRareCount ?? 0) + herbCount : (prevStats.zoneRareCount ?? 0);
      const updatedStats = { ...prevStats, herbGathered: (prevStats.herbGathered ?? 0) + herbCount, herbSpecies, zoneHerbCount, zoneRareCount: Math.max(prevStats.zoneRareCount ?? 0, zoneRareHerb), totalPointsEarned: (prevStats.totalPointsEarned ?? 0) + 1 };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      // Zone mastery exp
      const newZoneMasteryHerb = { ...(prev.zoneMastery ?? {}) };
      if (herbActiveZone === '서쪽초원') newZoneMasteryHerb['서쪽초원'] = (newZoneMasteryHerb['서쪽초원'] ?? 0) + 1;
      if (herbActiveZone === '북쪽고원') newZoneMasteryHerb['북쪽고원'] = (newZoneMasteryHerb['북쪽고원'] ?? 0) + 1;
      // Phase 12-2: festival participation
      const herbSeasonId = getCurrentSeason()?.id;
      const newFestPartHerb = (isFestivalActive(prev) && herbSeasonId && !(prev.festivalParticipated ?? []).includes(herbSeasonId))
        ? [...(prev.festivalParticipated ?? []), herbSeasonId]
        : (prev.festivalParticipated ?? []);
      if (newFestPartHerb.length > (prev.festivalParticipated ?? []).length) {
        updatedStats.festivalParticipatedCount = newFestPartHerb.length;
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      }
      return {
        ...prev,
        herbInventory: { ...(prev.herbInventory ?? {}), [herbName]: ((prev.herbInventory ?? {})[herbName] || 0) + herbCount },
        herbLog: newHerbLog,
        achStats: updatedStats,
        zoneMastery: newZoneMasteryHerb,
        activityPoints: (prev.activityPoints ?? 0) + 1,
        totalPointsEarned: (prev.totalPointsEarned ?? 0) + 1,
        festivalParticipated: newFestPartHerb,
      };
    });
    // Phase 14: zone challenge advancement for herb
    const herbZoneForChallenge = getActiveZone();
    advanceZoneChallenge(herbZoneForChallenge, 'zoneHerb', herbCount);
    addMsg(`🌿 ${herbName} ${herbCount}개 채집!${herbCount > 1 ? ' (풍요로운 지역 보너스!)' : ''}`, 'catch');
    if (gameRef.current?.player)
      gameRef.current.player.floatText = { text: `+${herbName}`, age: 0, color: HERBS[herbName]?.color ?? '#8c4' };
    grantAbility('체력', 0.1);
    grantAbility('채집', 0.5);
    advanceQuest('herb');
  }, [addMsg, grantAbility, advanceQuest, advanceZoneChallenge, checkAndGrantAchievements]);

  const onActivityChange = useCallback((act) => setActivity(act), []);


  // Phase 16-4: Friend management (defined early — used in handleCommand)
  const handleAddFriend = useCallback((friendNick) => {
    if (!friendNick || friendNick === nickname) return;
    setGs(prev => {
      if ((prev.friends ?? []).includes(friendNick)) return prev;
      const friends = [...(prev.friends ?? []), friendNick];
      const friendCount = friends.length;
      const newStats = { ...(prev.achStats ?? {}), friendCount };
      setTimeout(() => checkAndGrantAchievements(newStats), 0);
      return { ...prev, friends, achStats: newStats };
    });
    addFriend(nickname, friendNick);
    addMsg(`👥 ${friendNick}을(를) 친구로 추가했습니다!`, 'catch');
  }, [nickname, addMsg, checkAndGrantAchievements]);

  const handleRemoveFriend = useCallback((friendNick) => {
    setGs(prev => ({ ...prev, friends: (prev.friends ?? []).filter(f => f !== friendNick) }));
    removeFriend(nickname, friendNick);
  }, [nickname]);

  // Phase 16-4: Claim weekly goal reward (defined early — used in Sidebar via props)
  const claimWeeklyGoalReward = useCallback((goalId) => {
    const s = stateRef.current;
    const { goals } = getWeeklyGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const prog = s?.weeklyGoals?.[goalId] ?? 0;
    if (prog < goal.goal) { addMsg('아직 목표를 달성하지 못했습니다.', 'error'); return; }
    const entry = s?.weeklyGoals?.[goalId + '_claimed'];
    if (entry) { addMsg('이미 보상을 수령했습니다.', 'error'); return; }
    const gold = goal.reward.money ?? 0;
    setGs(prev => {
      const weeklyGoals = { ...(prev.weeklyGoals ?? {}), [goalId + '_claimed']: true };
      const weeklyGoalsClaimed = Object.keys(weeklyGoals).filter(k => k.endsWith('_claimed')).length;
      const totalWeeklyGoalsCompleted = (prev.achStats?.totalWeeklyGoalsCompleted ?? 0) + 1;
      const newStats = { ...(prev.achStats ?? {}), weeklyGoalsClaimed, totalWeeklyGoalsCompleted };
      setTimeout(() => checkAndGrantAchievements(newStats), 0);
      return { ...prev, money: (prev.money ?? 0) + gold, weeklyGoals, achStats: newStats };
    });
    addMsg(`🎯 주간 목표 달성! +${gold.toLocaleString()}G`, 'catch');
  }, [addMsg, checkAndGrantAchievements, stateRef]);

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
       '!우편함 – 플레이어 우편함 열기',
       '!시즌리그 – 이번 달 낚시 시즌 리그 순위 보기',
       '!랭킹  – 랭킹 보기',
       '!토너먼트 – 주간 낚시 토너먼트 순위 보기',
       '!스탯  – 캐릭터 스탯 보기',
       '!퀘스트 – 오늘의 퀘스트 확인',
       '!탐험  – 새 탐험 구역 발견 시도',
       '!씨앗    – 씨앗 목록 확인',
       '!심기 [씨앗명] – 씨앗 심기 (농장 근처)',
       '!물주기  – 작물에 물 주기 (성장 25% 단축)',
       '!수확   – 다 자란 작물 수확 (농장 근처)',
       '!펫먹이 [물고기명] – 활성 펫에게 물고기 먹이주기 (레벨업)',
       '!여관휴식 – 500G로 10분 낚시속도 +20% (여관 내)',
       '/파티초대 [닉네임] – 플레이어를 파티에 초대',
       '/파티수락 – 대기 중인 파티 초대 수락',
       '/파티거절 – 파티 초대 거절',
       '/파티탈퇴 – 파티에서 탈퇴',
       '/파티 [메시지] – 파티원에게 메시지 전송',
      ].forEach(t => addMsg(t));
      return;
    }

    if (cmd === '!진화석') {
      const today = new Date().toDateString();
      if (stateRef.current?.evolutionGemDate === today) { addMsg('오늘은 이미 진화석을 구매했습니다. (1일 1개 한도)', 'error'); return; }
      if ((stateRef.current?.money ?? 0) < 5000) { addMsg('진화석 구매에 5000G가 필요합니다.', 'error'); return; }
      setGs(prev => ({
        ...prev,
        money: prev.money - 5000,
        specialItems: { ...(prev.specialItems ?? {}), evolutionGem: (prev.specialItems?.evolutionGem ?? 0) + 1 },
        evolutionGemDate: today,
      }));
      addMsg('💎 진화석 1개 구매! (5000G)', 'catch');
      return;
    }

    if (cmd === '!포인트상점' || cmd === '!포인트') {
      setShowPointShop(v => !v);
      return;
    }

    if (cmd === '!마을' || cmd === '!마을발전') {
      setShowTownHall(v => !v);
      return;
    }

    if (cmd === '!인벤' || cmd === '!인벤토리') {
      setShowInv(v => !v);
      return;
    }

    if (cmd === '!우편함') {
      setShowMailbox(v => !v);
      return;
    }

    if (cmd === '!시즌리그') {
      setShowSeasonLeague(v => !v);
      return;
    }

    if (cmd === '!거래소') {
      setShowAuction(v => !v);
      return;
    }

    if (cmd === '!시즌패스') {
      setShowSeasonPass(v => !v);
      return;
    }

    if (cmd === '!랭킹') {
      setShowRank(v => !v);
      return;
    }

    if (cmd === '!토너먼트') {
      setShowTournament(v => !v);
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
      const outfitCookMult = FISHING_OUTFITS[stateRef.current?.outfit]?.bonus?.cookPriceMult ?? 0;
      const jobCookMult = JOBS[stateRef.current?.selectedJob]?.bonus?.cookPriceMult ?? 0;
      const totalMult = baseMult + cookAbil * 0.01 + outfitCookMult + jobCookMult; // up to +1.0x at 100
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
      // 요리사 affinity 20+ grants +20% cooking ability gain
      const cookAffinityMult = (stateRef.current?.npcAffinity?.요리사 ?? 0) >= 20 ? 1.20 : 1.0;
      grantAbility('요리', COOK_ABILITY_GAIN * raw.length * cookAffinityMult);
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
      if (returnCastRef.current) handleCancelReturn();
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

    if (cmd === '!귀환') {
      const currentZone = getActiveZone();
      if (currentZone === '마을') { addMsg('이미 마을에 있습니다.', 'info'); return; }
      if (player.state !== 'idle') { addMsg('활동 중에는 귀환할 수 없습니다. !그만 후 시도하세요.', 'error'); return; }
      if (returnCastRef.current) { addMsg('귀환이 이미 진행 중입니다.', 'info'); return; }
      const expiresAt = Date.now() + 5000;
      const castId = expiresAt; // unique token
      const timer = setTimeout(() => {
        if (!returnCastRef.current || returnCastRef.current.castId !== castId) return; // cancelled
        returnCastRef.current = null;
        setReturnCast(null);
        handleZoneTransition('마을');
        if (gameRef.current?.player) {
          gameRef.current.player.x = PLAYER_START_X;
          gameRef.current.player.y = PLAYER_START_Y;
          gameRef.current.player.state = 'idle';
        }
        addMsg('🏠 마을로 귀환했습니다!', 'catch');
      }, 5000);
      returnCastRef.current = { castId, timer, expiresAt };
      setReturnCast({ expiresAt });
      addMsg('🏠 귀환 준비 중... (5초, 이동 시 취소)', 'info');
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
        const diyFishBonus = BAIT_RECIPES[s.equippedBait]?.fishSpeedBonus ?? 0;
        const petFishMult = gameRef.current?.petBonus?.fishTimeMult ?? 1.0;
        const jobFishMult = JOBS[s.selectedJob]?.bonus?.fishTimeMult ?? 1.0;
        const innBuffMult = (gameRef.current?.innBuff?.expiresAt ?? 0) > Date.now() ? 0.8 : 1.0;
        const mtnBuff = gameRef.current?.mountainBuff;
        const mtnFishMult = (mtnBuff?.type === 'fishSpeed' && Date.now() < mtnBuff.expiresAt) ? 0.85 : 1.0;
        const seasonFishBonus = getCurrentSeason()?.fishSpeedBonus ?? 0;
        const timePeriodFishMult = 1 + (getTimePeriod().fishTimeBonus ?? 0); // Phase 15
        const hatFishMult = HATS[s.hat]?.bonus?.fishTimeMult ?? 1.0;
        const outfitFishMult = FISHING_OUTFITS[s.outfit]?.bonus?.fishTimeMult ?? 1.0;
        const topFishMult = TOPS[s.top]?.bonus?.fishTimeMult ?? 1.0;
        const bottomFishMult = BOTTOMS[s.bottom]?.bonus?.fishTimeMult ?? 1.0;
        const beltFishMult = s.belt ? (BELTS[s.belt]?.bonus?.fishTimeMult ?? 1.0) : 1.0;
        const spotDecoFishMult = (s.spotDecos ?? []).reduce((acc, k) => acc * (SPOT_DECOS[k]?.bonus?.fishTimeMult ?? 1.0), 1.0);
        const titleFishMult = getActiveTitleBonus(s).fishTimeMult ?? 1.0;
        const masteryFishMult = getMasteryBonus(s.masteryPerks ?? {}).fishTimeMult;
        const timeMult = Math.max(0.3,
          (1 - fishAbil * 0.004) * (1 - stamAbil * 0.003) * (1 - enhEffect.timeReduction) * (1 - potionFishBonus) * (1 - diyFishBonus) * (1 - seasonFishBonus) * petFishMult * jobFishMult * innBuffMult * mtnFishMult * timePeriodFishMult * hatFishMult * outfitFishMult * topFishMult * bottomFishMult * beltFishMult * spotDecoFishMult * titleFishMult * masteryFishMult
        );
        const [mn, mx] = RODS[s.rod].catchTimeRange.map(t => Math.max(1000, Math.round(t * timeMult)));
        if (gameRef.current) gameRef.current.fishTimeMult = timeMult;
        player.activityStart = performance.now();
        player.activityDuration = randInt(mn, mx);
        player.activityProgress = 0;
        setActivity('fishing');
        const fishZone = (s.marineGear === '스쿠버다이빙세트' && (s.abilities?.낚시?.value ?? 0) >= 50) ? '심해' : '바다';
        const totalPartyNow = (partyMembersRef.current?.length ?? 0) + 1;
        if (fishZone === '심해' && totalPartyNow >= 3) {
          addMsg(`🦑 심해 원정대 발동! 파티 ${totalPartyNow}명이 심해에 입장합니다. 크라켄/해룡 출현 가능!`, 'catch');
          broadcastAnnouncement(`${nicknameRef.current}의 파티 ${totalPartyNow}명이 심해 원정대를 시작했습니다! 🦑`);
        } else {
          addMsg(`🌊 ${gear.name}으로 해상 낚시 시작! (희귀도 보너스 ×${gear.rareMult})`);
        }
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
      const diyBaitDef2 = BAIT_RECIPES[s.equippedBait];
      const diyFishBonus2 = (!diyBaitDef2?.seaOnly || nearest.seaFishing) ? (diyBaitDef2?.fishSpeedBonus ?? 0) : 0;
      const petFishMult2 = gameRef.current?.petBonus?.fishTimeMult ?? 1.0;
      const jobFishMult2 = JOBS[s.selectedJob]?.bonus?.fishTimeMult ?? 1.0;
      const innBuffMult2 = (gameRef.current?.innBuff?.expiresAt ?? 0) > Date.now() ? 0.8 : 1.0;
      const mtnBuff2 = gameRef.current?.mountainBuff;
      const mtnFishMult2 = (mtnBuff2?.type === 'fishSpeed' && Date.now() < mtnBuff2.expiresAt) ? 0.85 : 1.0;
      const seasonFishBonus2 = getCurrentSeason()?.fishSpeedBonus ?? 0;
      const timePeriodFishMult2 = 1 + (getTimePeriod().fishTimeBonus ?? 0); // Phase 15
      const hatFishMult2 = HATS[s.hat]?.bonus?.fishTimeMult ?? 1.0;
      const outfitFishMult2 = FISHING_OUTFITS[s.outfit]?.bonus?.fishTimeMult ?? 1.0;
      const topFishMult2 = TOPS[s.top]?.bonus?.fishTimeMult ?? 1.0;
      const bottomFishMult2 = BOTTOMS[s.bottom]?.bonus?.fishTimeMult ?? 1.0;
      const beltFishMult2 = s.belt ? (BELTS[s.belt]?.bonus?.fishTimeMult ?? 1.0) : 1.0;
      const spotDecoFishMult2 = (s.spotDecos ?? []).reduce((acc, k) => acc * (SPOT_DECOS[k]?.bonus?.fishTimeMult ?? 1.0), 1.0);
      const titleFishMult2 = getActiveTitleBonus(s).fishTimeMult ?? 1.0;
      const masteryFishMult2 = getMasteryBonus(s.masteryPerks ?? {}).fishTimeMult;
      const timeMult = Math.max(0.3,
        (1 - fishAbil * 0.004) * (1 - stamAbil * 0.003) * (1 - enhEffect.timeReduction) * (1 - potionFishBonus2) * (1 - diyFishBonus2) * (1 - seasonFishBonus2) * petFishMult2 * jobFishMult2 * innBuffMult2 * mtnFishMult2 * timePeriodFishMult2 * hatFishMult2 * outfitFishMult2 * topFishMult2 * bottomFishMult2 * beltFishMult2 * spotDecoFishMult2 * titleFishMult2 * masteryFishMult2
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
      if (indoorRoomRef.current !== 'mine' && !isInMineZone(player.x, player.y)) {
        addMsg('⛏ 광산 지역(동쪽)으로 이동하세요!', 'error');
        return;
      }
      // Mine depth: deeper floors give rarer ore but take longer
      const mineDepth = s.mineDepth ?? 1;
      const mineAbil = s.abilities?.채굴?.value ?? 0;
      const cheolsu = s.npcAffinity?.채굴사 ?? 0;
      const depthReq = cheolsu >= 80 ? 0 : (MINE_DEPTH_REQ[mineDepth] ?? 0); // 철수 80: unlock all depths
      if (mineAbil < depthReq) {
        addMsg(`⛏ ${mineDepth}층은 채굴 ${depthReq} 이상 필요합니다! (현재 ${mineAbil.toFixed(1)})`, 'error');
        setGs(prev => ({ ...prev, mineDepth: 1 }));
        return;
      }
      // Build ore weight table: base × depth multiplier × 심층광맥 zone boost
      const oreExplored = s.exploredZones ?? [];
      const deepZone = EXPLORE_ZONES.find(z => z.id === '심층광맥');
      const ancientZone = EXPLORE_ZONES.find(z => z.id === '광산유적');
      const deepBoosts    = oreExplored.includes('심층광맥') ? (deepZone?.oreBoost ?? {}) : {};
      const ancientBoosts = oreExplored.includes('광산유적') ? (ancientZone?.oreBoost ?? {}) : {};
      const zoneBoosts = Object.fromEntries(
        [...new Set([...Object.keys(deepBoosts), ...Object.keys(ancientBoosts)])].map(k => [
          k, (deepBoosts[k] ?? 1.0) * (ancientBoosts[k] ?? 1.0),
        ])
      );
      const cheolsuSpecialBoost = cheolsu >= 80 ? 1.5 : 1.0;
      const seasonOreKey = getCurrentSeason()?.oreBoostKey ?? null;
      const seasonOreMult = getCurrentSeason()?.oreBoostMult ?? 1.0;
      const oreEntries = Object.entries(ORES).map(([k, v]) => ({
        f: k,
        w: v.w * (MINE_DEPTH_ORE_MULT[k]?.[mineDepth - 1] ?? 1.0) * (zoneBoosts[k] ?? 1.0)
          * ((cheolsu >= 80 && (k === '수정' || k === '금광석')) ? cheolsuSpecialBoost : 1.0)
          * (seasonOreKey && k === seasonOreKey ? seasonOreMult : 1.0),
      }));
      const ore = weightedPick(oreEntries);
      player.state = 'mining';
      player.currentOre = ore;
      const mineStamAbil = s.abilities?.체력?.value ?? 0;
      const pickaxeKey = s.pickaxe ?? '나무곡괭이';
      const pickaxeEnhLv = s.pickaxeEnhance?.[pickaxeKey] ?? 0;
      const { timeReduction: paxTimeRed } = pickaxeEnhanceEffect(pickaxeEnhLv);
      const paxMult = PICKAXES[pickaxeKey]?.timeMult ?? 1.0;
      const potionMineBonus = (s.activePotion?.effect?.mineSpeedBonus ?? 0);
      const petMineMult = gameRef.current?.petBonus?.mineTimeMult ?? 1.0;
      const jobMineMult = JOBS[s.selectedJob]?.bonus?.mineTimeMult ?? 1.0;
      const depthTimeMult = MINE_DEPTH_TIME[mineDepth - 1] ?? 1.0;
      const cheolsuMineBonus = cheolsu >= 20 ? 0.08 : 0; // 채굴사 lv20: 채굴 속도 +8%
      const hatMineMult = HATS[s.hat]?.bonus?.mineTimeMult ?? 1.0;
      const outfitMineMult = FISHING_OUTFITS[s.outfit]?.bonus?.mineTimeMult ?? 1.0;
      const topMineMult = TOPS[s.top]?.bonus?.mineTimeMult ?? 1.0;
      const bottomMineMult = BOTTOMS[s.bottom]?.bonus?.mineTimeMult ?? 1.0;
      const titleMineMult = getActiveTitleBonus(s).mineTimeMult ?? 1.0;
      const worldZoneMineReduction = ZONE_BONUSES[getActiveZone()]?.mineTimeReduction ?? 0;
      const mtnBuffMine = gameRef.current?.mountainBuff;
      const mtnMineMult = (mtnBuffMine?.type === 'mineSpeed' && Date.now() < mtnBuffMine.expiresAt) ? 0.85 : 1.0;
      // Phase 12-2: festival mine speed bonus
      const festivalMineMult = (isFestivalActive(s) && getCurrentSeason()?.festival?.mineSpeedBonus) ? (1 - getCurrentSeason().festival.mineSpeedBonus) : 1.0;
      // Phase 12-3: town mine speed bonus
      const townMineMult = 1 - (townBonuses.mineSpeedBonus ?? 0);
      // Phase 12-4: job class mine time mult
      const jobClassMineMult = JOB_CLASSES[s?.jobClass]?.bonus?.mineTimeMult ?? 1.0;
      const setMineMult = getActiveSetBonus(s ?? {}).mineTimeMult ?? 1.0;
      const weatherMineMult = activeWeatherEventRef.current?.bonus?.mineTimeMult ?? 1.0;
      const mineMult = Math.max(0.25, (1 - mineAbil * 0.004) * (1 - mineStamAbil * 0.003) * paxMult * (1 - paxTimeRed) * (1 - potionMineBonus) * (1 - cheolsuMineBonus) * petMineMult * jobMineMult * depthTimeMult * hatMineMult * outfitMineMult * topMineMult * bottomMineMult * titleMineMult * (1 - worldZoneMineReduction) * mtnMineMult * festivalMineMult * townMineMult * jobClassMineMult * setMineMult * weatherMineMult);
      const [mn, mx] = ORES[ore].mineRange.map(t => Math.max(800, Math.round(t * mineMult)));
      if (gameRef.current) gameRef.current.mineTimeMult = mineMult;
      player.activityStart = performance.now();
      player.activityDuration = randInt(mn, mx);
      player.activityProgress = 0;
      setActivity('mining');
      const depthLabel = mineDepth > 1 ? ` (${mineDepth}층)` : '';
      addMsg(`⛏ 광질 시작!${depthLabel} (방향키로 취소)`);
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
      const seasonGatherBonus = getCurrentSeason()?.gatherSpeedBonus ?? 0;
      const petGatherMult = gameRef.current?.petBonus?.gatherTimeMult ?? 1.0;
      const furnitureGatherMult = (s.cottage?.furniture ?? []).reduce((acc, f) => acc * (FURNITURE[f.key]?.bonus?.gatherTimeMult ?? 1.0), 1.0);
      const gatherMult = Math.max(0.3, (1 - gatherAbil * 0.004) * gatherToolMult * (1 - potionGatherBonus) * (1 - seasonGatherBonus) * petGatherMult * furnitureGatherMult);
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
      setGs(prev => {
        const prevStats = prev.achStats ?? {};
        const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + total, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + total) };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        return { ...prev, money: prev.money + total, fishInventory: [], achStats: updatedStats };
      });
      addMsg(`💰 물고기 ${inv.length}마리 → ${total}G!`, 'catch');
      playSellSound(total);
      grantAbility('화술', Math.max(0.01, Math.floor(total / 100) * SELL_ABILITY_PER_100G));
      advanceQuest('sell', total);
      advanceZoneChallenge(getActiveZone(), 'zoneSell', total);
      gainNpcAffinity('상인', Math.max(1, Math.floor(total / 150)));
      updateWeeklyGoal('sell', total);
      return;
    }

    // ── 방류 (fish release) ──────────────────────────────────────────────────
    if (cmd === '!방류') {
      const inv = stateRef.current?.fishInventory ?? [];
      if (inv.length === 0) { addMsg('방류할 물고기가 없습니다.', 'error'); return; }
      setGs(prev => ({ ...prev, fishInventory: [] }));
      addMsg(`🌊 ${inv.length}마리 전체 방류! 생태계 회복에 기여했습니다.`, 'catch');
      return;
    }
    if (input.trim().startsWith('!방류 ')) {
      const fishName = input.trim().slice(4).trim();
      const inv = stateRef.current?.fishInventory ?? [];
      const toRelease = inv.filter(f => f.name === fishName);
      if (toRelease.length === 0) { addMsg(`인벤토리에 ${fishName}이/가 없습니다.`, 'error'); return; }
      const ids = new Set(toRelease.map(f => f.id));
      setGs(prev => ({ ...prev, fishInventory: prev.fishInventory.filter(f => !ids.has(f.id)) }));
      addMsg(`🌊 ${fishName} ${toRelease.length}마리 방류!`, 'catch');
      return;
    }

    if (cmd === '!탐험') {
      const abilities = stateRef.current?.abilities;
      const explored = stateRef.current?.exploredZones ?? [];
      const guildLv = guildInfo?.level ?? 0;
      const curSeasonId = getCurrentSeason()?.id ?? null;
      const furnitureExploreReduction = (stateRef.current?.cottage?.furniture ?? []).reduce((sum, f) => sum + Math.abs(FURNITURE[f.key]?.bonus?.exploreReq ?? 0), 0);
      const unlockable = checkZoneUnlock(abilities, explored, guildLv, curSeasonId, furnitureExploreReduction);
      if (unlockable.length === 0) {
        const allExplored = EXPLORE_ZONES.every(z => explored.includes(z.id));
        if (allExplored) { addMsg('🗺 모든 탐험 구역을 이미 발견했습니다!'); }
        else { addMsg('🗺 아직 조건을 만족하는 새 탐험 구역이 없습니다. 숙련도를 높여보세요!'); }
        return;
      }
      const newZones = unlockable.map(z => z.id);
      setGs(prev => {
        const merged = [...(prev.exploredZones ?? []), ...newZones];
        const prevStats = prev.achStats ?? {};
        const updatedStats = { ...prevStats, zonesFound: merged.length };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        return { ...prev, exploredZones: merged, achStats: updatedStats };
      });
      for (const z of unlockable) {
        addMsg(`🗺 새 구역 발견: ${z.icon} ${z.name}! ${z.benefit}`, 'catch');
        if (gameRef.current) gameRef.current.levelUpEffect = { age: 0 };
        // Show zone story messages with delay
        if (z.story?.length) {
          z.story.forEach((line, i) => {
            setTimeout(() => addMsgRef.current(line, 'catch'), (i + 1) * 1200);
          });
          if (z.questHint) {
            setTimeout(() => addMsgRef.current(`💡 힌트: ${z.questHint}`, 'catch'), (z.story.length + 1) * 1200);
          }
        }
        // Chapter 4 trigger: 고대유적 first visit + all 5 NPC quests complete
        if (z.id === '고대유적') {
          const s = stateRef.current;
          if (!s?.seenChapter4) {
            const npcKeys = ['민준', '수연', '미나', '철수', '은행원'];
            const allQuestsDone = npcKeys.every(k => {
              const step = s?.npcQuestStep?.[k] ?? 0;
              return step >= (NPC_QUESTS[k]?.length ?? 0);
            });
            if (allQuestsDone) {
              const ch4Lines = [
                '[민준] 이곳은... 타이드헤이븐의 창시자들이 남긴 고대 유적이야.',
                '[수연] 전설에 따르면, 이 바다는 한때 신화의 어종들로 가득했다고 해.',
                '[철수] 이 석판에 새겨진 문자... \'바다를 지키는 자에게 영원한 조류가 함께하리라.\'',
                '[미나] 우리 마을이 이 유적 위에 세워진 거였군요. 이제야 모든 게 연결되네요.',
                '[은행원] 이 발견을 기록해 두겠습니다. 타이드헤이븐의 진정한 역사가 시작되는 순간이군요.',
              ];
              const baseDelay = (z.story.length + 2) * 1200;
              ch4Lines.forEach((line, i) => {
                setTimeout(() => addMsgRef.current(line, 'catch'), baseDelay + i * 1800);
              });
              setTimeout(() => {
                setGs(prev => ({ ...prev, seenChapter4: true }));
              }, baseDelay + ch4Lines.length * 1800);
            }
          }
        }
      }
      return;
    }

    if (cmd === '!씨앗') {
      const season = getCurrentSeason();
      const lines = Object.entries(SEEDS).map(([, seedData]) => {
        const seasonOk = !seedData.reqSeason || seedData.reqSeason === season?.id;
        const seasonTag = seedData.reqSeason ? (seasonOk ? ' 🌟' : ' ❌') : '';
        return `${seedData.name} ${seedData.price}G (${Math.round(seedData.growMs/60000)}분, 수확: ${seedData.yield.item})${seasonTag}`;
      });
      addMsg('🌱 씨앗 목록: ' + lines.join(' | '));
      return;
    }

    if (input.trim().startsWith('!심기 ')) {
      const seedKey = input.trim().slice(4).trim();
      if (!nearFarm(player.x, player.y)) { addMsg('🌱 농장 근처로 이동하세요! (지도 동쪽 숲 남쪽)', 'error'); return; }
      const seed = SEEDS[seedKey];
      if (!seed) { addMsg('알 수 없는 씨앗입니다. !씨앗 으로 목록 확인', 'error'); return; }
      // Seasonal seed check
      if (seed.reqSeason) {
        const curSeason = getCurrentSeason();
        if (!curSeason || curSeason.id !== seed.reqSeason) {
          addMsg(`🌱 ${seed.name}은(는) ${seed.seasonDesc}!`, 'error'); return;
        }
      }
      const plots = stateRef.current?.farmPlots ?? [];
      const expCount = stateRef.current?.farmExpansionCount ?? 0;
      const currentMax = MAX_FARM_PLOTS + expCount * FARM_EXPANSION_SLOTS;
      if (plots.length >= currentMax) { addMsg(`🌱 농장 칸이 꽉 찼습니다! (최대 ${currentMax}칸, 농장 탭에서 확장 가능)`, 'error'); return; }
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
      const seasonCropBonus = getCurrentSeason()?.cropYieldBonus ?? 0;
      const gained = {};
      for (const p of ready) {
        const seedData = SEEDS[p.seed];
        if (!seedData) continue;
        const [min, max] = seedData.yield.qty;
        const baseQty = min + Math.floor(Math.random() * (max - min + 1));
        const qty = Math.floor(baseQty * (1 + seasonCropBonus));
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
      // Auto-match: notify if any crop delivery orders can now be fulfilled
      const currentOrders = stateRef.current?.deliveryOrders ?? [];
      const currentCrop = { ...(stateRef.current?.cropInventory ?? {}) };
      for (const [item, qty] of Object.entries(gained)) currentCrop[item] = (currentCrop[item] ?? 0) + qty;
      const matchedOrders = currentOrders.filter(o =>
        !o.completed && o.itemType === 'crop' && (currentCrop[o.item] ?? 0) >= o.qty
      );
      if (matchedOrders.length > 0) {
        const names = matchedOrders.map(o => `${o.npc}: ${o.item} ${o.qty}개`).join(', ');
        addMsg(`📦 납품 가능: ${names} (상점→인벤 탭에서 납품)`, 'info');
      }
      grantAbility('채집', 0.3 * ready.length);
      advanceQuest('farm', totalHarvested);
      setGs(prev => {
        const prevStats = prev.achStats ?? {};
        const newCropLog = { ...(prev.cropLog ?? {}) };
        for (const [item, qty] of Object.entries(gained)) newCropLog[item] = (newCropLog[item] ?? 0) + qty;
        const cropSpecies = Object.keys(newCropLog).filter(k => newCropLog[k] > 0).length;
        const updatedStats = { ...prevStats, cropsHarvested: (prevStats.cropsHarvested ?? 0) + totalHarvested, cropSpecies };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        return { ...prev, achStats: updatedStats, cropLog: newCropLog };
      });
      return;
    }

    if (cmd === '!요리책') {
      const discovered = stateRef.current?.discoveredRecipes ?? [];
      if (discovered.length === 0) {
        addMsg('📖 아직 발견한 레시피가 없습니다. !조합 [재료1] [재료2]... 으로 실험해보세요!', 'info');
        return;
      }
      addMsg(`🍽 발견한 레시피 (${discovered.length}/${Object.keys(DISH_RECIPES).length}종):`);
      discovered.forEach(key => {
        const r = DISH_RECIPES[key];
        if (r) addMsg(`${r.icon} ${r.name}: ${r.desc} → ${r.price}G`);
      });
      return;
    }

    if (input.trim().startsWith('!조합 ')) {
      // Recipe discovery by ingredient experimentation
      const ingredientStr = input.trim().slice(4).trim();
      const ingredients = ingredientStr.split(/\s+/);
      const discovered = stateRef.current?.discoveredRecipes ?? [];
      // Find any undiscovered recipe whose required ingredients all appear in the provided list
      const found = Object.entries(DISH_RECIPES).find(([key, r]) => {
        if (discovered.includes(key)) return false;
        const allCrops = Object.keys(r.crops ?? {});
        const fishName = r.fish?.name ?? null;
        const allRequired = [...allCrops, ...(fishName ? [fishName] : [])];
        return allRequired.length > 0 && allRequired.every(ing => ingredients.includes(ing));
      });
      if (found) {
        const [key, r] = found;
        setGs(prev => ({
          ...prev,
          discoveredRecipes: prev.discoveredRecipes.includes(key) ? prev.discoveredRecipes : [...prev.discoveredRecipes, key],
        }));
        addMsg(`✨ 새 레시피 발견! ${r.icon} ${r.name} — ${r.desc}`, 'catch');
      } else {
        addMsg('🔍 조합에 맞는 레시피를 찾지 못했습니다. 다른 재료를 시도해보세요!', 'info');
      }
      return;
    }

    if (input.trim().startsWith('!요리 ')) {
      const dishKey = input.trim().slice(4).trim();
      const recipe = DISH_RECIPES[dishKey];
      if (!recipe) { addMsg('알 수 없는 요리. !요리책 으로 목록 확인', 'error'); return; }
      // Check NPC affinity requirement
      if (recipe.reqNpc) {
        for (const [npc, reqLv] of Object.entries(recipe.reqNpc)) {
          if ((stateRef.current?.npcAffinity?.[npc] ?? 0) < reqLv) {
            addMsg(`🔒 이 요리는 ${npc}와의 관계 ${reqLv} 이상 필요합니다!`, 'error'); return;
          }
        }
      }
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
      // 요리사 affinity 50+ (제자): 15% chance to cook double
      const cookDoubleChance = (stateRef.current?.npcAffinity?.요리사 ?? 0) >= 50 ? 0.15 : 0;
      const cookedDouble = Math.random() < cookDoubleChance;
      const outfitDishMult = 1 + (FISHING_OUTFITS[stateRef.current?.outfit]?.bonus?.cookPriceMult ?? 0) + (JOBS[stateRef.current?.selectedJob]?.bonus?.cookPriceMult ?? 0);
      // Phase 12-3/12-4: town and job class cook sell bonus
      const townCookSellBonus = 1 + (townBonuses.cookSellBonus ?? 0);
      const jobClassCookSellBonus = 1 + (JOB_CLASSES[stateRef.current?.jobClass]?.bonus?.cookSellBonus ?? 0);
      const dishEarned = Math.round(recipe.price * outfitDishMult * townCookSellBonus * jobClassCookSellBonus * (cookedDouble ? 2 : 1));
      // Consume ingredients and add gold
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
        const newDishLog = { ...(prev.dishLog ?? {}), [dishKey]: ((prev.dishLog ?? {})[dishKey] ?? 0) + 1 };
        const dishSpecies = Object.keys(newDishLog).filter(k => newDishLog[k] > 0).length;
        const updatedStats = { ...prevStats, dishCooked: (prevStats.dishCooked ?? 0) + 1, cookCount: (prevStats.cookCount ?? 0) + 1, dishSpecies, maxMoney: Math.max(prevStats.maxMoney ?? 0, (prev.money ?? 0) + dishEarned) };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        const newDiscovered = (prev.discoveredRecipes ?? []).includes(dishKey)
          ? prev.discoveredRecipes
          : [...(prev.discoveredRecipes ?? []), dishKey];
        return { ...prev, cropInventory: newCrops, fishInventory: newFishInv, money: prev.money + dishEarned, achStats: updatedStats, dishLog: newDishLog, discoveredRecipes: newDiscovered };
      });
      addMsg(`${recipe.icon} ${recipe.name} 완성! +${dishEarned}G${cookedDouble ? ' 🍽 제자 보너스 2배!' : ''}`, 'catch');
      grantAbility('요리', 5);
      advanceQuest('dish', cookedDouble ? 2 : 1);
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
      const fishIdx = s.fishInventory.findIndex(f => f.name === fishName);
      if (fishIdx === -1) { addMsg(`인벤토리에 ${fishName}이/가 없습니다.`, 'error'); return; }
      const fishInfo = FISH[fishName];
      const expGain = Math.max(1, Math.ceil((fishInfo?.price ?? 20) / 40));
      const curExp = typeof (s.petExp ?? {})[activePet] === 'number' ? (s.petExp ?? {})[activePet] : 0;
      const curLevel = typeof (s.petLevels ?? {})[activePet] === 'number' ? (s.petLevels ?? {})[activePet] : 1;
      const newExp = curExp + expGain;
      let newLevel = curLevel;
      for (let lv = curLevel; lv < PET_MAX_LEVEL; lv++) {
        if (newExp >= PET_EXP_THRESHOLDS[lv - 1]) newLevel = lv + 1;
        else break;
      }
      setGs(prev => {
        const newFishInv = [...prev.fishInventory];
        newFishInv.splice(newFishInv.findIndex(f => f.name === fishName), 1);
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

    // ── 파티 명령어 ──────────────────────────────────────────────────────────
    if (input.trim().startsWith('/파티초대 ')) {
      const target = input.trim().slice(6).trim();
      if (!target) { addMsg('/파티초대 [닉네임] 형식으로 입력하세요.', 'error'); return; }
      if (target === nickname) { addMsg('자신을 초대할 수 없습니다.', 'error'); return; }
      const newPartyId = partyIdRef.current ?? `${nickname}_${Date.now()}`;
      sendPartyInvite(newPartyId, nickname, target).then(() => {
        addMsg(`🎉 ${target}님에게 파티 초대를 보냈습니다!`, 'catch');
        if (!partyIdRef.current) {
          setPartyId(newPartyId);
          if (roomId) joinParty(newPartyId, nickname, roomId).catch(() => {});
        }
      });
      return;
    }

    if (cmd === '/파티수락') {
      const invite = pendingInvite;
      if (!invite) { addMsg('대기 중인 파티 초대가 없습니다.', 'error'); return; }
      setPartyId(invite.partyId);
      if (roomId) joinParty(invite.partyId, nickname, roomId).catch(() => {});
      clearPartyInvite(nickname).catch(() => {});
      setPendingInvite(null);
      addMsg(`🎉 ${invite.inviter}님의 파티에 참가했습니다!`, 'catch');
      return;
    }

    if (cmd === '/파티거절') {
      if (!pendingInvite) { addMsg('대기 중인 파티 초대가 없습니다.', 'error'); return; }
      clearPartyInvite(nickname).catch(() => {});
      setPendingInvite(null);
      addMsg('파티 초대를 거절했습니다.', 'catch');
      return;
    }

    if (cmd === '/파티탈퇴') {
      if (!partyIdRef.current) { addMsg('현재 파티에 속해있지 않습니다.', 'error'); return; }
      leaveParty(partyIdRef.current, nickname).catch(() => {});
      setPartyId(null);
      addMsg('파티에서 탈퇴했습니다.', 'catch');
      return;
    }

    if (input.trim().startsWith('/파티 ')) {
      const msg = input.trim().slice(4).trim();
      if (!msg) return;
      if (!partyIdRef.current) { addMsg('파티에 참가해야 사용할 수 있습니다.', 'error'); return; }
      sendPartyMessage(partyIdRef.current, nickname, msg).catch(() => {});
      addMsg(`🟢 [파티] 나: ${msg}`, 'catch');
      return;
    }

    if (cmd.startsWith('!친구추가 ')) {
      const target = input.trim().slice(6).trim();
      if (target) { handleAddFriend(target); return; }
    }
    if (cmd.startsWith('!친구삭제 ')) {
      const target = input.trim().slice(6).trim();
      if (target) { handleRemoveFriend(target); addMsg(`👥 ${target}을(를) 친구 목록에서 제거했습니다.`, 'info'); return; }
    }

    addMsg(`알 수 없는 명령어. !도움말 확인`, 'error');
  }, [addMsg, advanceQuest, grantAbility, gainNpcAffinity, pendingInvite, nickname, roomId, handleAddFriend, handleRemoveFriend]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase 12-1: 펫 진화 ────────────────────────────────────────────────────
  const handlePetEvolve = useCallback((evolvedKey) => {
    const req = EVOLVE_REQUIREMENTS[evolvedKey];
    if (!req) return;
    const s = stateRef.current;
    const petLevel = (s?.petLevels ?? {})[req.basePet] ?? 1;
    if (petLevel < 5) { addMsg('⚠️ 펫 레벨 5 이상이어야 진화할 수 있습니다.', 'error'); return; }
    const gems = (s?.specialItems?.evolutionGem ?? 0);
    const mythics = (s?.specialItems?.mythicOre ?? 0);
    if (gems < req.evolutionGem) { addMsg(`⚠️ 진화석 ${req.evolutionGem}개 필요 (보유: ${gems}개)`, 'error'); return; }
    if (mythics < req.mythicOre) { addMsg(`⚠️ 신화 광석 ${req.mythicOre}개 필요 (보유: ${mythics}개)`, 'error'); return; }
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const newEvolveCount = (prevStats.petEvolveCount ?? 0) + 1;
      const updatedStats = { ...prevStats, petEvolveCount: newEvolveCount };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      return {
        ...prev,
        specialItems: {
          ...(prev.specialItems ?? {}),
          evolutionGem: (prev.specialItems?.evolutionGem ?? 0) - req.evolutionGem,
          mythicOre: (prev.specialItems?.mythicOre ?? 0) - req.mythicOre,
        },
        evolvedPets: { ...(prev.evolvedPets ?? {}), [req.basePet]: evolvedKey },
        achStats: updatedStats,
      };
    });
    addMsg(`✨ ${req.basePet}이(가) ${EVOLVED_PETS[evolvedKey].name}(으)로 진화했습니다!`, 'catch');
  }, [addMsg, checkAndGrantAchievements]);

  // ── Phase 12-4: 전문 직업 선택 ───────────────────────────────────────────
  const handleChooseJobClass = useCallback((className) => {
    if (stateRef.current?.jobClass) { addMsg('전문 직업은 한 번만 선택할 수 있습니다.', 'error'); return; }
    const s = stateRef.current;
    const totalAbil = Object.values(s?.abilities ?? {}).reduce((sum, a) => sum + (a?.value ?? 0), 0);
    if (totalAbil < 200) { addMsg(`⚠️ 어빌리티 합산 200 이상 필요 (현재: ${Math.floor(totalAbil)})`, 'error'); return; }
    const cls = JOB_CLASSES[className];
    if (!cls) return;
    setGs(prev => ({ ...prev, jobClass: className }));
    addMsg(`⭐ 전문 직업 선택: ${cls.name}! ${cls.desc}`, 'catch');
  }, [addMsg]);

  // ── Phase 12-3: 마을 발전 기여 ───────────────────────────────────────────
  const handleTownContribute = useCallback(async (buildingId, itemName, itemType, qty) => {
    const s = stateRef.current;
    if (itemType === 'fish') {
      const fishCount = (s?.fishInventory ?? []).filter(f => f.name === itemName).length;
      if (fishCount < qty) { addMsg(`물고기 인벤토리에 ${itemName}이 부족합니다.`, 'error'); return; }
    } else if (itemType === 'ore') {
      if ((s?.oreInventory?.[itemName] ?? 0) < qty) { addMsg(`광석 인벤토리에 ${itemName}이 부족합니다.`, 'error'); return; }
    } else if (itemType === 'herb') {
      if ((s?.herbInventory?.[itemName] ?? 0) < qty) { addMsg(`허브 인벤토리에 ${itemName}이 부족합니다.`, 'error'); return; }
    }
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const newContrib = (prevStats.townContribCount ?? 0) + qty;
      const updatedStats = { ...prevStats, townContribCount: newContrib };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      let next = { ...prev, achStats: updatedStats, myTownContributions: { ...(prev.myTownContributions ?? {}), [buildingId]: ((prev.myTownContributions ?? {})[buildingId] ?? 0) + qty } };
      if (itemType === 'fish') {
        let skipCount = qty;
        next = { ...next, fishInventory: prev.fishInventory.filter(f => { if (f.name === itemName && skipCount > 0) { skipCount--; return false; } return true; }) };
      } else if (itemType === 'ore') {
        next = { ...next, oreInventory: { ...prev.oreInventory, [itemName]: (prev.oreInventory[itemName] ?? 0) - qty } };
      } else if (itemType === 'herb') {
        next = { ...next, herbInventory: { ...prev.herbInventory, [itemName]: (prev.herbInventory[itemName] ?? 0) - qty } };
      }
      return next;
    });
    try {
      const newLv = await contributeTown(buildingId, qty);
      addMsg(`🏘 ${TOWN_BUILDINGS[buildingId].name} 기여 완료! (${qty}개) 현재 Lv${newLv}`, 'catch');
    } catch {
      addMsg('마을 기여 중 오류가 발생했습니다.', 'error');
    }
    gainNpcAffinity('상인', 0.5);
  }, [addMsg, gainNpcAffinity, checkAndGrantAchievements]);

  // ── Phase 12-5: 포인트 교환 ───────────────────────────────────────────────
  const handlePointExchange = useCallback((itemKey) => {
    const item = POINT_SHOP_ITEMS[itemKey];
    if (!item) return;
    const s = stateRef.current;
    if ((s?.activityPoints ?? 0) < item.cost) { addMsg(`⚠️ 포인트 부족 (필요: ${item.cost}pt)`, 'error'); return; }
    setGs(prev => {
      let next = { ...prev, activityPoints: (prev.activityPoints ?? 0) - item.cost };
      if (item.itemType === 'bait') {
        next = { ...next, baitInventory: { ...(prev.baitInventory ?? {}), [item.itemKey]: ((prev.baitInventory ?? {})[item.itemKey] ?? 0) + item.qty }, ownedBait: prev.ownedBait?.includes(item.itemKey) ? prev.ownedBait : [...(prev.ownedBait ?? []), item.itemKey] };
      } else if (item.itemType === 'special') {
        next = { ...next, specialItems: { ...(prev.specialItems ?? {}), [item.itemKey]: ((prev.specialItems ?? {})[item.itemKey] ?? 0) + item.qty } };
      } else if (item.itemType === 'rodSkin') {
        next = { ...next, ownedRodSkins: prev.ownedRodSkins?.includes(item.itemKey) ? prev.ownedRodSkins : [...(prev.ownedRodSkins ?? []), item.itemKey] };
      } else if (item.itemType === 'furniture') {
        next = { ...next, ownedSpecialFurniture: [...(prev.ownedSpecialFurniture ?? []).filter(d => d !== item.itemKey), item.itemKey] };
      } else if (item.itemType === 'consumable' && item.itemKey === 'expPotion') {
        const newAbilities = Object.fromEntries(Object.entries(prev.abilities ?? {}).map(([k, v]) => [k, { ...v, value: (v?.value ?? 0) + 5 }]));
        next = { ...next, abilities: newAbilities };
      } else if (item.itemType === 'spotDeco') {
        next = { ...next, spotDecos: [...(prev.spotDecos ?? []).filter(d => d !== item.itemKey), item.itemKey] };
      } else if (item.itemType === 'title') {
        next = { ...next, ownedPointTitles: [...(prev.ownedPointTitles ?? []).filter(t => t !== item.itemKey), item.itemKey] };
      }
      return next;
    });
    addMsg(`✅ ${item.name} 교환 완료! (-${item.cost}pt)`, 'catch');
  }, [addMsg]);

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
    const furnitureEnhBonus = (gs.cottage?.furniture ?? []).reduce((sum, f) => sum + (FURNITURE[f.key]?.bonus?.enhanceBonus ?? 0), 0);
    const rate = Math.min(0.98, pickaxeEnhanceSuccessRate(enhLevel, gs.abilities?.강화?.value ?? 0) + furnitureEnhBonus);
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
    advanceZoneChallenge(getActiveZone(), 'zoneSell', total);
    gainNpcAffinity('상인', Math.max(1, Math.floor(total / 150)));
  };

  const sellOne = (id) => {
    const fish = gs.fishInventory.find(f => f.id === id);
    if (!fish) return;
    setGs(prev => {
      const prevStats = prev.achStats ?? {};
      const updatedStats = { ...prevStats, totalSold: (prevStats.totalSold ?? 0) + fish.price, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + fish.price) };
      setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
      return { ...prev, money: prev.money + fish.price, fishInventory: prev.fishInventory.filter(f => f.id !== id), achStats: updatedStats };
    });
    grantAbility('화술', Math.max(0.01, Math.floor(fish.price / 100) * SELL_ABILITY_PER_100G));
    advanceQuest('sell', fish.price);
    advanceZoneChallenge(getActiveZone(), 'zoneSell', fish.price);
    gainNpcAffinity('상인', Math.max(1, Math.floor(fish.price / 150)));
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
    const initMsgs = [
      { type: 'system', text: `🌊 [${title}]에 입장했습니다!` },
      { type: 'system', text: `👤 ${nickname} · 방향키로 이동 · !도움말` },
    ];
    // Season story: show once per season
    const season = getCurrentSeason();
    if (season) {
      const alreadyShown = (stateRef.current?.shownSeasonStories ?? []).includes(season.id);
      if (!alreadyShown && season.story?.length) {
        season.story.forEach((line, i) => {
          setTimeout(() => addMsgRef.current(line, 'catch'), (i + 1) * 1500);
        });
        setGs(prev => ({
          ...prev,
          shownSeasonStories: [...(prev.shownSeasonStories ?? []), season.id],
        }));
      }
    }
    setMessages(initMsgs);
    // Show tutorial for new players
    if (!stateRef.current?.tutorialDone) {
      setTimeout(() => setTutorialStep(1), 800);
    }
    // Phase 12-2: Festival trigger on first season entry
    const currentSeasonForFestival = getCurrentSeason();
    if (currentSeasonForFestival) {
      const alreadyFestivaled = (stateRef.current?.festivalSeasonSeen ?? []).includes(currentSeasonForFestival.id);
      if (!alreadyFestivaled) {
        const festEndDate = Date.now() + 72 * 60 * 60 * 1000;
        setGs(prev => ({
          ...prev,
          festivalEndDate: festEndDate,
          festivalSeasonSeen: [...(prev.festivalSeasonSeen ?? []), currentSeasonForFestival.id],
        }));
        setTimeout(() => addMsgRef.current(`🎉 ${currentSeasonForFestival.festival?.name ?? currentSeasonForFestival.name} 축제 시작! 72시간 특별 보너스!`, 'catch'), 2000);
      }
    }
  };

  const takeOver = () => {
    channelRef.current?.postMessage({ type: 'gameStart', tabId: tabId.current });
    setBlocked(false);
  };

  const checkNpcQuest = useCallback((npcKey) => {
    const s = stateRef.current;
    const quests = NPC_QUESTS[npcKey];
    if (!quests) return;
    const step = s.npcQuestStep?.[npcKey] ?? 0;
    if (step >= quests.length) {
      addMsg(`💬 ${npcKey}: "모든 의뢰를 완수했어요! 앞으로도 잘 부탁해요."`, 'info');
      return;
    }
    const quest = quests[step];
    if (quest.condition(s)) {
      // Complete quest
      const reward = quest.reward ?? {};
      setGs(prev => {
        let next = { ...prev, npcQuestStep: { ...(prev.npcQuestStep ?? {}), [npcKey]: step + 1 } };
        if (reward.money) next = { ...next, money: next.money + reward.money };
        if (reward.item) {
          const { type, key, qty = 1 } = reward.item;
          if (type === 'bait') {
            next = {
              ...next,
              baitInventory: { ...(next.baitInventory ?? {}), [key]: ((next.baitInventory ?? {})[key] ?? 0) + qty },
              ownedBait: next.ownedBait?.includes(key) ? next.ownedBait : [...(next.ownedBait ?? []), key],
            };
          } else if (type === 'oreInventory') {
            next = { ...next, oreInventory: { ...next.oreInventory, [key]: (next.oreInventory[key] ?? 0) + qty } };
          }
        }
        if (reward.rodSkin && !(next.rodSkins ?? []).includes(reward.rodSkin)) {
          next = { ...next, rodSkins: [...(next.rodSkins ?? []), reward.rodSkin] };
          // Map display name → ROD_SKINS key so the skin can be equipped from the shop panel
          const rodSkinKeyMap = { '황금낚싯대 스킨': '황금스킨', '광부낚싯대 스킨': '광부스킨' };
          const equipKey = rodSkinKeyMap[reward.rodSkin];
          if (equipKey && !(next.ownedRodSkins ?? ['기본스킨']).includes(equipKey)) {
            next = { ...next, ownedRodSkins: [...(next.ownedRodSkins ?? ['기본스킨']), equipKey] };
          }
        }
        if (reward.costume && !(next.ownedCostumes ?? []).includes(reward.costume)) {
          next = { ...next, ownedCostumes: [...(next.ownedCostumes ?? []), reward.costume] };
        }
        // Compute npcQuestS2Count for outer NPC achievements
        const OUTER_NPC_KEYS = ['행상인','노련한광부','산신령','심해탐험가','어시장상인','선장','유물학자','설인'];
        const newStep = (next.npcQuestStep ?? {})[npcKey] ?? 0;
        const npcQuestS2Count = OUTER_NPC_KEYS.filter(k => ((k === npcKey ? newStep : (next.npcQuestStep?.[k] ?? 0)) >= (NPC_QUESTS[k]?.length ?? 0)) && OUTER_NPC_KEYS.includes(k)).length;
        const npcAt50 = Object.values(next.npcAffinity ?? {}).filter(v => v >= 50).length;
        const npcQuestS2Full = npcQuestS2Count >= 8 && npcAt50 >= 10 ? 1 : 0;
        const prevStats = next.achStats ?? {};
        const updatedStats = {
          ...prevStats,
          maxMoney: Math.max(prevStats.maxMoney ?? 0, next.money),
          npcQuestS2Count,
          npcQuestS2Full,
        };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        next = { ...next, achStats: updatedStats };
        return next;
      });
      addMsg(`📜 [${npcKey} 의뢰] ${quest.dialogue[1]}`, 'catch');
      addMsg(`🎁 의뢰 완수! 보상: ${quest.rewardLabel}`, 'catch');
      playLevelUp();
    } else {
      // Show current quest objective
      const nextQuest = quests[step];
      addMsg(`📋 [${npcKey} 의뢰 ${step + 1}/${quests.length}] ${nextQuest.title}`, 'info');
      addMsg(`💬 ${nextQuest.dialogue[0]}`, 'info');
      addMsg(`📌 ${nextQuest.hint(s)}`, 'info');
    }
  }, [addMsg, stateRef, checkAndGrantAchievements]);

  const handlePrestige = useCallback(() => {
    const playerState = gameRef.current?.player?.state;
    if (playerState && playerState !== 'idle') {
      addMsg('낚시/채굴/채집 중에는 프레스티지를 사용할 수 없습니다.', 'system');
      setShowPrestigeConfirm(false);
      return;
    }
    // Read from stateRef (current snapshot) to avoid stale closure; capture for Firebase write
    const s = stateRef.current ?? {};
    const newCount = (s.prestigeCount ?? 0) + 1;
    const newBonus = (s.prestigePermanentSellBonus ?? 0) + 0.02;
    // Mark pending BEFORE reset so crash recovery (useEffect above) can complete it
    setGs(prev => ({ ...prev, prestigePending: true }));
    setGs(prev => {
      const resetAbils = Object.fromEntries(Object.keys(prev.abilities ?? {}).map(k => [k, { value: 0, grade: 0 }]));
      return {
        ...prev,
        prestigeCount: newCount,
        prestigePermanentSellBonus: newBonus,
        prestigePending: false,
        abilities: resetAbils,
        selectedJob: null,
      };
    });
    addMsg(`🌟 뉴 타이드+ 달성! 영구 판매가 +2% 획득. (프레스티지 ${newCount}회)`, 'catch');
    if (nicknameRef.current) savePrestigeRecord(nicknameRef.current, newCount);
    setShowPrestigeConfirm(false);
  }, [addMsg, stateRef]);

  // ── NPC 대화 행동 처리 ─────────────────────────────────────────────────────
  const handleNpcDialogAction = useCallback((npcKey, actionId) => {
    const INDOOR_NPC_KEY = { 민준: '상인', 수연: '요리사', 미나: '여관주인', 철수: '채굴사', 은행원: '은행원' };
    if (actionId === 'chat_affinity') {
      const affinityKey = INDOOR_NPC_KEY[npcKey] ?? npcKey;
      gainNpcAffinity(affinityKey, 0.5);
      return; // stay in dialogue
    }
    setNpcDialog(null);
    if (actionId === 'shop') {
      setShowShop(true);
      setTimeout(() => checkNpcQuest('민준'), 0);
    } else if (actionId === 'cook') {
      const s = stateRef.current;
      const cw = s?.cookware;
      if (!cw) { addMsg('🍳 요리 도구가 없습니다. 상점에서 구매하세요!', 'error'); return; }
      const baseMult = COOKWARE[cw]?.mult ?? 1;
      const cookAbil = s?.abilities?.요리?.value ?? 0;
      const totalMult = baseMult + cookAbil * 0.01;
      const raw = s.fishInventory.filter(f => !f.cooked);
      if (raw.length === 0) { addMsg('🍳 수연: "요리할 생선이 없네요!"'); return; }
      setGs(prev => {
        const newSpXP3 = (prev.seasonPassXP ?? 0) + 2;
        const prevStats = prev.achStats ?? {};
        const updatedStats = { ...prevStats, cookCount: (prevStats.cookCount ?? 0) + raw.length };
        setTimeout(() => checkAndGrantAchievements(updatedStats), 0);
        return {
          ...prev,
          fishInventory: prev.fishInventory.map(f =>
            f.cooked ? f : { ...f, price: Math.round(f.price * totalMult), cooked: true }
          ),
          seasonPassXP: newSpXP3,
          seasonPassTier: Math.min(10, Math.floor(newSpXP3 / 50)),
          achStats: updatedStats,
        };
      });
      addMsg(`🍳 수연이 생선 ${raw.length}마리를 요리해줬어요! (x${totalMult.toFixed(2)})`, 'catch');
      playCookComplete();
      const cookAffinityMult2 = (stateRef.current?.npcAffinity?.요리사 ?? 0) >= 20 ? 1.20 : 1.0;
      grantAbility('요리', COOK_ABILITY_GAIN * raw.length * cookAffinityMult2);
      advanceQuest('cook', raw.length);
      gainNpcAffinity('요리사', 3);
      setTimeout(() => checkNpcQuest('수연'), 0);
    } else if (actionId === 'rest') {
      const s = stateRef.current;
      const lastRest = s?.innRestAt ?? 0;
      const cooldownMs = 60 * 60 * 1000;
      if (Date.now() - lastRest < cooldownMs) {
        const remainMin = Math.ceil((cooldownMs - (Date.now() - lastRest)) / 60000);
        addMsg(`🏨 미나: "아직 피로가 덜 쌓였어요! ${remainMin}분 후에 다시 오세요."`, 'info');
      } else {
        const innAffinity = s?.npcAffinity?.여관주인 ?? 0;
        const innStaminaBonus = innAffinity >= 20 ? 1.0 : 0;
        addMsg('🏨 미나: "편히 쉬고 가세요! 내일 퀘스트도 화이팅~"', 'info');
        addMsg(`💤 여관에서 휴식했습니다. 체력 어빌리티 +${0.5 + innStaminaBonus}!`, 'catch');
        grantAbility('체력', 0.5 + innStaminaBonus);
        gainNpcAffinity('여관주인', 1.5);
        setGs(prev => {
          const prevStats = prev.achStats ?? {};
          return { ...prev, innRestAt: Date.now(), achStats: { ...prevStats, innVisits: (prevStats.innVisits ?? 0) + 1 } };
        });
      }
      const buff = stateRef.current?.innBuff;
      if (buff && Date.now() < buff.expiresAt) {
        const remain = Math.ceil((buff.expiresAt - Date.now()) / 60000);
        addMsg(`✨ 휴식 버프 활성 중: 낚시 속도 +20% (${remain}분 남음)`, 'catch');
      } else {
        addMsg('💰 500G로 특별 휴식 가능! (!여관휴식) → 낚시 속도 10분 +20%', 'info');
      }
      setTimeout(() => checkNpcQuest('미나'), 0);
    } else if (actionId === 'appearance') {
      setShowAppearance(true);
    } else if (actionId === 'ores') {
      const inv = stateRef.current?.oreInventory ?? {};
      const lines = Object.entries(inv).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}개`);
      if (lines.length > 0) {
        addMsg(`⛏ 철수: "현재 광석: ${lines.join(', ')}. 상점에서 팔 수 있어요!"`, 'info');
      } else {
        addMsg('⛏ 철수: "광산에서 광석을 캐보세요! 희귀할수록 값이 비싸답니다."', 'info');
      }
      gainNpcAffinity('채굴사', 1);
      setTimeout(() => checkNpcQuest('철수'), 0);
    } else if (actionId === 'bank') {
      setShowBank(true);
      gainNpcAffinity('은행원', 1.5);
      setTimeout(() => checkNpcQuest('은행원'), 0);
    // ── Zone traveling NPC actions ─────────────────────────────────────────
    } else if (actionId === 'traveling_shop') {
      addMsg('🧳 행상인: "좋은 물건 많이 골라가세요! 초원 특별가로 드려요~"', 'info');
      setShowShop(true);
      gainNpcAffinity('행상인', 1);
    } else if (actionId === 'ore_appraise') {
      const s = stateRef.current;
      const inv = s?.oreInventory ?? {};
      const entries = Object.entries(inv).filter(([, n]) => n > 0);
      if (entries.length === 0) {
        addMsg('🪨 노련한 광부: "광석이 없네. 동쪽 절벽 광산에서 좀 캐와봐!"', 'info');
      } else {
        const top = entries.sort(([a], [b]) => (ORES[b]?.value ?? 0) - (ORES[a]?.value ?? 0))[0];
        const oreVal = ORES[top[0]]?.value ?? 0;
        addMsg(`🪨 노련한 광부: "${top[0]} ${top[1]}개 — 개당 시가 ${oreVal}G 정도 나가는 좋은 광석이야!"`, 'info');
        gainNpcAffinity('노련한광부', 2);
        setGs(prev => {
          const prevStats = prev.achStats ?? {};
          return { ...prev, achStats: { ...prevStats, oreAppraiseCount: (prevStats.oreAppraiseCount ?? 0) + 1 } };
        });
      }
    } else if (actionId === 'pickaxe_repair') {
      const s = stateRef.current;
      if ((s?.money ?? 0) < 200) {
        addMsg('🪨 노련한 광부: "수리비 200G가 필요해. 돈이 부족하군!"', 'error');
      } else {
        setGs(prev => ({ ...prev, money: prev.money - 200 }));
        addMsg('🔧 노련한 광부가 곡괭이를 수리해줬습니다. (-200G) 채굴 속도 잠시 향상!', 'catch');
        gainNpcAffinity('노련한광부', 3);
      }
    } else if (actionId === 'mountain_buff') {
      const today = new Date().toLocaleDateString('ko-KR');
      if ((stateRef.current?.sanSinryeongBuffDate ?? '') === today) {
        addMsg('🌫 산신령: "산의 기운은 하루에 한 번이면 충분하니라. 내일 다시 오거라."', 'info');
      } else {
        const buffs = ['낚시 속도 +15%', '채굴 속도 +15%', '판매가 +15%'];
        const buffIdx = Math.floor(Math.random() * buffs.length);
        const buffType = ['fishSpeed', 'mineSpeed', 'sellPrice'][buffIdx];
        const buffLabel = buffs[buffIdx];
        addMsg(`🌫 산신령: "산의 기운을 받아라... (${buffLabel} 30분)"`, 'catch');
        setGs(prev => {
          const prevStats = prev.achStats ?? {};
          return {
            ...prev,
            sanSinryeongBuffDate: today,
            mountainBuff: { type: buffType, label: buffLabel, expiresAt: Date.now() + 30 * 60 * 1000 },
            achStats: { ...prevStats, mountainBuffCount: (prevStats.mountainBuffCount ?? 0) + 1 },
          };
        });
        gainNpcAffinity('산신령', 5);
      }
    } else if (actionId === 'deep_quest') {
      const s = stateRef.current;
      const mythics = (s?.fishInventory ?? []).filter(f => f.rarity === '신화');
      if (mythics.length === 0) {
        addMsg('🤿 심해 탐험가: "아직 신화급 물고기를 못 잡았군요! 심해에서 도전해보세요~"', 'info');
      } else {
        const reward = mythics.length * 3000;
        addMsg(`🤿 심해 탐험가: "와! 신화급 ${mythics.length}마리! 기록 등록 완료! 보상 ${reward}G 드릴게요!"`, 'catch');
        setGs(prev => ({
          ...prev,
          money: prev.money + reward,
          fishInventory: prev.fishInventory.filter(f => f.rarity !== '신화'),
        }));
        gainNpcAffinity('심해탐험가', 10);
      }
    // ── Phase 13: New zone NPC actions ──────────────────────────────────────
    } else if (actionId === 'sell_market') {
      // 어시장상인: sell all fish at +20% bonus
      const s = stateRef.current;
      const fishList = (s?.fishInventory ?? []);
      if (fishList.length === 0) {
        addMsg('🐟 어시장 상인: "생선을 가져오시면 시장 도매가로 사들이겠습니다!"', 'info');
      } else {
        const totalEarned = fishList.reduce((sum, f) => sum + Math.round(f.price * 1.2), 0);
        addMsg(`🐟 어시장 상인: "신선한 생선 ${fishList.length}마리를 시장가로 구매했습니다! (+20% 보너스, +${totalEarned}G)"`, 'catch');
        setGs(prev => {
          const earned = (prev.fishInventory ?? []).reduce((sum, f) => sum + Math.round(f.price * 1.2), 0);
          const prevStats = prev.achStats ?? {};
          const newHarborTotal = (prev.harborFishSellTotal ?? 0) + earned;
          return {
            ...prev,
            money: prev.money + earned,
            fishInventory: [],
            harborFishSellTotal: newHarborTotal,
            achStats: { ...prevStats, totalGoldEarned: (prevStats.totalGoldEarned ?? 0) + earned },
          };
        });
        gainNpcAffinity('어시장상인', 2);
      }
    } else if (actionId === 'captain_chat') {
      const lines = [
        '⚓ 선장: "이 항구는 30년 전 내가 처음 발견한 곳이라오. 폭풍 속에서 살아남은 기억이 지금도 생생하지."',
        '⚓ 선장: "항구 마을의 생선은 최고지! 특히 항구왕새우는 전설이라오. 아직 본 사람이 드물어..."',
        '⚓ 선장: "심해 저편에 더 큰 바다가 있다고 들었소. 언젠가 같이 탐험해보지 않겠소?"',
      ];
      addMsg(lines[Math.floor(Math.random() * lines.length)], 'info');
      gainNpcAffinity('선장', 1);
      setGs(prev => {
        const prevStats = prev.achStats ?? {};
        return { ...prev, achStats: { ...prevStats, captainChatCount: (prevStats.captainChatCount ?? 0) + 1 } };
      });
    } else if (actionId === 'appraise_artifact') {
      const s = stateRef.current;
      const ancientOre = s?.oreInventory?.고대광석 ?? 0;
      if (ancientOre === 0) {
        addMsg('🏺 유물학자: "고대 광석이 있다면 제가 감정해 드리겠습니다. 신전 내부 채굴 구역을 탐색해보세요!"', 'info');
      } else {
        const reward = ancientOre * 1200;
        addMsg(`🏺 유물학자: "고대 광석 ${ancientOre}개! 이것들은 고대 문명의 흔적입니다. 연구비로 ${reward}G를 드리죠!"`, 'catch');
        setGs(prev => {
          const prevStats = prev.achStats ?? {};
          return {
            ...prev,
            money: prev.money + reward,
            oreInventory: { ...prev.oreInventory, 고대광석: 0 },
            achStats: { ...prevStats, ancientOreAppraised: (prevStats.ancientOreAppraised ?? 0) + ancientOre },
          };
        });
        gainNpcAffinity('유물학자', 5);
      }
    } else if (actionId === 'warm_drink') {
      const today = new Date().toLocaleDateString('ko-KR');
      if ((stateRef.current?.setiDrinkDate ?? '') === today) {
        addMsg('❄️ 설인: "따뜻한 음료는 하루에 한 잔이면 충분해요. 내일 또 오세요!"', 'info');
      } else {
        addMsg('❄️ 설인: "이 차가운 산에 잘 오셨어요. 특제 따뜻한 음료를 드릴게요! 체력이 회복될 거예요."', 'catch');
        grantAbility('체력', 2);
        setGs(prev => {
          const prevStats = prev.achStats ?? {};
          return {
            ...prev,
            setiDrinkDate: today,
            achStats: { ...prevStats, warmDrinkCount: (prevStats.warmDrinkCount ?? 0) + 1 },
          };
        });
        gainNpcAffinity('설인', 3);
      }
    // ── Phase 16-5: 외곽 NPC S2 의뢰 확인 ────────────────────────────────────
    } else if (actionId === 'npc_s2_quest') {
      setTimeout(() => checkNpcQuest(npcKey), 0);
    }
  }, [addMsg, grantAbility, advanceQuest, gainNpcAffinity, checkNpcQuest, checkAndGrantAchievements, stateRef]);

  // Phase 15-2: NPC 선물 시스템
  const handleNpcGift = useCallback((npcKey, itemKey, itemType) => {
    const s = stateRef.current;
    const today = new Date().toDateString();
    if ((s?.npcGiftDate ?? '') !== today) {
      // Reset gift count for new day
      setGs(prev => ({ ...prev, npcGiftDate: today, npcGiftCountToday: 0 }));
    }
    const giftCount = (s?.npcGiftDate ?? '') === today ? (s?.npcGiftCountToday ?? 0) : 0;
    if (giftCount >= 3) {
      addMsg(`💝 오늘은 이미 선물을 3번 드렸어요. 내일 다시 와주세요!`, 'info');
      return;
    }
    const npcDef = NPCS[npcKey];
    if (!npcDef) return;
    const prefs = npcDef.giftPrefs;
    if (!prefs) return;
    // Check if player has the item
    let hasItem = false;
    let removeItem = null;
    if (itemType === 'fish') {
      const fish = (s?.fishInventory ?? []).find(f => f.name === itemKey);
      if (fish) { hasItem = true; removeItem = { type: 'fish', id: fish.id }; }
    } else if (itemType === 'ore') {
      if ((s?.oreInventory?.[itemKey] ?? 0) >= 1) { hasItem = true; removeItem = { type: 'ore', key: itemKey }; }
    } else if (itemType === 'herb') {
      if ((s?.herbInventory?.[itemKey] ?? 0) >= 1) { hasItem = true; removeItem = { type: 'herb', key: itemKey }; }
    } else if (itemType === 'crop') {
      if ((s?.cropInventory?.[itemKey] ?? 0) >= 1) { hasItem = true; removeItem = { type: 'crop', key: itemKey }; }
    }
    if (!hasItem) {
      addMsg(`💝 선물로 줄 ${itemKey}이(가) 없어요.`, 'error');
      return;
    }
    const isFavorite = itemKey === prefs.favoriteItem;
    const affinityGain = isFavorite ? prefs.favoriteGain : prefs.likedGain;
    // Remove item from inventory
    setGs(prev => {
      let next = { ...prev };
      if (removeItem?.type === 'fish') {
        next = { ...next, fishInventory: prev.fishInventory.filter(f => f.id !== removeItem.id) };
      } else if (removeItem?.type === 'ore') {
        next = { ...next, oreInventory: { ...prev.oreInventory, [removeItem.key]: Math.max(0, (prev.oreInventory?.[removeItem.key] ?? 0) - 1) } };
      } else if (removeItem?.type === 'herb') {
        next = { ...next, herbInventory: { ...prev.herbInventory, [removeItem.key]: Math.max(0, (prev.herbInventory?.[removeItem.key] ?? 0) - 1) } };
      } else if (removeItem?.type === 'crop') {
        next = { ...next, cropInventory: { ...prev.cropInventory, [removeItem.key]: Math.max(0, (prev.cropInventory?.[removeItem.key] ?? 0) - 1) } };
      }
      const newTotal = (prev.npcGiftTotalCount ?? 0) + 1;
      const newFavorite = isFavorite ? (prev.npcGiftFavoriteCount ?? 0) + 1 : (prev.npcGiftFavoriteCount ?? 0);
      const newStats = { ...(prev.achStats ?? {}), npcGiftTotal: newTotal, npcGiftFavorite: newFavorite };
      setTimeout(() => checkAndGrantAchievements(newStats), 0);
      return {
        ...next,
        npcGiftDate: today,
        npcGiftCountToday: giftCount + 1,
        npcGiftTotalCount: newTotal,
        npcGiftFavoriteCount: newFavorite,
        achStats: newStats,
      };
    });
    gainNpcAffinity(npcKey, affinityGain);
    const npcIcon = npcDef.icon ?? '🧑';
    const npcName = npcDef.name ?? npcKey;
    if (isFavorite) {
      addMsg(`${npcIcon} ${npcName}: "어머! 이게 정말요?! 정말 좋아하는 선물이에요!" 💝 (친밀도 +${affinityGain})`, 'catch');
    } else {
      addMsg(`${npcIcon} ${npcName}: "고마워요, 정말 감사해요!" (친밀도 +${affinityGain})`, 'info');
    }
  }, [addMsg, gainNpcAffinity, checkAndGrantAchievements, stateRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 15-5: 오두막 업그레이드
  const handleCottageUpgrade = useCallback((targetLevel) => {
    const s = stateRef.current;
    const currentLevel = s?.cottageLevel ?? 1;
    if (targetLevel !== currentLevel + 1) {
      addMsg('오두막은 순서대로 업그레이드해야 합니다.', 'error');
      return;
    }
    const req = COTTAGE_UPGRADE_REQS[targetLevel];
    if (!req) return;
    // Check money
    if ((s?.money ?? 0) < req.money) {
      addMsg(`💰 골드가 부족합니다. 필요: ${req.money.toLocaleString()}G`, 'error');
      return;
    }
    // Check ore
    for (const [ore, qty] of Object.entries(req.ore ?? {})) {
      if ((s?.oreInventory?.[ore] ?? 0) < qty) {
        addMsg(`⛏ ${ore}이(가) 부족합니다. 필요: ${qty}개`, 'error');
        return;
      }
    }
    // Check fish items
    for (const fishName of (req.fish ?? [])) {
      if (!(s?.fishInventory ?? []).some(f => f.name === fishName)) {
        addMsg(`🐟 ${fishName}이(가) 인벤토리에 없습니다.`, 'error');
        return;
      }
    }
    // Deduct resources and upgrade
    setGs(prev => {
      let next = { ...prev, money: prev.money - req.money, cottageLevel: targetLevel };
      for (const [ore, qty] of Object.entries(req.ore ?? {})) {
        next = { ...next, oreInventory: { ...next.oreInventory, [ore]: Math.max(0, (next.oreInventory?.[ore] ?? 0) - qty) } };
      }
      for (const fishName of (req.fish ?? [])) {
        const idx = next.fishInventory.findIndex(f => f.name === fishName);
        if (idx >= 0) next = { ...next, fishInventory: [...next.fishInventory.slice(0, idx), ...next.fishInventory.slice(idx + 1)] };
      }
      const newStats = { ...(prev.achStats ?? {}), cottageLevel: targetLevel };
      setTimeout(() => checkAndGrantAchievements(newStats), 0);
      return { ...next, achStats: newStats };
    });
    addMsg(`🏠 오두막이 레벨 ${targetLevel}로 업그레이드됐습니다!`, 'catch');
  }, [addMsg, checkAndGrantAchievements, stateRef]); // eslint-disable-line react-deps

  // Phase 16-2: Artisan Workbench craft
  const handleArtisanCraft = useCallback((recipeKey) => {
    const s = stateRef.current;
    const recipe = ARTISAN_RECIPES[recipeKey];
    if (!recipe) return;
    // Check gold
    if ((s?.money ?? 0) < recipe.craftPrice) {
      addMsg(`💰 골드가 부족합니다. 필요: ${recipe.craftPrice.toLocaleString()}G`, 'error');
      return;
    }
    // Check ore
    for (const [ore, qty] of Object.entries(recipe.input.ore ?? {})) {
      if ((s?.oreInventory?.[ore] ?? 0) < qty) {
        addMsg(`⛏ ${ore}이(가) 부족합니다. 필요: ${qty}개`, 'error');
        return;
      }
    }
    // Check fish
    for (const fishName of (recipe.input.fish ?? [])) {
      if (!(s?.fishInventory ?? []).some(f => f.name === fishName)) {
        addMsg(`🐟 ${fishName}이(가) 인벤토리에 없습니다.`, 'error');
        return;
      }
    }
    // Check herb
    for (const [herb, qty] of Object.entries(recipe.input.herb ?? {})) {
      if ((s?.herbInventory?.[herb] ?? 0) < qty) {
        addMsg(`🌿 ${herb}이(가) 부족합니다. 필요: ${qty}개`, 'error');
        return;
      }
    }
    setGs(prev => {
      let next = { ...prev, money: prev.money - recipe.craftPrice };
      for (const [ore, qty] of Object.entries(recipe.input.ore ?? {})) {
        next = { ...next, oreInventory: { ...next.oreInventory, [ore]: Math.max(0, (next.oreInventory?.[ore] ?? 0) - qty) } };
      }
      for (const fishName of (recipe.input.fish ?? [])) {
        const idx = next.fishInventory.findIndex(f => f.name === fishName);
        if (idx >= 0) next = { ...next, fishInventory: [...next.fishInventory.slice(0, idx), ...next.fishInventory.slice(idx + 1)] };
      }
      for (const [herb, qty] of Object.entries(recipe.input.herb ?? {})) {
        next = { ...next, herbInventory: { ...next.herbInventory, [herb]: Math.max(0, (next.herbInventory?.[herb] ?? 0) - qty) } };
      }
      // Give output
      const out = recipe.output;
      if (out.type === 'ore') {
        next = { ...next, oreInventory: { ...next.oreInventory, [out.key]: (next.oreInventory?.[out.key] ?? 0) + (out.qty ?? 1) } };
      } else if (out.type === 'bait') {
        next = { ...next, baitInventory: { ...(next.baitInventory ?? {}), [out.key]: ((next.baitInventory?.[out.key] ?? 0)) + (out.qty ?? 1) } };
      } else if (out.type === 'jewelry') {
        // Add to jewelry inventory (same as existing jewelry)
        next = { ...next, jewelry: [...(next.jewelry ?? []), { key: out.key, name: recipe.name, bonus: out.bonus }] };
      }
      const craftCount = (prev.artisanLog?.[recipeKey] ?? 0) + 1;
      const artisanLog = { ...(prev.artisanLog ?? {}), [recipeKey]: craftCount };
      const totalCrafts = Object.values(artisanLog).reduce((s, v) => s + v, 0);
      const uniqueRecipes = Object.keys(artisanLog).length;
      const newStats = { ...(prev.achStats ?? {}), artisanCraftCount: totalCrafts, artisanUniqueCount: uniqueRecipes };
      setTimeout(() => checkAndGrantAchievements(newStats), 0);
      return { ...next, artisanLog, achStats: newStats };
    });
    addMsg(`🔨 ${recipe.name} 제작 완료!`, 'catch');
  }, [addMsg, checkAndGrantAchievements, stateRef]);

  // Phase 14: claim zone challenge reward
  const claimZoneChallenge = useCallback((zone) => {
    const challenge = getZoneDailyChallenge(zone);
    if (!challenge) return;
    setGs(prev => {
      const zcp = { ...(prev.zoneChallengeProgress ?? {}) };
      const entry = zcp[zone];
      if (!entry || entry.claimed || (entry.progress ?? 0) < challenge.goal) return prev;
      zcp[zone] = { ...entry, claimed: true };
      const reward = challenge.reward ?? {};
      const newMastery = reward.masteryExp
        ? { ...(prev.zoneMastery ?? {}), [zone]: (prev.zoneMastery?.[zone] ?? 0) + reward.masteryExp }
        : (prev.zoneMastery ?? {});
      setTimeout(() => addMsg(`🎁 [${zone}] 챌린지 보상: +${reward.money ?? 0}G, 숙련도 +${reward.masteryExp ?? 0}exp`, 'catch'), 0);
      return {
        ...prev,
        money: prev.money + (reward.money ?? 0),
        zoneMastery: newMastery,
        zoneChallengeProgress: zcp,
      };
    });
  }, [addMsg]);

  const handleNpcInteract = useCallback((npcName) => {
    playNpcInteract();
    // 대화창 열기 + 첫 접촉 친밀도 소량 부여
    const npcAffinityKey = npcName === '민준' ? '상인' : npcName === '수연' ? '요리사' : npcName === '미나' ? '여관주인' : npcName === '철수' ? '채굴사' : '은행원';
    gainNpcAffinity(npcAffinityKey, 0.3);
    // Phase 12-2: festival NPC greeting (NPC별 고유 대사)
    if (isFestivalActive(stateRef.current)) {
      const festName = getCurrentSeason()?.festival?.name ?? '축제';
      const festGreetings = {
        민준: `🎉 [${festName}] 민준: "축제 기간엔 물고기 판매가도 오르고 희귀어 확률도 높아져요! 많이 잡아서 팔아드릴게요~"`,
        수연: `🎉 [${festName}] 수연: "축제 음식은 더 맛있어야죠! 지금 요리하면 특별 보너스가 붙는다고요!"`,
        미나: `🎉 [${festName}] 미나: "축제 때는 여관도 활기차네요! 오늘 하루도 즐겁게 보내세요 🌸"`,
        철수: `🎉 [${festName}] 철수: "축제라고 광산이 쉬나요? 오히려 이럴 때 캐야죠! 채굴 속도 버프도 있답니다!"`,
      };
      const greeting = festGreetings[npcName] ?? `🎉 [${festName}] ${npcName}: "축제 기간입니다! 특별 보너스를 누려보세요!"`;
      setTimeout(() => addMsgRef.current(greeting, 'catch'), 500);
    }
    setNpcDialog(npcAffinityKey); // use role key so NPCS lookup works
  }, [gainNpcAffinity]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleZoneNpcInteract = useCallback((npcId) => {
    playNpcInteract();
    gainNpcAffinity(npcId, 0.3);
    setNpcDialog(npcId);
  }, [gainNpcAffinity]);

  // ── Season/weather transition fade (must be before early returns per hook rules) ──
  const _currentSeasonForFade = getCurrentSeason();
  useEffect(() => {
    const wid = weather?.id ?? null;
    const sid = _currentSeasonForFade?.id ?? null;
    const wChanged = prevWeatherIdRef.current !== null && prevWeatherIdRef.current !== wid;
    const sChanged = prevSeasonIdRef.current !== null && prevSeasonIdRef.current !== sid;
    prevWeatherIdRef.current = wid;
    prevSeasonIdRef.current = sid;
    if (!wChanged && !sChanged) return;
    const seasonColors = { spring: 'rgba(255,180,180,0.55)', summer: 'rgba(100,180,255,0.45)', fall: 'rgba(255,140,60,0.5)', winter: 'rgba(180,220,255,0.55)' };
    const weatherColors = { rain: 'rgba(80,100,140,0.5)', storm: 'rgba(40,40,60,0.6)', sunny: 'rgba(255,220,80,0.35)', cloudy: 'rgba(160,160,170,0.4)' };
    const color = sChanged ? (seasonColors[sid] ?? 'rgba(200,200,200,0.4)') : (weatherColors[wid] ?? 'rgba(200,200,200,0.4)');
    setSeasonFadeColor(color);
    setTimeout(() => setSeasonFadeColor(null), 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather?.id, _currentSeasonForFade?.id]);

  // ── Gold float effect on gold change (must be before early returns per hook rules) ──
  useEffect(() => {
    if (prevGoldRef.current === null) { prevGoldRef.current = gs.money; return; }
    const diff = gs.money - prevGoldRef.current;
    prevGoldRef.current = gs.money;
    if (diff === 0) return;
    const id = Date.now() + Math.random();
    setGoldFloats(prev => [...prev, { id, amount: diff }]);
    setTimeout(() => setGoldFloats(prev => prev.filter(f => f.id !== id)), 1400);
  }, [gs.money]);

  const ZONE_INTRO = {
    '서쪽초원': [
      '🌾 서쪽 초원에 도착했습니다!',
      '🌿 풀과 꽃이 가득한 초원입니다. 허브가 풍부하게 자라고 있어요.',
      '보너스: 허브 수확량 +40% / 강·민물에서 다양한 물고기를 낚을 수 있습니다.',
    ],
    '동쪽절벽': [
      '⛏ 동쪽 절벽에 도착했습니다!',
      '🪨 험준한 절벽 지대. 광물이 곳곳에 노출되어 있습니다.',
      '보너스: 광석 획득량 +30% · 채굴 속도 +8% / 해안선에서 희귀 바다 물고기를 노려보세요.',
    ],
    '북쪽고원': [
      '🏔 북쪽 고원에 도착했습니다!',
      '❄️ 안개가 자욱한 고원입니다. 희귀 자원이 가득하지만 길이 험합니다.',
      '보너스: 허브 +20% · 광석 +15% · 모든 희귀도 +5% / 고산 호수의 빙어와 연어를 노려보세요.',
    ],
    '남쪽심해': [
      '🌊 남쪽 심해에 도착했습니다!',
      '🐋 광활한 바다가 펼쳐집니다. 이곳에서만 볼 수 있는 전설급 어종이 살고 있습니다.',
      '보너스: 생선 판매가 +25% · 희귀도 +8% / 용고기와 리바이어던이 출몰합니다!',
    ],
    '항구마을': [
      '⚓ 항구 마을에 도착했습니다!',
      '🐟 분주한 어시장과 부두가 펼쳐집니다. 희귀한 해산물이 가득합니다.',
      '보너스: 생선 판매가 +40% · 희귀도 +10% / 날치·심해문어·항구왕새우를 노려보세요!',
    ],
    '고대신전': [
      '🏺 고대 신전에 도착했습니다!',
      '🗿 수천 년 전 문명의 유적이 눈앞에 펼쳐집니다. 지하 수로에서 고대 어종이 서식합니다.',
      '보너스: 광석 +50% · 희귀도 +15% · 생선 판매 +10% / 고대잉어·신전수호어를 낚아보세요!',
    ],
    '설산정상': [
      '❄️ 설산 정상에 도착했습니다!',
      '🌨 눈 덮인 고산. 얼음 호수에서만 잡히는 전설의 물고기가 있다고 합니다.',
      '보너스: 광석 +60% · 희귀도 +12% / 얼음빙어와 설산용을 낚아보세요!',
    ],
  };

  const handleZoneTransition = useCallback((newZone) => {
    if (gameRef.current) gameRef.current.worldZone = newZone;
    setMapTransitioning(true);
    setTimeout(() => {
      setActiveZone(newZone);
      setActiveTiles(ZONE_TILES[newZone]);
      setGs(prev => {
        const visited = prev.visitedZones ?? ['마을'];
        const isFirst = !visited.includes(newZone);
        if (isFirst && ZONE_INTRO[newZone]) {
          ZONE_INTRO[newZone].forEach((line, i) => {
            setTimeout(() => addMsgRef.current?.(line, i === 0 ? 'catch' : 'info'), i * 1200);
          });
        }
        setTimeout(() => addMsgRef.current?.(`📍 ${ZONE_LABELS[newZone] ?? newZone}에 도착했습니다!`, 'info'), 350);
        return {
          ...prev,
          worldZone: newZone,
          visitedZones: isFirst ? [...visited, newZone] : visited,
        };
      });
      setTimeout(() => setMapTransitioning(false), 300);
    }, 150);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleZoneBlocked = useCallback((zoneName) => {
    const req = ZONE_UNLOCK_REQ[zoneName];
    if (!req) return;
    addMsg(`🔒 ${zoneName} 진입 불가 — ${req.desc}`, 'error');
  }, [addMsg]);

  const handleCancelReturn = useCallback(() => {
    if (!returnCastRef.current) return;
    clearTimeout(returnCastRef.current.timer);
    returnCastRef.current = null;
    setReturnCast(null);
    addMsg('🏠 이동으로 귀환이 취소되었습니다.', 'error');
  }, [addMsg]);

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
  const currentSeason = getCurrentSeason();

  const handleEnterRoom = (id) => {
    if (Date.now() - lastExitTimeRef.current < 2000) return; // prevent immediate re-entry after exit
    playEnterRoom();
    setIndoorRoom(id);
  };

  const handleExitRoom = () => {
    lastExitTimeRef.current = Date.now();
    // Teleport player to the door exit position
    const door = DOOR_TRIGGERS.find(d => d.id === indoorRoom);
    if (door && gameRef.current?.player) {
      gameRef.current.player.x = door.exitWx;
      gameRef.current.player.y = door.exitWy;
    }
    setIndoorRoom(null);
  };

  // Admin panel route
  if (window.location.hash === '#admin') {
    return <AdminPanel />;
  }

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
          onNearActionChange={setNearActionZone}
          hairColor={gs.hairColor}
          bodyColor={gs.bodyColor}
          skinColor={gs.skinColor}
          gender={gs.gender}
          spotDecos={gs.spotDecos}
          onZoneTransition={handleZoneTransition}
          onCancelReturn={handleCancelReturn}
          onZoneBlocked={handleZoneBlocked}
          onZoneNpcInteract={handleZoneNpcInteract}
          onNpcQuickMenu={(npcId, x, y) => setNpcQuickMenu({ npcId, x, y, tab: '퀘스트' })}
        />
        {/* Phase 13: Map transition wipe overlay */}
        {mapTransitioning && (
          <div className="map-wipe-overlay" />
        )}

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
            cottageData={gs.cottage}
            FURNITURE={FURNITURE}
          />
        )}

        <TopBar
          gs={gs}
          setGs={setGs}
          nickname={nickname}
          myTitle={myTitle}
          roomTitle={roomTitle}
          weather={weather}
          currentSeason={currentSeason}
          activity={activity}
          isOnline={isOnline}
          serverQuest={serverQuest}
          serverBoss={serverBoss}
          fishSurgeEvent={fishSurgeEvent}
          serverEvent={serverEvent}
          activeWeatherEvent={activeWeatherEvent}
          roomId={roomId}
          indoorRoom={indoorRoom}
          nearDoor={nearDoor}
          nearActionZone={nearActionZone}
          nearIndoorNpc={nearIndoorNpc}
          partyId={partyId}
          partyMembersRef={partyMembersRef}
          otherPlayersRef={otherPlayersRef}
          pendingInvite={pendingInvite}
          showAnnounce={showAnnounce}
          serverAnnouncements={serverAnnouncements}
          achPopup={achPopup}
          gradeUpCelebration={gradeUpCelebration}
          gameRef={gameRef}
          handleCommand={handleCommand}
          handleExitRoom={handleExitRoom}
          handleNpcInteract={handleNpcInteract}
          addMsg={addMsg}
          setShowInv={setShowInv}
          setShowShop={setShowShop}
          setShowStats={setShowStats}
          setShowRank={setShowRank}
          setShowQuest={setShowQuest}
          setShowDex={setShowDex}
          setShowGuild={setShowGuild}
          setShowMarket={setShowMarket}
          setShowMobileMenu={setShowMobileMenu}
          showMobileMenu={showMobileMenu}
          setAppearanceDraft={setAppearanceDraft}
          setShowAppearance={setShowAppearance}
          setShowSettings={setShowSettings}
          setShowTournament={setShowTournament}
          setShowCottage={setShowCottage}
          setShowWorldMap={setShowWorldMap}
          setShowTownHall={setShowTownHall}
          setShowPointShop={setShowPointShop}
        />
      </div>

      {/* 귀환 캐스팅 HUD */}
      {returnCast && !indoorRoom && (() => {
        const pct = Math.max(0, Math.min(1, 1 - (returnCast.expiresAt - Date.now()) / 5000));
        return (
          <div style={{
            position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            zIndex: 8000, background: 'rgba(10,20,40,0.92)', border: '1px solid #4488ff88',
            borderRadius: 10, padding: '8px 18px', minWidth: 180, textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}>
            <div style={{ color: '#aaddff', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>🏠 마을로 귀환 중...</div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct * 100}%`, height: '100%', background: '#4488ff', borderRadius: 3, transition: 'width 0.1s linear' }} />
            </div>
            <button onClick={handleCancelReturn} style={{
              marginTop: 6, background: 'none', border: 'none', color: 'rgba(255,100,100,0.7)',
              fontSize: 11, cursor: 'pointer',
            }}>취소</button>
          </div>
        );
      })()}

      {/* 외곽 존 모바일 귀환 버튼 */}
      {!indoorRoom && gs.worldZone && gs.worldZone !== '마을' && (
        <button
          onClick={() => handleCommand('!귀환')}
          style={{
            position: 'fixed', bottom: 140, right: 16, zIndex: 7500,
            background: 'rgba(10,20,50,0.9)', border: '1px solid #4488ff88',
            borderRadius: 20, padding: '8px 14px', color: '#aaddff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >🏠 귀환</button>
      )}

      {catchPopup && (
        <div className="catch-popup" style={{ border: `2px solid ${rarityColor(catchPopup.rarity)}` }}>
          <div className="catch-popup-rarity" style={{ color: rarityColor(catchPopup.rarity) }}>{catchPopup.rarity}</div>
          <div className="catch-popup-name">{catchPopup.name}</div>
          <div className="catch-popup-size">{catchPopup.size}cm</div>
          <div className="catch-popup-price">+{catchPopup.price.toLocaleString()}G</div>
          {catchPopup.isNewRecord && <div className="catch-popup-record">🏆 신기록!</div>}
        </div>
      )}

      {windfallPopup && (() => {
        const oreIcons = { 철광석: '🪨', 구리광석: '🟤', 수정: '💎', 금광석: '✨' };
        const icon = oreIcons[windfallPopup.oreName] ?? '💥';
        const particles = Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const dist = 55 + Math.random() * 30;
          const tx = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 30}px)`;
          return <span key={i} className="windfall-particle" style={{ '--tx': tx, left: '50%', top: '50%', marginLeft: '-11px', marginTop: '-11px', animationDelay: `${i * 0.05}s` }}>{icon}</span>;
        });
        return (
          <div className="windfall-burst">
            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {particles}
              <div style={{ fontSize: 28, fontWeight: 900, color: '#ffdd00', textShadow: '0 0 12px #ff8800', zIndex: 1 }}>💥 대박!</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 4 }}>{windfallPopup.oreName} +{windfallPopup.count}</div>
          </div>
        );
      })()}

      {seasonFadeColor && <div className="season-fade" style={{ background: seasonFadeColor }} />}

      {tutorialStep > 0 && (() => {
        const STEPS = [
          { title: '🎣 낚시 의자 찾기', body: '지도 남쪽 부두나 연못 가장자리에 낚시 의자가 있어요. 의자 근처로 이동해보세요!' },
          { title: '🐟 낚시 시작', body: '의자 옆에 서면 낚시가 시작됩니다. 물고기가 입질하면 화면 중앙에 찌가 나타나요!' },
          { title: '💰 물고기 판매', body: '낚은 물고기는 🎒 인벤토리에서 판매할 수 있어요. 상단 바의 "인벤" 버튼을 눌러보세요!' },
          { title: '🏪 상점 구경', body: '상단 "상점" 버튼으로 낚싯대·신발·미끼를 구매할 수 있어요. 이제 자유롭게 즐겨보세요! 🌊' },
        ];
        const step = STEPS[tutorialStep - 1];
        if (!step) return null;
        const advanceOrFinish = () => {
          if (tutorialStep >= STEPS.length) {
            setTutorialStep(0);
            setGs(prev => ({ ...prev, tutorialDone: true }));
          } else {
            setTutorialStep(t => t + 1);
          }
        };
        return (
          <div className="tutorial-overlay">
            <div className="tutorial-box" style={{ bottom: 120, left: 20 }}>
              <div className="tutorial-step">튜토리얼 {tutorialStep} / {STEPS.length}</div>
              <div className="tutorial-title">{step.title}</div>
              <div className="tutorial-body">{step.body}</div>
              <button className="tutorial-next" onClick={advanceOrFinish}>
                {tutorialStep >= STEPS.length ? '시작하기! 🎣' : '다음 →'}
              </button>
              <button onClick={() => { setTutorialStep(0); setGs(prev => ({ ...prev, tutorialDone: true })); }}
                style={{ width: '100%', marginTop: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 11 }}>
                건너뛰기
              </button>
            </div>
          </div>
        );
      })()}

      {showShortcuts && (
        <div className="shortcut-tooltip" onClick={() => setShowShortcuts(false)}>
          <div className="shortcut-tooltip-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: '#88ccff' }}>⌨️ 키보드 단축키</div>
            {[
              ['I', '인벤토리 열기/닫기'],
              ['S', '상점 열기/닫기'],
              ['A', '상태창 열기/닫기'],
              ['Q', '퀘스트 열기/닫기'],
              ['D', '도감 열기/닫기'],
              ['R', '랭킹 열기/닫기'],
              ['?', '이 도움말 토글'],
              ['Esc', '모든 패널 닫기'],
              ['Space', '낚시 찌 타이밍 (낚시 중)'],
            ].map(([key, desc]) => (
              <div key={key} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                <kbd style={{ background: 'rgba(100,180,255,0.15)', border: '1px solid rgba(100,180,255,0.4)', borderRadius: 5, padding: '2px 8px', fontFamily: 'monospace', fontSize: 13, minWidth: 36, textAlign: 'center', color: '#88ccff' }}>{key}</kbd>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{desc}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>클릭하거나 Esc로 닫기</div>
          </div>
        </div>
      )}

      {goldFloats.map(f => (
        <div key={f.id} className="gold-float" style={{ top: 52, right: 120, color: f.amount >= 0 ? '#ffe066' : '#ff6b6b' }}>
          {f.amount >= 0 ? '+' : ''}{f.amount.toLocaleString()}G
        </div>
      ))}

      <ChatBox messages={messages} onCommand={handleCommand} />

      <Sidebar
        gs={gs}
        setGs={setGs}
        nickname={nickname}
        addMsg={addMsg}
        handleCommand={handleCommand}
        grantAbility={grantAbility}
        advanceQuest={advanceQuest}
        gainNpcAffinity={gainNpcAffinity}
        checkAndGrantAchievements={checkAndGrantAchievements}
        sellAll={sellAll}
        sellOne={sellOne}
        equipBait={equipBait}
        equipRod={equipRod}
        equipBoots={equipBoots}
        equipCookware={equipCookware}
        equipMarineGear={equipMarineGear}
        equipPickaxe={equipPickaxe}
        equipGatherTool={equipGatherTool}
        totalFishVal={totalFishVal}
        showInv={showInv}
        setShowInv={setShowInv}
        showShop={showShop}
        setShowShop={setShowShop}
        sellQty={sellQty}
        setSellQty={setSellQty}
        showStats={showStats}
        setShowStats={setShowStats}
        statsTab={statsTab}
        setStatsTab={setStatsTab}
        showRank={showRank}
        setShowRank={setShowRank}
        showQuest={showQuest}
        setShowQuest={setShowQuest}
        showDex={showDex}
        setShowDex={setShowDex}
        showBank={showBank}
        setShowBank={setShowBank}
        bankInput={bankInput}
        setBankInput={setBankInput}
        showAppearance={showAppearance}
        setShowAppearance={setShowAppearance}
        appearanceDraft={appearanceDraft}
        setAppearanceDraft={setAppearanceDraft}
        inspectPlayer={inspectPlayer}
        setInspectPlayer={setInspectPlayer}
        showTournament={showTournament}
        setShowTournament={setShowTournament}
        tournamentRanking={tournamentRanking}
        serverQuest={serverQuest}
        serverBoss={serverBoss}
        serverAnnouncements={serverAnnouncements}
        showGuild={showGuild}
        setShowGuild={setShowGuild}
        guildTab={guildTab}
        setGuildTab={setGuildTab}
        myGuildId={myGuildId}
        setMyGuildId={setMyGuildId}
        guildInfo={guildInfo}
        guildMembers={guildMembers}
        guildList={guildList}
        guildChat={guildChat}
        guildQuest={guildQuest}
        guildCompetition={guildCompetition}
        guildChatInput={guildChatInput}
        setGuildChatInput={setGuildChatInput}
        guildCreateName={guildCreateName}
        setGuildCreateName={setGuildCreateName}
        guildJoinId={guildJoinId}
        setGuildJoinId={setGuildJoinId}
        showMarket={showMarket}
        setShowMarket={setShowMarket}
        marketListings={marketListings}
        myListings={myListings}
        marketTab={marketTab}
        setMarketTab={setMarketTab}
        marketListForm={marketListForm}
        setMarketListForm={setMarketListForm}
        partyMessages={partyMessages}
        partyId={partyId}
        checkNpcQuest={checkNpcQuest}
        resistanceGame={resistanceGame}
        setResistanceGame={setResistanceGame}
        miningMinigame={miningMinigame}
        setMiningMinigame={setMiningMinigame}
        gameRef={gameRef}
        playLevelUp={playLevelUp}
        otherPlayersRef={otherPlayersRef}
        onResistanceSuccess={onResistanceSuccess}
        onResistanceFail={onResistanceFail}
        setGradeUpCelebration={setGradeUpCelebration}
        stateRef={stateRef}
        playSellSound={playSellSound}
        buyRod={buyRod}
        buyBoots={buyBoots}
        buyBait={buyBait}
        buyCookware={buyCookware}
        buyMarineGear={buyMarineGear}
        buyPickaxe={buyPickaxe}
        buyGatherTool={buyGatherTool}
        setGuildInfo={setGuildInfo}
        setGuildMembers={setGuildMembers}
        setGuildChat={setGuildChat}
        setGuildQuest={setGuildQuest}
        handlePetEvolve={handlePetEvolve}
        handleChooseJobClass={handleChooseJobClass}
        handleCottageUpgrade={handleCottageUpgrade}
        onArtisanCraft={handleArtisanCraft}
        handleAddFriend={handleAddFriend}
        handleRemoveFriend={handleRemoveFriend}
        claimWeeklyGoalReward={claimWeeklyGoalReward}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showCottage={showCottage}
        setShowCottage={setShowCottage}
        setShowProfileCard={setShowProfileCard}
        showMailbox={showMailbox}
        setShowMailbox={setShowMailbox}
        showSeasonLeague={showSeasonLeague}
        setShowSeasonLeague={setShowSeasonLeague}
        onPrestige={() => {
          const playerState = gameRef.current?.player?.state;
          if (playerState && playerState !== 'idle') {
            addMsg('낚시/채굴/채집 중에는 프레스티지를 사용할 수 없습니다.', 'system');
            return;
          }
          setShowPrestigeConfirm(true);
        }}
      />

      {/* 세계 지도 */}
      {showWorldMap && (
        <WorldMap
          currentZone={gs.worldZone ?? '마을'}
          zoneMastery={gs.zoneMastery ?? {}}
          zoneChallengeProgress={gs.zoneChallengeProgress ?? {}}
          onClaimZoneChallenge={claimZoneChallenge}
          lockedZones={Object.keys(ZONE_UNLOCK_REQ).filter(z => {
            const req = ZONE_UNLOCK_REQ[z];
            if (!req) return false;
            if (req.marineGear) return gs.marineGear !== req.marineGear;
            if (req.stat === 'oreMined') return (gs.achStats?.oreMined ?? 0) < req.min;
            if (req.stat === 'exploredZones') return (gs.exploredZones ?? []).length < req.min;
            if (req.zone) return !(gs.visitedZones ?? []).includes(req.zone) || (gs.mineDepth ?? 1) < (req.mineDepth ?? 1);
            if (req.seenChapter4) return !gs.seenChapter4 || (gs.exploredZones ?? []).length < (req.exploredZones ?? 0);
            if (req.zoneMastery) { const e = gs.zoneMastery?.[req.zoneMastery] ?? 0; return e < (req.masteryMin ?? 0); }
            return false;
          })}
          onClose={() => setShowWorldMap(false)}
        />
      )}

      {/* Phase 12-3: 마을 발전 */}
      {showTownHall && (
        <TownHall
          gs={gs}
          townLevels={townLevels}
          onContribute={handleTownContribute}
          onClose={() => setShowTownHall(false)}
        />
      )}

      {/* Phase 12-5: 포인트 상점 */}
      {showPointShop && (
        <PointShop
          gs={gs}
          onExchange={handlePointExchange}
          onClose={() => setShowPointShop(false)}
        />
      )}

      {/* NPC 대화 인터페이스 */}
      {npcDialog && (
        <NpcDialogue
          npcKey={npcDialog}
          affinity={gs.npcAffinity?.[npcDialog] ?? 0}
          onAction={(actionId) => handleNpcDialogAction(npcDialog, actionId)}
          onGift={(itemKey, itemType) => handleNpcGift(npcDialog, itemKey, itemType)}
          gs={gs}
          onClose={() => setNpcDialog(null)}
        />
      )}

      {/* NPC 퀵 메뉴 (더블클릭) */}
      {npcQuickMenu && (() => {
        const { npcId, x, y, tab } = npcQuickMenu;
        const npc = NPCS[npcId];
        if (!npc) return null;
        // Per-NPC quick action mapping
        const NPC_QUICK = {
          행상인:    { buy: { action: 'traveling_shop',   label: '물건 구경하기' },  sell: null },
          노련한광부: { buy: { action: 'pickaxe_repair',   label: '곡괭이 수리 (-200G)' }, sell: { action: 'ore_appraise', label: '광석 감정받기' } },
          산신령:    { buy: { action: 'mountain_buff',    label: '산기운 받기 (1일 1회)' }, sell: null },
          심해탐험가: { buy: null, sell: { action: 'deep_quest',        label: '신화급 물고기 납품' } },
          어시장상인: { buy: null, sell: { action: 'sell_market',       label: '생선 판매 (+20%)' } },
          선장:      { buy: null, sell: null },
          유물학자:  { buy: null, sell: { action: 'appraise_artifact',  label: '고대광석 감정받기' } },
          설인:      { buy: { action: 'warm_drink',       label: '따뜻한 음료 받기 (1일 1회)' }, sell: null },
        };
        const q = NPC_QUICK[npcId] ?? { buy: null, sell: null };
        const s2Quests = NPC_QUESTS[npcId];
        const s2Step = gs.npcQuestStep?.[npcId] ?? 0;
        const s2Total = s2Quests?.length ?? 0;
        const s2Done = s2Step >= s2Total;
        const currentQuest = s2Quests?.[s2Step];
        const tabs = ['사기', '팔기', '퀘스트'];
        const POPUP_W = 230;
        const POPUP_H = 190;
        const sx = Math.min(Math.max(x - POPUP_W / 2, 8), window.innerWidth - POPUP_W - 8);
        const sy = Math.max(y - POPUP_H - 20, 60);
        return (
          <div
            style={{
              position: 'fixed', left: sx, top: sy,
              width: POPUP_W, zIndex: 9500,
              background: 'linear-gradient(160deg,#0d1e30,#0a1520)',
              border: `1px solid ${npc.color}55`,
              borderRadius: 14,
              boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${npc.color}22`,
              overflow: 'hidden',
              fontFamily: '"Noto Sans KR", sans-serif',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 8px', borderBottom: `1px solid ${npc.color}33` }}>
              <span style={{ fontSize: 22 }}>{npc.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: npc.color, fontWeight: 700, fontSize: 13 }}>{npc.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>친밀도 {Math.floor(gs.npcAffinity?.[npcId] ?? 0)}/100</div>
              </div>
              <button onClick={() => setNpcQuickMenu(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setNpcQuickMenu(prev => ({ ...prev, tab: t }))} style={{
                  flex: 1, padding: '7px 0', fontSize: 12, fontWeight: tab === t ? 700 : 400,
                  background: tab === t ? `${npc.color}22` : 'none',
                  border: 'none', borderBottom: tab === t ? `2px solid ${npc.color}` : '2px solid transparent',
                  color: tab === t ? npc.color : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{t}</button>
              ))}
            </div>
            {/* Content */}
            <div style={{ padding: '10px 12px', minHeight: 90 }}>
              {tab === '사기' && (
                q.buy ? (
                  <button onClick={() => { handleNpcDialogAction(npcId, q.buy.action); setNpcQuickMenu(null); }} style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: `${npc.color}22`, border: `1px solid ${npc.color}55`,
                    color: '#e8edf5', fontSize: 13, fontWeight: 600, textAlign: 'left',
                  }}>
                    🛒 {q.buy.label}
                  </button>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', paddingTop: 16 }}>이 NPC는 판매 서비스가 없습니다</div>
                )
              )}
              {tab === '팔기' && (
                q.sell ? (
                  <button onClick={() => { handleNpcDialogAction(npcId, q.sell.action); setNpcQuickMenu(null); }} style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: `${npc.color}22`, border: `1px solid ${npc.color}55`,
                    color: '#e8edf5', fontSize: 13, fontWeight: 600, textAlign: 'left',
                  }}>
                    💰 {q.sell.label}
                  </button>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', paddingTop: 16 }}>이 NPC는 구매 서비스가 없습니다</div>
                )
              )}
              {tab === '퀘스트' && (
                s2Quests ? (
                  <div>
                    {s2Done ? (
                      <div style={{ color: '#88ff88', fontSize: 12, textAlign: 'center', paddingTop: 8 }}>✅ 모든 의뢰 완수! ({s2Total}/{s2Total})</div>
                    ) : (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ color: '#ffcc44', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>
                          📜 의뢰 {s2Step + 1}/{s2Total}: {currentQuest?.title}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 8 }}>
                          {currentQuest?.hint(gs)}
                        </div>
                        <button onClick={() => { handleNpcDialogAction(npcId, 'npc_s2_quest'); setNpcQuickMenu(null); }} style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(255,200,50,0.15)', border: '1px solid rgba(255,200,50,0.4)',
                          color: '#ffdd66', fontSize: 12, fontWeight: 600,
                        }}>
                          의뢰 확인하기
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', paddingTop: 16 }}>진행 중인 의뢰가 없습니다</div>
                )
              )}
            </div>
            {/* Full dialogue link */}
            <div style={{ borderTop: `1px solid rgba(255,255,255,0.07)`, padding: '6px 12px' }}>
              <button onClick={() => { setNpcQuickMenu(null); setNpcDialog(npcId); }} style={{
                width: '100%', padding: '6px', borderRadius: 6, cursor: 'pointer',
                background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.45)', fontSize: 11,
              }}>
                💬 전체 대화 열기
              </button>
            </div>
          </div>
        );
      })()}

      {/* Phase 15-4: Zone minigames */}
      {tidalGame && (
        <TidalMinigame
          fishName={tidalGame.name}
          rarity={tidalGame.fd?.rarity}
          onResult={onTidalResult}
        />
      )}
      {iceHoleGame && (
        <IceHoleMinigame
          onResult={onIceHoleResult}
        />
      )}

      {/* Phase 15-3: Profile Card */}
      {showProfileCard && (
        <ProfileCard
          gs={gs}
          nickname={nickname}
          onClose={() => setShowProfileCard(false)}
          onShare={() => setGs(prev => ({
            ...prev,
            achStats: { ...prev.achStats, profileShares: (prev.achStats?.profileShares ?? 0) + 1 },
          }))}
        />
      )}

      {/* Prestige confirm modal */}
      {showPrestigeConfirm && (
        <div className="overlay" onClick={() => setShowPrestigeConfirm(false)}>
          <div className="panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="panel-head">
              <span>🌟 뉴 타이드+ 명예 초기화</span>
              <button tabIndex={-1} onClick={() => setShowPrestigeConfirm(false)}>✕</button>
            </div>
            <div className="section">
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
                <b style={{ color: '#ff8888' }}>초기화되는 항목:</b>
                <ul style={{ paddingLeft: 18, marginTop: 4, lineHeight: 1.8 }}>
                  <li>모든 어빌리티 (0으로 초기화)</li>
                  <li>직업 트리 (해제)</li>
                </ul>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
                <b style={{ color: '#88ff88' }}>유지되는 항목:</b>
                <ul style={{ paddingLeft: 18, marginTop: 4, lineHeight: 1.8 }}>
                  <li>골드, 장비, 도감, NPC 친밀도</li>
                  <li>업적, 펫, 오두막</li>
                </ul>
              </div>
              <div style={{ fontSize: 13, color: '#ffd700', marginBottom: 16 }}>
                <b>획득:</b> 영구 판매가 +2%, 프레스티지 카운트 +1<br />
                현재 {gs.prestigeCount ?? 0}회 → {(gs.prestigeCount ?? 0) + 1}회
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-buy" style={{ flex: 1, background: 'linear-gradient(135deg, #7733cc, #3366cc)' }}
                  onClick={handlePrestige}>
                  🌟 확인 (초기화)
                </button>
                <button className="btn-dis" style={{ flex: 1 }} onClick={() => setShowPrestigeConfirm(false)}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auction House modal */}
      {showAuction && (
        <AuctionHouse
          onClose={() => setShowAuction(false)}
          gs={gs}
          setGs={setGs}
          nickname={nickname}
          addMsg={addMsg}
        />
      )}

      {/* Season Pass modal */}
      {showSeasonPass && (
        <SeasonPass
          onClose={() => setShowSeasonPass(false)}
          gs={gs}
          setGs={setGs}
          addMsg={addMsg}
        />
      )}
    </div>
  );
}
