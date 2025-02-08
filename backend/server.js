const http = require('http');
const iaRoute = require('./routes/iaRoute');

const PORT = process.env.PORT || 1500;

const requestHandler = (req, res) => {
    if (req.url.startsWith('/api/ia')) {
        iaRoute(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route non trouvée');
    }
};

const server = http.createServer(requestHandler);

server.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});