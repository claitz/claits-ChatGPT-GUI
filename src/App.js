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


const backendUrl = process.env.REACT_APP_BACKEND_HOST;
const imageCommand = process.env.REACT_APP_IMAGE_REQUEST;

const timeoutInterval = process.env.REACT_APP_TIMEOUT_INTERVAL;

const App = () => {

  const [chats, setChats] = useState(null);
  const [socket, setSocket] = useState(null);
  const [model, setModel] = useState(localStorage.getItem('model') || 'gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);


  const [activeChatId, setActiveChatId] = useState(localStorage.getItem('activeChatId') || null);
  const activeChat = useMemo(() => chats?.find((chat) => chat.id === activeChatId), [chats, activeChatId]);

  useEffect(() => {
    localStorage.setItem('model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('apiKey', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('activeChatId', activeChatId);
  }, [activeChatId]);

  // Set up the socket connection
  useEffect(() => {
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    // Notify the user when connected to the server
    newSocket.on('connect', () => {
      toast.success('Connected to the backend');
      setIsConnected(true);
    });

    // Notify the user when disconnected from the server
    newSocket.on('disconnect', () => {
      toast.error('Disconnected from the backend');
        setIsConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Notify the user if the connection to the backend is lost
  useEffect(() => {
    let interval;

    if (!isConnected) {
      interval = setInterval(() => {
        toast.warning("No connection to the backend");
        console.log("backendUrl: " +backendUrl);
        console.log("timeoutInterval: " +timeoutInterval);
      }, timeoutInterval);
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [socket, isConnected]);


  // Save the model to local storage TODO: move this to server side persistence
  const handleModelChange = (newModel) => {
    setModel(newModel);
    toast.success('Model settings saved');
  };

  // Save the API key to local storage TODO: move this to server side persistence
  const handleApiKeyChange = (newApiKey) => {
    setApiKey(newApiKey);
    toast.success('API key settings saved');
  };

  // Is this a message requesting an image?
  const isImageRequest = (message) => {
    return message.trim().startsWith(imageCommand);
  };

  // Send a message to the bot
  const onSendMessage = (message) => {
    setIsLoading(true); // Set loading state to true

    if (isImageRequest(message)) {
      if (socket) {
        socket.emit('image request', {chatId: activeChatId, message, apiKey, imageCommand});
      }
    } else {
      if (socket) {
        socket.emit('chat message', {chatId: activeChatId, messageInput: message, model, apiKey });
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
        toast.success('Chat created');
      });

      socket.on('bot image', (data) => {
        setIsLoading(false);
      });

      // Used to display error messages
      socket.on('error', (data) => {
        toast.error(data.error);
        setIsLoading(false);
      });

      // Used to display info messages
      socket.on('info', (data) => {
        toast.info(data.info);
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
                <MessageList activeChat={activeChat} toast={toast} backendUrl= {backendUrl} socket={socket}/>
                <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
                {showSettings && (
                    <Modal isOpen={showSettings} onClose={toggleSettingsModal}>
                      <Settings apiKey={apiKey} model={model} onApiKeyChange={handleApiKeyChange} onModelChange={handleModelChange} />
                    </Modal>
                )}
              </>
          ) : (
              <div className="loading-container">Create a new chat to begin.</div>
          )}
        </div>
      </div>
  );
};

export default App;
