async function main() {
    let already_subbed_toast_origin = false;
    let sections = document.querySelectorAll('.sub-section');

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
                setSectionNumberCompleted(0);
                if (already_subbed_toast_origin) {
                    removeHighlight(0);
                    addHighlight(2);
                } else {
                    removeHighlight(0);
                    addHighlight(1);
                }
                sections[1].onmouseenter = ()=> {
                    removeHighlight(2);
                    addHighlight(1);
                }
                sections[2].onmouseenter = ()=> {
                    removeHighlight(1);
                    addHighlight(2);
                }
                //_browser.runtime.sendMessage({action:'sendMessageToTabs', detail: "tp_enable_clip_downloader"}, function(response) {});
            } else {
                console.log("denied");
            }
        });
    })

    document.getElementById('tp_subscribe_btn').addEventListener('click', function (e) {
        //document.getElementById('tp_subscribe_paypal_btn').click();
        setTimeout(function () {
            setSectionNumberCompleted(1);
            removeHighlight(1);
            addHighlight(2);
            sections[2].scrollIntoView({behavior: "smooth", block: "start"});
        }, 100);
    })

    document.getElementById('tp_validate_btn').addEventListener('click', function (e) {
        let val = document.querySelector('#tp_validate_input').value;
        if (!val || val.length < 5) {
            return;
        }
        _browser.runtime.sendMessage({action:'validate_subscription', detail: document.querySelector('#tp_validate_input').value}, function(response) {
            if (response.result === 'okay') {
                setSectionNumberCompleted(1);
                setSectionNumberCompleted(2);
            } else {
                setSectionNumberError(2);
            }
        });
    })

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
                setSectionNumberCompleted(0);
                removeHighlight(0);
                if (already_subbed_toast_origin) {
                    addHighlight(2);
                } else {
                    addHighlight(1);
                }
                sections[1].onmouseenter = ()=> {
                    removeHighlight(2);
                    addHighlight(1);
                }
                sections[2].onmouseenter = ()=> {
                    removeHighlight(1);
                    addHighlight(2);
                }
            } else {
                addHighlight(0);
            }
        });
    }

    function addHighlight(index) {
        sections[index].classList.add('tp-sub-section-highlighted');
    }
    function removeHighlight(index) {
        sections[index].classList.remove('tp-sub-section-highlighted');
    }
    function setSectionNumberCompleted(num) {
        sections[num].querySelector('.tp-sub-section-number').style.backgroundColor = 'limegreen';
        sections[num].querySelector('.tp-sub-section-number').style.color = 'whitesmoke';
    }
    function setSectionNumberError(num) {
        sections[num].querySelector('.tp-sub-section-number').style.backgroundColor = 'red';
        sections[num].querySelector('.tp-sub-section-number').style.color = 'whitesmoke';
    }

}
main().then();