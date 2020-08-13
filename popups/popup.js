var slider;
var output;

function changePreviewMode(isImagePreviewMode){
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "update_imagePreviewMode", isImagePreviewMode: isImagePreviewMode})
    });
    chrome.runtime.sendMessage({action: "bg_update_imagePreviewMode", detail: isImagePreviewMode}, function(response) {

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

    var checkbox = document.getElementById('TP_popup_preview_mode_checkbox');
    chrome.storage.sync.get('isImagePreviewMode', function(result) {
        checkbox.checked = typeof result.isImagePreviewMode == 'undefined' ? false : !result.isImagePreviewMode;
    });

    checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            changePreviewMode(false);
        } else {
            changePreviewMode(true);
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

});
