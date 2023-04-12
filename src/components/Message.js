import React, {useCallback, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

const Message = ({ activeChat, message, toast, socket }) => {
    const { content, role, timestamp, prompt, imageId } = message;
    const isUser = role === 'user';

    const backendUrl = process.env.REACT_APP_BACKEND_HOST || 'http://localhost:3001';

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

    // const handleDeleteMessage = () => {
    //     socket.emit('delete message', { messageId: message.id, chatId: activeChat.id });
    // };

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

    const getImgUrl = (imageId) => {
        return backendUrl + "/images/" + imageId;
    }

    return (
        <div
            className={`message ${isUser ? 'user' : 'bot'}`}
            onDoubleClick={handleDoubleClick}
        >
            {/*<button className="delete-btn" onClick={handleDeleteMessage}>*/}
            {/*    &times;*/}
            {/*</button>*/}
            {imageId !== "" ? (
                <>
                    <img
                        src={getImgUrl(imageId)}
                        alt={prompt}
                        className="generated-image"
                        onClick={() =>{
                            setIsLightboxOpen(true)}
                        }
                    />
                    <div className="image-prompt">{prompt}</div>
                    {isLightboxOpen && (
                        <Lightbox
                            open={isLightboxOpen}
                            close={() => setIsLightboxOpen(false)}
                            slides={[
                                {
                                src: content,
                                alt: prompt,
                                description: prompt,
                                downloadFilename: formatDate(timestamp)+"-"+prompt +".jpeg",
                                },
                            ]}
                            plugins={[Download, Captions]}
                            captions={{descriptionTextAlign: "center"}}
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
