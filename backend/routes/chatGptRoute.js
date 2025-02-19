const { chatGptRequest } = require('../controllers/chatGptController');

const chatGptRoute = async (req, res) => {
    console.log("chatGptRoute", req.method, req.url);
    if (req.method === 'POST' && req.url === '/api/chatgpt') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            console.log("body", body);
            const { input } = JSON.parse(body);
            console.log("input", input);
            try {
                const response = await chatGptRequest(input);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Erreur lors de la communication avec l\'API ChatGPT' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route non trouvée');
    }
};

module.exports = chatGptRoute;