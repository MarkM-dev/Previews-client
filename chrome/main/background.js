(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-134155755-2', 'auto');

ga('set', 'checkProtocolTask', null);
ga('send', 'pageview', 'main');

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
    isPredictionsNotificationsEnabled: false,
    isPredictionsSniperEnabled: false,
    aps_percent: 0.1,
    aps_secondsBefore: 10,
    aps_min_vote_margin_percent: 15
};

function upgradeDB(optionsFromStorage, bSaveToStorage_default) {
    var loaded_options = optionsFromStorage;
    var bSetToStorage = bSaveToStorage_default;
    Object.keys(options).forEach(function(key,index) {
        if (!Object.prototype.hasOwnProperty.call(loaded_options, key)) {
            loaded_options[key] = options[key];
            bSetToStorage = true;
        }
    });

    if (bSetToStorage) {
        chrome.storage.local.set({'tp_options': loaded_options}, function() {

        });
    }
}

chrome.runtime.onInstalled.addListener(function(details) {
    var manifestData = chrome.runtime.getManifest();
    var appVer = "v" + manifestData.version;

     chrome.storage.local.get('tp_options', function(result) {
        if (typeof result.tp_options == 'undefined') {
            chrome.storage.sync.get('tp_options', function(syncResult) {
                if (typeof syncResult.tp_options == 'undefined') {
                    chrome.storage.local.set({'tp_options': options}, function() {

                    });
                } else {
                    upgradeDB(syncResult.tp_options, true);
                    chrome.storage.sync.remove('tp_options', function () {

                    });
                }
            });
        } else {
            upgradeDB(result.tp_options, false);
        }
    });

    if (details.reason === "install") {
        ga('send', 'event', 'tp_install', 'tp_install-' + appVer, 'tp_install-' + appVer);
    } else {
        if (details.reason === "update") {


            chrome.storage.local.set({'shouldShowUpdatePopup': true}, function() {});


           /* if (details.previousVersion === "1.5.1.6") {
                chrome.tabs.create({url:"../popups/updatePopup.html"});
                ga('send', 'event', 'updatePopup_show-' + appVer, 'updatePopup_show-' + appVer, 'updatePopup_show-' + appVer);
            }*/
            ga('send', 'event', 'updated-' + appVer, 'updated-' + appVer, 'updated-' + appVer);
        }
    }
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    switch(msg.action) {
        case "bg_update_isSidebarPreviewsEnabled":
            ga('send', 'event', 'sidebarPreview_mode', 'change', msg.detail ? "sBarPreview_ON":"sBarPreview_OFF");
            break;
        case "bg_update_isImagePreviewMode":
            ga('send', 'event', 'preview_mode', 'change', msg.detail ? "image":"video");
            break;
        case "bg_update_PREVIEWDIV_WIDTH":
            ga('send', 'event', 'preview_size', 'change', msg.detail + "px");
            break;
        case "bg_update_isDirpEnabled":
            ga('send', 'event', 'dirp_mode', 'change', msg.detail ? "dirp_ON":"dirp_OFF");
            break;
        case "bg_update_isChannelPointsClickerEnabled":
            ga('send', 'event', 'channelPointsClicker_mode', 'change', msg.detail ? "cpc_ON":"cpc_OFF");
            break;
        case "bg_update_isSidebarSearchEnabled":
            ga('send', 'event', 'sidebarSearch_mode', 'change', msg.detail ? "sBarSearch_ON":"sBarSearch_OFF");
            break;
        case "bg_update_isPvqcEnabled":
            ga('send', 'event', 'pvqc_mode', 'change', msg.detail ? "pvqc_ON":"pvqc_OFF");
            break;
        case "bg_update_isSidebarExtendEnabled":
            ga('send', 'event', 'sidebarExtend_mode', 'change', msg.detail ? "sBarExtend_ON":"sBarExtend_OFF");
            break;
        case "bg_update_isfScrnWithChatEnabled":
            ga('send', 'event', 'fScrnWithChat_mode', 'change', msg.detail ? "fScrnWithChat_ON":"fScrnWithChat_OFF");
            break;
        case "bg_fScrnWithChat_click":
            ga('send', 'event', 'fScrnWithChat_btn_click', 'fScrnWithChat_btn_click', 'fScrnWithChat_btn_click');
            break;
        case "bg_update_isErrRefreshEnabled":
            ga('send', 'event', 'errRefresh_mode', 'change', msg.detail ? "ErrRefresh_ON":"ErrRefresh_OFF");
            break;
        case "bg_update_isPredictionsNotificationsEnabled":
            ga('send', 'event', 'predictionsNotifications_mode', 'change', msg.detail ? "PN_ON":"PN_OFF");
            break;
        case "bg_PN_show":
            ga('send', 'event', 'predictionsNotifications_show', 'PN_show', 'PN_show');
            break;
        case "bg_APS_exec":
            ga('send', 'event', 'APS_exec', 'APS_exec', 'APS_exec');
            break;
        case "bg_APS_res":
            ga('send', 'event', 'APS_res', 'APS_res', "APS_res-" + msg.detail);
            break;
        case "bg_update_isPredictionsSniperEnabled":
            ga('send', 'event', 'APS_mode', 'change', msg.detail ? "APS_ON":"APS_OFF");
            break;
        case "bg_update_aps_percent":
            ga('send', 'event', 'APS_percent', 'change', msg.detail  + "%");
            break;
        case "bg_update_aps_min_vote_margin_percent":
            ga('send', 'event', 'APS_margin', 'change', msg.detail  + "%");
            break;
        case "bg_update_aps_secondsBefore":
            ga('send', 'event', 'APS_secondsBefore', 'change', msg.detail + "s");
            break;
        case "bg_sBarS_btn_click":
            ga('send', 'event', 'sBar_streamSearch_btn_click', 'sBar_streamSearch_btn_click', 'sBar_streamSearch_btn_click');
            break;
        case "bg_popup_opened":
            ga('send', 'event', 'popup_opened', 'popup.html', 'popup.html');
            break;
        case "bg_pip_started":
            ga('send', 'event', 'pip_started', 'pip_started', 'pip_started');
            break;
        case "bg_errRefresh_exec":
            ga('send', 'event', 'errRefresh_exec', 'errRefresh_exec', 'errRefresh_exec');
            break;
        case "updateToast":
            ga('send', 'event', 'updateToast', 'dismiss', msg.detail);
            break;
        case "bg_showRate":
            //chrome.tabs.create({url:"../popups/updatePopup.html"});
            chrome.tabs.create({url:"https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/reviews/"});
            break;
        case "bg_showShare":
            chrome.tabs.create({url:"https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/"});
            break;
        case "appStart":
            ga('send', 'event', 'appStart', 'content.js', msg.detail);
            break;
        case "heartbeat":
            if (new Date().getTime() - lastHeartBeat >= HEART_BEAT_INTERVAL_MS - 500) {
                ga('send', 'event', 'heartbeat', 'heartbeat');
                lastHeartBeat = new Date().getTime();
            }
            break;
        case "bg_donate_btn_click":
            ga('send', 'event', 'popup_donate_btn_click', 'popup_donate_btn_click', 'popup_donate_btn_click');
            break;
        case "bg_rate_btn_click":
            ga('send', 'event', 'popup_rate_btn_click', 'popup_rate_btn_click', 'popup_rate_btn_click');
            break;
        case "bg_share_btn_click":
            ga('send', 'event', 'popup_share_btn_click', 'popup_share_btn_click', 'popup_share_btn_click');
            break;
        default:
    }
    sendResponse({ result: "any response from background" });
    return true;
});
