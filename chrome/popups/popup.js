document.addEventListener('DOMContentLoaded', function () {

    chrome.runtime.sendMessage({action: "bg_popup_opened", detail: "popup.html"}, function(response) {

    });

    var settings_btn = document.getElementById('TP_popup_settings_btn');
    settings_btn.addEventListener('click', (event) => {
        var errString = "Could not establish connection. Receiving end does not exist.";
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'tp_open_settings'}, {}, (response) => {
                var lastError = chrome.runtime.lastError;
                if (lastError && lastError.message === errString) {
                    chrome.storage.local.set({'shouldShowSettings': true}, function() {

                    });
                    chrome.tabs.create({url:'https://www.twitch.tv/'});
                }
            })
        });
        window.close();
    });
});
