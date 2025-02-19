const fs = require('fs');
const { bucket } = require('../firebase');

const handleTranscribeRequest = async (req, res) => {
    if (req.method === 'POST') {
        // Lire le fichier audio directement depuis le flux de requête
        const chunks = [];
        req.on('data', chunk => {
            chunks.push(chunk);
        });

        req.on('end', async () => {
            const data = Buffer.concat(chunks);

            // Vérifiez si le fichier est vide
            if (data.length === 0) {
                console.error("Le fichier audio est vide.");
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: 'Le fichier audio est vide.' }));
            }

            const audioBase64 = data.toString('base64'); // Convertir en Base64
            const apiKey = process.env.OPENAI_API_KEY;

            // Convertir le Base64 en Blob et envoyer à l'API
            const blob = Buffer.from(audioBase64, 'base64');
            const FormData = (await import('form-data')).default; // Importation dynamique de form-data
            const fetch = (await import('node-fetch')).default; // Importation dynamique de node-fetch

            const formData = new FormData();
            formData.append("file", blob, "audio.wav"); // Assurez-vous que le nom du fichier est correct
            formData.append("model", "whisper-1");
            formData.append("language", "fr");

            // Enregistrement sur Firebase
            const { bucket } = require('../firebase'); // Assurez-vous que le bucket est importé
            const file = bucket.file('audio/audio.wav'); // Chemin dans Firebase
            const stream = file.createWriteStream({
                metadata: {
                    contentType: 'audio/wav',
                },
            });

            stream.on('error', (error) => {
                console.error("Erreur lors de l'enregistrement sur Firebase:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Erreur lors de l\'enregistrement sur Firebase.' }));
            });

            stream.on('finish', () => {
                console.log("Fichier enregistré sur Firebase avec succès.");
                // Vous pouvez ici appeler l'API OpenAI si nécessaire
            });

            stream.end(blob); // Fin de l'écriture du fichier sur Firebase

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
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Méthode non autorisée');
    }
};

module.exports = { handleTranscribeRequest };