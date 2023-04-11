import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSquarePlus, faGear, faPenToSquare } from '@fortawesome/free-solid-svg-icons';


const Sidebar = ({ chats = [], activeChat, onChatSelect, onCreateChat, onDeleteChat, onRenameChat, toggleSettingsModal}) => {

    const [editingChatId, setEditingChatId] = React.useState(null);
    const handleEditChatTitle = (event, chatId) => {
        if (event.key === 'Enter') {
            const newTitle = event.target.value.trim();
            if (newTitle) {
                onRenameChat(chatId, newTitle);
            }
            setEditingChatId(null);
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-content">
                <div className="sidebar-header">
                    <button className="new-chat-button" onClick={onCreateChat}>
                        <FontAwesomeIcon icon={faSquarePlus} />
                    </button>
                </div>
                <ul className="sidebar-chat-list">
                    {(chats || []).map((chat)  => (
                        <li
                            key={chat.id}
                            className={activeChat === chat ? 'selected' : ''}
                            onClick={() => onChatSelect(chat.id)}
                        >
                            {editingChatId === chat.id ? (
                                <input
                                    type="text"
                                    defaultValue={chat.title}
                                    onKeyDown={(event) => handleEditChatTitle(event, chat.id)}
                                    onBlur={() => setEditingChatId(null)}
                                    autoFocus
                                    className="edit-chat-title"
                                />
                            ) : (
                                <div className="chat-title">
                                    {chat.title}
                                    <div className="sidebar-button-container">
                                        <button
                                            className="delete-chat-button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setEditingChatId(chat.id);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faPenToSquare} />
                                        </button>
                                        <button
                                            className="rename-chat-button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onDeleteChat(chat.id);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="sidebar-footer">
                    <button className="settings-button" onClick={toggleSettingsModal}>
                        <FontAwesomeIcon icon={faGear} />
                    </button>
                </div>
        </div>
    );
};

export default Sidebar;
