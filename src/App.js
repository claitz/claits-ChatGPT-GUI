import React, { useState, useEffect } from 'react';
import './App.css';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import Settings from './components/Settings';
import axios from 'axios';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [model, setModel] = useState(localStorage.getItem('model') || 'gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');

  useEffect(() => {
    localStorage.setItem('model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('apiKey', apiKey);
  }, [apiKey]);

  const onSendMessage = async (message) => {
    setMessages([...messages, { role: 'user', content: message }]);
    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        message,
        model,
        apiKey,
      });

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'bot', content: response.data.reply },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      const serverErrorMessage = error.response?.data?.error?.message || 'An unexpected error occurred.';
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'bot', content: serverErrorMessage },
      ]);
    }
  };

  return (
      <div className="App">
        <Settings model={model} apiKey={apiKey} onModelChange={setModel} onApiKeyChange={setApiKey} />
        <MessageList messages={messages} />
        <ChatInput onSendMessage={onSendMessage} />
      </div>
  );
};

export default App;
