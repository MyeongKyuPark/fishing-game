// ── Phase 12-5: 활동 포인트 상점 ─────────────────────────────────────────────
import { POINT_SHOP_ITEMS } from '../gameData';

export default function PointShop({ gs, onExchange, onClose }) {
  const pts = gs.activityPoints ?? 0;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="panel-head">
          <span>⭐ 활동 포인트 상점</span>
          <button tabIndex={-1} onClick={onClose}>✕</button>
        </div>
        <div className="section">
          {/* Point balance */}
          <div style={{ textAlign: 'center', marginBottom: 16, padding: '12px', background: 'rgba(255,215,0,0.1)', borderRadius: 8, border: '1px solid rgba(255,215,0,0.3)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>보유 포인트</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#ffd700' }}>⭐ {pts.toLocaleString()} pt</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              낚시·채굴·채집·퀘스트 완료 시 포인트 획득
            </div>
          </div>

          {/* Item grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(POINT_SHOP_ITEMS).map(([key, item]) => {
              const canBuy = pts >= item.cost;
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px',
                  border: `1px solid ${canBuy ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  opacity: canBuy ? 1 : 0.65,
                }}>
                  <span style={{ fontSize: 24, minWidth: 32, textAlign: 'center' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 90 }}>
                    <div style={{ color: '#ffd700', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                      ⭐ {item.cost} pt
                    </div>
                    <button
                      tabIndex={-1}
                      className={canBuy ? 'btn-buy' : 'btn-dis'}
                      style={{ fontSize: 11, padding: '3px 10px', cursor: canBuy ? 'pointer' : 'not-allowed' }}
                      disabled={!canBuy}
                      onClick={() => canBuy && onExchange(key)}
                    >
                      교환
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 12, textAlign: 'center' }}>
            누적 획득 포인트: {(gs.totalPointsEarned ?? 0).toLocaleString()} pt
          </div>
        </div>
      </div>
    </div>
  );
}
