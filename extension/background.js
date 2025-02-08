   // background.js
   chrome.runtime.onInstalled.addListener((request, sender, sendResponse) => {
    console.log("Extension installée !", request, sender, sendResponse);
});

// Écoute des messages pour démarrer la reconnaissance vocale
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("onMessage", request, sender, sendResponse);
    if (request.action === "startRecognition") {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            console.log(transcript); // Affiche la transcription dans la console
        };

        recognition.start();
        sendResponse({ status: "Recognition started" });
    }
});



