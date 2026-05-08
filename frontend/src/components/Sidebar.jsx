import React from 'react';
import { PlusCircle, MessageSquare } from 'lucide-react';

function Sidebar({ chats, currentChatId, onSelectChat, onNewChat }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--accent-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>G</span>
          </div>
          Gemini Chat
        </h2>
      </div>
      
      <div className="chat-list">
        {chats.map(chat => (
          <button
            key={chat.id}
            className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <MessageSquare size={18} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1, textAlign: 'left' }}>
              {chat.title}
            </span>
          </button>
        ))}
      </div>

      <button className="btn btn-primary new-chat-btn" onClick={onNewChat}>
        <PlusCircle size={18} />
        New Chat
      </button>
    </div>
  );
}

export default Sidebar;
