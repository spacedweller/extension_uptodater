document.addEventListener('DOMContentLoaded', function () {
    console.log("Document finished loading")

    var port = chrome.runtime.connect({
        name: "interface"
    });
    port.postMessage({
        request: "Initial"
    });
    port.onMessage.addListener(function (msg) {
        console.log("initial returning msg:", msg)
        if (msg.mode && msg.interval) {
            console.log("Last settings are", msg)
            $('#activebox').prop('checked', msg.isRunning)
            $('#mode').val(msg.mode)
            $('#interval').val(msg.interval)
        }
    });

    document.getElementById('activebox').addEventListener('change', onChange, false)
    document.getElementById('mode').addEventListener('change', onChange, false)
    document.getElementById('interval').addEventListener('change', onChange, false)

    function onChange() {
        console.log("Changed value")
        var isRunning = $('#activebox:checked').val();
        var mode = $('#mode').val()
        var interval = $('#interval').val()
        console.log("[Current popup values] isRunning:", isRunning)
        console.log("[Current popup values] mode:", mode)
        console.log("[Current popup values] interval:", interval)
        if (mode && interval) {
            console.log("☎️ sending values to background", isRunning, mode, interval)
            port.postMessage({
                isRunning: isRunning,
                mode: mode,
                interval: interval
            })
        }
    }    
});


