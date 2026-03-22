import { useEffect, useRef, useState } from 'react';

const COMMAND_SUGGESTIONS = [
  { cmd: '!낚시', desc: '낚시 시작' },
  { cmd: '!그만', desc: '현재 작업 중단' },
  { cmd: '!광질', desc: '채굴 시작' },
  { cmd: '!채집', desc: '허브 채집 시작' },
  { cmd: '!요리', desc: '요리 시작' },
  { cmd: '!인벤', desc: '인벤토리 열기' },
  { cmd: '!상점', desc: '상점 열기' },
  { cmd: '!상태', desc: '상태창 열기' },
  { cmd: '!퀘스트', desc: '퀘스트 열기' },
  { cmd: '!도감', desc: '물고기 도감' },
  { cmd: '!은행', desc: '은행 열기' },
  { cmd: '!도움말', desc: '전체 명령어 목록' },
  { cmd: '!랭킹', desc: '랭킹 보기' },
  { cmd: '!판매', desc: '물고기 전체 판매' },
  { cmd: '!여관휴식', desc: '여관 특별 휴식 (500G)' },
];

const EMOJI_SUGGESTIONS = [
  { trigger: ':fish', emoji: '🐟', label: '물고기' },
  { trigger: ':rod', emoji: '🎣', label: '낚싯대' },
  { trigger: ':wave', emoji: '🌊', label: '파도' },
  { trigger: ':star', emoji: '⭐', label: '별' },
  { trigger: ':fire', emoji: '🔥', label: '불꽃' },
  { trigger: ':heart', emoji: '❤️', label: '하트' },
  { trigger: ':smile', emoji: '😊', label: '웃음' },
  { trigger: ':laugh', emoji: '😂', label: '웃음2' },
  { trigger: ':cry', emoji: '😢', label: '울음' },
  { trigger: ':shock', emoji: '😮', label: '놀람' },
  { trigger: ':wow', emoji: '😲', label: '와우' },
  { trigger: ':ok', emoji: '👍', label: '좋아요' },
  { trigger: ':no', emoji: '👎', label: '싫어요' },
  { trigger: ':hi', emoji: '👋', label: '안녕' },
  { trigger: ':mine', emoji: '⛏️', label: '채굴' },
  { trigger: ':gem', emoji: '💎', label: '보석' },
  { trigger: ':money', emoji: '💰', label: '돈' },
  { trigger: ':herb', emoji: '🌿', label: '허브' },
  { trigger: ':tree', emoji: '🌲', label: '나무' },
  { trigger: ':sun', emoji: '☀️', label: '해' },
  { trigger: ':rain', emoji: '🌧️', label: '비' },
  { trigger: ':snow', emoji: '❄️', label: '눈' },
  { trigger: ':cat', emoji: '🐱', label: '고양이' },
  { trigger: ':dog', emoji: '🐶', label: '강아지' },
  { trigger: ':otter', emoji: '🦦', label: '수달' },
];

export default function Chat({ messages, onCommand }) {
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const [emojiPopup, setEmojiPopup] = useState(null); // { query, filtered, selIdx }
  const [cmdPopup, setCmdPopup] = useState(null); // { filtered, selIdx }

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // C-4: Prevent layout shift when virtual keyboard opens on mobile
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      if (panelRef.current) {
        const kbHeight = window.innerHeight - vv.height - vv.offsetTop;
        panelRef.current.style.paddingBottom = kbHeight > 20 ? `${kbHeight}px` : '';
      }
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    return () => { vv.removeEventListener('resize', handler); vv.removeEventListener('scroll', handler); };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const val = inputRef.current.value.trim();
    if (!val) return;
    inputRef.current.value = '';
    setEmojiPopup(null);
    setCmdPopup(null);
    onCommand(val);
  };

  const handleInputChange = () => {
    const val = inputRef.current.value;
    const cursor = inputRef.current.selectionStart;
    const before = val.slice(0, cursor);
    // Command autocomplete: `!` prefix
    const cmdMatch = before.match(/^(![\u0000-\uffff]*)$/);
    if (cmdMatch) {
      const query = cmdMatch[1];
      const filtered = COMMAND_SUGGESTIONS.filter(c => c.cmd.startsWith(query));
      if (filtered.length > 0) {
        setCmdPopup({ filtered: filtered.slice(0, 8), selIdx: 0 });
        setEmojiPopup(null);
        return;
      }
    }
    setCmdPopup(null);
    // Emoji autocomplete: `:word` pattern
    const match = before.match(/:([a-z]*)$/);
    if (match) {
      const query = match[1];
      const filtered = EMOJI_SUGGESTIONS.filter(e => e.trigger.slice(1).startsWith(query) || e.label.includes(query));
      if (filtered.length > 0) {
        setEmojiPopup({ query, filtered: filtered.slice(0, 8), selIdx: 0 });
        return;
      }
    }
    setEmojiPopup(null);
  };

  const insertEmoji = (item) => {
    const val = inputRef.current.value;
    const cursor = inputRef.current.selectionStart;
    const before = val.slice(0, cursor);
    const after = val.slice(cursor);
    const replaced = before.replace(/:([a-z]*)$/, item.emoji + ' ');
    inputRef.current.value = replaced + after;
    inputRef.current.focus();
    const newCursor = replaced.length;
    inputRef.current.setSelectionRange(newCursor, newCursor);
    setEmojiPopup(null);
  };

  const insertCmd = (item) => {
    inputRef.current.value = item.cmd + ' ';
    inputRef.current.focus();
    setCmdPopup(null);
  };

  const handleKeyDown = (e) => {
    if (cmdPopup) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCmdPopup(prev => ({ ...prev, selIdx: (prev.selIdx + 1) % prev.filtered.length }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCmdPopup(prev => ({ ...prev, selIdx: (prev.selIdx - 1 + prev.filtered.length) % prev.filtered.length }));
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        insertCmd(cmdPopup.filtered[cmdPopup.selIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setCmdPopup(null);
        return;
      }
    }
    if (emojiPopup) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setEmojiPopup(prev => ({ ...prev, selIdx: (prev.selIdx + 1) % prev.filtered.length }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setEmojiPopup(prev => ({ ...prev, selIdx: (prev.selIdx - 1 + prev.filtered.length) % prev.filtered.length }));
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        if (emojiPopup.filtered.length > 0) {
          e.preventDefault();
          insertEmoji(emojiPopup.filtered[emojiPopup.selIdx]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setEmojiPopup(null);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(e);
    }
  };

  return (
    <div className="chat-panel" ref={panelRef} style={{ position: 'relative' }}>
      <div className="chat-header">채팅 / 명령어</div>
      <div className="chat-messages" ref={listRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-${msg.type}`}>{msg.text}</div>
        ))}
      </div>

      {cmdPopup && (
        <div style={{
          position: 'absolute', bottom: 44, left: 0, right: 0,
          background: 'rgba(15,20,35,0.98)', border: '1px solid rgba(100,180,255,0.25)',
          borderRadius: 8, padding: '4px 0', zIndex: 100, maxHeight: 240, overflowY: 'auto',
        }}>
          <div style={{ padding: '3px 10px 2px', fontSize: 10, color: 'rgba(100,180,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Tab으로 선택</div>
          {cmdPopup.filtered.map((item, idx) => (
            <div key={item.cmd}
              onMouseDown={(e) => { e.preventDefault(); insertCmd(item); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '5px 10px', cursor: 'pointer', fontSize: 12,
                background: idx === cmdPopup.selIdx ? 'rgba(100,180,255,0.15)' : 'transparent',
                color: idx === cmdPopup.selIdx ? '#88ddff' : 'rgba(255,255,255,0.75)',
              }}
            >
              <span style={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 80, color: '#88ddff' }}>{item.cmd}</span>
              <span style={{ opacity: 0.6 }}>{item.desc}</span>
            </div>
          ))}
        </div>
      )}

      {emojiPopup && (
        <div style={{
          position: 'absolute', bottom: 44, left: 0, right: 0,
          background: 'rgba(20,22,28,0.97)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '4px 0', zIndex: 99, maxHeight: 200, overflowY: 'auto',
        }}>
          {emojiPopup.filtered.map((item, idx) => (
            <div key={item.trigger}
              onMouseDown={(e) => { e.preventDefault(); insertEmoji(item); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 10px', cursor: 'pointer', fontSize: 13,
                background: idx === emojiPopup.selIdx ? 'rgba(100,180,255,0.18)' : 'transparent',
                color: idx === emojiPopup.selIdx ? '#7df' : 'rgba(255,255,255,0.75)',
              }}
            >
              <span style={{ fontSize: 16, minWidth: 22 }}>{item.emoji}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: 11, opacity: 0.45 }}>{item.trigger}</span>
            </div>
          ))}
        </div>
      )}

      <form className="chat-form" onSubmit={submit}>
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          placeholder="!도움말  또는  :fish"
          autoComplete="off"
          spellCheck="false"
          tabIndex={1}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="chat-send">전송</button>
      </form>
    </div>
  );
}
