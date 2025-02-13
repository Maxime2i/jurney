const https = require('https');

const handleIARequest = (req, res) => {
    let body = '';
    console.log("handleIARequest", req, res);

    req.on('data', chunk => {
        body += chunk.toString(); // Convertir le Buffer en chaîne
    });


    req.on('end', () => {
        const { input } = JSON.parse(body);
        const data = JSON.stringify({ input });
        console.log(data);

        const options = {
            hostname: 'URL_DE_L_API_D_IA', // Remplacez par l'URL de l'API
            port: 443, // Port pour HTTPS
            path: '/', // Chemin de l'API
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
        };

        const apiReq = https.request(options, apiRes => {
            let apiBody = '';

            apiRes.on('data', chunk => {
                apiBody += chunk;
            });

            apiRes.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(apiBody);
            });
        });

        apiReq.on('error', error => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Erreur lors de la communication avec l\'API d\'IA' }));
        });

        apiReq.write(data);
        apiReq.end();
    });
};

module.exports = { handleIARequest };