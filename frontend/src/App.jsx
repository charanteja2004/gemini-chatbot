import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import MessageInput from './components/MessageInput';
import './App.css';

const generateId = () => Math.random().toString(36).substring(2, 15);

const API_BASE = 'http://localhost:8000/api';

function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  useEffect(() => {
    if (chats.length === 0) {
      handleNewChat();
    }
  }, []);

  const handleNewChat = () => {
    const newChatId = generateId();
    setChats(prev => [{ id: newChatId, title: 'New Conversation', messages: [] }, ...prev]);
    setCurrentChatId(newChatId);
    
    axios.post(`${API_BASE}/session/${newChatId}/reset`).catch(console.error);
  };

  const currentChat = chats.find(c => c.id === currentChatId) || { messages: [] };

  const updateChatMessages = (chatId, newMessages) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        // Update title based on first message if needed
        let title = chat.title;
        if (title === 'New Conversation' && newMessages.length > 0 && newMessages[0].role === 'user') {
            title = newMessages[0].content.substring(0, 30) || 'Chat';
        }
        return { ...chat, title, messages: newMessages };
      }
      return chat;
    }));
  };

  const handleSendMessage = async (text, uploads) => {
    // If no text but has uploads, use a placeholder
    const msgText = text.trim() || (uploads.length > 0 ? 'Sent a file' : '');
    if (!msgText) return;
    
    const chatId = currentChatId;
    const userMsg = { id: generateId(), role: 'user', content: text, uploads: [...uploads] };
    
    const updatedMessages = [...currentChat.messages, userMsg];
    updateChatMessages(chatId, updatedMessages);
    
    const loaderId = generateId();
    updateChatMessages(chatId, [...updatedMessages, { id: loaderId, role: 'bot', loading: true }]);
    
    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        chat_id: chatId,
        message: text
      });
      
      const botMsg = { id: generateId(), role: 'bot', content: response.data.response };
      updateChatMessages(chatId, [...updatedMessages, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg = { id: generateId(), role: 'bot', content: 'Error: Failed to fetch response from server.' };
      updateChatMessages(chatId, [...updatedMessages, errorMsg]);
    }
  };

  const handleFileUpload = async (file, type) => {
    const formData = new FormData();
    formData.append('chat_id', currentChatId);
    formData.append('file', file);
    
    const endpoint = type === 'image' ? '/upload/image' : '/upload/document';
    
    try {
      await axios.post(`${API_BASE}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return true;
    } catch (error) {
      console.error(error);
      alert('Failed to upload file');
      return false;
    }
  };

  return (
    <div className="app-container animate-fade-in">
      <Sidebar 
        chats={chats} 
        currentChatId={currentChatId} 
        onSelectChat={setCurrentChatId} 
        onNewChat={handleNewChat} 
      />
      <div className="main-content">
        <ChatArea messages={currentChat.messages} />
        <MessageInput onSendMessage={handleSendMessage} onFileUpload={handleFileUpload} />
      </div>
    </div>
  );
}

export default App;
