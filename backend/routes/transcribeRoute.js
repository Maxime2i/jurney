const { handleTranscribeRequest, upload } = require('../controllers/transcribeController');

const transcribeRoute = (req, res) => {
    if (req.method === 'POST' && req.url === '/api/transcribe') {
        upload.single('audio')(req, res, (err) => {
            if (err) {
                return res.status(500).send('Erreur lors de l\'upload du fichier');
            }
            handleTranscribeRequest(req, res);
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route non trouvée');
    }
};

module.exports = transcribeRoute;