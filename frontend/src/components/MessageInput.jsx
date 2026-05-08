import React, { useState, useRef } from 'react';
import { Send, FileText, Image as ImageIcon, X } from 'lucide-react';

function MessageInput({ onSendMessage, onFileUpload }) {
  const [text, setText] = useState('');
  const [uploads, setUploads] = useState([]);
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState('document'); // 'document' or 'image'

  const handleSend = () => {
    if (!text.trim() && uploads.length === 0) return;
    onSendMessage(text, uploads);
    setText('');
    setUploads([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerFileInput = (type) => {
    setUploadType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/png, image/jpeg, image/jpg' : '.pdf,.txt';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Attempt upload to backend immediately
      const success = await onFileUpload(file, uploadType);
      
      if (success) {
        // Add to local preview
        const newUpload = { file, type: uploadType };
        if (uploadType === 'image') {
          newUpload.previewUrl = URL.createObjectURL(file);
        }
        setUploads(prev => [...prev, newUpload]);
      }
      
      // Reset input
      e.target.value = '';
    }
  };

  const removeUpload = (indexToRemove) => {
    // Note: We don't remove it from the backend session in this simple version, 
    // but we remove it from UI state.
    setUploads(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="input-wrapper">
      {uploads.length > 0 && (
        <div className="upload-preview animate-fade-in">
          {uploads.map((u, index) => (
            <div key={index} className="preview-item">
              {u.type === 'image' ? (
                <img src={u.previewUrl} alt="Preview" />
              ) : (
                <FileText className="doc-icon" />
              )}
              <div className="remove-btn" onClick={() => removeUpload(index)}>
                <X size={12} />
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="input-container glass-panel">
        <textarea
          className="textarea-field"
          placeholder="Message Gemini..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        
        <div className="input-actions">
          <button className="btn-icon" onClick={() => triggerFileInput('document')} title="Upload Document (PDF/TXT)">
            <FileText size={20} color="var(--text-secondary)" />
          </button>
          <button className="btn-icon" onClick={() => triggerFileInput('image')} title="Upload Image (PNG/JPG)">
            <ImageIcon size={20} color="var(--text-secondary)" />
          </button>
          <button 
            className="btn-icon" 
            onClick={handleSend} 
            disabled={!text.trim() && uploads.length === 0}
            style={{ 
              background: (!text.trim() && uploads.length === 0) ? 'transparent' : 'var(--accent-color)',
              color: (!text.trim() && uploads.length === 0) ? 'var(--text-secondary)' : '#fff'
            }}
          >
            <Send size={20} />
          </button>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden-file-input" 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );
}

export default MessageInput;
