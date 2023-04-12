import {Server as socketIO} from 'socket.io';
import {fetchStreamedChatContent} from 'streamed-chatgpt-api';
import axios from 'axios';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const maxPromptLength = 200;

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

// Middleware for images
const app = express();

// Get images from MongoDB
app.get('/images/:id', async (req, res) => {
    const imageId = req.params.id;

    try {
        const image = await mongoClient
            .db(mongoDbName)
            .collection('images')
            .findOne({ _id: new ObjectId(imageId) });

        if (!image) {
            res.status(404).json({ error: 'Image not found' });
            return;
        }

        const contentType = 'image/jpeg'; // Adjust this based on the actual image type
        res.setHeader('Content-Type', contentType);
        res.send(image.data.buffer);
    } catch (error) {
        console.error('Failed to fetch the image', error);
        res.status(500).json({ error: 'Failed to fetch the image' });
    }
});

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
const addMessageToChat = async (chatId, messageId, role, content, isImage, prompt = "", socket) => {
    const message = {
        id: messageId,
        role: role,
        content: content,
        timestamp: Date.now(),
        isImage: isImage,
        prompt: prompt,
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
        const newChat = {
            id: uuidv4(),
            title: `New Chat`,
            creationDate: Date.now(),
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
        const userMessageId = uuidv4();
        await addMessageToChat(chatId, userMessageId, 'user', messageInput, false, "",socket);

        const botMessageId = uuidv4();
        let currentBotMessage = '';

        await addMessageToChat(chatId, botMessageId, 'bot', '...', false, messageInput, socket);

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
        const { chatId, apiKey, message, imageCommand } = data;

        if (!apiKey) {
            socket.emit('error', { error: 'No API key provided.' });
            console.log('No API key provided.');
            return;
        }
        const userMessageId = uuidv4();

        await addMessageToChat(chatId, userMessageId, 'user', message, false,"", socket);

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

            let sanitizedPrompt = sanitizeFilename(prompt);
            sanitizedPrompt = sanitizedPrompt.substring(0, maxPromptLength);

            const timestamp = Date.now();

            // Download and save the image in MongoDB
            axios
                .get(imageUrl, { responseType: 'arraybuffer' })
                .then(async (response) => {
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    try {
                        const image = {
                            timestamp: timestamp,
                            data: imageBuffer,
                            prompt: prompt,
                            sanitizedPrompt: sanitizedPrompt,
                        };

                        const result = await mongoClient
                            .db(mongoDbName)
                            .collection('images')
                            .insertOne(image);

                        const imageId = result.insertedId;
                        const localImageUrl = `${backendUrl}/images/${imageId}`;

                        const botMessageId = uuidv4();
                        await addMessageToChat(chatId, botMessageId, 'bot', localImageUrl, true, prompt, socket);
                        socket.emit('bot finished');
                    } catch (error) {
                        console.error('Failed to store the image', error);
                        socket.emit('error', { error: 'Failed to store the image' });
                    }
                })
                .catch((error) => {
                    console.log(error);
                    socket.emit('error', { error: error.message });
                });
        } catch (error) {
            console.log(error);
            socket.emit('error', { error: error.message });
        }
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});