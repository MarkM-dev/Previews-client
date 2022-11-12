let isFirefox = typeof browser !== "undefined";
let _browser = isFirefox ? browser : chrome;
const _tp_i18n = await import(_browser.runtime.getURL("main/tp_sub_toast_i18n.js"));
let selected_lang = 'en';

_browser.storage.local.get('tp_options', function(result) {
    selected_lang = result.tp_options.selected_lang;
});

function sendMessageToBG(obj) {
    _browser.runtime.sendMessage(obj, function(response) {

    });
}

function getRuntimeUrl(path) {
    return _browser.runtime.getURL(path);
}

function geti18nMessage(msgName) {
    return _browser.i18n.getMessage(msgName);
}

function _i18n(name, args) {
    let translation = _tp_i18n.i18n[name][selected_lang];
    if (args) {
        args.forEach((arg) => {
            translation = translation.replace('%s', arg);
        })
    }
    return translation;
}

function initDragForSubToast(toast_container) {
    dragElement(toast_container);

    function dragElement(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let drag_el = elmnt.closest('#tp_subscribe_toast_content');
        elmnt.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            drag_el.style.top = (drag_el.offsetTop - pos2) + "px";
            drag_el.style.left = (drag_el.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}

export function sub_checkIsSubActive(show_settings_callback) {
    return new Promise((resolve, reject) => {
        _browser.storage.local.get('tp_user_sub', function(result) {
            let isSub = result.tp_user_sub?.isActive;
            if (isSub) {
                if (result.tp_user_sub.is_gifted) {
                    let end_date = new Date(result.tp_user_sub.last_payment_time.split('T')[0]);
                    end_date.setDate(end_date.getDate() + result.tp_user_sub.validation_period);
                    let diffDays = Math.ceil((new Date(end_date) - new Date()) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                        resolve(true); // gifted sub ended // true so that the user doesn't see both dialogs
                        sendMessageToBG({action: 'disable_subscription', detail: true});
                        show_gifted_sub_ended_toast(show_settings_callback);
                    } else {
                        if ((Date.now() - result.tp_user_sub.last_update_time) / 1000 > 172800) { // 2 days
                            _browser.runtime.sendMessage({action: "check_permission_previews", detail: true}, function(res) {
                                if (res.result === 'granted') {
                                    _browser.runtime.sendMessage({action: "validate_gifted_subscription", detail: result.tp_user_sub.ppid}, function(response) { // handles updates in bg

                                    });
                                    resolve(true);
                                } else {
                                    _browser.runtime.sendMessage({action: "show_permission_previews", detail: true}, function(response) {

                                    });
                                    resolve(false);
                                }
                            });
                        } else {
                            resolve(true);
                        }
                    }
                } else {
                    if ((Date.now() - result.tp_user_sub.last_update_time) / 1000 > 172800) { // 2 days
                        _browser.runtime.sendMessage({action: "check_permission_previews", detail: true}, function(res) {
                            if (res.result === 'granted') {
                                _browser.runtime.sendMessage({action: "validate_subscription", detail: result.tp_user_sub.ppid}, function(response) { // handles updates in bg

                                });
                                resolve(true);
                            } else {
                                _browser.runtime.sendMessage({action: "show_permission_previews", detail: true}, function(response) {

                                });
                                resolve(false);
                            }
                        })
                    } else {
                        resolve(true);
                    }
                }
            } else {
                resolve(false);
            }
        });
    })
}

function checkShouldShowSubToastByFeatureUse(weight = 0.5) {
    return new Promise((resolve, reject) => {
        _browser.storage.local.get('used_feature_count', function(result) {
                if (result.used_feature_count) {
                    if (result.used_feature_count > 20) { // todo num of uses
                        _browser.storage.local.set({'used_feature_count': 1}, function() {});
                        resolve(true);
                    } else {
                        let something = result.used_feature_count + weight;
                        _browser.storage.local.set({'used_feature_count': something}, function() {});
                        resolve(false);
                    }
                } else {
                    _browser.storage.local.set({'used_feature_count': 1}, function() {});
                    resolve(false);
                }
            })
    })
}

export function sub_checkShouldShowSubToast(show_settings_callback, weight) {
    checkShouldShowSubToastByFeatureUse(weight).then((res)=> {
        if (res) {
            _browser.storage.local.get('tpInstallTime', function(result) {
                if (result.tpInstallTime) {
                    if ((Date.now() - result.tpInstallTime) / 1000 > 2628288) { // one month
                        _browser.storage.local.get('lastSeenSubToast', function(result) {
                            if (result.lastSeenSubToast) {
                              //if ((Date.now() - result.lastSeenSubToast) / 1000 > 86400) { // 24 hours // todo max every 24 hours
                                if ((Date.now() - result.lastSeenSubToast) / 1000 > 20) { // 24 hours // todo max every 24 hours
                                    show_subscribe_toast(show_settings_callback);
                                }
                            } else {
                                show_subscribe_toast(show_settings_callback);
                            }
                        });
                    }
                }
            })
        }
    })
}


function get_subscribe_toast(show_settings_callback) {
    let content = document.createElement('div');
    content.id = 'tp_subscribe_toast_content';
    content.classList.add('tp-subscribe-toast-content');
    content.classList.add('tp-sub-toast-animated');

    let logo = document.createElement('img');
    logo.src = getRuntimeUrl('images/TP32.png');
    logo.classList.add('tp-subscribe-toast-logo');

    let title = document.createElement('div');
    title.classList.add('tp-subscribe-toast-title');
    title.innerText = _i18n('app_name');

    let body = document.createElement('div');
    body.classList.add('subscribe_toast_body');

    let range_container = document.createElement('div');
    range_container.innerHTML = '<input id="tp_subscribe_toast_range" type="range" step="10" min="10" max="90" value="40" list="tickmarks">\n' +
        '\n' +
        '<datalist id="tickmarks">\n' +
        '  <option value="10" label="$2.5" style="margin-left: -10px;" ></option>\n' +
        '  <option value="20" label="$3" ></option>\n' +
        '  <option value="30" label="$4" ></option>\n' +
        '  <option value="40" label="$5" ></option>\n' +
        '  <option value="50" label="$6" ></option>\n' +
        '  <option value="60" label="$7"></option>\n' +
        '  <option value="70" label="$10" style="margin-left: -3px;" ></option>\n' +
        '  <option value="80" label="$15" style="margin-left: -5px;" ></option>\n' +
        '  <option value="90" label="$20" style="margin-left: -7px;" ></option>\n' +
        '</datalist>';

    let have_code_btn = document.createElement('div');
    have_code_btn.classList.add('tp-subscribe-toast-btn');
    have_code_btn.style.width = '28.75%';
    have_code_btn.style.borderTopRightRadius = '3px';
    have_code_btn.style.borderBottomLeftRadius = '10px';
    have_code_btn.innerText = _i18n('subscribe_toast_have_code');

    have_code_btn.onclick = function () {
        let sub_payload = {'tp_sub_origin_intent': 'have_code', 'subscribe_price': false};
        _browser.storage.local.set({'sub_payload': sub_payload}, function() {
            sendMessageToBG({action: 'open_sub_page', detail: true})
        });
    };

    let closeBtn = document.createElement('div');
    closeBtn.classList.add('tp-subscribe-toast-btn');
    closeBtn.style.width = '28.75%';
    closeBtn.style.borderTopLeftRadius = '3px';
    closeBtn.style.borderTopRightRadius = '3px';
    closeBtn.innerText = _i18n('subscribe_toast_close');

    let closeBtn_timer = document.createElement('span');
    closeBtn_timer.innerText = '4';
    closeBtn_timer.classList.add('tp-subscribe-toast-close-btn-timer');

    closeBtn.appendChild(closeBtn_timer);

    closeBtn.onclick = function () {
        content.remove();
    };

    let subscribe_btn = document.createElement('div');
    subscribe_btn.classList.add('tp-subscribe-toast-btn');
    subscribe_btn.id = 'tp-subscribe-toast-subscribe-btn';
    subscribe_btn.style.width = '42.5%';
    subscribe_btn.style.borderTopLeftRadius = '10px';
    subscribe_btn.style.borderBottomRightRadius = '10px';
    subscribe_btn.innerText = _i18n('subscribe_toast_subscribe');

    subscribe_btn.onclick = function () {
        let convert = {10:'$2.5', 20:'$3', 30:'$4', 40:'$5', 50:'$6', 60:'$7', 70:'$10', 80:'$15', 90:'$20'};
        let sub_payload = {'tp_sub_origin_intent': 'toast_subscribe', 'subscribe_price': convert[range_container.querySelector('#tp_subscribe_toast_range').value]};
        _browser.storage.local.set({'sub_payload': sub_payload}, function() {
            sendMessageToBG({action: 'open_sub_page', detail: true})
        });
    };


    let top_btns_container = document.createElement('div');
    top_btns_container.classList.add('tp-subscribe-toast-top-btn-container');
    let translate_btn = document.createElement('img');
    translate_btn.classList.add('tp-subscribe-toast-top-btn');
    translate_btn.src = getRuntimeUrl('images/translate.png');
    translate_btn.title = geti18nMessage('translateStr');
    translate_btn.onclick = ()=> sendMessageToBG({action: "subToast_translate_btn_click", detail: 'https://translate.google.com/?sl=auto&tl=auto&text=' + encodeURIComponent(body.innerText) + '&op=translate'});

    let settings_btn = document.createElement('img');
    settings_btn.classList.add('tp-subscribe-toast-top-btn');
    settings_btn.src = getRuntimeUrl('images/settings.png');
    settings_btn.title = _i18n('subscribe_toast_settings');
    if (show_settings_callback) {
        settings_btn.onclick = ()=> show_settings_callback();
    } else {
        settings_btn.style.display = 'none';
    }

    if (selected_lang === 'en') {
        top_btns_container.appendChild(translate_btn);
    }
    top_btns_container.appendChild(settings_btn);

    title.prepend(logo);
    content.appendChild(title);
    content.appendChild(body);
    content.appendChild(range_container);

    let bottom_btns_container = document.createElement('div');
    bottom_btns_container.appendChild(have_code_btn);
    bottom_btns_container.appendChild(closeBtn);
    bottom_btns_container.appendChild(subscribe_btn);
    content.appendChild(bottom_btns_container);

    content.appendChild(top_btns_container);
    initDragForSubToast(title);
    initDragForSubToast(body);
    return {
        content: content,
        body: body,
        closeBtn: closeBtn,
        closeBtn_timer: closeBtn_timer
    }
}

export function show_subscribe_toast(show_settings_callback) {
    let toast = get_subscribe_toast(show_settings_callback);
    let content = toast.content;
    let body = toast.body;
    let closeBtn = toast.closeBtn;
    let closeBtn_timer = toast.closeBtn_timer;

    body.innerHTML = _i18n('subscribe_toast_body');
    content.classList.add('tp-sub-toast-pos-1');
    content.classList.add('tp-sub-toast-slideInDown');
    closeBtn_timer.style.display = 'inline-flex';
    closeBtn.classList.add('tp-subscribe-toast-close-btn-disable');

    document.body.appendChild(content);

    _browser.storage.local.set({'lastSeenSubToast': Date.now()}, function() {});

    let time_left = 3;
    let timer = setInterval(function(){
        if (time_left <= 0) {
            clearInterval(timer);
            closeBtn_timer.style.display = 'none';
            closeBtn.classList.remove('tp-subscribe-toast-close-btn-disable');
        } else {
            closeBtn_timer.innerText = time_left + '';
        }
        time_left--;
    }, 1000);
}

function show_gifted_sub_ended_toast(show_settings_callback) {
    let toast = get_subscribe_toast(show_settings_callback);
    let content = toast.content;
    let body = toast.body;
    //let closeBtn = toast.closeBtn;
    //let closeBtn_timer = toast.closeBtn_timer;

    body.innerText = _i18n('gifted_sub_ended_toast_body',[_i18n('app_name')]);
    content.classList.add('tp-sub-toast-pos-2');
    content.classList.add('tp-sub-toast-slideInRight');

    document.body.appendChild(content);
}
