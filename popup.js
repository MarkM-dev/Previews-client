function changePreviewMode(isImagePreviewMode){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "update_imagePreviewMode" ,isImagePreviewMode: isImagePreviewMode}, function(response) {});
    });
}

document.addEventListener('DOMContentLoaded', function () {
    var checkbox = document.getElementById('TP_popup_preview_mode_checkbox');

    checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            changePreviewMode(false);
        } else {
            changePreviewMode(true);
        }
    })
});
