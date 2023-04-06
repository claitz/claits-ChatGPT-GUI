import React from 'react';

const Sidebar = ({ chats, activeChat, onChatSelect, onCreateChat, onDeleteChat }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Chats</h2>
                <button className="new-chat-button" onClick={onCreateChat}>
                    New Chat
                </button>
            </div>
            <ul className="sidebar-chat-list">
                {chats.map((chat) => (
                    <li
                        key={chat.title}
                        className={activeChat === chat ? 'selected' : ''}
                        onClick={() => onChatSelect(chat)}
                    >
                        <div className="chat-title">
                            {chat.title}
                            <button className="delete-chat-button" onClick={() => onDeleteChat(chat)}>
                                X
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
