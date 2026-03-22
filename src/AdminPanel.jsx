// Admin Event Dashboard — Firebase Auth-protected panel for server event management
import { useState, useEffect } from 'react';
import { doc, setDoc, addDoc, collection, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from './firebase';

// Admin email is not secret; password is in Firebase Auth only (never bundled)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@tidehaven.internal';

async function writeAuditLog(action) {
  try {
    await addDoc(collection(db, 'admin_audit_log'), {
      action,
      timestamp: serverTimestamp(),
      adminUser: auth.currentUser?.email ?? 'unknown',
    });
  } catch (e) {
    console.warn('audit log write failed', e);
  }
}

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [status, setStatus] = useState('');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!authed) return;
    const unsub = onSnapshot(collection(db, 'server_events'), snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [authed]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setPwErr('');
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, pw);
      setAuthed(true);
    } catch (err) {
      setPwErr('로그인 실패: 비밀번호를 확인하세요.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthed(false);
    setPw('');
  };

  const activateEvent = async (type, label, effectValue, durationMs) => {
    try {
      const endsAt = new Date(Date.now() + durationMs);
      await setDoc(doc(db, 'server_events', 'current'), {
        type,
        label,
        effectValue,
        active: true,
        endsAt,
        createdAt: serverTimestamp(),
      });
      await writeAuditLog(`activate_event:${type}`);
      setStatus(`✅ 이벤트 활성화: ${label}`);
    } catch (e) {
      setStatus(`❌ 오류: ${e.message}`);
    }
  };

  const clearEvents = async () => {
    try {
      await deleteDoc(doc(db, 'server_events', 'current'));
      await writeAuditLog('clear_events');
      setStatus('✅ 모든 이벤트 초기화 완료');
    } catch (e) {
      setStatus(`❌ 오류: ${e.message}`);
    }
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.07)', padding: 32, borderRadius: 12, width: 320 }}>
          <h2 style={{ color: '#88ccff', marginBottom: 16, textAlign: 'center' }}>🔐 관리자 패널</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="관리자 비밀번호"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, boxSizing: 'border-box', marginBottom: 8 }}
            />
            {pwErr && <div style={{ color: '#ff6666', fontSize: 12, marginBottom: 8 }}>{pwErr}</div>}
            <button type="submit" disabled={loggingIn} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#2a6496', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loggingIn ? 'not-allowed' : 'pointer', opacity: loggingIn ? 0.7 : 1 }}>
              {loggingIn ? '로그인 중…' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a2e', padding: 24, color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ color: '#88ccff', margin: 0 }}>🎮 Tidehaven 관리자 패널</h1>
        <button onClick={handleLogout} style={{ background: 'rgba(255,100,100,0.2)', border: '1px solid rgba(255,100,100,0.4)', color: '#ff9999', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>로그아웃</button>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>서버 이벤트를 관리합니다. ({ADMIN_EMAIL})</p>

      {status && (
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {status}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <button onClick={() => activateEvent('rareFish', '희귀 물고기 이벤트 (30분)', 4, 30 * 60 * 1000)}
          style={btnStyle('#1a5a3a')}>
          🐟 희귀 물고기 이벤트<br /><small>출현율 ×4 / 30분</small>
        </button>
        <button onClick={() => activateEvent('sellBonus', '판매 보너스 이벤트 (1시간)', 0.5, 60 * 60 * 1000)}
          style={btnStyle('#5a3a1a')}>
          💰 판매 보너스 이벤트<br /><small>판매가 +50% / 1시간</small>
        </button>
        <button onClick={() => activateEvent('chapter5', '챕터 5 — 타이드헤이븐의 전설', 0, 7 * 24 * 60 * 60 * 1000)}
          style={btnStyle('#3a1a5a')}>
          📖 챕터 5 이벤트 발동<br /><small>전서버 스토리 완결</small>
        </button>
        <button onClick={clearEvents}
          style={btnStyle('#5a1a1a')}>
          🗑 모든 이벤트 초기화<br /><small>현재 이벤트 제거</small>
        </button>
      </div>

      <h2 style={{ color: '#88ccff', fontSize: 16, marginBottom: 8 }}>현재 활성 이벤트</h2>
      {events.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>활성 이벤트 없음</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map(ev => (
            <div key={ev.id} style={{ background: 'rgba(255,255,255,0.07)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              <span style={{ color: '#ffcc44', fontWeight: 700 }}>{ev.id}</span>
              {' — '}
              <span>{ev.type}</span>
              {' | '}
              <span style={{ color: ev.active ? '#66ff88' : '#ff6666' }}>{ev.active ? '활성' : '비활성'}</span>
              {ev.endsAt && (
                <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>
                  종료: {new Date(ev.endsAt?.toDate?.() ?? ev.endsAt).toLocaleString('ko-KR')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function btnStyle(bg) {
  return {
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: bg,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    lineHeight: 1.5,
  };
}
