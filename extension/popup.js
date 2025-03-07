const startButton = document.getElementById("startRecord");
const stopButton = document.getElementById("stopRecord");
const responseDiv = document.getElementById("response");
const recordingStatus = document.getElementById("recordingStatus");
const sendButton = document.getElementById("sendRecording");

let transcriptions = "";
let recordingTimeout;

let permissionStatus = document.getElementById("permissionStatus");
let responseHistory = [];

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
  localStorage.setItem("isRecording", isRecording);
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
  const isRecording = localStorage.getItem("isRecording") === "true";
  if (isRecording) {
    startButton.style.display = "none";
    stopButton.style.display = "block";
  } else {
    startButton.style.display = "block";
    stopButton.style.display = "none";
    recordingStatus.value = "";
    localStorage.setItem('transcript', " ");
  }

  // Récupérer la transcription du localStorage
  const savedTranscript = localStorage.getItem("transcript") || "";
  recordingStatus.value = savedTranscript; // Mettre à jour le champ avec la transcription sauvegardée
  recordingStatus.dispatchEvent(new Event("input"));


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
        const transcript = localStorage.getItem("transcript");
        recordingStatus.value = transcript;
        recordingStatus.dispatchEvent(new Event("input"));

        const automaticRadio = document.querySelector('input[name="sendMode"]:checked'); 
        if (automaticRadio && automaticRadio.value === "automatic" && recordingStatus.value.includes("?")) {
            sendButton.click(); 
        }        
        break;
    }
  }
});

function autoResizeTextarea() {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
}

recordingStatus.addEventListener("input", autoResizeTextarea);

sendButton.disabled = !recordingStatus.value.trim();

recordingStatus.addEventListener("input", () => {
  sendButton.disabled = !recordingStatus.value.trim();
  localStorage.setItem('transcript', recordingStatus.value)
  autoResizeTextarea.call(recordingStatus);
});

sendButton.addEventListener("click", () => {
  const question = recordingStatus.value;
  recordingStatus.value = "";
  recordingStatus.dispatchEvent(new Event("input"));

  fetch(`https://jurney-ten.vercel.app/api/chatgpt`, {
    method: "POST",
    body: JSON.stringify({ input: question }),
  })
    .then((response) => response.json())
    .then((data) => {
      responseDiv.textContent = data.response;
      responseHistory.push(data.response);
    });
});
