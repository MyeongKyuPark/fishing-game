// WorldMap — 5-zone overview modal
import { ZONE_LABELS, ZONE_BONUSES, ZONE_CONNECTIONS, ZONE_UNLOCK_REQ } from '../mapData';

const ZONE_META = {
  '마을':    { icon: '🏠', color: '#e8d888', desc: '낚시와 채굴의 조용한 마을', bonusText: '기본 지역' },
  '서쪽초원': { icon: '🌾', color: '#88dd88', desc: '풍요로운 초원. 허브가 풍부하다.', bonusText: '허브 +40% · 생선 판매 -5%' },
  '동쪽절벽': { icon: '⛏',  color: '#cc9966', desc: '광물이 풍부한 험준한 절벽 지대.', bonusText: '광석 +30% · 채굴 속도 +8%' },
  '북쪽고원': { icon: '🏔', color: '#aaddff', desc: '안개 낀 고원. 희귀 자원이 넘친다.', bonusText: '허브 +20% · 광석 +15% · 희귀도 +5%' },
  '남쪽심해': { icon: '🌊', color: '#4488ff', desc: '광활한 심해. 전설급 어종의 서식지.', bonusText: '생선 판매 +25% · 희귀도 +8%' },
};

// 3×3 grid positions: [row, col] (0-indexed)
const GRID = [
  { zone: null,      pos: [0, 0] },
  { zone: '북쪽고원', pos: [0, 1] },
  { zone: null,      pos: [0, 2] },
  { zone: '서쪽초원', pos: [1, 0] },
  { zone: '마을',    pos: [1, 1] },
  { zone: '동쪽절벽', pos: [1, 2] },
  { zone: null,      pos: [2, 0] },
  { zone: '남쪽심해', pos: [2, 1] },
  { zone: null,      pos: [2, 2] },
];

// Arrow connectors between zone cells
const CONNECTORS = [
  { from: [0, 1], to: [1, 1], dir: '↕' },
  { from: [1, 0], to: [1, 1], dir: '↔' },
  { from: [1, 1], to: [1, 2], dir: '↔' },
  { from: [1, 1], to: [2, 1], dir: '↕' },
];

export default function WorldMap({ currentZone, onClose, lockedZones = [] }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #0f1a2e 0%, #0a1020 100%)',
          border: '1px solid rgba(100,160,255,0.2)',
          borderRadius: 20,
          padding: '24px 28px',
          minWidth: 360,
          maxWidth: 480,
          boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#e8d888', fontWeight: 700, fontSize: 16 }}>🗺 세계 지도</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
              현재 위치: {ZONE_LABELS[currentZone] ?? currentZone}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}
          >✕</button>
        </div>

        {/* 3×3 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gridTemplateRows: '1fr auto 1fr auto 1fr', gap: 0, placeItems: 'center' }}>
          {/* Zone cards */}
          {GRID.map(({ zone, pos }, idx) => {
            if (!zone) {
              return <div key={idx} style={{ gridColumn: pos[1] + 1, gridRow: pos[0] + 1, width: 90, height: 80 }} />;
            }
            const meta = ZONE_META[zone];
            const isCurrent = zone === currentZone;
            const isLocked = lockedZones.includes(zone);
            return (
              <div
                key={zone}
                style={{
                  gridColumn: pos[1] * 2 + 1,
                  gridRow: pos[0] * 2 + 1,
                  width: 100,
                  background: isCurrent
                    ? `${meta.color}22`
                    : 'rgba(255,255,255,0.04)',
                  border: isCurrent
                    ? `2px solid ${meta.color}`
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '10px 8px',
                  textAlign: 'center',
                  position: 'relative',
                  boxShadow: isCurrent ? `0 0 16px ${meta.color}44` : 'none',
                  opacity: isLocked ? 0.45 : 1,
                }}
              >
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                    background: meta.color, color: '#111', fontSize: 9, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 4,
                  }}>현재</div>
                )}
                {isLocked && (
                  <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 12 }} title={ZONE_UNLOCK_REQ[zone]?.desc ?? ''}>🔒</div>
                )}
                <div style={{ fontSize: 24, lineHeight: 1, marginBottom: 4 }}>{meta.icon}</div>
                <div style={{ color: meta.color, fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
                  {zone}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, lineHeight: 1.4 }}>
                  {isLocked ? (ZONE_UNLOCK_REQ[zone]?.desc ?? meta.bonusText) : meta.bonusText}
                </div>
              </div>
            );
          })}

          {/* Horizontal connectors (row 1, between col cards) */}
          {/* 서쪽초원 ↔ 마을 */}
          <div style={{ gridColumn: 2, gridRow: 3, color: 'rgba(255,255,255,0.25)', fontSize: 16, padding: '0 4px' }}>↔</div>
          {/* 마을 ↔ 동쪽절벽 */}
          <div style={{ gridColumn: 4, gridRow: 3, color: 'rgba(255,255,255,0.25)', fontSize: 16, padding: '0 4px' }}>↔</div>

          {/* Vertical connectors (between rows, col 1 = 마을 column) */}
          {/* 북쪽고원 ↔ 마을 */}
          <div style={{ gridColumn: 3, gridRow: 2, color: 'rgba(255,255,255,0.25)', fontSize: 16, padding: '4px 0' }}>↕</div>
          {/* 마을 ↔ 남쪽심해 */}
          <div style={{ gridColumn: 3, gridRow: 4, color: 'rgba(255,255,255,0.25)', fontSize: 16, padding: '4px 0' }}>↕</div>
        </div>

        {/* Current zone detail */}
        {ZONE_META[currentZone] && (
          <div style={{
            marginTop: 18,
            background: `${ZONE_META[currentZone].color}11`,
            border: `1px solid ${ZONE_META[currentZone].color}33`,
            borderRadius: 10, padding: '10px 14px',
          }}>
            <div style={{ color: ZONE_META[currentZone].color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
              {ZONE_META[currentZone].icon} {currentZone}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5 }}>
              {ZONE_META[currentZone].desc}
            </div>
            <div style={{ color: ZONE_META[currentZone].color, fontSize: 11, marginTop: 6, opacity: 0.8 }}>
              보너스: {ZONE_META[currentZone].bonusText}
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center' }}>
          M 키 또는 버튼으로 열기 · 맵 가장자리로 이동해 존 이동
        </div>
      </div>
    </div>
  );
}
