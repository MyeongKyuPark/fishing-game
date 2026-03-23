// ── WebSocket / Firebase Subscriptions + Game Sync Effects ──────────────────
import { useEffect, useRef } from 'react';
import { BOOTS, FISH } from '../gameData';
import { PETS, PET_LEVEL_MULT, PET_MAX_LEVEL } from '../petData';
import { DEFAULT_ABILITIES } from '../abilityData';
import { getWeather, msUntilNextWeather } from '../weatherData';
import { getCurrentSeason } from '../seasonData';
import { getTitle, TITLES } from '../titleData';
import { subscribeOtherPlayers, updatePlayerPresence, removePlayerPresence,
  subscribePartyInvite, subscribePartyMembers, subscribePartyChat, joinParty } from '../multiplay';
import { subscribeGuildList, subscribeGuildCompetition, subscribeGuild, subscribeGuildMembers,
  subscribeGuildChat, subscribeGuildQuest } from '../guildData';
import { subscribeMarket, subscribeMyListings } from '../marketData';
import { subscribeAnnouncements, subscribeActiveServerEvent, subscribeServerStats,
  subscribeTournament, subscribeServerQuest, subscribeServerBoss,
  savePlayerTitle, broadcastAnnouncement, subscribeSeasonRankings } from '../ranking';
import { STORY_CHAPTERS } from './useGameState';

export function useWebSocket(params) {
  const {
    nickname, roomId, myGuildId, partyId,
    // refs
    gameRef, stateRef, addMsgRef, otherPlayersRef, prevOtherPlayersRef, lastPosRef,
    weatherRef, fishSurgeRef, serverEventRef, partyMembersRef, partyIdRef, myGuildIdRef,
    prevBossHpRef, prevServerQuestRef, prevServerStatsRef, nicknameRef, roomIdRef,
    // setters
    setGuildList, setGuildCompetition, setGuildInfo, setGuildMembers, setGuildChat, setGuildQuest,
    setMarketListings, setMyListings, setServerAnnouncements, setServerEvent, setServerQuest,
    setServerBoss, setTournamentRanking, setSeasonRanking, setServerStats, setFishSurgeEvent, setPartyMessages,
    setPendingInvite, setGs, setWeather, setIsOnline, setShowAnnounce,
    // callbacks
    addMsg,
    // gs values needed for sync effects
    gs,
    weather,
  } = params;

  // ── Multiplayer: subscribe to other players ───────────────────────────────
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

  // ── Party: subscribe to incoming invites ─────────────────────────────────
  useEffect(() => {
    if (!nickname) return;
    const unsub = subscribePartyInvite(nickname, (invite) => {
      setPendingInvite(invite);
      if (invite) {
        setTimeout(() => addMsgRef.current(`🎉 ${invite.inviter}님이 파티에 초대했습니다! /파티수락 또는 /파티거절`, 'catch'), 0);
      }
    });
    return unsub;
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Party: sync partyId ref + members/chat ────────────────────────────────
  useEffect(() => {
    partyIdRef.current = partyId;
    if (!partyId || !nickname) { partyMembersRef.current = []; return; }
    const unsubMembers = subscribePartyMembers(partyId, nickname, (members) => {
      partyMembersRef.current = members;
    });
    const unsubChat = subscribePartyChat(partyId, (msgs) => {
      setPartyMessages(msgs);
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        if (last && last.nickname !== nickname) {
          setTimeout(() => addMsgRef.current(`🟢 [파티] ${last.nickname}: ${last.message}`, 'catch'), 0);
        }
      }
    });
    if (roomId) joinParty(partyId, nickname, roomId).catch(() => {});
    return () => { unsubMembers(); unsubChat(); partyMembersRef.current = []; };
  }, [partyId, nickname, roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guild: sync ref ───────────────────────────────────────────────────────
  useEffect(() => { myGuildIdRef.current = myGuildId; }, [myGuildId]);

  // ── Guild: top-20 list + weekly competition ───────────────────────────────
  useEffect(() => {
    if (!nickname) return;
    const unsubList = subscribeGuildList(setGuildList);
    const unsubComp = subscribeGuildCompetition(setGuildCompetition);
    return () => { unsubList(); unsubComp(); };
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guild: current guild info, members, chat, quest ───────────────────────
  useEffect(() => {
    if (!myGuildId || !nickname) return;
    const unsubInfo    = subscribeGuild(myGuildId, setGuildInfo);
    const unsubMembers = subscribeGuildMembers(myGuildId, setGuildMembers);
    const unsubChat    = subscribeGuildChat(myGuildId, (msgs) => {
      setGuildChat(msgs);
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        if (last && last.nickname !== nickname) {
          setTimeout(() => addMsgRef.current(`🏰 [길드] ${last.nickname}: ${last.message}`, 'catch'), 0);
        }
      }
    });
    const unsubQuest   = subscribeGuildQuest(myGuildId, setGuildQuest);
    return () => { unsubInfo(); unsubMembers(); unsubChat(); unsubQuest(); };
  }, [myGuildId, nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Marketplace: subscribe to listings ───────────────────────────────────
  useEffect(() => {
    if (!nickname) return;
    const unsubAll = subscribeMarket(setMarketListings);
    const unsubMine = subscribeMyListings(nickname, setMyListings);
    return () => { unsubAll(); unsubMine(); };
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Multiplayer: throttled position sync ─────────────────────────────────
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
  }, [nickname, roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Multiplayer: cleanup on page close ───────────────────────────────────
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Online/offline detection ──────────────────────────────────────────────
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save title to leaderboard ─────────────────────────────────────────────
  const prevTitleRef = useRef(null);
  useEffect(() => {
    if (!nickname) return;
    const t = getTitle(gs);
    if (prevTitleRef.current === t.label) return;
    prevTitleRef.current = t.label;
    const idx = TITLES.findIndex(ti => ti.label === t.label);
    savePlayerTitle(nickname, t.label, t.color, idx);
  }, [nickname, gs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Server announcements ──────────────────────────────────────────────────
  useEffect(() => {
    if (!nickname || !roomId) return;
    return subscribeAnnouncements(setServerAnnouncements);
  }, [nickname, roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-hide announcement banner ────────────────────────────────────────
  useEffect(() => {
    // Handled in App.jsx via the serverAnnouncements state
  }, []);

  // ── Active server event ───────────────────────────────────────────────────
  useEffect(() => {
    if (!nickname) return;
    const unsub = subscribeActiveServerEvent(evt => {
      setServerEvent(evt);
      serverEventRef.current = evt;
    });
    return unsub;
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 전설어 출몰 이벤트 ────────────────────────────────────────────────────
  useEffect(() => { fishSurgeRef.current = null; }, []); // init
  useEffect(() => {
    if (!nickname) return;
    const RARE_FISH = ['감성돔', '우럭', '뱀장어', '황새치', '용고기', '고대어'];
    const scheduleNext = () => {
      const delay = (20 + Math.floor(Math.random() * 20)) * 60 * 1000;
      return setTimeout(() => {
        const fish = RARE_FISH[Math.floor(Math.random() * RARE_FISH.length)];
        const until = Date.now() + 30 * 60 * 1000;
        setFishSurgeEvent({ fish, until });
        fishSurgeRef.current = { fish, until };
        const fd = FISH[fish];
        const rarityLabel = fd?.rarity === '신화' ? '🌟 신화' : '⭐ 전설';
        addMsgRef.current(`📣 [이벤트] ${rarityLabel} ${fish} 출몰! 30분간 출현 확률 상승!`, 'catch');
        if (stateRef.current?.selectedJob === '낚시장인') {
          setTimeout(() => addMsgRef.current(`🎣 [낚시 장인] ${fish}이(가) 출몰했습니다! 당신만의 알림 — 지금 바로 낚시터로!`, 'catch'), 500);
        }
        const clearTimer = setTimeout(() => {
          setFishSurgeEvent(null);
          fishSurgeRef.current = null;
          addMsgRef.current(`📣 [이벤트] ${fish} 출몰 이벤트가 종료되었습니다.`, 'system');
        }, 30 * 60 * 1000);
        const nextTimer = scheduleNext();
        return () => { clearTimeout(clearTimer); clearTimeout(nextTimer); };
      }, delay);
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Server stats ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!nickname || !roomId) return;
    return subscribeServerStats(setServerStats);
  }, [nickname, roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Weekly tournament ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!nickname) return;
    return subscribeTournament(setTournamentRanking);
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Monthly season league ─────────────────────────────────────────────────
  useEffect(() => {
    if (!nickname) return;
    return subscribeSeasonRankings(setSeasonRanking);
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Server cooperative quest ──────────────────────────────────────────────
  useEffect(() => {
    if (!nickname) return;
    return subscribeServerQuest(data => {
      const MILESTONES = [1000, 5000, 10000, 50000, 100000];
      const prev = prevServerQuestRef.current?.fishCaught ?? 0;
      const curr = data?.fishCaught ?? 0;
      for (const m of MILESTONES) {
        if (prev < m && curr >= m) {
          addMsg(`🎉 서버 공동 퀘스트 달성! 전 서버 물고기 ${m.toLocaleString()}마리 포획!`, 'system');
          broadcastAnnouncement(`🎉 서버 공동 퀘스트 달성! 전 서버에서 ${m.toLocaleString()}마리 포획 완료!`, 'event');
        }
      }
      prevServerQuestRef.current = data;
      setServerQuest(data);
    });
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Server boss ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!nickname) return;
    return subscribeServerBoss(data => {
      const prev = prevBossHpRef.current;
      if (data && !data.defeated && data.hp === 0) {
        addMsgRef.current(`🎉 서버 공동 보스 "${data.name}" 처치 완료! 전 서버 낚시꾼들의 승리!`, 'catch');
        broadcastAnnouncement(`🏆 서버 공동 보스 "${data.name}"이(가) 처치되었습니다! 모두의 승리!`);
      } else if (data && data.hp > 0 && prev === null) {
        addMsgRef.current(`⚔️ 서버 공동 보스 "${data.name}" 출현! HP: ${data.hp}/${data.maxHp} — 낚시/채굴로 보스를 공격하세요!`, 'catch');
      }
      prevBossHpRef.current = data?.hp ?? null;
      setServerBoss(data);
    });
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Story chapter triggers ────────────────────────────────────────────────
  useEffect(() => {
    if (!nickname) return;
    const fishCount = gs.fishCaught ?? 0;
    const shown = gs.shownChapters ?? [];
    for (const ch of STORY_CHAPTERS) {
      if (!shown.includes(ch.id) && fishCount >= ch.trigger) {
        ch.lines.forEach((line, i) => {
          setTimeout(() => addMsgRef.current(line, 'catch'), i * 1600);
        });
        setGs(prev => ({ ...prev, shownChapters: [...(prev.shownChapters ?? []), ch.id] }));
        break;
      }
    }
  }, [gs.fishCaught, nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── gameRef syncs ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameRef.current) return;
    const bootsBonus = BOOTS[gs.boots]?.speedBonus ?? 0;
    const potionBonus = (gs.activePotion?.effect?.speedBonus ?? 0);
    gameRef.current.speedBonus = bootsBonus + potionBonus;
  }, [gs.boots, gs.activePotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.marineGear = gs.marineGear ?? null;
  }, [gs.marineGear]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!gameRef.current) return;
    const pet = gs.activePet ? PETS[gs.activePet] : null;
    if (!pet) { gameRef.current.petBonus = {}; return; }
    const level = (gs.petLevels ?? {})[gs.activePet] ?? 1;
    const mult = PET_LEVEL_MULT[Math.min(level, PET_MAX_LEVEL) - 1] ?? 1.0;
    const scaledBonus = {};
    for (const [k, v] of Object.entries(pet.bonus)) {
      if (k.endsWith('Mult')) {
        scaledBonus[k] = 1 - (1 - v) * mult;
      } else {
        scaledBonus[k] = v * mult;
      }
    }
    gameRef.current.petBonus = scaledBonus;
  }, [gs.activePet, gs.petLevels]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.innBuff = gs.innBuff;
  }, [gs.innBuff]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.equippedItems = {
      boots: gs.boots ?? '기본신발',
      ring: gs.equippedJewelry?.ring ?? null,
      necklace: gs.equippedJewelry?.necklace ?? null,
      gatherTool: gs.gatherTool ?? '맨손',
      pickaxe: gs.pickaxe ?? '나무곡괭이',
      hat: gs.hat ?? null,
      activeRodSkin: gs.activeRodSkin ?? '기본스킨',
    };
  }, [gs.boots, gs.equippedJewelry, gs.gatherTool, gs.pickaxe, gs.hat, gs.activeRodSkin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (gameRef.current) gameRef.current.farmPlots = gs.farmPlots ?? []; }, [gs.farmPlots]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rain auto-waters crops ────────────────────────────────────────────────
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
      setTimeout(() => addMsgRef.current('🌧️ 비가 내려 작물에 물을 줬습니다! (성장 25% 단축)', 'catch'), 0);
      return { ...prev, farmPlots: newPlots };
    });
  }, [weather?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Weather update ────────────────────────────────────────────────────────
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
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Storm event ───────────────────────────────────────────────────────────
  const prevWeatherId = useRef(null);
  useEffect(() => {
    if (!roomId || !weather) return;
    if (weather.id === 'storm' && prevWeatherId.current !== 'storm') {
      addMsg('⛈ 폭풍이 몰아칩니다! 광산에서 폭풍석이 출현합니다! (낚시 불가)', 'system');
      broadcastAnnouncement(`⛈ 폭풍 강화 이벤트 발생! 광산에서 폭풍석 드롭 활성화!`, 'event');
    }
    prevWeatherId.current = weather.id;
  }, [weather?.id, roomId]); // eslint-disable-line react-hooks/exhaustive-deps
}
