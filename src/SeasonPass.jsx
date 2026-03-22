// Season Pass Panel — monthly progression with 10 tiers
import { SEASON_PASS_REWARDS } from './gameData';

const XP_PER_TIER = 50;

function daysRemainingInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export default function SeasonPass({ onClose, gs, setGs, addMsg }) {
  const xp = gs.seasonPassXP ?? 0;
  const tier = Math.min(10, Math.floor(xp / 50)); // always derive from XP — avoids 4-place sync bug
  const claimed = gs.seasonPassClaimedTiers ?? [];

  const BAIT_KEYS = ['황금미끼', '신화미끼', '황금미끼2'];

  const handleClaim = (reward) => {
    if (claimed.includes(reward.tier)) return;
    if (tier < reward.tier) return;
    setGs(prev => {
      let updated = { ...prev, seasonPassClaimedTiers: [...(prev.seasonPassClaimedTiers ?? []), reward.tier] };
      if (reward.type === 'gold' || reward.type === 'special') {
        updated = { ...updated, money: updated.money + (reward.amount ?? 0) };
      } else if (reward.type === 'item') {
        const key = reward.item;
        const qty = reward.qty ?? 1;
        if (BAIT_KEYS.includes(key)) {
          const newInv = { ...(updated.baitInventory ?? {}), [key]: ((updated.baitInventory ?? {})[key] ?? 0) + qty };
          updated = { ...updated, baitInventory: newInv };
        } else {
          const newInv = { ...(updated.potionInventory ?? {}), [key]: ((updated.potionInventory ?? {})[key] ?? 0) + qty };
          updated = { ...updated, potionInventory: newInv };
        }
      } else if (reward.type === 'cosmetic') {
        const newOutfits = [...new Set([...(updated.ownedOutfits ?? ['기본낚시복']), reward.item])];
        updated = { ...updated, ownedOutfits: newOutfits };
      }
      return updated;
    });
    addMsg(`🎁 시즌패스 ${reward.tier}티어 보상 수령: ${reward.reward}`, 'catch');
  };

  const xpInTier = xp % XP_PER_TIER;
  const pct = Math.min(100, (xpInTier / XP_PER_TIER) * 100);
  const xpToNext = tier >= 10 ? 0 : XP_PER_TIER - xpInTier;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="panel-head">
          <span>🎫 시즌 패스</span>
          <button tabIndex={-1} onClick={onClose}>✕</button>
        </div>

        <div className="section">
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
            현재 티어: <b style={{ color: '#ffd700', fontSize: 16 }}>{tier}/10</b>
            &nbsp;·&nbsp; XP: <b style={{ color: '#88ccff' }}>{xp}</b>
            {tier < 10 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}> (다음 티어까지 {xpToNext} XP)</span>}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, height: 10, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${tier >= 10 ? 100 : pct}%`, height: '100%', background: 'linear-gradient(90deg, #4488ff, #88ccff)', borderRadius: 6, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            이번 달 종료까지 {daysRemainingInMonth()}일 남음
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            XP 획득: 낚시 +1 · 채굴 +1 · 요리 +2 · 퀘스트 완료 +5
          </div>
        </div>

        <div className="section" style={{ maxHeight: 350, overflowY: 'auto' }}>
          {SEASON_PASS_REWARDS.map(r => {
            const isClaimed = claimed.includes(r.tier);
            const isUnlocked = tier >= r.tier;
            const canClaim = isUnlocked && !isClaimed;
            return (
              <div key={r.tier} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                opacity: isUnlocked ? 1 : 0.5,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isClaimed ? '#333' : isUnlocked ? 'rgba(100,200,100,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isClaimed ? '#555' : isUnlocked ? '#44ff88' : 'rgba(255,255,255,0.15)'}`,
                  fontSize: 12, fontWeight: 700, color: isClaimed ? '#666' : isUnlocked ? '#44ff88' : '#888',
                  flexShrink: 0,
                }}>
                  {r.tier}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isUnlocked ? '#fff' : 'rgba(255,255,255,0.4)' }}>{r.reward}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>티어 {r.tier} ({r.tier * XP_PER_TIER} XP)</div>
                </div>
                {isClaimed && <span style={{ fontSize: 11, color: '#888' }}>수령완료</span>}
                {canClaim && (
                  <button
                    style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: 'rgba(255,220,50,0.25)', color: '#ffdd44', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                    onClick={() => handleClaim(r)}>
                    🎁 수령
                  </button>
                )}
                {!isUnlocked && <span style={{ fontSize: 11, color: '#666' }}>잠김</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
