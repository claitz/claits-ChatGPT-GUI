import React, { useEffect, useState, useCallback, useMemo } from 'react';
import './App.css';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import Modal from './components/Modal';
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";
import {v4 as uuidv4} from 'uuid';
import io from 'socket.io-client';

const SOCKET_SERVER_ADDRESS = process.env.REACT_APP_SOCKET_SERVER_ADDRESS || 'http://localhost:3001';

const STORAGE_KEYS = {
  chats: 'chats',
  model: 'model',
  apiKey: 'apiKey',
  chatCounter: 'chatCounter',
};

const App = () => {

  const [chats, setChats] = useState(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.chats)) || [
        { id: uuidv4(), title: 'Chat 1', messages: [] },
      ],
  );

  const [chatCounter, setChatCounter] = useState(
      parseInt(localStorage.getItem(STORAGE_KEYS.chatCounter)) || 1,
  );

  const [socket, setSocket] = useState(null);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [model, setModel] = useState(localStorage.getItem('model') || 'gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [showSettings, setShowSettings] = useState(false);
  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId), [chats, activeChatId]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.model, model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.chatCounter, chatCounter);
  }, [chatCounter]);

  // Set the active chat to the first chat if the active chat is deleted
  useEffect(() => {
    const currentActiveChat = chats.find((chat) => chat.id === activeChatId);
    if (!currentActiveChat) {
      setActiveChatId(chats[0]?.id || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  // Set up the socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_ADDRESS);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Add a new message to the active chat
  const addMessageToChat = useCallback((message) => {
    setChats((prevChats) => {
      const activeChatIndex = prevChats.findIndex((chat) => chat.id === activeChatId);
      const updatedChats = [...prevChats];
      updatedChats[activeChatIndex] = {
        ...updatedChats[activeChatIndex],
        messages: [...updatedChats[activeChatIndex].messages, message],
      };
      return updatedChats;
    });
  }, [activeChatId]);


  // Set up event listeners for the bot message and error events
  useEffect(() => {
    if (socket) {
      socket.on('bot message', (data) => {
        const botMessage = { id: uuidv4(), role: 'bot', content: data.reply, timestamp: Date.now() };
        addMessageToChat(botMessage);
        setIsLoading(false);
      });

      socket.on('error', (data) => {
        const errorMessage = { id: uuidv4(), role: 'bot', content: data.error, timestamp: Date.now() };
        addMessageToChat(errorMessage);
        setIsLoading(false);
      });
    }

    return () => {
      if (socket) {
        socket.off('bot message');
        socket.off('error');
      }
    };
  }, [socket, addMessageToChat]);

  // Send a message to the bot
  const onSendMessage = (message) => {
    const userMessage = { id: uuidv4(), role: 'user', content: message, timestamp: Date.now() };
    addMessageToChat(userMessage);

    setIsLoading(true); // Set loading state to true

    if (socket) {
      socket.emit('chat message', { message, model, apiKey });
    }
  };

  // Toggle the settings modal
  const toggleSettingsModal = () => {
    setShowSettings(!showSettings);
  };

  // Set the active chat
  const onChatSelect = (chatId) => {
    setActiveChatId(chatId);
  };

  // Create a new chat
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

  // Delete a chat
  const deleteChat = (chatId) => {
    if (chats.length <= 1) {
      return;
    }
    const remainingChats = chats.filter((chat) => chat.id !== chatId);
    setChats(remainingChats);
    setActiveChatId(remainingChats[0].id);
  };

  // Rename a chat
  const renameChat = (chatId, newTitle) => {
    setChats((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === chatId) {
          return {...chat, title: newTitle};
        }
        return chat;
      });
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
                <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
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
