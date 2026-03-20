import Chat from '../Chat';

export default function ChatBox({ messages, onCommand }) {
  return <Chat messages={messages} onCommand={onCommand} />;
}
