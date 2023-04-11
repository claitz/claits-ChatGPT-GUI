import {Server as socketIO} from 'socket.io';
import {fetchStreamedChatContent} from 'streamed-chatgpt-api';
import axios from 'axios';
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.REACT_APP_WS_PORT || 3001;
const backendUrl = process.env.REACT_APP_BACKEND_HOST || `http://localhost:${PORT}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesFolderPath = path.join(__dirname, 'images');

const chats = [
    { id: uuidv4(), title: 'Chat 1', messages: [] },
];

// Create images folder if it doesn't exist
if (!fs.existsSync(imagesFolderPath)) {
    fs.mkdirSync(imagesFolderPath);
}

// Middleware to serve static files
const app = express();
app.use('/images', express.static(imagesFolderPath)); // Serve images folder

// Create express server
const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// Create socket server
const io = new socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

function sanitizeFilename(prompt) {
    return prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

const addMessageToChat = (chats, chatId, messageId, role, content, isImage, socket) => {
    const chatIndex = chats.findIndex((chat) => chat.id === chatId);

    const message = {
        id: messageId,
        role: role,
        content: content,
        timestamp: Date.now(),
        isImage: isImage,
    };

    if (chatIndex !== -1) {
        chats[chatIndex].messages.push(message);
        socket.emit('chats updated', chats, chatIndex);
    }
};

const updateBotMessageInChat = (chats, chatId, messageId, content, isImage, socket) => {
    const chatIndex = chats.findIndex((chat) => chat.id === chatId);
    let messageIndex = chats[chatIndex].messages.findIndex((msg) => msg.id === messageId);

    if (chatIndex !== -1) {
        if (messageIndex === -1) {
            addMessageToChat(chats, chatId, messageId, 'bot', content, isImage, socket);
        }
        messageIndex = chats[chatIndex].messages.findIndex((msg) => msg.id === messageId);

        if (messageIndex !== -1) {
            chats[chatIndex].messages[messageIndex].content = content;
            socket.emit('chats updated', chats, chatIndex);
        }
    }
}

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.emit('chats updated', chats);

    socket.on('create chat', () => {
        const newChat = {
            id: uuidv4(),
            title: `Chat ${chats.length + 1}`,
            messages: [],
        };
        chats.push(newChat);
        socket.emit('chats updated', chats, chats.length - 1);
    });

    socket.on('delete chat', (chatId) => {
        if (chats.length <= 1) {
            socket.emit('error', { error: 'Cannot delete the last chat' });
            return;
        }

        const remainingChats = chats.filter((chat) => chat.id !== chatId);
        chats.length = 0;
        chats.push(...remainingChats);

        socket.emit('chats updated', chats);
        socket.emit('info', { info: 'Chat deleted'});
    });

    socket.on('rename chat', ({ chatId, newTitle }) => {
        const chat = chats.find((chat) => chat.id === chatId);
        if (chat) {
            chat.title = newTitle;
            // socket.emit('chat renamed', { chatId, newTitle });
            socket.emit('chats updated', chats, chats.findIndex((chat) => chat.id === chatId));
            socket.emit('info', { info: 'Chat renamed'});
        } else {
            socket.emit('error', { error: 'Chat not found' });
        }
    });

    socket.on('chat message', async (data) => {
        const {
            chatId,
            apiKey,
            messageInput,
            apiUrl,
            model,
            temperature,
            topP,
            n,
            stop,
            maxTokens,
            presencePenalty,
            frequencyPenalty,
            logitBias,
            user,
            retryCount,
            fetchTimeout,
            readTimeout,
            retryInterval,
            totalTime,
        } = data;

        if (!apiKey) {
            socket.emit('error', {error: 'No API key provided.'});
            console.log('No API key provided.')
            return;
        }
        let userMessageId = uuidv4();
        addMessageToChat(chats, chatId,userMessageId, 'user', messageInput, false, socket);

        let botMessageId = uuidv4();
        let currentBotMessage = '';

        try {
            fetchStreamedChatContent(
                {
                    apiKey,
                    messageInput,
                    apiUrl,
                    model,
                    temperature,
                    topP,
                    n,
                    stop,
                    maxTokens,
                    presencePenalty,
                    frequencyPenalty,
                    logitBias,
                    user,
                    retryCount,
                    fetchTimeout,
                    readTimeout,
                    retryInterval,
                    totalTime,
                },
                (content) => {
                    // onResponse
                    currentBotMessage += content;
                    updateBotMessageInChat(chats, chatId, botMessageId, currentBotMessage, false, socket);

                },
                () => {
                    // onFinish
                    updateBotMessageInChat(chats, chatId, botMessageId, currentBotMessage, false, socket);
                    socket.emit('bot finished')
                },
                (error) => {
                    // onError
                    socket.emit('error', {error: error.message});
                    console.log(error)
                }
            );
        } catch (error) {
            socket.emit('error', {error: error.message});
            console.log(error)
        }
    });

    socket.on('image request', async (data) => {
            const {chatId, apiKey, prompt} = data;

            if (!apiKey) {
                socket.emit('error', {error: 'No API key provided.'});
                console.log('No API key provided.')
                return;
            }
            let userMessageId = uuidv4();

            addMessageToChat(chats, chatId, userMessageId, 'user', prompt,false, socket);

            try {
                const response = await axios.post(
                    'https://api.openai.com/v1/images/generations',
                    {
                        prompt,
                        n: 1,
                        size: '1024x1024',
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                const imageUrl = response.data.data[0].url || 'https://i.imgur.com/xFhXMD7.jpeg'; // Test image
                const sanitizedPrompt = sanitizeFilename(prompt);

                const timestamp = Date.now();
                const imageFileName = `${timestamp}-${sanitizedPrompt}.jpeg`;

                // Download and save the image locally
                axios
                    .get(imageUrl, {responseType: 'arraybuffer'})
                    .then((response) => {
                        const localImagePath = path.join(imagesFolderPath, imageFileName);
                        fs.writeFileSync(localImagePath, Buffer.from(response.data, 'binary'));

                        const localImageUrl = `${backendUrl}/images/${imageFileName}`;

                        let botMessageId = uuidv4();

                        addMessageToChat(chats, chatId, botMessageId, 'bot', localImageUrl, true, socket);

                        socket.emit('bot finished')
                    })
                    .catch((error) => {
                        console.log(error);
                        socket.emit('error', {error: error.message});
                    });
            } catch (error) {
                console.log(error)
                socket.emit('error', {error: error.message});
            }
        }
    );

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});