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
        socket.close()
       
          alert('Transcription ended')
  
       
        // stopRecording();
        break;
      default:
        throw new Error("Unrecognized message:", message.type);
    }
  }
});

let socket



async function startRecording(){

  navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(async screenStream => {
    if(screenStream.getAudioTracks().length == 0) return alert('You must share your tab with audio. Refresh the page.')

    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const audioContext = new AudioContext()
    const mixed = mix(audioContext, [screenStream, micStream])
    const recorder = new MediaRecorder(mixed, { mimeType: 'audio/webm' })

    socket = new WebSocket('wss://api.deepgram.com/v1/listen?language=fr', ['token', "3d8c2608786640ac493a1e902680e5727f3a1642"])

    recorder.addEventListener('dataavailable', evt => {
        if(evt.data.size > 0 && socket.readyState == 1) socket.send(evt.data)
    })

    socket.onopen = () => { recorder.start(250) }

    socket.onmessage = msg => {
        const { transcript } = JSON.parse(msg.data)?.channel?.alternatives[0]


        if(transcript) {
            localStorage.setItem("transcript", transcript)
          
               

                // Throws error when popup is closed, so this swallows the errors.
                chrome.runtime.sendMessage({ type: 'transcribe', target: 'popup' }).catch(err => ({}))
    
        }
    }
})




}





// https://stackoverflow.com/a/47071576
function mix(audioContext, streams) {
    const dest = audioContext.createMediaStreamDestination()
    streams.forEach(stream => {
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(dest);
    })
    return dest.stream
}
