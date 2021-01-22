function constructDate(mode, interval) {
    console.log("CALCULATING DATE")

    var todayDate = moment()
    var startDate = moment()
    var temp = ''
    if (mode == 1) {
        if (interval == 1) {
            console.log("subtracting a day")
            startDate.subtract(1, 'day')
        } else if (interval == 3) {
            console.log("subtracting 3 day")
            startDate.subtract(3, 'days')
        } else if (interval == 7) {
            console.log("subtracting a week")
            startDate.subtract(1, 'week')
        } else if (interval == 30) {
            console.log("subtracting a month")
            startDate.subtract(1, 'month')
        } else if (interval == 365) {
            console.log("subtracting a year")
            startDate.subtract(1, 'year')
        } else if (interval == 3650) {
            console.log("subtracting a decade")
            startDate.subtract(10, 'years')
        } else {
            console.error("Unavailable interval")
            return
        }

    } else if (mode == 2) {
        if (interval == 1) {
            console.log("start of the day")
            startDate.startOf('day')
        } else if (interval == 7) {
            console.log("start of the week")

            startDate.startOf('week')
        } else if (interval == 30) {
            console.log("start of the month")

            startDate.startOf('month')
        } else if (interval == 365) {
            console.log("start of the year")

            startDate.startOf('year')
        } else {
            console.error("Unavailable interval")
            return
        }
    }

    // console.log("start date", startDate)
    // console.log("today date", todayDate)
    console.log("RETURNING DATE")


    temp = '&tbs=cdr' + encodeURIComponent(':1,cd_min:' + startDate.format('L') + ",cd_max:" + todayDate.format('L'))
    return temp
}

async function getLocalStorageValue(key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.get(key, function (value) {
                resolve(value[key]);
            })
        } catch (ex) {
            console.log(ex)
            reject(ex);
        }
    });
}

function returnActive(state) {
    console.log("return active triggered")
    chrome.runtime.sendMessage({
        isActive: state
    }, function (response) {
        console.log("sending active state:", state)
    })
}

function returnMode(state) {
    console.log("return mode triggered")
    chrome.runtime.sendMessage({
        mode: state
    }, function (response) {
        console.log("sending mode:", state)
    })
}

function returnInterval(state) {
    console.log("return interval triggered")
    chrome.runtime.sendMessage({
        interval: state
    }, function (response) {
        console.log("sending interval:", state)
    })
}

function Cleaning(link) {
    console.log("cleaning link", link)
    var linkCheck = new RegExp('(&tbs=[^&]*)')
    var cleanLink = link
    while (linkCheck.test(cleanLink)) {
        cleanLink = cleanLink.replace(linkCheck, "")
    }
    console.log("returning clean link", cleanLink)
    return cleanLink
}



function SendToContent(link) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            link: link
        }, function (response) {
            console.log("Sending link back to content");
        });
    });
}

function ReloadContent() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            reload: true
        }, function (response) {
            console.log("Sending reload back to content");
        });
    });
}

async function SaveToStorage(active, mode, interval) {
        console.log("runtime onmessage triggered, request:", "active:", active, "mode:", mode, "interval:", interval)
        
        await chrome.storage.sync.set({
            isActive: active,
            mode: mode,
            interval: interval
        }, function () {
            console.log("Settings are saved!")
        })
    };


let isRunning = ''
let mode = ''
let interval = ''
let cleanLink = ''
var currentLink = ''


async function LetsFuckingGo() {
    chrome.runtime.onMessage.addListener(
        async function (request, sender, sendResponse) {
            console.log('⚡ [START] received link from Content')
            console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
            if (request.currentLink) {
                console.log("Current link exists in the request", request.currentLink)
                currentLink = request.currentLink

                isRunning = await getLocalStorageValue("isActive");
                mode = await getLocalStorageValue('mode')
                interval = await getLocalStorageValue('interval')

                console.log("[Current storage values] isRunning:", isRunning)
                console.log("[Current storage values] mode:", mode)
                console.log("[Current storage values] interval:", interval)

                var linkCheck = new RegExp('(&tbs=[^&]*)')
                var linkExist = linkCheck.test(currentLink)
                var newDate = constructDate(mode, interval)
                var match = currentLink.includes(newDate)
                console.log('current link is', currentLink)
                cleanLink = currentLink.replace(linkCheck, "")
                console.log('clean link is', cleanLink)

                if (isRunning && mode && interval) {
                    console.log("IS RUNNING")
                    console.log("current settings: is active:", isRunning, "mode", mode, "interval", interval)

                    if (match == false) {
                        currentLink = Cleaning(currentLink)
                        var fullLink = currentLink + newDate
                        SendToContent(fullLink)
                    } else {
                        // не обновлять, нужный интервал есть в ссылке
                    }

                } else {
                    console.warn("No enough conditions")
                    if (currentLink != cleanLink) {
                        console.log("Clean link", cleanLink)
                        SendToContent(cleanLink)
                    }
                }

            }
        }
    );


    // POPUP запущен, слушаем сообщения
    chrome.runtime.onConnect.addListener(function (port) {
        console.assert(port.name == "interface");
        port.onMessage.addListener(function (msg) {
            console.log("☎️ [POPUP REQUEST] getting values from popup", msg)
            if (msg.request == "Initial") {
                console.log("[POPUP REQUEST] Initial: request for values, returning:", isRunning, mode, interval)
                port.postMessage({
                    isRunning: isRunning,
                    mode: mode,
                    interval: interval
                });
            }
            else if (msg.isRunning) {
                console.log("[POPUP RETURN] running exists")
                SaveToStorage(true, msg.mode, msg.interval)
                ReloadContent()
            } else {
                console.log("[POPUP RETURN] running doesnt exist")
                SaveToStorage(false, msg.mode, msg.interval)
                ReloadContent()

                // return clean link
            }
        });
    });

}

console.log("Background is loadad")
LetsFuckingGo()
