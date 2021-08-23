// (c) Twitch Previews.
let isFirefox = typeof browser !== "undefined";
let _browser = isFirefox ? browser : chrome;
let iframeAllowAutoplayStr = isFirefox ? '': 'autoplay;';
let isNavBarCollapsed;
let previewDiv = null;
let appendContainer;
let IMAGE_CACHE_TTL_MS = 20000;
let channelPointsClickerInterval = null;
let twitchIframe;
let isHovering = false;
let lastHoveredCardEl = null;
let TP_PREVIEW_DIV_CLASSNAME = "twitch_previews_previewDiv";
let TP_SELF_PREVIEW_DIV_CLASSNAME = "twitch_previews_self_previewDiv";
let navCardPipBtn = null;
let vidPreviewVolBtn = null;
let clearOverlaysInterval = null;
let clearVidPlayInterval = null;
let isLayoutHorizontallyInverted = null;
let isMainPlayerError = false;
let timesExtendedSidebar = 0;
let hasEnteredFScreenWithChat = false;
let isMultiStreamMode = false;
let multiStream_curr_zIndex = 5000;
let startMultiStream_name = false;
let last_prediction_streamer = "";
let last_prediction_button_text = "";
let predictionSniperTimeout = null;
let APS_awaiting_to_place_bet_streamName = false;
let APS_didnt_vote_reason_margin_percent = null;
let predictionsNotificationsWorker;
const predict_langs = {
    'Predict':'English'
    ,'Forudsig':'Dansk'
    ,'Vorhersagen':'Deutch'
    ,'Predecir':'Español - España'
    ,'Prédire':'Français'
    ,'Pronostica':'Italiano'
    ,'Előrejelzés':'Magyar'
    ,'Voorspellen':'Nederlands'
    ,'Spå':'Norsk'
    ,'Obstaw':'Polski'
    ,'Prever':'Português'
    ,'Dar Palpite':'Português - Brasil'
    ,'Prezicere':'Română'
    ,'Predpovedať':'Slovenčina'
    ,'Ennusta':'Suomi'
    ,'Förutsäg':'Svenska'
    ,'Dự đoán':'Tiếng Việt'
    ,'Öngör':'Türkçe'
    ,'Předpovědět':'Čeština'
    ,'Πρόβλεψη':'Ελληνικά'
    ,'Прогнозиране':'Български'
    ,'Прогноз':'Русский'
    ,'ทำนาย':'ภาษาไทย'
    ,'预测':'中文 简体'
    ,'預測':'中文 繁體'
    ,'予想':'日本語'
    ,'예측':'한국어'
};
const see_details_langs = {
    'See Details':'English'
    ,'Se detaljer':'Dansk'
    ,'Details ansehen':'Deutch'
    ,'Ver detalles':'Español - España'
    ,'Voir les détails':'Français'
    ,'Vedi dettagli':'Italiano'
    ,'Részletek megtekintése':'Magyar'
    ,'Meer informatie':'Nederlands'
    ,'Vis detaljer':'Norsk'
    ,'Szczegóły':'Polski'
    ,'Ver detalhes':'Português'
    ,'Vezi detalii':'Română'
    ,'Detaily':'Slovenčina'
    ,'Näytä tiedot':'Suomi'
    ,'Se mer information':'Svenska'
    ,'Xem chi tiết':'Tiếng Việt'
    ,'Ayrıntıları göster':'Türkçe'
    ,'Podrobnosti':'Čeština'
    ,'Δες τις λεπτομέρειες':'Ελληνικά'
    ,'Преглед на детайлите':'Български'
    ,'Подробнее':'Русский'
    ,'ดูรายละเอียด':'ภาษาไทย'
    ,'查看详细信息':'中文 简体'
    ,'查看詳細資料':'中文 繁體'
    ,'詳細':'日本語'
    ,'자세히 보기':'한국어'
};

let options = {};

function sendMessageToBG(obj) {
    _browser.runtime.sendMessage(obj, function(response) {

    });
}

function getRuntimeUrl(path) {
    return _browser.runtime.getURL(path);
}

let sideNavMutationObserver = new MutationObserver(function(mutations) {
    let shouldRefresh = false;
    mutations.forEach(function(mutation) {
        if (mutation.type === "childList") {
            shouldRefresh = true;
        }
    });
    if (shouldRefresh){
        refreshNavCardsListAndListeners();
        shouldRefresh = false;
    }
});

let titleMutationObserver = new MutationObserver(function(mutations) {
    if (window.location.pathname.indexOf('directory') > -1) {
        setTimeout(function (){
            setDirectoryCardsListeners();
        },1000);
    } else {
        setTimeout(function (){
            toggleFeatures(true);
        }, 2000);
    }

});

function setTitleMutationObserverForDirectoryCardsRefresh() {
    titleMutationObserver.observe(document.getElementsByTagName('title')[0], {
        childList: true,
        subtree: true
    });
}

function setSideNavMutationObserver() {
    sideNavMutationObserver.observe(document.getElementsByClassName("side-bar-contents")[0], {
        childList: true,
        subtree: true
    });
}

function adjustVidPreviewVolClick(e) {
    e.preventDefault();
    e.cancelBubble = true;
    try {
        let video = twitchIframe.contentDocument.querySelector('video');
        if (video.muted) {
            video.muted = false;
            setTimeout(function (){
                video.volume = 0.2;
            }, 7);
        } else {
            video.muted = true;
        }
    } catch (e) {

    }
}

function adjustVidPreviewVolScroll(e) {
    e.preventDefault();
    e.cancelBubble = true;
    try {
        let video = twitchIframe.contentDocument.querySelector('video');

        if (e.deltaY < 0) {
            if (video.muted) {
                video.muted = false;
                setTimeout(function (){
                    video.volume = 0.05;
                }, 7);
            } else {
                video.volume += 0.05;
            }
        } else {
            video.volume -= 0.05;
        }
    } catch (e) {
    }
}

function removeVidPreviewVolBtn() {
    let volBtn = document.getElementById("tp_navCard_vpv_btn");
    if (volBtn) {
        volBtn.parentElement.removeChild(volBtn);
    }
}

function createVidPreviewVolBtn() {
    if (vidPreviewVolBtn) {
        return;
    }
    vidPreviewVolBtn = document.createElement("div");
    vidPreviewVolBtn.id = "tp_navCard_vpv_btn";
    vidPreviewVolBtn.style.width = "21px";
    vidPreviewVolBtn.style.height = "15px";
    vidPreviewVolBtn.style.position = "absolute";
    vidPreviewVolBtn.style.marginTop = "-1px";
    vidPreviewVolBtn.style.right = "0.5rem";
    vidPreviewVolBtn.style.backgroundSize = "contain";
    vidPreviewVolBtn.style.backgroundRepeat = "no-repeat";
    vidPreviewVolBtn.style.backgroundImage = "url('" + getRuntimeUrl('../images/vidPreviewVolBtn.png') + "')";
    vidPreviewVolBtn.title = "Click / Scroll for preview volume";
    vidPreviewVolBtn.onwheel = adjustVidPreviewVolScroll;
    vidPreviewVolBtn.onclick = adjustVidPreviewVolClick;
}

function createPipBtn() {
    if (navCardPipBtn) {
        return;
    }
    navCardPipBtn = document.createElement("div");
    navCardPipBtn.id = "tp_navCard_pip_btn";
    navCardPipBtn.style.width = "18px";
    navCardPipBtn.style.height = "14px";
    navCardPipBtn.style.position = "absolute";
    navCardPipBtn.style.right = "2.7rem";
    navCardPipBtn.style.backgroundSize = "contain";
    navCardPipBtn.style.backgroundRepeat = "no-repeat";
    navCardPipBtn.style.backgroundImage = "url('" + getRuntimeUrl('../images/multistream_sidebar.png') + "')";
    navCardPipBtn.title = "Picture In Picture";
    navCardPipBtn.onclick = startCustomPip;
}

function removePipBtn() {
    let pipBtn = document.getElementById("tp_navCard_pip_btn");
    if (pipBtn) {
        pipBtn.parentElement.removeChild(pipBtn);
    }
}

function startCustomPip(e) {
    e.preventDefault();
    e.cancelBubble = true;
    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME)

    createMultiStreamBox(lastHoveredCardEl.href.substr(lastHoveredCardEl.href.lastIndexOf("/") + 1), true, false);
    removePipBtn();
    removeVidPreviewVolBtn();
    sendMessageToBG({action: "bg_pip_started", detail: ""});
}

function getElementOffset(el) {
    let rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {top: rect.top + scrollTop, left: rect.left + scrollLeft}
}

function calculatePreviewDivPosition(navCardEl) {
    let elOffset = getElementOffset(navCardEl).top + (isNavBarCollapsed? 45:30);
    //let elOffset = getElementOffset(navCardEl).top + (30);
    if (window.innerHeight - elOffset < options.PREVIEWDIV_HEIGHT) { // if cuts off bottom
        if (elOffset - options.PREVIEWDIV_HEIGHT - (isNavBarCollapsed? 25:20) < 0) { // if cuts off top too
            return "5rem";
        } else {
            return elOffset - options.PREVIEWDIV_HEIGHT - (isNavBarCollapsed? 25:20) + "px";
            //return elOffset - options.PREVIEWDIV_HEIGHT - (20);
        }
    } else {
        return elOffset + "px";
    }
}

function isStreamerOnline(navCardEl) {
    return !!(navCardEl.querySelector('.tw-channel-status-indicator--live') || navCardEl.querySelector('.tw-svg__asset--videorerun') || !navCardEl.querySelector('.side-nav-card__avatar--offline'));
}

function getPreviewOfflineImageUrl() {
    return "url('" + getRuntimeUrl('../images/tp_offline.jpg') + "')";
}

function getPreviewImageUrl(navCardEl) {
        return "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-" + options.PREVIEWDIV_WIDTH + "x" + Math.round(options.PREVIEWDIV_HEIGHT) + ".jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
}

function getPreviewStreamUrl(navCardEl) {
    return "https://player.twitch.tv/?channel=" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "&parent=twitch.tv&muted=true";
}

function createIframeElement() {
    let iframe = document.createElement("Iframe");
    iframe.borderColor = "#232323";
    iframe.style.borderRadius = "5px";
    iframe.classList.add('animated');
    return iframe;
}

function createPreviewDiv(cssClass) {
    let previewDiv = document.createElement("div");
    previewDiv.classList.add(cssClass);
    previewDiv.classList.add("animated");
    previewDiv.style.position = "fixed";
    previewDiv.style.zIndex = "9";
    previewDiv.style.backgroundSize = "cover";
    previewDiv.style.backgroundColor = "#000";
    previewDiv.style.borderRadius = "5px";

    return previewDiv;
}

function setPreviewDivPosition() {
    previewDiv.style.top = calculatePreviewDivPosition(lastHoveredCardEl);
    if (getElementOffset(lastHoveredCardEl).left > 50) {
        isLayoutHorizontallyInverted = true;
        previewDiv.style.right = isNavBarCollapsed? "6rem":"25rem";
        previewDiv.style.boxShadow = "-10px 15px 10px -5px rgba(23,23,23,0.75)";
    } else {
        isLayoutHorizontallyInverted = false;
        previewDiv.style.marginLeft = isNavBarCollapsed? "6rem":"25rem";
        previewDiv.style.boxShadow = "10px 15px 10px -5px rgba(23,23,23,0.75)";
    }
    //previewDiv.style.marginLeft = isNavBarCollapsed? "6rem":"25rem";
    //previewDiv.style.marginLeft = "25rem";
}

function createAndShowDirectoryPreview() {
    previewDiv = createPreviewDiv(TP_PREVIEW_DIV_CLASSNAME);
    previewDiv.style.position = "absolute";
    previewDiv.style.left = "0px";
    previewDiv.style.top = "0px";
    let calculatedSize = lastHoveredCardEl.getBoundingClientRect();//getCalculatedPreviewSizeByWidth(document.querySelector(".root-scrollable").getBoundingClientRect().width * 0.35);
    previewDiv.style.width = calculatedSize.width + "px";
    previewDiv.style.height = calculatedSize.height + "px";
    previewDiv.style.display = "block";

    if(isStreamerOnline(lastHoveredCardEl)) {
        if (!lastHoveredCardEl.querySelector('.sk-chase')) {
            let loader_container = document.createElement("div");
            loader_container.innerHTML = "<div class=\"sk-chase\">\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "</div>".trim();
            let loader = loader_container.firstChild;

            lastHoveredCardEl.querySelector('img').parentNode.appendChild(loader);
        }

       /* let cur_card = lastHoveredCardEl;
        setTimeout(function () {
            if (cur_card.querySelector('.sk-chase')) {
                cur_card.querySelector('img').parentNode.removeChild(cur_card.querySelector('.sk-chase'));
            }
        }, 2000);*/
        twitchIframe = createIframeElement();
        twitchIframe.width = calculatedSize.width + "px";
        twitchIframe.height = calculatedSize.height + "px";
        twitchIframe.style.borderRadius = "0px";
        twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
        previewDiv.style.visibility = "hidden";
        previewDiv.appendChild(twitchIframe);

        let anch = document.createElement("a");
        anch.style.width = calculatedSize.width + "px";
        anch.style.height = calculatedSize.height + "px";
        anch.style.position = "absolute";
        anch.style.left = "0px";
        anch.style.top = "0px";
        anch.href = "/" + lastHoveredCardEl.href.substr(lastHoveredCardEl.href.lastIndexOf("/") + 1);
        anch.onmouseleave = function () {
            isHovering = false;
            clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
        }
        previewDiv.appendChild(anch);
    } else {
        previewDiv.style.backgroundImage = getPreviewOfflineImageUrl();
        twitchIframe = createIframeElement();
        twitchIframe.width = calculatedSize.width + "px";
        twitchIframe.height = calculatedSize.height + "px";
        twitchIframe.style.borderRadius = "0px";
        twitchIframe.style.display = "none";
        previewDiv.appendChild(twitchIframe);
    }

    /*twitchIframe.onmouseleave = function () {
        isHovering = false;
        clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
    }*/

    lastHoveredCardEl.parentNode.appendChild(previewDiv);
}

function createAndShowLoadingSpinnerForSideNav() {
    if (!previewDiv.querySelector('.tp-loading')) {
        let loader = document.createElement("span");
        loader.classList.add('tp-loading');
        loader.innerText = "loading stream..."
        if(isLayoutHorizontallyInverted) {
            loader.style.left = "0";
            loader.style.borderTopRightRadius = "10px";
            loader.style.borderRight = "1px solid #8f8f8f";
        } else {
            loader.style.right = "0";
            loader.style.borderTopLeftRadius = "10px";
            loader.style.borderLeft = "1px solid #8f8f8f";
        }

       // isLayoutHorizontallyInverted ? loader.style.left = "0": loader.style.right = "0";
        previewDiv.appendChild(loader);
    } else {
        previewDiv.querySelector('.tp-loading').innerText = "loading stream..."
    }
}

function setSelfThumbnailPreviewListeners() {
    try {
        let twitchLogo = document.querySelector('a[data-a-target="home-link"]');
        if (twitchLogo.attributes.tp_mouseover_listener) {
            return;
        }

        twitchLogo.addEventListener("mouseenter", function() {
            if (document.querySelector('.' + TP_SELF_PREVIEW_DIV_CLASSNAME)) {
                return;
            }
            let selfPreviewDiv = createPreviewDiv(TP_SELF_PREVIEW_DIV_CLASSNAME);
            selfPreviewDiv.style.width = "440px";
            selfPreviewDiv.style.height = "248px";
            selfPreviewDiv.style.boxShadow = "10px 15px 10px -5px rgba(23,23,23,0.75)";
            selfPreviewDiv.style.marginTop = "6rem";
            selfPreviewDiv.style.left = isNavBarCollapsed ? "6rem":"25rem";
            selfPreviewDiv.style.display = "block";
            selfPreviewDiv.style.backgroundImage = "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + options.selfPreviewStreamName + "-440x248.jpg?" + new Date().getTime() + "')";

            selfPreviewDiv.classList.add('animated');
            selfPreviewDiv.classList.add('slideInDown');

            appendContainer.appendChild(selfPreviewDiv);
        });

        twitchLogo.addEventListener("mouseleave", function() {
            let preview_el = document.querySelector('.' + TP_SELF_PREVIEW_DIV_CLASSNAME);
            if (preview_el) {
                preview_el.classList.remove('slideInDown');
                preview_el.classList.add('slideOutUp');
                setTimeout(function () {
                    clearExistingPreviewDivs(TP_SELF_PREVIEW_DIV_CLASSNAME, true);
                }, 200);
            }
        });
        twitchLogo.setAttribute('tp_mouseover_listener', 'true');
    } catch (e) {

    }
}

function createAndShowPreview() {
    previewDiv = createPreviewDiv(TP_PREVIEW_DIV_CLASSNAME);
    previewDiv.style.width = options.PREVIEWDIV_WIDTH + "px";
    previewDiv.style.height = options.PREVIEWDIV_HEIGHT + "px";
    setPreviewDivPosition();
    previewDiv.style.display = "block";


    if(isStreamerOnline(lastHoveredCardEl)) {

        previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);
        lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();

        if (!options.isImagePreviewMode) {
            createAndShowLoadingSpinnerForSideNav();
            twitchIframe = createIframeElement();
            twitchIframe.width = options.PREVIEWDIV_WIDTH + "px";
            twitchIframe.height = options.PREVIEWDIV_HEIGHT + "px";
            twitchIframe.allow = iframeAllowAutoplayStr;
            twitchIframe.style.visibility = 'hidden';
            setTimeout(function () {
                twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
            },250)
            previewDiv.appendChild(twitchIframe);
        }
    } else {
        previewDiv.style.backgroundImage = getPreviewOfflineImageUrl();
        if (!options.isImagePreviewMode) {
            twitchIframe = createIframeElement();
            twitchIframe.width = options.PREVIEWDIV_WIDTH + "px";
            twitchIframe.height = options.PREVIEWDIV_HEIGHT + "px";
            twitchIframe.allow = iframeAllowAutoplayStr;
            twitchIframe.style.display = "none";
            previewDiv.appendChild(twitchIframe);
        }
    }

    appendContainer.appendChild(previewDiv);
}

function changeAndShowPreview() {
    if(isStreamerOnline(lastHoveredCardEl)) {
        //previewDiv.style.backgroundImage = "none";

        if (new Date().getTime() - lastHoveredCardEl.lastImageLoadTimeStamp > IMAGE_CACHE_TTL_MS) {
            lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();
        }
        previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);

        if (options.isImagePreviewMode) {
            if (twitchIframe) { // in case its from directory and user in image mode.
                twitchIframe.style.display = 'none';
            }
        } else {
            if(twitchIframe.src !== getPreviewStreamUrl(lastHoveredCardEl)) {
                if (previewDiv.style.display !== "block") {
                    setTimeout(function () {
                        twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
                      //  setTimeout(function () {
                            twitchIframe.style.display = 'block';
                            twitchIframe.style.visibility = 'hidden';

                      //  },300);
                    }, 125);
                } else {
                    twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
                    twitchIframe.style.display = 'block';
                    twitchIframe.style.visibility = 'hidden';
                }
                createAndShowLoadingSpinnerForSideNav();
            } else {
                twitchIframe.style.display = 'block';
                twitchIframe.style.visibility = 'visible';
            }
            twitchIframe.width = options.PREVIEWDIV_WIDTH + "px";
            twitchIframe.height = options.PREVIEWDIV_HEIGHT + "px";
        }
    } else {
        clearLoadingSpinnerFromSideNav();
        previewDiv.style.backgroundImage = getPreviewOfflineImageUrl();
        if (!options.isImagePreviewMode){
            twitchIframe.style.display = "none";
        }
    }

    previewDiv.style.width = options.PREVIEWDIV_WIDTH + "px";
    previewDiv.style.height = options.PREVIEWDIV_HEIGHT + "px";
    setPreviewDivPosition();
    previewDiv.style.display = "block";
}

function hidePreview() {
    if (clearVidPlayInterval) {
        clearInterval(clearVidPlayInterval);
        clearVidPlayInterval = null;
    }
    clearLoadingSpinnerFromSideNav();
    if (twitchIframe) {
        twitchIframe.src = '';
        twitchIframe.style.display = 'none';
    } else {
        if (previewDiv) {
            previewDiv.style.backgroundImage = "none";
        }
    }
    previewDiv.style.display = "none";
}

function clearLoadingRoller(navCardEl) {
    let tproller = navCardEl.querySelector('.sk-chase');
    if (tproller) {
        tproller.parentNode.removeChild(tproller);
    }
}

function clearLoadingSpinnerFromSideNav() {
    if (previewDiv) {
        let tploading = previewDiv.querySelector('.tp-loading');
        if (tploading) {
            tploading.parentNode.removeChild(tploading);
        }
    }
}

function waitForVidPlayAndShow(navCardEl, isFromDirectory) {
    if (isHovering && !isNavBarCollapsed) {
        let container = lastHoveredCardEl.querySelector('div[data-a-target="side-nav-live-status"]');
        if (container) {
            container.appendChild(navCardPipBtn);
            container.appendChild(vidPreviewVolBtn);
        }
    }
    try {
        let intervalCount = 0;
        if (clearVidPlayInterval) {
            clearInterval(clearVidPlayInterval);
            clearVidPlayInterval = null;
        }
        clearVidPlayInterval = setInterval(function (){
            if (twitchIframe && twitchIframe.contentDocument && twitchIframe.contentDocument.querySelector('video')) {
                if (!isHovering) {
                    clearInterval(clearVidPlayInterval);
                    clearVidPlayInterval = null;
                    return;
                }
                if (!twitchIframe.contentDocument.querySelector('video').paused) {
                    previewDiv.style.visibility = "visible";

                    if (!isFromDirectory) {
                        clearLoadingSpinnerFromSideNav();
                        twitchIframe.classList.add('tp-anim-duration-100ms');
                        twitchIframe.classList.add('fadeIn');
                        setTimeout(function () {
                            if (twitchIframe) {
                                twitchIframe.classList.remove('fadeIn');
                            }
                        },200)
                    }
                    twitchIframe.style.visibility = "visible";

                    clearInterval(clearVidPlayInterval);
                    clearVidPlayInterval = null;
                    if (isFromDirectory) {
                        clearLoadingRoller(navCardEl);
                    } else {

                    }
                } else {
                    if (intervalCount > 33) {
                        clearInterval(clearVidPlayInterval);
                        clearVidPlayInterval = null;
                    } else {
                        intervalCount++;
                    }
                }
            } else {
                if (intervalCount > 33 || !isHovering) {
                    clearInterval(clearVidPlayInterval);
                    clearVidPlayInterval = null;
                } else {
                    intervalCount++;
                }
            }
            if (intervalCount === 24) {
                previewDiv.querySelector('.tp-loading').innerText = "stream might be offline..."
            }
        }, 300);

    } catch (e) {

    }
}

function clearOverlays(navCardEl, isFromDirectory) {
    try {
        if (twitchIframe) {
            let intervalCount = 0;
             clearOverlaysInterval = setInterval(function (){
                if (!isHovering) {
                    clearInterval(clearOverlaysInterval);
                    clearOverlaysInterval = null;
                    return;
                }
                if (twitchIframe && twitchIframe.contentDocument) {
                    if (twitchIframe.contentDocument.querySelector('button[data-a-target="player-overlay-mature-accept"]')) {
                        twitchIframe.contentDocument.querySelector('button[data-a-target="player-overlay-mature-accept"]').click();
                        setTimeout(function (){
                            let vpo = twitchIframe.contentDocument.getElementsByClassName('video-player__overlay')[0];
                            vpo.parentNode.removeChild(vpo);
                            waitForVidPlayAndShow(navCardEl, isFromDirectory);
                        },100);
                        clearInterval(clearOverlaysInterval);
                        clearOverlaysInterval = null;
                    } else {
                        if (twitchIframe.contentDocument.getElementsByClassName('video-player__overlay')[0]) {
                            let vpo = twitchIframe.contentDocument.getElementsByClassName('video-player__overlay')[0];
                            vpo.parentNode.removeChild(vpo);
                            waitForVidPlayAndShow(navCardEl, isFromDirectory);
                            clearInterval(clearOverlaysInterval);
                            clearOverlaysInterval = null;
                        } else {
                            if (intervalCount > 5) {
                                waitForVidPlayAndShow(navCardEl, isFromDirectory);
                                clearInterval(clearOverlaysInterval);
                                clearOverlaysInterval = null;
                            } else {
                                intervalCount++;
                            }
                        }
                    }
                }
            }, 100);
        } else {
            if (isMultiStreamMode && !isNavBarCollapsed && isHovering) {
                let container = lastHoveredCardEl.querySelector('div[data-a-target="side-nav-live-status"]');
                if (container) {
                    container.appendChild(navCardPipBtn);
                }
            }
        }
    } catch (e) {

    }
}

function setMouseOverListeners(navCardEl) {
    navCardEl.onmouseover = function () {
        if (!isHovering) {
            isHovering = true;
            lastHoveredCardEl = navCardEl;

            if (clearVidPlayInterval) {
                clearInterval(clearVidPlayInterval);
                clearVidPlayInterval = null;
            }

            if (previewDiv) {
                if (previewDiv.classList.contains("tp-anim-duration-1s")) {
                    previewDiv.classList.remove("tp-anim-duration-1s");
                }
                //previewDiv.classList.remove("slideOutRight");
                if (previewDiv.style.display === "none") {
                    previewDiv.classList.add(isLayoutHorizontallyInverted ? 'slideInRight':'slideInLeft');
                }
                changeAndShowPreview();
            } else {
                createAndShowPreview();
                previewDiv.classList.add(isLayoutHorizontallyInverted ? 'slideInRight':'slideInLeft');
            }

            setTimeout(function () {
                if (previewDiv) {
                    previewDiv.classList.remove(isLayoutHorizontallyInverted ? 'slideInRight':'slideInLeft');
                }
            },200)

            setTimeout(function () {
                if (isStreamerOnline(lastHoveredCardEl)) {
                    if(clearOverlaysInterval) {
                        clearInterval(clearOverlaysInterval);
                        clearOverlaysInterval = null;
                    }
                    clearOverlays(navCardEl);
                }
            }, 1000)
        } else {

        }

    };

    navCardEl.onmouseleave = function () {
        isHovering = false;

        setTimeout(function () {
            try {
                if (!isHovering) {
                    // shouldSlideOut
                    previewDiv.classList.add(isLayoutHorizontallyInverted ? 'slideOutRight':'slideOutLeft');
                    setTimeout(function () {
                        isHovering = false;
                        if (previewDiv) {
                            hidePreview();
                            previewDiv.classList.remove(isLayoutHorizontallyInverted ? 'slideOutRight':'slideOutLeft');
                        }
                    },250)
                }
                removePipBtn();
                removeVidPreviewVolBtn();
            } catch (e) {

            }

        },50)
    }
}

function setDirectoryMouseOverListeners(navCardEl) {
    navCardEl.onclick = function () {
        isHovering = false;
        clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
    };

    navCardEl.onmouseover = function () {
        if (!options.isDirpEnabled) {
            return;
        }
        if (previewDiv) {
            clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
        }
        isHovering = true;
        lastHoveredCardEl = navCardEl;

        if(lastHoveredCardEl.href.indexOf("/videos/") > 0 || lastHoveredCardEl.href.indexOf("/clip/") > 0) {
            return;
        }

        createAndShowDirectoryPreview();

        setTimeout(function () {
            if (twitchIframe && twitchIframe.contentDocument && twitchIframe.contentDocument.querySelector('video')) {
                twitchIframe.contentDocument.querySelector('video').style.cursor = "pointer";
                twitchIframe.contentDocument.querySelector('video').onclick = function () {
                    isHovering = false;
                    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
                    window.location = "https://www.twitch.tv/" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1);
                }
                if (isStreamerOnline(lastHoveredCardEl)) {
                    if(clearOverlaysInterval) {
                        clearInterval(clearOverlaysInterval);
                        clearOverlaysInterval = null;
                    }
                    clearOverlays(navCardEl, true);
                }
            }
        }, 1000)

    };
    navCardEl.onmouseleave = function () {
        if (previewDiv && previewDiv.style.visibility === "hidden") {
            clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
            clearLoadingRoller(navCardEl);
            isHovering = false;
        }
    }
}

function refreshDirectoryNavCardsListAndListeners() {
    let directoryNavCards = document.querySelectorAll('a[data-a-target="preview-card-image-link"]');
    for (let i = 0; i < directoryNavCards.length; i++) {
        setDirectoryMouseOverListeners(directoryNavCards[i]);
    }
}

function getSidebarNavCards(ancestor) {
    isNavBarCollapsed = document.getElementsByClassName('side-nav--collapsed').length > 0;
    let parentSearchContainer = ancestor || document;
    let navCards;
    if (isNavBarCollapsed) {
        if (parentSearchContainer.querySelectorAll('a.side-nav-card')[0] && parentSearchContainer.querySelectorAll('a.side-nav-card')[0].href){
            navCards = parentSearchContainer.querySelectorAll('a.side-nav-card');
        } else {
            isNavBarCollapsed = false;
            navCards = parentSearchContainer.getElementsByClassName('side-nav-card__link');
        }
    } else {
        navCards = parentSearchContainer.getElementsByClassName('side-nav-card__link');
    }
    return navCards;
}

function refreshNavCardsListAndListeners() {
    if (document.getElementById('sideNav')) {
        let navCards = getSidebarNavCards();
        //let navCards = document.getElementsByClassName('side-nav-card__link');
        for (let i = 0; i < navCards.length; i++) {
            navCards[i].lastImageLoadTimeStamp = new Date().getTime();
            setMouseOverListeners(navCards[i]);
        }
    }
}

function ga_heartbeat() {
    sendMessageToBG({action: "heartbeat", detail: ""});
    setTimeout(ga_heartbeat, 325000);
}

function getCalculatedPreviewSizeByWidth (width) {
    return {width: width, height: 0.5636363636363636 * width};
}

function setDirectoryCardsListeners() {
    if (options.isDirpEnabled) {
        if (document.querySelector('.common-centered-column')) {
            refreshDirectoryNavCardsListAndListeners();
        }
    }
}

function clickChannelPointsBtn() {
    let btn = document.querySelector('.claimable-bonus__icon');
    if (btn) {
        btn.click();
    }
}

function setChannelPointsClickerListeners() {
    if (!channelPointsClickerInterval) {
        clickChannelPointsBtn();
        channelPointsClickerInterval = setInterval(function() {
            clickChannelPointsBtn();
        }, 15000);
    }
}

function clearExistingPreviewDivs(className, isFromPip) {
    let previewDivs = document.querySelectorAll('.' + className);
    for (let i = 0; i < previewDivs.length; i++) {
        if (previewDivs[i]) {
            previewDivs[i].parentNode.removeChild(previewDivs[i]);
        }
    }
    if (!isFromPip) {
        previewDiv = null;
        twitchIframe = null;
    }
}

function ga_report_appStart() {
    let sidebar_previews = options.isSidebarPreviewsEnabled ? "sBarP_ON":"sBarP_OFF";
    let size = options.PREVIEWDIV_WIDTH + "px";
    let mode = options.isImagePreviewMode ? "Image":"Video";
    let dirp = options.isDirpEnabled ? "dirp_ON":"dirp_OFF";
    let errRefresh = options.isErrRefreshEnabled ? "errRefresh_ON":"errRefresh_OFF";
    let channelPointsClicker = options.isChannelPointsClickerEnabled ? "cpc_ON":"cpc_OFF";
    let sidebarExtend = options.isSidebarExtendEnabled ? "sBarE_ON" : "sBarE_OFF";
    let sidebarSearch = options.isSidebarSearchEnabled ? "sBarS_ON" : "sBarS_OFF";
    let pvqc = options.isPvqcEnabled ? "pvqc_ON" : "pvqc_OFF";
    let isfScrnWithChatEnabled = options.isfScrnWithChatEnabled ? "fScrnC_ON" : "fScrnC_OFF";
    let predictionsNotifications = options.isPredictionsNotificationsEnabled ? "PN_ON" : "PN_OFF";
    let predictionsSniper = options.isPredictionsSniperEnabled ? "APS_ON" : "APS_OFF";
    let selfPreview = options.isSelfPreviewEnabled ? "SP_ON" : "SP_OFF";
    let multiStream = options.isMultiStreamEnabled ? "multiStream_ON" : "multiStream_OFF";
    let pip_main = options.isPipEnabled ? "pip_ON" : "pip_OFF";

    sendMessageToBG({action: "appStart", detail: sidebar_previews + " : " + mode + " : " + size + " : " + dirp + " : "
            + channelPointsClicker + " : " + sidebarSearch + " : " + sidebarExtend + " : " + isfScrnWithChatEnabled + " : " + errRefresh
            + " : " + pvqc + " : " + predictionsNotifications + " : " + predictionsSniper + " : " + selfPreview + " : " + multiStream
            + " : " + pip_main});
}

function refreshPageOnMainTwitchPlayerError(fullRefresh) {
    sendMessageToBG({action: "bg_errRefresh_exec", detail: ""});

    if (fullRefresh) {
        location.replace(window.location);
    } else {
        let btn = document.querySelector('.content-overlay-gate__allow-pointers button');
        if(btn) {
            btn.click();
            isMainPlayerError = false;
            setTimeout(function (){
                checkForAutoRefresh();
            }, 10000);
        } else {
            location.replace(window.location);
        }
    }
}

function checkForAutoRefresh() {
    let el = document.querySelector('p[data-test-selector="content-overlay-gate__text"]');
    if (el) {
        if (['1000', '2000', '4000'].some(x => el.innerText.indexOf(x) >= 0)) {
            if (!document.hidden) {
                refreshPageOnMainTwitchPlayerError();
            } else {
                isMainPlayerError = true;
            }
        }
    } else {
        listenForPlayerError();
    }
}

function listenForPlayerError() {
    try{
        let t_player = document.querySelector(".video-player").querySelector('video');
        if (t_player.attributes.tp_abort_listener) {
            return;
        }

        t_player.addEventListener('abort', (event) => {
            if (options.isErrRefreshEnabled) {
                setTimeout(function (){
                    checkForAutoRefresh();
                },100)
            }
        });
        t_player.setAttribute('tp_abort_listener', 'true');
    } catch (e) {

    }
}

function extendSidebarSection(sideNavSection) {
    if(sideNavSection) {
        if (sideNavSection.querySelector('button[data-a-target="side-nav-show-more-button"]')) {
            sideNavSection.querySelector('button[data-a-target="side-nav-show-more-button"]').click();
        }
    }
}

function extendSidebar() {
    if (!isNavBarCollapsed) {
        let sideNavSections = document.getElementsByClassName('side-nav-section');
        if(sideNavSections[0]) {
            let navCards = getSidebarNavCards(sideNavSections[0]);
            if (isStreamerOnline(navCards[navCards.length - 1])) {
                extendSidebarSection(sideNavSections[0]);
                if (timesExtendedSidebar < 15) {
                    timesExtendedSidebar++;
                    setTimeout(function (){
                        extendSidebarSection(sideNavSections[0]);
                    },300);
                } else {
                    timesExtendedSidebar = 0;
                    extendSidebarSection(sideNavSections[1]);
                    extendSidebarSection(sideNavSections[2]);
                }
            } else {
                timesExtendedSidebar = 0;
                extendSidebarSection(sideNavSections[1]);
                extendSidebarSection(sideNavSections[2]);
            }
        }
    }
}

function searchStreamer(e) {
    let filter = e.target.value.toUpperCase()
    let navCards = getSidebarNavCards();

    for (let i = 0; i < navCards.length; i++) {
        if (navCards[i].getElementsByTagName('p')[0].innerText.toUpperCase().indexOf(filter) > -1) {
            navCards[i].parentElement.classList.remove("tp_display_none");
        } else {
            navCards[i].parentElement.classList.add("tp_display_none");
        }
    }
}

function createSidebarSearchInput() {
    let search_input_container = document.createElement("div");
    search_input_container.id = "tp_sidebar_search_input_container";

    isLayoutHorizontallyInverted ? search_input_container.style.right = "1rem" : search_input_container.style.left = "1rem";
    search_input_container.classList.add('tp_search_input_container');
    search_input_container.classList.add('animated');
    search_input_container.classList.add('fadeIn');

    let search_input = document.createElement("input");
    search_input.id = "tp_sidebar_search_input";
    search_input.placeholder = "Search Streamer";
    search_input.classList.add('tp_search_input');
    search_input.addEventListener('input', searchStreamer);

    let search_close_btn = document.createElement("div");
    search_close_btn.classList.add('tp_search_close_btn');
    search_close_btn.style.backgroundImage = "url('" + getRuntimeUrl('../images/tp_sidebar_search_close.png') + "')";
    search_close_btn.onclick = function () {
        searchStreamer({target: {value: ""}});
        document.getElementById('tp_sidebar_search_input_container').parentElement.removeChild(document.getElementById('tp_sidebar_search_input_container'));
    }

    search_input_container.appendChild(search_input);
    search_input_container.appendChild(search_close_btn);

    return search_input_container;
}

function showSidebarSearchInput() {
    document.getElementsByClassName('side-nav-header')[0].appendChild(createSidebarSearchInput());
}

function sidebarSearchBtnClick() {
    showSidebarSearchInput();
    document.getElementById('tp_sidebar_search_input').focus();
    extendSidebar();
    sendMessageToBG({action: "bg_sBarS_btn_click", detail: true});
}

function createSideBarSearchBtn() {
    let search_btn = document.createElement("div");
    search_btn.id = "tp_sidebar_search_btn";
    search_btn.classList.add('tp-sidebar-search-btn');
    search_btn.style.backgroundImage = "url('" + getRuntimeUrl('../images/tp_sidebar_search.png') + "')";
    isLayoutHorizontallyInverted ? search_btn.style.left = "4rem" : search_btn.style.right = "4rem";
    search_btn.title = "Twitch Previews - Search Streamers";
    search_btn.onclick = sidebarSearchBtnClick;

    return search_btn;
}

function showSidebarSearchBtn() {
    if (document.getElementById('tp_sidebar_search_btn')) {
        return;
    }

    if (!isNavBarCollapsed) {
        let sidenav_header = document.getElementsByClassName('side-nav-header')[0];
        if (sidenav_header) {
            sidenav_header.appendChild(createSideBarSearchBtn());
        }
    }
}

function checkForTwitchNotificationsPermissions(featureName) {
    if (Notification.permission !== "granted") {
        Notification.requestPermission().then(function (res){
            if (res === "denied") {
                if(isFirefox) {
                    alert("Twitch Previews:\nFor Predictions Notifications please enable notifications from twitch.tv\n(you should have a text bubble or a lock icon on the left of the URL)\nand then enable the feature.");
                }
                settings_predictionsNotifications_cb_off();
                return;
            }
            sendMessageToBG({action: "bg_update_" + featureName, detail: true});
            onSettingChange(featureName, true);
            showNotification("Twitch Previews", "Predictions Notifications Enabled!", getRuntimeUrl('../images/TP96.png'), true);
        },function (err) {
            settings_predictionsNotifications_cb_off();
            onSettingChange(featureName, false);
        });
    } else {
        sendMessageToBG({action: "bg_update_" + featureName, detail: true});
        onSettingChange(featureName, true);
        showNotification("Twitch Previews", "Predictions Notifications Enabled!", getRuntimeUrl('../images/TP96.png'), true);
    }
}

function showNotification(title, body, icon, dont_send_PN_SHOW_event) {
    if (Notification.permission !== "granted") {
        onSettingChange('isPredictionsNotificationsEnabled', false);
        settings_predictionsNotifications_cb_off();
        return;
    }
    let notification = new Notification(title, {
        icon: icon,
        body: body,
        silent: true
    });

    notification.onclick = function () {
        parent.focus();
        window.focus();
        this.close();
    };
    if (!dont_send_PN_SHOW_event) {
        sendMessageToBG({action: "bg_PN_show", detail: "PN_show"});
    }
}

function checkForPredictions(should_bet_now) {
    let btn_arr = document.querySelectorAll('button[data-test-selector="community-prediction-highlight-header__action-button"]');
    let btn;
    let details_btn;
    if(btn_arr.length > 0) {
        for (let i = 0; i < btn_arr.length; i++) {
            if (predict_langs[btn_arr[i].innerText]) {
                btn = btn_arr[i];
                break;
            } else {
                if (!details_btn) {
                    if (see_details_langs[btn_arr[i].innerText]) {
                        details_btn = btn_arr[i];
                    }
                }
            }
        }
        var isPredictBtn = !!btn;
        btn = btn || details_btn;
        details_btn = null;
    }


    if(btn) {

        /*if (document.querySelector('.toggle-visibility__right-column--expanded')) {
            if (!options.isPvqcEnabled && !document.hidden) {
                last_prediction_streamer = getCurrentStreamerName();
                last_prediction_button_text = btn.innerText;
                return;
            }
        }*/

        let curr_streamer = getCurrentStreamerName();
        if (last_prediction_streamer === curr_streamer && btn.innerText === last_prediction_button_text) {
            return;
        }
        let curr_streamer_img_url = '';

        try {
            curr_streamer_img_url = document.getElementsByClassName('channel-info-content')[0].getElementsByTagName('img')[0].src;
        } catch (e) {

        }
        last_prediction_streamer = curr_streamer;
        last_prediction_button_text = btn.innerText;
        let prediction_text = "";

        try {
            var elements = btn.parentNode.parentNode.querySelectorAll('p');
        } catch (e) {

        }


        if (isPredictBtn) {
            if (elements) {
                for (let i = 0; i < elements.length; i++) {
                    prediction_text += elements[i].innerText.replace(/^ /, '');
                    if (i !== elements.length - 1) {
                        prediction_text += "\n";
                    }
                }
            }

            if(options.isPredictionsSniperEnabled) {

                _browser.storage.local.get('aps_streams_settings_obj', function(res) {
                    let curr_stream_aps_settings = null;
                    if (res.aps_streams_settings_obj && res.aps_streams_settings_obj[curr_streamer]) {
                        curr_stream_aps_settings = res.aps_streams_settings_obj[curr_streamer];
                    }
                    initAutoPredictionsSniper(curr_stream_aps_settings, should_bet_now).then(function (res){
                        if (options.isPredictionsNotificationsEnabled) {
                            if (!should_bet_now) {
                                showNotification(curr_streamer + ": " + "Prediction Started\n",  prediction_text + "\nPredictions sniper active!", curr_streamer_img_url);
                            }
                        }
                    },function (res){
                        if (options.isPredictionsNotificationsEnabled) {
                            if (res === 'prediction_closed_or_ended') {
                                showNotification(curr_streamer + ": " + "Prediction Closed / Ended\n", prediction_text + "\nPrediction closed before the sniper could vote", curr_streamer_img_url);
                            } else {
                                initAutoPredictionsSniper(curr_stream_aps_settings, should_bet_now).then(function (res) {
                                    if (!should_bet_now) {
                                        showNotification(curr_streamer + ": " + "Prediction Started\n", prediction_text + "\nPredictions sniper active!", curr_streamer_img_url);
                                    }
                                }, function (res){
                                    if (res === 'prediction_closed_or_ended') {
                                        showNotification(curr_streamer + ": " + "Prediction Closed / Ended\n", prediction_text + "\nPrediction closed before the sniper could vote", curr_streamer_img_url);
                                    } else {
                                        showNotification(curr_streamer + ": " + "Prediction Closed / Ended\n", "Predictions sniper failed to monitor / join prediction, try refreshing the page if prediction still active", curr_streamer_img_url);
                                    }
                                })
                            }
                        }
                    });
                });
            } else {
                if(options.isPredictionsNotificationsEnabled) {
                    showNotification(curr_streamer + ": " + "Prediction Started\n", prediction_text, curr_streamer_img_url);
                }
            }
        } else {
            if (elements) {
                prediction_text = elements[0].innerText.replace(/^ /, '');
            }

            if (options.isPredictionsSniperEnabled) {
                set_APS_settings_btn_icon_and_title('idle');
                getPredictionsSniperResults().then(function (res){
                    if (options.isPredictionsNotificationsEnabled) {

                        let extraText = '';
                        if (APS_awaiting_to_place_bet_streamName === curr_streamer) {
                            extraText = '\nPrediction closed before the sniper could vote';
                            APS_awaiting_to_place_bet_streamName = null;
                        }

                        if (APS_didnt_vote_reason_margin_percent) {
                            extraText = "\nSniper didn't vote: vote margin was too low: " + APS_didnt_vote_reason_margin_percent;
                            APS_didnt_vote_reason_margin_percent = null;
                        }


                        switch(res.prediction_status) {
                            case "ended":
                                showNotification(curr_streamer + ": " + "Prediction Ended", (res.prediction_question_answer_str ? res.prediction_question_answer_str : prediction_text) + "\n" + res.text1, curr_streamer_img_url);
                               // showNotification(curr_streamer + ": " + "Prediction Ended", prediction_text + "\n" + res.text1, curr_streamer_img_url);
                                break;
                            case "closed":
                                showNotification(curr_streamer + ": " + "Prediction Closed", (res.prediction_title_and_options_str ? res.prediction_title_and_options_str : prediction_text) + "\n" + res.text1 + extraText, curr_streamer_img_url);
                                break;
                            case "unknown":
                                showNotification(curr_streamer + ": " + "Prediction Closed / Ended", prediction_text + extraText, curr_streamer_img_url);
                                break;
                            default:
                                showNotification(curr_streamer + ": " + "Prediction Closed / Ended", prediction_text + extraText, curr_streamer_img_url);
                                break;
                        }
                    }
                });
            } else {
                if (options.isPredictionsNotificationsEnabled) {
                    showNotification(curr_streamer + ": " + "Prediction Closed / Ended", prediction_text, curr_streamer_img_url);
                }
            }
        }
    } else {
        last_prediction_streamer = "";
    }
}

function simulateHoverForPoints(selectedEvent ,el) {
    const event = new MouseEvent(selectedEvent, {
        view: window,
        bubbles: true,
        cancelable: true
    });

    el.dispatchEvent(event);
}

function getChannelPointsNum() {
    return new Promise((resolve, reject) => {

        // simulate hover to get channel points from tooltip
        simulateHoverForPoints('mouseover',document.getElementsByClassName('community-points-summary')[0].getElementsByTagName('button')[0]);
        // get points from tooltip
        setTimeout(function (){
            let tooltip = document.getElementsByClassName('tw-tooltip-wrapper')[0];
            if (tooltip) {
                let points_str_extract_arr = tooltip.innerText.match(/\d+/g);
                let points = '';
                for (let i = 0; i < points_str_extract_arr.length; i++) {
                    points += points_str_extract_arr[i];
                }
                simulateHoverForPoints('mouseout',document.getElementsByClassName('community-points-summary')[0].getElementsByTagName('button')[0]);
                resolve(points);
            } else {
                simulateHoverForPoints('mouseover',document.getElementsByClassName('community-points-summary')[0].getElementsByTagName('button')[0]);
                setTimeout(function (){
                    tooltip = document.getElementsByClassName('tw-tooltip-wrapper')[0];
                    if (tooltip) {
                        let points_str_extract_arr = tooltip.innerText.match(/\d+/g);
                        let points = '';
                        for (let i = 0; i < points_str_extract_arr.length; i++) {
                            points += points_str_extract_arr[i];
                        }
                        simulateHoverForPoints('mouseout',document.getElementsByClassName('community-points-summary')[0].getElementsByTagName('button')[0]);
                        resolve(points);
                    } else {
                        resolve(null);
                    }
                }, 500);
            }
        }, 450);
    })
}

function setTextAreaValue(element, value) {
    let prototypeValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set;
    prototypeValueSetter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

function closePopoutMenu() {
    let closePopoutBtn = document.getElementsByClassName('tw-popover-header__icon-slot--right')[0];
    if (closePopoutBtn && closePopoutBtn.firstChild) {
        closePopoutBtn.firstChild.click();
    }
}

function clickChannelPointsButton() {
    try {
        document.getElementsByClassName('community-points-summary')[0].getElementsByTagName('button')[0].click();
    } catch (e) {
        //console.log(e);
    }

}

function getVotePercentageMargin(a, b) {
    return (b / (a + b) * 100) - (a / (a + b) * 100);
}

function extractVotersNumberFromString(str) {
    let numOfStrChars = 0;
    let num = '';
    let isContainingStringChar = false;
    for(let i = 0; i < str.length; i++) {
        if (isNaN(str[i])) {
            numOfStrChars++;
            isContainingStringChar = true;
        }
    }
    if (isContainingStringChar) {
        for(let j = 0; j < str.length; j++) {
            if (!isNaN(str[j])) {
                num += str[j];
            }
        }
        return numOfStrChars > 1 ? num * 100 : num * 1000;
    } else {
        return parseInt(str);
    }
}

function sendPredictionCompletionEvent() {
    sendMessageToBG({action: "bg_APS_res", detail: document.querySelector('div[data-test-selector="prediction-checkout-completion-step__winnings-string"]') ? 'W' : document.querySelector('p[data-test-selector="prediction-checkout-completion-step__luck-string"]') ? 'L': 'N/A'});
}

function getPredictionsSniperResults() {
    return new Promise((resolve, reject) => {

        // unknown
        // closed
        // ended

        let return_obj = {
            prediction_status: 'unknown',
            text1: ''//,
            //prediction_question_answer_str: ''
            //prediction_title_and_options_str: ''
        };

        try {
            closePopoutMenu();
            setTimeout(function () {

                clickChannelPointsButton();
                setTimeout(function (){

                    // click predictions title body button at the top of channel points view to open predictions view
                    let predictions_list_item_body = document.getElementsByClassName("predictions-list-item__body")[0];
                    if (!predictions_list_item_body) {
                        return_obj.prediction_status = 'unknown';
                        closePopoutMenu();
                        resolve(return_obj);
                        return;
                    }
                    predictions_list_item_body.click();

                    setTimeout(function (){

                        //return_obj.prediction_title = document.getElementsByClassName('prediction-checkout-details-header')[0].getElementsByClassName('tw-title')[0].innerText;
                        //return_obj.prediction_subTitle = document.getElementsByClassName('prediction-checkout-details-header')[0].getElementsByTagName('p')[1].innerText;

                        // prediction end screen results
                        let results_str = document.querySelector('div[data-test-selector="prediction-checkout-completion-step__winnings-string"]') || document.querySelector('p[data-test-selector="prediction-checkout-completion-step__luck-string"]');

                        if(results_str && results_str.innerText) {
                            return_obj.prediction_status = 'ended';
                            return_obj.text1 = results_str.innerText.replace(' \n','');
                            return_obj.prediction_question_answer_str = document.querySelector('.prediction-checkout-completion-step__header').nextElementSibling.innerText;
                            console.log(new Date().toLocaleString() + "\nAPS: " + return_obj.text1);
                            sendPredictionCompletionEvent();
                        }

                        try {
                            let predictions_bottom_text = document.querySelector('span[data-test-selector="user-prediction-string__outcome-title"]').parentElement.innerText
                            if (predictions_bottom_text) {
                                return_obj.prediction_status = 'closed';
                                return_obj.prediction_title_and_options_str =
                                    document.getElementsByClassName('prediction-checkout-details-header')[0].getElementsByClassName('tw-title')[0].innerText
                                    + " "
                                    + document.querySelectorAll('div[data-test-selector="prediction-summary-outcome__title"]')[0].innerText
                                    + " / "
                                    + document.querySelectorAll('div[data-test-selector="prediction-summary-outcome__title"]')[1].innerText;
                                return_obj.text1 = predictions_bottom_text.replace(' \n','');
                            }
                        } catch (e) {

                        }

                        closePopoutMenu();
                        resolve(return_obj);
                    }, 120);
                }, 200);
            }, 400);
        } catch (e) {
            return_obj.prediction_status = 'unknown';
            //console.log(e);
            resolve(return_obj);
        }
    })
}

function clearPredictionStatus() {
    clearTimeout(predictionSniperTimeout);
    predictionSniperTimeout = null
    set_APS_settings_btn_icon_and_title('idle');
}

function getCurrentStreamerName() {
    return document.getElementsByClassName('channel-info-content')[0].getElementsByTagName('a')[1].innerText;
}

function initAutoPredictionsSniper(curr_stream_aps_settings, should_bet_now) {

    return new Promise((resolve, reject) => {
        try {
            // close the popout menu if it's opened.
            closePopoutMenu();

            setTimeout(function () {

                // click channel points button
                clickChannelPointsButton();

                setTimeout(function (){
                    try {
                        // get time remaining
                        // channel points view time left
                        let time_remaining_str_extract_arr = document.querySelector('p[data-test-selector="predictions-list-item__subtitle"]').innerText.match(/\d+/g)
                        if (time_remaining_str_extract_arr == null) {
                            clearPredictionStatus();
                            reject('prediction_closed_or_ended');
                            return;
                        }

                        let ms_UntilPrediction;
                        if (should_bet_now) {
                            ms_UntilPrediction = 0;
                        } else {
                            ms_UntilPrediction = (time_remaining_str_extract_arr[0] * 60 * 1000) + (time_remaining_str_extract_arr[1] * 1000);
                            ms_UntilPrediction -= ((curr_stream_aps_settings ? curr_stream_aps_settings.aps_secondsBefore : options.aps_secondsBefore) * 1000) + 2000; //decrease by seconds set in options (seconds * 1000)
                        }

                        //let prediction_question = document.querySelector('p[data-test-selector="predictions-list-item__title"]').innerText

                        if (ms_UntilPrediction > 1000) {
                            // close channel points view
                            closePopoutMenu();
                        }

                        // clear time out in case the user switched streams and a new prediction started there.
                        if (predictionSniperTimeout) {
                            clearPredictionStatus();
                        }

                        APS_awaiting_to_place_bet_streamName = getCurrentStreamerName();
                        // wait amount of seconds to predict
                        predictionSniperTimeout = setTimeout(function () {
                            // execute prediction sniper

                            _browser.storage.local.get('aps_streams_settings_obj', function(res) {
                                let curr_stream_aps_settings = null;
                                let curr_stream_name = getCurrentStreamerName();
                                if (res.aps_streams_settings_obj && res.aps_streams_settings_obj[curr_stream_name]) {
                                    curr_stream_aps_settings = res.aps_streams_settings_obj[curr_stream_name];
                                } else {
                                    curr_stream_aps_settings = options;
                                }

                                APS_awaiting_to_place_bet_streamName = null;
                                APS_didnt_vote_reason_margin_percent = null;
                                if (curr_stream_aps_settings.aps_percent === 0) {
                                    clearPredictionStatus();
                                    return;
                                }

                                // get number of channel points
                                getChannelPointsNum().then(function (totalChannelPointNum) {

                                    if(!totalChannelPointNum) {
                                        clearPredictionStatus();
                                        return;
                                    }

                                    // close the popout menu if it's opened.
                                    closePopoutMenu();

                                    setTimeout(function (){

                                        // click channel points button
                                        clickChannelPointsButton();

                                        setTimeout(function () {
                                            // click predictions title body button at the top of channel points view to open predictions view
                                            let predictions_list_item_body = document.getElementsByClassName("predictions-list-item__body")[0];
                                            if (!predictions_list_item_body) {
                                                closePopoutMenu();
                                                clearPredictionStatus();
                                                return;
                                            }
                                            predictions_list_item_body.click();

                                            setTimeout(function () {

                                                // check if already entered
                                                try {
                                                    if (document.getElementsByClassName('prediction-checkout-details-header')[0].parentElement.children[2].firstChild.getElementsByClassName('channel-points-icon')[0].parentElement.innerText.length > 5) {
                                                        console.log(new Date().toLocaleString() + "\nAPS: already voted");
                                                        closePopoutMenu();
                                                        clearPredictionStatus();
                                                        return;
                                                    }
                                                } catch (e) {

                                                }

                                                // click the "predict with custom points" button.
                                                let predict_with_custom_points_btn = document.querySelector('button[data-test-selector="prediction-checkout-active-footer__input-type-toggle"]');
                                                if (!predict_with_custom_points_btn) {
                                                    closePopoutMenu();
                                                    clearPredictionStatus();
                                                    return;
                                                }
                                                predict_with_custom_points_btn.click();

                                                // get votes
                                                // twitch has a bug with switched classnames in the options elements, get numbers by render order.
                                                let stat_fields = document.querySelectorAll('div[data-test-selector="prediction-summary-stat__content"]');
                                                let left_vote_count = extractVotersNumberFromString(stat_fields[2].children[1].innerText);
                                                let right_vote_count = extractVotersNumberFromString(stat_fields[6].children[1].innerText);

                                                // vote margin
                                                let vote_margin_percent = getVotePercentageMargin(left_vote_count, right_vote_count);
                                                if (vote_margin_percent < 0) {
                                                    vote_margin_percent *= -1;
                                                }
                                                if (vote_margin_percent < curr_stream_aps_settings.aps_min_vote_margin_percent) {
                                                    console.log(new Date().toLocaleString() + "\nAPS:\nvote_margin_percent too low: " + vote_margin_percent + "%\nmin_vote_margin_percent: " + curr_stream_aps_settings.aps_min_vote_margin_percent + "%");
                                                    APS_didnt_vote_reason_margin_percent = vote_margin_percent.toFixed(2) + "%";
                                                    closePopoutMenu();
                                                    clearPredictionStatus();
                                                    return;
                                                }

                                                let selectedOption = left_vote_count > right_vote_count ? 0 : 1;

                                                // input number to predict with % of total points
                                                let prediction_bet_amount = Math.floor((curr_stream_aps_settings.aps_percent / 100) * totalChannelPointNum);

                                                if (prediction_bet_amount === 0) {
                                                    prediction_bet_amount = 1;
                                                }
                                                if (prediction_bet_amount > curr_stream_aps_settings.aps_max_points) {
                                                    prediction_bet_amount = curr_stream_aps_settings.aps_max_points;
                                                }

                                                console.log(new Date().toLocaleString() +
                                                    "\nAPS: " +
                                                    "\nleft: " + left_vote_count +
                                                    "\nright: " + right_vote_count +
                                                    "\nselected_option: " + (selectedOption ? "right" : "left") +
                                                    "\nbet_amount: " + prediction_bet_amount + " points" +
                                                    "\nwinnings_ratio: " + stat_fields[selectedOption ? 5:1].children[1].innerText +
                                                    "\nvote_margin_percent: " + vote_margin_percent + "%"
                                                );

                                                if (isFirefox) {
                                                    window.postMessage({selectedOption:selectedOption, prediction_bet_amount:prediction_bet_amount },"https://www.twitch.tv");
                                                } else {
                                                    setTextAreaValue(document.getElementsByClassName('custom-prediction-button')[selectedOption].getElementsByTagName('input')[0], prediction_bet_amount);
                                                    // click vote
                                                    document.getElementsByClassName('custom-prediction-button__interactive')[selectedOption].click();
                                                }

                                                setTimeout(function (){
                                                    if(options.isPredictionsNotificationsEnabled) {
                                                        let curr_streamer = '';
                                                        let curr_streamer_img_url = '';
                                                        let prediction_question = '';
                                                        let sniper_selection_str = '';
                                                        let prediction_options_str = '';

                                                        try {
                                                            curr_streamer = getCurrentStreamerName();
                                                            curr_streamer_img_url = document.getElementsByClassName('channel-info-content')[0].getElementsByTagName('img')[0].src;
                                                            prediction_question = document.querySelector('.prediction-checkout-details-header').firstChild.innerText;
                                                            sniper_selection_str = document.querySelectorAll('div[data-test-selector="prediction-summary-outcome__title"]')[selectedOption].innerText;
                                                            prediction_options_str = document.querySelectorAll('div[data-test-selector="prediction-summary-outcome__title"]')[0].innerText + " / " + document.querySelectorAll('div[data-test-selector="prediction-summary-outcome__title"]')[1].innerText
                                                        } catch (e) {

                                                        }

                                                        showNotification(curr_streamer + ": " + "Sniper voted!\n", prediction_question + " " + prediction_options_str + '\nSniper voted "' + sniper_selection_str + '" with ' + prediction_bet_amount + " points!", curr_streamer_img_url, true);
                                                    }

                                                    closePopoutMenu();

                                                    sendMessageToBG({action: "bg_APS_exec", detail: "bg_APS_exec"});
                                                    clearPredictionStatus();
                                                }, 250);
                                            }, 120);
                                        }, 150);
                                    },400);
                                });
                            });
                        }, ms_UntilPrediction > 0 ? ms_UntilPrediction : 0);
                        set_APS_settings_btn_icon_and_title('active');
                        resolve('ok');
                    } catch (e) {
                        console.log(new Date().toLocaleString() + "\nAPS:\n" + e);
                        clearPredictionStatus();
                        reject(e);
                    }
                }, 150);
            }, 400);
        } catch (e) {
            console.log(new Date().toLocaleString() + "\nAPS:\n" + e);
            clearPredictionStatus();
            reject(e);
        }
    })
}

function setPredictionsNotifications() {
    if (!predictionsNotificationsWorker) {

        if (isFirefox) {
            let s = document.createElement("script");
            s.innerHTML = "window.addEventListener(\"message\", (event) => {\n" +
                "            if (event.origin !== \"https://www.twitch.tv\"){return;}\n" +
                "            if (!event.data.prediction_bet_amount){return;}\n" +
                "        try {\n" +
                "            let element = document.getElementsByClassName('custom-prediction-button')[event.data.selectedOption].getElementsByTagName('input')[0];\n" +
                "            let prototypeValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set;\n" +
                "            prototypeValueSetter.call(element, event.data.prediction_bet_amount);\n" +
                "            element.dispatchEvent(new Event('input', { bubbles: true }));\n" +
                "            document.getElementsByClassName('custom-prediction-button__interactive')[event.data.selectedOption].click();\n" +
                "        } catch (e) {\n" +
                "            console.log(e);\n" +
                "        }\n" +
                "        }, false);";

            document.body.appendChild(s);
        }

        function worker_function() {
            let timer;
            self.onmessage = function(event) {
                if (event.data === "start_predictions_timer") {
                    timer = setInterval(function() {
                        postMessage('worker-predictions-tick');
                    }, 15100);
                    postMessage('worker-started');
                }
            };
        }

        if(window !== self) {
            worker_function();
        }

        checkForPredictions();
        predictionsNotificationsWorker = new Worker(URL.createObjectURL(new Blob(["("+worker_function.toString()+")()"], {type: 'text/javascript'})));
        predictionsNotificationsWorker.onmessage = function(event) {
            if (event.data === "worker-predictions-tick") {
                checkForPredictions();
            }
        };
        predictionsNotificationsWorker.postMessage("start_predictions_timer");
    }
}

function clickFullscreen() {
    if (document.querySelector('button[data-a-target="player-fullscreen-button"]')) {
        document.querySelector('button[data-a-target="player-fullscreen-button"]').click();
    }
}

function fScrnWithChat_exitFullScreen_callback(e) {
    if (!document.fullscreenElement) {
        exit_fScrnWithChat();
    }
}

function enter_fScrnWithChat() {
    document.querySelector('.video-player__container').addEventListener("fullscreenchange", fScrnWithChat_exitFullScreen_callback);
    createMultiStreamBox(window.location.pathname.substring(1), true, true, true);
    hasEnteredFScreenWithChat = true;
    sendMessageToBG({action: "bg_fScrnWithChat_click", detail: true});
}

function exit_fScrnWithChat() {
    document.querySelector('.video-player__container').removeEventListener("fullscreenchange", fScrnWithChat_exitFullScreen_callback);
    clearExistingPreviewDivs('tp-multi-stream-fScrnWithChat', true);
    hasEnteredFScreenWithChat = false;
}

function toggle_fScrnWithChat() {
    if (hasEnteredFScreenWithChat) {
        clickFullscreen();
        exit_fScrnWithChat();
    } else {
        clickFullscreen();
        enter_fScrnWithChat();
    }
}

function setfScrnWithChatBtn() {
    if (document.getElementById('tp_fScrnWithChat_btn')) {
        return;
    }
    try {
        let ttv_theater_mode_btn = document.querySelector('button[data-a-target="player-theatre-mode-button"]');
        if (ttv_theater_mode_btn) {
            let btn_container = document.createElement('div');
            btn_container.id = "tp_fScrnWithChat_btn";
            btn_container.classList.add('tp-player-control');
            btn_container.title = "Toggle Full Screen With Chat";

            let ttv_theater_mode_btn_size = ttv_theater_mode_btn.getBoundingClientRect();
            btn_container.style.width = (ttv_theater_mode_btn_size.width || "30") + "px";
            btn_container.style.height = (ttv_theater_mode_btn_size.height || "30") + "px";
            btn_container.style.zIndex = "1";

            let img = document.createElement('img');
            img.src = getRuntimeUrl('../images/tp_fScrnWithChat.png');
            img.width = (ttv_theater_mode_btn_size.width || "30") * 0.6;
            img.height = (ttv_theater_mode_btn_size.height || "30") * 0.6;
            img.style.margin = "auto";

            btn_container.onclick = function (){
                toggle_fScrnWithChat();
            }
            btn_container.appendChild(img);
            ttv_theater_mode_btn.parentNode.before(btn_container);
        }
    } catch (e) {

    }
}

function setPIPBtn() {
    if (document.getElementById('tp_pip_btn')) {
        return;
    }
    try {
        let ttv_theater_mode_btn = document.querySelector('button[data-a-target="player-theatre-mode-button"]');
        if (ttv_theater_mode_btn) {
            let btn_container = document.createElement('div');
            btn_container.id = "tp_pip_btn";
            btn_container.classList.add('tp-player-control');
            btn_container.title = "Start Picture In Picture";

            let ttv_theater_mode_btn_size = ttv_theater_mode_btn.getBoundingClientRect();
            btn_container.style.width = (ttv_theater_mode_btn_size.width || "30") + "px";
            btn_container.style.height = (ttv_theater_mode_btn_size.height || "30") + "px";
            btn_container.style.zIndex = "1";

            let img = document.createElement('img');
            img.src = getRuntimeUrl('../images/pip.png');
            img.width = (ttv_theater_mode_btn_size.width || "18") * 0.7;
            img.height = (ttv_theater_mode_btn_size.height || "18") * 0.7;
            img.style.margin = "auto";

            btn_container.onclick = function (){
                let video = document.querySelector(".video-player").querySelector('video');
                video.requestPictureInPicture();
                sendMessageToBG({action: "bg_pip_main_started", detail: true});
            }
            btn_container.appendChild(img);
            ttv_theater_mode_btn.parentNode.before(btn_container);
        }
    } catch (e) {

    }
}

function aps_settings_initNumInputValue(settingsContainer, streamName, curr_stream_settings, featureName, inputID, minimum) {

    let input = settingsContainer.querySelector('#' + inputID);
    input.value = curr_stream_settings ? curr_stream_settings[featureName] : options[featureName];

    input.addEventListener('change', (event) => {
        let newVal = parseFloat(event.target.value);
        if (newVal < minimum) {
            newVal = minimum;
            input.value = minimum;
        }

        _browser.storage.local.get('aps_streams_settings_obj', function(res) {
            if (!res.aps_streams_settings_obj) {
                let aps_streams_settings_obj = {
                    [streamName] : {
                        aps_percent: options.aps_percent,
                        aps_max_points: options.aps_max_points,
                        aps_secondsBefore: options.aps_secondsBefore,
                        aps_min_vote_margin_percent: options.aps_min_vote_margin_percent
                    }
                };
                aps_streams_settings_obj[streamName][featureName] = newVal;
                _browser.storage.local.set({'aps_streams_settings_obj': aps_streams_settings_obj}, function() {

                });
            } else {
                if (res.aps_streams_settings_obj[streamName]) {
                    res.aps_streams_settings_obj[streamName][featureName] = newVal;
                    _browser.storage.local.set({'aps_streams_settings_obj': res.aps_streams_settings_obj}, function() {

                    });
                } else {
                    res.aps_streams_settings_obj[streamName] = {
                        aps_percent: options.aps_percent,
                        aps_max_points: options.aps_max_points,
                        aps_secondsBefore: options.aps_secondsBefore,
                        aps_min_vote_margin_percent: options.aps_min_vote_margin_percent
                    }
                    res.aps_streams_settings_obj[streamName][featureName] = newVal;
                    _browser.storage.local.set({'aps_streams_settings_obj': res.aps_streams_settings_obj}, function() {

                    });
                }
            }
        });
        sendMessageToBG({action: "bg_APS_settings_menu_update_" + featureName, detail: newVal});
    })
}

function refresh_aps_settings_menu_ui(status) {
    let aps_settings_menu = document.getElementById('tp_APS_settings_menu');
    if (aps_settings_menu) {
        let menu_shadow_el = aps_settings_menu.querySelector('#tp_APS_title_shadow_el');
        let bet_now_btn = aps_settings_menu.querySelector('#tp_APS_bet_now_btn');
        let cancel_current_bet_btn = aps_settings_menu.querySelector('#tp_APS_cancel_current_bet');

        if (status === 'active') {
            menu_shadow_el.classList.remove('tp-shadow-idle');
            menu_shadow_el.classList.add('tp-shadow-active');

            cancel_current_bet_btn.classList.remove('tp-aps-settings-check-bet-active-btn');
            cancel_current_bet_btn.classList.add('tp-aps-settings-cancel-bet-active-btn');
            cancel_current_bet_btn.innerText = 'Cancel Upcoming Vote';

            bet_now_btn.classList.add('tp-aps-settings-bet-now-active-btn');
        } else {
            menu_shadow_el.classList.remove('tp-shadow-active');
            menu_shadow_el.classList.add('tp-shadow-idle');

            cancel_current_bet_btn.classList.remove('tp-aps-settings-cancel-bet-active-btn');
            cancel_current_bet_btn.classList.add('tp-aps-settings-check-bet-active-btn');
            cancel_current_bet_btn.innerText = 'Check Prediction Now';

            bet_now_btn.classList.remove('tp-aps-settings-bet-now-active-btn');
        }
    }
}

function create_and_show_APS_settings_menu() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', getRuntimeUrl('main/APS_settings.html'), true);
    xhr.onreadystatechange = function() {
        if (this.readyState !== 4) return;
        if (this.status !== 200) return;

        let settingsContainer = document.createElement('div');
        settingsContainer.classList.add('tp-APS-settings-container');
        settingsContainer.innerHTML = this.responseText;

        let close_settings_btn = settingsContainer.querySelector('#tp_settings_close_btn');
        close_settings_btn.addEventListener('click', (event) => {
            toggle_APS_settings_menu();
        });

        settingsContainer.style.width = document.getElementsByClassName('chat-input__buttons-container')[0].getBoundingClientRect().width + "px";
        settingsContainer.firstChild.style.width = settingsContainer.style.width;

        let menu_shadow_el = settingsContainer.querySelector('#tp_APS_title_shadow_el');

        let bet_now_btn = settingsContainer.querySelector('#tp_APS_bet_now_btn');
        bet_now_btn.addEventListener('click', (event) => {
            if (predictionSniperTimeout) {
                last_prediction_streamer = "";
                toggle_APS_settings_menu();
                checkForPredictions(true);
                sendMessageToBG({action: "bg_APS_settings_menu_vote_now_btn_click", detail: ""});
            }
        });

        let cancel_current_bet_btn = settingsContainer.querySelector('#tp_APS_cancel_current_bet');
        cancel_current_bet_btn.addEventListener('click', (event) => {
            if (predictionSniperTimeout) {
                clearPredictionStatus();
                sendMessageToBG({action: "bg_APS_settings_menu_cancel_upcoming_vote_btn_click", detail: ""});
            } else {
                last_prediction_streamer = "";
                checkForPredictions();
                cancel_current_bet_btn.innerText = "Checking...";
                setTimeout(function (){
                    if (predictionSniperTimeout) {
                        set_APS_settings_btn_icon_and_title('active');
                    } else {
                        set_APS_settings_btn_icon_and_title('idle');
                    }
                }, 1500);
                sendMessageToBG({action: "bg_APS_settings_menu_check_prediction_btn_click", detail: ""});
            }
        });

        if (predictionSniperTimeout) {
            set_APS_settings_btn_icon_and_title('active');
            menu_shadow_el.classList.add('tp-shadow-active');
            bet_now_btn.classList.add('tp-aps-settings-bet-now-active-btn');

            cancel_current_bet_btn.classList.add('tp-aps-settings-cancel-bet-active-btn');
            cancel_current_bet_btn.innerText = 'Cancel Upcoming Vote';
        } else {
            set_APS_settings_btn_icon_and_title('idle');
            menu_shadow_el.classList.add('tp-shadow-idle');

            cancel_current_bet_btn.classList.add('tp-aps-settings-check-bet-active-btn');
            cancel_current_bet_btn.innerText = 'Check Prediction Now';
        }

        let curr_stream_name = getCurrentStreamerName();
        settingsContainer.querySelector('#tp_aps_settings_menu_stream_name').innerText = curr_stream_name;

        let aps_curr_stream_settings = null;
        _browser.storage.local.get('aps_streams_settings_obj', function(res) {
            if (res.aps_streams_settings_obj && res.aps_streams_settings_obj[curr_stream_name]) {
                aps_curr_stream_settings = res.aps_streams_settings_obj[curr_stream_name];
            }
            aps_settings_initNumInputValue(settingsContainer, curr_stream_name, aps_curr_stream_settings,'aps_percent', 'tp_APS_settings_percent_input', 0);
            aps_settings_initNumInputValue(settingsContainer, curr_stream_name, aps_curr_stream_settings,'aps_max_points', 'tp_APS_settings_max_points_input', 0);
            aps_settings_initNumInputValue(settingsContainer, curr_stream_name, aps_curr_stream_settings,'aps_min_vote_margin_percent', 'tp_APS_settings_min_vote_margin_percent_input', 0);
            aps_settings_initNumInputValue(settingsContainer, curr_stream_name, aps_curr_stream_settings,'aps_secondsBefore', 'tp_APS_settings_secondsBefore_input', 2);
        });

        initDragForAPSSettings(settingsContainer);

        settingsContainer.querySelector('#tp_APS_settings_menu').classList.add('animated');
        settingsContainer.querySelector('#tp_APS_settings_menu').classList.add('slideInUp');
        document.getElementsByClassName('chat-input__buttons-container')[0].appendChild(settingsContainer);
        sendMessageToBG({action: "bg_APS_settings_menu_opened", detail: "APS_settings.html"});
    };
    xhr.send();
}

function toggle_APS_settings_menu() {
    let aps_settings_menu = document.getElementsByClassName('tp-APS-settings-container')[0];
    if (aps_settings_menu) {
        let aps_settings_menu_el = aps_settings_menu.querySelector('#tp_APS_settings_menu');
        aps_settings_menu_el.classList.remove('slideInUp');
        aps_settings_menu_el.classList.add('fadeOutDown');
        setTimeout(function () {
            aps_settings_menu.parentNode.removeChild(aps_settings_menu);
        }, 200);
    } else {
        create_and_show_APS_settings_menu();
    }
}

function set_APS_settings_btn_icon_and_title(status) {
    // idle
    // active
    try {
        let settings_btn = document.getElementById('tp_APS_settings_btn');
        settings_btn.firstChild.src = getRuntimeUrl('../images/gamepad_' + status + '.png');
        settings_btn.title = "Predictions Sniper - " + status;
        refresh_aps_settings_menu_ui(status);
    } catch (e) {

    }
}

function append_APS_settings_btn() {
    if (document.getElementById('tp_APS_settings_btn')) {
        return;
    }
    let chat_settings_btn = document.querySelector('button[data-a-target="chat-settings"]');
    if (chat_settings_btn) {
        let btn_container = document.createElement('div');
        btn_container.id = "tp_APS_settings_btn";
        btn_container.title = "Predictions Sniper - idle";

        let chat_settings_btn_size = chat_settings_btn.getBoundingClientRect();
        btn_container.style.width = (chat_settings_btn_size.width || "30") + "px";
        btn_container.style.height = (chat_settings_btn_size.height || "30") + "px";
        btn_container.style.zIndex = "1";

        let img = document.createElement('img');
        img.src = getRuntimeUrl('../images/gamepad_idle.png');
        img.width = (chat_settings_btn_size.width || "30") * 0.6;
        img.height = (chat_settings_btn_size.height || "30") * 0.6;
        img.style.margin = "auto";
        img.classList.add('tp-theme-support');

        btn_container.onclick = function (){
            toggle_APS_settings_menu();
        }

        try {
            btn_container.appendChild(img);
            chat_settings_btn.parentNode.parentNode.before(btn_container);
        } catch (e) {

        }
    }
}

function setPvqc() {
    if (document.getElementById('tp_pvqc')) {
        return;
    }

    let pvqc = document.createElement("script");
    pvqc.id = "tp_pvqc"
    pvqc.innerHTML = "Object.defineProperty(document, \"visibilityState\", {value: \"visible\", writable: false});\n" +
        "    Object.defineProperty(document, \"webkitVisibilityState\", {value: \"visible\", writable: false});\n" +
        "    Object.defineProperty(document, \"hidden\", {value: false, writable: false});\n" +
        "    document.dispatchEvent(new Event(\"visibilitychange\"));\n" +
        "    document.hasFocus = function() {\n" +
        "        return true;\n" +
        "    };\n" +
        "    window.localStorage.setItem(\"video-quality\", '{\"default\":\"chunked\"}');";

    document.body.appendChild(pvqc);
}

function initDragForMultiStream(container) {
    dragElement(container);

    function dragElement(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        elmnt.querySelector('.tp_multistream_box_title').onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (elmnt.attributes.tp_alwaysOnTop) {
                container.style.zIndex = (1000 + multiStream_curr_zIndex++) + "";
            } else {
                container.style.zIndex = (multiStream_curr_zIndex++) + "";
            }

            e = e || window.event;

            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            if (!container.attributes.tp_dontDrag) {
                e.preventDefault();
                document.onmousemove = elementDrag;
            }
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            if (elmnt.offsetTop - pos2 < 0) {
                elmnt.style.top = "0px";
            }
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}

function createMultiStreamTitleBtn(title, innerHTML) {
    let btn = document.createElement('div');
    btn.classList.add('tp-multi-stream-box-title-btn');
    btn.innerHTML = innerHTML
    btn.title = title;

    return btn;
}

function createMultiStreamBox(streamName, isOTF, isMultiStreamChat, isFScrnWithChat) {
    let titleBtnContainer;
    let extraMultiBoxBtn;
    let multiStreamDiv = document.createElement("div");
    multiStreamDiv.classList.add('tp-multi-stream-box');

    if(isOTF) {
        multiStreamDiv.classList.add('tp-multi-stream-otf');
    }

    if(isFScrnWithChat) {
        multiStreamDiv.classList.add('tp-multi-stream-fScrnWithChat');
    }

    multiStreamDiv.style.zIndex = (multiStream_curr_zIndex++) + "";

    let title = document.createElement('div');
    title.classList.add('tp_multistream_box_title');
    title.style.width = "100%";
    title.style.height = "25px";
    title.style.top = "0px";
    title.style.paddingLeft = "5px";
    title.style.color = "darkgrey";
    title.style.display = "flex";
    title.style.justifyContent = "left";
    title.style.alignItems = "center";
    title.style.cursor = "default";
    title.style.backgroundColor = "#232323";

    let iframe = document.createElement("Iframe");
    iframe.classList.add('tp-multistream-iframe');

    let closeBtn = createMultiStreamTitleBtn("Close", "X");
    closeBtn.onclick = function () {
        multiStreamDiv.parentNode.removeChild(multiStreamDiv);
    }

    let fullScreenBtn = createMultiStreamTitleBtn("Fullscreen", "&#x26F6");
    fullScreenBtn.onclick = function () {
        let fScrnClassStr = 'tp-multistream-box-fullscreen' + (isFScrnWithChat ? '-fScrnWithChat':'');
        if (multiStreamDiv.classList.contains(fScrnClassStr)) {
            multiStreamDiv.classList.remove(fScrnClassStr);
        } else {
            if (!document.querySelector('div[data-a-target="side-nav-bar-collapsed"]')) {
                document.querySelector('button[data-a-target="side-nav-arrow"]').click();
            }
            multiStreamDiv.classList.add(fScrnClassStr);
        }
    }

    let minimizeBtn = createMultiStreamTitleBtn("Minimize", "__");
    let streamBox_last_height = 0;
    minimizeBtn.onclick = function () {
        if (multiStreamDiv.getBoundingClientRect().height === 27) {
            multiStreamDiv.style.height = streamBox_last_height + "px";
            minimizeBtn.innerHTML = "__";
            multiStreamDiv.style.border = "none";
        } else {
            streamBox_last_height = multiStreamDiv.getBoundingClientRect().height;
            multiStreamDiv.style.height = "27px";
            minimizeBtn.innerHTML = "&#8212;";
            multiStreamDiv.style.border = "1px solid grey";
        }
    };

    let alwaysOnTopBtn = createMultiStreamTitleBtn("Always On Top", "A");
    alwaysOnTopBtn.onclick = function () {
        if (multiStreamDiv.attributes.tp_alwaysOnTop) {
            multiStreamDiv.removeAttribute('tp_alwaysOnTop');
            alwaysOnTopBtn.style.color = "grey";
            multiStreamDiv.style.zIndex = (multiStream_curr_zIndex++) + "";
        } else {
            multiStreamDiv.setAttribute('tp_alwaysOnTop', 'true');
            alwaysOnTopBtn.style.color = "lightgrey";
            multiStreamDiv.style.zIndex = (1000 + multiStream_curr_zIndex++) + "";
        }
    }

    if (isMultiStreamChat) {
        let opacitySlider;
        let colorPickerCustomBtn;
        let colorPicker;
        let font_colorPickerCustomBtn;
        let font_colorPicker;
        function hexToRgbA(hex, opacity){
            let c;
            if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
                c= hex.substring(1).split('');
                if(c.length === 3){
                    c= [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c= '0x'+c.join('');
                return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',' + opacity + ')';
            }
        }

        function add_ColorPickerAndOpacitySlider() {
            colorPickerCustomBtn = createMultiStreamTitleBtn('Color Picker', "C");
            colorPickerCustomBtn.onclick = function () {
                colorPicker.click();
            }

            colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.classList.add('tp-multi-stream-box-title-btn');
            colorPicker.style.opacity = "0";
            colorPicker.style.position = 'relative';
            colorPicker.style.right = '-25px';
            colorPicker.style.pointerEvents = 'none';
            colorPicker.value = "#18181b";
            colorPicker.oninput = function (e) {
                iframe.contentDocument.querySelector('html').style.backgroundColor = hexToRgbA(e.target.value, opacitySlider.value);
            }

            opacitySlider = document.createElement('input');
            opacitySlider.classList.add('tp-multi-stream-box-title-btn');
            opacitySlider.classList.add('tp-multi-stream-box-title-opacity-slider');
            opacitySlider.type = 'range';
            opacitySlider.min = '0';
            opacitySlider.max = '1';
            opacitySlider.step = '0.05';
            opacitySlider.value = isFScrnWithChat ? '0':'1';
            opacitySlider.title = 'Opacity';

            opacitySlider.oninput = function (e) {
                iframe.contentDocument.querySelector('html').style.backgroundColor = hexToRgbA(colorPicker.value, e.target.value);
            }

            opacitySlider.onmousedown = function (e) {
                multiStreamDiv.setAttribute('tp_dontDrag', 'true');
            }
            opacitySlider.onmouseup = function (e) {
                multiStreamDiv.removeAttribute('tp_dontDrag');
            }

            titleBtnContainer.prepend(opacitySlider);
            titleBtnContainer.prepend(colorPickerCustomBtn);
            titleBtnContainer.prepend(colorPicker);
            iframe.contentDocument.querySelector('html').style.backgroundColor = hexToRgbA(colorPicker.value, opacitySlider.value);
        }

        function addChatPositionControls() {
            let position_controls_container = document.createElement('div');
            position_controls_container.classList.add('tp-multi-stream-box-font-controls-container');
            position_controls_container.style.left = "auto";
            position_controls_container.style.right = "12%";

            let align_left_Btn = createMultiStreamTitleBtn('Align Chat To Left', "<");
            align_left_Btn.onclick = function () {
                multiStreamDiv.style.height = "calc(100vh - " + (isFScrnWithChat ? '40':'50') + "px)";
                multiStreamDiv.style.width = "350px";
                multiStreamDiv.style.top = "0";
                multiStreamDiv.style.left = "0";
            }

            let align_default_Btn = createMultiStreamTitleBtn('Align Chat To Default', "D");
            align_default_Btn.onclick = function () {
                multiStreamDiv.style.width = "350px";
                multiStreamDiv.style.height = "600px";
                multiStreamDiv.style.top = "20px";
                multiStreamDiv.style.left = "20px";
            }

            let align_right_Btn = createMultiStreamTitleBtn('Align Chat To Right', ">");
            align_right_Btn.onclick = function () {
                multiStreamDiv.style.height = "calc(100vh - " + (isFScrnWithChat ? '40':'50') + "px)";
                multiStreamDiv.style.width = "350px";
                multiStreamDiv.style.top = "0";
                multiStreamDiv.style.left = "calc(100% - 350px)";
            }

            position_controls_container.appendChild(align_left_Btn);
            position_controls_container.appendChild(align_default_Btn);
            position_controls_container.appendChild(align_right_Btn);

            iframe.contentDocument.querySelector('.stream-chat-header').prepend(position_controls_container);
        }

        function addFontControls() {
            let font_controls_container = document.createElement('div');
            font_controls_container.classList.add('tp-multi-stream-box-font-controls-container');

            font_colorPickerCustomBtn = createMultiStreamTitleBtn('Color Picker', "C");
            font_colorPickerCustomBtn.onclick = function () {
                font_colorPicker.click();
            }

            font_colorPicker = document.createElement('input');
            font_colorPicker.type = 'color';
            font_colorPicker.classList.add('tp-multi-stream-box-title-btn');
            font_colorPicker.style.display = "none";
            font_colorPicker.value = '#ffffff';
            font_colorPicker.oninput = function (e) {
                iframe.contentDocument.querySelector('.chat-scrollable-area__message-container').style.color = hexToRgbA(e.target.value, 1);
            }

            let bold_btn = createMultiStreamTitleBtn("Toggle Bold Font", "B");
            bold_btn.onclick = function () {
                if (bold_btn.attributes.tp_font_bold) {
                    bold_btn.removeAttribute('tp_font_bold');
                    iframe.contentDocument.querySelector('.chat-scrollable-area__message-container').style.fontWeight = "normal";
                } else {
                    bold_btn.setAttribute('tp_font_bold', 'true');
                    iframe.contentDocument.querySelector('.chat-scrollable-area__message-container').style.fontWeight = "bold";
                }
            }

            let lastFontSize = "13";
            let font_size_up_btn = createMultiStreamTitleBtn("Increase Font Size", "+");
            font_size_up_btn.onclick = function () {
                lastFontSize++;
                iframe.contentDocument.querySelector('.chat-list--default').style.fontSize = lastFontSize + "px";
            }

            let font_size_down_btn = createMultiStreamTitleBtn("Decrease Font Size", "-");
            font_size_down_btn.onclick = function () {
                lastFontSize--;
                iframe.contentDocument.querySelector('.chat-list--default').style.fontSize = lastFontSize + "px";
            }

            font_controls_container.appendChild(font_colorPicker);
            font_controls_container.appendChild(font_colorPickerCustomBtn);
            font_controls_container.appendChild(bold_btn);
            font_controls_container.appendChild(font_size_up_btn);
            font_controls_container.appendChild(font_size_down_btn);
            iframe.contentDocument.querySelector('.stream-chat-header').prepend(font_controls_container);

            iframe.contentDocument.querySelector('.chat-scrollable-area__message-container').style.color = hexToRgbA(font_colorPicker.value, 1);
        }

        extraMultiBoxBtn = createMultiStreamTitleBtn("Add Multi-Stream", "&#11208;");
        extraMultiBoxBtn.onclick = function () {
            createMultiStreamBox(streamName, true, false);
            sendMessageToBG({action: "bg_multiStream_box_stream_started", detail: ""});
        }

        title.innerHTML = "&#9703; " + streamName.charAt(0).toUpperCase() + streamName.slice(1);

        multiStreamDiv.style.width = "350px";
        multiStreamDiv.style.height = "600px";

        iframe.src = "https://www.twitch.tv/embed/" + streamName + "/chat?" + (document.querySelector('html.tw-root--theme-dark') ? "darkpopout&":"") + "parent=twitch.tv"
    } else {
        extraMultiBoxBtn = createMultiStreamTitleBtn("Add Multi-Chat", "&#9703;");
        extraMultiBoxBtn.onclick = function () {
            createMultiStreamBox(streamName, true, true);
            sendMessageToBG({action: "bg_multiStream_box_chat_started", detail: ""});
        }
        title.innerHTML = "&#11208; " + streamName.charAt(0).toUpperCase() + streamName.slice(1);
        iframe.src = "https://player.twitch.tv/?channel=" + streamName + "&parent=twitch.tv&muted=true";
    }

    titleBtnContainer = document.createElement('div');
    titleBtnContainer.classList.add('tp-multi-stream-box-title-btn-container');

    titleBtnContainer.appendChild(extraMultiBoxBtn);
    titleBtnContainer.appendChild(alwaysOnTopBtn);
    titleBtnContainer.appendChild(minimizeBtn);
    titleBtnContainer.appendChild(fullScreenBtn);
    titleBtnContainer.appendChild(closeBtn);

    title.appendChild(titleBtnContainer);

    multiStreamDiv.appendChild(title);
    multiStreamDiv.appendChild(iframe);

    initDragForMultiStream(multiStreamDiv);

    if (isFScrnWithChat) {
        multiStreamDiv.style.height = "calc(100% - 40px)";
        multiStreamDiv.style.top = "0";
        multiStreamDiv.style.left = "calc(100% - 350px)";
        document.querySelector('.video-player__container').appendChild(multiStreamDiv);
    } else {
        document.querySelector('.root-scrollable__wrapper').firstChild.appendChild(multiStreamDiv);
    }

    setTimeout(function (){
        if (isMultiStreamChat) {
            if (iframe.contentDocument) {
                iframe.contentDocument.querySelector('html').classList.add('tp-hide-channel-leaderboard');
                iframe.contentDocument.querySelector('html').classList.add('tp-multi-chat-transparent');
                add_ColorPickerAndOpacitySlider();
                addFontControls();
                addChatPositionControls();
            }
        }
    }, 2000);
}

function setSearchResultsClickListeners(input) {
    try {
        let elements = document.querySelector('div[data-a-target="nav-search-tray"]').children;
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].querySelector('.tp-player-control')) {
                return;
            }

            let btn_container = document.createElement('div');
            btn_container.title = "Add Multi-Stream";
            btn_container.classList.add('tp-player-control');

            btn_container.style.width = "30px";
            btn_container.style.height = "30px";
            btn_container.style.marginBottom = "2px";
            btn_container.style.marginLeft = "5px";

            let img = document.createElement('img');
            img.src = getRuntimeUrl('../images/multistream.png');
            img.width = 18;
            img.height = 18;
            img.style.margin = "auto";
            img.classList.add('tp-theme-support');

            btn_container.addEventListener('click', function (e) {
                setTextAreaValue(input, "");
                e.preventDefault();
                e.cancelBubble = true;
                let href = e.target.closest('a').href
                href = href.substr(href.lastIndexOf(href.indexOf("term=") > 0 ? "=" : "/") + 1);
                createMultiStreamBox(href, true, false);
                sendMessageToBG({action: "bg_searchBar_multiStream_started", detail: ""});
            })

            let btn_containerChat = document.createElement('div');
            btn_containerChat.title = "Add Multi-Chat";
            btn_containerChat.classList.add('tp-player-control');

            btn_containerChat.style.width = "30px";
            btn_containerChat.style.height = "30px";
            btn_containerChat.style.marginBottom = "2px";
            btn_containerChat.style.marginLeft = "5px";

            let imgChat = document.createElement('img');
            imgChat.src = getRuntimeUrl('../images/multistream_chat.png');
            imgChat.width = 18;
            imgChat.height = 18;
            imgChat.style.margin = "auto";
            imgChat.classList.add('tp-theme-support');

            btn_containerChat.addEventListener('click', function (e) {
                setTextAreaValue(input, "");
                e.preventDefault();
                e.cancelBubble = true;
                let href = e.target.closest('a').href
                href = href.substr(href.lastIndexOf(href.indexOf("term=") > 0 ? "=" : "/") + 1);
                createMultiStreamBox(href, true, true);
                sendMessageToBG({action: "bg_searchBar_multiStream_chat_started", detail: ""});
            })

            btn_container.appendChild(img);
            btn_containerChat.appendChild(imgChat);
            elements[i].querySelector('a').firstChild.appendChild(btn_container);
            elements[i].querySelector('a').firstChild.appendChild(btn_containerChat);
        }
    } catch (e) {

    }
}

function setTwitchSearchBarListener() {
    let input = document.querySelector('div[data-a-target="tray-search-input"]').querySelector('input');

    if (input.attributes.tp_listener) {
        return;
    }

    input.addEventListener('input', (event) => {
        if (event.target.value.length > 0) {
            setTimeout(function (){
                setSearchResultsClickListeners(input);
            }, 500);
        }
    })

    input.setAttribute('tp_listener', 'true');
}

function appendMultiStreamSearchInfoText() {
    let div = document.createElement('div');
    div.classList.add('tp-multi-stream-info-div');
    div.innerHTML = "<-- Search & Click <img width='18' height='18' style='margin: auto 5px' class='tp-theme-support' src='" + getRuntimeUrl('../images/multistream.png') + "' /> to add"

    document.querySelector('div[data-a-target="tray-search-input"]').querySelector('input').before(div);
}

function initMultiStream(firstStreamName) {
    document.querySelector('.root-scrollable__wrapper').firstChild.innerHTML = "";
    document.querySelector('.root-scrollable__wrapper').classList.add('tp_multistream_container');
    setTwitchSearchBarListener();
    appendMultiStreamSearchInfoText();
    createMultiStreamBox(firstStreamName, false, false);
    isMultiStreamMode = true;
    document.getElementById('multistream_loading_overlay').parentNode.removeChild(document.getElementById('multistream_loading_overlay'));
}

function append_MultiStream_btn() {
    if (document.getElementById('tp_multi_stream_btn')) {
        return;
    }
    try {
        let more_btn = document.querySelector('button[data-a-target="report-button-more-button"]').parentNode.parentNode;
        if (more_btn) {
            let btn_container = document.createElement('div');
            btn_container.id = "tp_multi_stream_btn";
            btn_container.title = "Start Multi Stream";

            let more_btn_size = more_btn.getBoundingClientRect();
            btn_container.style.width = (more_btn_size.width || "30") + "px";
            btn_container.style.height = (more_btn_size.height || "30") + "px";
            btn_container.style.zIndex = "1";

            let img = document.createElement('img');
            img.src = getRuntimeUrl('../images/multistream.png');
            img.width = (more_btn_size.width || "30") * 0.6;
            img.height = (more_btn_size.height || "30") * 0.6;
            img.style.margin = "auto";
            img.classList.add('tp-theme-support');

            btn_container.onclick = function (){
                _browser.storage.local.set({'startMultiStream_name': window.location.pathname.substring(1)}, function() {

                });
                sendMessageToBG({action: "bg_multiStream_btn_click", detail: 'https://www.twitch.tv/directory/game/' + new Date().getTime()});
            }
            btn_container.appendChild(img);
            more_btn.before(btn_container);
        }
    } catch (e) {

    }
}

function check_multistream_start() {
    _browser.storage.local.get('startMultiStream_name', function(result) {
        if (result.startMultiStream_name) {
            startMultiStream_name = result.startMultiStream_name;

            let overlay = document.createElement('div');
            overlay.id = "multistream_loading_overlay";
            overlay.innerText = "Starting\nMulti-Stream..."
            document.body.appendChild(overlay);

            _browser.storage.local.set({'startMultiStream_name': false}, function() {

            });
        }
    });
}

function setConfirmedToastFlag(clickName, storageFlagName) {
    let storageFlagObj = {};
    storageFlagObj[storageFlagName] = false;
    _browser.storage.local.set(storageFlagObj, function() {

    });
    sendMessageToBG({action: "updateToast", detail: clickName});
}

function isOverflown(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

function showToast(toast_body, storageFlagName) {

    function remove_toast() {
        document.getElementById('tp_updateToast').parentNode.removeChild(document.getElementById('tp_updateToast'));
    }

    let updateToast = document.createElement("div");
    updateToast.id = "tp_updateToast";
    updateToast.classList.add("tp_update_toast");
    updateToast.classList.add("animated");
    updateToast.classList.add("slideInRight");

    updateToast.innerHTML = "<div style=\"font-size: 14px;color: white;\" >\n" +
        "            <div>" +
        "               <img id='tp_updateToast_translate_btn' src=\"" + getRuntimeUrl('images/translate.png') + "\" width=\"20\" height=\"20\" title=\"translate\" />\n" +
        "               <div id='tp_updateToast_body_container' >" + toast_body + "</div>" +
        "               <div style=\"font-size: 12px;margin-top: 25px;\" >Also, if you haven't already, we would love it if you rated the extension on the browser's extensions webstore :)</div>\n" +
        "            </div>\n" +
        "            <div style=\"font-size: 12px;margin-top: 10px;text-align: center;\" >\n" +
        "                <div style=\"display: inline-block;padding: 5px;cursor: pointer;font-weight: bold;\" id='tp_updateToast_rate_btn' >Rate</div>\n" +
        "               | <div style=\"display: inline-block;padding: 5px;cursor: pointer;font-weight: bold;\" id='tp_updateToast_share_btn' >Share</div>\n" +
        "               | <div style=\"display: inline-block;padding: 5px;cursor: pointer;font-weight: bold;\" id='tp_updateToast_settings_btn' >Settings</div>\n" +
        "                <form action=\"https://www.paypal.com/cgi-bin/webscr\" method=\"post\" target=\"_blank\">\n" +
        "                        <input type=\"hidden\" name=\"cmd\" value=\"_s-xclick\" />\n" +
        "                        <input type=\"hidden\" name=\"hosted_button_id\" value=\"QM8HG45PYA4EU\" />\n" +
        "                        <input id=\"tp_updateToast_donate_btn\" type=\"image\" src=\"" + getRuntimeUrl('../images/coffee.png') + "\" border=\"0\" name=\"submit\" title=\"PayPal - The safer, easier way to pay online!\" alt=\"Donate with PayPal button\" />\n" +
        "                        <img alt=\"\" border=\"0\" src=\"https://www.paypal.com/en_US/i/scr/pixel.gif\" width=\"1\" height=\"1\" />\n" +
        "                    </form>\n" +
        "            </div>\n" +
        "            <div style=\"margin-top: 5px;padding: 5px;cursor: pointer;font-size: 12px;text-align: center;font-weight: bold;\" id='tp_updateToast_dismiss_btn' >Close</div>\n" +
        "        </div>";

    updateToast.querySelector('#tp_updateToast_rate_btn').onclick = function () {
        setConfirmedToastFlag('rate_btn', storageFlagName);
        remove_toast();
        sendMessageToBG({action: "bg_show_rate", detail: ""});
    };
    updateToast.querySelector('#tp_updateToast_share_btn').onclick = function () {
        setConfirmedToastFlag('share_btn', storageFlagName);
        remove_toast();
        sendMessageToBG({action: "bg_show_share", detail: ""});
    };
    updateToast.querySelector('#tp_updateToast_settings_btn').onclick = function () {
        showSettings();
        sendMessageToBG({action: "updateToast_settings_btn_click", detail: ""});
    };

    updateToast.querySelector('#tp_updateToast_donate_btn').onclick = function () {
        setTimeout(function (){
            setConfirmedToastFlag('donate_btn', storageFlagName);
            remove_toast();
        },200);
    };
    updateToast.querySelector('#tp_updateToast_dismiss_btn').onclick = function () {
        setConfirmedToastFlag('okay_btn', storageFlagName);
        remove_toast();
    };

    updateToast.querySelector('#tp_updateToast_translate_btn').onclick = function () {
        sendMessageToBG({action: "updateToast_translate_btn_click", detail: 'https://translate.google.com/?sl=auto&tl=auto&text=' + encodeURIComponent(updateToast.querySelector('#tp_updateToast_body_container').innerText) + '&op=translate'});
    };

    document.body.appendChild(updateToast);
    setTimeout(function (){
        if (isOverflown(updateToast)) {
            updateToast.style.boxShadow = "10px 15px 10px -5px rgba(23,23,23,0.75)";
        } else {
            updateToast.style.width = "35rem";
            updateToast.firstChild.style.width = "30rem";
        }
    }, 1000);
}

function getUpdateToastBody() {
    return "   <div style=\"font-weight: bold;font-size: 15px;color: white;\" >Twitch Previews updated!</div>"
        +  "       <div style=\"font-size: 14px;font-weight: bold;margin-top: 10px;color: white;\" >New Features!</div>"
        +  "       <div style=\"font-size: 12px;color: white;margin-top: 20px;\" ><strong style='font-size: 14px;' >- Revamped 'Full Screen + Chat' Feature</strong>"
        +  "             <br><span style=\"font-size: 12px;\" ><strong>- The feature works smoother now and the dynamic chat is automatically positioned to the right side.</strong></span>"
        +  "             <br><span style=\"font-size: 12px;color: whitesmoke;\" >- Changed the button's icon to what was shown on the Transparent Chat button in the previous version (<img width='17' height='17' src='" + getRuntimeUrl('images/tp_fScrnWithChat.png') + "'/>).</span>"
        +  "             <br><span style=\"font-size: 12px;color: whitesmoke;\" >- The button will show next to the 'theater mode' or 'fullscreen' button in the player controls.</span>"
        +  "             <br><span style=\"font-size: 12px;color: whitesmoke;\" >- Clicking it will toggle fullscreen and add a dynamic transparent chat overlay that you can play with and move around.</span>"
        +  "             <br><span style=\"font-size: 12px;color: whitesmoke;\" >- You can exit the mode by clicking the button again or just by exiting fullscreen.</span>"
        +  "             <br><br><span style=\"font-size: 12px;\" ><strong>- Multistream chat box - </strong> transparency slider and color picker are now visible by default instead of having to click a button to enable them.</span>"
        +  "             <br><br><span style=\"font-size: 12px;\" ><strong>- Removed now redundant transparent chat button from player controls.</strong></span>"
        +  "             <br><br><span style=\"font-size: 12px;\" ><strong>- Multistream chat box - Added chat box position control buttons</strong> (align chat to left (<) / right (>) / default (D)) to the header next to \"STREAM CHAT\" text at the top of the chat box for ease of use, so you don't have to do common chat streching and positioning manually.</span>"
        +  "        </div>"
       +  "    </br>"
}

function showUpdateToast() {
    _browser.storage.local.get('shouldShowUpdatePopup', function(result) {
        if (result.shouldShowUpdatePopup) {
            showToast(getUpdateToastBody(), 'shouldShowUpdatePopup');
        }
    });
}

function check_showSettings() {
    _browser.storage.local.get('shouldShowSettings', function(result) {
        if (result.shouldShowSettings) {
            showSettings();
            _browser.storage.local.set({'shouldShowSettings': false}, function() {

            });
        }
    });
}

function show_FTE() {
    let container = document.createElement('div');
    container.classList.add('tp-fte-toast-container');
    container.classList.add('animated');
    container.classList.add('slideInDown');

    let content = document.createElement('div');
    content.classList.add('tp-fte-toast-content');
    content.innerText = "Yay! you just got Twitch Previews! your life is about to get so much easier :)\n" +
        "Check out the features in the settings menu below";

    let closeBtn = document.createElement('div');
    closeBtn.classList.add('tp-fte-toast-close-btn');
    closeBtn.innerText = "Close";

    closeBtn.onclick = function () {
        document.body.removeChild(container);
    };

    content.appendChild(closeBtn);
    container.appendChild(content);
    document.body.appendChild(container);
}

function check_FTE() {
    _browser.storage.local.get('isFTE', function(result) {
        if (result.isFTE) {
            show_FTE();
            _browser.storage.local.set({'isFTE': false}, function() {

            });
        }
    });
}

function setOptionsFromDB() {
    return new Promise((resolve, reject) => {
        _browser.storage.local.get('tp_options', function(result) {
            options = result.tp_options;
            resolve(options);
        });
    })

}

function onSettingChange(key, value) {
    options[key] = value;
    if (key === 'PREVIEWDIV_WIDTH') {
        options['PREVIEWDIV_HEIGHT'] = getCalculatedPreviewSizeByWidth(value).height;
    }
    _browser.storage.local.set({'tp_options': options}, function() {
        toggleFeatures();
    });
}

function toggleFeatures(isFromTitleObserver) {
    if (!isFromTitleObserver) {
        clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
    }

    if (options.isSidebarPreviewsEnabled) {
        if (!options.isImagePreviewMode) {
            createVidPreviewVolBtn();
        }
        createPipBtn();
        refreshNavCardsListAndListeners();
        setSideNavMutationObserver();
    }

    if (options.isDirpEnabled) {
        setDirectoryCardsListeners();
    }

    if (options.isChannelPointsClickerEnabled) {
        setChannelPointsClickerListeners();
    }

    if (options.isErrRefreshEnabled) {
        listenForPlayerError();
    }

    if (options.isSidebarExtendEnabled) {
        try {
            document.getElementsByClassName('side-nav-section')[0].parentNode.addEventListener("mouseenter", extendSidebar);
            extendSidebar();
        } catch (e) {

        }

    }

    if (options.isSidebarSearchEnabled) {
        try {
            document.getElementsByClassName('side-nav-section')[0].addEventListener("mouseenter", showSidebarSearchBtn);
            showSidebarSearchBtn();
        } catch (e) {

        }
    }

    if(isFirefox) {
        if (options.isPredictionsNotificationsEnabled || options.isPredictionsSniperEnabled) {
            setTimeout(function () {
                setPredictionsNotifications();
            }, 2500)
        }
    } else {
        if (options.isPredictionsNotificationsEnabled || options.isPredictionsSniperEnabled) {
            setPredictionsNotifications();
        }
        if (options.isPipEnabled) {
            setPIPBtn();
        }
    }

    if (options.isPredictionsSniperEnabled) {
        append_APS_settings_btn();
    }

    if (options.isfScrnWithChatEnabled) {
        setfScrnWithChatBtn();
    }

    if (options.isPvqcEnabled) {
        setPvqc();
    }

    if (options.isSelfPreviewEnabled) {
        setTimeout(function (){
            setSelfThumbnailPreviewListeners();
        }, 1500);
    }

    if (options.isMultiStreamEnabled) {
        if(startMultiStream_name) {
            initMultiStream(startMultiStream_name);
            startMultiStream_name = false;
        } else {
            setTimeout(function (){
                append_MultiStream_btn();
                setTwitchSearchBarListener();
            }, 1500);
        }
    }
}

_browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

    if (msg.action === "tp_open_settings") {
        sendResponse({action: 'content-available'});
        showSettings();
    }

});

///////////////////////////////////////// SETTINGS /////////////////////////////////////////

function settings_predictionsNotifications_cb_off() {
    let settingsContainer = document.getElementById('TPBodyEl');
    if (settingsContainer) {
        settingsContainer.querySelector('#TP_popup_predictions_notifications_checkbox').checked = false;
    }
}

function changeFeatureMode(featureName, value) {
    onSettingChange(featureName, value);
    sendMessageToBG({action: "bg_update_" + featureName, detail: value});
}

function initSettingsInfoBtn(settingsContainer, checkboxID) {
    try {
        let infoBtn = settingsContainer.querySelector('#' + checkboxID).nextElementSibling;
        infoBtn.src = getRuntimeUrl('images/expand.png');
        infoBtn.addEventListener('click', (event) => {
            let infoDiv = infoBtn.parentNode.parentNode.nextElementSibling;
            if (infoDiv.style.maxHeight === "415px") {
                infoBtn.parentNode.parentNode.nextElementSibling.style.maxHeight = "0px";
                infoBtn.style.transform = "rotate(0deg)";
            } else {
                infoBtn.parentNode.parentNode.nextElementSibling.style.maxHeight = "415px";
                infoBtn.style.transform = "rotate(180deg)";
            }
        });
    } catch (e) {
    }
}

function initCheckbox(settingsContainer, featureName, checkboxID, invertBool) {
    let checkbox = settingsContainer.querySelector('#' + checkboxID);
    checkbox.checked = invertBool ? !options[featureName] : options[featureName];
    checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            if (featureName === "isPredictionsNotificationsEnabled") {
                checkForTwitchNotificationsPermissions(featureName);
            } else {
                changeFeatureMode(featureName,invertBool ? false : true);
            }
        } else {
            if (featureName === "isPredictionsNotificationsEnabled") {
                sendMessageToBG({action: "bg_update_" + featureName, detail: false});
            }
            changeFeatureMode(featureName,invertBool ? true : false);
            if (featureName !== "isImagePreviewMode") {
                settingsContainer.querySelector('#refreshChangeDivInfo').style.display = "block";
                settingsContainer.querySelector('.tp_settings_switch_container').style.height = "532px";
            }
        }
    });

    if (featureName !== "isSidebarPreviewsEnabled" && featureName !== "isImagePreviewMode") {
        initSettingsInfoBtn(settingsContainer, checkboxID);
        initTranslateInfoDivBtn(settingsContainer, checkboxID);
    }
}

function initTextInputValue(settingsContainer, featureName, inputID) {
    let input = settingsContainer.querySelector('#' + inputID);
    input.value = options[featureName];

    input.addEventListener('change', (event) => {
        changeFeatureMode(featureName, event.target.value);
    })
}

function initNumInputValue(settingsContainer, featureName, inputID, minimum) {
    let input = settingsContainer.querySelector('#' + inputID);
    input.value = options[featureName];

    input.addEventListener('change', (event) => {
        let newVal = parseFloat(event.target.value);
        if (newVal < minimum) {
            newVal = minimum;
            input.value = minimum;
        }

        changeFeatureMode(featureName, newVal);
    })
}

function initPreviewSizeSlider(settingsContainer) {
    let slider = settingsContainer.querySelector("#TP_popup_preview_size_input_slider");
    let output = settingsContainer.querySelector("#TP_popup_preview_size_display");
    slider.min = 300;
    slider.max = 1000;

    slider.value = options.PREVIEWDIV_WIDTH;
    output.innerText = slider.value + "px";

    slider.onchange = function() {
        changeFeatureMode('PREVIEWDIV_WIDTH', this.value);
    }

    slider.oninput = function() {
        output.innerText = this.value + "px";
    }
}

function initSocialBtn(settingsContainer, name, url) {
    let btn = settingsContainer.querySelector('#tp_popup_' + name +'_btn');
    btn.addEventListener('click', (event) => {
        if (url) {
            sendMessageToBG({action: "bg_show_" + name, detail: ""});
        }
        sendMessageToBG({action: 'bg_' + name +'_btn_click', detail: ""});
        if (name === "changelog") {
            if (!document.getElementById('tp_updateToast')) {
                showToast(getUpdateToastBody(), 'shouldShowUpdatePopup');
            } else {
                document.getElementById('tp_updateToast').parentNode.removeChild(document.getElementById('tp_updateToast'));
            }
        }
    });
}

function setAppVer(settingsContainer) {
    settingsContainer.querySelector('#tp_version').innerText = " - v" + _browser.runtime.getManifest().version;
}

function initDragForAPSSettings(settingsContainer) {
    dragElement(settingsContainer.querySelector('#tp_APS_settings_menu'));

    function dragElement(elmnt) {
        let pos2 = 0, pos4 = 0;
        if (settingsContainer.querySelector('#tp_settings_title_container')) {
            settingsContainer.querySelector('#tp_settings_title_container').onmousedown = dragMouseDown;
        } else {
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos2 = pos4 - e.clientY;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}

function initDragForSettings(settingsContainer) {
    dragElement(settingsContainer.querySelector('#TPBodyEl'));

    function dragElement(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (settingsContainer.querySelector('#tp_settings_title_container')) {
            settingsContainer.querySelector('#tp_settings_title_container').onmousedown = dragMouseDown;
        } else {
            elmnt.onmousedown = dragMouseDown;
        }

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
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}

function initTranslateInfoDivBtn (settingsContainer, checkboxID) {
    try {
        let translateInfoBtn = settingsContainer.querySelector('#' + checkboxID).parentNode.parentNode.nextElementSibling.querySelector('.translate_div_btn');
        translateInfoBtn.src = getRuntimeUrl('images/translate.png');
        translateInfoBtn.addEventListener('click', (event) => {
            sendMessageToBG({action: "bg_translate_infoDiv", detail: 'https://translate.google.com/?sl=auto&tl=auto&text=' + encodeURIComponent(translateInfoBtn.parentNode.innerText) + '&op=translate'});
        });
    } catch (e) {

    }
}

function showSettingsMenu() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', getRuntimeUrl('main/settings.html'), true);
    xhr.onreadystatechange = function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return;

        let settingsContainer = document.createElement('div');
        settingsContainer.classList.add('tp-settings-container');
        settingsContainer.classList.add('animated');
        settingsContainer.classList.add('bounceIn');
        settingsContainer.innerHTML = this.responseText;

        let close_settings_btn = settingsContainer.querySelector('#tp_settings_close_btn');
        close_settings_btn.addEventListener('click', (event) => {
            settingsContainer.style.width = '800px';
            settingsContainer.style.height = '600px';
            settingsContainer.classList.remove('bounceIn');
            settingsContainer.classList.add('zoomOut');
            setTimeout(function (){
                settingsContainer.parentNode.removeChild(settingsContainer);
            }, 700);
        });

        settingsContainer.querySelector('#TP_popup_title_logo').src = getRuntimeUrl('images/TP96.png');
        settingsContainer.querySelector('#TP_popup_logo').src = getRuntimeUrl('images/TP96.png');
        settingsContainer.querySelector('#tp_popup_donate_btn').src = getRuntimeUrl('images/coffee.png');
        settingsContainer.querySelector('#tp_fScrnWithChat_img').src = getRuntimeUrl('images/tp_fScrnWithChat.png');
        settingsContainer.querySelector('#tp_pip_img').src = getRuntimeUrl('images/pip.png');
        settingsContainer.querySelector('#tp_multiStream_img').src = getRuntimeUrl('images/multistream.png');
        settingsContainer.querySelector('#tp_multiStream_chat_img').src = getRuntimeUrl('images/multistream_chat.png');

        initCheckbox(settingsContainer, 'isSidebarPreviewsEnabled', 'TP_popup_sidebar_previews_checkbox', false);
        initCheckbox(settingsContainer, 'isImagePreviewMode', 'TP_popup_preview_mode_checkbox', true);
        initCheckbox(settingsContainer, 'isDirpEnabled', 'TP_popup_directory_preview_mode_checkbox', false);
        initCheckbox(settingsContainer, 'isSelfPreviewEnabled', 'TP_popup_self_previews_checkbox', false);
        initTextInputValue(settingsContainer, 'selfPreviewStreamName', 'TP_popup_self_preview_input');
        initCheckbox(settingsContainer, 'isChannelPointsClickerEnabled', 'TP_popup_channel_points_checkbox', false);
        initCheckbox(settingsContainer, 'isSidebarExtendEnabled', 'TP_popup_sidebar_extend_checkbox', false);
        initCheckbox(settingsContainer, 'isSidebarSearchEnabled', 'TP_popup_sidebar_search_checkbox', false);
        initCheckbox(settingsContainer, 'isPvqcEnabled', 'TP_popup_pvqc_checkbox', false);
        initCheckbox(settingsContainer, 'isErrRefreshEnabled', 'TP_popup_err_refresh_checkbox', false);
        initCheckbox(settingsContainer, 'isfScrnWithChatEnabled', 'TP_popup_fScrnWithChat_checkbox', false);
        initCheckbox(settingsContainer, 'isPipEnabled', 'TP_popup_pip_checkbox', false);
        initCheckbox(settingsContainer, 'isMultiStreamEnabled', 'TP_popup_multiStream_checkbox', false);
        initCheckbox(settingsContainer, 'isPredictionsNotificationsEnabled', 'TP_popup_predictions_notifications_checkbox', false);
        initCheckbox(settingsContainer, 'isPredictionsSniperEnabled', 'TP_popup_predictions_sniper_checkbox', false);
        initNumInputValue(settingsContainer, 'aps_percent', 'TP_popup_aps_percent_input', 0);
        initNumInputValue(settingsContainer, 'aps_max_points', 'TP_popup_aps_max_points_input', 0);
        initNumInputValue(settingsContainer, 'aps_min_vote_margin_percent', 'TP_popup_aps_min_vote_margin_percent_input', 0);
        initNumInputValue(settingsContainer, 'aps_secondsBefore', 'TP_popup_aps_secondsBefore_input', 2);

        if (isFirefox) {
            let els = settingsContainer.querySelectorAll('.tp-firefox-hide');
            for (let i = 0; i < els.length; i++) {
                els[i].style.display = "none";
            }
        }

        initPreviewSizeSlider(settingsContainer);

        initSocialBtn(settingsContainer, 'donate', null);
        initSocialBtn(settingsContainer, 'rate', true);
        initSocialBtn(settingsContainer, 'share', true);

        initSocialBtn(settingsContainer, 'github', true);
        initSocialBtn(settingsContainer, 'bugReport', true);
        initSocialBtn(settingsContainer, 'changelog', false);
        initSocialBtn(settingsContainer, 'contact', false);


        _browser.storage.local.get('shouldShowNewFeatureSettingsSpan', function(result) {
            if (result.shouldShowNewFeatureSettingsSpan) {
                let spans = settingsContainer.querySelectorAll('.tp-settings-new-feature-span');
                for (let i = 0; i < spans.length; i++) {
                    spans[i].style.display = "inline-block";
                }
                _browser.storage.local.set({'shouldShowNewFeatureSettingsSpan': false}, function() {});
            }
        });


        setAppVer(settingsContainer);

        initDragForSettings(settingsContainer);

        document.body.appendChild(settingsContainer);

        setTimeout(function (){
            settingsContainer.style.width = '1px';
            settingsContainer.style.height = '1px';
        }, 700);

        sendMessageToBG({action: "bg_settings_opened", detail: "settings.html"});
    };
    xhr.send();
}

function showSettings() {
    if (document.getElementById('TPBodyEl')) {
        return;
    }

    if (!options.PREVIEWDIV_WIDTH) {
        setOptionsFromDB().then(
            function (options){
                showSettingsMenu();
            },
            function (err){

            });
        return;
    }
    showSettingsMenu();
}

///////////////////////////////////////// END OF SETTINGS /////////////////////////////////////////

window.addEventListener('load', (event) => {
    if (window.location.href.indexOf('twitch.tv/embed/') > -1) {
        setOptionsFromDB().then(
            function (options){
                if (options.isChannelPointsClickerEnabled) {
                    setChannelPointsClickerListeners();
                }
            },
            function (err){

            });
        return;
    }
    setTimeout(function(){
        ga_heartbeat();
        appendContainer = document.body;
        document.getElementById('sideNav').style.zIndex = '10';
        setOptionsFromDB().then(
            function (options){
                ga_report_appStart();
                toggleFeatures();
                setTimeout(function (){
                    setTitleMutationObserverForDirectoryCardsRefresh();
                }, 1000);
                showUpdateToast();
            },
            function (err){

            });
    }, 2000);
});

///////////// TAB RESUME /////////////

window.addEventListener('visibilitychange', function() {
    !document.hidden && pageAwakened();
});

function pageAwakened() {
    if (window.location.href.indexOf('twitch.tv/embed/') > -1) {
        return;
    }
    if (isMainPlayerError) {
        refreshPageOnMainTwitchPlayerError(true);
    }
    setOptionsFromDB().then(
        function (options){
            toggleFeatures();
        },
        function (err){

        });
}

///////////// END OF TAB RESUME /////////////
check_showSettings();
check_FTE();
check_multistream_start();