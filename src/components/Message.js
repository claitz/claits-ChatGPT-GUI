import React, { useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

const Message = ({ message, toast }) => {
    const { content, role, timestamp, isImage } = message;
    const isUser = role === 'user';

    const handleDoubleClick = useCallback((e) => {
        const codeBlock = e.target.closest('pre');
        if (codeBlock) {
            const code = codeBlock.textContent;
            navigator.clipboard.writeText(code).then(
                () => {
                    toast.info('Copied code to clipboard');
                },
                (err) => {
                    toast.error('Failed to copy code to clipboard');
                }
            );
        }
    }, [toast]);

    return (
        <div
            className={`message ${isUser ? 'user' : 'bot'}`}
            onDoubleClick={handleDoubleClick}
        >
            {isImage ? (
                <img src={content} alt="Generated content" className="generated-image" />
            ) : (
                <ReactMarkdown>{content}</ReactMarkdown>
            )}
            <span className="message-timestamp">
                {new Date(timestamp).toLocaleTimeString([], {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                })}
            </span>
        </div>
    );
};

export default Message;
