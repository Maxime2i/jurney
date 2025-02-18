let interval;
let timeLeft;

const displayStatus = function() { //function to handle the display of time and buttons
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const startButton = document.getElementById('start');

  
      chrome.runtime.sendMessage({currentTab: tabs[0].id}, (response) => {
        if(!response) {
          startButton.style.display = "block";
        }
      });
    // }
  });
}

const parseTime = function(time) { //function to display time remaining or time elapsed
  let minutes = Math.floor((time/1000)/60);
  let seconds = Math.floor((time/1000) % 60);
  if (minutes < 10 && minutes >= 0) {
    minutes = '0' + minutes;
  } else if (minutes < 0) {
    minutes = '00';
  }
  if (seconds < 10 && seconds >= 0) {
    seconds = '0' + seconds;
  } else if (seconds < 0) {
    seconds = '00';
  }
  return `${minutes}:${seconds}`
}

//manipulation of the displayed buttons upon message from background
chrome.runtime.onMessage.addListener((request, sender) => {

  if (request.type === "apiResponse") {
    console.log(request.data);
    const responseContainer = document.getElementById('apiResponse'); // Assurez-vous d'avoir cet élément dans votre HTML
    responseContainer.value += JSON.stringify(request.data.data.error.message, null, 2); // Écrit la réponse formatée dans l'input
  }



  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const startButton = document.getElementById('start');
    if(request.captureStarted && request.captureStarted === tabs[0].id) {
     
      startButton.style.display = "none";
    } else if(request.captureStopped && request.captureStopped === tabs[0].id) {
      startButton.style.display = "block";
    }
  });
});


//initial display for popup menu when opened
document.addEventListener('DOMContentLoaded', function() {
  displayStatus();
  const startButton = document.getElementById('start');

  const stopAllButton = document.getElementById('stopAllRecordings');
  startButton.onclick = () => {chrome.runtime.sendMessage("startCapture")};

  stopAllButton.onclick = () => {
    chrome.runtime.sendMessage({ command: "stopAllRecordings" });
  };
 
  

  // Écouteur pour le bouton d'envoi
  const sendButton = document.getElementById('sendApiResponse');
  sendButton.onclick = () => {



    const responseContainer = document.getElementById('apiResponse');
    const contentToSend = responseContainer.innerText;

    // Envoyer le contenu à l'API
    fetch('http://localhost:1500/api/chatgpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: contentToSend })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Réponse de l\'API:', data);
      // Vous pouvez afficher une notification ou un message de succès ici
      const response = document.getElementById('response'); // Assurez-vous d'avoir cet élément dans votre HTML
      response.innerText += JSON.stringify(data, null, 2); // Écrit la réponse formatée dans l'input
    
    })
    .catch(error => {
      console.error('Erreur lors de l\'envoi:', error);
      const response = document.getElementById('response'); // Assurez-vous d'avoir cet élément dans votre HTML
      response.innerText += JSON.stringify(error, null, 2);
    });
  };


  
});
