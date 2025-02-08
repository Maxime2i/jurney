// popup.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded");

    document.getElementById('start').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "startCapture" }, (response) => {
                    if (response) {
                        console.log(response.status);
                    } else {
                        console.error("Aucune réponse reçue");
                    }
                });
            } else {
                console.error("Aucun onglet actif trouvé");
            }
        });
    });
});