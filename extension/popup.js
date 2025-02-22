const startButton = document.getElementById("startRecord");
const stopButton = document.getElementById("stopRecord");
const responseDiv = document.getElementById("response");
const recordingStatus = document.getElementById("recordingStatus");
const sendButton = document.getElementById("sendRecording");

let transcriptions = ""; 
let recordingTimeout;

let permissionStatus = document.getElementById("permissionStatus");

function showError(message) {
  permissionStatus.textContent = message;
  permissionStatus.style.display = "block";
}

function hideError() {
  permissionStatus.style.display = "none";
}

async function checkMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    return false;
  }
}

// Check recording state when popup opens
async function checkRecordingState() {
  const hasPermission = await checkMicrophonePermission();
  if (!hasPermission) {
    chrome.tabs.create({ url: "permission.html" });
    return;
  }
}

function saveRecordingState(isRecording) {
  localStorage.setItem('isRecording', isRecording);
}

startButton.addEventListener("click", async () => {
  saveRecordingState(true); 
  startButton.style.display = "none";
  stopButton.style.display = "block";

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

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

stopButton.addEventListener("click", () => {
  saveRecordingState(false); 
  console.log("Bouton Arrêter cliqué");
  stopButton.style.display = "none";
  startButton.style.display = "block";

  clearTimeout(recordingTimeout); 
  chrome.runtime.sendMessage({ target: "offscreen", type: "stop-recording" });
});

document.addEventListener("DOMContentLoaded", async () => {
  const isRecording = localStorage.getItem('isRecording') === 'true';
  if (isRecording) {
    startButton.style.display = "none";
    stopButton.style.display = "block";
  } else {
    startButton.style.display = "block";
    stopButton.style.display = "none";
  }

  // Appeler checkRecordingState pour vérifier l'état de l'enregistrement
  await checkRecordingState();
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

function autoResizeTextarea() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px'; 
}

recordingStatus.addEventListener('input', autoResizeTextarea);

sendButton.disabled = !recordingStatus.value.trim(); 

recordingStatus.addEventListener('input', () => {
  sendButton.disabled = !recordingStatus.value.trim();
  autoResizeTextarea.call(recordingStatus); 
});

sendButton.addEventListener("click", () => {
  const question = recordingStatus.value;

  fetch(`https://jurney-bice.vercel.app/api/chatgpt`, {
    method: "POST",
    body: JSON.stringify({ input: question }),
  })
    .then((response) => response.json())
    .then((data) => {
      responseDiv.textContent = data.response;
    });
});
