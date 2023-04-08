import {Server as socketIO} from 'socket.io';
import {fetchStreamedChatContent} from 'streamed-chatgpt-api';
import axios from 'axios';
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';


const PORT = process.env.REACT_APP_WS_PORT || 3001;
const backendUrl = process.env.REACT_APP_BACKEND_URL || `http://localhost:${PORT}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesFolderPath = path.join(__dirname, 'images');

if (!fs.existsSync(imagesFolderPath)) {
    fs.mkdirSync(imagesFolderPath);
}

const app = express();
app.use('/images', express.static(imagesFolderPath)); // Serve images folder
const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

const io = new socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

function sanitizeFilename(prompt) {
    return prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

io.on('connection', (socket) => {

    socket.on('imagine', async (data) => {
            const {apiKey, prompt} = data;

            if (!apiKey) {
                socket.emit('error', {error: 'No API key provided.'});
                console.log('No API key provided.')
                return;
            }

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
                const imageFileName = `${sanitizedPrompt}.jpeg`;

                console.log(imageUrl)

                // Download and save the image locally
                axios
                    .get(imageUrl, {responseType: 'arraybuffer'})
                    .then((response) => {
                        const localImagePath = path.join(imagesFolderPath, imageFileName);
                        fs.writeFileSync(localImagePath, Buffer.from(response.data, 'binary'));

                        const localImageUrl = `${backendUrl}/images/${imageFileName}`;
                        console.log(localImageUrl)
                        const botMessage = {role: 'bot', content: localImageUrl, timestamp: Date.now(), isImage: true};
                        socket.emit('bot image', botMessage);
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

    socket.on('chat message', async (data) => {
        const {
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

        let currentBotMessage = '';
        let isFirstChunk = true;

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
                    socket.emit('bot message', {
                        reply: currentBotMessage,
                        isNewMessage: isFirstChunk,
                        isFinished: false
                    });
                    isFirstChunk = false;
                },
                () => {
                    // onFinish
                    socket.emit('bot message', {
                        reply: currentBotMessage,
                        isNewMessage: false,
                        isFinished: true
                    });
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

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});