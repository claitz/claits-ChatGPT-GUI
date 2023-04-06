import React from 'react';

const Message = ({ message, isUser, timestamp }) => (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
        <p>{message}</p>
        <span className="message-timestamp">
            {new Date(timestamp).toLocaleTimeString([], {day: '2-digit', month : 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>    </div>
);

export default Message;
