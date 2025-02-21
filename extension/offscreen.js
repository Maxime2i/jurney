let recorder;
let data = [];
let activeStreams = [];
let audioContext;

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target === "offscreen") {
    switch (message.type) {
      case "start-recording":
        await startRecording(message.data);
        break;
      case "stop-recording":
        stopRecording();
        break;
      default:
        throw new Error("Unrecognized message:", message.type);
    }
  }
});

async function initializeAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
}

async function getAudioStreams(streamId) {
  await initializeAudio();

  if (activeStreams.length > 0) {
    return activeStreams; 
  }

  const tabStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });

  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });

  activeStreams.push(tabStream, micStream); 
  return { tabStream, micStream };
}

async function setupAudioConnections(tabStream, micStream) {
  const tabSource = audioContext.createMediaStreamSource(tabStream);
  const micSource = audioContext.createMediaStreamSource(micStream);
  const destination = audioContext.createMediaStreamDestination();

  const tabGain = audioContext.createGain();
  const micGain = audioContext.createGain();

  tabGain.gain.value = 1.0; 
  micGain.gain.value = 1.5;

  tabSource.connect(tabGain);
  tabGain.connect(audioContext.destination);
  tabGain.connect(destination);
  micSource.connect(micGain);
  micGain.connect(destination);

  return destination;
}

async function startRecording(streamId) {
  if (recorder?.state === "recording") {
    throw new Error("Called startRecording while recording is in progress.");
  }

  try {
    const { tabStream, micStream } = await getAudioStreams(streamId);
    const destination = await setupAudioConnections(tabStream, micStream);

    recorder = new MediaRecorder(destination.stream, {
      mimeType: "audio/webm",
    });
    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.onstop = async () => {
      const blob = new Blob(data, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);

      const formData = new FormData();
      formData.append('audio', blob, `recording-${new Date().toISOString()}.webm`);

      try {
        const response = await fetch('https://jurney-bice.vercel.app/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'envoi de l\'audio à l\'API');
        }

        const transcription = await response.json();

        chrome.runtime.sendMessage({
          type: "transcribe",
          target: "popup",
          data: transcription.data,
        });
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'audio:", error);
      }

      URL.revokeObjectURL(url);
      recorder = undefined;
      data = [];

      chrome.runtime.sendMessage({
        type: "recording-stopped",
        target: "service-worker",
      });
    };

    recorder.start();
    window.location.hash = "recording";

  } catch (error) {
    console.error("Error starting recording:", error);
    chrome.runtime.sendMessage({
      type: "recording-error",
      target: "popup",
      error: error.message,
    });
  }
}

async function stopRecording() {
  if (recorder && recorder.state === "recording") {
    recorder.stop();
  }

  await stopAllStreams();
  window.location.hash = "";
}

async function stopAllStreams() {
  activeStreams.forEach((stream) => {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  });

  activeStreams = [];
  await new Promise((resolve) => setTimeout(resolve, 100));
}


