import { useEffect, useState } from 'react';
import { subscribeFishRankings } from './ranking';
import { FISH } from './gameData';

const FISH_LIST = Object.keys(FISH);
const MEDALS = ['🥇', '🥈', '🥉'];

function rarityColor(r) {
  return { 흔함: '#909090', 보통: '#44aaff', 희귀: '#aa44ff', 전설: '#ffaa00', 신화: '#ff44ff' }[r] ?? '#fff';
}

export default function RankSidebar({ myNickname }) {
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
    <div className="rank-sidebar">
      <div className="rank-sidebar-title">🏆 랭킹</div>

      {/* Fish tabs — scrollable row */}
      <div className="rank-sidebar-tabs">
        {FISH_LIST.map(f => (
          <button
            key={f}
            tabIndex={-1}
            className={`rank-sidebar-tab ${selected === f ? 'rank-sidebar-tab-active' : ''}`}
            style={selected === f ? { color: rarityColor(FISH[f]?.rarity), borderColor: rarityColor(FISH[f]?.rarity) } : {}}
            onClick={() => setSelected(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Selected fish header */}
      <div className="rank-sidebar-fish-head">
        <span style={{ color: rarityColor(fd?.rarity) }}>{selected}</span>
        <span className="rank-sidebar-fish-range">{fd?.minSz}~{fd?.maxSz}cm</span>
      </div>

      {/* Rows */}
      <div className="rank-sidebar-rows">
        {loading && <div className="rank-sidebar-empty">불러오는 중…</div>}
        {!loading && rows.length === 0 && (
          <div className="rank-sidebar-empty">기록 없음</div>
        )}
        {!loading && rows.map((r, i) => (
          <div key={r.nickname} className={`rank-sidebar-row ${r.nickname === myNickname ? 'rank-sidebar-me' : ''}`}>
            <span className="rank-sidebar-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
            <span className="rank-sidebar-nick">{r.nickname}</span>
            <span className="rank-sidebar-size" style={{ color: rarityColor(fd?.rarity) }}>
              {r.size.toFixed(1)}cm
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
