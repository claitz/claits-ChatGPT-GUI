import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";

const Message = ({ message, toast }) => {
    const { content, role, timestamp, isImage } = message;
    const isUser = role === 'user';

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    function formatDate(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }

    const handleDoubleClick = useCallback(
        (e) => {
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
        },
        [toast]
    );

    return (
        <div
            className={`message ${isUser ? 'user' : 'bot'}`}
            onDoubleClick={handleDoubleClick}
        >
            {isImage ? (
                <>
                    <img
                        src={content}
                        alt="Generated content"
                        className="generated-image"
                        onClick={() =>{
                            setIsLightboxOpen(true)}
                        }
                    />
                    {isLightboxOpen && (
                        <Lightbox
                            open={isLightboxOpen}
                            close={() => setIsLightboxOpen(false)}
                            slides={[
                                {
                                src: content,
                                alt: "Content generated at " + formatDate(timestamp),
                                downloadFilename: "generated-content-" + formatDate(timestamp),
                                },
                            ]}
                            plugins={[Download]}
                        />
                    )}
                </>
            ) : (
                <ReactMarkdown>{content}</ReactMarkdown>
            )}
            <span className="message-timestamp">
        {formatDate(timestamp)}
      </span>
        </div>
    );
};

export default Message;
