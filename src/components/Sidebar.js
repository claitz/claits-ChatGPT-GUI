const Sidebar = ({ chats, activeChat, onChatSelect, onCreateChat, onDeleteChat }) => {
    return (
        <div className="sidebar">
            <h2>Chats</h2>
            <ul>
                {chats.map((chat) => (
                    <li key={chat.title} className={activeChat === chat ? 'active' : ''}>
                        <button onClick={() => onChatSelect(chat)}>{chat.title}</button>
                        <button className="close" onClick={() => onDeleteChat(chat)}>X</button>
                    </li>
                ))}
                <li>
                    <button onClick={onCreateChat}>New Chat</button>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;