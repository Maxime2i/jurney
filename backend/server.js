const http = require('http');
const chatGptRoute = require('./routes/chatGptRoute');
const transcribeRoute = require('./routes/transcribeRoute');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 1500;

const requestHandler = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); 
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); 

    if (req.url.startsWith('/api/chatgpt')) {
        chatGptRoute(req, res);
    } else if (req.url.startsWith('/api/transcribe')) {
        transcribeRoute(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route non trouvée');
    }
};

const server = http.createServer(requestHandler);

server.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});