var slider;
var output;

function changePreviewMode(isImagePreviewMode){
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "update_imagePreviewMode", isImagePreviewMode: isImagePreviewMode})
    });
    chrome.runtime.sendMessage({action: "bg_update_imagePreviewMode", detail: isImagePreviewMode}, function(response) {

    });
}

function changeDirectoryPreviewMode(isDirpEnabled){
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "update_directoryPreviewMode", isDirpEnabled: isDirpEnabled})
    });
    chrome.runtime.sendMessage({action: "bg_update_directoryPreviewMode", detail: isDirpEnabled}, function(response) {

    });
}

function changeChannelPointsClickerMode(isChannelPointsClickerEnabled){
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "update_ChannelPointsClickerMode", isChannelPointsClickerEnabled: isChannelPointsClickerEnabled})
    });
    chrome.runtime.sendMessage({action: "bg_update_ChannelPointsClickerMode", detail: isChannelPointsClickerEnabled}, function(response) {

    });
}

function changeIsErrRefreshEnabled(isErrRefreshEnabled){
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "update_isErrRefreshEnabled", isErrRefreshEnabled: isErrRefreshEnabled})
    });
    chrome.runtime.sendMessage({action: "bg_update_isErrRefreshEnabled", detail: isErrRefreshEnabled}, function(response) {

    });
}

function changePreviewSize(width) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "update_previewSize", width: width})
    });
    chrome.runtime.sendMessage({action: "bg_update_previewSize", detail: width + "px"}, function(response) {

    });
}

function setSliderAndViewValues(value) {
    slider.value = value ? value:440;
    output.innerHTML = slider.value + "px";
}

document.addEventListener('DOMContentLoaded', function () {

    chrome.runtime.sendMessage({action: "bg_popup_opened", detail: "popup.html"}, function(response) {

    });

    var previewModeCheckbox = document.getElementById('TP_popup_preview_mode_checkbox');
    chrome.storage.sync.get('isImagePreviewMode', function(result) {
        previewModeCheckbox.checked = typeof result.isImagePreviewMode == 'undefined' ? false : !result.isImagePreviewMode;
    });
    previewModeCheckbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            changePreviewMode(false);
        } else {
            changePreviewMode(true);
        }
    });

    var directoryPreviewCheckbox = document.getElementById('TP_popup_directory_preview_mode_checkbox');
    chrome.storage.sync.get('isDirpEnabled', function(result) {
        directoryPreviewCheckbox.checked = typeof result.isDirpEnabled == 'undefined' ? true : result.isDirpEnabled;
    });
    directoryPreviewCheckbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            changeDirectoryPreviewMode(true);
        } else {
            changeDirectoryPreviewMode(false);
        }
    });

    var ChannelPointsCheckbox = document.getElementById('TP_popup_channel_points_checkbox');
    chrome.storage.sync.get('isChannelPointsClickerEnabled', function(result) {
        ChannelPointsCheckbox.checked = typeof result.isChannelPointsClickerEnabled == 'undefined' ? false : result.isChannelPointsClickerEnabled;
    });
    ChannelPointsCheckbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            changeChannelPointsClickerMode(true);
        } else {
            changeChannelPointsClickerMode(false);
        }
    });


    var errRefreshCheckbox = document.getElementById('TP_popup_err_refresh_checkbox');
    chrome.storage.sync.get('isErrRefreshEnabled', function(result) {
        errRefreshCheckbox.checked = typeof result.isErrRefreshEnabled == 'undefined' ? false : result.isErrRefreshEnabled;
    });
    errRefreshCheckbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            changeIsErrRefreshEnabled(true);
        } else {
            changeIsErrRefreshEnabled(false);
        }
    });

    slider = document.getElementById("TP_popup_preview_size_input_slider");
    output = document.getElementById("TP_popup_preview_size_display");
    slider.min = 300;
    slider.max = 1000;

    try {
        chrome.storage.sync.get('previewSize', function(result) {
            if (typeof result.previewSize == 'undefined') {
                setSliderAndViewValues(null);
            } else {
                setSliderAndViewValues(result.previewSize.width);
            }
        });
    } catch (e) {
        setSliderAndViewValues(null);
    }

    slider.onchange = function() {
        changePreviewSize(this.value);
    }

    slider.oninput = function() {
        output.innerHTML = this.value + "px";
    }

    var donate_btn = document.getElementById('tp_popup_donate_btn');
    donate_btn.addEventListener('click', (event) => {
        chrome.runtime.sendMessage({action: "bg_donate_btn_click", detail: ""}, function(response) {

        });
    });

    var rate_btn = document.getElementById('tp_popup_rate_btn');
    rate_btn.addEventListener('click', (event) => {
        chrome.tabs.create({url:"https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/reviews/"});
        chrome.runtime.sendMessage({action: "bg_rate_btn_click", detail: ""}, function(response) {

        });
    });

    var share_btn = document.getElementById('tp_popup_share_btn');
    share_btn.addEventListener('click', (event) => {
        chrome.tabs.create({url:"https://chrome.google.com/webstore/detail/twitch-previews/hpmbiinljekjjcjgijnlbmgcmoonclah/"});
        chrome.runtime.sendMessage({action: "bg_share_btn_click", detail: ""}, function(response) {

        });
    });

});
