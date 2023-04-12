import React, { useEffect, useRef, useMemo } from 'react';
import Message from './Message';

const MessageList = ({ activeChat, toast, socket }) => {
    const messageListRef = useRef(null);
    const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="message-list" ref={messageListRef}>
            {messages.map((message, index) => (
                <Message key={index} activeChat={activeChat} message={message} isUser={message.role === 'user'} timestamp={message.timestamp} toast={toast} socket={socket} />
            ))}
        </div>
    );
};

export default MessageList;
