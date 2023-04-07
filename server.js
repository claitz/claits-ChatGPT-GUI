const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

app.post('/api/chat', async (req, res) => {
    try {
        console.log(req.body);

        const { message } = req.body;

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: req.body.model,
                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.body.apiKey}`,
                },
            }
        );
        const reply = response.data.choices[0].message.content;

        if (reply !== '') {
            res.status(200).json({ reply: reply.trim() });
        } else {
            res.status(500).json({ error: 'Something bad happened.' });
        }
    } catch (error) {
        console.error(error);
        const errorMessage = error.response?.data?.error?.message || 'An error occurred while processing the request.';
        res.status(500).json({ error: errorMessage });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
