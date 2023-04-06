import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const ChatInput = ({ onSendMessage, isLoading, toggleSettingsModal }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        onSendMessage(message.trim());
        setMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            setMessage((prevMessage) => prevMessage + '\n');
        } else if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className="chat-input">
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <textarea
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{ width: '100%' }}
                />
                <div>
                    <button onClick={handleSubmit} disabled={isLoading || !message.trim()} className="send-button">
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInput;
