import RankSidebar from '../RankSidebar';
import MiniMap from '../MiniMap';
import Joystick from '../Joystick';
import { RODS, FISH } from '../gameData';
import { ZONE_LABELS } from '../mapData';
import { getWeatherForecast } from '../weatherData';
import { useEffect, useState } from 'react';

// Phase 12-2: Festival active check
const isFestivalActive = (gs) => !!(gs?.festivalEndDate && Date.now() < gs.festivalEndDate);

// Counter-clockwise buff arc timer
function BuffArc({ expiresAt, totalMs, icon, color, label }) {
  const R = 13;
  const CX = 18; const CY = 18;
  const circumference = 2 * Math.PI * R;
  const now = Date.now();
  const remaining = Math.max(0, expiresAt - now);
  const pct = totalMs > 0 ? remaining / totalMs : 0;
  // dashoffset controls how much of the arc is visible
  const dashoffset = circumference * (1 - pct);
  const mins = Math.ceil(remaining / 60000);
  const secs = Math.ceil(remaining / 1000);
  const timeLabel = remaining > 60000 ? `${mins}분` : `${secs}초`;

  return (
    <div className="buff-arc-wrap" title={label}>
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <svg
          className="buff-arc-svg"
          width={36} height={36}
          style={{ transform: 'rotate(-90deg) scaleX(-1)', display: 'block' }}
        >
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="rgba(255,255,255,0.12)" strokeWidth={3} />
          {/* Remaining arc */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke={color} strokeWidth={3}
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round" />
        </svg>
        {/* Icon centered */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', fontSize: 13, lineHeight: 1,
          pointerEvents: 'none',
        }}>
          {icon}
        </div>
      </div>
      <div className="buff-arc-label" style={{ color }}>{timeLabel}</div>
    </div>
  );
}

export default function TopBar({
  gs, setGs, nickname, myTitle, roomTitle, weather, currentSeason, activity, isOnline,
  serverQuest, serverBoss, fishSurgeEvent, serverEvent, activeWeatherEvent, roomId,
  indoorRoom, nearDoor, nearActionZone, nearIndoorNpc, partyId, partyMembersRef, otherPlayersRef,
  pendingInvite, showAnnounce, serverAnnouncements,
  achPopup, gradeUpCelebration,
  gameRef, handleCommand, handleExitRoom, handleNpcInteract,
  addMsg,
  setShowInv, setShowShop, setShowStats, setShowRank, setShowQuest, setShowDex, setShowAch,
  setShowGuild, setShowMarket, setShowMobileMenu, showMobileMenu,
  setAppearanceDraft, setShowAppearance,
  setShowSettings, setShowTournament, setShowCottage, setShowWorldMap,
  setShowTownHall, setShowPointShop,
}) {
  // Tick to animate buff arc timers
  const [, setBuffTick] = useState(0);
  useEffect(() => {
    const hasBuff = (gs.innBuff && Date.now() < gs.innBuff.expiresAt) ||
                    (gs.activePotion && Date.now() < gs.activePotion.expiresAt);
    if (!hasBuff) return;
    const id = setInterval(() => setBuffTick(t => t + 1), 500);
    return () => clearInterval(id);
  }, [gs.innBuff, gs.activePotion]);

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
        {weather && (() => {
          const [showForecast, setShowForecast] = [false, () => {}]; // local toggle via React state not available here; use title tooltip
          const forecast = getWeatherForecast(roomId, 3);
          return (
            <div className="hud-chip" style={{ fontSize: 11, cursor: 'help', position: 'relative' }}
              title={`예보: ${forecast.map(w => `${w.icon}${w.label}`).join(' → ')}`}>
              {weather.icon} {weather.label}
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                → {forecast[0]?.icon}
              </span>
            </div>
          );
        })()}
        {activeWeatherEvent && (!activeWeatherEvent.expiresAt || Date.now() < activeWeatherEvent.expiresAt) && (
          <div className="hud-chip" style={{ fontSize: 10, color: activeWeatherEvent.color ?? '#ffff88', animation: 'blink 1.4s ease-in-out infinite' }}>
            {activeWeatherEvent.icon} {activeWeatherEvent.label}!
          </div>
        )}
        {gs.worldZone && gs.worldZone !== '마을' && (() => {
          const THRESHOLDS = [10, 30, 60, 100, 150];
          const exp = gs.zoneMastery?.[gs.worldZone] ?? 0;
          let lv = 0;
          for (const t of THRESHOLDS) if (exp >= t) lv++;
          return (
            <div className="hud-chip" style={{ fontSize: 11, color: '#a8e8ff', background: 'rgba(0,80,140,0.4)', display: 'flex', gap: 4, alignItems: 'center' }}>
              {ZONE_LABELS[gs.worldZone] ?? gs.worldZone}
              <span style={{ fontSize: 9, fontWeight: 700, color: ['#aaa','#88dd88','#44aaff','#ff9944','#ff44aa','#ffdd00'][lv], background: 'rgba(0,0,0,0.4)', borderRadius: 3, padding: '1px 3px' }}>Lv{lv}</span>
            </div>
          );
        })()}
        {!isOnline && (
          <div className="hud-chip" style={{ fontSize: 11, color: '#ff8888', background: 'rgba(80,0,0,0.5)' }}>📵 오프라인</div>
        )}
        {gs.innBuff && Date.now() < gs.innBuff.expiresAt && (
          <BuffArc
            expiresAt={gs.innBuff.expiresAt}
            totalMs={10 * 60 * 1000}
            icon="💤"
            color="#88ccff"
            label="여관 휴식 버프 — 낚시 속도 +20%"
          />
        )}
        {gs.activePotion && Date.now() < gs.activePotion.expiresAt && (
          <BuffArc
            expiresAt={gs.activePotion.expiresAt}
            totalMs={gs.activePotion.effect?.duration ?? 300000}
            icon="🧪"
            color="#cc88ff"
            label={`포션 효과 활성 중`}
          />
        )}
        {isFestivalActive(gs) && (() => {
          const remaining = Math.ceil((gs.festivalEndDate - Date.now()) / 3600000);
          return <div className="hud-chip" style={{ background: '#ff88aa22', color: '#ff88aa' }} data-tooltip={`축제 보너스 남은 시간: ${remaining}시간`}>🎉 축제 {remaining}h</div>;
        })()}
        {(gs.activityPoints ?? 0) > 0 && (
          <div className="hud-chip" data-tooltip="활동 포인트 — 포인트 상점에서 아이템 교환 가능">⭐ {gs.activityPoints}pt</div>
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
        {serverBoss && serverBoss.hp > 0 && (() => {
          const pct = serverBoss.maxHp > 0 ? serverBoss.hp / serverBoss.maxHp : 0;
          const barColor = pct > 0.5 ? '#44dd44' : pct > 0.25 ? '#ffcc00' : '#ff4444';
          const contribCount = Object.keys(serverBoss.contributors ?? {}).length;
          return (
            <div className="hud-chip" style={{ fontSize: 10, color: '#ffaaaa', display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚔️ {serverBoss.name}
              <div style={{ width: 60, height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct * 100}%`, height: '100%', background: barColor, transition: 'width 0.3s' }} />
              </div>
              <span style={{ color: barColor }}>{serverBoss.hp}/{serverBoss.maxHp}</span>
              {contribCount > 0 && <span style={{ color: '#aaa' }}>({contribCount}명)</span>}
            </div>
          );
        })()}
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
      {/* Context-sensitive actions — separate row above shortcut bar so fixed icons never shift */}
      {(nearIndoorNpc && indoorRoom) || indoorRoom || (indoorRoom === 'mine') ? (
        <div className="shortcut-context">
          {nearIndoorNpc && indoorRoom && (
            <button tabIndex={-1} style={{ color: '#ffffaa', borderColor: 'rgba(255,255,100,0.5)', background: 'rgba(80,80,20,0.7)', animation: 'blink 1.2s ease-in-out infinite' }} onClick={() => handleNpcInteract(nearIndoorNpc.name)}>
              💬 {nearIndoorNpc.name} 대화
            </button>
          )}
          {indoorRoom && <button tabIndex={-1} style={{ color: '#ffaaaa', borderColor: 'rgba(255,100,100,0.4)' }} onClick={handleExitRoom}>🚪 나가기</button>}
          {indoorRoom === 'mine' && <button tabIndex={-1} style={{ color: '#aaffcc', borderColor: 'rgba(100,255,150,0.4)' }} onClick={() => handleCommand('!광질')}>⛏ 광질</button>}
        </div>
      ) : null}

      <div className="shortcut-bar">
        <button tabIndex={-1} data-tooltip="인벤토리 (I)" onClick={() => setShowInv(v => !v)}>🎒 인벤</button>
        <button tabIndex={-1} data-tooltip="상점 (S)" onClick={() => setShowShop(v => !v)}>🏪 상점</button>
        <button tabIndex={-1} data-tooltip="상태창 (A)" onClick={() => setShowStats(v => !v)}>📊 상태</button>
        <button tabIndex={-1} data-tooltip="랭킹 (R)" onClick={() => setShowRank(v => !v)}>🏆 랭킹</button>
        <button tabIndex={-1} data-tooltip="일일 퀘스트 (Q)" onClick={() => setShowQuest(v => !v)} style={questBtnStyle}>📋 퀘스트{questHasClaim ? ' 🔔' : ''}</button>
        <button tabIndex={-1} data-tooltip="물고기 도감 (D)" onClick={() => setShowDex(v => !v)}>📖 도감</button>
        <button tabIndex={-1} data-tooltip="업적" onClick={() => setShowAch?.(v => !v)}>🏅 업적</button>
        <button tabIndex={-1} data-tooltip="세계 지도 (M)" onClick={() => setShowWorldMap?.(v => !v)}>🗺 지도</button>
        <button tabIndex={-1} data-tooltip="주간 낚시 토너먼트" onClick={() => { setShowTournament(v => !v); setGs(prev => ({ ...prev, seenFeatures: [...new Set([...(prev.seenFeatures ?? []), 'tournament'])] })); }}>
          🏆 토너먼트{!(gs.seenFeatures ?? []).includes('tournament') ? <span style={{ fontSize: 9, background: '#ff4444', color: '#fff', borderRadius: 4, padding: '1px 4px', marginLeft: 3, verticalAlign: 'middle' }}>NEW</span> : ''}
        </button>
        <button tabIndex={-1} data-tooltip="내 오두막 꾸미기" onClick={() => { setShowCottage && setShowCottage(v => !v); setGs(prev => ({ ...prev, seenFeatures: [...new Set([...(prev.seenFeatures ?? []), 'cottage'])] })); }}>
          🏠 오두막{!(gs.seenFeatures ?? []).includes('cottage') ? <span style={{ fontSize: 9, background: '#ff4444', color: '#fff', borderRadius: 4, padding: '1px 4px', marginLeft: 3, verticalAlign: 'middle' }}>NEW</span> : ''}
        </button>
        <button tabIndex={-1} data-tooltip="마을 발전 시스템 (T)" onClick={() => setShowTownHall?.(v => !v)}>🏘 마을</button>
        <button tabIndex={-1} data-tooltip="활동 포인트 상점" onClick={() => setShowPointShop?.(v => !v)}>⭐ 포인트 상점</button>
        <button tabIndex={-1} data-tooltip="게임 설정" onClick={() => setShowSettings(v => !v)}>⚙️ 설정</button>
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
              <button className="mobile-menu-item" onClick={() => { setShowWorldMap?.(true); setShowMobileMenu(false); }}>
                <span className="mobile-menu-icon">🗺</span><span>세계 지도</span>
              </button>
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
