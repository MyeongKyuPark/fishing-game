import RankSidebar from '../RankSidebar';
import MiniMap from '../MiniMap';
import Joystick from '../Joystick';
import { RODS, FISH } from '../gameData';
import { MINE_DEPTH_REQ, MINE_DEPTH_TIME } from '../hooks/useGameState';

export default function TopBar({
  gs, setGs, nickname, myTitle, roomTitle, weather, currentSeason, activity, isOnline,
  serverQuest, serverBoss, fishSurgeEvent, serverEvent,
  indoorRoom, nearDoor, nearActionZone, nearIndoorNpc, partyId, partyMembersRef, otherPlayersRef,
  pendingInvite, showAnnounce, serverAnnouncements,
  achPopup, gradeUpCelebration,
  gameRef, handleCommand, handleExitRoom, handleNpcInteract,
  addMsg,
  setShowInv, setShowShop, setShowStats, setShowRank, setShowQuest, setShowDex,
  setShowGuild, setShowMarket, setShowMobileMenu, showMobileMenu,
  setAppearanceDraft, setShowAppearance,
  setShowSettings, setShowTournament, setShowCottage,
}) {
  const questHasClaim = (gs.dailyQuests ?? []).some(
    q => (gs.questProgress?.[q.id] ?? 0) >= q.goal && !gs.questClaimed?.[q.id]
  );
  const questBtnStyle = questHasClaim ? { animation: 'questGlow 0.8s ease-in-out infinite alternate' } : {};

  return (
    <>
      {/* HUD */}
      {!indoorRoom && <div className="hud">
        <div className="hud-chip hud-nick">👤 {nickname}</div>
        <div className="hud-chip" style={{ color: myTitle.color, fontSize: 11 }}>[{myTitle.label}]</div>
        <div className="hud-chip" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>🏠 {roomTitle}</div>
        <div className="hud-chip">💰 {gs.money.toLocaleString()}G</div>
        <div className="hud-chip" style={{ color: RODS[gs.rod]?.color }}>
          🎣 {RODS[gs.rod]?.name}
        </div>
        {currentSeason && (
          <div className="hud-chip" style={{ fontSize: 11, color: currentSeason.color }}>{currentSeason.icon} {currentSeason.name}</div>
        )}
        {weather && (
          <div className="hud-chip" style={{ fontSize: 11 }}>{weather.icon} {weather.label}</div>
        )}
        {!isOnline && (
          <div className="hud-chip" style={{ fontSize: 11, color: '#ff8888', background: 'rgba(80,0,0,0.5)' }}>📵 오프라인</div>
        )}
        {gs.innBuff && Date.now() < gs.innBuff.expiresAt && (
          <div className="hud-chip" style={{ color: '#88ccff', fontSize: 11 }}>
            💤 휴식 {Math.ceil((gs.innBuff.expiresAt - Date.now()) / 60000)}분
          </div>
        )}
        {activity && (
          <div className={`hud-chip hud-active ${activity}`}>
            {activity === 'fishing' ? '🐟 낚시 중…' : activity === 'gathering' ? '🌿 채집 중…' : '⛏ 채굴 중…'}
          </div>
        )}
{(() => {
          const sqFish = serverQuest.fishCaught ?? 0;
          const MILESTONES = [1000, 5000, 10000, 50000, 100000];
          const nextMilestone = MILESTONES.find(m => sqFish < m);
          if (!nextMilestone) return null;
          const pct = Math.min(100, Math.round(sqFish / nextMilestone * 100));
          return (
            <div className="hud-chip" style={{ fontSize: 10, color: '#88ffcc', display: 'flex', alignItems: 'center', gap: 4 }}>
              🤝 공동퀘스트 {sqFish.toLocaleString()}/{nextMilestone.toLocaleString()} ({pct}%)
            </div>
          );
        })()}
        {serverBoss && serverBoss.hp > 0 && (
          <div className="hud-chip" style={{ fontSize: 10, color: '#ff6666', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⚔️ 공동보스 {serverBoss.name} HP {serverBoss.hp}/{serverBoss.maxHp}
          </div>
        )}
        {fishSurgeEvent && Date.now() < fishSurgeEvent.until && (
          <div className="hud-chip" style={{ color: '#ffaa22', fontSize: 11, animation: 'blink 1.4s ease-in-out infinite' }}>
            📣 {FISH[fishSurgeEvent.fish]?.rarity === '신화' ? '🌟' : '⭐'} {fishSurgeEvent.fish} 출몰중!
          </div>
        )}
        {serverEvent && (
          <div className="hud-chip" style={{ color: '#ff88ff', fontSize: 11, animation: 'blink 1.4s ease-in-out infinite' }}>
            🎉 서버 이벤트: {serverEvent.label}
          </div>
        )}
      </div>}

{indoorRoom === 'mine' && (
        <div style={{ position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(10,10,20,0.88)', borderRadius: 10, padding: '5px 12px', border: '1px solid rgba(120,80,255,0.45)', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#aabbcc', fontSize: 12 }}>⛏ 채굴 깊이</span>
          {[1, 2, 3, 4, 5].map(d => {
            const req = MINE_DEPTH_REQ[d] ?? 0;
            const mineAbil = gs.abilities?.채굴?.value ?? 0;
            const cheolsuUnlock = (gs.npcAffinity?.채굴사 ?? 0) >= 80;
            const canUse = cheolsuUnlock || mineAbil >= req;
            const active = (gs.mineDepth ?? 1) === d;
            const lockLabel = cheolsuUnlock ? '철수 해금' : `채굴 ${req} 필요`;
            return (
              <button key={d} tabIndex={-1} style={{
                background: active ? 'rgba(120,60,255,0.85)' : canUse ? 'rgba(50,50,80,0.85)' : 'rgba(25,25,40,0.85)',
                border: `1px solid ${active ? '#aa66ff' : canUse ? '#5566aa' : '#333355'}`,
                color: active ? '#fff' : canUse ? '#99bbdd' : '#445566',
                borderRadius: 6, padding: '3px 9px', fontSize: 11,
                cursor: canUse ? 'pointer' : 'not-allowed',
              }}
                title={req > 0 ? lockLabel : '기본'}
                onClick={() => {
                  if (!canUse) { addMsg(`⛏ ${d}층은 채굴 ${req} 이상 필요합니다!`, 'error'); return; }
                  setGs(prev => ({ ...prev, mineDepth: d }));
                  addMsg(`⛏ ${d}층으로 이동합니다.${d > 1 ? ` (시간 ×${MINE_DEPTH_TIME[d-1].toFixed(2)}, 희귀 광석 확률 ↑)` : ''}`, 'system');
                }}
              >{d}층{active ? ' ✓' : req > 0 && !canUse ? ` 🔒` : ''}</button>
            );
          })}
        </div>
      )}

      {!indoorRoom && weather?.canFish === false && (
        <div className="weather-warning" style={{ position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', background: 'rgba(30,20,0,0.85)', color: '#ffcc44', border: '1px solid #ffaa00', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 700, zIndex: 50, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          ⛈ 폭풍 중에는 낚시할 수 없습니다!
        </div>
      )}

      {gradeUpCelebration && (
        <div className="gradeup-overlay">
          <div className="gradeup-burst" style={{ '--gc': gradeUpCelebration.color }}>
            <div className="gradeup-icon">{gradeUpCelebration.icon}</div>
            <div className="gradeup-title">그레이드업!</div>
            <div className="gradeup-name">{gradeUpCelebration.abilName}</div>
            <div className="gradeup-grade" style={{ color: gradeUpCelebration.color }}>
              G{gradeUpCelebration.grade} 달성
            </div>
            <div className="gradeup-bonus">희귀 보너스 +{gradeUpCelebration.grade * 10}%</div>
          </div>
        </div>
      )}

      {achPopup && (
        <div className="ach-popup-bar">
          <div className="ach-popup-inner">
            <div className="ach-popup-badge">업적 달성!</div>
            <div className="ach-popup-icon">{achPopup.icon}</div>
            <div className="ach-popup-label">{achPopup.label}</div>
            <div className="ach-popup-reward">+{achPopup.money.toLocaleString()}G</div>
          </div>
        </div>
      )}

      {pendingInvite && (
        <div style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
          background: 'rgba(20,80,40,0.95)', border: '2px solid #44cc88', borderRadius: 10, padding: '10px 16px',
          color: '#fff', fontSize: 13, textAlign: 'center', minWidth: 240 }}>
          <div style={{ marginBottom: 8 }}>🎉 <b>{pendingInvite.inviter}</b>님이 파티에 초대했습니다!</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn-buy" style={{ fontSize: 12 }} onClick={() => handleCommand('/파티수락')}>✅ 수락</button>
            <button className="btn-dis" style={{ fontSize: 12 }} onClick={() => handleCommand('/파티거절')}>❌ 거절</button>
          </div>
        </div>
      )}

      {partyId && (
        <div style={{ position: 'fixed', bottom: 130, right: 8, zIndex: 90,
          background: 'rgba(20,60,20,0.85)', border: '1px solid #44cc88', borderRadius: 8,
          padding: '4px 10px', color: '#88ffaa', fontSize: 11 }}>
          🟢 파티 중 ({partyMembersRef.current.length + 1}명) · /파티탈퇴
        </div>
      )}

      {showAnnounce && serverAnnouncements.length > 0 && (
        <div className="server-announce-bar">
          {serverAnnouncements.slice(0, 1).map(a => (
            <div key={a.id} className="server-announce-msg">
              📢 {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Rank sidebar (desktop only) */}
      {!indoorRoom && <RankSidebar myNickname={nickname} />}

      {/* Minimap (desktop only, hidden indoors) */}
      {!indoorRoom && <MiniMap gameRef={gameRef} otherPlayersRef={otherPlayersRef} partyMembersRef={partyMembersRef} />}

      {/* Shortcut buttons (desktop only) */}
      <div className="shortcut-bar">
        <button tabIndex={-1} data-tooltip="인벤토리 (I)" onClick={() => setShowInv(v => !v)}>🎒 인벤</button>
        <button tabIndex={-1} data-tooltip="상점 (S)" onClick={() => setShowShop(v => !v)}>🏪 상점</button>
        <button tabIndex={-1} data-tooltip="상태창 (A)" onClick={() => setShowStats(v => !v)}>📊 상태</button>
        <button tabIndex={-1} data-tooltip="랭킹 (R)" onClick={() => setShowRank(v => !v)}>🏆 랭킹</button>
        <button tabIndex={-1} data-tooltip="일일 퀘스트 (Q)" onClick={() => setShowQuest(v => !v)} style={questBtnStyle}>📋 퀘스트{questHasClaim ? ' 🔔' : ''}</button>
        <button tabIndex={-1} data-tooltip="물고기 도감 (D)" onClick={() => setShowDex(v => !v)}>📖 도감</button>
        <button tabIndex={-1} data-tooltip="주간 낚시 토너먼트" onClick={() => { setShowTournament(v => !v); setGs(prev => ({ ...prev, seenFeatures: [...new Set([...(prev.seenFeatures ?? []), 'tournament'])] })); }}>
          🏆 토너먼트{!(gs.seenFeatures ?? []).includes('tournament') ? <span style={{ fontSize: 9, background: '#ff4444', color: '#fff', borderRadius: 4, padding: '1px 4px', marginLeft: 3, verticalAlign: 'middle' }}>NEW</span> : ''}
        </button>
        <button tabIndex={-1} data-tooltip="내 오두막 꾸미기" onClick={() => { setShowCottage && setShowCottage(v => !v); setGs(prev => ({ ...prev, seenFeatures: [...new Set([...(prev.seenFeatures ?? []), 'cottage'])] })); }}>
          🏠 오두막{!(gs.seenFeatures ?? []).includes('cottage') ? <span style={{ fontSize: 9, background: '#ff4444', color: '#fff', borderRadius: 4, padding: '1px 4px', marginLeft: 3, verticalAlign: 'middle' }}>NEW</span> : ''}
        </button>
        <button tabIndex={-1} data-tooltip="게임 설정" onClick={() => setShowSettings(v => !v)}>⚙️ 설정</button>
        {indoorRoom && <button tabIndex={-1} style={{ color: '#ffaaaa', borderColor: 'rgba(255,100,100,0.4)' }} onClick={handleExitRoom}>🚪 나가기</button>}
        {indoorRoom === 'mine' && <button tabIndex={-1} style={{ color: '#aaffcc', borderColor: 'rgba(100,255,150,0.4)' }} onClick={() => handleCommand('!광질')}>⛏ 광질</button>}
      </div>

      {/* Mobile controls: joystick + action buttons */}
      <div className="mobile-controls">
        <Joystick gameRef={gameRef} />
        <div className="action-btns">
          {/* Primary row: most-used actions */}
          <div className="action-btns-primary">
            {nearActionZone === 'fish' && (
              <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!낚시')}>
                <span>🎣</span><span className="action-btn-label">낚시</span>
              </button>
            )}
            {indoorRoom === 'mine' && (
              <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!광질')}>
                <span>⛏</span><span className="action-btn-label">광질</span>
              </button>
            )}
            {nearActionZone === 'gather' && (
              <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!채집')}>
                <span>🌿</span><span className="action-btn-label">채집</span>
              </button>
            )}
            {indoorRoom === 'cooking' && (
              <button className="action-btn" tabIndex={-1} onClick={() => handleCommand('!요리')}>
                <span>🍳</span><span className="action-btn-label">요리</span>
              </button>
            )}
            {activity && (
              <button className="action-btn action-btn-stop" tabIndex={-1} onClick={() => handleCommand('!그만')}>
                <span>🛑</span><span className="action-btn-label">그만</span>
              </button>
            )}
            <button className="action-btn" tabIndex={-1} onClick={() => setShowMobileMenu(v => !v)}>
              <span>☰</span><span className="action-btn-label">메뉴</span>
            </button>
          </div>
          {/* Secondary row: less-used + context-sensitive */}
          <div className="action-btns-secondary">
            <button className="action-btn action-btn-sm" tabIndex={-1} onClick={() => setShowQuest(v => !v)} style={questBtnStyle}>
              <span>📋</span><span className="action-btn-label">퀘스트{questHasClaim ? '!' : ''}</span>
            </button>
            <button className="action-btn action-btn-sm" tabIndex={-1} onClick={() => setShowDex(v => !v)}>
              <span>📖</span><span className="action-btn-label">도감</span>
            </button>
            <button className="action-btn action-btn-sm" tabIndex={-1} onClick={() => setShowRank(true)}>
              <span>🏆</span><span className="action-btn-label">랭킹</span>
            </button>
            {nearDoor && !indoorRoom && (
              <button className="action-btn action-btn-sm action-btn-enter" tabIndex={-1} onClick={() => gameRef.current?.enterRoom?.()}>
                <span>🚪</span><span className="action-btn-label">입장</span>
              </button>
            )}
            {indoorRoom && (
              <button className="action-btn action-btn-sm" tabIndex={-1} style={{ background: 'rgba(180,60,60,0.7)', borderColor: '#ff6666' }} onClick={handleExitRoom}>
                <span>🚪</span><span className="action-btn-label">나가기</span>
              </button>
            )}
            {nearIndoorNpc && indoorRoom && (
              <button className="action-btn action-btn-sm action-btn-enter" tabIndex={-1} onClick={() => handleNpcInteract(nearIndoorNpc.name)}>
                <span>💬</span><span className="action-btn-label">대화</span>
              </button>
            )}
            {indoorRoom === 'inn' && !(gs.innBuff && Date.now() < gs.innBuff.expiresAt) && (
              <button className="action-btn action-btn-sm" tabIndex={-1} style={{ background: 'rgba(0,100,200,0.7)', borderColor: '#4488ff' }}
                onClick={() => handleCommand('!여관휴식')}>
                <span>💤</span><span className="action-btn-label">여관</span>
              </button>
            )}
            {indoorRoom === 'inn' && gs.innBuff && Date.now() < gs.innBuff.expiresAt && (
              <div className="action-btn action-btn-sm" style={{ background: 'rgba(0,60,140,0.6)', borderColor: '#2266cc', cursor: 'default' }}>
                <span>💤</span><span className="action-btn-label">{Math.ceil((gs.innBuff.expiresAt - Date.now()) / 60000)}분</span>
              </div>
            )}
            {indoorRoom === 'inn' && (
              <button className="action-btn action-btn-sm" tabIndex={-1} style={{ background: 'rgba(120,60,160,0.7)', borderColor: '#aa66ff' }}
                onClick={() => { setAppearanceDraft({ hairColor: gs.hairColor, bodyColor: gs.bodyColor, skinColor: gs.skinColor }); setShowAppearance(true); }}>
                <span>✂</span><span className="action-btn-label">외모</span>
              </button>
            )}
            {indoorRoom === 'guild' && (
              <button className="action-btn action-btn-sm" tabIndex={-1} style={{ background: 'rgba(120,90,20,0.7)', borderColor: '#ffcc44' }}
                onClick={() => setShowGuild(true)}>
                <span>🏰</span><span className="action-btn-label">길드</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile slide-in menu */}
      {showMobileMenu && (
        <div className="mobile-menu-backdrop" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span>메뉴</span>
              <button className="mobile-menu-close" onClick={() => setShowMobileMenu(false)}>✕</button>
            </div>
            <div className="mobile-menu-items">
              <button className="mobile-menu-item" onClick={() => { setShowInv(true); setShowMobileMenu(false); }}>
                <span className="mobile-menu-icon">🎒</span><span>인벤토리</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { setShowShop(true); setShowMobileMenu(false); }}>
                <span className="mobile-menu-icon">🏪</span><span>상점</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { setShowStats(true); setShowMobileMenu(false); }}>
                <span className="mobile-menu-icon">📊</span><span>상태</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { setShowDex(true); setShowMobileMenu(false); }}>
                <span className="mobile-menu-icon">📖</span><span>도감</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { setShowRank(true); setShowMobileMenu(false); }}>
                <span className="mobile-menu-icon">🏆</span><span>랭킹</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { setShowGuild(true); setShowMobileMenu(false); }}>
                <span className="mobile-menu-icon">🏰</span><span>길드</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { setShowMarket(true); setShowMobileMenu(false); }}>
                <span className="mobile-menu-icon">🏪</span><span>경매장</span>
              </button>
            </div>
            <div className="mobile-menu-status">
              <div style={{ color: myTitle.color, fontWeight: 700 }}>[{myTitle.label}]</div>
              <div>💰 {gs.money.toLocaleString()}G</div>
              <div style={{ color: RODS[gs.rod]?.color }}>🎣 {RODS[gs.rod]?.name}</div>
              {weather && <div>{weather.icon} {weather.label}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
