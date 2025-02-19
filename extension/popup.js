// Get button elements
const startButton = document.getElementById("startRecord");
const stopButton = document.getElementById("stopRecord");
const sendButton = document.getElementById("sendRecording");
const recordingStatus = document.getElementById("recordingStatus");
const responseDiv = document.getElementById("response");



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

  const contexts = await chrome.runtime.getContexts({});
  const offscreenDocument = contexts.find(
    (c) => c.contextType === "OFFSCREEN_DOCUMENT"
  );

  if (
    offscreenDocument &&
    offscreenDocument.documentUrl.endsWith("#recording")
  ) {
    stopButton.style.display = "block";
    setTimeout(() => stopButton.classList.add("visible"), 10);
  } else {
    startButton.style.display = "block";
    setTimeout(() => startButton.classList.add("visible"), 10);
  }
}

// Call checkRecordingState when popup opens
document.addEventListener("DOMContentLoaded", checkRecordingState);

// Add button click listeners
startButton.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      !tab ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      alert(
        "Cannot record Chrome system pages. Please try on a regular webpage."
      );
      return;
    }

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

    startButton.classList.remove("visible");
    setTimeout(() => {
      startButton.style.display = "none";
      stopButton.style.display = "block";
      setTimeout(() => stopButton.classList.add("visible"), 10);
    }, 300);

    // Envoi de l'enregistrement toutes les 5 secondes
    setInterval(async () => {
      try {
        
        const formData = new FormData();
        // Ajoutez ici l'enregistrement au FormData
        // Remplacez 'audioBlob' par la variable contenant votre enregistrement
        const audioBlob = await getAudioBlob(); // Fonction fictive pour obtenir le blob audio
        formData.append("file", audioBlob, "recording.wav"); // Assurez-vous que le nom du fichier est correct

        const response = await fetch("http://localhost:1500/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Erreur lors de l'envoi de l'enregistrement");
        }

        const data = await response.json();
        recordingStatus.value = data.data.text;
      } catch (error) {
        console.error("Erreur:", error);
      }
    }, 5000); // 5000 ms = 5 secondes

  } catch (error) {
    alert("Failed to start recording: " + error.message);
  }
});

stopButton.addEventListener("click", () => {
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: "stop-recording",
      target: "offscreen",
    });
  }, 500);

  responseDiv.textContent = "";
  recordingStatus.value = "";

  stopButton.classList.remove("visible");
  setTimeout(() => {
    stopButton.style.display = "none";
    startButton.style.display = "block";
    setTimeout(() => startButton.classList.add("visible"), 10);
  }, 300);
});

// Listen for messages from offscreen document and service worker
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
    }
  }
});

// Fonction fictive pour obtenir le blob audio
async function getAudioBlob() {
  // Implémentez la logique pour récupérer le blob audio de l'enregistrement
  // Cela dépend de la façon dont vous gérez l'enregistrement audio
  return new Blob(); // Remplacez par le blob réel
}

sendButton.addEventListener("click", async () => {

  try {
    const response = await fetch("http://localhost:1500/api/chatgpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: recordingStatus.value }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'envoi à l'API ChatGPT");
    }

    const data = await response.json();
    responseDiv.textContent = data.response; // Assurez-vous que la réponse est dans le bon format
  } catch (error) {
    console.error("Erreur:", error);
  }
});