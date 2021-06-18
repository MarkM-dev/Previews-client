function setFeatureTitles() {
    document.getElementById('tp_popup_feature_sBar_previews').title = "* Sidebar Previews\n" +
        "- Shows a live video or image preview when hovering over a stream on the sidebar (followed channels list on the side)";

    document.getElementById('tp_popup_feature_directory_previews').title = "* Directory Previews\n" +
        "- Shows a video stream preview when hovering over streams in twitch directories (channels in browsing directory, following, etc..).";

    document.getElementById('tp_popup_feature_cpc').title = "* Auto Channel Points Clicker\n" +
        "- This feature automatically clicks the green channel points redeem button.\n" +
        "- It also works when chat is closed and when the tab or window is in the background.";

    document.getElementById('tp_popup_feature_sBar_search').title = "* Sidebar Streamer Search\n" +
        "- A purple search button at the top of the sidebar to find live streamers easily.\n" +
        "- Searches within the currently shown streamers so the sidebar will automatically extend to show all live streamers when you start searching.";

    document.getElementById('tp_popup_feature_sBar_extend').title = "* Extend Sidebar\n" +
        "- Auto extends the sidebar to show all live streamers (when sidebar is open).";

    document.getElementById('tp_popup_feature_fScrnWithChat').title = "* Full screen with chat\n" +
        "- The button will show next to the 'theater mode' button in the player controls.\n" +
        "- Clicking it will toggle browser fullscreen (like F11), theater mode and chat.\n" +
        "- You can exit the mode by clicking the button again or double-tapping ESC.\n" +
        "- When exiting the mode, your chat will go back to what it was before you entered 'fullscreen with chat' (unless you closed chat while in mode - then it will remain closed).";

    document.getElementById('tp_popup_feature_errRefresh').title = "* Auto Refresh On Errors (#1000, #2000, #4000)\n" +
        "- This feature works when the tab with the player that got an error is currently active.\n" +
        "- If the player got an error while the tab was not active (in the background or chrome wasn't the active window) the page will automatically refresh when you come back to it.";

    document.getElementById('tp_popup_feature_pvqc').title = "* Prevent Automatic Video Quality Change\n" +
        "- Prevents automatic video quality change when twitch is in the background (when switching tabs / tasks).\n" +
        "- Notes on behavior with other features:\n" +
        "- Auto refresh - if you have this enabled with auto-refresh enabled, the auto-refresh feature will refresh immediately upon error instead of waiting for you to return to the twitch tab if it wasn't focused (this is a better behavior).\n" +
        "- Predictions notifications - if you have this enabled with predictions notifications enabled, predictions notifications will show even when chat is open in a focused twitch tab."

    document.getElementById('tp_popup_feature_predictions').title = "* Predictions Notifications" +
        "\n- Predictions started and Predictions results notifications when you don't know it's happening (for example if your chat is closed or you are not in the tab or browser)." +
        "\n- Works on twitch tabs in the browser." +
        "\n- When enabling the feature, you will need to allow notification permissions for twitch.tv (a prompt will show - if not, click on the lock icon on the left of the url and check if it's allowed there)."

    document.getElementById('tp_popup_feature_predictionsSniper').title = "* Predictions Sniper" +
        "\n- The predictions sniper will participate in predictions for you." +
        "\n- Works on twitch tabs in the browser." +
        "\n- The sniper will choose the option with the most amount of votes at the time of entry (x seconds before prediction closes)." +
        "\n- If you have chat open (no need), you will see the prediction menu for a split second when the sniper is entering a prediction." +
        "\n- You can enable the 'Predictions notifications' feature if you want to know what's happening in real-time." +
        "\nSettings:" +
        "\nBet % - the percentage of channel points you want the sniper to bet." +
        "\nMin vote margin % - a percentage representation of the minimum required vote margin between the two prediction options for the sniper to participate." +
        "\nFor example: option A- 100 votes, option B- 115 votes, vote spread: A-46.51% B-53.49%, vote margin: 6.98% (53.49% - 46.51%). if the Min vote margin is lower than 6.98%, the sniper will participate." +
        "\nSeconds - the amount of seconds the sniper will make a prediction before the prediction closes (min 2s)."

}

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
                    console.log('no content');
                }
            })
        });
        window.close();
    });
});
