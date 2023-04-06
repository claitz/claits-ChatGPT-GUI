import React from 'react';

const Message = ({ message, isUser }) => (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
        <p>{message}</p>
    </div>
);

export default Message;
