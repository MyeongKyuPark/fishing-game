import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export default function RoomLobby({ nickname, onJoin }) {
  const [rooms, setRooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [joinPw, setJoinPw] = useState({});   // { roomId: inputValue }
  const [joinErr, setJoinErr] = useState({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const createRoom = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const ref = await addDoc(collection(db, 'rooms'), {
      title: title.trim(),
      password: password,
      host: nickname,
      playerCount: 1,
      createdAt: serverTimestamp(),
    });
    setCreating(false);
    onJoin(ref.id, title.trim());
  };

  const tryJoin = (room) => {
    if (room.password) {
      const input = joinPw[room.id] ?? '';
      if (input !== room.password) {
        setJoinErr(prev => ({ ...prev, [room.id]: '비밀번호가 틀렸습니다.' }));
        return;
      }
    }
    onJoin(room.id, room.title);
  };

  return (
    <div className="login-bg">
      <div className="login-box" style={{ width: 480, maxWidth: '96vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="login-title" style={{ fontSize: 22, marginBottom: 2 }}>🎣 Tidehaven</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>👤 {nickname}</div>
          </div>
          <button className="login-btn" style={{ padding: '8px 16px', fontSize: 13, marginTop: 0 }}
            onClick={() => setShowCreate(v => !v)}>
            {showCreate ? '닫기' : '+ 방 만들기'}
          </button>
        </div>

        {showCreate && (
          <form className="login-form" onSubmit={createRoom} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>방 제목</div>
            <input className="login-input" type="text" placeholder="방 제목 입력" value={title}
              onChange={e => setTitle(e.target.value)} maxLength={24} autoFocus />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 4 }}>비밀번호 (선택)</div>
            <input className="login-input" type="text" placeholder="없으면 비워두세요" value={password}
              onChange={e => setPassword(e.target.value)} maxLength={16} />
            <button className="login-btn" type="submit" disabled={creating} style={{ marginTop: 8 }}>
              {creating ? '생성 중…' : '방 만들기'}
            </button>
          </form>
        )}

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          방 목록 ({rooms.length})
        </div>

        <div className="room-list">
          {rooms.length === 0 && (
            <div className="empty" style={{ padding: '20px 0' }}>방이 없습니다. 새로 만들어보세요!</div>
          )}
          {rooms.map(room => (
            <div key={room.id} className="room-row">
              <div className="room-info">
                <span className="room-title">{room.title}</span>
                <span className="room-host">방장: {room.host}</span>
                {room.password ? <span className="room-lock">🔒</span> : <span className="room-open">🔓</span>}
              </div>
              {room.password && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                  <input
                    className="chat-input"
                    type="password"
                    placeholder="비밀번호"
                    value={joinPw[room.id] ?? ''}
                    onChange={e => {
                      setJoinPw(prev => ({ ...prev, [room.id]: e.target.value }));
                      setJoinErr(prev => ({ ...prev, [room.id]: '' }));
                    }}
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  <button className="login-btn" style={{ padding: '6px 14px', fontSize: 12, marginTop: 0 }}
                    onClick={() => tryJoin(room)}>입장</button>
                </div>
              )}
              {joinErr[room.id] && <div className="login-err" style={{ marginTop: 4 }}>{joinErr[room.id]}</div>}
              {!room.password && (
                <button className="login-btn" style={{ marginTop: 8, padding: '7px 0', fontSize: 13 }}
                  onClick={() => tryJoin(room)}>입장하기</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
