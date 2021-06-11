// (c) Twitch Previews.

var isNavBarCollapsed;
var previewDiv = null;
var appendContainer;
var IMAGE_CACHE_TTL_MS = 20000;
var channelPointsClickerInterval = null;
var predictionsNotificationsInterval = null;
var twitchIframe;
var isHovering = false;
var lastHoveredCardEl = null;
var TP_PREVIEW_DIV_CLASSNAME = "twitch_previews_previewDiv";
var TP_PIP_DIV_CLASSNAME = "twitch_previews_pip";
var isPipActive = false;
var navCardPipBtn;
var clearOverlaysInterval = null;
var clearVidPlayInterval = null;
var isLayoutHorizontallyInverted = null;
var isMainPlayerError = false;
var timesExtendedSidebar = 0;
var bLastChatOpenState = null;
var hasEnteredFScreenWithChat = false;
var last_prediction_streamer = "";
var last_prediction_button_text = "";
var predictionSniperTimeout = null;
var lastPredictionSniperStreamer = null;
var predict_langs = {
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
var see_details_langs = {
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

var options = {};

var sideNavMutationObserver = new MutationObserver(function(mutations) {
    var shouldRefresh = false;
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

/*var directoryMutationObserver = new MutationObserver(function(mutations) {
    var shouldRefresh = false;
    mutations.forEach(function(mutation) {
        if (mutation.type === "childList") {
            shouldRefresh = true;
        }
    });
    if (shouldRefresh){
        refreshDirectoryNavCardsListAndListeners();
        shouldRefresh = false;
    }
});*/

var titleMutationObserver = new MutationObserver(function(mutations) {
    setTimeout(function (){
        setDirectoryCardsListeners();
    },1000);
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

/*function setDirectoryMutationObserver() {
    directoryMutationObserver.observe(document.querySelector('div[data-target="directory-container"]'), {
        childList: true,
        subtree: true
    });
}*/

function createPipBtn() {
    navCardPipBtn = document.createElement("div");
    navCardPipBtn.id = "tp_navCard_pip_btn";
    navCardPipBtn.style.width = "21px";
    navCardPipBtn.style.height = "12px";
    navCardPipBtn.style.position = "absolute";
    navCardPipBtn.style.right = "1rem";
    navCardPipBtn.style.backgroundSize = "contain";
    navCardPipBtn.style.backgroundRepeat = "no-repeat";
    navCardPipBtn.style.backgroundImage = "url('" + chrome.runtime.getURL('../images/tpt.png') + "')";
    navCardPipBtn.title = "Twitch Previews - Picture In Picture";
    navCardPipBtn.onclick = startPip;
}

function startPip(e) {
    e.preventDefault();
    e.cancelBubble = true;
    try {
        var video = twitchIframe.contentDocument.querySelector('video');
        video.requestPictureInPicture();
        isPipActive = true;
        video.addEventListener('leavepictureinpicture', function() {
            isPipActive = false;
            clearExistingPreviewDivs(TP_PIP_DIV_CLASSNAME, true);
        });
        previewDiv.classList.remove(TP_PREVIEW_DIV_CLASSNAME);
        previewDiv.classList.add(TP_PIP_DIV_CLASSNAME);

        twitchIframe.style.display = 'none';
        previewDiv.style.display = 'none';
        previewDiv = null;
        twitchIframe = null;
        document.getElementById("tp_navCard_pip_btn").parentElement.removeChild(document.getElementById("tp_navCard_pip_btn"));

        chrome.runtime.sendMessage({action: "bg_pip_started", detail: ""}, function(response) {

        });
    } catch (e) {

    }
}

function getElementOffset(el) {
    var rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {top: rect.top + scrollTop, left: rect.left + scrollLeft}
}

function calculatePreviewDivPosition(navCardEl) {
    var elOffset = getElementOffset(navCardEl).top + (isNavBarCollapsed? 45:30);
    //var elOffset = getElementOffset(navCardEl).top + (30);
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
    return "url('" + chrome.runtime.getURL('../images/tp_offline.jpg') + "')";
}

function getPreviewImageUrl(navCardEl) {
        return "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-" + options.PREVIEWDIV_WIDTH + "x" + Math.round(options.PREVIEWDIV_HEIGHT) + ".jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
}

function getPreviewStreamUrl(navCardEl) {
    return "https://player.twitch.tv/?channel=" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "&parent=twitch.tv&muted=true";
}

function createIframeElement() {
    var iframe = document.createElement("Iframe");
    iframe.borderColor = "#232323";
    iframe.style.borderRadius = "5px";
    iframe.classList.add('animated');
    return iframe;
}

function createPreviewDiv(cssClass) {
    var previewDiv = document.createElement("div");
    previewDiv.classList.add(cssClass);
    previewDiv.classList.add("animated");
    previewDiv.style.position = "fixed";
    previewDiv.style.zIndex = "9";
    previewDiv.style.backgroundSize = "cover";
    previewDiv.style.backgroundColor = "#000";
    previewDiv.style.borderRadius = "5px";

    return previewDiv;
}

/*function createAndShowUnderPreviewDivBanner(isCardFromDirectory, left) {
    var tp_under_preview_div = document.createElement("div");
    tp_under_preview_div.classList.add('tp-under-preview-logo');
    tp_under_preview_div.classList.add('animated');
    if (isCardFromDirectory) {
        tp_under_preview_div.classList.add('fadeIn');
        tp_under_preview_div.style.left = left + "px";
        tp_under_preview_div.style.borderTopRightRadius = "10px";
        tp_under_preview_div.style.borderTopLeftRadius = "10px";
    } else {
        if (isLayoutHorizontallyInverted){
            tp_under_preview_div.classList.add('slideInRight');
            tp_under_preview_div.style.right = '0';
            tp_under_preview_div.style.borderTopLeftRadius = "22px";
            tp_under_preview_div.style.boxShadow = "-10px 15px 10px -5px rgba(23,23,23,0.75)";
        } else {
            tp_under_preview_div.classList.add('slideInLeft');
            tp_under_preview_div.style.left = '0';
            tp_under_preview_div.style.borderTopRightRadius = "22px";
            tp_under_preview_div.style.boxShadow = "10px 15px 10px -5px rgba(23,23,23,0.75)";
        }
    }

    tp_under_preview_div.classList.add('tp_anim_duration_700ms');
    tp_under_preview_div.innerText = "Twitch Previews";
    tp_under_preview_div.style.display = "none";

    setTimeout(function (){
        tp_under_preview_div.style.display = "block";
        setTimeout(function (){
            if (document.getElementsByClassName('tp-under-preview-logo').length > 0) {
                if (isCardFromDirectory) {
                    tp_under_preview_div.classList.remove('fadeIn');
                    tp_under_preview_div.classList.add('fadeOut');
                } else {
                    tp_under_preview_div.classList.remove(isLayoutHorizontallyInverted ? 'slideInRight':'slideInLeft');
                    tp_under_preview_div.classList.add(isLayoutHorizontallyInverted ? 'slideOutRight':'slideOutLeft');
                }

                tp_under_preview_div.classList.remove('tp_anim_duration_700ms');
                tp_under_preview_div.classList.add('tp_anim_duration_1000ms');
                tp_under_preview_div.style.display = "block";
                setTimeout(function (){
                    if (document.getElementsByClassName('tp-under-preview-logo').length > 0) {
                        tp_under_preview_div.style.display = "none";
                    }
                }, 1000);
            }
        }, isCardFromDirectory ? 2500 : 3500);
    }, 1000)

    previewDiv.appendChild(tp_under_preview_div);
}*/

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
    var calculatedSize = lastHoveredCardEl.getBoundingClientRect();//getCalculatedPreviewSizeByWidth(document.querySelector(".root-scrollable").getBoundingClientRect().width * 0.35);
    previewDiv.style.width = calculatedSize.width + "px";
    previewDiv.style.height = calculatedSize.height + "px";
    previewDiv.style.display = "block";

    if(isStreamerOnline(lastHoveredCardEl)) {
        if (!lastHoveredCardEl.querySelector('.sk-chase')) {
            var loader_container = document.createElement("div");
            loader_container.innerHTML = "<div class=\"sk-chase\">\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "  <div class=\"sk-chase-dot\"></div>\n" +
                "</div>".trim();
            var loader = loader_container.firstChild;

            lastHoveredCardEl.querySelector('img').parentNode.appendChild(loader);
        }

       /* var cur_card = lastHoveredCardEl;
        setTimeout(function () {
            if (cur_card.querySelector('.sk-chase')) {
                cur_card.querySelector('img').parentNode.removeChild(cur_card.querySelector('.sk-chase'));
            }
        }, 2000);*/
        twitchIframe = createIframeElement();
        twitchIframe.width = calculatedSize.width + "px";
        twitchIframe.height = calculatedSize.height + "px";
        twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
        previewDiv.style.visibility = "hidden";
        previewDiv.appendChild(twitchIframe);

        var anch = document.createElement("a");
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
        twitchIframe.style.display = "none";
        previewDiv.appendChild(twitchIframe);
    }
   // createAndShowUnderPreviewDivBanner(true, calculatedSize.width / 2 - 67);

    /*twitchIframe.onmouseleave = function () {
        isHovering = false;
        clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
    }*/

    lastHoveredCardEl.parentNode.appendChild(previewDiv);
}

function createAndShowLoadingSpinnerForSideNav() {
    if (!previewDiv.querySelector('.tp-loading')) {
        var loader = document.createElement("span");
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

function createAndShowPreview() {
    previewDiv = createPreviewDiv(TP_PREVIEW_DIV_CLASSNAME);
    previewDiv.style.width = options.PREVIEWDIV_WIDTH + "px";
    previewDiv.style.height = options.PREVIEWDIV_HEIGHT + "px";
    setPreviewDivPosition();
    previewDiv.style.display = "block";


    if(isStreamerOnline(lastHoveredCardEl)) {

        previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);
        lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();

        if (options.isImagePreviewMode) {
         //   previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);
           // lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();
        } else {
            createAndShowLoadingSpinnerForSideNav();
            twitchIframe = createIframeElement();
            twitchIframe.width = options.PREVIEWDIV_WIDTH + "px";
            twitchIframe.height = options.PREVIEWDIV_HEIGHT + "px";
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
            twitchIframe.style.display = "none";
            previewDiv.appendChild(twitchIframe);
        }
    }

   // createAndShowUnderPreviewDivBanner();
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
    var tproller = navCardEl.querySelector('.sk-chase');
    if (tproller) {
        tproller.parentNode.removeChild(tproller);
    }
}

function clearLoadingSpinnerFromSideNav() {
    if (previewDiv) {
        var tploading = previewDiv.querySelector('.tp-loading');
        if (tploading) {
            tploading.parentNode.removeChild(tploading);
        }
    }
}

function waitForVidPlayAndShow(navCardEl, isFromDirectory) {

    try {
        var intervalCount = 0;
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
                     //   createAndShowUnderPreviewDivBanner(isFromDirectory, navCardEl.getBoundingClientRect().width / 2 - 67);
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
            var intervalCount = 0;
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
                            var vpo = twitchIframe.contentDocument.getElementsByClassName('video-player__overlay')[0];
                            vpo.parentNode.removeChild(vpo);
                            waitForVidPlayAndShow(navCardEl, isFromDirectory);
                        },100);
                        clearInterval(clearOverlaysInterval);
                        clearOverlaysInterval = null;
                    } else {
                        if (twitchIframe.contentDocument.getElementsByClassName('video-player__overlay')[0]) {
                            var vpo = twitchIframe.contentDocument.getElementsByClassName('video-player__overlay')[0];
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
                        if (isHovering && !options.isImagePreviewMode && !isNavBarCollapsed) {
                            if (lastHoveredCardEl.querySelector('div[data-a-target="side-nav-live-status"]')) {
                                lastHoveredCardEl.querySelector('div[data-a-target="side-nav-live-status"]').appendChild(navCardPipBtn);
                            }
                        }
                    }
                }

            }, 100);
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
            var shouldSlideOut;
            if (isHovering) {
                shouldSlideOut = false;
            } else {
                shouldSlideOut = true;
            }
            try {
                if (shouldSlideOut) {
                    previewDiv.classList.add(isLayoutHorizontallyInverted ? 'slideOutRight':'slideOutLeft');
                    setTimeout(function () {
                        isHovering = false;
                        if (previewDiv) {
                            hidePreview();
                            previewDiv.classList.remove(isLayoutHorizontallyInverted ? 'slideOutRight':'slideOutLeft');
                        }
                    },250)
                }
                document.getElementById("tp_navCard_pip_btn").parentElement.removeChild(document.getElementById("tp_navCard_pip_btn"));
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
    var directoryNavCards = document.querySelectorAll('a[data-a-target="preview-card-image-link"]');
    for (var i = 0; i < directoryNavCards.length; i++) {
        setDirectoryMouseOverListeners(directoryNavCards[i]);
    }
}

function getSidebarNavCards(ancestor) {
    isNavBarCollapsed = document.getElementsByClassName('side-nav--collapsed').length > 0;
    var parentSearchContainer = ancestor || document;
    var navCards;
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
        var navCards = getSidebarNavCards();
        //var navCards = document.getElementsByClassName('side-nav-card__link');
        for (var i = 0; i < navCards.length; i++) {
            navCards[i].lastImageLoadTimeStamp = new Date().getTime();
            setMouseOverListeners(navCards[i]);
        }
    }
}

function ga_heartbeat() {
    chrome.runtime.sendMessage({action: "heartbeat", detail: ""}, function(response) {

    });
    setTimeout(ga_heartbeat, 325000);
}

function getCalculatedPreviewSizeByWidth (width) {
    return {width: width, height: 0.5636363636363636 * width};
}

function setDirectoryCardsListeners() {
    if (options.isDirpEnabled) {
        //if (document.querySelector('div[data-target="directory-container"]')) {
        if (document.querySelector('.common-centered-column')) {
            //setDirectoryMutationObserver();
            refreshDirectoryNavCardsListAndListeners();
        }
    }
}

function clickChannelPointsBtn() {
    var btn = document.querySelector('.claimable-bonus__icon');
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
    var previewDivs = document.getElementsByClassName(className);
    for (var i = 0; i < previewDivs.length; i++) {
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
    var sidebar_previews = options.isSidebarPreviewsEnabled ? "sBarP_ON":"sBarP_OFF";
    var size = options.PREVIEWDIV_WIDTH + "px";
    var mode = options.isImagePreviewMode ? "Image":"Video";
    var dirp = options.isDirpEnabled ? "dirp_ON":"dirp_OFF";
    var errRefresh = options.isErrRefreshEnabled ? "errRefresh_ON":"errRefresh_OFF";
    var channelPointsClicker = options.isChannelPointsClickerEnabled ? "cpc_ON":"cpc_OFF";
    var sidebarExtend = options.isSidebarExtendEnabled ? "sBarE_ON" : "sBarE_OFF";
    var sidebarSearch = options.isSidebarSearchEnabled ? "sBarS_ON" : "sBarS_OFF";
    var pvqc = options.isPvqcEnabled ? "pvqc_ON" : "pvqc_OFF";
    var isfScrnWithChatEnabled = options.isfScrnWithChatEnabled ? "fScrnC_ON" : "fScrnC_OFF";
    var predictionsNotifications = options.isPredictionsNotificationsEnabled ? "PN_ON" : "PN_OFF";
    var predictionsSniper = options.isPredictionsSniperEnabled ? "APS_ON" : "APS_OFF";

    chrome.runtime.sendMessage({action: "appStart", detail: sidebar_previews + " : " + mode + " : " + size + " : " + dirp + " : " + channelPointsClicker + " : " + sidebarSearch + " : " + sidebarExtend + " : " + isfScrnWithChatEnabled + " : " + errRefresh + " : " + pvqc + " : " + predictionsNotifications + " : " + predictionsSniper}, function(response) {

    });
}

function refreshPageOnMainTwitchPlayerError(fullRefresh) {
    chrome.runtime.sendMessage({action: "bg_errRefresh_exec", detail: ""}, function(response) {

    });

    if (fullRefresh) {
        location.replace(window.location);
    } else {
        var btn = document.querySelector('.content-overlay-gate__allow-pointers button');
        if(btn) {
            btn.click();
            isMainPlayerError = false;
        } else {
            location.replace(window.location);
        }
    }
}

function listenForPlayerError() {
    try{
        var t_player = document.querySelector(".video-player").querySelector('video');
        if (t_player.attributes.tp_abort_listener) {
            return;
        }

        t_player.addEventListener('abort', (event) => {
            if (options.isErrRefreshEnabled) {
                setTimeout(function (){
                    var el = document.querySelector('p[data-test-selector="content-overlay-gate__text"]');
                    if (el) {
                        if (['1000', '2000', '4000'].some(x => el.innerText.indexOf(x) >= 0)) {
                            if (!document.hidden) {
                                refreshPageOnMainTwitchPlayerError();
                            } else {
                                isMainPlayerError = true;
                            }
                        }
                    }
                },100)
            }
        });
        t_player.setAttribute('tp_abort_listener', 'true');
    } catch (e) {

    }
}

function extendSidebar() {
    if(document.getElementsByClassName('side-nav-section')[0]) {
        var navCards = getSidebarNavCards(document.getElementsByClassName('side-nav-section')[0]);
        if (!isNavBarCollapsed) {
            if (isStreamerOnline(navCards[navCards.length - 1])) {
                document.getElementsByClassName('side-nav-section')[0].querySelector('button[data-a-target="side-nav-show-more-button"]').click();
                if (timesExtendedSidebar < 10) {
                    timesExtendedSidebar++;
                    setTimeout(function (){
                        extendSidebar();
                    },300);
                } else {
                    timesExtendedSidebar = 0;
                }
            } else {
                timesExtendedSidebar = 0;
            }
        }
    }
}

function searchStreamer(e) {
    filter = e.target.value.toUpperCase()
    var navCards = getSidebarNavCards();

    for (var i = 0; i < navCards.length; i++) {
        if (navCards[i].getElementsByTagName('p')[0].innerText.toUpperCase().indexOf(filter) > -1) {
            navCards[i].parentElement.classList.remove("tp_display_none");
        } else {
            navCards[i].parentElement.classList.add("tp_display_none");
        }
    }
}

function createSidebarSearchInput() {
    var search_input_container = document.createElement("div");
    search_input_container.id = "tp_sidebar_search_input_container";

    isLayoutHorizontallyInverted ? search_input_container.style.right = "1rem" : search_input_container.style.left = "1rem";
    search_input_container.classList.add('tp_search_input_container');
    search_input_container.classList.add('animated');
    search_input_container.classList.add('fadeIn');

    var search_input = document.createElement("input");
    search_input.id = "tp_sidebar_search_input";
    search_input.placeholder = "Search Streamer";
    search_input.classList.add('tp_search_input');
    search_input.addEventListener('input', searchStreamer);

    var search_close_btn = document.createElement("div");
    search_close_btn.classList.add('tp_search_close_btn');
    search_close_btn.style.backgroundImage = "url('" + chrome.runtime.getURL('../images/tp_sidebar_search_close.png') + "')";
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
    chrome.runtime.sendMessage({action: "bg_sBarS_btn_click", detail: true}, function(response) {

    });
}

function createSideBarSearchBtn() {
    var search_btn = document.createElement("div");
    search_btn.id = "tp_sidebar_search_btn";
    search_btn.classList.add('tp-sidebar-search-btn');
    search_btn.style.backgroundImage = "url('" + chrome.runtime.getURL('../images/tp_sidebar_search.png') + "')";
    isLayoutHorizontallyInverted ? search_btn.style.left = "4rem" : search_btn.style.right = "4rem";
    search_btn.title = "Twitch Previews - Search Streamers";
    search_btn.onclick = sidebarSearchBtnClick;

    return search_btn;
}

function showSidebarSearchBtn() {
    if (!isNavBarCollapsed) {
        var sidenav_header = document.getElementsByClassName('side-nav-header')[0];
        if (sidenav_header) {
            if (!document.getElementById('tp_sidebar_search_btn')) {
                sidenav_header.appendChild(createSideBarSearchBtn());
            }
        }
    }
}

function checkForTwitchNotificationsPermissions(featureName, value) {
    if (Notification.permission !== "granted") {
        Notification.requestPermission().then(function (res){
            chrome.runtime.sendMessage({action: "bg_update_" + featureName, detail: true}, function(response) {

            });
            onSettingChange(featureName, true);
            showNotification("Twitch Previews", "Predictions Notifications Enabled!", chrome.runtime.getURL('../images/TP96.png'));
        },function (err) {
            onSettingChange(featureName, false);
        });
    } else {
        chrome.runtime.sendMessage({action: "bg_update_" + featureName, detail: true}, function(response) {

        });
        onSettingChange(featureName, true);
        showNotification("Twitch Previews", "Predictions Notifications Enabled!", chrome.runtime.getURL('../images/TP96.png'));
    }
}

function showNotification(title, body, icon) {
    if (Notification.permission !== "granted") {
        onSettingChange('isPredictionsNotificationsEnabled', false);
        return;
    }
    var notification = new Notification(title, {
        icon: icon,
        body: body,
        silent: true
    });

    notification.onclick = function () {
        parent.focus();
        window.focus();
        this.close();
    };
    chrome.runtime.sendMessage({action: "bg_PN_show", detail: "PN_show"}, function(response) {

    });
}

function checkForPredictions() {
    var btn = document.querySelector('button[data-test-selector="community-prediction-highlight-header__action-button"]');
    if(btn) {
        if (document.querySelector('.toggle-visibility__right-column--expanded')) {
            if (!options.isPvqcEnabled && !document.hidden) {
                last_prediction_streamer = document.getElementsByClassName('channel-info-content')[0].getElementsByTagName('a')[1].innerText;
                last_prediction_button_text = btn.innerText;
                return;
            }
        }

        var curr_streamer = document.getElementsByClassName('channel-info-content')[0].getElementsByTagName('a')[1].innerText;
        if (last_prediction_streamer === curr_streamer && btn.innerText === last_prediction_button_text) {
            return;
        }
        var curr_streamer_img_url = '';

        try {
            curr_streamer_img_url = document.getElementsByClassName('channel-info-content')[0].getElementsByTagName('img')[0].src;
        } catch (e) {

        }
        last_prediction_streamer = curr_streamer;
        last_prediction_button_text = btn.innerText;
        var prediction_text = "";

        try {
            var el = document.querySelector('.community-highlight').querySelectorAll('p');
            if (el.length > 2) {
                prediction_text = el[el.length - 2].innerText.replace(/^ /, '') + "\n" + el[el.length - 1].innerText.replace(/^ /, '');
            } else {
                prediction_text = el[0].innerText.replace(/^ /, '') + el[1] ? "\n" + el[1].innerText.replace(/^ /, '') : "";
            }
        } catch (e) {

        }



        if (predict_langs[btn.innerText]) {
            if(options.isPredictionsSniperEnabled) {
                initAutoPredictionsSniper().then(function (res){
                    if (options.isPredictionsNotificationsEnabled) {
                        showNotification(curr_streamer + ": " + "Prediction Started\n", prediction_text + "\nPredictions sniper active!", curr_streamer_img_url);
                    }
                },function (res){
                    if (options.isPredictionsNotificationsEnabled) {
                        showNotification(curr_streamer + ": " + "Prediction Started\n", prediction_text + "\nPredictions sniper failed", curr_streamer_img_url);
                    }
                });
            } else {
                if(options.isPredictionsNotificationsEnabled) {
                    showNotification(curr_streamer + ": " + "Prediction Started\n", prediction_text, curr_streamer_img_url);
                }
            }
        } else {
            if (see_details_langs[btn.innerText]) {
                if (options.isPredictionsSniperEnabled) {
                    getPredictionsSniperResults().then(function (res){
                        if (options.isPredictionsNotificationsEnabled) {

                            switch(res.prediction_status) {
                                case "ended":
                                    showNotification(curr_streamer + ": " + "Prediction Ended", prediction_text + "\n" + res.text1, curr_streamer_img_url);
                                    break;
                                case "closed":
                                    showNotification(curr_streamer + ": " + "Prediction Closed", prediction_text + "\n" + res.text1, curr_streamer_img_url);
                                    break;
                                case "unknown":
                                    showNotification(curr_streamer + ": " + "Prediction Closed / Ended", prediction_text, curr_streamer_img_url);
                                    break;
                                default:
                                    showNotification(curr_streamer + ": " + "Prediction Closed / Ended", prediction_text, curr_streamer_img_url);
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
            var points_str_extract_arr = document.getElementsByClassName('tw-tooltip-wrapper')[0].innerText.match(/\d+/g);
            var points = '';
            for (var i = 0; i < points_str_extract_arr.length; i++) {
                points += points_str_extract_arr[i];
            }
            simulateHoverForPoints('mouseout',document.getElementsByClassName('community-points-summary')[0].getElementsByTagName('button')[0]);
            resolve(points);
        }, 400);
    })
}

function setTextAreaValue(element, value) {
    var prototypeValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set;
    prototypeValueSetter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

function closePopoutMenu() {
    var closePopoutBtn = document.getElementsByClassName('tw-popover-header__icon-slot--right')[0];
    if (closePopoutBtn && closePopoutBtn.firstChild) {
        closePopoutBtn.firstChild.click();
    }
}

function clickChannelPointsButton() {
    document.getElementsByClassName('community-points-summary')[0].getElementsByTagName('button')[0].click();
}

function getVotePercentageMargin(a, b) {
    return (b / (a + b) * 100) - (a / (a + b) * 100);
}

function extractVotersNumberFromString(str) {
    var numOfStrChars = 0;
    var num = '';
    var isContainingStringChar = false;
    for(var i = 0; i < str.length; i++) {
        if (isNaN(str[i])) {
            numOfStrChars++;
            isContainingStringChar = true;
        }
    }
    if (isContainingStringChar) {
        for(var j = 0; j < str.length; j++) {
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
    try {
        if (document.getElementsByClassName('channel-info-content')[0].getElementsByTagName('a')[1].innerText === lastPredictionSniperStreamer) {
            chrome.runtime.sendMessage({action: "bg_APS_res", detail: document.querySelector('div[data-test-selector="prediction-checkout-completion-step__winnings-string"]') ? 'W' : document.querySelector('p[data-test-selector="prediction-checkout-completion-step__luck-string"]') ? 'L': ''}, function(response) {

            });
        }
    } catch (e) {

    }
}

function getPredictionsSniperResults() {
    return new Promise((resolve, reject) => {

        // unknown
        // closed
        // ended

        var return_obj = {
            prediction_status: 'unknown',
            text1: '',
        };

        try {
            closePopoutMenu();
            setTimeout(function () {

                clickChannelPointsButton();
                setTimeout(function (){

                    // click predictions title body button at the top of channel points view to open predictions view
                    var predictions_list_item_body = document.getElementsByClassName("predictions-list-item__body")[0];
                    if (!predictions_list_item_body) {
                        return_obj.prediction_status = 'unknown';
                        resolve(return_obj);
                        return;
                    }
                    predictions_list_item_body.click();

                    setTimeout(function (){

                        //return_obj.prediction_title = document.getElementsByClassName('prediction-checkout-details-header')[0].getElementsByClassName('tw-title')[0].innerText;
                        //return_obj.prediction_subTitle = document.getElementsByClassName('prediction-checkout-details-header')[0].getElementsByTagName('p')[1].innerText;

                        // prediction end screen results
                        var results_str = document.querySelector('div[data-test-selector="prediction-checkout-completion-step__winnings-string"]') || document.querySelector('p[data-test-selector="prediction-checkout-completion-step__luck-string"]');

                        if(results_str && results_str.innerText) {
                            return_obj.prediction_status = 'ended';
                            return_obj.text1 = results_str.innerText.replace(' \n','');

                            sendPredictionCompletionEvent();
                        }

                        try {
                            var predictions_bottom_text = document.querySelector('span[data-test-selector="user-prediction-string__outcome-title"]').parentElement.innerText
                            if (predictions_bottom_text) {
                                return_obj.prediction_status = 'closed';
                                return_obj.text1 = predictions_bottom_text.replace(' \n','');
                            }
                        } catch (e) {

                        }

                        clickChannelPointsButton();
                        resolve(return_obj);
                    }, 100);
                }, 100);
            }, 350);
        } catch (e) {
            return_obj.prediction_status = 'unknown';
            resolve(return_obj);
        }
    })
}

function initAutoPredictionsSniper() {

    return new Promise((resolve, reject) => {
        try {
            // close the popout menu if it's opened.
            closePopoutMenu();

            setTimeout(function () {

                // click channel points button
                clickChannelPointsButton();

                setTimeout(function (){
                    // get time remaining
                    // channel points view time left
                    var time_remaining_str_extract_arr = document.querySelector('p[data-test-selector="predictions-list-item__subtitle"]').innerText.match(/\d+/g)
                    var ms_UntilPrediction = (time_remaining_str_extract_arr[0] * 60 * 1000) + (time_remaining_str_extract_arr[1] * 1000);
                    ms_UntilPrediction -= (options.aps_secondsBefore * 1000) - 1000; //decrease by seconds set in options (seconds * 1000)

                    if (ms_UntilPrediction > 1000) {
                        // close channel points view
                        closePopoutMenu();
                    }

                    // clear time out in case the user switched streams and a new prediction started there.
                    if (predictionSniperTimeout) {
                        clearTimeout(predictionSniperTimeout);
                    }

                    // wait amount of seconds to predict
                    predictionSniperTimeout = setTimeout(function () {
                        // execute prediction sniper

                        if (options.aps_percent === 0) {
                            return;
                        }

                        // get number of channel points
                        getChannelPointsNum().then(function (totalChannelPointNum) {

                            // close the popout menu if it's opened.
                            closePopoutMenu();

                            setTimeout(function (){

                                // click channel points button
                                clickChannelPointsButton();

                                setTimeout(function () {
                                    // click predictions title body button at the top of channel points view to open predictions view
                                    var predictions_list_item_body = document.getElementsByClassName("predictions-list-item__body")[0];
                                    if (!predictions_list_item_body) {
                                        return;
                                    }
                                    predictions_list_item_body.click();

                                    setTimeout(function () {
                                        // click the "predict with custom points" button.
                                        var predict_with_custom_points_btn = document.querySelector('button[data-test-selector="prediction-checkout-active-footer__input-type-toggle"]');
                                        if (!predict_with_custom_points_btn) {
                                            return;
                                        }
                                        predict_with_custom_points_btn.click();

                                        // get votes
                                        var left = extractVotersNumberFromString(document.getElementById('channel-points-reward-center-body').getElementsByClassName('prediction-summary-stat__value--left')[2].getElementsByTagName('span')[0].innerText);
                                        var right = extractVotersNumberFromString(document.getElementById('channel-points-reward-center-body').getElementsByClassName('prediction-summary-stat__value--right')[2].getElementsByTagName('span')[0].innerText);

                                        // vote margin
                                        var vote_percent_margin = getVotePercentageMargin(left, right);
                                        if (vote_percent_margin < 0) {
                                            vote_percent_margin *= -1;
                                        }
                                        if (vote_percent_margin < options.aps_min_vote_margin_percent) {
                                            return;
                                        }

                                        var selectedOption = left > right ? 0 : 1;

                                        // input number to predict with % of total points
                                        var prediction_bet_amount = Math.floor((options.aps_percent / 100) * totalChannelPointNum);
                                        if (prediction_bet_amount === 0) {
                                            prediction_bet_amount = 1;
                                        }
                                        setTextAreaValue(document.getElementsByClassName('custom-prediction-button')[selectedOption].getElementsByTagName('input')[0], prediction_bet_amount);

                                        // click vote
                                        document.getElementsByClassName('custom-prediction-button__interactive')[selectedOption].click();

                                        // click channel points button to close the view
                                        clickChannelPointsButton();

                                        try {
                                            lastPredictionSniperStreamer = document.getElementsByClassName('channel-info-content')[0].getElementsByTagName('a')[1].innerText
                                            chrome.runtime.sendMessage({action: "bg_APS_exec", detail: "bg_APS_exec"}, function(response) {

                                            });
                                        } catch (e) {

                                        }
                                    }, 100);
                                }, 100);
                            },350);
                        });
                    }, ms_UntilPrediction > 0 ? ms_UntilPrediction : 0);
                    resolve('ok');
                }, 100);
            }, 350);
        } catch (e) {
            reject(e);
        }
    })
}

function setPredictionsNotifications() {
    if (!predictionsNotificationsInterval) {
        checkForPredictions();
        predictionsNotificationsInterval = setInterval(function() {
            checkForPredictions();
        }, 15100);
    }
}

function toggleBrowserFullScreen(elem) {
    if ((document.fullScreenElement !== undefined && document.fullScreenElement === null) || (document.msFullscreenElement !== undefined && document.msFullscreenElement === null) || (document.mozFullScreen !== undefined && !document.mozFullScreen) || (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen)) {
        if (elem.requestFullScreen) {
            elem.requestFullScreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function setTheatreMode(bool) {
    if (document.getElementsByClassName('video-player__container--theatre').length > 0 !== bool) {
        document.querySelector('button[data-a-target="player-theatre-mode-button"]').click();
    }
}

function setChatOpenMode(bool) {
    if (document.getElementsByClassName('toggle-visibility__right-column--expanded').length > 0 !== bool) {
        document.querySelector('button[data-a-target="right-column__toggle-collapse-btn"]').click();
    }
}

function fScreenWithChatESC_callback(evt) {
    var isEscape;
    if ("key" in evt) {
        isEscape = (evt.key === "Escape" || evt.key === "Esc");
    } else {
        isEscape = (evt.keyCode === 27);
    }
    if (isEscape) {
        exit_fScrnWithChat();
    }
}

function enter_fScrnWithChat() {
    bLastChatOpenState = document.getElementsByClassName('toggle-visibility__right-column--expanded').length > 0;
    setChatOpenMode(true);
    setTheatreMode(true);
    document.addEventListener("keydown", fScreenWithChatESC_callback);
    hasEnteredFScreenWithChat = true;
    chrome.runtime.sendMessage({action: "bg_fScrnWithChat_click", detail: true}, function(response) {

    });
}

function exit_fScrnWithChat() {
    setTheatreMode(false);
    setChatOpenMode(bLastChatOpenState);
    document.removeEventListener("keydown", fScreenWithChatESC_callback);
    hasEnteredFScreenWithChat = false;
}

function toggle_fScrnWithChat() {
    if (hasEnteredFScreenWithChat) {
        exit_fScrnWithChat();
    } else {
        enter_fScrnWithChat();
    }
    toggleBrowserFullScreen(document.body);
}

function setfScrnWithChatBtn() {
    if (document.getElementById('tp_fScrnWithChat_btn')) {
        return;
    }
    var ttv_theater_mode_btn = document.querySelector('button[data-a-target="player-theatre-mode-button"]');
    if (ttv_theater_mode_btn) {
        var btn = document.createElement('div');
        btn.id = "tp_fScrnWithChat_btn";
        btn.title = "Toggle Full Screen With Chat";
        btn.style.backgroundImage = "url('" + chrome.runtime.getURL('../images/tp_fScrnWithChat.png') + "')";
        var ttv_theater_mode_btn_size = ttv_theater_mode_btn.getBoundingClientRect();
        btn.style.width = ttv_theater_mode_btn_size.width * 0.833 + "px";
        btn.style.height = ttv_theater_mode_btn_size.height * 0.833 + "px";
        btn.onclick = function (){
            toggle_fScrnWithChat();
        }

        try {
            ttv_theater_mode_btn.parentNode.before(btn);
        } catch (e) {

        }
    }
}

function setPvqc() {
    if (document.getElementById('tp_pvqc')) {
        return;
    }

    var pvqc = document.createElement("script");
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

function setConfirmedToastFlag(clickName, storageFlagName) {
    var storageFlagObj = {};
    storageFlagObj[storageFlagName] = false;
    chrome.storage.local.set(storageFlagObj, function() {

    });
    chrome.runtime.sendMessage({action: "updateToast", detail: clickName}, function(response) {

    });
}

function showToast(toast_body, storageFlagName) {

    function remove_toast() {
        document.getElementById('tp_updateToast').parentNode.removeChild(document.getElementById('tp_updateToast'));
    }

    var updateToast = document.createElement("div");
    updateToast.id = "tp_updateToast";
    updateToast.classList.add("tp_update_toast");
    updateToast.classList.add("animated");
    updateToast.classList.add("slideInRight");

    updateToast.innerHTML = "<div style=\"font-size: 14px;color: white;\" >\n" +
        "            <div>\n" +
                        toast_body +
        "                <div style=\"font-size: 12px;margin-top: 25px;\" >Also, if you haven't already, we would love it if you rated the extension on the chrome webstore :)</div>\n" +
        "            </div>\n" +
        "            <div style=\"font-size: 12px;margin-top: 10px;text-align: center;\" >\n" +
        "                <div style=\"display: inline-block;padding: 5px;cursor: pointer;font-weight: bold;\" id='tp_updateToast_rate_btn' >Rate</div>\n" +
        "               | <div style=\"display: inline-block;padding: 5px;cursor: pointer;font-weight: bold;\" id='tp_updateToast_share_btn' >Share</div>\n" +
        "                <form action=\"https://www.paypal.com/cgi-bin/webscr\" method=\"post\" target=\"_blank\">\n" +
        "                        <input type=\"hidden\" name=\"cmd\" value=\"_s-xclick\" />\n" +
        "                        <input type=\"hidden\" name=\"hosted_button_id\" value=\"QM8HG45PYA4EU\" />\n" +
        "                        <input id=\"tp_updateToast_donate_btn\" style=\"width: 80%;box-shadow: 0px 3px 10px -5px rgb(23 23 23 / 75%);\" type=\"image\" src=\"" + chrome.runtime.getURL('../images/coffee.png') + "\" border=\"0\" name=\"submit\" title=\"PayPal - The safer, easier way to pay online!\" alt=\"Donate with PayPal button\" />\n" +
        "                        <img alt=\"\" border=\"0\" src=\"https://www.paypal.com/en_US/i/scr/pixel.gif\" width=\"1\" height=\"1\" />\n" +
        "                    </form>\n" +
        "            </div>\n" +
        "            <div style=\"display: inline-block;margin-top: 10px;padding: 5px;cursor: pointer;font-size: 12px;font-weight: bold;\" id='tp_updateToast_dismiss_btn' >Close</div>\n" +
        "        </div>";

    updateToast.querySelector('#tp_updateToast_rate_btn').onclick = function () {
        setConfirmedToastFlag('rate_btn', storageFlagName);
        remove_toast();
        chrome.runtime.sendMessage({action: "bg_showRate", detail: ""}, function(response) {

        });
    };
    updateToast.querySelector('#tp_updateToast_share_btn').onclick = function () {
        setConfirmedToastFlag('share_btn', storageFlagName);
        remove_toast();
        chrome.runtime.sendMessage({action: "bg_showShare", detail: ""}, function(response) {

        });
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

    document.body.appendChild(updateToast);
}

function showUpdateToast() {
    chrome.storage.local.get('shouldShowUpdatePopup', function(result) {
        if (result.shouldShowUpdatePopup) {
            var toast_body = "   <div style=\"font-weight: bold;\" >Twitch Previews updated!</div>"
                +  "                <div style=\"font-size: 12px;font-weight: bold;margin-top: 10px;\" >New Feature!</div>"
                +  "                <div style=\"font-size: 12px;margin-top: 10px;\" >- <strong>Predictions Sniper</strong>"
                +  "</br><span>- The predictions sniper will participate in predictions for you.</span>"
                +  "</br><span>- Works on twitch tabs in the browser.</span>"
                +  "</br><span>- The sniper will choose the prediction option with the most amount of votes received at the time of entry (x seconds before prediction closes).</span>"
                +  "</br><span>- If you have your chat open (no need), you will see the prediction menu for a split second when the sniper is entering a prediction.</span>"
                +  "</br><span>- You can enable the 'Predictions notifications' feature if you want to know what's happening in real-time.</span>"
                +  "</br></br><span><strong>Settings:</strong></span>"
                +  "</br><span><strong>- Bet % -</strong> the percentage of channel points you want the sniper to bet.</span>"
                +  "</br><span><strong>- Min vote margin % -</strong> a percentage representation of the minimum required vote margin between the two prediction options for the sniper to participate.</span>"
                +  "</br><span><strong>For example:</strong> option A- 100 votes, option B- 115 votes, vote spread: A-46.51% B-53.49%, <strong>vote margin: 6.98%</strong> (53.49% - 46.51%). <strong>if the min vote margin is lower than 6.98%</strong>, the sniper <strong>will</strong> participate.</span>"
                +  "</br><span><strong>- Seconds -</strong> the amount of seconds the sniper will make a prediction before the prediction closes (min 2s).</span>"
                +  "</br></br><span>- Remember that this is a statistical tool and wins are not guaranteed.</span>"
                +  "</div>"

            showToast(toast_body, 'shouldShowUpdatePopup');
        }
    });
}

function setOptionsFromDB() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('tp_options', function(result) {
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
    chrome.storage.local.set({'tp_options': options}, function() {
        toggleFeatures();
    });
}

function toggleFeatures() {
    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);

    if (options.isSidebarPreviewsEnabled) {
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
            document.getElementsByClassName('side-nav-section')[0].addEventListener("mouseenter", extendSidebar);
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

    if (options.isPredictionsNotificationsEnabled) {
        setPredictionsNotifications();
    }

    if (options.isPredictionsSniperEnabled) {
        setPredictionsNotifications();
    }

    if (options.isfScrnWithChatEnabled) {
        setfScrnWithChatBtn();
    }

    if (options.isPvqcEnabled) {
        setPvqc();
    }
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

    if (msg.action === "update_options") {
        onSettingChange(msg.detail.featureName, msg.detail.value);
    } else {
        if ("check_notifications_permissions") {
            checkForTwitchNotificationsPermissions(msg.detail.featureName, msg.detail.value);
        }
    }

});

window.addEventListener('load', (event) => {
    setTimeout(function(){
        ga_heartbeat();
        appendContainer = document.body;
        document.getElementById('sideNav').style.zIndex = '10';
        setOptionsFromDB().then(
            function (options){
                ga_report_appStart();
                toggleFeatures();
                createPipBtn();
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
