const axios = require('axios');

const chatGptRequest = async (input) => {
    const apiKey = process.env.OPENAI_API_KEY; 
    const url = 'https://api.openai.com/v1/chat/completions';



    try {
        const response = await axios.post(url, {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: input }],
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data.choices[0].message.content; 
    } catch (error) {
        console.error('Erreur lors de l\'appel à l\'API ChatGPT:', error);
        throw error;
    }
};

module.exports = { chatGptRequest };