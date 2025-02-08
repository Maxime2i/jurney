const { handleIARequest } = require('../controllers/iaController');

const iaRoute = (req, res) => {
    if (req.method === 'POST' && req.url === '/api/ia') {
        handleIARequest(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route non trouvée');
    }
};

module.exports = iaRoute;