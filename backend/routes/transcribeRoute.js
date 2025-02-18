const { handleTranscribeRequest } = require('../controllers/transcribeController');

const transcribeRoute = (req, res) => {
    if (req.method === 'POST' && req.url === '/api/transcribe') {
        handleTranscribeRequest(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route non trouvée');
    }
};

module.exports = transcribeRoute;