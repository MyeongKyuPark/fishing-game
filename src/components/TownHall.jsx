// ── Phase 12-3: 마을 발전 시스템 UI ──────────────────────────────────────────
import { useState } from 'react';
import { TOWN_BUILDINGS } from '../townData';
import { ORES, HERBS } from '../gameData';

export default function TownHall({ gs, townLevels, onContribute, onClose }) {
  const [contributeModal, setContributeModal] = useState(null); // { buildingId }
  const [selectedItem, setSelectedItem] = useState('');
  const [qtyInput, setQtyInput] = useState('1');

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="panel-head">
          <span>🏘 마을 발전</span>
          <button tabIndex={-1} onClick={onClose}>✕</button>
        </div>
        <div className="section">
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
            마을 건물에 아이템을 기여하여 마을을 발전시키세요. 레벨이 오를수록 모든 플레이어에게 보너스가 적용됩니다.
          </div>
          {Object.entries(TOWN_BUILDINGS).map(([key, building]) => {
            const lv = townLevels?.[key] ?? 0;
            const myContrib = (gs.myTownContributions ?? {})[key] ?? 0;
            const lvReqs = building.lvReqs;
            let cumReq = 0;
            for (let i = 0; i < lv; i++) cumReq += lvReqs[i] ?? 0;
            const nextLvReq = lvReqs[lv] ?? null;
            const pct = lv >= building.maxLv ? 100 : (nextLvReq ? Math.min(100, (myContrib / nextLvReq) * 100) : 100);
            const bonusObj = building.bonus(lv);
            const bonusStr = Object.entries(bonusObj).map(([k, v]) => {
              if (k === 'fishSellBonus') return `물고기 판매가 +${(v * 100).toFixed(0)}%`;
              if (k === 'mineSpeedBonus') return `채굴 속도 +${(v * 100).toFixed(0)}%`;
              if (k === 'herbYieldBonus') return `허브 수확량 +${(v * 100).toFixed(0)}%`;
              if (k === 'cookSellBonus') return `요리 판매가 +${(v * 100).toFixed(0)}%`;
              return `${k} +${v}`;
            }).join(', ');

            return (
              <div key={key} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{building.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>{building.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{building.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: lv >= building.maxLv ? '#ffd700' : '#88ccff', fontSize: 14 }}>
                      Lv {lv}/{building.maxLv}
                    </div>
                    {lv > 0 && <div style={{ fontSize: 10, color: '#88ff88' }}>{bonusStr}</div>}
                  </div>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: lv >= building.maxLv ? '#ffd700' : '#44aaff', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    내 기여: {myContrib}개
                    {nextLvReq && lv < building.maxLv && ` · 다음 레벨: ${nextLvReq}개 필요`}
                    {lv >= building.maxLv && ' · 최대 레벨 달성!'}
                  </div>
                  {lv < building.maxLv && (
                    <button
                      tabIndex={-1}
                      className="btn-buy"
                      style={{ fontSize: 11, padding: '3px 10px' }}
                      onClick={() => {
                        // Set default selected item based on type
                        let defaultItem = '';
                        if (building.contributeItemType === 'fish') {
                          const fish = (gs.fishInventory ?? []).find(f => !f.cooked);
                          defaultItem = fish?.name ?? '';
                        } else if (building.contributeItemType === 'ore') {
                          const ore = Object.entries(gs.oreInventory ?? {}).find(([, n]) => n > 0);
                          defaultItem = ore?.[0] ?? '';
                        } else if (building.contributeItemType === 'herb') {
                          const herb = Object.entries(gs.herbInventory ?? {}).find(([, n]) => n > 0);
                          defaultItem = herb?.[0] ?? '';
                        } else if (building.contributeItemType === 'dish') {
                          const dish = Object.entries(gs.dishInventory ?? {}).find(([, n]) => n > 0);
                          defaultItem = dish?.[0] ?? '';
                        }
                        setSelectedItem(defaultItem);
                        setContributeModal({ buildingId: key });
                        setQtyInput('1');
                      }}
                    >
                      기여하기
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
            내 누적 기여: {Object.values(gs.myTownContributions ?? {}).reduce((s, v) => s + v, 0)}회
          </div>
        </div>

        {/* Contribute modal */}
        {contributeModal && (() => {
          const building = TOWN_BUILDINGS[contributeModal.buildingId];
          const qty = parseInt(qtyInput) || 1;
          const itemType = building.contributeItemType;

          // Build item options based on type
          let itemOptions = [];
          if (itemType === 'fish') {
            const counts = {};
            (gs.fishInventory ?? []).filter(f => !f.cooked).forEach(f => { counts[f.name] = (counts[f.name] || 0) + 1; });
            itemOptions = Object.entries(counts).map(([name, count]) => ({ key: name, label: `${name} (${count}마리)`, count }));
          } else if (itemType === 'ore') {
            itemOptions = Object.entries(gs.oreInventory ?? {}).filter(([, n]) => n > 0)
              .map(([k, n]) => ({ key: k, label: `${k} (${n}개)`, count: n }));
          } else if (itemType === 'herb') {
            itemOptions = Object.entries(gs.herbInventory ?? {}).filter(([, n]) => n > 0)
              .map(([k, n]) => ({ key: k, label: `${k} (${n}개)`, count: n }));
          } else if (itemType === 'dish') {
            itemOptions = Object.entries(gs.dishInventory ?? {}).filter(([, n]) => n > 0)
              .map(([k, n]) => ({ key: k, label: `${k} (${n}개)`, count: n }));
          }

          const selectedCount = itemOptions.find(o => o.key === selectedItem)?.count ?? 0;
          const canContribute = selectedItem && qty > 0 && selectedCount >= qty;

          return (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '20px 24px', minWidth: 300 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>{building.icon} {building.name} 기여</div>
                {itemOptions.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#ff8888', marginBottom: 16 }}>기여 가능한 {building.contributeItem}이 없습니다.</div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>아이템 선택:</div>
                    <select
                      value={selectedItem}
                      onChange={e => setSelectedItem(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: '#fff', padding: '5px 8px', fontSize: 13, marginBottom: 12 }}
                    >
                      <option value="" style={{ background: '#1a1a2e' }}>-- 선택 --</option>
                      {itemOptions.map(o => (
                        <option key={o.key} value={o.key} style={{ background: '#1a1a2e' }}>{o.label}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>수량:</span>
                      <input
                        type="number" min="1" max={selectedCount || 999}
                        value={qtyInput}
                        onChange={e => setQtyInput(e.target.value)}
                        style={{ width: 70, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: '#fff', padding: '3px 6px', fontSize: 13 }}
                      />
                      {selectedItem && <span style={{ fontSize: 11, color: '#aaa' }}>/ 보유 {selectedCount}개</span>}
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={canContribute ? 'btn-buy' : 'btn-dis'}
                    style={{ flex: 1 }}
                    disabled={!canContribute}
                    onClick={() => {
                      if (!canContribute) return;
                      onContribute(contributeModal.buildingId, selectedItem, itemType, qty);
                      setContributeModal(null);
                    }}
                  >
                    기여하기 ({qty}개)
                  </button>
                  <button
                    className="btn-dis"
                    style={{ flex: 1 }}
                    onClick={() => setContributeModal(null)}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
