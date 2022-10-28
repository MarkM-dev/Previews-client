async function main() {
    let already_subbed_toast_origin = false;

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
                if (already_subbed_toast_origin) {
                    sections[0].classList.remove('tp-sub-section-highlighted');
                    sections[2].classList.add('tp-sub-section-highlighted');
                } else {
                    sections[0].classList.remove('tp-sub-section-highlighted');
                    sections[1].classList.add('tp-sub-section-highlighted');
                }
                //_browser.runtime.sendMessage({action:'sendMessageToTabs', detail: "tp_enable_clip_downloader"}, function(response) {});
            } else {
                console.log("denied");
            }
        });
    })

    document.getElementById('tp_subscribe_btn').addEventListener('click', function (e) {
        document.getElementById('tp_subscribe_paypal_btn').click();
    })

    document.getElementById('tp_validate_btn').addEventListener('click', function (e) {

    })

    let sections = document.querySelectorAll('.sub-section');

    _browser.storage.local.get('tp_already_subbed_toast_origin', function(result) {
        if (result.tp_already_subbed_toast_origin) {
            if (result.tp_already_subbed_toast_origin) {
                already_subbed_toast_origin = true;
                _browser.storage.local.set({'tp_already_subbed_toast_origin': false}, function() {});
            }
        }
        startFlow();
    });

    function startFlow() {
        _browser.permissions.contains({
            origins: ['https://asds.twitch.tv/*']
        }, (result) => {
            if (result) {
                sections[0].classList.remove('tp-sub-section-highlighted');
                if (already_subbed_toast_origin) {
                    sections[2].classList.add('tp-sub-section-highlighted');
                } else {
                    sections[1].classList.add('tp-sub-section-highlighted');
                }
            } else {
                sections[0].classList.add('tp-sub-section-highlighted');
            }
        });
    }

}
main().then();