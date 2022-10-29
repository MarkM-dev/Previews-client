async function main() {
    let have_code_toast_origin = false;
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

    document.getElementById('tp_allow_permissions_btn').addEventListener('click', function (e) {
        _browser.permissions.request({
            origins: ['https://clips.twitch.tv/*']
        }, (granted) => {
            if (granted) {
                flow_permission_allowed();
            } else {
                console.log("denied");
            }
        });
    })

    document.getElementById('tp_subscribe_btn').addEventListener('click', function (e) {
        //document.getElementById('tp_subscribe_paypal_btn').click();
        setTimeout(function () {
            setSectionNumberCompleted(1);
            highlightSection(2);
            sections[2].scrollIntoView({behavior: "smooth", block: "start"});
        }, 100);
    });

    let loading_spinner = document.querySelector('#tp_validation_loading_spinner');
    let validate_btn = document.querySelector('#tp_validate_btn');
    validate_btn.addEventListener('click', function (e) {
        let val = document.querySelector('#tp_validate_input').value;
        if (!val || val.length < 5) {
            return;
        }

        loading_spinner.style.display = 'inline-block';
        validate_btn.style.display = 'none';
        _browser.runtime.sendMessage({action:'validate_subscription', detail: document.querySelector('#tp_validate_input').value}, function(response) {
            loading_spinner.style.display = 'none';
            validate_btn.style.display = 'inline-flex';
            if (response.result === 'okay') {
                setSectionNumberCompleted(1);
                setSectionNumberCompleted(2);
                showPage('sub_thanks_page');
                setTimeout(function () {
                    highlightSection(3);
                },100);
            } else {
                setSectionNumberError(2);
                document.querySelector('#validation_error_text_el').innerText = response.result;
            }
        });
    })

    document.getElementById('tp_close_tab_btn').addEventListener('click', function (e) {
        parent.close();
        window.close();
        this.close();
    });

    _browser.storage.local.get('sub_payload', function(result) {
        if (result.sub_payload) {

            switch (result.sub_payload.tp_sub_origin_intent) {
                case "have_code":
                    showPage('sub_page');
                    have_code_toast_origin = true;
                    setSectionNumberCompleted(1);
                    break;
                case "toast_subscribe":
                    showPage('sub_page');
                    document.querySelector('#opd_sub_subscribe_price_select').value = result.sub_payload.subscribe_price ? result.sub_payload.subscribe_price : '$5';
                    break;
                case "settings_subscribe":
                    showPage('sub_page');
                    break;
                case "settings_manage_sub":
                    showPage('sub_manage_page');
                    break;
                default:
                    showPage('sub_page');
                    break;
            }

            _browser.storage.local.set({'sub_payload': false}, function() {});
        }
        startFlow();
    });

    function startFlow() {
        _browser.permissions.contains({
            origins: ['https://asds.twitch.tv/*']
        }, (result) => {
            if (result) {
                flow_permission_allowed();
            } else {
                highlightSection(0);
            }
        });
    }

    function flow_permission_allowed() {
        setSectionNumberCompleted(0);
        if (have_code_toast_origin) {
            highlightSection(2);
        } else {
            highlightSection(1);
        }
        sections[1].onmouseenter = ()=> {
            highlightSection(1);
        }
        sections[2].onmouseenter = ()=> {
            highlightSection(2);
        }
    }


    function setSectionNumberCompleted(num) {
        sections[num].querySelector('.tp-sub-section-number').style.backgroundColor = 'limegreen';
        sections[num].querySelector('.tp-sub-section-number').style.color = 'whitesmoke';
    }
    function setSectionNumberError(num) {
        sections[num].querySelector('.tp-sub-section-number').style.backgroundColor = 'red';
        sections[num].querySelector('.tp-sub-section-number').style.color = 'whitesmoke';
    }

    function highlightSection(index) {
        sections.forEach((x, i)=>{i === index ? x.classList.add('tp-sub-section-highlighted') : x.classList.remove('tp-sub-section-highlighted')});
    }

    function showPage(id) {
        document.querySelectorAll('.sub_page').forEach((x)=>{x.id === id ? x.style.display = 'block': x.style.display = 'none'})
    }
}
main().then();