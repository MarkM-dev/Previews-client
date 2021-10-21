
function closeTab() {
    parent.close();
    window.close();
    this.close();
}

document.getElementById('tp_allow_permissions_btn').addEventListener('click', function (e) {
    browser.permissions.request({
        origins: ['https://clips.twitch.tv/*']
    }, (granted) => {
        if (granted) {
            try {
                browser.tabs.query({currentWindow: true}, function(tabs){
                    for (let i = 0; i < tabs.length; i++) {
                        browser.tabs.sendMessage(tabs[i].id, {action: "tp_enable_clip_downloader"}, function(response) {});
                    }
                });
            } catch (e) {
                console.log(e);
            }
            closeTab();
        } else {
            console.log("denied");
        }
    });
})

document.getElementById('tp_cancel_btn').addEventListener('click', function (e) {
    closeTab();
})