import {Server as socketIO} from 'socket.io';
import {fetchStreamedChatContent} from 'streamed-chatgpt-api';
import axios from 'axios';
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.REACT_APP_WS_PORT || 3001;
const backendUrl = process.env.REACT_APP_BACKEND_HOST || `http://localhost:${PORT}`;

// MongoDB configuration
const mongoUsername = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT;
const mongoDbName = process.env.MONGO_DB_NAME || 'chagpt-db';
const mongoDbUrl = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}`;

const mongoClient = new MongoClient(mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB
(async () => {
    try {
        await mongoClient.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
})();

// Image folder configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesFolderPath = path.join(__dirname, 'images');

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

// Helper to sanitize filenames
function sanitizeFilename(prompt) {
    return prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Adding messages to the chat
const addMessageToChat = async (chatId, messageId, role, content, isImage, socket) => {
    const message = {
        id: messageId,
        role: role,
        content: content,
        timestamp: Date.now(),
        isImage: isImage,
    };

    await mongoClient
        .db(mongoDbName)
        .collection('chats')
        .updateOne({ id: chatId }, { $push: { messages: message } });

    const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();
    const chatIndex = updatedChats.findIndex((chat) => chat.id === chatId);
    socket.emit('chats updated', updatedChats, chatIndex);
};

// Updating existing messages
const updateBotMessageInChat = async (chatId, messageId, content, isImage, socket) => {
    await mongoClient.db(mongoDbName).collection('chats').updateOne({ id: chatId, 'messages.id': messageId }, { $set: { 'messages.$.content': content } });

    const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();

    const chatIndex = updatedChats.findIndex((chat) => chat.id === chatId);
    socket.emit('chats updated', updatedChats, chatIndex);
}

io.on('connection', (socket) => {
    console.log('New client connected');

    (async () => {
        const chats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();
        socket.emit('chats updated', chats, -1);
    })();

    socket.on('create chat', async () => {
        const chats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();
        const newChat = {
            id: uuidv4(),
            title: `Chat ${chats.length + 1}`,
            messages: [],
        };
        await mongoClient.db(mongoDbName).collection('chats').insertOne(newChat);
        const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();
        const chatIndex = updatedChats.findIndex((chat) => chat.id === newChat.id);
        socket.emit('chats updated', updatedChats, chatIndex);
    });

    socket.on('delete chat', async (chatId) => {
        await mongoClient.db(mongoDbName).collection('chats').deleteOne({ id: chatId });
        const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();

        const numChats = updatedChats.length;

        if (numChats === 0){
            socket.emit('chats updated', updatedChats, -1);
        } else {
            socket.emit('chats updated', updatedChats);
        }

        socket.emit('info', { info: 'Chat deleted'});
    });

    socket.on('rename chat', async ({ chatId, newTitle }) => {
        await mongoClient.db(mongoDbName).collection('chats').updateOne({ id: chatId }, { $set: { title: newTitle } });
        const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();

        const chatIndex = updatedChats.findIndex((chat) => chat.id === chatId);

        socket.emit('chats updated', updatedChats, chatIndex);
        socket.emit('info', { info: 'Chat renamed'});
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
        await addMessageToChat(chatId, userMessageId, 'user', messageInput, false, socket);

        let botMessageId = uuidv4();
        let currentBotMessage = '';

        await addMessageToChat(chatId, botMessageId, 'bot', '...', false, socket);

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
                    updateBotMessageInChat(chatId, botMessageId, currentBotMessage, false, socket);

                },
                () => {
                    // onFinish
                    updateBotMessageInChat(chatId, botMessageId, currentBotMessage, false, socket);
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
            const {chatId, apiKey, message, imageCommand } = data;

            if (!apiKey) {
                socket.emit('error', {error: 'No API key provided.'});
                console.log('No API key provided.')
                return;
            }
            let userMessageId = uuidv4();

            await addMessageToChat(chatId, userMessageId, 'user', message,false, socket);

            const prompt = message.replace(imageCommand, '').trim();

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
                    .then(async (response) => {
                        const localImagePath = path.join(imagesFolderPath, imageFileName);
                        fs.writeFileSync(localImagePath, Buffer.from(response.data, 'binary'));

                        const localImageUrl = `${backendUrl}/images/${imageFileName}`;

                        let botMessageId = uuidv4();

                        await addMessageToChat(chatId, botMessageId, 'bot', localImageUrl, true, socket);

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