import { useEffect, useState } from 'react';
import { subscribeRankings } from './ranking';

const MEDALS = ['🥇', '🥈', '🥉'];

function timeAgo(ts) {
  if (!ts) return '';
  const sec = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (sec < 60) return '방금 전';
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
  return `${Math.floor(sec / 86400)}일 전`;
}

export default function Leaderboard({ onClose, myNickname }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeRankings((data) => {
      setRows(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()}>
        <div className="panel-head">
          <span>🏆 랭킹</span>
          <button tabIndex={-1} onClick={onClose}>✕</button>
        </div>

        <div className="section">
          {loading && <div className="empty">불러오는 중…</div>}
          {!loading && rows.length === 0 && (
            <div className="empty">아직 기록이 없습니다.</div>
          )}
          {!loading && rows.map((r, i) => (
            <div
              key={r.nickname}
              className={`rank-row ${r.nickname === myNickname ? 'rank-me' : ''}`}
            >
              <span className="rank-pos">
                {i < 3 ? MEDALS[i] : `${i + 1}`}
              </span>
              <span className="rank-nick">{r.nickname}</span>
              <span className="rank-fish">🐟 {r.fishCaught ?? 0}</span>
              <span className="rank-gold">💰 {(r.money ?? 0).toLocaleString()}G</span>
              <span className="rank-time">{timeAgo(r.updatedAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
