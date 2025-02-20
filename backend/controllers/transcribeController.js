const multer = require('multer');
const { bucket } = require('../firebase'); // Assurez-vous d'importer le bucket Firebase

// Configuration de multer pour le stockage en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Fonction pour gérer la requête de transcription
const handleTranscribeRequest = async (req, res) => {
    try {
        const file = req.file; // Récupérer le fichier téléchargé

        if (!file) {
            return res.status(400).send('Aucun fichier téléchargé.');
        }

        // Chemin du fichier dans le bucket Firebase
        const filePath = `transcriptions/${file.originalname}`;

        // Télécharger le fichier sur Firebase
        const fileUpload = bucket.file(filePath);
        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        // Écrire le buffer du fichier dans le stream
        stream.on('error', (error) => {
            console.error('Erreur lors du téléchargement sur Firebase:', error);
            res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Fichier audio traité avec succès.', data: 'test' }));
        });

        stream.on('finish', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Fichier audio traité avec succès.', data: 'test' }));
        });

        // Écrire le buffer dans le stream
        stream.end(file.buffer); // Passer le buffer directement ici

        
    } catch (error) {
        console.error('Erreur lors du téléchargement sur Firebase:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Erreur lors du téléchargement du fichier.', error: error.message }));
    }
};

module.exports = { handleTranscribeRequest, upload };
