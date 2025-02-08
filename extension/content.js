// content.js
console.log("content.js chargééééé");

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.interimResults = true;

recognition.onstart = () => {
    console.log("Reconnaissance vocale démarrée");
};

recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
    console.log(transcript); // Affiche la transcription dans la console
};

recognition.onerror = (event) => {
    console.error("Erreur de reconnaissance vocale:", event.error);
};

recognition.onend = () => {
    console.log("Reconnaissance vocale terminée");
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startCapture") {
        console.log("startCapture", chrome);
        chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
            console.log("stream", stream);
            if (stream) {
                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.interimResults = true;

                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(audioContext.destination); // Connecte le flux audio

                recognition.onresult = (event) => {
                    const transcript = Array.from(event.results)
                        .map(result => result[0])
                        .map(result => result.transcript)
                        .join('');
                    console.log(transcript); // Affiche la transcription dans la console
                };

                recognition.onerror = (event) => {
                    console.error("Erreur de reconnaissance vocale:", event.error);
                };

                recognition.start();
                sendResponse({ status: "Capture started" });
            } else {
                console.error("Échec de la capture de l'audio");
                sendResponse({ status: "Capture failed" });
            }
        });
    }
});