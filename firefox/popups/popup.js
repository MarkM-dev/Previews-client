var slider;
var output;
var options = {};

function changeFeatureMode(featureName, value) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "update_options", detail:{featureName:featureName, value:value}})
    });
    browser.runtime.sendMessage({action: "bg_update_" + featureName, detail: value}, function(response) {

    });
}

function initCheckbox(featureName, checkboxID, invertBool) {
    var checkbox = document.getElementById(checkboxID);
    checkbox.checked = invertBool ? !options[featureName] : options[featureName];
    checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            if (featureName === "isPredictionsNotificationsEnabled") {
                chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "check_notifications_permissions", detail:{featureName:featureName, value:true}})
                });
            } else {
                changeFeatureMode(featureName,invertBool ? false : true);
            }
        } else {
            if (featureName === "isPredictionsNotificationsEnabled") {
                browser.runtime.sendMessage({action: "bg_update_" + featureName, detail: false}, function(response) {

                });
            }
            changeFeatureMode(featureName,invertBool ? true : false);
            document.getElementById('refreshChangeDivInfo').style.display = "block";
        }
    });
}

function initSocialBtn(name, url) {
    var btn = document.getElementById('tp_popup_' + name +'_btn');
    btn.addEventListener('click', (event) => {
        if (url) {
            chrome.tabs.create({url:url});
        }
        browser.runtime.sendMessage({action: 'bg_' + name +'_btn_click', detail: ""}, function(response) {

        });
    });
}

function initPreviewSizeSlider() {
    slider = document.getElementById("TP_popup_preview_size_input_slider");
    output = document.getElementById("TP_popup_preview_size_display");
    slider.min = 300;
    slider.max = 1000;

    slider.value = options.PREVIEWDIV_WIDTH;
    output.innerHTML = slider.value + "px";

    slider.onchange = function() {
        changeFeatureMode('PREVIEWDIV_WIDTH', this.value);
    }

    slider.oninput = function() {
        output.innerHTML = this.value + "px";
    }
}

function setFeatureTitles() {
    document.getElementById('tp_popup_feature_sBar_previews').title = "* Sidebar Previews\n" +
        "- Shows a live video or image preview when hovering over a stream on the sidebar (followed channels list on the side)";

    document.getElementById('tp_popup_feature_directory_previews').title = "* Directory Previews\n" +
        "- Shows a video stream preview when hovering over streams in twitch directories (channels in browsing directory, following, etc..).";

    document.getElementById('tp_popup_feature_cpc').title = "* Auto Channel Points Clicker\n" +
        "- This feature automatically clicks the green channel points redeem button.\n" +
        "- It also works when chat is closed and when the tab or window is in the background.";

    document.getElementById('tp_popup_feature_sBar_search').title = "* Sidebar Streamer Search\n" +
        "- A purple search button on the top of the sidebar to find live streamers easily.\n" +
        "- Searches within the currently shown streamers so the sidebar will automatically extend to show all live streamers when you start searching."

    document.getElementById('tp_popup_feature_sBar_extend').title = "* Extend Sidebar\n" +
        "- Auto extends the sidebar to show all online streamers (when sidebar is open).";

    document.getElementById('tp_popup_feature_fScrnWithChat').title = "* Full screen with chat\n" +
        "- The button will show next to the 'theater mode' button in the player controls.\n" +
        "- Clicking it will toggle browser fullscreen (like F11), theater mode and chat.\n" +
        "- You can exit the mode by double-tapping ESC (first ESC is exit full screen, second ESC is to set twitch back to normal).\n" +
        "- When exiting the mode, your chat will go back to what it was before you entered 'fullscreen with chat' (unless you closed chat while in mode - then it will remain closed).";

    document.getElementById('tp_popup_feature_errRefresh').title = "* Auto Refresh On Errors (#1000, #2000)\n" +
        "- This feature works when the tab with the player that got an error is currently active.\n" +
        "- If the player got an error while the tab was not active (in the background or chrome wasn't the active window) the page will automatically refresh when you come back to it.";

    document.getElementById('tp_popup_feature_predictions').title = "* Predictions Notifications" +
        "\n- Predictions started and Predictions results notifications when you don't know it's happening (for example if your chat is closed or you are not in the tab or browser)." +
        "\n- Works on twitch tabs in the browser." +
        "\n- When enabling the feature, you will need to allow notification permissions for twitch.tv (a prompt will show - if not, click on the lock icon on the left of the url and check if it's allowed there)."
}

function setAppVer() {
    document.getElementById('tp_version').innerText = "v" + chrome.runtime.getManifest().version;
}

document.addEventListener('DOMContentLoaded', function () {

    browser.runtime.sendMessage({action: "bg_popup_opened", detail: "popup.html"}, function(response) {

    });

    browser.storage.local.get('tp_options', function(result) {
        options = result.tp_options;
        initCheckbox('isSidebarPreviewsEnabled', 'TP_popup_sidebar_previews_checkbox', false);
        initCheckbox('isImagePreviewMode', 'TP_popup_preview_mode_checkbox', true);
        initCheckbox('isDirpEnabled', 'TP_popup_directory_preview_mode_checkbox', false);
        initCheckbox('isChannelPointsClickerEnabled', 'TP_popup_channel_points_checkbox', false);
        initCheckbox('isSidebarExtendEnabled', 'TP_popup_sidebar_extend_checkbox', false);
        initCheckbox('isSidebarSearchEnabled', 'TP_popup_sidebar_search_checkbox', false);
        initCheckbox('isErrRefreshEnabled', 'TP_popup_err_refresh_checkbox', false);
        initCheckbox('isfScrnWithChatEnabled', 'TP_popup_fScrnWithChat_checkbox', false);
        initCheckbox('isPredictionsNotificationsEnabled', 'TP_popup_predictions_notifications_checkbox', false);

        initPreviewSizeSlider();
        setFeatureTitles();
        setAppVer();
    });

    initSocialBtn('donate', null)
    initSocialBtn('rate', 'https://addons.mozilla.org/en-US/firefox/addon/twitchpreviews/')
    initSocialBtn('share', 'https://addons.mozilla.org/en-US/firefox/addon/twitchpreviews/')



});
