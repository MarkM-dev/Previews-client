var slider;
var output;
var options = {};

function changeFeatureMode(featureName, value) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "update_options", detail:{featureName:featureName, value:value}})
    });
    chrome.runtime.sendMessage({action: "bg_update_" + featureName, detail: value}, function(response) {

    });
}

function initCheckbox(featureName, checkboxID, invertBool) {
    var checkbox = document.getElementById(checkboxID);
    checkbox.checked = invertBool ? !options[featureName] : options[featureName];
    checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            changeFeatureMode(featureName,invertBool ? false : true);
        } else {
            changeFeatureMode(featureName,invertBool ? true : false);
            if (featureName === "isSidebarPreviewsEnabled") {
                document.getElementById('refreshChangeDivInfo').style.display = "block";
            }
        }
    });
}

function initSocialBtn(name, url) {
    var btn = document.getElementById('tp_popup_' + name +'_btn');
    btn.addEventListener('click', (event) => {
        if (url) {
            chrome.tabs.create({url:url});
        }
        chrome.runtime.sendMessage({action: 'bg_' + name +'_btn_click', detail: ""}, function(response) {

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

document.addEventListener('DOMContentLoaded', function () {

    chrome.runtime.sendMessage({action: "bg_popup_opened", detail: "popup.html"}, function(response) {

    });

    chrome.storage.sync.get('tp_options', function(result) {
        options = result.tp_options;
        initCheckbox('isSidebarPreviewsEnabled', 'TP_popup_sidebar_previews_checkbox', false);
        initCheckbox('isImagePreviewMode', 'TP_popup_preview_mode_checkbox', true);
        initCheckbox('isDirpEnabled', 'TP_popup_directory_preview_mode_checkbox', false);
        initCheckbox('isChannelPointsClickerEnabled', 'TP_popup_channel_points_checkbox', false);
        initCheckbox('isSidebarSearchEnabled', 'TP_popup_sidebar_search_checkbox', false);
        initCheckbox('isErrRefreshEnabled', 'TP_popup_err_refresh_checkbox', false);

        initPreviewSizeSlider();
    });

    initSocialBtn('donate', null)
    initSocialBtn('rate', 'https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/reviews/')
    initSocialBtn('share', 'https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/')

});
