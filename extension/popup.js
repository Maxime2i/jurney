// Get button elements
const startButton = document.getElementById("startRecord");
const stopButton = document.getElementById("stopRecord");
const responseDiv = document.getElementById("response");



startButton.addEventListener("click", async () => {
  startButton.style.display = "none";
  stopButton.style.display = "block";
  responseDiv.textContent = "start";

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



  setTimeout(() => {
    chrome.runtime.sendMessage({ target: "offscreen", type: "stop-recording" });
    startButton.click();
  }, 5000);

});

stopButton.addEventListener("click", () => {
  console.log("Bouton Arrêter cliqué");
  stopButton.style.display = "none";
  startButton.style.display = "block";

  chrome.runtime.sendMessage({ target: "offscreen", type: "stop-recording" });
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
        responseDiv.textContent += message.data;
        break;
    }
  }
});