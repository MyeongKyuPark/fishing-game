// ── Offline Reward Hook ───────────────────────────────────────────────────────
import { useEffect } from 'react';
import { loadSave, checkDailyBonus, getDailyQuests, SAVE_VERSION, saveKey } from './useGameState';
import { FURNITURE, COTTAGE_LEVEL_BONUSES } from '../gameData';
import { getActiveTitleBonus } from '../titleData';
import { setActiveZone, ZONE_TILES } from '../mapData';
import { setActiveTiles } from '../canvas/drawMap';

export function useOfflineReward({ nickname, setGs, addMsgRef, checkAndGrantAchievementsRef }) {
  useEffect(() => {
    if (!nickname) return;
    const saved = loadSave(nickname);
    const { bonus, streak } = checkDailyBonus(nickname);
    const today = new Date().toDateString();
    const innAff = saved.npcAffinity?.여관주인 ?? 0;
    // Furniture questSlot bonus: count total questSlot from placed furniture
    const placedFurniture = saved.cottage?.furniture ?? [];
    const furnitureQuestSlot = placedFurniture.reduce((sum, f) => sum + (FURNITURE[f.key]?.bonus?.questSlot ?? 0), 0);
    const quests = getDailyQuests((innAff >= 50 ? 1 : 0) + furnitureQuestSlot);
    const isNewDay = saved.questDate !== today;
    // Push notification on new day (daily quest reset)
    if (isNewDay && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Tidehaven 🎣 일일 퀘스트 초기화!', {
          body: '새로운 일일 퀘스트가 준비되었습니다. 지금 바로 확인해보세요!',
          icon: '/vite.svg',
        });
      } catch { /* ignore */ }
    }
    const questProgress = isNewDay ? {} : (saved.questProgress ?? {});
    const questClaimed = isNewDay ? {} : (saved.questClaimed ?? {});
    const zoneChallengeProgress = isNewDay ? {} : (saved.zoneChallengeProgress ?? {});
    const loginStreak = Math.max(saved.achStats?.loginStreak ?? 0, streak);
    const baseAchStats = { ...(saved.achStats ?? {}), loginStreak };
    let base = { ...saved, dailyQuests: quests, questProgress, questClaimed, questDate: today,
      zoneChallengeDate: today, zoneChallengeProgress,
      achStats: baseAchStats };
    if (!saved.firstLoginDate) {
      base.firstLoginDate = new Date().toISOString();
    }
    // Fire achievement check for loginStreak after state is set
    setTimeout(() => checkAndGrantAchievementsRef?.current?.(baseAchStats), 500);
    const now2 = Date.now();
    const awayMs = Math.max(0, now2 - (saved.lastSaveTime ?? now2));
    const awayMins = Math.floor(awayMs / 60000);
    const maxMins = 150; // 최대 2.5시간
    const effectiveMins = Math.min(awayMins, maxMins);
    const bankAff = saved.npcAffinity?.은행원 ?? 0;
    const innOffMult = innAff >= 80 ? 1.5 : 1.0;
    const bankOffMult = bankAff >= 80 ? 2.0 : 1.0;
    const furnitureOffMult = placedFurniture.reduce((acc, f) => acc * (FURNITURE[f.key]?.bonus?.offlineMult ?? 1.0), 1.0);
    const titleOffBonus = getActiveTitleBonus(saved).offlineBonus ?? 0;
    const cottageLevel = saved.cottageLevel ?? 1;
    const cottageOffBonus = COTTAGE_LEVEL_BONUSES[cottageLevel]?.offlineBonus ?? 0;
    const offlineMult = innOffMult * bankOffMult * furnitureOffMult * (1 + titleOffBonus) * (1 + cottageOffBonus);
    const offlineReward = Math.floor(effectiveMins * 10 * offlineMult);
    // Restore zone module state from save (prevents blank map on reload)
    const savedZone = base.worldZone ?? '마을';
    setActiveZone(savedZone);
    setActiveTiles(ZONE_TILES[savedZone] ?? ZONE_TILES['마을']);
    // Clear expired mountainBuff
    if (base.mountainBuff && Date.now() >= base.mountainBuff.expiresAt) {
      base = { ...base, mountainBuff: null };
    }

    if (bonus > 0) {
      const bonusAchStats = { ...baseAchStats, maxMoney: Math.max(baseAchStats.maxMoney ?? 0, saved.money + bonus) };
      setTimeout(() => checkAndGrantAchievementsRef?.current?.(bonusAchStats), 600);
      if (streak >= 7) {
        setGs({ ...base, money: saved.money + bonus, achStats: bonusAchStats,
          baitInventory: { ...(base.baitInventory ?? {}), 전설미끼: ((base.baitInventory ?? {})['전설미끼'] ?? 0) + 1 },
          ownedBait: base.ownedBait?.includes('전설미끼') ? base.ownedBait : [...(base.ownedBait ?? []), '전설미끼'],
        });
      } else {
        setGs({ ...base, money: saved.money + bonus, achStats: bonusAchStats });
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
      setGs(prev => {
        const prevStats = prev.achStats ?? {};
        const updatedStats = { ...prevStats, maxMoney: Math.max(prevStats.maxMoney ?? 0, prev.money + offlineReward) };
        setTimeout(() => checkAndGrantAchievementsRef?.current?.(updatedStats), 0);
        return { ...prev, money: prev.money + offlineReward, achStats: updatedStats };
      });
      const multParts = [];
      if (innOffMult > 1) multParts.push('여관주인 ×1.5');
      if (bankOffMult > 1) multParts.push('은행원 ×2');
      if (furnitureOffMult > 1) multParts.push(`가구 ×${furnitureOffMult.toFixed(2)}`);
      if (cottageOffBonus > 0) multParts.push(`오두막 Lv${cottageLevel} +${Math.round(cottageOffBonus * 100)}%`);
      const multLabel = multParts.length > 0 ? ` (${multParts.join(', ')})` : '';
      setTimeout(() => addMsgRef.current(`💤 자리 비운 ${awayMins}분 동안 +${offlineReward}G 획득!${multLabel} (최대 2.5시간)`, 'catch'), 1800);
    }
    // 상인 lv80: 특별 미끼(전설미끼) 매일 지급
    const merchantAff = saved.npcAffinity?.상인 ?? 0;
    if (merchantAff >= 80 && saved.merchantBaitDate !== today) {
      setGs(prev => ({
        ...prev,
        merchantBaitDate: today,
        baitInventory: { ...(prev.baitInventory ?? {}), 전설미끼: ((prev.baitInventory ?? {})['전설미끼'] ?? 0) + 1 },
        ownedBait: prev.ownedBait?.includes('전설미끼') ? prev.ownedBait : [...(prev.ownedBait ?? []), '전설미끼'],
      }));
      setTimeout(() => addMsgRef.current('🎣 상인 아저씨: "단골 특별 서비스! 전설 미끼 1개 드립니다~" (오늘 1회)', 'catch'), 2400);
    }
  }, [nickname]); // eslint-disable-line react-hooks/exhaustive-deps
}
