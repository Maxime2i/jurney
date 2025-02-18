const http = require('http');
const iaRoute = require('./routes/iaRoute');
const chatGptRoute = require('./routes/chatGptRoute');
const transcribeRoute = require('./routes/transcribeRoute');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 1500;

const requestHandler = (req, res) => {
    // Ajouter les en-têtes CORS
    res.setHeader('Access-Control-Allow-Origin', '*'); // Autoriser toutes les origines
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Méthodes autorisées
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // En-têtes autorisés

    if (req.url.startsWith('/api/ia')) {
        iaRoute(req, res);
    } else if (req.url.startsWith('/api/chatgpt')) {
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