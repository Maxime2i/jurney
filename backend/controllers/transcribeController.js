const fs = require('fs');
const { createReadStream } = require('fs');

const handleTranscribeRequest = async (req, res) => {
    if (req.method === 'POST') {
        const filePath = './uploads/audio.wav'; // Chemin où le fichier audio sera enregistré
        // const writeStream = fs.createWriteStream(filePath);

        req.pipe(writeStream);

        // writeStream.on('finish', async () => {
            // Lire le fichier audio et le transcrire
            const Audio2TextJS = await import('audio2textjs').then(module => module.default);

            const converter = new Audio2TextJS({
                threads: 4,
                processors: 1,
                outputJson: true,
            });

            converter.runWhisper(filePath, "medium", "auto")
            .then(transcription => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Fichier audio traité avec succès.', transcription }));
                })
                .catch(error => {
                    console.error("Erreur de transcription:", error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Erreur lors de la transcription de l\'audio.' }));
                });
        // });

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