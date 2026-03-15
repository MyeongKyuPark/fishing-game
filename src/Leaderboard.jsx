import { useEffect, useState } from 'react';
import { subscribeFishRankings } from './ranking';
import { FISH } from './gameData';

const FISH_LIST = Object.keys(FISH);
const MEDALS = ['🥇', '🥈', '🥉'];

function rarityColor(r) {
  return { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' }[r] ?? '#fff';
}

function timeAgo(ts) {
  if (!ts) return '';
  const sec = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (sec < 60) return '방금';
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
  return `${Math.floor(sec / 86400)}일 전`;
}

export default function Leaderboard({ onClose, myNickname }) {
  const [selected, setSelected] = useState(FISH_LIST[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setRows([]);
    const unsub = subscribeFishRankings(selected, (data) => {
      setRows(data);
      setLoading(false);
    });
    return unsub;
  }, [selected]);

  const fd = FISH[selected];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()}>
        <div className="panel-head">
          <span>🏆 낚시 기록 랭킹</span>
          <button tabIndex={-1} onClick={onClose}>✕</button>
        </div>

        {/* Fish species tabs */}
        <div className="rank-tabs">
          {FISH_LIST.map(f => (
            <button
              key={f}
              tabIndex={-1}
              className={`rank-tab ${selected === f ? 'rank-tab-active' : ''}`}
              style={selected === f ? { borderColor: rarityColor(FISH[f]?.rarity), color: rarityColor(FISH[f]?.rarity) } : {}}
              onClick={() => setSelected(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="section">
          <div className="rank-fish-header">
            <span style={{ color: rarityColor(fd?.rarity), fontWeight: 700 }}>{selected}</span>
            <span className="rank-fish-range"> {fd?.minSz}~{fd?.maxSz}cm · {fd?.rarity}</span>
          </div>

          {loading && <div className="empty">불러오는 중…</div>}
          {!loading && rows.length === 0 && (
            <div className="empty">아직 기록이 없습니다. 첫 번째 기록을 남겨보세요!</div>
          )}
          {!loading && rows.map((r, i) => (
            <div key={r.nickname} className={`rank-row ${r.nickname === myNickname ? 'rank-me' : ''}`}>
              <span className="rank-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
              <span className="rank-nick">{r.nickname}</span>
              <span className="rank-size" style={{ color: rarityColor(fd?.rarity) }}>
                {r.size.toFixed(1)} cm
              </span>
              <span className="rank-time">{timeAgo(r.caughtAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
