// (c) Mark M <https://github.com/MarkM-dev>.

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
            let items_html = document.querySelectorAll('[tp_i18n_html]');
            items_html.forEach((item) => {
                item.innerHTML = _i18n(item.attributes.tp_i18n_html.value);
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
    let redeem_code_intent = false;
    let sections = document.querySelectorAll('.sub-section');
    document.querySelector('#opd_sub_code_info').src = _browser.runtime.getURL('../images/opd_sub_code_info.jpg');
    document.querySelector('#opd_sub_gift_a_sub_code_info').src = _browser.runtime.getURL('../images/opd_sub_code_info_gift.jpg');

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

    let isFetchingFromServer = false;
    document.getElementById('tp_subscribe_btn').addEventListener('click', function (e) {
        document.getElementById('tp_subscribe_paypal_btn').click();
        setTimeout(function () {
            setSectionNumberCompleted(1);
            highlightSection('sub_section_sub_phase_3');
            sections[2].scrollIntoView({behavior: "smooth", block: "start"});
        }, 100);
    });


    let loading_spinner = document.querySelector('#tp_validation_loading_spinner');
    let validate_btn = document.querySelector('#tp_validate_btn');
    validate_btn.addEventListener('click', function (e) {
        if (isFetchingFromServer) {
            return;
        }
        let val_input = document.querySelector('#tp_validate_input');
        let val = val_input.value;
        if (!val || val.length < 5) {
            return;
        }
        val = val.trim();
        val_input.value = val;
        let action = 'validate_subscription';
        if (redeem_code_intent) {
            if (val.indexOf('-') === -1) {
                action = 'validate_gifted_subscription';
            }
        }

        loading_spinner.style.display = 'inline-block';
        validate_btn.style.display = 'none';
        validate_btn.style.cursor = 'not-allowed';
        isFetchingFromServer = true;
        _browser.runtime.sendMessage({action: action, detail: val}, function(response) {
            loading_spinner.style.display = 'none';
            validate_btn.style.display = 'inline-flex';
            setTimeout(function () {
                validate_btn.style.cursor = 'pointer';
                isFetchingFromServer = false;
            }, 5000);

            if (response.result === 'okay') {
                if (val.indexOf('-') === -1) {
                    document.querySelector('#discord_container')?.remove();
                }
                showPage('sub_thanks_page');
                setTimeout(function () {
                    highlightSection('sub_section_sub_thanks');
                },100);
            } else {
                setSectionNumberError(2);
                document.querySelector('#validation_error_text_el').innerText = response.result.message ? (response.result.message + ': ' + response.result.status_code) : (_i18n('something_went_wrong') + response.result.status_code);

                let info_text = document.querySelector('#opd_redeem_gifted_sub_bottom_note');
                info_text.style.color = 'white';
                let contact_btn = document.querySelector('.tp-contact-us-btn');
                contact_btn.classList.add('animated');
                contact_btn.classList.add('bounce');
                setTimeout(()=>{
                    contact_btn.classList.remove('animated');
                    contact_btn.classList.remove('bounce');
                    info_text.style.color = 'grey';
                }, 1000);
            }
        });
    })

    let discord_loading_spinner = document.querySelector('#tp_discord_loading_spinner');
    let discord_send_btn = document.querySelector('#tp_discord_send_btn');
    discord_send_btn.addEventListener('click', function (e) {
        if (isFetchingFromServer) {
            return;
        }
        let val_input = document.querySelector('#tp_discord_input');
        let val = val_input.value;
        if (!val || val.length < 5 || val.indexOf('#') === -1) {
            return;
        }
        val = val.trim();
        val_input.value = val;

        discord_loading_spinner.style.display = 'inline-block';
        discord_send_btn.style.display = 'none';
        discord_send_btn.style.cursor = 'not-allowed';
        isFetchingFromServer = true;
        _browser.runtime.sendMessage({action: 'add_discord_id', detail: val}, function(response) {
            discord_loading_spinner.style.display = 'none';
            discord_send_btn.style.display = 'inline-flex';
            setTimeout(function () {
                discord_send_btn.style.cursor = 'pointer';
                isFetchingFromServer = false;
            }, 5000);

            if (response.result === 'okay') {
                document.querySelector('#discord_body').style.display = 'none';
                document.querySelector('#discord_checkmark').style.display = 'block';
            } else {
                document.querySelector('#discord_error_text_el').innerText = response.result.message ? (response.result.message + ': ' + response.result.status_code) : (_i18n('something_went_wrong') + response.result.status_code);

                let contact_btn = document.querySelector('.tp-contact-us-btn');
                contact_btn.classList.add('animated');
                contact_btn.classList.add('bounce');
                setTimeout(()=>{
                    contact_btn.classList.remove('animated');
                    contact_btn.classList.remove('bounce');
                }, 1000);
            }
        });
    })

    let redeem_code_floating_btn = document.querySelector('#opd_sub_have_code_btn');
    redeem_code_floating_btn.addEventListener('click', function (e) {
        redeem_code_intent = true;
        showPage('sub_page');
        startRedeemCodePage();
    });

    let manage_sub_redeem_code_btn = document.querySelector('#manage_sub_redeem_code_btn');
    manage_sub_redeem_code_btn.addEventListener('click', function (e) {
        redeem_code_intent = true;
        showPage('sub_page');
        startRedeemCodePage();
    });

    let gift_a_sub_floating_btn = document.querySelector('#opd_sub_gift_a_sub_btn');
    gift_a_sub_floating_btn.addEventListener('click', function (e) {
        showPage('sub_gift_a_sub_page');
        highlightSectionSingle('sub_section_gift_a_sub_phase_1');
        highlightSectionSingle('sub_section_gift_a_sub_phase_2');
    });

    let manage_sub_gift_a_sub_btn = document.querySelector('#manage_sub_gift_a_sub_btn');
    manage_sub_gift_a_sub_btn.addEventListener('click', function (e) {
        showPage('sub_gift_a_sub_page');
        highlightSectionSingle('sub_section_gift_a_sub_phase_1');
        highlightSectionSingle('sub_section_gift_a_sub_phase_2');
    });

    let manage_sub_subscribe_btn = document.querySelector('#manage_sub_subscribe_btn');
    manage_sub_subscribe_btn.addEventListener('click', function (e) {
        redeem_code_intent = false;
        showPage('sub_page');
        checkDomainPermissions_flow();
    });

    document.querySelectorAll('.tp_gift_a_sub_plan_btn').forEach((el)=>{
        el.onclick = (e) => {
            document.querySelector('#opd_sub_gift_a_sub_select').value = el.attributes['data-tp-gifted-value'].value;
            document.querySelector('#tp_gift_a_sub_paypal_btn').click();
            let sub_section = el.closest('.sub-section');
            sub_section.style.boxShadow = '0 0 10px 0px lime';
            sub_section.querySelector('.tp-sub-section-number').style.backgroundColor = 'limegreen';
            sub_section.querySelector('.tp-sub-section-number').style.color = 'whitesmoke';
        }
    })

    document.getElementById('tp_gift_a_sub_done_btn').addEventListener('click', function (e) {
        document.querySelector('#discord_container')?.remove();
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
                    redeem_code_intent = true;
                    showPage('sub_page');
                    startRedeemCodePage();
                    break;
                case "toast_subscribe":
                    redeem_code_intent = false;
                    showPage('sub_page');
                    document.querySelector('#opd_sub_subscribe_price_select').value = result.sub_payload.subscribe_price ? result.sub_payload.subscribe_price : '$5';
                    document.querySelector('#opd_redeem_gifted_sub_bottom_note').style.display = 'none';
                    checkDomainPermissions_flow();
                    break;
                case "settings_subscribe":
                    redeem_code_intent = false;
                    showPage('sub_page');
                    document.querySelector('#opd_redeem_gifted_sub_bottom_note').style.display = 'none';
                    checkDomainPermissions_flow();
                    break;
                case "settings_gift_a_sub":
                    redeem_code_intent = false;
                    showPage('sub_gift_a_sub_page');
                    highlightSectionSingle('sub_section_gift_a_sub_phase_1');
                    highlightSectionSingle('sub_section_gift_a_sub_phase_2');
                    break;
                case "settings_manage_sub":
                    redeem_code_intent = false;
                    showPage('sub_manage_page');
                    setTimeout(function () {
                        highlightSection('sub_section_sub_manage');
                    }, 100)
                    _browser.storage.local.get('tp_user_sub', function(result) {
                        if (result.tp_user_sub) {
                            if (result.tp_user_sub.is_gifted) {
                                document.getElementById('sub_manage_subscription_details_container_normal').style.display = 'none';
                                document.getElementById('tp_manage_unsub_btn').style.display = 'none';
                                document.getElementById('sub_manage_subscription_details_type').innerText = _i18n('gifted_sub_text');
                                let end_date = new Date(result.tp_user_sub.last_payment_time.split('T')[0]);
                                end_date.setDate(end_date.getDate() + result.tp_user_sub.validation_period);
                                let month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
                                let diffDays = Math.ceil((new Date(end_date) - new Date()) / (1000 * 60 * 60 * 24));
                                document.getElementById('sub_manage_subscription_details_end_time').innerText = end_date.getDate() + '-' + month[end_date.getMonth()] + '-' + end_date.getFullYear() + ' (' + diffDays + ' ' + _i18n('gifted_sub_days_left') + ')';
                            } else {
                                document.getElementById('sub_manage_subscription_details_container_gifted').style.display = 'none';
                                document.getElementById('manage_sub_redeem_code_btn').style.display = 'none';
                                document.getElementById('manage_sub_subscribe_btn').style.display = 'none';
                            }
                        }
                    });
                    break;
                default:
                    showPage('sub_page');
                    checkDomainPermissions_flow();
                    break;
            }

            _browser.storage.local.set({'sub_payload': false}, function() {});
        } else {
            redeem_code_intent = false;
            showPage('sub_page');
            checkDomainPermissions_flow();
        }
    });

    function startRedeemCodePage() {
        checkDomainPermissions_flow();
        document.querySelector('#sub_top_note').innerText = _i18n('opd_redeem_code_top_note');
        document.querySelector('#sub_section_sub_phase_2').style.display = 'none';
        document.querySelector('#opd_sub_have_code_btn').style.display = 'none';
        document.querySelector('#opd_sub_gift_a_sub_btn').style.display = 'none';
        document.querySelector('#opd_sub_code_info_icon').style.display = 'none';
        document.querySelector('#opd_redeem_gifted_sub_bottom_note').style.display = 'block';
        document.querySelector('#opd_sub_validate_msg').innerText = _i18n('opd_sub_gift_a_sub_title');
        document.querySelector('#tp_validate_input').placeholder = '1A2B3C4D5E6F7G8H9';
        document.querySelector('#validation_error_text_el').innerText = '';
        sections[2].querySelector('.tp-sub-section-number').innerText = '2';
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
        document.querySelector('#sub_section_sub_phase_1').style.display = 'none';
        document.querySelector('#sub_section_sub_phase_2').querySelector('.tp-sub-section-number').innerText = '1';
        document.querySelector('#sub_section_sub_phase_3').querySelector('.tp-sub-section-number').innerText = '2';
        if (redeem_code_intent) {
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