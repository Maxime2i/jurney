const multer = require('multer');
const { bucket } = require('../firebase');
const axios = require('axios');
const FormData = require('form-data');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY'; 

const handleTranscribeRequest = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Aucun fichier fourni.');
            return;
        }

        const filePath = `transcriptions/${file.originalname}`;
        const fileUpload = bucket.file(filePath);
        const stream = fileUpload.createWriteStream({
            metadata: { contentType: file.mimetype },
        });

        stream.end(file.buffer); 

        stream.on('finish', async () => {



            try {
                const [url] = await fileUpload.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 15 * 60 * 1000, 
                });

                const response = await axios({
                    method: 'get',
                    url,
                    responseType: 'stream',
                });

                const formData = new FormData();
                formData.append('file', response.data, { filename: file.originalname, contentType: file.mimetype });
                formData.append('model', 'whisper-1');
                formData.append('language', 'fr');

                const whisperResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    }
                });

                console.log(whisperResponse.data);
                if (whisperResponse.data.text === "Sous-titres réalisés para la communauté d'Amara.org") {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end();
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ data: whisperResponse.data }));

            } catch (error) {
                console.error('Erreur lors de la transcription :', error.response?.data || error.message);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Erreur lors de la transcription.');
            }
        });

        stream.on('error', (error) => {
            console.error('Erreur lors de l’upload Firebase:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Erreur lors de l’upload Firebase.');
        });

    } catch (error) {
        console.error('Erreur générale:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erreur générale.');
    }
};

module.exports = { handleTranscribeRequest, upload };
