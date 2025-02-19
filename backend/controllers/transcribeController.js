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

            // Vérifiez le format du fichier audio
            const fileExtension = 'wav'; // Assurez-vous que l'extension est correcte
            if (fileExtension !== 'wav') {
                console.error("Format de fichier non valide. Formats pris en charge : ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm']");
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: 'Format de fichier non valide.' }));
            }

            const blob = Buffer.from(audioBase64, 'base64'); // Contenu du fichier audio
            const file = bucket.file('audio/audio.wav'); // Chemin dans Firebase

            // Enregistrement sur Firebase
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

            stream.on('finish', async () => {
                console.log("Fichier enregistré sur Firebase avec succès.");

                // Obtenir l'URL de téléchargement
                const url = await file.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 1000 * 60 * 60 // 1 heure
                });

                console.log("URL de téléchargement:", url[0]);

                // Vous pouvez maintenant utiliser cette URL pour accéder au fichier
                // Par exemple, vous pouvez l'envoyer dans la réponse ou l'utiliser pour d'autres opérations

                // Créer le formData avec le contenu déjà disponible
                const formData = new (await import('form-data')).default();
                formData.append("file", blob, { filename: "audio.wav", contentType: 'audio/wav' });
                formData.append("model", "whisper-1");
                formData.append("language", "fr");

                // Appel à l'API OpenAI
                fetch("https://api.openai.com/v1/audio/transcriptions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    console.log("data", data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Fichier audio traité avec succès.', data }));
                })
                .catch(error => {
                    console.error("Erreur:", error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Erreur lors de l\'envoi à l\'API Whisper.' }));
                });
            });

            stream.end(blob); // Fin de l'écriture du fichier sur Firebase

        });
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Méthode non autorisée');
    }
};

module.exports = { handleTranscribeRequest };