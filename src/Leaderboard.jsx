import { useEffect, useState } from 'react';
import { subscribeOverallFishRankings } from './ranking';
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

export default function Leaderboard({ onClose, myNickname }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeOverallFishRankings((data) => {
      setRows(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()}>
        <div className="panel-head">
          <span>🏆 낚시 기록 랭킹 (크기 순)</span>
          <button tabIndex={-1} onClick={onClose}>✕</button>
        </div>

        <div className="section">
          {loading && <div className="empty">불러오는 중…</div>}
          {!loading && rows.length === 0 && (
            <div className="empty">아직 기록이 없습니다. 첫 번째 기록을 남겨보세요!</div>
          )}
          {!loading && rows.map((r, i) => {
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
        </div>
      </div>
    </div>
  );
}
