const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const handleMessage = async (socket, data) => {
    try {
        console.log(data);

        const { message, conversationHistory } = data;

        const messages = [
            ...(conversationHistory || []),
            {
                role: "user",
                content: message,
            },
        ];

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: data.model,
                messages: messages,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.apiKey}`,
                },
            }
        );
        const reply = response.data.choices[0].message.content;

        if (reply !== '') {
            socket.emit('bot message', { reply: reply.trim() });
        } else {
            socket.emit('error', { error: 'Something bad happened.' });
        }
    } catch (error) {
        console.error(error);
        const errorMessage = error.response?.data?.error?.message || 'An error occurred while processing the request.';
        socket.emit('error', { error: errorMessage });
    }
};
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('chat message', async (data) => {
        await handleMessage(socket, data);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
