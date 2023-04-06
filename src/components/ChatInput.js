import React, { useState } from 'react';

const ChatInput = ({ onSendMessage, toggleSettingsModal }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        onSendMessage(message.trim());
        setMessage('');
    };

    return (
        <div className="chat-input">
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ width: '100%' }}
                />
                <div>
                    <button type="submit">Send</button>
                    <button className="settings-button" onClick={toggleSettingsModal}>
                        Config
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInput;
