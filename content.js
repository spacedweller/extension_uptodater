console.log("content")

var currentLink = window.location.href

console.log("content link", currentLink)

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.link) {
            console.log("Current link exists in the request", request.link)
            window.open(request.link, "_self");
        } else if (request.reload) {
            document.location.reload()
        }
    }
);

chrome.runtime.sendMessage({currentLink: currentLink}, function(response) {
    console.log("sent a link to bg", response)
  });

