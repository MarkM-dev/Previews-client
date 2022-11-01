async function main() {

    let isFirefox = typeof browser !== "undefined";
    let _browser = isFirefox ? browser : chrome;
    let options = {};
    let _i18n;
    const _tp_i18n = await import(_browser.runtime.getURL("./main/tp_i18n.js")).then((res) => {
        _browser.storage.local.get('tp_options', function(result) {
            options = result.tp_options;
            let items = document.querySelectorAll('[tp_i18n]');
            items.forEach((item) => {
                item.innerText = res.i18n[item.attributes.tp_i18n.value][options.selected_lang];
            })
        });
        _i18n = function(name, args) {
            let translation = res.i18n[name][options.selected_lang];
            if (args) {
                args.forEach((arg) => {
                    translation = translation.replace('%s', arg);
                })
            }
            return translation;
        }
    });

    let server_origins = 'https://previews-app.com/*';
    let have_code_toast_origin = false;
    let sections = document.querySelectorAll('.sub-section');
    document.querySelector('#opd_sub_code_info').src = _browser.runtime.getURL('../images/opd_sub_code_info.jpg');
    document.querySelector('#opd_sub_gift_a_sub_code_info').src = _browser.runtime.getURL('../images/opd_sub_code_info.jpg');

    document.getElementById('tp_allow_permissions_btn').addEventListener('click', function (e) {
        _browser.permissions.request({
            origins: [server_origins]
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
            highlightSection('sub_section_sub_phase_3');
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
                    highlightSection('sub_section_sub_thanks');
                },100);
            } else {
                setSectionNumberError(2);
                document.querySelector('#validation_error_text_el').innerText = response.result.message ? (response.result.message + ': ' + response.result.status_code) : (_i18n('something_went_wrong') + response.result.status_code);
            }
        });
    })

    let redeem_code_floating_btn = document.querySelector('#opd_sub_have_code_btn');
    redeem_code_floating_btn.addEventListener('click', function (e) {
        have_code_toast_origin = true;
        startRedeemCodePage();
    });

    let gift_a_sub_floating_btn = document.querySelector('#opd_sub_gift_a_sub_btn');
    gift_a_sub_floating_btn.addEventListener('click', function (e) {
        showPage('sub_gift_a_sub_page');
        highlightSectionSingle('sub_section_gift_a_sub_phase_1');
        highlightSectionSingle('sub_section_gift_a_sub_phase_2');
    });

    document.querySelectorAll('.tp_gift_a_sub_plan_btn').forEach((el)=>{
        el.onclick = (e) => {
            document.querySelector('#opd_sub_gift_a_sub_select').value = el.attributes['data-tp-gifted-value'].value;
            //document.querySelector('#tp_gift_a_sub_paypal_btn').click();
            let sub_section = el.closest('.sub-section');
            sub_section.style.boxShadow = '0 0 10px 0px lime';
            sub_section.querySelector('.tp-sub-section-number').style.backgroundColor = 'limegreen';
            sub_section.querySelector('.tp-sub-section-number').style.color = 'whitesmoke';
        }
    })

    document.getElementById('tp_gift_a_sub_done_btn').addEventListener('click', function (e) {
        showPage('sub_thanks_page');
        setTimeout(function () {
            highlightSection('sub_section_sub_thanks');
        },100);
    });

    document.getElementById('tp_close_tab_btn').addEventListener('click', function (e) {
        parent.close();
        window.close();
        this.close();
    });

    document.getElementById('tp_manage_unsub_btn').addEventListener('click', function (e) {
        showPage('sub_unsub_page');
        highlightSection('sub_section_unsub');
    });

    _browser.storage.local.get('sub_payload', function(result) {
        if (result.sub_payload) {

            switch (result.sub_payload.tp_sub_origin_intent) {
                case "have_code":
                    showPage('sub_page');
                    have_code_toast_origin = true;
                    startRedeemCodePage();
                    break;
                case "toast_subscribe":
                    showPage('sub_page');
                    document.querySelector('#opd_sub_subscribe_price_select').value = result.sub_payload.subscribe_price ? result.sub_payload.subscribe_price : '$5';
                    checkDomainPermissions_flow();
                    break;
                case "settings_subscribe":
                    showPage('sub_page');
                    checkDomainPermissions_flow();
                    break;
                case "settings_gift_a_sub":
                    showPage('sub_gift_a_sub_page');
                    highlightSectionSingle('sub_section_gift_a_sub_phase_1');
                    highlightSectionSingle('sub_section_gift_a_sub_phase_2');
                    break;
                case "settings_manage_sub":
                    showPage('sub_manage_page');
                    highlightSection('sub_section_sub_manage');
                    break;
                default:
                    showPage('sub_page');
                    checkDomainPermissions_flow();
                    break;
            }

            _browser.storage.local.set({'sub_payload': false}, function() {});
        } else {
            showPage('sub_page');
            checkDomainPermissions_flow();
        }
    });

    function startRedeemCodePage() {
        checkDomainPermissions_flow();
        document.querySelector('#sub_section_sub_phase_2').style.display = 'none';
        document.querySelector('#opd_sub_have_code_btn').style.display = 'none';
        document.querySelector('#opd_sub_gift_a_sub_btn').style.display = 'none';
        document.querySelector('#opd_sub_code_info_icon').style.display = 'none';
        document.querySelector('#opd_sub_validate_msg').innerText = _i18n('opd_sub_gift_a_sub_title');
        document.querySelector('#tp_validate_input').placeholder = '1A2B3C4D5E6F7G8H9';

    }

    function checkDomainPermissions_flow() {
        _browser.permissions.contains({
            origins: [server_origins]
        }, (result) => {
            if (result) {
                flow_permission_allowed();
            } else {
                highlightSection('sub_section_sub_phase_1');
            }
        });
    }

    function flow_permission_allowed() {
        setSectionNumberCompleted(0);
        if (have_code_toast_origin) {
            highlightSection('sub_section_sub_phase_3');
        } else {
            highlightSection('sub_section_sub_phase_2');
        }
        sections[1].onmouseenter = ()=> {
            highlightSection('sub_section_sub_phase_2');
        }
        sections[2].onmouseenter = ()=> {
            highlightSection('sub_section_sub_phase_3');
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

    function highlightSection(id) {
        document.querySelectorAll('.sub-section').forEach((x)=>{x.id === id ? x.classList.add('tp-sub-section-highlighted'): x.classList.remove('tp-sub-section-highlighted')})
    }

    function highlightSectionSingle(id) {
        document.querySelector('#' + id).classList.add('tp-sub-section-highlighted');
    }

    function showPage(id) {
        document.querySelectorAll('.sub_page').forEach((x)=>{x.id === id ? x.style.display = 'block': x.style.display = 'none'})
    }
}
main().then();