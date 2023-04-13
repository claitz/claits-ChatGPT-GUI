import React, { useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import Modal from './components/Modal';
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";

const App = () => {

  // Socket
  const [socket, setSocket] = useState(null);

  // Chats
  const [chats, setChats] = useState(null);
  const [activeChatId, setActiveChatId] = useState(localStorage.getItem('activeChatId') || null);
  const activeChat = useMemo(() => chats?.find((chat) => chat.id === activeChatId), [chats, activeChatId]);

  // UI
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Settings
  const [settings, setSettings] = useState({
    model: localStorage.getItem('model') || 'gpt-3.5-turbo',
    apiKey: localStorage.getItem('apiKey') || '',
    backendUrl: localStorage.getItem('backendUrl') || ':3001',
    imageCommand: localStorage.getItem('imageCommand') || '/image',
    timeoutInterval: localStorage.getItem('timeoutInterval') || 5000,
  });

  // Local storage
  useEffect(() => {
    localStorage.setItem('model', settings.model);
  }, [settings.model]);

  useEffect(() => {
    localStorage.setItem('apiKey', settings.apiKey);
  }, [settings.apiKey]);

  useEffect(() => {
    localStorage.setItem('backendUrl', settings.backendUrl);
  }, [settings.backendUrl]);

  useEffect(() => {
    localStorage.setItem('imageCommand', settings.imageCommand);
    }, [settings.imageCommand]);

  useEffect(() => {
    localStorage.setItem('timeoutInterval', settings.timeoutInterval);
  }, [settings.timeoutInterval]);

  useEffect(() => {
    localStorage.setItem('activeChatId', activeChatId);
  }, [activeChatId]);

  // Set up the socket connection
  useEffect(() => {
    const newSocket = io(settings.backendUrl);
    setSocket(newSocket);

    // Notify the user when connected to the server
    newSocket.on('connect', () => {
      sendToast('success', 'Connected to the backend')
      setIsConnected(true);
    });

    // Notify the user when disconnected from the server
    newSocket.on('disconnect', () => {
        sendToast('error', 'Disconnected from the backend')
        setIsConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, [settings.backendUrl]);

  // Notify the user if the connection to the backend is lost
  useEffect(() => {
    let interval;

    if (!isConnected) {
      interval = setInterval(() => {
        sendToast('warning', 'No connection to the backend')
      }, settings.timeoutInterval);
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [socket, isConnected, settings.timeoutInterval]);

  const sendToast = (type, message) => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else if (type === 'info') {
      toast.info(message);
    } else if (type === 'warning') {
      toast.warning(message);
    }
  }

  // Is this a message requesting an image?
  const isImageRequest = (message) => {
    return message.trim().startsWith(settings.imageCommand);
  };

  // Send a message to the bot
  const onSendMessage = (message) => {
    setIsLoading(true); // Set loading state to true

    if (isImageRequest(message)) {
      if (socket) {
        socket.emit('image request', {chatId: activeChatId, message, apiKey: settings.apiKey, imageCommand: settings.imageCommand});
      }
    } else {
      if (socket) {
        socket.emit('chat message', {chatId: activeChatId, messageInput: message, apiKey: settings.apiKey, imageCommand: settings.imageCommand});
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
    if (socket) {
      socket.emit('create chat');
    }
  };

// Delete a chat
  const deleteChat = (chatId) => {
    socket.emit('delete chat', chatId);
  };

  // Rename a chat
  const renameChat = (chatId, newTitle) => {
    socket.emit('rename chat', { chatId, newTitle });
  };

  // Set up event listeners for the bot message and error events
  useEffect(() => {
    if (socket) {
      socket.on('chats updated', (chats, chatIndex = 0) => {
        setChats(chats);

        if (chatIndex !== -1) {
          setActiveChatId(chats[chatIndex].id);
        } else {
          if (chats.length > 0 && !activeChatId) {
            setActiveChatId(chats[chats.length - 1].id);
          }
        }
      });

      socket.on('chat created', (newChat) => {
        sendToast('success', 'Chat created');
      });

      socket.on('bot image', (data) => {
        setIsLoading(false);
      });

      // Used to display error messages
      socket.on('error', (data) => {
        sendToast('error', data.error)
        setIsLoading(false);
      });

      // Used to display info messages
      socket.on('info', (data) => {
        sendToast('info', data.info)
      });

      // Used to re-enable the chat input after the bot has finished
      socket.on('bot finished' , () => {
        setIsLoading(false);
      });

    }

    return () => {
      if (socket) {
        socket.off('info');
        socket.off('error');

        socket.off('chats created');
        socket.off('chats updated');

        socket.off('bot message');
        socket.off('bot image');
      }
    };
  }, [socket, setActiveChatId, chats, activeChatId]);


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
                <div className="chatbox-header">{activeChat.title}</div>
                <MessageList activeChat={activeChat} toast={toast} backendUrl= {settings.backendUrl} socket={socket}/>
                <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />

              </>
          ) : (
              <div className="loading-container">Create a new chat to begin.</div>
          )}
          {showSettings && (
              <Modal isOpen={showSettings} onClose={toggleSettingsModal}>
                <Settings settings={settings} onSettingChange={setSettings}/>
              </Modal>
          )}
        </div>
      </div>
  );
};

export default App;
