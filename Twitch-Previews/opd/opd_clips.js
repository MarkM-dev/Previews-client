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
        browser.permissions.request({
            origins: ['https://clips.twitch.tv/*']
        }, (granted) => {
            if (granted) {
                try {
                    browser.tabs.query({currentWindow: true}, function (tabs) {
                        for (let i = 0; i < tabs.length; i++) {
                            browser.tabs.sendMessage(tabs[i].id, {action: "tp_enable_clip_downloader"}, function (response) {
                            });
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

}
main().then();