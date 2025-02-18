const fs = require('fs');

const handleTranscribeRequest = async (req, res) => {
    if (req.method === 'POST') {
        const filePath = './uploads/audio.wav'; // Chemin où le fichier audio sera enregistré
        const writeStream = fs.createWriteStream(filePath);

        req.pipe(writeStream);

        writeStream.on('finish', async () => {

            // Vérifiez la taille du fichier après l'enregistrement
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error("Erreur lors de la vérification du fichier:", err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ message: 'Erreur lors de la vérification du fichier audio.' }));
                }

                // Lire le fichier audio et l'envoyer à l'API Whisper
                fs.readFile(filePath, async (err, data) => {
                    if (err) {
                        console.error("Erreur lors de la lecture du fichier:", err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ message: 'Erreur lors de la lecture du fichier audio.' }));
                    }

                    // Vérifiez si le fichier est vide
                    if (data.length === 0) {
                        console.error("Le fichier audio est vide.");
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ message: 'Le fichier audio est vide.' }));
                    }

                    const audioBase64 = data.toString('base64'); // Convertir en Base64
                    const apiKey = "test";//process.env.OPENAI_API_KEY;

                    // Convertir le Base64 en Blob et envoyer à l'API
                    const blob = Buffer.from(audioBase64, 'base64');
                    const FormData = (await import('form-data')).default; // Importation dynamique de form-data
                    const fetch = (await import('node-fetch')).default; // Importation dynamique de node-fetch

                    const formData = new FormData();
                    formData.append("file", blob, "audio.wav"); // Assurez-vous que le nom du fichier est correct
                    formData.append("model", "whisper-1");
                    formData.append("language", "fr");

                    fetch("https://api.openai.com/v1/audio/transcriptions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${apiKey}`
                        },
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Fichier audio traité avec succès.', data }));
                    })
                    .catch(error => {
                        console.error("Erreur:", error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Erreur lors de l\'envoi à l\'API Whisper.' }));
                    });
                });
            });
        });

        writeStream.on('error', (error) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Erreur lors de l\'enregistrement du fichier audio.' }));
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Méthode non autorisée');
    }
};

module.exports = { handleTranscribeRequest };