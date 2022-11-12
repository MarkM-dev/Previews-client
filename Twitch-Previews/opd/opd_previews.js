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
            origins: ['https://previews-app.com/*']
        }, (granted) => {
            if (granted) {
                _browser.storage.local.get('tp_user_sub', function(result) {
                    if (result.tp_user_sub) {
                        let ppid = result.tp_user_sub.ppid;
                        let action = ppid.indexOf('-') === -1 ? 'validate_gifted_subscription':'validate_subscription';
                        _browser.runtime.sendMessage({action: action, detail: ppid}, function(response) { // handles updates in bg

                        });
                    }
                    closeTab();
                });
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