(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-134155755-2', 'auto');
ga('set', 'checkProtocolTask', null);
ga('send', 'pageview', 'main');

function send_ga_event(category, action, value) {
    ga('send', 'event', category, action, value);
}

let tpga_browser = 'chrome';

let isFirefox = typeof browser !== "undefined";
let _browser = isFirefox ? browser : chrome;

let HEART_BEAT_INTERVAL_MS = 325000;
let lastHeartBeat = new Date().getTime() - HEART_BEAT_INTERVAL_MS;
let YT_FETCH_INTERVAL_MS = 300000;
let lastYTFetch = new Date().getTime() - YT_FETCH_INTERVAL_MS;
let cached_yt_live_streams_arr = null;

let optionsDisabledForFirefox = ['isPipEnabled','isCastEnabled', 'isRecordEnabled'];

let options = {
    selected_lang: 'en',
    isSidebarPreviewsEnabled: true,
    isImagePreviewMode: true,
    PREVIEWDIV_WIDTH: 440,
    PREVIEWDIV_HEIGHT: 248,
    isDirpEnabled: true,
    isChannelPointsClickerEnabled: false,
    isErrRefreshEnabled: false,
    isSidebarFavoritesEnabled: false,
    sidebarFavorites_hide_originals: false,
    isSidebarExtendEnabled: false,
    isSidebarSearchEnabled: false,
    isSidebarHideSectionsEnabled: false,
    isMuteAutoPlayersEnabled: false,
    isPvqcEnabled: false,
    isClipDownloaderEnabled: false,
    isYTsidebarEnabled: false,
    isfScrnWithChatEnabled: false,
    isPipEnabled: false,
    isScreenshotEnabled: false,
    isRecordEnabled: false,
    isFlashBangDefenderEnabled: false,
    isFastForwardEnabled: false,
    isSeekEnabled: false,
    isCastEnabled: false,
    isClearChatEnabled: false,
    isIncognitoChatEnabled: false,
    isMultiStreamEnabled: false,
    isAdvancedVideoEmbedsEnabled: false,
    isSelfPreviewEnabled: false,
    selfPreviewStreamName: '',
    isPredictionsNotificationsEnabled: false,
    isPredictionsSniperEnabled: false,
    aps_percent: 0.1,
    aps_max_points: 10000,
    aps_secondsBefore: 10,
    aps_min_vote_margin_percent: 15
};

function handleTabUpdateForClipDownloader(tabId, changeInfo, tabInfo) {
    if (changeInfo.status && changeInfo.status === 'complete') {
        if (tabInfo.url && tabInfo.url.indexOf('https://clips.twitch.tv') > -1) {
            _browser.tabs.executeScript(tabId, {
                file: 'main/cd.js'
            });
            _browser.tabs.insertCSS(tabId, {
                file: 'main/cd.css'
            });
        }
    }
}

function removeListenersForClipDownloader() {
    _browser.tabs.onUpdated.removeListener(handleTabUpdateForClipDownloader);
}

function setListenersForClipDownloader() {
    _browser.tabs.onUpdated.addListener(handleTabUpdateForClipDownloader);
}

function checkShouldStartCdListeners() {
    _browser.storage.local.get('tp_options', function(result) {
        if (result.tp_options && result.tp_options.isClipDownloaderEnabled) {
            setListenersForClipDownloader();
        }
    });
}

_browser.browserAction.onClicked.addListener(function(tab) {

        let errString = "Could not establish connection. Receiving end does not exist.";
        _browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
            _browser.tabs.sendMessage(tabs[0].id, {action: 'tp_open_settings'}, {}, (response) => {
                let lastError = _browser.runtime.lastError;
                if (lastError && lastError.message === errString) {
                    _browser.storage.local.set({'shouldShowSettings': true}, function() {

                    });
                    _browser.tabs.create({url:'https://www.twitch.tv/'});
                }
            })
        });

});

function getNavigatorLangSelection() {
    switch (navigator.language) {
        case 'es':
            return 'es';
        case 'es-ES':
            return 'es';
        case 'fr':
            return 'fr';
        case 'fr_FR':
            return 'fr';
        case 'de':
            return 'de';
        case 'de-DE':
            return 'de';
        case 'pt_BR':
            return 'pt_BR';
        case 'ru':
            return 'ru';
        case 'ru_RU':
            return 'ru';
        default:
            return 'en';
    }
}

function upgradeDB(loaded_options) {
    let bSetToStorage = false;
    Object.keys(options).forEach(function(key,index) {
        if (!Object.prototype.hasOwnProperty.call(loaded_options, key)) {
            loaded_options[key] = options[key];
            bSetToStorage = true;
        }
    });

    return {bSetToStorage: bSetToStorage, upgraded_options: loaded_options}
}

_browser.runtime.onInstalled.addListener(function(details) {
    let manifestData = _browser.runtime.getManifest();
    let appVer = "v" + manifestData.version;


    if (details.reason === "install") {
        options.selected_lang = getNavigatorLangSelection();
        _browser.storage.local.set({'tp_options': options}, function() {});

        send_ga_event('tp_install', 'tp_install-' + appVer, 'tp_install-' + appVer + ' - ' + tpga_browser);
        _browser.storage.local.set({'isFTE': true}, function() {});
        _browser.storage.local.set({'shouldShowSettings': true}, function() {});
        _browser.storage.local.set({'shouldShowNewFeatureSettingsSpan': true}, function() {});
        _browser.storage.local.set({'shouldShowDelayedRateToast': true}, function() {});
        _browser.storage.local.set({'tpInstallTime': new Date().getTime()}, function() {});
    } else {
        if (details.reason === "update") {

            _browser.storage.local.get('tp_options', function(result) {
                // upgrade db.
                let new_db_container_obj = upgradeDB(result.tp_options);
                if (new_db_container_obj.bSetToStorage) {
                    _browser.storage.local.set({'tp_options': new_db_container_obj.upgraded_options}, function() {

                    });
                }
            });

            if (!isFirefox) {
                _browser.storage.local.set({'shouldShowUpdatePopup': true}, function() {});
                _browser.storage.local.set({'shouldShowNewFeatureSettingsSpan': true}, function() {});
                _browser.storage.local.set({'shouldShowDelayedRateToast': false}, function() {});
            }

            _browser.storage.local.get('tpInstallTime', function(result) {
                if (!result.tpInstallTime) {
                    _browser.storage.local.set({'shouldShowDelayedRateToast': true}, function() {});
                    _browser.storage.local.set({'tpInstallTime': new Date().getTime()}, function() {});
                }
            });


           /* if (details.previousVersion === "1.5.1.6") {
                _browser.tabs.create({url:"../popups/updatePopup.html"});
                ga('send', 'event', 'updatePopup_show-' + appVer, 'updatePopup_show-' + appVer, 'updatePopup_show-' + appVer);
            }*/
            send_ga_event( 'updated-' + appVer, 'updated-' + appVer, 'updated-' + appVer + ' - ' + tpga_browser);
        }
    }
});

_browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    switch(msg.action) {
        case "bg_update_isSidebarPreviewsEnabled":
            send_ga_event('sidebarPreview_mode', 'change', msg.detail ? "sBarPreview_ON":"sBarPreview_OFF");
            break;
        case "bg_update_selected_lang":
            send_ga_event('selected_lang_mode', 'change', msg.detail);
            break;
        case "bg_update_isImagePreviewMode":
            send_ga_event('preview_mode', 'change', msg.detail ? "image":"video");
            break;
        case "bg_update_PREVIEWDIV_WIDTH":
            send_ga_event('preview_size', 'change', msg.detail + "px");
            break;
        case "bg_update_isDirpEnabled":
            send_ga_event('dirp_mode', 'change', msg.detail ? "dirp_ON":"dirp_OFF");
            break;
        case "bg_update_isSelfPreviewEnabled":
            send_ga_event('selfPreview_mode', 'change', msg.detail ? "SP_ON":"SP_OFF");
            break;
        case "bg_update_isChannelPointsClickerEnabled":
            send_ga_event('channelPointsClicker_mode', 'change', msg.detail ? "cpc_ON":"cpc_OFF");
            break;
        case "bg_update_isSidebarSearchEnabled":
            send_ga_event('sidebarSearch_mode', 'change', msg.detail ? "sBarSearch_ON":"sBarSearch_OFF");
            break;
        case "bg_update_isSidebarHideSectionsEnabled":
            send_ga_event('sidebarHideSections_mode', 'change', msg.detail ? "sBarHS_ON":"sBarHS_OFF");
            break;
        case "bg_update_isMuteAutoPlayersEnabled":
            send_ga_event('autoMuteAutoPlayers_mode', 'change', msg.detail ? "mautop_ON":"mautop_OFF");
            break;
        case "bg_update_isPvqcEnabled":
            send_ga_event('pvqc_mode', 'change', msg.detail ? "pvqc_ON":"pvqc_OFF");
            break;
        case "bg_update_isSidebarExtendEnabled":
            send_ga_event('sidebarExtend_mode', 'change', msg.detail ? "sBarExtend_ON":"sBarExtend_OFF");
            break;
        case "bg_update_isSidebarFavoritesEnabled":
            send_ga_event('sidebarFavorites_mode', 'change', msg.detail ? "sBarFavorites_ON":"sBarFavorites_OFF");
            break;
        case "bg_update_sidebarFavorites_hide_originals":
            send_ga_event('sidebarFavorites_og_mode', 'change', msg.detail ? "sBarFavorites_og_ON":"sBarFavorites_og_OFF");
            break;
        case "bg_update_isfScrnWithChatEnabled":
            send_ga_event('fScrnWithChat_mode', 'change', msg.detail ? "fScrnWithChat_ON":"fScrnWithChat_OFF");
            break;
        case "bg_update_isClipDownloaderEnabled":
            send_ga_event('clipDownloader_mode', 'change', msg.detail ? "CDL_ON":"CDL_OFF");
            break;
        case "bg_update_isYTsidebarEnabled":
            send_ga_event('YTsidebar_mode', 'change', msg.detail ? "YTSB_ON":"YTSB_OFF");
            break;
        case "bg_open_YT_stream":
            _browser.tabs.create({url:msg.detail});
            break;
        case "bg_fScrnWithChat_started":
            send_ga_event('fScrnWithChat_started', 'fScrnWithChat_started', 'fScrnWithChat_started_' + msg.detail);
            break;
        case "bg_favorite_btn_click":
            send_ga_event('favorite_btn_click', 'favorite_btn_click', msg.detail ? 'favorite_add' : 'favorite_remove');
            break;
        case "bg_clip_download_btn_click":
            send_ga_event('clip_download_btn_click', 'clip_download_btn_click', 'clip_download_btn_click');
            break;
        case "bg_update_isMultiStreamEnabled":
            send_ga_event('multiStream_mode', 'change', msg.detail ? "multiStream_ON":"multiStream_OFF");
            break;
        case "bg_update_isAdvancedVideoEmbedsEnabled":
            send_ga_event('advancedVideoEmbeds_mode', 'change', msg.detail ? "ave_ON":"ave_OFF");
            break;
        case "bg_update_isPipEnabled":
            send_ga_event('pip_main_mode', 'change', msg.detail ? "pip_main_ON":"pip_main_OFF");
            break;
        case "bg_update_isScreenshotEnabled":
            send_ga_event('screenshot_mode', 'change', msg.detail ? "screenshot_ON":"screenshot_OFF");
            break;
        case "bg_screenshot_btn_click":
            send_ga_event('screenshot_btn_click', 'screenshot_btn_click', 'screenshot_btn_click');
            break;
        case "bg_update_isRecordEnabled":
            send_ga_event('record_mode', 'change', msg.detail ? "rec_ON":"rec_OFF");
            break;
        case "bg_record_btn_click":
            send_ga_event('record_btn_click', 'record_btn_click', 'record_btn_click');
            break;
        case "bg_update_isFlashBangDefenderEnabled":
            send_ga_event('fbd_mode', 'change', msg.detail ? "fbd_ON":"fbd_OFF");
            break;
        case "bg_flashBangDefender_btn_click":
            send_ga_event('fbd_btn_click', 'fbd_btn_click', 'fbd_btn_click');
            break;
        case "bg_update_isCastEnabled":
            send_ga_event('cast_mode', 'change', msg.detail ? "cast_ON":"cast_OFF");
            break;
        case "bg_cast_btn_click":
            _browser.tabs.create({url:msg.detail});
            send_ga_event('cast_btn_click', 'cast_btn_click', 'cast_btn_click');
            break;
        case "bg_update_isClearChatEnabled":
            send_ga_event('clearChat_mode', 'change', msg.detail ? "clearChat_ON":"clearChat_OFF");
            break;
        case "bg_update_isIncognitoChatEnabled":
            send_ga_event('incognitoChat_mode', 'change', msg.detail ? "incognitoChat_ON":"incognitoChat_OFF");
            break;
        case "bg_update_isFastForwardEnabled":
            send_ga_event('fast_forward_mode', 'change', msg.detail ? "fast_forward_ON":"fast_forward_OFF");
            break;
        case "bg_update_isSeekEnabled":
            send_ga_event('seek_mode', 'change', msg.detail ? "seek_ON":"seek_OFF");
            break;
        case "bg_multiStream_btn_click":
            _browser.tabs.create({url:msg.detail});
            send_ga_event('multiStream_btn_click', 'multiStream_btn_click', 'multiStream_btn_click');
            break;
        case "bg_incognito_chat_btn_click":
            _browser.windows.create({url:"https://www.twitch.tv/popout/" + msg.detail.stream_name + "/chat", incognito: true, top:msg.detail.top, left: msg.detail.left, height: msg.detail.height, width: msg.detail.width, type: "popup"});
            send_ga_event('incognitoChat_btn_click', 'incognitoChat_btn_click', 'incognitoChat_btn_click');
            setTimeout(function () {
                sendResponse({ result: "any response from background" });
            }, 1000);
            break;
        case "bg_searchBar_multiStream_started":
            send_ga_event('multiStream_searchBar_btn_click', 'multiStream_searchBar_btn_click', 'multiStream_searchBar_btn_click');
            break;
        case "bg_searchBar_multiStream_chat_started":
            send_ga_event('multiStream_chat_searchBar_btn_click', 'multiStream_chat_searchBar_btn_click', 'multiStream_chat_searchBar_btn_click');
            break;
        case "bg_multiStream_box_stream_started":
            send_ga_event('multiStream_box_stream_started', 'multiStream_box_stream_started', 'multiStream_box_stream_started');
            break;
        case "bg_multiStream_box_chat_started":
            send_ga_event('multiStream_box_chat_started', 'multiStream_box_chat_started', 'multiStream_box_chat_started');
            break;
        case "bg_update_isErrRefreshEnabled":
            send_ga_event('errRefresh_mode', 'change', msg.detail ? "ErrRefresh_ON":"ErrRefresh_OFF");
            break;
        case "bg_update_isPredictionsNotificationsEnabled":
            send_ga_event('predictionsNotifications_mode', 'change', msg.detail ? "PN_ON":"PN_OFF");
            break;
        case "bg_PN_show":
            send_ga_event('predictionsNotifications_show', 'PN_show', 'PN_show');
            break;
        case "bg_APS_exec":
            send_ga_event('APS_exec', 'APS_exec', 'APS_exec');
            break;
        case "bg_APS_res":
            send_ga_event('APS_res', 'APS_res', "APS_res-" + msg.detail);
            break;
        case "bg_update_isPredictionsSniperEnabled":
            send_ga_event('APS_mode', 'change', msg.detail ? "APS_ON":"APS_OFF");
            break;
        case "bg_update_aps_percent":
            send_ga_event('APS_percent', 'change', msg.detail  + "%");
            break;
        case "bg_update_aps_max_points":
            send_ga_event('APS_max_points', 'change', msg.detail);
            break;
        case "bg_update_aps_min_vote_margin_percent":
            send_ga_event('APS_margin', 'change', msg.detail  + "%");
            break;
        case "bg_update_aps_secondsBefore":
            send_ga_event('APS_secondsBefore', 'change', msg.detail + "s");
            break;
        case "bg_sBarS_btn_click":
            send_ga_event('sBar_streamSearch_btn_click', 'sBar_streamSearch_btn_click', 'sBar_streamSearch_btn_click');
            break;
        case "bg_popup_opened":
            send_ga_event('popup_opened', 'popup.html', 'popup.html');
            break;
        case "bg_settings_opened":
            send_ga_event('settings_opened', 'settings.html', 'settings.html');
            break;
        case "bg_APS_settings_menu_opened":
            send_ga_event('APS_settings_opened', 'APS_settings.html', 'APS_settings.html');
            break;
        case "bg_APS_settings_menu_vote_now_btn_click":
            send_ga_event('APS_s_vote_now_btn_click', 'APS_s_vote_now_btn_click', 'APS_s_vote_now_btn_click');
            break;
        case "bg_APS_settings_menu_cancel_upcoming_vote_btn_click":
            send_ga_event('APS_s_cancel_vote_btn_click', 'APS_s_cancel_vote_btn_click', 'APS_s_cancel_vote_btn_click');
            break;
        case "bg_APS_settings_menu_check_prediction_btn_click":
            send_ga_event('APS_s_check_prediction_btn_click', 'APS_s_check_prediction_btn_click', 'APS_s_check_prediction_btn_click');
            break;
        case "bg_APS_settings_menu_update_aps_percent":
            send_ga_event('APS_s_percent', 'change', msg.detail  + "%");
            break;
        case "bg_APS_settings_menu_update_aps_max_points":
            send_ga_event('APS_s_max_points', 'change', msg.detail);
            break;
        case "bg_APS_settings_menu_update_aps_min_vote_margin_percent":
            send_ga_event('APS_s_margin', 'change', msg.detail  + "%");
            break;
        case "bg_APS_settings_menu_update_aps_secondsBefore":
            send_ga_event('APS_s_secondsBefore', 'change', msg.detail + "s");
            break;
        case "bg_pip_started":
            send_ga_event('pip_started', 'pip_started', 'pip_started');
            break;
        case "bg_pip_main_started":
            send_ga_event('pip_main_started', 'pip_main_started', 'pip_main_started');
            break;
        case "bg_errRefresh_exec":
            send_ga_event('errRefresh_exec', 'errRefresh_exec', 'errRefresh_exec');
            break;
        case "updateToast":
            send_ga_event('updateToast_dismiss', 'dismiss', msg.detail);
            break;
        case "updateToast_rate_btn_click":
            send_ga_event('updateToast', 'updateToast_rate_btn_click', 'updateToast_rate_btn_click');
            break;
        case "updateToast_donate_btn_click":
            send_ga_event('updateToast', 'updateToast_donate_btn_click', 'updateToast_donate_btn_click');
            break;
        case "updateToast_share_btn_click":
            send_ga_event('updateToast', 'updateToast_share_btn_click', 'updateToast_share_btn_click');
            break;
        case "updateToast_settings_btn_click":
            send_ga_event('updateToast', 'updateToast_settings_btn_click', 'updateToast_settings_btn_click');
            break;
        case "updateToast_translate_btn_click":
            _browser.tabs.create({url:msg.detail});
            send_ga_event('updateToast', 'updateToast_translate_btn_click', 'updateToast_translate_btn_click');
            break;
        case "updateToast_settings_top_btn_click":
            send_ga_event('updateToast', 'updateToast_settings_top_btn_click', 'updateToast_settings_top_btn_click');
            break;
        case "updateToast_twitter_btn_click":
            send_ga_event('updateToast', 'updateToast_twitter_btn_click', 'updateToast_twitter_btn_click');
            break;
        case "delayedRateToast":
            send_ga_event('delayedRateToast_dismiss', 'dismiss', msg.detail);
            break;
        case "delayedRateToast_rate_btn_click":
            send_ga_event('delayedRateToast', 'delayedRateToast_rate_btn_click', 'delayedRateToast_rate_btn_click');
            break;
        case "delayedRateToast_donate_btn_click":
            send_ga_event('delayedRateToast', 'delayedRateToast_donate_btn_click', 'delayedRateToast_donate_btn_click');
            break;
        case "delayedRateToast_share_btn_click":
            send_ga_event('delayedRateToast', 'delayedRateToast_share_btn_click', 'delayedRateToast_share_btn_click');
            break;
        case "delayedRateToast_settings_btn_click":
            send_ga_event('delayedRateToast', 'delayedRateToast_settings_btn_click', 'delayedRateToast_settings_btn_click');
            break;
        case "delayedRateToast_translate_btn_click":
            _browser.tabs.create({url:msg.detail});
            send_ga_event('delayedRateToast', 'delayedRateToast_translate_btn_click', 'delayedRateToast_translate_btn_click');
            break;
        case "bg_translate_infoDiv":
            _browser.tabs.create({url:msg.detail});
            send_ga_event('settings_translate_btn_click', 'settings_translate_btn_click', 'settings_translate_btn_click');
            break;
        case "bg_show_donate":
            _browser.tabs.create({url:"https://ko-fi.com/twitchpreviews"});
            break;
        case "bg_show_rate":
            _browser.tabs.create({url:"https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/reviews/"});
            break;
        case "bg_show_share":
            _browser.tabs.create({url:"https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/"});
            break;
        case "bg_show_github":
            _browser.tabs.create({url:"https://github.com/MarkM-dev/Twitch-Previews"});
            break;
        case "bg_show_twitter":
            _browser.tabs.create({url:"https://twitter.com/TwitchPreviews"});
            break;
        case "bg_show_bugReport":
            _browser.tabs.create({url:"https://github.com/MarkM-dev/Twitch-Previews/issues"});
            break;
        case "appStart":
            send_ga_event('appStart', 'content.js', msg.detail);
            break;
        case "heartbeat":
            if (new Date().getTime() - lastHeartBeat >= HEART_BEAT_INTERVAL_MS - 500) {
                send_ga_event('heartbeat', 'heartbeat', 'heartbeat - ' + tpga_browser);
                lastHeartBeat = new Date().getTime();
            }
            break;
        case "bg_donate_btn_click":
            send_ga_event('settings_donate_btn_click', 'settings_donate_btn_click', 'settings_donate_btn_click');
            break;
        case "bg_rate_btn_click":
            send_ga_event('settings_rate_btn_click', 'settings_rate_btn_click', 'settings_rate_btn_click');
            break;
        case "bg_share_btn_click":
            send_ga_event('settings_share_btn_click', 'settings_share_btn_click', 'settings_share_btn_click');
            break;
        case "bg_github_btn_click":
            send_ga_event('settings_github_btn_click', 'settings_github_btn_click', 'settings_github_btn_click');
            break;
        case "bg_twitter_btn_click":
            send_ga_event('settings_twitter_btn_click', 'settings_twitter_btn_click', 'settings_twitter_btn_click');
            break;
        case "bg_bugReport_btn_click":
            send_ga_event('settings_bug_report_btn_click', 'settings_bug_report_btn_click', 'settings_bug_report_btn_click');
            break;
        case "bg_changelog_btn_click":
            send_ga_event('settings_changelog_btn_click', 'settings_changelog_btn_click', 'settings_changelog_btn_click');
            break;
        case "bg_contact_btn_click":
            send_ga_event('settings_contact_btn_click', 'settings_contact_btn_click', 'settings_contact_btn_click');
            break;
        case "tp_settings_upgrade_db":
            if (isFirefox) {
                let obj = upgradeDB(msg.detail);
                for (let featureName in optionsDisabledForFirefox) {
                    if (obj.upgraded_options[featureName]) {
                        obj.upgraded_options[featureName] = false;
                    }
                }
                sendResponse({result: obj});
            } else {
                sendResponse({result: upgradeDB(msg.detail)});
            }
            break;
        case "setListenersForCd":
            setListenersForClipDownloader();
            break;
        case "removeListenersForCd":
            removeListenersForClipDownloader();
            break;
        case "get_YT_live_streams":
            if (new Date().getTime() - lastYTFetch >= YT_FETCH_INTERVAL_MS - 500) {
                lastYTFetch = new Date().getTime();
                cached_yt_live_streams_arr = [];

                fetch('https://www.youtube.com/feed/subscriptions?flow=1').then(function (response) {
                    return response.text();
                }).then(function (data) {
                    try {
                        let parser = new DOMParser();
                        let doc = parser.parseFromString(data, 'text/html');

                        if (!doc) {
                            sendResponse({ result: cached_yt_live_streams_arr });
                            return;
                        }
                        let scripts = doc.querySelectorAll('script');
                        for (let i = 0; i < scripts.length; i++) {
                            let script = scripts[i].innerText;
                            if (script.startsWith('var ytInitialData = ')) {
                                script = script.replace('var ytInitialData = ', '');
                                script = script.slice(0, -1);
                                let scriptJson = JSON.parse(script);
                                let items = scriptJson.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].shelfRenderer.content.gridRenderer.items;

                                for (let j = 0; j < items.length; j++) {
                                    if (items[j].gridVideoRenderer.badges && items[j].gridVideoRenderer.badges[0].metadataBadgeRenderer.style === 'BADGE_STYLE_TYPE_LIVE_NOW') {
                                        let obj = {};
                                        obj.videoId = items[j].gridVideoRenderer.videoId;
                                        obj.profile_pic_url = items[j].gridVideoRenderer.channelThumbnail.thumbnails[0].url;
                                        obj.thumbnail_url = items[j].gridVideoRenderer.thumbnail.thumbnails[items[j].gridVideoRenderer.thumbnail.thumbnails.length - 1].url;
                                        obj.title = items[j].gridVideoRenderer.title.runs[0].text;
                                        obj.stream_name = items[j].gridVideoRenderer.shortBylineText.runs[0].text;
                                        obj.view_count = items[j].gridVideoRenderer.shortViewCountText.runs[0].text;

                                        let num_str = items[j].gridVideoRenderer.viewCountText.runs[0].text.match(/\d+/g);
                                        let num_count = '';
                                        for (let i = 0; i < num_str.length; i++) {
                                            num_count += num_str[i];
                                        }

                                        obj.view_count_num = num_count;
                                        cached_yt_live_streams_arr.push(obj);
                                    }
                                }
                                cached_yt_live_streams_arr.sort(function(a, b) {
                                    return b.view_count_num - a.view_count_num;
                                })
                                break;
                            }
                        }

                        sendResponse({ result: cached_yt_live_streams_arr });
                    } catch (e) {
                        console.log(e);
                        sendResponse({ result: cached_yt_live_streams_arr });
                    }
                }).catch(function (err) {
                    console.warn('Something went wrong.', err);
                });
            } else {
                sendResponse({ result: cached_yt_live_streams_arr });
            }
            break;
        case "check_permission_clip.twitch.tv":
            _browser.permissions.contains({
                origins: ['https://clips.twitch.tv/*']
            }, (result) => {
                if (result) {
                    sendResponse({ result: "granted" });
                } else {
                    if (isFirefox) {
                        _browser.tabs.create({url: _browser.runtime.getURL("opd/opd_clips.html")});
                        sendResponse({ result: "denied" });
                    } else {
                        _browser.permissions.request({
                            origins: ['https://clips.twitch.tv/*']
                        }, (granted) => {
                            if (granted) {
                                sendResponse({ result: "granted" });
                            } else {
                                sendResponse({ result: "denied" });
                            }
                        });
                    }
                }
            });
            break;
        case "check_permission_YT":
            _browser.permissions.contains({
                origins: ['https://www.youtube.com/*']
            }, (result) => {
                if (result) {
                    sendResponse({ result: "granted" });
                } else {
                    if (isFirefox) {
                        _browser.tabs.create({url: _browser.runtime.getURL("opd/opd_yt.html")});
                        sendResponse({ result: "denied" });
                    } else {
                        _browser.permissions.request({
                            origins: ['https://www.youtube.com/*']
                        }, (granted) => {
                            if (granted) {
                                sendResponse({ result: "granted" });
                            } else {
                                sendResponse({ result: "denied" });
                            }
                        });
                    }
                }
            });
            break;
        default:
    }
    if (msg.action !== 'check_permission_clip.twitch.tv' && msg.action !== 'check_permission_YT' && msg.action !== 'get_YT_live_streams' && msg.action !== 'tp_settings_upgrade_db' && msg.action !== 'bg_incognito_chat_btn_click') {
        sendResponse({ result: "any response from background" });
    }
    return true;
});
checkShouldStartCdListeners();