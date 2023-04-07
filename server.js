const socketIO = require('socket.io');
const { fetchStreamedChatContent } = require('streamed-chatgpt-api');

const PORT = process.env.WS_PORT || 3001;

const io = socketIO(PORT, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
io.on('connection', (socket) => {
    console.log('Client connected');

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