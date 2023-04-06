import React from 'react';
import ReactMarkdown from 'react-markdown';


const Message = ({ message, isUser, timestamp }) => (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
        <ReactMarkdown>{message}</ReactMarkdown>
        <span className="message-timestamp">
            {new Date(timestamp).toLocaleTimeString([], {day: '2-digit', month : 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>    </div>
);

export default Message;
