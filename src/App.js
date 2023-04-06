import React, { useState, useEffect } from 'react';
import './App.css';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import Modal from './components/Modal';
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const App = () => {
  const [chats, setChats] = useState(
      JSON.parse(localStorage.getItem('chats')) || [
        { id: uuidv4(), title: 'Chat 1', messages: [] },
      ]
  );

  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [model, setModel] = useState(localStorage.getItem('model') || 'gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [showSettings, setShowSettings] = useState(false);
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const [chatCounter, setChatCounter] = useState(parseInt(localStorage.getItem('chatCounter')) || 1);
  const [isLoading, setIsLoading] = useState(false);



  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('apiKey', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('chatCounter', chatCounter);
  }, [chatCounter]);


  useEffect(() => {
    const currentActiveChat = chats.find((chat) => chat.id === activeChatId);
    if (!currentActiveChat) {
      setActiveChatId(chats[0]?.id || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  const onSendMessage = async (message) => {
    const activeChatIndex = chats.findIndex((chat) => chat.id === activeChatId);
    const userMessage = { role: 'user', content: message, timestamp: Date.now() };

    setChats((prevChats) => {
      const updatedChats = [...prevChats];
      updatedChats[activeChatIndex].messages = [
        ...updatedChats[activeChatIndex].messages,
        userMessage,
      ];
      return updatedChats;
    });

    setIsLoading(true); // Set loading state to true

    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        message,
        model,
        apiKey,
      });

      const botMessage = { role: 'bot', content: response.data.reply, timestamp: Date.now() };

      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        const existingBotMessageIndex = updatedChats[activeChatIndex].messages.findIndex(
            (msg) => msg.role === 'bot' && msg.content === botMessage.content
        );

        if (existingBotMessageIndex === -1) {
          updatedChats[activeChatIndex].messages = [
            ...updatedChats[activeChatIndex].messages,
            botMessage,
          ];
        }

        return updatedChats;
      });
      setIsLoading(false); // Set loading state to false after receiving response
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = { role: 'bot', content: 'An unexpected error occurred.', timestamp: Date.now() };

      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        updatedChats[activeChatIndex].messages = [
          ...updatedChats[activeChatIndex].messages,
          errorMessage,
        ];
        return updatedChats;
      });
      setIsLoading(false); // Set loading state to false after receiving error
    }
  };

  const toggleSettingsModal = () => {
    setShowSettings(!showSettings);
  };

  const onChatSelect = (chatId) => {
    setActiveChatId(chatId);
  };

  const createChat = () => {
    const newChat = {
      id: uuidv4(),
      title: `Chat ${chatCounter}`,
      messages: [],
    };
    setChats([...chats, newChat]);
    setActiveChatId(newChat.id);
    setChatCounter(chatCounter + 1);
  };

  const deleteChat = (chatId) => {
    if (chats.length <= 1) {
      return;
    }
    const remainingChats = chats.filter((chat) => chat.id !== chatId);
    setChats(remainingChats);
    setActiveChatId(remainingChats[0].id);
  };


  const renameChat = (chatId, newTitle) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, title: newTitle };
        }
        return chat;
      });
      return updatedChats;
    });
  };


  return (
      <div className="App">
        <Sidebar
            chats={chats}
            activeChat={activeChat}
            onChatSelect={onChatSelect}
            onCreateChat={createChat}
            onDeleteChat={deleteChat}
            onRenameChat={renameChat}
            toggleSettingsModal={toggleSettingsModal}
        />
        <div className="chatbox">
          {activeChat ? (
              <>
                <MessageList messages={activeChat.messages} />
                <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} toggleSettingsModal={toggleSettingsModal} />
                {showSettings && (
                    <Modal isOpen={showSettings} onClose={toggleSettingsModal}>
                      <Settings apiKey={apiKey} model={model} onApiKeyChange={setApiKey} onModelChange={setModel} />
                    </Modal>
                )}
              </>
          ) : (
              <div>Loading...</div>
          )}
        </div>
      </div>
  );
};

export default App;
