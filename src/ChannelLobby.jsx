import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';

const CHANNELS = Array.from({ length: 10 }, (_, i) => i + 1);
const MAX_PLAYERS = 20;

export default function ChannelLobby({ nickname, onJoin }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    // Subscribe to all players and count by channelId
    const q = query(collection(db, 'players'));
    return onSnapshot(q, snap => {
      const now = Date.now();
      const c = {};
      snap.docs.forEach(d => {
        const p = d.data();
        if (!p.roomId?.startsWith('channel_')) return;
        // Only count non-stale players (within 35s)
        if (p.updatedAt) {
          try { if (now - p.updatedAt.toMillis() > 35000) return; }
          catch { /* ok */ }
        }
        c[p.roomId] = (c[p.roomId] ?? 0) + 1;
      });
      setCounts(c);
    }, () => {});
  }, []);

  return (
    <div className="login-bg">
      <div className="login-box" style={{ width: 440, maxWidth: '96vw' }}>
        <div style={{ marginBottom: 20 }}>
          <div className="login-title" style={{ fontSize: 22, marginBottom: 2 }}>🎣 Tidehaven</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>👤 {nickname} · 채널을 선택하세요</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CHANNELS.map(n => {
            const key = `channel_${n}`;
            const count = counts[key] ?? 0;
            const full = count >= MAX_PLAYERS;
            return (
              <button
                key={n}
                onClick={() => !full && onJoin(key, `${n}채널`)}
                disabled={full}
                style={{
                  background: full ? 'rgba(60,40,40,0.8)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${full ? 'rgba(255,80,80,0.3)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  cursor: full ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 6,
                  transition: 'background 0.15s',
                  opacity: full ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!full) e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }}
                onMouseLeave={e => { if (!full) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              >
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                  🌊 {n}채널
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                  <div style={{
                    flex: 1, height: 4, background: 'rgba(255,255,255,0.12)',
                    borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(count / MAX_PLAYERS) * 100}%`, height: '100%',
                      background: count >= MAX_PLAYERS * 0.8 ? '#ff6644' : '#44cc88',
                      borderRadius: 2,
                    }} />
                  </div>
                  <span style={{
                    fontSize: 11,
                    color: full ? '#ff8866' : count > 10 ? '#ffcc44' : '#88ffbb',
                    minWidth: 42,
                    textAlign: 'right',
                  }}>
                    {count}/{MAX_PLAYERS}
                  </span>
                </div>
                {full && <div style={{ fontSize: 10, color: '#ff8866' }}>만원</div>}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          채널당 최대 {MAX_PLAYERS}명 · 실시간 접속자 표시
        </div>
      </div>
    </div>
  );
}
