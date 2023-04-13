import {Server as socketIO} from 'socket.io';
import {fetchStreamedChatContent} from 'streamed-chatgpt-api';
import axios from 'axios';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const maxPromptLength = 200;

const listenPort = process.env.REACT_APP_BACKEND_LISTEN_PORT;
const backendUrl = process.env.REACT_APP_BACKEND_HOST;
const frontendUrl = process.env.REACT_APP_FRONTEND_HOST;

// MongoDB configuration
const mongoUsername = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT;
const mongoDbName = process.env.MONGO_DB_NAME;
const mongoDbUrl = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}`;

const mongoClient = new MongoClient(mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB
(async () => {
    try {
        await mongoClient.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        handleError(error);
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
const server = app.listen(listenPort, () => console.log(`Server listening on port ${listenPort}`));

// Create socket server
const io = new socketIO(server, {
    cors: {
        origin: frontendUrl,
        methods: ['GET', 'POST'],
    },
});

// Helper to sanitize filenames
function sanitizeFilename(prompt) {
    return prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Update chats

const handleError = (error) => {
    console.error(error);
    io.emit('error', { error: error.message });
}
const updateChats = async () => {
    const chats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();
    io.emit('chats updated', chats, -1);
}

// Create a new chat
const createChat = async () => {
    const newChat = {
        id: uuidv4(),
        title: `New Chat`,
        creationDate: Date.now(),
        messages: [],
    };
    await mongoClient.db(mongoDbName).collection('chats').insertOne(newChat);
    const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();
    const chatIndex = updatedChats.findIndex((chat) => chat.id === newChat.id);
    io.emit('chats updated', updatedChats, chatIndex);
}

// Rename a chat
const renameChat = async (chatId, newTitle) => {
    await mongoClient.db(mongoDbName).collection('chats').updateOne({ id: chatId }, { $set: { title: newTitle } });
    const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();

    const chatIndex = updatedChats.findIndex((chat) => chat.id === chatId);

    io.emit('chats updated', updatedChats, chatIndex);
    io.emit('info', { info: 'Chat renamed'});
}

// Handle incoming chat message
const handleChatMessage = async (data) => {
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
        handleError({error: 'No API key provided.'});
        return;
    }
    const userMessageId = uuidv4();
    await addMessageToChat(chatId, userMessageId, 'user', messageInput,  messageInput, "");

    const botMessageId = uuidv4();
    let currentBotMessage = '';

    await addMessageToChat(chatId, botMessageId, 'bot', '...', messageInput, "");

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
                updateBotMessageInChat(chatId, botMessageId, currentBotMessage);

            },
            () => {
                // onFinish
                updateBotMessageInChat(chatId, botMessageId, currentBotMessage);
                io.emit('bot finished')
            },
            (error) => {
                // onError
                handleError(error);
            }
        );
    } catch (error) {
        handleError(error);
    }
}

// Handle image generation request

const handleImageRequest = async (data) => {
    const { chatId, apiKey, message, imageCommand } = data;

    if (!apiKey) {
        handleError({ error: 'No API key provided.' });
        return;
    }
    const userMessageId = uuidv4();

    await addMessageToChat(chatId, userMessageId, 'user', message,message,"");

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
                    await addMessageToChat(chatId, botMessageId, 'bot', localImageUrl, prompt, imageId);
                    io.emit('bot finished');
                } catch (error) {
                    handleError({ error: 'Error saving image' });
                }
            })
            .catch((error) => {
                handleError(error);
            });
    } catch (error) {
        handleError(error);
    }
}

// Add a message to the chat
const addMessageToChat = async (chatId, messageId, role, content, prompt = "", imageId = "") => {
    const message = {
        id: messageId,
        role: role,
        content: content,
        timestamp: Date.now(),
        prompt: prompt,
        imageId: imageId,
    };

    await mongoClient
        .db(mongoDbName)
        .collection('chats')
        .updateOne({ id: chatId }, { $push: { messages: message } });

    const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();
    const chatIndex = updatedChats.findIndex((chat) => chat.id === chatId);
    io.emit('chats updated', updatedChats, chatIndex);
};

// Update an existing message
const updateBotMessageInChat = async (chatId, messageId, content) => {
    await mongoClient.db(mongoDbName).collection('chats').updateOne({ id: chatId, 'messages.id': messageId }, { $set: { 'messages.$.content': content } });

    const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();

    const chatIndex = updatedChats.findIndex((chat) => chat.id === chatId);
    io.emit('chats updated', updatedChats, chatIndex);
}

// Delete a chat
const deleteChat = async (chatId) => {
    // Fetch the chat to be deleted
    const chat = await mongoClient.db(mongoDbName).collection('chats').findOne({ id: chatId });

    // Delete all images in the chat
    for (let i = 0; i < chat.messages.length; i++) {
        if (chat.messages[i].imageId !== '') {
            await deleteImage(chat.messages[i].imageId);
        }
    }

    // Delete the chat
    await mongoClient.db(mongoDbName).collection('chats').deleteOne({ id: chatId });
    const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();

    const numChats = updatedChats.length;

    if (numChats === 0) {
        io.emit('chats updated', updatedChats, -1);
    } else {
        io.emit('chats updated', updatedChats);
    }

    io.emit('info', { info: 'Chat and images deleted' });
}

// Delete a message from a chat
const deleteMessageFromChat = async(chatId, messageId) => {
    const chat = await mongoClient.db(mongoDbName).collection('chats').findOne({ id: chatId });
    const message = chat.messages.find((message) => message.id === messageId);

    if (message === undefined) return;

    let isImage = false;

    if (message.imageId !== '') {
        await deleteImage(message.imageId);
        isImage = true;
    }

    await mongoClient
        .db(mongoDbName)
        .collection('chats')
        .updateOne({ id: chatId }, { $pull: { messages: { id: messageId } } });

    const updatedChats = await mongoClient.db(mongoDbName).collection('chats').find().toArray();
    const chatIndex = updatedChats.findIndex((chat) => chat.id === chatId);

    const messageInfo = isImage ? 'Message and image deleted' : 'Message deleted';

    io.emit('chats updated', updatedChats, chatIndex);
    io.emit('info', {info: messageInfo});
}

// Delete an image
const deleteImage = async (imageId) => {
    await mongoClient
        .db(mongoDbName)
        .collection('images')
        .deleteOne({ _id:  imageId } );
}

io.on('connection', (socket) => {

    // console.log('New client connected');

    (async () => {
        await updateChats();
    })();

    socket.on('create chat', async () => {
        try {
            await createChat();
        } catch (error) {
            handleError(error);
        }
    });

    socket.on('delete chat', async (chatId) => {
        try {
            await deleteChat(chatId);
        } catch (error) {
            handleError(error);
        }
    });

    socket.on('delete message', async ({ messageId, chatId }) => {
        try {
            await deleteMessageFromChat(chatId, messageId);
        } catch (error) {
            handleError(error);
        }
    });

    socket.on('rename chat', async ({ chatId, newTitle }) => {
        try {
            await renameChat(chatId, newTitle);
        } catch (error) {
            handleError(error);
        }
    });

    socket.on('chat message', async (data) => {
        try {
            await handleChatMessage(data);
        } catch (error) {
            handleError(error);
        }
    });

    socket.on('image request', async (data) => {
        try {
            await handleImageRequest(data);
        } catch (error) {
            handleError(error);
        }
    });

    socket.on('disconnect', () => {
        // console.log('Client disconnected');
    });
});