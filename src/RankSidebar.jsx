import { useEffect, useState } from 'react';
import { subscribePlayerTitleRankings } from './ranking';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RankSidebar({ myNickname }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribePlayerTitleRankings((data) => {
      setRows(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="rank-sidebar">
      <div className="rank-sidebar-title">🏆 칭호 랭킹</div>

      <div className="rank-sidebar-rows">
        {loading && <div className="rank-sidebar-empty">불러오는 중…</div>}
        {!loading && rows.length === 0 && (
          <div className="rank-sidebar-empty">기록 없음</div>
        )}
        {!loading && rows.map((r, i) => (
          <div key={r.nickname} className={`rank-sidebar-row ${r.nickname === myNickname ? 'rank-sidebar-me' : ''}`}>
            <span className="rank-sidebar-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
            <span className="rank-sidebar-nick">{r.nickname}</span>
            <span className="rank-sidebar-size" style={{ color: r.titleColor ?? '#aaa', fontSize: 9 }}>
              [{r.titleLabel}]
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
