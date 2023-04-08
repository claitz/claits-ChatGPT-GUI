const socketIO = require('socket.io');
const { fetchStreamedChatContent } = require('streamed-chatgpt-api');
const axios = require('axios');


const PORT = process.env.REACT_APP_WS_PORT || 3001;

const io = socketIO(PORT, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
io.on('connection', (socket) => {

    socket.on('imagine', async (data) => {
        const { apiKey, prompt } = data;

        if (!apiKey) {
            socket.emit('error', { error: 'No API key provided.' });
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

            console.log(imageUrl)
            const botMessage = { role: 'bot', content: imageUrl, timestamp: Date.now(), isImage: true };

            socket.emit('bot image', botMessage);

        } catch (error) {
            socket.emit('error', { error: error.message });
        }

    });

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
            socket.emit('error', { error: 'No API key provided.' });
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
                    socket.emit('bot message', { reply: currentBotMessage, isNewMessage: isFirstChunk, isFinished: false });
                    isFirstChunk = false;
                },
                () => {
                    // onFinish
                    socket.emit('bot message', { reply: currentBotMessage, isNewMessage: false, isFinished: true });
                },
                (error) => {
                    // onError
                    socket.emit('error', { error: error.message });
                }
            );
        } catch (error) {
            socket.emit('error', { error: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

console.log(`Server listening on port ${PORT}`);