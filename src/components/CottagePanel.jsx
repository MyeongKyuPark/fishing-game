import { useState } from 'react';
import { FURNITURE, FISH, COTTAGE_UPGRADE_REQS, COTTAGE_LEVEL_BONUSES } from '../gameData';
import { ACHIEVEMENTS } from '../achievementData';
import { rarityColor } from '../hooks/useGameState';
import { saveCottagePublic, fetchCottage, incrementCottageVisit, addGuestbookEntry, fetchGuestbook } from '../ranking';

const TABS = ['인테리어', '상점', '트로피', '업적패', '방문', '방명록'];

export default function CottagePanel({ gs, setGs, nickname, onClose, addMsg, handleCottageUpgrade }) {
  const [tab, setTab] = useState('인테리어');
  const [visitInput, setVisitInput] = useState('');
  const [visitData, setVisitData] = useState(null); // fetched cottage
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitError, setVisitError] = useState('');
  const [guestbook, setGuestbook] = useState(null); // own guestbook entries
  const [gbLoading, setGbLoading] = useState(false);
  const [gbNoteTarget, setGbNoteTarget] = useState(''); // target nickname for leaving a note
  const [gbNoteMsg, setGbNoteMsg] = useState('');
  const [gbNoteSending, setGbNoteSending] = useState(false);
  const [gbNoteStatus, setGbNoteStatus] = useState('');

  const cottage = gs.cottage ?? { furniture: [], achieveDisplay: [], trophyWall: [], visited: 0 };

  // ── helpers ──────────────────────────────────────────────────────────────
  function placeFurniture(key) {
    const fd = FURNITURE[key];
    if (!fd) return;
    if (gs.money < fd.price) { addMsg(`골드가 부족합니다. (${fd.price}G 필요)`, 'system'); return; }
    const id = Date.now();
    setGs(prev => ({
      ...prev,
      money: prev.money - fd.price,
      cottage: {
        ...( prev.cottage ?? { furniture: [], achieveDisplay: [], trophyWall: [], visited: 0 } ),
        furniture: [
          ...(prev.cottage?.furniture ?? []),
          { id, key, x: (prev.cottage?.furniture?.length ?? 0) % 4, y: Math.floor((prev.cottage?.furniture?.length ?? 0) / 4) },
        ],
      },
    }));
    addMsg(`🏠 ${fd.name}을(를) 오두막에 배치했습니다! (-${fd.price}G)`, 'catch');
  }

  function removeFurniture(id) {
    setGs(prev => ({
      ...prev,
      cottage: {
        ...(prev.cottage ?? {}),
        furniture: (prev.cottage?.furniture ?? []).filter(f => f.id !== id),
      },
    }));
  }

  function toggleAchieveDisplay(key) {
    const current = cottage.achieveDisplay ?? [];
    const exists = current.includes(key);
    if (!exists && current.length >= 6) {
      addMsg('업적 패는 최대 6개까지 전시할 수 있습니다.', 'system');
      return;
    }
    setGs(prev => ({
      ...prev,
      cottage: {
        ...(prev.cottage ?? {}),
        achieveDisplay: exists
          ? current.filter(k => k !== key)
          : [...current, key],
      },
    }));
  }

  function addTrophyFish(fish) {
    const wall = cottage.trophyWall ?? [];
    const maxSlots = 6 + (cottage.furniture ?? []).reduce((sum, f) => sum + (FURNITURE[f.key]?.bonus?.taxidermySlot ?? 0), 0);
    if (wall.length >= maxSlots) {
      addMsg(`트로피 벽 슬롯이 가득 찼습니다. (최대 ${maxSlots}개 — 어항으로 확장 가능)`, 'system');
      return;
    }
    setGs(prev => {
      const newWall = [...(prev.cottage?.trophyWall ?? []), { fishName: fish.name, size: fish.size }];
      // Remove from trophyFish
      const newTrophy = (prev.trophyFish ?? []).filter(f => !(f.name === fish.name && f.size === fish.size));
      return {
        ...prev,
        trophyFish: newTrophy,
        cottage: { ...(prev.cottage ?? {}), trophyWall: newWall },
      };
    });
    addMsg(`🐟 ${fish.name} ${fish.size}cm 트로피를 오두막 벽에 전시했습니다!`, 'catch');
  }

  function removeTrophyWall(idx) {
    setGs(prev => {
      const wall = [...(prev.cottage?.trophyWall ?? [])];
      const [removed] = wall.splice(idx, 1);
      // Return to trophyFish
      return {
        ...prev,
        trophyFish: [...(prev.trophyFish ?? []), { name: removed.fishName, size: removed.size }],
        cottage: { ...(prev.cottage ?? {}), trophyWall: wall },
      };
    });
  }

  // ── rendered bonuses summary ──────────────────────────────────────────────
  const activeBonuses = (cottage.furniture ?? []).reduce((acc, f) => {
    const b = FURNITURE[f.key]?.bonus ?? {};
    for (const [k, v] of Object.entries(b)) {
      acc[k] = (acc[k] ?? 0) + v;
    }
    return acc;
  }, {});

  const BONUS_LABELS = {
    offlineMult:    v => `오프라인 수입 ×${v.toFixed(2)}`,
    questSlot:      v => `일일 퀘스트 +${v}개`,
    taxidermySlot:  v => `트로피 슬롯 +${v}`,
    cookTimeMult:   v => `요리 속도 ×${v.toFixed(2)}`,
    exploreReq:     v => `탐험 요구 어빌리티 ${v}`,
    sellBonus:      v => `판매가 +${Math.round(v * 100)}%`,
    enhanceBonus:   v => `강화 성공률 +${Math.round(v * 100)}%`,
    gatherTimeMult: v => `채집 속도 ×${v.toFixed(2)}`,
  };

  const grantedAchs = (gs.achStats ? Object.keys(ACHIEVEMENTS).filter(k => {
    const ach = ACHIEVEMENTS[k];
    return ach && gs.achStats[ach.stat] >= ach.goal;
  }) : []);

  async function handleVisit() {
    const target = visitInput.trim();
    if (!target) return;
    if (target === nickname) { setVisitError('자신의 오두막입니다.'); return; }
    setVisitLoading(true); setVisitError(''); setVisitData(null);
    try {
      const data = await fetchCottage(target);
      if (!data) { setVisitError(`'${target}'의 오두막을 찾을 수 없습니다.`); }
      else { setVisitData(data); await incrementCottageVisit(target); }
    } catch { setVisitError('방문 중 오류가 발생했습니다.'); }
    setVisitLoading(false);
  }

  // Auto-publish cottage on panel open (so others can visit)
  // (called once when panel mounts via useEffect — but to avoid useEffect we call lazily)
  const [published, setPublished] = useState(false);
  if (!published) {
    setPublished(true);
    saveCottagePublic(nickname, cottage).catch(() => {});
  }

  const trophyWall = cottage.trophyWall ?? [];
  const maxSlots = 6 + (cottage.furniture ?? []).reduce((sum, f) => sum + (FURNITURE[f.key]?.bonus?.taxidermySlot ?? 0), 0);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" style={{ maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="panel-head">
          <span>🏠 {nickname}의 오두막</span>
          <button tabIndex={-1} onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {TABS.map(t => (
            <button key={t} tabIndex={-1}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '5px 4px', fontSize: 12, borderRadius: '6px 6px 0 0',
                border: 'none', cursor: 'pointer',
                background: tab === t ? 'rgba(100,180,255,0.2)' : 'rgba(255,255,255,0.04)',
                color: tab === t ? '#7df' : 'rgba(255,255,255,0.55)',
                fontWeight: tab === t ? 700 : 400,
              }}
            >{t}</button>
          ))}
        </div>

        {/* ── 인테리어 탭 ── */}
        {tab === '인테리어' && (
          <div className="section">
            <div className="section-title">배치된 가구</div>
            {(cottage.furniture ?? []).length === 0 && (
              <div className="empty">아직 가구가 없습니다. [상점] 탭에서 구매하세요.</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(cottage.furniture ?? []).map((f) => {
                const fd = FURNITURE[f.key];
                if (!fd) return null;
                return (
                  <div key={f.id} className="rod-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 20, marginRight: 8 }}>{fd.icon}</span>
                      <span style={{ fontWeight: 700 }}>{fd.name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginLeft: 8 }}>{fd.desc}</span>
                    </div>
                    <button tabIndex={-1} onClick={() => removeFurniture(f.id)}
                      style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
                        background: 'rgba(255,60,60,0.2)', color: '#ff8888' }}>
                      철거
                    </button>
                  </div>
                );
              })}
            </div>

            {Object.keys(activeBonuses).length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 14 }}>가구 보너스 합산</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(activeBonuses).map(([k, v]) => {
                    const label = BONUS_LABELS[k]?.(v);
                    if (!label) return null;
                    return (
                      <span key={k} style={{ fontSize: 11, background: 'rgba(100,255,150,0.12)', border: '1px solid rgba(100,255,150,0.25)',
                        borderRadius: 5, padding: '2px 8px', color: '#88ff99' }}>
                        {label}
                      </span>
                    );
                  })}
                </div>
              </>
            )}

            {/* Phase 15-5: 오두막 업그레이드 */}
            {handleCottageUpgrade && (() => {
              const cottageLevel = gs.cottageLevel ?? 1;
              const nextLevel = cottageLevel + 1;
              const nextReq = COTTAGE_UPGRADE_REQS[nextLevel];
              const currentBonus = COTTAGE_LEVEL_BONUSES[cottageLevel] ?? {};
              const nextBonus = COTTAGE_LEVEL_BONUSES[nextLevel];
              return (
                <div style={{ marginTop: 14 }}>
                  <div className="section-title">🏠 오두막 레벨</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ fontWeight: 700, color: '#ffcc44' }}>Lv.{cottageLevel}</span>
                    <span style={{ fontSize: 12, color: '#88aacc' }}>
                      가구 슬롯 {currentBonus.maxFurniture} / 오프라인 +{Math.round((currentBonus.offlineBonus ?? 0) * 100)}%
                    </span>
                    {cottageLevel >= 4 && <span style={{ fontSize: 12, color: '#ffcc44' }}>최고 등급!</span>}
                  </div>
                  {nextReq && nextBonus && (
                    <div style={{ background: 'rgba(255,200,50,0.08)', borderRadius: 8, padding: 10, border: '1px solid rgba(255,200,50,0.2)' }}>
                      <div style={{ fontSize: 12, color: '#ffcc44', marginBottom: 6 }}>다음 레벨 (Lv.{nextLevel}) 비용:</div>
                      <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>
                        💰 {(nextReq.money ?? 0).toLocaleString()}G
                        {Object.entries(nextReq.ore ?? {}).map(([ore, qty]) => (
                          <span key={ore}> / {ore}×{qty}</span>
                        ))}
                        {(nextReq.fish ?? []).map(f => (
                          <span key={f}> / {f}×1</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: '#88ff88', marginBottom: 8 }}>
                        ↑ 가구 슬롯 {nextBonus.maxFurniture} / 오프라인 +{Math.round(nextBonus.offlineBonus * 100)}%
                      </div>
                      <button onClick={() => handleCottageUpgrade(nextLevel)}
                        style={{ width: '100%', padding: '7px 0', background: 'linear-gradient(90deg,#886600,#cc9900)', borderRadius: 8, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                        🏠 업그레이드 → Lv.{nextLevel}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── 상점 탭 ── */}
        {tab === '상점' && (
          <div className="section">
            <div className="section-title">가구 상점</div>
            {Object.entries(FURNITURE).map(([key, fd]) => {
              const owned = (cottage.furniture ?? []).some(f => f.key === key);
              const canBuy = gs.money >= fd.price;
              return (
                <div key={key} className="rod-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 20, marginRight: 8 }}>{fd.icon}</span>
                      <span style={{ fontWeight: 700 }}>{fd.name}</span>
                      <span style={{ fontSize: 11, marginLeft: 8, padding: '1px 5px', borderRadius: 4,
                        background: fd.category === '장식' ? 'rgba(150,100,255,0.2)' : 'rgba(100,180,255,0.2)',
                        color: fd.category === '장식' ? '#cc99ff' : '#88ccff' }}>{fd.category}</span>
                    </div>
                    <button tabIndex={-1} onClick={() => placeFurniture(key)}
                      disabled={!canBuy}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: canBuy ? 'pointer' : 'not-allowed',
                        background: canBuy ? 'rgba(80,200,120,0.25)' : 'rgba(255,255,255,0.06)',
                        color: canBuy ? '#88ffaa' : 'rgba(255,255,255,0.3)' }}>
                      {fd.price === 0 ? '무료' : `${fd.price.toLocaleString()}G`}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{fd.desc}</div>
                  {fd.upgradeMats && (
                    <div style={{ fontSize: 10, color: 'rgba(255,200,100,0.7)', marginTop: 2 }}>
                      재료: {Object.entries(fd.upgradeMats).map(([m, n]) => `${m} ×${n}`).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 트로피 탭 ── */}
        {tab === '트로피' && (
          <div className="section">
            <div className="section-title">
              트로피 벽 ({trophyWall.length} / {maxSlots})
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              전설/신화 포획 시 박제된 물고기를 오두막 벽에 전시합니다. 어항 가구로 슬롯 확장 가능.
            </div>
            {trophyWall.length === 0 && (
              <div className="empty">전시된 트로피가 없습니다.</div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {trophyWall.map((t, i) => {
                const fd = FISH[t.fishName];
                return (
                  <div key={i} style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)',
                    borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 90 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: rarityColor(fd?.rarity ?? '전설') }}>{t.fishName}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>{t.size}cm</div>
                    <button tabIndex={-1} onClick={() => removeTrophyWall(i)}
                      style={{ fontSize: 10, marginTop: 4, padding: '2px 6px', borderRadius: 4, border: 'none',
                        cursor: 'pointer', background: 'rgba(255,60,60,0.2)', color: '#ff8888' }}>
                      반환
                    </button>
                  </div>
                );
              })}
            </div>

            {(gs.trophyFish ?? []).length > 0 && (
              <>
                <div className="section-title">박제실 (전시 가능)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(gs.trophyFish ?? []).map((fish, i) => {
                    const fd = FISH[fish.name];
                    return (
                      <div key={i} style={{ background: 'rgba(150,100,255,0.1)', border: '1px solid rgba(150,100,255,0.25)',
                        borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 90 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: rarityColor(fd?.rarity ?? '전설') }}>{fish.name}</div>
                        <div style={{ fontSize: 10, color: '#aaa' }}>{fish.size}cm</div>
                        <button tabIndex={-1} onClick={() => addTrophyFish(fish)}
                          disabled={trophyWall.length >= maxSlots}
                          style={{ fontSize: 10, marginTop: 4, padding: '2px 6px', borderRadius: 4, border: 'none',
                            cursor: trophyWall.length < maxSlots ? 'pointer' : 'not-allowed',
                            background: 'rgba(80,200,120,0.2)', color: '#88ffaa' }}>
                          전시
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {(gs.trophyFish ?? []).length === 0 && trophyWall.length === 0 && (
              <div className="empty">전설/신화 물고기를 잡으면 박제실에 추가됩니다.</div>
            )}
          </div>
        )}

        {/* ── 업적 패 탭 ── */}
        {tab === '업적패' && (
          <div className="section">
            <div className="section-title">
              업적 패 전시 ({(cottage.achieveDisplay ?? []).length} / 6)
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              달성한 업적 중 최대 6개를 선택해 오두막 벽에 전시합니다.
            </div>
            {/* 전시중 */}
            {(cottage.achieveDisplay ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {(cottage.achieveDisplay ?? []).map(key => {
                  const ach = ACHIEVEMENTS[key];
                  if (!ach) return null;
                  return (
                    <div key={key} style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
                      borderRadius: 8, padding: '6px 10px', textAlign: 'center', maxWidth: 110 }}>
                      <div style={{ fontSize: 18 }}>{ach.icon ?? '🏅'}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ffd700' }}>{ach.name}</div>
                      <button tabIndex={-1} onClick={() => toggleAchieveDisplay(key)}
                        style={{ fontSize: 10, marginTop: 4, padding: '2px 6px', borderRadius: 4,
                          border: 'none', cursor: 'pointer', background: 'rgba(255,60,60,0.2)', color: '#ff8888' }}>
                        제거
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* 달성한 업적 목록 */}
            <div className="section-title">달성한 업적</div>
            {grantedAchs.length === 0 && <div className="empty">아직 달성한 업적이 없습니다.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {grantedAchs.map(key => {
                const ach = ACHIEVEMENTS[key];
                if (!ach) return null;
                const displayed = (cottage.achieveDisplay ?? []).includes(key);
                return (
                  <div key={key} className="rod-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 16, marginRight: 8 }}>{ach.icon ?? '🏅'}</span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{ach.name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{ach.desc}</span>
                    </div>
                    <button tabIndex={-1} onClick={() => toggleAchieveDisplay(key)}
                      style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
                        background: displayed ? 'rgba(255,60,60,0.2)' : 'rgba(80,200,120,0.2)',
                        color: displayed ? '#ff8888' : '#88ffaa' }}>
                      {displayed ? '제거' : '전시'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 방문 탭 ── */}
        {/* ── 방명록 탭 ── */}
        {tab === '방명록' && (
          <div className="section">
            <div className="section-title">📝 내 오두막 방명록</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              다른 플레이어가 남긴 메모를 확인하세요. (최대 20개 보관)
            </div>
            {guestbook === null && (
              <button tabIndex={-1} className="btn-buy" style={{ marginBottom: 10 }}
                onClick={async () => {
                  setGbLoading(true);
                  const entries = await fetchGuestbook(nickname);
                  setGuestbook(entries);
                  setGbLoading(false);
                }}>
                {gbLoading ? '불러오는 중…' : '방명록 불러오기'}
              </button>
            )}
            {guestbook !== null && (
              guestbook.length === 0
                ? <div className="empty">아직 방명록이 비어있습니다.</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...guestbook].reverse().map((entry, i) => (
                      <div key={i} className="rod-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, color: '#88ccff', fontSize: 12 }}>✍ {entry.from}</span>
                          <span style={{ fontSize: 10, color: '#666' }}>{new Date(entry.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{entry.message}</div>
                      </div>
                    ))}
                  </div>
            )}

            <div className="section-title" style={{ marginTop: 16 }}>다른 플레이어 방명록에 글 남기기</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input
                value={gbNoteTarget}
                onChange={e => setGbNoteTarget(e.target.value)}
                placeholder="닉네임..."
                style={{ width: 100, padding: '5px 8px', background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12 }}
              />
              <input
                value={gbNoteMsg}
                onChange={e => setGbNoteMsg(e.target.value.slice(0, 100))}
                placeholder="메모 (최대 100자)..."
                style={{ flex: 1, padding: '5px 8px', background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12 }}
              />
            </div>
            <button tabIndex={-1} className={gbNoteTarget.trim() && gbNoteMsg.trim() ? 'btn-buy' : 'btn-dis'}
              disabled={gbNoteSending || !gbNoteTarget.trim() || !gbNoteMsg.trim()}
              onClick={async () => {
                const target = gbNoteTarget.trim();
                const msg = gbNoteMsg.trim();
                if (!target || !msg) return;
                if (target === nickname) { setGbNoteStatus('자신의 방명록에는 글을 남길 수 없습니다.'); return; }
                setGbNoteSending(true); setGbNoteStatus('');
                await addGuestbookEntry(target, nickname, msg);
                setGbNoteSending(false);
                setGbNoteMsg('');
                setGbNoteStatus(`✅ ${target}의 방명록에 메모를 남겼습니다!`);
              }}>
              {gbNoteSending ? '전송 중…' : '메모 남기기'}
            </button>
            {gbNoteStatus && <div style={{ fontSize: 12, color: gbNoteStatus.startsWith('✅') ? '#88ffaa' : '#ff8888', marginTop: 6 }}>{gbNoteStatus}</div>}
          </div>
        )}

        {tab === '방문' && (
          <div className="section">
            <div className="section-title">다른 플레이어 오두막 방문</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              닉네임을 입력해 상대방의 오두막을 구경할 수 있습니다.
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                value={visitInput}
                onChange={e => setVisitInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVisit()}
                placeholder="닉네임 입력..."
                style={{ flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: '#fff', fontSize: 13 }}
              />
              <button tabIndex={-1} onClick={handleVisit} disabled={visitLoading}
                style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13,
                  background: 'rgba(80,160,255,0.25)', color: '#88ccff' }}>
                {visitLoading ? '…' : '방문'}
              </button>
            </div>
            {visitError && <div style={{ fontSize: 12, color: '#ff8888', marginBottom: 8 }}>{visitError}</div>}
            {visitData && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#7df' }}>
                  🏠 {visitData.nickname}의 오두막
                </div>
                {/* 가구 */}
                {(visitData.furniture ?? []).length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>가구</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {(visitData.furniture ?? []).map((f, i) => {
                        const fd = FURNITURE[f.key];
                        if (!fd) return null;
                        return (
                          <span key={i} style={{ fontSize: 13, background: 'rgba(100,180,255,0.1)',
                            border: '1px solid rgba(100,180,255,0.2)', borderRadius: 6, padding: '3px 8px' }}>
                            {fd.icon} {fd.name}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
                {/* 트로피 */}
                {(visitData.trophyWall ?? []).length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>트로피 벽</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {(visitData.trophyWall ?? []).map((t, i) => {
                        const fd = FISH[t.fishName];
                        return (
                          <span key={i} style={{ fontSize: 11, background: 'rgba(255,215,0,0.1)',
                            border: '1px solid rgba(255,215,0,0.2)', borderRadius: 6, padding: '3px 8px',
                            color: rarityColor(fd?.rarity ?? '전설') }}>
                            {t.fishName} {t.size}cm
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
                {/* 업적 패 */}
                {(visitData.achieveDisplay ?? []).length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>업적 패</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(visitData.achieveDisplay ?? []).map((key, i) => {
                        const ach = ACHIEVEMENTS[key];
                        if (!ach) return null;
                        return (
                          <span key={i} style={{ fontSize: 11, background: 'rgba(255,215,0,0.1)',
                            border: '1px solid rgba(255,215,0,0.2)', borderRadius: 6, padding: '3px 8px', color: '#ffd700' }}>
                            {ach.icon ?? '🏅'} {ach.name}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
                {(visitData.furniture ?? []).length === 0 && (visitData.trophyWall ?? []).length === 0 && (visitData.achieveDisplay ?? []).length === 0 && (
                  <div className="empty">아직 아무것도 꾸미지 않은 빈 오두막입니다.</div>
                )}
                <button tabIndex={-1} style={{ marginTop: 10, padding: '6px 14px', borderRadius: 7, border: 'none',
                  cursor: 'pointer', fontSize: 12, background: 'rgba(100,180,255,0.18)', color: '#88ccff' }}
                  onClick={() => { setGbNoteTarget(visitData.nickname); setTab('방명록'); }}>
                  ✍ 방명록 메모 남기기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
