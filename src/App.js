import React, { useState, useEffect } from 'react';
import './App.css';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import Modal from './components/Modal';
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";
import axios from 'axios';

const App = () => {
  const [chats, setChats] = useState(
      JSON.parse(localStorage.getItem('chats')) || [{ title: 'New Chat', messages: [] }]
  );
  const [activeChat, setActiveChat] = useState(chats[0]);
  const [model, setModel] = useState(localStorage.getItem('model') || 'gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('apiKey', apiKey);
  }, [apiKey]);

  const onSendMessage = async (message) => {
    setActiveChat((prevChat) => {
      const newMessages = [...prevChat.messages, { role: 'user', content: message }];
      return { ...prevChat, messages: newMessages };
    });

    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        message,
        model,
        apiKey,
      });

      setActiveChat((prevChat) => {
        const newMessages = [
          ...prevChat.messages,
          { role: 'bot', content: response.data.reply },
        ];
        return { ...prevChat, messages: newMessages };
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const serverErrorMessage =
          error.response?.data?.error?.message || 'An unexpected error occurred.';
      setActiveChat((prevChat) => {
        const newMessages = [
          ...prevChat.messages,
          { role: 'bot', content: serverErrorMessage },
        ];
        return { ...prevChat, messages: newMessages };
      });
    }
  };

  const toggleSettingsModal = () => {
    setShowSettings(!showSettings);
  };

  const onChatSelect = (chat) => {
    setActiveChat(chat);
  };

  const createChat = () => {
    const newChat = { title: `Chat ${chats.length + 1}`, messages: [] };
    setChats([...chats, newChat]);
    setActiveChat(newChat);
  };

  const deleteChat = (chatId) => {
    const remainingChats = chats.filter((chat) => chat !== chatId);
    setChats(remainingChats);
    setActiveChat(remainingChats[0]);
  };

  return (
      <div className="App">
        <Sidebar chats={chats} activeChat={activeChat} onChatSelect={onChatSelect} onCreateChat={createChat} onDeleteChat={deleteChat} />
        <div className="chatbox">
          <MessageList messages={activeChat.messages} />
          <ChatInput onSendMessage={onSendMessage} toggleSettingsModal={toggleSettingsModal} />
          {showSettings && (
              <Modal isOpen={showSettings} onClose={toggleSettingsModal}>
                <Settings apiKey={apiKey} model={model} onApiKeyChange={setApiKey} onModelChange={setModel} />
              </Modal>
          )}
        </div>
      </div>
  );
};

export default App;
