const axios = require('axios');

const chatGptRequest = async (input) => {
    // const apiKey = process.env.OPENAI_API_KEY; // Assurez-vous que votre clé API est stockée dans les variables d'environnement
    // console.log("apiKey", apiKey, input);
    // const url = 'https://api.openai.com/v1/chat/completions';

    try {
        // const response = await axios.post(url, {
        //     model: 'gpt-3.5-turbo', // ou le modèle que vous souhaitez utiliser
        //     messages: [{ role: 'user', content: input }],
        // }, {
        //     headers: {
        //         'Authorization': `Bearer ${apiKey}`,
        //         'Content-Type': 'application/json',
        //     },
        // });

        // return response.data.choices[0].message.content; // Retourne la réponse de l'IA

        return "1. Faites des recherches sur l'entreprise et le poste pour lequel vous postulez afin de pouvoir parler de façon pertinente de vos compétences et motivations lors de l'entretien.\n2. Préparez des réponses aux questions les plus courantes posées lors des entretiens, telles que vos forces et faiblesses, vos réalisations passées et pourquoi vous souhaitez travailler pour cette entreprise.\n3. Soyez ponctuel, habillé de manière appropriée et restez poli et professionnel tout au long de l'entretien. Montrez votre intérêt pour le poste et posez des questions pertinentes sur l'entreprise pour montrer votre motivation."
    } catch (error) {
        console.error('Erreur lors de l\'appel à l\'API ChatGPT:', error);
        throw error;
    }
};

module.exports = { chatGptRequest };