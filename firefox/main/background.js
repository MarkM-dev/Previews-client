

var HEART_BEAT_INTERVAL_MS = 325000;
var lastHeartBeat = new Date().getTime() - HEART_BEAT_INTERVAL_MS;

var options = {
    isSidebarPreviewsEnabled: true,
    isImagePreviewMode: true,
    PREVIEWDIV_WIDTH: 440,
    PREVIEWDIV_HEIGHT: 248,
    isDirpEnabled: true,
    isChannelPointsClickerEnabled: false,
    isErrRefreshEnabled: false,
    isSidebarExtendEnabled: false,
    isSidebarSearchEnabled: false,
    isPvqcEnabled: false,
    isfScrnWithChatEnabled: false,
    isSelfPreviewEnabled: false,
    selfPreviewStreamName: '',
    isPredictionsNotificationsEnabled: false,
    isPredictionsSniperEnabled: false,
    aps_percent: 0.1,
    aps_max_points: 10000,
    aps_secondsBefore: 10,
    aps_min_vote_margin_percent: 15
};

chrome.browserAction.onClicked.addListener(function(tab) {

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

});

browser.runtime.onInstalled.addListener(function(details) {
    var manifestData = browser.runtime.getManifest();
    var appVer = "v" + manifestData.version;

     browser.storage.local.get('tp_options', function(result) {
        if (typeof result.tp_options == 'undefined') {
            browser.storage.local.set({'tp_options': options}, function() {

            });
        } else {
            // upgrade db.
            var loaded_options = result.tp_options;
            var bSetToStorage = false;
            Object.keys(options).forEach(function(key,index) {
                if (!Object.prototype.hasOwnProperty.call(loaded_options, key)) {
                    loaded_options[key] = options[key];
                    bSetToStorage = true;
                }
            });

            if (bSetToStorage) {
                browser.storage.local.set({'tp_options': loaded_options}, function() {

                });
            }
        }
    });

    if (details.reason === "install") {

    } else {
        if (details.reason === "update") {

            if (details.previousVersion !== "1.9.3.0") {
                browser.storage.local.set({'shouldShowUpdatePopup': true}, function() {});
            }

           /* if (details.previousVersion === "1.5.1.6") {
                chrome.tabs.create({url:"../popups/updatePopup.html"});
            }*/
        }
    }
});

browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    switch(msg.action) {
        case "bg_update_isSidebarPreviewsEnabled":

            break;
        case "bg_update_isImagePreviewMode":

            break;
        case "bg_update_PREVIEWDIV_WIDTH":

            break;
        case "bg_update_isDirpEnabled":

            break;
        case "bg_update_isSelfPreviewEnabled":

            break;
        case "bg_update_isChannelPointsClickerEnabled":

            break;
        case "bg_update_isSidebarSearchEnabled":

            break;
        case "bg_update_isPvqcEnabled":

            break;
        case "bg_update_isSidebarExtendEnabled":

            break;
        case "bg_update_isfScrnWithChatEnabled":

            break;
        case "bg_fScrnWithChat_click":

            break;
        case "bg_update_isErrRefreshEnabled":

            break;
        case "bg_update_isPredictionsNotificationsEnabled":

            break;
        case "bg_PN_show":

            break;
        case "bg_APS_exec":

            break;
        case "bg_APS_res":

            break;
        case "bg_update_isPredictionsSniperEnabled":

            break;
        case "bg_update_aps_percent":

            break;
        case "bg_update_aps_max_points":

            break;
        case "bg_update_aps_min_vote_margin_percent":

            break;
        case "bg_update_aps_secondsBefore":

            break;
        case "bg_sBarS_btn_click":

            break;
        case "bg_popup_opened":

            break;
        case "bg_settings_opened":

            break;
        case "bg_APS_settings_menu_opened":

            break;
        case "bg_APS_settings_menu_vote_now_btn_click":

            break;
        case "bg_APS_settings_menu_cancel_upcoming_vote_btn_click":

            break;
        case "bg_APS_settings_menu_check_prediction_btn_click":

            break;
        case "bg_APS_settings_menu_update_aps_percent":

            break;
        case "bg_APS_settings_menu_update_aps_max_points":

            break;
        case "bg_APS_settings_menu_update_aps_min_vote_margin_percent":

            break;
        case "bg_APS_settings_menu_update_aps_secondsBefore":

            break;
        case "bg_pip_started":

            break;
        case "bg_errRefresh_exec":

            break;
        case "updateToast":

            break;
        case "updateToast_settings_btn_click":

            break;
        case "bg_translate_infoDiv":
            browser.tabs.create({url:msg.detail});
            break;
        case "bg_show_rate":
            browser.tabs.create({url:"https://addons.mozilla.org/en-US/firefox/addon/twitchpreviews/"});
            break;
        case "bg_show_share":
            browser.tabs.create({url:"https://addons.mozilla.org/en-US/firefox/addon/twitchpreviews/"});
            break;
        case "bg_show_github":
            browser.tabs.create({url:"https://github.com/MarkM-dev/Twitch-Previews"});
            break;
        case "bg_show_bugReport":
            browser.tabs.create({url:"https://github.com/MarkM-dev/Twitch-Previews/issues"});
            break;
        case "appStart":

            break;
        case "heartbeat":

            break;
        case "bg_donate_btn_click":

            break;
        case "bg_rate_btn_click":

            break;
        case "bg_share_btn_click":

            break;
        case "bg_github_btn_click":

            break;
        case "bg_bugReport_btn_click":

            break;
        case "bg_changelog_btn_click":

            break;
        case "bg_contact_btn_click":

            break;
        default:
    }
    sendResponse({ result: "any response from background" });
    return true;
});
