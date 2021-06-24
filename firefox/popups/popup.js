document.addEventListener('DOMContentLoaded', function () {

    browser.runtime.sendMessage({action: "bg_popup_opened", detail: "popup.html"}, function(response) {

    });

    var settings_btn = document.getElementById('TP_popup_settings_btn');
    settings_btn.addEventListener('click', (event) => {
        var errString = "Could not establish connection. Receiving end does not exist.";
        browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
            browser.tabs.sendMessage(tabs[0].id, {action: 'tp_open_settings'}, {}, (response) => {
                var lastError = browser.runtime.lastError;
                if (lastError && lastError.message === errString) {
                    browser.storage.local.set({'shouldShowSettings': true}, function() {

                    });
                    browser.tabs.create({url:'https://www.twitch.tv/'});
                }
                window.close();
            })
        });
    });
});
