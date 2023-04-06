import React from 'react';
import Message from './Message';

const MessageList = ({ messages }) => (
    <div className="message-list">
        {messages.map((message, index) => (
            <Message key={index} message={message.content} isUser={message.role === 'user'} />
        ))}
    </div>
);

export default MessageList;
