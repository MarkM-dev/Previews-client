async function main() {

    let isFirefox = typeof browser !== "undefined";
    let _browser = isFirefox ? browser : chrome;
    let options = {};
    let isNewPermissions = false;
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
            origins: ['https://*.facebook.com/*']
        }, (granted) => {
            if (granted) {
                if (isNewPermissions) {
                    _browser.runtime.sendMessage({action:'tp_clear_FBsidebar_cached_streams', detail: ""}, function(response) {
                    _browser.runtime.sendMessage({action:'sendMessageToTabs', detail: "tp_enable_FBsidebar_new_permissions"}, function(response) {});
                    closeTab();
                    });
                } else {
                    _browser.runtime.sendMessage({action:'sendEnableFBMessageToTabs', detail: "tp_enable_FBsidebar"}, function(response) {});
                    closeTab();
                }
            } else {
                console.log("denied");
            }
        });
    })

    document.getElementById('tp_cancel_btn').addEventListener('click', function (e) {
        closeTab();
    })

    _browser.storage.local.get('FB_request_new_permission', function(result) {
        if (result.FB_request_new_permission) {
            _browser.storage.local.set({'FB_request_new_permission': false}, function() {});
            isNewPermissions = true;
            document.getElementById('tp_new_permissions_text').style.display = 'block';
        }
    });

}
main().then();