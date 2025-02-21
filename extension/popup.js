// Get button elements
const startButton = document.getElementById("startRecord");
const stopButton = document.getElementById("stopRecord");
const responseDiv = document.getElementById("response");
const recordingStatus = document.getElementById("recordingStatus");
const sendButton = document.getElementById("sendRecording");

let transcriptions = ""; // Changer pour une chaîne de caractères
let recordingTimeout; // Déclarez une variable pour stocker l'identifiant du timeout

// Ajoutez cette fonction pour sauvegarder l'état de l'enregistrement
function saveRecordingState(isRecording) {
  localStorage.setItem('isRecording', isRecording);
}

// Modifiez l'écouteur d'événements pour le bouton de démarrage
startButton.addEventListener("click", async () => {
  saveRecordingState(true); // Enregistrer l'état comme enregistrement en cours
  startButton.style.display = "none";
  stopButton.style.display = "block";

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  // Create offscreen document if not exists
  const contexts = await chrome.runtime.getContexts({});
  const offscreenDocument = contexts.find(
    (c) => c.contextType === "OFFSCREEN_DOCUMENT"
  );

  if (!offscreenDocument) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Recording from chrome.tabCapture API",
    });
  }

  // Get stream ID and start recording
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id,
  });

  chrome.runtime.sendMessage({
    type: "start-recording",
    target: "offscreen",
    data: streamId,
  });

  recordingTimeout = setTimeout(() => {
    chrome.runtime.sendMessage({ target: "offscreen", type: "stop-recording" });
    startButton.click();
  }, 5000);
});

// Modifiez l'écouteur d'événements pour le bouton d'arrêt
stopButton.addEventListener("click", () => {
  saveRecordingState(false); // Enregistrer l'état comme pas d'enregistrement
  console.log("Bouton Arrêter cliqué");
  stopButton.style.display = "none";
  startButton.style.display = "block";

  clearTimeout(recordingTimeout); // Annulez le timeout
  chrome.runtime.sendMessage({ target: "offscreen", type: "stop-recording" });
});

// Lors du chargement du popup, vérifiez l'état de l'enregistrement
document.addEventListener("DOMContentLoaded", () => {
  const isRecording = localStorage.getItem('isRecording') === 'true';
  if (isRecording) {
    startButton.style.display = "none";
    stopButton.style.display = "block";
  } else {
    startButton.style.display = "block";
    stopButton.style.display = "none";
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.target === "popup") {
    switch (message.type) {
      case "recording-error":
        alert(message.error);
        startButton.style.display = "block";
        stopButton.style.display = "none";
        break;
      case "recording-stopped":
        startButton.style.display = "block";
        stopButton.style.display = "none";
        break;
      case "transcribe":
        // transcriptions += message.data.text + " "; // Ajouter la transcription à la chaîne
        // responseDiv.textContent = transcriptions; // Afficher la chaîne de transcriptions
        // if (message.data.text.includes("?")) { // Vérifier si c'est une question
        //   const lastPeriodIndex = transcriptions.lastIndexOf('.'); // Trouver le dernier point dans la chaîne
        //   const question = lastPeriodIndex !== -1 ? transcriptions.substring(lastPeriodIndex + 1).trim() : transcriptions.trim();
        //   recordingStatus.value = question; // Afficher uniquement la question
          
        //   // Déclencher l'événement input manuellement
        //   recordingStatus.dispatchEvent(new Event('input'));

        //   // Réinitialiser la chaîne de transcriptions
        //   transcriptions = "";
        // }
        recordingStatus.value += message.data.text + " ";
        recordingStatus.dispatchEvent(new Event('input'));
        break;
    }
  }
});

// Ajoutez cet écouteur d'événements pour surveiller les changements dans l'input
function autoResizeTextarea() {
  this.style.height = 'auto'; // Réinitialiser la hauteur
  this.style.height = (this.scrollHeight) + 'px'; // Ajuster à la hauteur du contenu
}

recordingStatus.addEventListener('input', autoResizeTextarea);

// Initialisez l'état du bouton au chargement
sendButton.disabled = !recordingStatus.value.trim(); // Désactive le bouton si l'input est vide

// Ajoutez cet écouteur d'événements pour surveiller les changements dans l'input
recordingStatus.addEventListener('input', () => {
  // Activez ou désactivez le bouton en fonction du contenu de l'input
  sendButton.disabled = !recordingStatus.value.trim();
  autoResizeTextarea.call(recordingStatus); // Ajustez la taille du textarea
});

sendButton.addEventListener("click", () => {
  const question = recordingStatus.value;

  fetch(`http://localhost:1500/api/chatgpt`, {
    method: "POST",
    body: JSON.stringify({ input: question }),
  })
    .then((response) => response.json())
    .then((data) => {
      responseDiv.textContent = data.response;
    });
});
