import React, { useEffect, useRef } from 'react';
import Message from './Message';

const MessageList = ({ messages }) => {
    const messageListRef = useRef(null);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="message-list" ref={messageListRef}>
            {messages.map((message, index) => (
                <Message key={index} message={message.content} isUser={message.role === 'user'} timestamp={message.timestamp} />
            ))}
        </div>
    );
};

export default MessageList;
