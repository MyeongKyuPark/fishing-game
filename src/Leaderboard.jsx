import { useEffect, useState } from 'react';
import { subscribeOverallFishRankings, subscribeGoldRankings, subscribeAbilityRankings, subscribeAchievementRankings, subscribeTournament, getWeekKey, subscribePrestigeRankings } from './ranking';
import { FISH } from './gameData';

const MEDALS = ['🥇', '🥈', '🥉'];

function rarityColor(r) {
  return { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' }[r] ?? '#fff';
}

function timeAgo(ts) {
  if (!ts) return '';
  try {
    const sec = Math.floor((Date.now() - ts.toMillis()) / 1000);
    if (sec < 60) return '방금';
    if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
    return `${Math.floor(sec / 86400)}일 전`;
  } catch { return ''; }
}

const TABS = [
  { key: 'fish', label: '🐟 낚시 기록' },
  { key: 'gold', label: '💰 보유 골드' },
  { key: 'ability', label: '⚡ 어빌리티' },
  { key: 'achievement', label: '🏆 업적' },
  { key: 'tournament', label: '🎣 주간 대회' },
  { key: 'prestige', label: '🌟 프레스티지' },
];

export default function Leaderboard({ onClose, myNickname }) {
  const [tab, setTab] = useState('fish');
  const [fishRows, setFishRows] = useState([]);
  const [goldRows, setGoldRows] = useState([]);
  const [abilRows, setAbilRows] = useState([]);
  const [achRows, setAchRows] = useState([]);
  const [tournRows, setTournRows] = useState([]);
  const [prestigeRows, setPrestigeRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let unsub;
    if (tab === 'fish') {
      unsub = subscribeOverallFishRankings(data => { setFishRows(data); setLoading(false); });
    } else if (tab === 'gold') {
      unsub = subscribeGoldRankings(data => { setGoldRows(data); setLoading(false); });
    } else if (tab === 'ability') {
      unsub = subscribeAbilityRankings(data => { setAbilRows(data); setLoading(false); });
    } else if (tab === 'tournament') {
      unsub = subscribeTournament(data => { setTournRows(data); setLoading(false); });
    } else if (tab === 'prestige') {
      unsub = subscribePrestigeRankings(data => { setPrestigeRows(data); setLoading(false); });
    } else {
      unsub = subscribeAchievementRankings(data => { setAchRows(data); setLoading(false); });
    }
    return unsub;
  }, [tab]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()}>
        <div className="panel-head">
          <span>🏆 랭킹</span>
          <button tabIndex={-1} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {TABS.map(t => (
            <button key={t.key} tabIndex={-1} onClick={() => setTab(t.key)} style={{
              padding: '5px 12px', borderRadius: '6px 6px 0 0', fontSize: 12, fontWeight: 600,
              background: tab === t.key ? 'rgba(100,160,255,0.18)' : 'transparent',
              border: 'none', color: tab === t.key ? '#88ccff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', borderBottom: tab === t.key ? '2px solid #88ccff' : '2px solid transparent',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="section">
          {loading && <div className="empty">불러오는 중…</div>}
          {!loading && tab === 'tournament' && (
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>
              📅 이번 주 낚시 마릿수 기준 ({getWeekKey()})
            </div>
          )}
          {!loading && tab === 'fish' && fishRows.map((r, i) => {
            const fd = FISH[r.fishName];
            const rarity = r.rarity ?? fd?.rarity ?? '흔함';
            return (
              <div key={`${r.nickname}_${r.fishName}`} className={`rank-row ${r.nickname === myNickname ? 'rank-me' : ''}`}>
                <span className="rank-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
                <span className="rank-nick">{r.nickname}</span>
                <span className="rank-size" style={{ color: rarityColor(rarity), fontWeight: 700 }}>
                  {r.size.toFixed(1)} cm
                </span>
                <span style={{ color: rarityColor(rarity), fontSize: 11, marginLeft: 6 }}>
                  {r.fishName}
                </span>
                <span className="rank-time">{timeAgo(r.caughtAt)}</span>
              </div>
            );
          })}
          {!loading && tab === 'gold' && goldRows.map((r, i) => (
            <div key={r.nickname} className={`rank-row ${r.nickname === myNickname ? 'rank-me' : ''}`}>
              <span className="rank-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
              <span className="rank-nick">{r.nickname}</span>
              <span className="rank-size" style={{ color: '#ffd700', fontWeight: 700 }}>
                {(r.money ?? 0).toLocaleString()}G
              </span>
            </div>
          ))}
          {!loading && tab === 'ability' && abilRows.map((r, i) => (
            <div key={r.nickname} className={`rank-row ${r.nickname === myNickname ? 'rank-me' : ''}`}>
              <span className="rank-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
              <span className="rank-nick">{r.nickname}</span>
              <span className="rank-size" style={{ color: '#88ffcc', fontWeight: 700 }}>
                {(r.totalAbility ?? 0).toFixed(0)} pts
              </span>
            </div>
          ))}
          {!loading && tab === 'achievement' && achRows.map((r, i) => (
            <div key={r.nickname} className={`rank-row ${r.nickname === myNickname ? 'rank-me' : ''}`}>
              <span className="rank-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
              <span className="rank-nick">{r.nickname}</span>
              <span className="rank-size" style={{ color: '#ffcc44', fontWeight: 700 }}>
                {(r.achievementCount ?? 0)}개
              </span>
            </div>
          ))}
          {!loading && tab === 'tournament' && tournRows.length === 0 && (
            <div className="empty">이번 주 참가자가 없습니다. 낚시를 시작해보세요!</div>
          )}
          {!loading && tab === 'tournament' && tournRows.map((r, i) => (
            <div key={r.nickname} className={`rank-row ${r.nickname === myNickname ? 'rank-me' : ''}`}>
              <span className="rank-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
              <span className="rank-nick">{r.nickname}</span>
              <span className="rank-size" style={{ color: '#44ccff', fontWeight: 700 }}>
                {(r.score ?? 0).toLocaleString()}마리
              </span>
            </div>
          ))}
          {!loading && tab === 'prestige' && prestigeRows.length === 0 && (
            <div className="empty">아직 명예 초기화를 달성한 플레이어가 없습니다.</div>
          )}
          {!loading && tab === 'prestige' && prestigeRows.map((r, i) => (
            <div key={r.nickname} className={`rank-row ${r.nickname === myNickname ? 'rank-me' : ''}`}>
              <span className="rank-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
              <span className="rank-nick">{r.nickname}</span>
              <span className="rank-size" style={{ color: '#ffd700', fontWeight: 700 }}>
                🌟 {(r.prestigeCount ?? 0)}회
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
