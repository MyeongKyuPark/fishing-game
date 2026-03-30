// ── Player Profile Card ───────────────────────────────────────────────────────
// Phase 15-3: 플레이어 프로필 카드
import { getTitle } from '../titleData';
import { FISH } from '../gameData';

const RARITY_COLORS = { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' };

export default function ProfileCard({ gs, nickname, onClose }) {
  if (!gs || !nickname) return null;

  const title = getTitle(gs);
  const totalFish = gs.fishCaught ?? 0;
  const achievements = gs.achievements ?? [];
  const prestige = gs.prestigeCount ?? 0;
  const totalGoldEarned = gs.achStats?.totalGoldEarned ?? 0;
  const speciesCount = (gs.caughtSpecies ?? []).length;
  const totalSpecies = FISH.length;
  const completePct = totalSpecies > 0 ? Math.round((speciesCount / totalSpecies) * 100) : 0;

  // Top 3 achievements to display
  const displayAchs = achievements.slice(-3).reverse();

  const copyText = () => {
    const lines = [
      `🎣 [${nickname}] — ${title?.label ?? '초보 낚시꾼'}`,
      `📊 낚시 ${totalFish}마리 | 업적 ${achievements.length}개 | 프레스티지 ${prestige}회`,
      `📖 도감 ${speciesCount}/${totalSpecies} (${completePct}%)`,
      `🏆 대표 업적: ${displayAchs.map(a => a).join(', ') || '없음'}`,
      `💰 총 획득 골드: ${(totalGoldEarned ?? 0).toLocaleString()}G`,
    ];
    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {});
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg,#0d1a2e 0%,#112240 100%)',
        border: '2px solid #335577', borderRadius: 16, padding: 28, minWidth: 300, maxWidth: 380,
        color: '#fff', boxShadow: '0 8px 32px #00000088',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: gs.bodyColor ?? '#5a7aaa',
            border: `3px solid ${title?.color ?? '#888'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {gs.gender === 'female' ? '👩' : '🧑'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{nickname}</div>
            <div style={{ fontSize: 13, color: title?.color ?? '#aaa' }}>
              {title?.label ?? '초보 낚시꾼'}
            </div>
          </div>
          {prestige > 0 && (
            <div style={{
              marginLeft: 'auto', fontSize: 11, background: '#ff880033', border: '1px solid #ff8800',
              borderRadius: 8, padding: '2px 8px', color: '#ffaa44',
            }}>⭐ ×{prestige}</div>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { icon: '🎣', label: '총 낚시', value: totalFish.toLocaleString() + '마리' },
            { icon: '🏆', label: '업적', value: achievements.length + '개' },
            { icon: '💰', label: '총 획득 골드', value: (totalGoldEarned ?? 0).toLocaleString() + 'G' },
            { icon: '✨', label: '프레스티지', value: prestige + '회' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{
              background: '#0a1525', borderRadius: 8, padding: '8px 10px',
              border: '1px solid #223344',
            }}>
              <div style={{ fontSize: 11, color: '#6688aa' }}>{icon} {label}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Fish encyclopedia progress */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#88aacc', marginBottom: 4 }}>
            <span>📖 물고기 도감</span>
            <span>{speciesCount}/{totalSpecies} ({completePct}%)</span>
          </div>
          <div style={{ height: 6, background: '#112', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completePct}%`, background: '#44aaff', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Top achievements */}
        {displayAchs.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#6688aa', marginBottom: 6 }}>🎖 대표 업적</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {displayAchs.map(a => (
                <span key={a} style={{
                  background: '#1a2a40', border: '1px solid #335577', borderRadius: 6,
                  padding: '3px 8px', fontSize: 11, color: '#aaccff',
                }}>{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyText} style={{
            flex: 1, padding: '8px 0', background: '#1a3a6a', border: '1px solid #44aaff',
            borderRadius: 8, color: '#88ddff', cursor: 'pointer', fontSize: 13,
          }}>📋 공유 복사</button>
          <button onClick={onClose} style={{
            flex: 1, padding: '8px 0', background: '#1a2030', border: '1px solid #334',
            borderRadius: 8, color: '#aaa', cursor: 'pointer', fontSize: 13,
          }}>닫기</button>
        </div>
      </div>
    </div>
  );
}
