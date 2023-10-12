// Function to execute the content script on the current tab
function executeContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["Readability.js", "mark.min.js", "contentScript.js"],
  });
}

function keepBackgroundPeristent()
{
  browser.runtime.onInstalled.addListener(() => {
  browser.alarms.create("refresh", { periodInMinutes: 0.2 });
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refresh") {
    console.log("Keeping background persistent")
  }
});
}

// Listen for the browser action (when the extension icon is clicked)
chrome.action.onClicked.addListener((tab) => {
  // Execute the content script on the current tab
  executeContentScript(tab.id);
});

keepBackgroundPeristent();

// Listen for messages from the content script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(message);
  fetch('https://app.biasscanner.org:8080', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "type": message.type,
      "text": message.text,
      "url": message.url
    })
  })
  .then((response) => response.text())
  .then((answer) => {
    // Returning true indicates that you will call sendResponse asynchronously.
    // This allows more time to respond to the message.
    sendResponse(answer);
    console.log("Sended answer!");
    return true;
  })
  .catch((error) => {
    // Handle errors here if needed.
    console.error(error);
    return true;
  });

  // Return true to indicate that sendResponse will be used asynchronously.
  return true;
});






