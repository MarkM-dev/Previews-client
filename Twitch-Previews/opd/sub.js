async function main() {

    let isFirefox = typeof browser !== "undefined";
    let _browser = isFirefox ? browser : chrome;
    let options = {};
    const _tp_i18n = await import(_browser.runtime.getURL("./main/tp_i18n.js")).then((res) => {
        _browser.storage.local.get('tp_options', function(result) {
            options = result.tp_options;
            let items = document.querySelectorAll('[tp_i18n]');
            items.forEach((item) => {
                item.innerText = res.i18n[item.attributes.tp_i18n.value][options.selected_lang];
            })
        });
    });

    function closeTab() {
        parent.close();
        window.close();
        this.close();
    }

    document.getElementById('tp_allow_permissions_btn').addEventListener('click', function (e) {
        _browser.permissions.request({
            origins: ['https://clips.twitch.tv/*']
        }, (granted) => {
            if (granted) {
                //_browser.runtime.sendMessage({action:'sendMessageToTabs', detail: "tp_enable_clip_downloader"}, function(response) {});
            } else {
                console.log("denied");
            }
        });
    })

    document.getElementById('tp_subscribe_btn').addEventListener('click', function (e) {

    })

}
main().then();