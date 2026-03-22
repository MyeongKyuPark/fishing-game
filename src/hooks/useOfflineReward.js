// ── Offline Reward Hook ───────────────────────────────────────────────────────
import { useEffect } from 'react';
import { loadSave, checkDailyBonus, getDailyQuests, SAVE_VERSION, saveKey } from './useGameState';

export function useOfflineReward({ nickname, setGs, addMsgRef }) {
  useEffect(() => {
    if (!nickname) return;
    const saved = loadSave(nickname);
    const { bonus, streak } = checkDailyBonus(nickname);
    const today = new Date().toDateString();
    const innAff = saved.npcAffinity?.여관주인 ?? 0;
    const quests = getDailyQuests(innAff >= 50 ? 1 : 0);
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
    const maxMins = 150; // 최대 2.5시간
    const effectiveMins = Math.min(awayMins, maxMins);
    const bankAff = saved.npcAffinity?.은행원 ?? 0;
    const innOffMult = innAff >= 80 ? 1.5 : 1.0;
    const bankOffMult = bankAff >= 80 ? 2.0 : 1.0;
    const offlineMult = innOffMult * bankOffMult;
    const offlineReward = Math.floor(effectiveMins * 10 * offlineMult);
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
      const multParts = [];
      if (innOffMult > 1) multParts.push('여관주인 ×1.5');
      if (bankOffMult > 1) multParts.push('은행원 ×2');
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
