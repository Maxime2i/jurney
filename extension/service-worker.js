chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target === "service-worker") {
    switch (message.type) {
      case "request-recording":
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
            chrome.runtime.sendMessage({
              type: "recording-error",
              target: "offscreen",
              error:
                "Cannot record Chrome system pages. Please try on a regular webpage.",
            });
            return;
          }

          await chrome.tabs.update(tab.id, {});

          const streamId = await chrome.tabCapture.getMediaStreamId({
            targetTabId: tab.id,
          });

          chrome.runtime.sendMessage({
            type: "start-recording",
            target: "offscreen",
            data: streamId,
          });

        } catch (error) {
          chrome.runtime.sendMessage({
            type: "recording-error",
            target: "offscreen",
            error: error.message,
          });
        }
        break;

     
    }
  }
});
