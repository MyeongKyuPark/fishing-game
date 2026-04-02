// WorldMap — 5-zone overview modal
import { ZONE_LABELS, ZONE_BONUSES, ZONE_CONNECTIONS, ZONE_UNLOCK_REQ } from '../mapData';
import { getZoneDailyChallenge } from '../zoneChallengeData';

const ZONE_MASTERY_THRESHOLDS = [10, 30, 60, 100, 150];
function getZoneMasteryLevel(zoneMastery, zone) {
  const exp = zoneMastery?.[zone] ?? 0;
  let lv = 0;
  for (const t of ZONE_MASTERY_THRESHOLDS) if (exp >= t) lv++;
  return lv;
}
const MASTERY_COLORS = ['#aaaaaa', '#88dd88', '#44aaff', '#ff9944', '#ff44aa', '#ffdd00'];

const ZONE_META = {
  '마을':    { icon: '🏠', color: '#e8d888', desc: '낚시와 채굴의 조용한 마을', bonusText: '기본 지역' },
  '서쪽초원': { icon: '🌾', color: '#88dd88', desc: '풍요로운 초원. 허브가 풍부하다.', bonusText: '허브 +40% · 생선 판매 -5%' },
  '동쪽절벽': { icon: '⛏',  color: '#cc9966', desc: '광물이 풍부한 험준한 절벽 지대.', bonusText: '광석 +30% · 채굴 속도 +8%' },
  '북쪽고원': { icon: '🏔', color: '#aaddff', desc: '안개 낀 고원. 희귀 자원이 넘친다.', bonusText: '허브 +20% · 광석 +15% · 희귀도 +5%' },
  '남쪽심해': { icon: '🌊', color: '#4488ff', desc: '광활한 심해. 전설급 어종의 서식지.', bonusText: '생선 판매 +25% · 희귀도 +8%' },
  '항구마을': { icon: '⚓', color: '#44ddaa', desc: '분주한 항구. 어시장과 부두가 펼쳐진다.', bonusText: '생선 판매 +40% · 희귀도 +10%' },
  '고대신전': { icon: '🏺', color: '#cc9944', desc: '고대 문명의 유적. 신비로운 어종이 산다.', bonusText: '광석 +50% · 희귀도 +15% · 생선 +10%' },
  '설산정상': { icon: '❄️', color: '#aaddff', desc: '눈 덮인 고산. 얼음 호수의 전설 어종.', bonusText: '광석 +60% · 희귀도 +12%' },
};

// 5×5 grid layout (rows 0-4, cols 0-4)
// New zones extend outward from existing 3×3
const GRID = [
  // Row 0: 설산정상 above 북쪽고원
  { zone: null,       pos: [0, 0] },
  { zone: '설산정상', pos: [0, 2] },
  { zone: null,       pos: [0, 4] },
  // Row 1: 북쪽고원 row
  { zone: null,       pos: [1, 0] },
  { zone: '북쪽고원', pos: [1, 2] },
  { zone: null,       pos: [1, 4] },
  // Row 2: main row (서쪽초원 - 마을 - 동쪽절벽 - 고대신전)
  { zone: '서쪽초원', pos: [2, 0] },
  { zone: '마을',     pos: [2, 2] },
  { zone: '동쪽절벽', pos: [2, 4] },
  { zone: '고대신전', pos: [2, 6] },
  // Row 3: 남쪽심해 row
  { zone: null,       pos: [3, 0] },
  { zone: '남쪽심해', pos: [3, 2] },
  { zone: null,       pos: [3, 4] },
  // Row 4: 항구마을 below 남쪽심해
  { zone: null,       pos: [4, 0] },
  { zone: '항구마을', pos: [4, 2] },
  { zone: null,       pos: [4, 4] },
];

export default function WorldMap({ currentZone, onClose, lockedZones = [], zoneMastery = {}, zoneChallengeProgress = {}, onClaimZoneChallenge }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto',
        padding: '12px 8px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #0f1a2e 0%, #0a1020 100%)',
          border: '1px solid rgba(100,160,255,0.2)',
          borderRadius: 20,
          padding: '16px 16px 20px',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* X 버튼 — 항상 화면 안에 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: '#fff', fontSize: 18, cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, zIndex: 1,
          }}
        >✕</button>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, paddingRight: 40 }}>
          <div>
            <div style={{ color: '#e8d888', fontWeight: 700, fontSize: 16 }}>🗺 세계 지도</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
              현재 위치: {ZONE_LABELS[currentZone] ?? currentZone}
            </div>
          </div>
        </div>

        {/* Extended grid: 5 rows × up to 7 cols */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr', gridTemplateRows: 'repeat(9, auto)', gap: 0, placeItems: 'center' }}>
          {/* Zone cards */}
          {GRID.map(({ zone, pos }, idx) => {
            if (!zone) return null;
            const meta = ZONE_META[zone];
            const isCurrent = zone === currentZone;
            const isLocked = lockedZones.includes(zone);
            const gridCol = pos[1] + 1;
            const gridRow = pos[0] * 2 + 1;
            return (
              <div
                key={zone}
                style={{
                  gridColumn: gridCol,
                  gridRow: gridRow,
                  width: 88,
                  background: isCurrent ? `${meta.color}22` : 'rgba(255,255,255,0.04)',
                  border: isCurrent ? `2px solid ${meta.color}` : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '8px 6px',
                  textAlign: 'center',
                  position: 'relative',
                  boxShadow: isCurrent ? `0 0 16px ${meta.color}44` : 'none',
                  opacity: isLocked ? 0.45 : 1,
                }}
              >
                {isCurrent && (
                  <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: meta.color, color: '#111', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>현재</div>
                )}
                {isLocked && (
                  <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 11 }} title={ZONE_UNLOCK_REQ[zone]?.desc ?? ''}>🔒</div>
                )}
                {!isLocked && zone !== '마을' && (() => {
                  const lv = getZoneMasteryLevel(zoneMastery, zone);
                  const exp = zoneMastery?.[zone] ?? 0;
                  const nextThreshold = ZONE_MASTERY_THRESHOLDS[lv] ?? null;
                  return (
                    <div style={{ position: 'absolute', top: 4, left: 4 }}
                      title={lv > 0 ? `숙련도 ${lv}레벨 (${exp}exp${nextThreshold ? ` / 다음: ${nextThreshold}` : ' MAX'})` : `숙련도 0`}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: MASTERY_COLORS[lv], background: 'rgba(0,0,0,0.55)', borderRadius: 3, padding: '1px 3px' }}>Lv{lv}</span>
                    </div>
                  );
                })()}
                {/* Phase 14: zone challenge badge */}
                {!isLocked && (() => {
                  const challenge = getZoneDailyChallenge(zone);
                  const entry = zoneChallengeProgress[zone];
                  if (!challenge) return null;
                  const prog = entry?.progress ?? 0;
                  const done = prog >= challenge.goal;
                  const claimed = entry?.claimed ?? false;
                  if (claimed) return null;
                  return (
                    <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 10 }}
                      title={`일일 챌린지: ${challenge.label} (${prog}/${challenge.goal})`}>
                      {done ? '✅' : '📋'}
                    </div>
                  );
                })()}
                <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 3 }}>{meta.icon}</div>
                <div style={{ color: meta.color, fontWeight: 700, fontSize: 10, marginBottom: 2 }}>{zone}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, lineHeight: 1.3 }}>
                  {isLocked ? (ZONE_UNLOCK_REQ[zone]?.desc ?? meta.bonusText) : meta.bonusText}
                </div>
              </div>
            );
          })}

          {/* Connectors — vertical */}
          {/* 설산정상 ↕ 북쪽고원 */}
          <div style={{ gridColumn: 3, gridRow: 2, color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>↕</div>
          {/* 북쪽고원 ↕ 마을 */}
          <div style={{ gridColumn: 3, gridRow: 4, color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>↕</div>
          {/* 마을 ↕ 남쪽심해 */}
          <div style={{ gridColumn: 3, gridRow: 6, color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>↕</div>
          {/* 남쪽심해 ↕ 항구마을 */}
          <div style={{ gridColumn: 3, gridRow: 8, color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>↕</div>

          {/* Connectors — horizontal */}
          {/* 서쪽초원 ↔ 마을 */}
          <div style={{ gridColumn: 2, gridRow: 5, color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>↔</div>
          {/* 마을 ↔ 동쪽절벽 */}
          <div style={{ gridColumn: 4, gridRow: 5, color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>↔</div>
          {/* 동쪽절벽 ↔ 고대신전 */}
          <div style={{ gridColumn: 6, gridRow: 5, color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>↔</div>
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
            {currentZone !== '마을' && (() => {
              const lv = getZoneMasteryLevel(zoneMastery, currentZone);
              const exp = zoneMastery?.[currentZone] ?? 0;
              const nextT = ZONE_MASTERY_THRESHOLDS[lv] ?? null;
              const bar = nextT ? exp / nextT : 1;
              const prevT = lv > 0 ? ZONE_MASTERY_THRESHOLDS[lv - 1] : 0;
              const barFill = nextT ? Math.min(1, (exp - prevT) / (nextT - prevT)) : 1;
              return (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: MASTERY_COLORS[lv], fontWeight: 700, fontSize: 11 }}>숙련도 Lv{lv}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{exp}{nextT ? ` / ${nextT}` : ' MAX'} exp</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barFill * 100}%`, background: MASTERY_COLORS[lv], borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                  {lv > 0 && (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 3 }}>
                      현재 보너스: +{lv * 10}% 수확/판매
                    </div>
                  )}
                </div>
              );
            })()}
          {/* Phase 14: Zone daily challenge */}
          {(() => {
            const challenge = getZoneDailyChallenge(currentZone);
            if (!challenge) return null;
            const entry = zoneChallengeProgress[currentZone];
            const prog = entry?.progress ?? 0;
            const done = prog >= challenge.goal;
            const claimed = entry?.claimed ?? false;
            const fill = Math.min(1, prog / challenge.goal);
            const color = claimed ? '#aaaaaa' : done ? '#44ff88' : '#ffcc44';
            return (
              <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color, fontWeight: 700, fontSize: 11 }}>📋 일일 챌린지</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{prog}/{challenge.goal}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 5 }}>{challenge.label}</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${fill * 100}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                    보상: +{challenge.reward.money}G, 숙련도 +{challenge.reward.masteryExp}exp
                  </span>
                  {done && !claimed && onClaimZoneChallenge && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onClaimZoneChallenge(currentZone); }}
                      style={{ background: '#44ff88', color: '#111', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >수령</button>
                  )}
                  {claimed && <span style={{ color: '#aaaaaa', fontSize: 10 }}>✓ 완료</span>}
                </div>
              </div>
            );
          })()}
        </div>
        )}

        <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center' }}>
          M 키 또는 버튼으로 열기 · 맵 가장자리로 이동해 존 이동
        </div>
      </div>
    </div>
  );
}
