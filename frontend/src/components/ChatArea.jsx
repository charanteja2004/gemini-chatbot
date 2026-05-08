import React, { useEffect, useRef } from 'react';

function ChatArea({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-area">
      {messages.length === 0 ? (
        <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>✨</span>
          </div>
          <h2>How can I help you today?</h2>
          <p style={{ marginTop: '8px' }}>Upload a document, an image, or just say hi.</p>
        </div>
      ) : (
        messages.map((msg, index) => (
          <div key={msg.id || index} className={`message-container ${msg.role} animate-fade-in`}>
            <div className="message-bubble">
              {msg.uploads && msg.uploads.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {msg.uploads.map((upload, i) => (
                    <div key={i} style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12px' }}>
                      📎 {upload.file.name}
                    </div>
                  ))}
                </div>
              )}
              {msg.loading ? (
                <div className="loader">
                  <div className="loader-dot"></div>
                  <div className="loader-dot"></div>
                  <div className="loader-dot"></div>
                </div>
              ) : (
                <div className="message-content">{msg.content}</div>
              )}
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatArea;
