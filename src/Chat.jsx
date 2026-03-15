import { useEffect, useRef } from 'react';

export default function Chat({ messages, onCommand }) {
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    const val = inputRef.current.value.trim();
    if (!val) return;
    inputRef.current.value = '';
    onCommand(val);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">채팅 / 명령어</div>
      <div className="chat-messages" ref={listRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-${msg.type}`}>{msg.text}</div>
        ))}
      </div>
      <form className="chat-form" onSubmit={submit}>
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          placeholder="!도움말"
          autoComplete="off"
          spellCheck="false"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(e); } }}
        />
        <button type="submit" className="chat-send">전송</button>
      </form>
    </div>
  );
}
