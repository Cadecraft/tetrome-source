// Listen for checkForWord request
/*chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.action === "checkForWord") {
            checkForWord(request, sender, sendResponse);
            // Required to use sendResponse asynchronously
            return true;
        }
    }
);*/