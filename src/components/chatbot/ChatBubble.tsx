// ChatBubble.tsx
import React from 'react';
import './ChatBubble.css';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, content }) => {
  return (
    <div className={`chat-bubble ${role}`}>
      <div className="avatar">{role === 'user' ? '👤' : '🤖'}</div>
      <div className="message">{content}</div>
    </div>
  );
};

export default ChatBubble;
