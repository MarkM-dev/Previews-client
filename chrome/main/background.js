(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-134155755-2', 'auto');

ga('set', 'checkProtocolTask', null);
ga('send', 'pageview', 'main');

var HEART_BEAT_INTERVAL_MS = 325000;
var lastHeartBeat = new Date().getTime() - HEART_BEAT_INTERVAL_MS;

chrome.runtime.onInstalled.addListener(function(details) {
    var manifestData = chrome.runtime.getManifest();
    var appVer = "v" + manifestData.version;
    
    if (details.reason === "install")
    {
        ga('send', 'event', 'tp_install', 'tp_install-' + appVer, 'tp_install-' + appVer);
    } else {
        if (details.reason === "update") {
            if (details.previousVersion === "1.5.1.6") {
                chrome.tabs.create({url:"../popups/updatePopup.html"});
                ga('send', 'event', 'updatePopup_show-' + appVer, 'updatePopup_show-' + appVer, 'updatePopup_show-' + appVer);
            }
            ga('send', 'event', 'updated-' + appVer, 'updated-' + appVer, 'updated-' + appVer);
        }
    }
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    switch(msg.action) {
        case "bg_update_imagePreviewMode":
            ga('send', 'event', 'preview_mode', 'change', msg.detail ? "image":"video");
            break;
        case "bg_update_directoryPreviewMode":
            ga('send', 'event', 'dirp_mode', 'change', msg.detail ? "dirp_ON":"dirp_OFF");
            break;
        case "bg_update_isErrRefreshEnabled":
            ga('send', 'event', 'errRefresh', 'change', msg.detail ? "ErrRefresh_ON":"ErrRefresh_OFF");
            break;
        case "bg_update_previewSize":
            ga('send', 'event', 'preview_size', 'change', msg.detail);
            break;
        case "bg_popup_opened":
            ga('send', 'event', 'popup_opened', 'popup.html');
            break;
        case "bg_pip_started":
            ga('send', 'event', 'pip_started', 'pip_started');
            break;
        case "bg_errRefresh_exec":
            ga('send', 'event', 'errRefresh_exec', 'errRefresh_exec');
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
            ga('send', 'event', 'popup_donate_btn_click', 'popup_donate_btn_click');
            break;
        case "bg_rate_btn_click":
            ga('send', 'event', 'popup_rate_btn_click', 'popup_rate_btn_click');
            break;
        case "bg_share_btn_click":
            ga('send', 'event', 'popup_share_btn_click', 'popup_share_btn_click');
            break;
        default:
    }
    sendResponse({ result: "any response from background" });
    return true;
});
