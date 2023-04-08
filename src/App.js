import React, { useEffect, useState, useCallback, useMemo } from 'react';
import './App.css';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import Modal from './components/Modal';
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";
import {v4 as uuidv4} from 'uuid';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SOCKET_SERVER_ADDRESS = process.env.REACT_APP_WS_HOST || 'http://localhost:3001';

const IMAGE_REQUEST = process.env.REACT_APP_IMAGE_REQUEST || '/image';

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
  const [currentBotMessageId, setCurrentBotMessageId] = useState(null);


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

    // Notify the user when connected to the server
    newSocket.on('connect', () => {
      toast.success('Connected to the backend');
    });

    // Notify the user when disconnected from the server
    newSocket.on('disconnect', () => {
      toast.error('Disconnected from the backend');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleModelChange = (newModel) => {
    setModel(newModel);
    toast.success('Model settings saved');
  };

  const handleApiKeyChange = (newApiKey) => {
    setApiKey(newApiKey);
    toast.success('API key settings saved');
  };


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

  const isImageRequest = (message) => {
    return message.trim().startsWith(IMAGE_REQUEST);
  };


  // Set up event listeners for the bot message and error events
  useEffect(() => {
    if (socket) {
      socket.on('bot message', (data) => {
        if (data.isNewMessage) {
          const botMessage = { id: uuidv4(), role: 'bot', content: data.reply, timestamp: Date.now() };
          addMessageToChat(botMessage);
          setCurrentBotMessageId(botMessage.id);
        } else {
          setChats((prevChats) => {
            const activeChatIndex = prevChats.findIndex((chat) => chat.id === activeChatId);
            const updatedMessages = [...prevChats[activeChatIndex].messages];
            const botMessageIndex = updatedMessages.findIndex((msg) => msg.id === currentBotMessageId);

            if (updatedMessages[botMessageIndex]) {
              updatedMessages[botMessageIndex].content = data.reply;
            }

            return [
              ...prevChats.slice(0, activeChatIndex),
              {
                ...prevChats[activeChatIndex],
                messages: updatedMessages,
              },
              ...prevChats.slice(activeChatIndex + 1),
            ];
          });
        }

        if (data.isFinished) {
          setIsLoading(false);
          setCurrentBotMessageId(null);
        }
      });

      socket.on('bot image', (data) => {
        const imageMessage = {
          id: uuidv4(),
          role: 'bot',
          content: data.content,
          timestamp: data.timestamp,
          isImage: true,
        };
        addMessageToChat(imageMessage);
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
        socket.off('bot image'); // Add this line
      }
    };
  }, [socket, addMessageToChat, activeChatId, currentBotMessageId]);



  // Send a message to the bot
  const onSendMessage = (message) => {
    const userMessage = { id: uuidv4(), role: 'user', content: message, timestamp: Date.now() };
    addMessageToChat(userMessage);

    setIsLoading(true); // Set loading state to true

    if (isImageRequest(message)) {
      const prompt = message.replace('/imagine', '').trim();
      if (socket) {
        socket.emit('imagine', { prompt, apiKey });
      }
    } else {
      if (socket) {
        socket.emit('chat message', { messageInput: message, model, apiKey });
      }
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
      toast.error('Cannot delete the last chat');
      return;
    }
    const remainingChats = chats.filter((chat) => chat.id !== chatId);
    setChats(remainingChats);
    setActiveChatId(remainingChats[0].id);
    toast.info('Chat deleted');
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
    toast.info('Chat renamed');
  };

  return (
      <div className="App">
        <ToastContainer
            position="top-center"
            autoClose={1000}
            hideProgressBar
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable={false}
            pauseOnHover
            theme="dark"
        />
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
                <MessageList messages={activeChat.messages} toast={toast}/>
                <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
                {showSettings && (
                    <Modal isOpen={showSettings} onClose={toggleSettingsModal}>
                      <Settings apiKey={apiKey} model={model} onApiKeyChange={handleApiKeyChange} onModelChange={handleModelChange} />
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
