import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import GameCanvas from './GameCanvas';
import Chat from './Chat';
import Joystick from './Joystick';
import Leaderboard from './Leaderboard';
import RoomLobby from './RoomLobby';
import { saveFishRecord } from './ranking';
import { updatePlayerPresence, removePlayerPresence, subscribeOtherPlayers } from './multiplay';
import { FISH, RODS, ORES, BOOTS, BAIT, COOKWARE, STAT_DEFS, STAT_MAX, statCost, weightedPick, randInt, TILE_SIZE } from './gameData';
import { nearestChair, nearShop, nearCooking, isInMineZone, CHAIR_RANGE, pickOre } from './mapData';

function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setErr('닉네임을 입력해주세요.'); return; }
    if (trimmed.length < 2) { setErr('2글자 이상 입력해주세요.'); return; }
    if (trimmed.length > 12) { setErr('12글자 이하로 입력해주세요.'); return; }
    onLogin(trimmed);
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
          {err && <div className="login-err">{err}</div>}
          <button className="login-btn" type="submit">입장하기</button>
        </form>
        <p className="login-hint">방향키로 이동 · !낚시 · !광질 · !도움말</p>
      </div>
    </div>
  );
}

const DEFAULT_STATS = { 화술: 1, 민첩: 1, 체력: 1, 행운: 1 };

const DEFAULT_STATE = {
  money: 100,
  rod: '초급낚시대',
  ownedRods: ['초급낚시대'],
  fishInventory: [],
  oreInventory: { 철광석: 0, 구리광석: 0, 수정: 0 },
  fishCaught: 0,
  boots: '기본신발',
  ownedBoots: ['기본신발'],
  stats: { ...DEFAULT_STATS },
  equippedBait: null,
  ownedBait: [],
  baitInventory: {},
  cookware: null,
  ownedCookware: [],
};

function saveKey(nickname) { return `fishingGame_v1_${nickname}`; }

function loadSave(nickname) {
  try {
    const s = JSON.parse(localStorage.getItem(saveKey(nickname)));
    if (!s) return DEFAULT_STATE;
    return {
      money: s.money ?? 100,
      rod: s.rod ?? '초급낚시대',
      ownedRods: s.ownedRods ?? ['초급낚시대'],
      fishInventory: s.fishInventory ?? [],
      oreInventory: { ...DEFAULT_STATE.oreInventory, ...s.oreInventory },
      fishCaught: s.fishCaught ?? 0,
      boots: s.boots ?? '기본신발',
      ownedBoots: s.ownedBoots ?? ['기본신발'],
      stats: { ...DEFAULT_STATS, ...(s.stats ?? {}) },
      equippedBait: s.equippedBait ?? null,
      ownedBait: s.ownedBait ?? [],
      baitInventory: s.baitInventory ?? {},
      cookware: s.cookware ?? null,
      ownedCookware: s.ownedCookware ?? [],
    };
  } catch { return DEFAULT_STATE; }
}

function rarityColor(r) {
  return { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' }[r] ?? '#fff';
}

export default function App() {
  const gameRef = useRef({});
  const stateRef = useRef(null);
  const tabId = useRef(Date.now() + '-' + Math.random());
  const channelRef = useRef(null);
  const nicknameRef = useRef('');
  const otherPlayersRef = useRef([]);
  const lastPosRef = useRef({});

  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [roomTitle, setRoomTitle] = useState('');
  useEffect(() => { nicknameRef.current = nickname; }, [nickname]);
  const [blocked, setBlocked] = useState(false);

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

  // Multiplayer: subscribe to other players in same room
  useEffect(() => {
    if (!nickname || !roomId) return;
    const unsub = subscribeOtherPlayers(nickname, roomId, (players) => {
      otherPlayersRef.current = players;
    });
    return unsub;
  }, [nickname, roomId]);

  // Multiplayer: throttled position sync (5×/sec, only on change)
  useEffect(() => {
    if (!nickname || !roomId) return;
    const id = setInterval(() => {
      const p = gameRef.current?.player;
      if (!p) return;
      const last = lastPosRef.current;
      if (p.x === last.x && p.y === last.y && p.state === last.state && p.facing === last.facing) return;
      lastPosRef.current = { x: p.x, y: p.y, state: p.state, facing: p.facing };
      updatePlayerPresence(nickname, roomId, p.x, p.y, p.state, p.facing, stateRef.current?.rod ?? '초급낚시대');
    }, 200);
    return () => clearInterval(id);
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

  // Sync speed bonus to game loop
  useEffect(() => {
    if (!gameRef.current) return;
    const bootsBonus = BOOTS[gs.boots]?.speedBonus ?? 0;
    const agilityBonus = ((gs.stats?.민첩 ?? 1) - 1) * 0.4;
    gameRef.current.speedBonus = bootsBonus + agilityBonus;
  }, [gs.boots, gs.stats]);

  // Load save when nickname is established (nickname-keyed, room-independent)
  useEffect(() => {
    if (!nickname) return;
    setGs(loadSave(nickname));
  }, [nickname]);

  // Save to localStorage keyed by nickname
  useEffect(() => {
    if (!nickname) return;
    localStorage.setItem(saveKey(nickname), JSON.stringify(gs));
  }, [gs, nickname]);


  const addMsg = useCallback((text, type = 'system') => {
    setMessages(prev => [...prev.slice(-120), { text, type }]);
  }, []);

  // ── Callbacks from game loop ──────────────────────────────────────────────

  const applyBoosts = useCallback((table, boostMap) => {
    return table.map(e => ({ ...e, w: e.w * (boostMap[FISH[e.f]?.rarity] ?? 1) }));
  }, []);

  const onFishCaught = useCallback((rodKey) => {
    const rod = RODS[rodKey];
    if (!rod) return;
    const s = stateRef.current;
    const luckLv = s?.stats?.행운 ?? 1;
    const 힘Lv = s?.stats?.화술 ?? 1;

    // Build rarity boost from luck stat
    const luckBoost = { 흔함: 1, 보통: 1 + (luckLv-1)*0.12, 희귀: 1 + (luckLv-1)*0.22, 전설: 1 + (luckLv-1)*0.40, 신화: 1 + (luckLv-1)*0.60 };
    let table = applyBoosts(rod.table, luckBoost);

    // Apply equipped bait
    const baitKey = s?.equippedBait;
    const baitData = baitKey ? BAIT[baitKey] : null;
    if (baitData) table = applyBoosts(table, baitData.boost);

    const name = weightedPick(table);
    const fd = FISH[name];
    if (!fd) return;
    const size = parseFloat((Math.random() * (fd.maxSz - fd.minSz) + fd.minSz).toFixed(1));
    const avgSz = (fd.minSz + fd.maxSz) / 2;
    const price = Math.round(fd.price * (size / avgSz) * (1 + (힘Lv - 1) * 0.06));

    // Consume one-time bait
    if (baitData?.type === 'once') {
      setGs(prev => {
        const bi = { ...(prev.baitInventory ?? {}), [baitKey]: Math.max(0, (prev.baitInventory?.[baitKey] ?? 1) - 1) };
        return { ...prev, baitInventory: bi, equippedBait: bi[baitKey] <= 0 ? null : prev.equippedBait };
      });
    }
    const id = Date.now() + Math.random();

    setGs(prev => ({ ...prev, fishInventory: [...prev.fishInventory, { name, size, price, id }], fishCaught: (prev.fishCaught ?? 0) + 1 }));
    addMsg(`🐟 ${name} ${size}cm 낚음! (${price}G)`, 'catch');
    if (nicknameRef.current) saveFishRecord(nicknameRef.current, name, size);

    if (gameRef.current?.player) {
      gameRef.current.player.floatText = {
        text: `${name} ${size}cm`,
        age: 0,
        color: rarityColor(fd.rarity),
      };
    }
  }, [addMsg]);

  const onOreMined = useCallback((oreName) => {
    setGs(prev => ({
      ...prev,
      oreInventory: { ...prev.oreInventory, [oreName]: (prev.oreInventory[oreName] || 0) + 1 },
    }));
    addMsg(`⛏ ${oreName} 1개 채굴!`, 'mine');
    if (gameRef.current?.player) {
      gameRef.current.player.floatText = {
        text: `+${oreName}`,
        age: 0,
        color: ORES[oreName]?.color ?? '#fa4',
      };
    }
  }, [addMsg]);

  const onActivityChange = useCallback((act) => setActivity(act), []);

  // ── Command handler ───────────────────────────────────────────────────────

  const handleCommand = useCallback((input) => {
    const cmd = input.trim().toLowerCase();
    addMsg(`> ${input}`, 'user');

    const g = gameRef.current;
    if (!g?.player) return;
    const player = g.player;
    const s = stateRef.current;

    if (cmd === '!도움말') {
      ['!낚시  – 낚시 시작 (낚시 의자 근처)',
       '!광질  – 채굴 시작 (광산 지역, 동쪽)',
       '!그만  – 현재 활동 중지',
       '!요리  – 물고기 요리 (요리소 근처)',
       '!상점  – 상점 열기 (상점 건물 근처)',
       '!판매  – 물고기 전체 판매 (상점 근처)',
       '!인벤  – 인벤토리 열기/닫기',
       '!랭킹  – 랭킹 보기',
       '!스탯  – 캐릭터 스탯 보기',
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
      const mult = COOKWARE[cw]?.mult ?? 1;
      const raw = stateRef.current.fishInventory.filter(f => !f.cooked);
      if (raw.length === 0) { addMsg('요리할 생선이 없습니다.'); return; }
      setGs(prev => ({
        ...prev,
        fishInventory: prev.fishInventory.map(f =>
          f.cooked ? f : { ...f, price: Math.round(f.price * mult), cooked: true }
        ),
      }));
      addMsg(`🍳 생선 ${raw.length}마리 요리 완료! (가격 ${mult}배)`, 'catch');
      return;
    }

    if (cmd === '!그만') {
      if (player.state === 'idle') { addMsg('활동 중이 아닙니다.'); return; }
      player.state = 'idle';
      player.activityStart = null;
      player.activityProgress = 0;
      setActivity(null);
      addMsg('활동을 중지했습니다.');
      return;
    }

    if (cmd === '!낚시') {
      if (player.state !== 'idle') { addMsg('먼저 !그만 으로 중지하세요.'); return; }
      const nearest = nearestChair(player.x, player.y);
      if (!nearest || nearest.dist > CHAIR_RANGE) {
        addMsg('🪑 낚시 의자 근처로 이동하세요! (지도 아래쪽 낚시터)', 'error');
        return;
      }
      player.x = nearest.cx;
      player.y = nearest.cy - TILE_SIZE / 2;
      player.vx = 0; player.vy = 0;
      player.facing = 'down';
      player.state = 'fishing';
      player.currentRod = s.rod;
      const staminaMult = 1 - ((s.stats?.체력 ?? 1) - 1) * 0.05;
      const [mn, mx] = RODS[s.rod].catchTimeRange.map(t => Math.max(1000, Math.round(t * staminaMult)));
      player.activityStart = performance.now();
      player.activityDuration = randInt(mn, mx);
      player.activityProgress = 0;
      setActivity('fishing');
      addMsg(`🎣 ${RODS[s.rod].name}으로 낚시 시작! (방향키로 취소)`);
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
      const stMult = 1 - ((s.stats?.체력 ?? 1) - 1) * 0.05;
      const [mn, mx] = ORES[ore].mineRange.map(t => Math.max(1000, Math.round(t * stMult)));
      player.activityStart = performance.now();
      player.activityDuration = randInt(mn, mx);
      player.activityProgress = 0;
      setActivity('mining');
      addMsg('⛏ 광질 시작! (방향키로 취소)');
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
      return;
    }

    addMsg(`알 수 없는 명령어. !도움말 확인`, 'error');
  }, [addMsg]);

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

  const upgradeStat = (stat) => {
    const lv = gs.stats?.[stat] ?? 1;
    if (lv >= STAT_MAX) { addMsg(`${stat} 최대 레벨입니다.`); return; }
    const cost = statCost(lv);
    if (gs.money < cost) { addMsg(`💰 골드 부족 (${cost}G 필요)`, 'error'); return; }
    setGs(prev => ({ ...prev, money: prev.money - cost, stats: { ...(prev.stats ?? DEFAULT_STATS), [stat]: lv + 1 } }));
    addMsg(`✨ ${stat} Lv.${lv + 1} 달성!`, 'catch');
  };

  const sellAll = () => {
    const total = gs.fishInventory.reduce((s, f) => s + f.price, 0);
    setGs(prev => ({ ...prev, money: prev.money + total, fishInventory: [] }));
    addMsg(`💰 전체 판매 +${total}G`, 'catch');
  };

  const sellOne = (id) => {
    const fish = gs.fishInventory.find(f => f.id === id);
    if (!fish) return;
    setGs(prev => ({ ...prev, money: prev.money + fish.price, fishInventory: prev.fishInventory.filter(f => f.id !== id) }));
  };

  const handleLogin = (name) => {
    channelRef.current?.postMessage({ type: 'gameStart', tabId: tabId.current });
    setBlocked(false);
    setNickname(name);
  };

  const handleJoinRoom = (id, title) => {
    setRoomId(id);
    setRoomTitle(title);
    setMessages([
      { type: 'system', text: `🏠 [${title}] 방에 입장했습니다!` },
      { type: 'system', text: `👤 ${nickname} · 방향키로 이동 · !도움말` },
    ]);
  };

  const takeOver = () => {
    channelRef.current?.postMessage({ type: 'gameStart', tabId: tabId.current });
    setBlocked(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!nickname) return <LoginScreen onLogin={handleLogin} />;
  if (!roomId) return <RoomLobby nickname={nickname} onJoin={handleJoinRoom} />;

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

  return (
    <div className="root">
      <div className="canvas-area">
        <GameCanvas
          gameRef={gameRef}
          onFishCaught={onFishCaught}
          onOreMined={onOreMined}
          onActivityChange={onActivityChange}
          nickname={nickname}
          otherPlayersRef={otherPlayersRef}
        />

        {/* HUD */}
        <div className="hud">
          <div className="hud-chip hud-nick">👤 {nickname}</div>
          <div className="hud-chip" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>🏠 {roomTitle}</div>
          <div className="hud-chip">💰 {gs.money.toLocaleString()}G</div>
          <div className="hud-chip" style={{ color: RODS[gs.rod]?.color }}>
            🎣 {RODS[gs.rod]?.name}
          </div>
          {activity && (
            <div className={`hud-chip hud-active ${activity}`}>
              {activity === 'fishing' ? '🐟 낚시 중…' : '⛏ 채굴 중…'}
            </div>
          )}
        </div>

        {/* Shortcut buttons (desktop only) */}
        <div className="shortcut-bar">
          <button tabIndex={-1} onClick={() => setShowInv(v => !v)}>🎒 인벤</button>
          <button tabIndex={-1} onClick={() => setShowShop(v => !v)}>🏪 상점</button>
          <button tabIndex={-1} onClick={() => setShowStats(v => !v)}>📊 스탯</button>
          <button tabIndex={-1} onClick={() => setShowRank(v => !v)}>🏆 랭킹</button>
        </div>

        {/* Mobile controls: joystick + action buttons */}
        <div className="mobile-controls">
          <Joystick gameRef={gameRef} />
          <div className="action-btns">
            <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!낚시')}>
              <span>🎣</span><span className="action-btn-label">낚시</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => setShowInv(v => !v)}>
              <span>🎒</span><span className="action-btn-label">인벤</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!광질')}>
              <span>⛏</span><span className="action-btn-label">광질</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => setShowShop(v => !v)}>
              <span>🏪</span><span className="action-btn-label">상점</span>
            </button>
            <button className="action-btn action-btn-stop" tabIndex={-1} onClick={() => handleCommand('!그만')}>
              <span>🛑</span><span className="action-btn-label">그만</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => setShowRank(v => !v)}>
              <span>🏆</span><span className="action-btn-label">랭킹</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => setShowStats(v => !v)}>
              <span>📊</span><span className="action-btn-label">스탯</span>
            </button>
            <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!요리')}>
              <span>🍳</span><span className="action-btn-label">요리</span>
            </button>
          </div>
        </div>
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

      {/* Stats modal */}
      {showStats && (
        <div className="overlay" onClick={() => setShowStats(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span>📊 캐릭터 스탯</span>
              <button tabIndex={-1} onClick={() => setShowStats(false)}>✕</button>
            </div>
            <div className="shop-money">보유: {gs.money.toLocaleString()}G</div>
            <div className="section">
              <div className="stat-grid">
                {Object.entries(STAT_DEFS).map(([stat, def]) => {
                  const lv = gs.stats?.[stat] ?? 1;
                  const cost = statCost(lv);
                  const maxed = lv >= STAT_MAX;
                  const canUp = !maxed && gs.money >= cost;
                  return (
                    <div key={stat} className="stat-card">
                      <div className="stat-top">
                        <span className="stat-icon">{def.icon}</span>
                        <span className="stat-name" style={{ color: def.color }}>{stat}</span>
                        <span className="stat-level">Lv.{lv} / {STAT_MAX}</span>
                      </div>
                      <div className="stat-desc">{def.desc}</div>
                      <div className="stat-effect" style={{ color: def.color }}>
                        {stat === '화술' && `현재 판매가 +${((lv-1)*6)}%`}
                        {stat === '민첩' && `현재 속도 +${((lv-1)*0.4).toFixed(1)}`}
                        {stat === '체력' && `현재 시간 -${((lv-1)*5)}%`}
                        {stat === '행운' && `현재 희귀 가중치 +${((lv-1)*22)}%`}
                      </div>
                      <button
                        tabIndex={-1}
                        className={canUp ? 'btn-buy' : 'btn-dis'}
                        style={{ marginTop: 6, width: '100%', fontSize: 11 }}
                        onClick={() => upgradeStat(stat)}
                        disabled={!canUp}
                      >
                        {maxed ? '✨ MAX' : `${cost}G 강화 → Lv.${lv+1}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranking modal */}
      {showRank && <Leaderboard onClose={() => setShowRank(false)} myNickname={nickname} />}

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
                    <div className="rod-fish">
                      {rod.table.map(e => `${e.f}(${e.w}%)`).join(' · ')}
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
