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
var navCardPipBtn = null;
var vidPreviewVolBtn = null;
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
var APS_awaiting_to_place_bet_streamName = false;
var APS_didnt_vote_reason_margin_percent = null;
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

/*function setDirectoryMutationObserver() {
    directoryMutationObserver.observe(document.querySelector('div[data-target="directory-container"]'), {
        childList: true,
        subtree: true
    });
}*/

function adjustVidPreviewVolClick(e) {
    e.preventDefault();
    e.cancelBubble = true;
    try {
        var video = twitchIframe.contentDocument.querySelector('video');
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
        var video = twitchIframe.contentDocument.querySelector('video');

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
    var volBtn = document.getElementById("tp_navCard_vpv_btn");
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
    vidPreviewVolBtn.style.backgroundImage = "url('" + chrome.runtime.getURL('../images/vidPreviewVolBtn.png') + "')";
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
    navCardPipBtn.style.width = "21px";
    navCardPipBtn.style.height = "12px";
    navCardPipBtn.style.position = "absolute";
    navCardPipBtn.style.marginTop = "1px";
    navCardPipBtn.style.right = "2.7rem";
    navCardPipBtn.style.backgroundSize = "contain";
    navCardPipBtn.style.backgroundRepeat = "no-repeat";
    navCardPipBtn.style.backgroundImage = "url('" + chrome.runtime.getURL('../images/tpt.png') + "')";
    navCardPipBtn.title = "Picture In Picture";
    navCardPipBtn.onclick = startPip;
}

function removePipBtn() {
    var pipBtn = document.getElementById("tp_navCard_pip_btn");
    if (pipBtn) {
        pipBtn.parentElement.removeChild(pipBtn);
    }
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
        removePipBtn();

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
        twitchIframe.style.borderRadius = "0px";
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
        twitchIframe.style.borderRadius = "0px";
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
            twitchIframe.allow = "autoplay;";
           // twitchIframe.autoplay = "true";
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
            twitchIframe.allow = "autoplay;";
            //twitchIframe.autoplay = "true";
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
                                lastHoveredCardEl.querySelector('div[data-a-target="side-nav-live-status"]').appendChild(vidPreviewVolBtn);
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
            setTimeout(function (){
                checkForAutoRefresh();
            }, 10000);
        } else {
            location.replace(window.location);
        }
    }
}

function checkForAutoRefresh() {
    var el = document.querySelector('p[data-test-selector="content-overlay-gate__text"]');
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
        var t_player = document.querySelector(".video-player").querySelector('video');
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
        var sideNavSections = document.getElementsByClassName('side-nav-section');
        if(sideNavSections[0]) {
            var navCards = getSidebarNavCards(sideNavSections[0]);
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
            if (res === "denied") {
                settings_predictionsNotifications_cb_off();
                return;
            }
            chrome.runtime.sendMessage({action: "bg_update_" + featureName, detail: true}, function(response) {

            });
            onSettingChange(featureName, true);
            showNotification("Twitch Previews", "Predictions Notifications Enabled!", chrome.runtime.getURL('../images/TP96.png'), true);
        },function (err) {
            settings_predictionsNotifications_cb_off();
            onSettingChange(featureName, false);
        });
    } else {
        chrome.runtime.sendMessage({action: "bg_update_" + featureName, detail: true}, function(response) {

        });
        onSettingChange(featureName, true);
        showNotification("Twitch Previews", "Predictions Notifications Enabled!", chrome.runtime.getURL('../images/TP96.png'), true);
    }
}

function showNotification(title, body, icon, dont_send_PN_SHOW_event) {
    if (Notification.permission !== "granted") {
        onSettingChange('isPredictionsNotificationsEnabled', false);
        settings_predictionsNotifications_cb_off();
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
    if (!dont_send_PN_SHOW_event) {
        chrome.runtime.sendMessage({action: "bg_PN_show", detail: "PN_show"}, function(response) {

        });
    }
}

function checkForPredictions(should_bet_now) {
    var btn_arr = document.querySelectorAll('button[data-test-selector="community-prediction-highlight-header__action-button"]');
    var btn;
    var details_btn;
    if(btn_arr.length > 0) {
        for (var i = 0; i < btn_arr.length; i++) {
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

        var curr_streamer = getCurrentStreamerName();
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

                chrome.storage.local.get('aps_streams_settings_obj', function(res) {
                    var curr_stream_aps_settings = null;
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

                        var extraText = '';
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
            var tooltip = document.getElementsByClassName('tw-tooltip-wrapper')[0];
            if (tooltip) {
                var points_str_extract_arr = tooltip.innerText.match(/\d+/g);
                var points = '';
                for (var i = 0; i < points_str_extract_arr.length; i++) {
                    points += points_str_extract_arr[i];
                }
                simulateHoverForPoints('mouseout',document.getElementsByClassName('community-points-summary')[0].getElementsByTagName('button')[0]);
                resolve(points);
            } else {
                simulateHoverForPoints('mouseover',document.getElementsByClassName('community-points-summary')[0].getElementsByTagName('button')[0]);
                setTimeout(function (){
                    tooltip = document.getElementsByClassName('tw-tooltip-wrapper')[0];
                    if (tooltip) {
                        var points_str_extract_arr = tooltip.innerText.match(/\d+/g);
                        var points = '';
                        for (var i = 0; i < points_str_extract_arr.length; i++) {
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
        chrome.runtime.sendMessage({action: "bg_APS_res", detail: document.querySelector('div[data-test-selector="prediction-checkout-completion-step__winnings-string"]') ? 'W' : document.querySelector('p[data-test-selector="prediction-checkout-completion-step__luck-string"]') ? 'L': 'N/A'}, function(response) {

        });
}

function getPredictionsSniperResults() {
    return new Promise((resolve, reject) => {

        // unknown
        // closed
        // ended

        var return_obj = {
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
                    var predictions_list_item_body = document.getElementsByClassName("predictions-list-item__body")[0];
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
                        var results_str = document.querySelector('div[data-test-selector="prediction-checkout-completion-step__winnings-string"]') || document.querySelector('p[data-test-selector="prediction-checkout-completion-step__luck-string"]');

                        if(results_str && results_str.innerText) {
                            return_obj.prediction_status = 'ended';
                            return_obj.text1 = results_str.innerText.replace(' \n','');
                            return_obj.prediction_question_answer_str = document.querySelector('.prediction-checkout-completion-step__header').nextElementSibling.innerText;
                            console.log(new Date().toLocaleString() + "\nAPS: " + return_obj.text1);
                            sendPredictionCompletionEvent();
                        }

                        try {
                            var predictions_bottom_text = document.querySelector('span[data-test-selector="user-prediction-string__outcome-title"]').parentElement.innerText
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
                        var time_remaining_str_extract_arr = document.querySelector('p[data-test-selector="predictions-list-item__subtitle"]').innerText.match(/\d+/g)
                        if (time_remaining_str_extract_arr == null) {
                            clearPredictionStatus();
                            reject('prediction_closed_or_ended');
                            return;
                        }

                        var ms_UntilPrediction;
                        if (should_bet_now) {
                            ms_UntilPrediction = 0;
                        } else {
                            ms_UntilPrediction = (time_remaining_str_extract_arr[0] * 60 * 1000) + (time_remaining_str_extract_arr[1] * 1000);
                            ms_UntilPrediction -= ((curr_stream_aps_settings ? curr_stream_aps_settings.aps_secondsBefore : options.aps_secondsBefore) * 1000) + 2000; //decrease by seconds set in options (seconds * 1000)
                        }

                        //var prediction_question = document.querySelector('p[data-test-selector="predictions-list-item__title"]').innerText

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

                            chrome.storage.local.get('aps_streams_settings_obj', function(res) {
                                var curr_stream_aps_settings = null;
                                var curr_stream_name = getCurrentStreamerName();
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
                                            var predictions_list_item_body = document.getElementsByClassName("predictions-list-item__body")[0];
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
                                                var predict_with_custom_points_btn = document.querySelector('button[data-test-selector="prediction-checkout-active-footer__input-type-toggle"]');
                                                if (!predict_with_custom_points_btn) {
                                                    closePopoutMenu();
                                                    clearPredictionStatus();
                                                    return;
                                                }
                                                predict_with_custom_points_btn.click();

                                                // get votes
                                                // twitch has a bug with switched classnames in the options elements, get numbers by render order.
                                                var stat_fields = document.querySelectorAll('div[data-test-selector="prediction-summary-stat__content"]');
                                                var left_vote_count = extractVotersNumberFromString(stat_fields[2].children[1].innerText);
                                                var right_vote_count = extractVotersNumberFromString(stat_fields[6].children[1].innerText);

                                                // vote margin
                                                var vote_margin_percent = getVotePercentageMargin(left_vote_count, right_vote_count);
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

                                                var selectedOption = left_vote_count > right_vote_count ? 0 : 1;

                                                // input number to predict with % of total points
                                                var prediction_bet_amount = Math.floor((curr_stream_aps_settings.aps_percent / 100) * totalChannelPointNum);

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

                                                setTextAreaValue(document.getElementsByClassName('custom-prediction-button')[selectedOption].getElementsByTagName('input')[0], prediction_bet_amount);

                                                // click vote
                                                document.getElementsByClassName('custom-prediction-button__interactive')[selectedOption].click();

                                                if(options.isPredictionsNotificationsEnabled) {
                                                    var curr_streamer = '';
                                                    var curr_streamer_img_url = '';
                                                    var prediction_question = '';
                                                    var sniper_selection_str = '';
                                                    var prediction_options_str = '';

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

                                                chrome.runtime.sendMessage({action: "bg_APS_exec", detail: "bg_APS_exec"}, function(response) {

                                                });
                                                clearPredictionStatus();
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

function aps_settings_initNumInputValue(settingsContainer, streamName, curr_stream_settings, featureName, inputID, minimum) {

    var input = settingsContainer.querySelector('#' + inputID);
    input.value = curr_stream_settings ? curr_stream_settings[featureName] : options[featureName];

    input.addEventListener('change', (event) => {
        var newVal = parseFloat(event.target.value);
        if (newVal < minimum) {
            newVal = minimum;
            input.value = minimum;
        }

        chrome.storage.local.get('aps_streams_settings_obj', function(res) {
            if (!res.aps_streams_settings_obj) {
                var aps_streams_settings_obj = {
                    [streamName] : {
                        aps_percent: options.aps_percent,
                        aps_max_points: options.aps_max_points,
                        aps_secondsBefore: options.aps_secondsBefore,
                        aps_min_vote_margin_percent: options.aps_secondsBefore
                    }
                };
                aps_streams_settings_obj[streamName][featureName] = newVal;
                chrome.storage.local.set({'aps_streams_settings_obj': aps_streams_settings_obj}, function() {

                });
            } else {
                if (res.aps_streams_settings_obj[streamName]) {
                    res.aps_streams_settings_obj[streamName][featureName] = newVal;
                    chrome.storage.local.set({'aps_streams_settings_obj': res.aps_streams_settings_obj}, function() {

                    });
                } else {
                    res.aps_streams_settings_obj[streamName] = {
                        aps_percent: options.aps_percent,
                        aps_max_points: options.aps_max_points,
                        aps_secondsBefore: options.aps_secondsBefore,
                        aps_min_vote_margin_percent: options.aps_secondsBefore
                    }
                    res.aps_streams_settings_obj[streamName][featureName] = newVal;
                    chrome.storage.local.set({'aps_streams_settings_obj': res.aps_streams_settings_obj}, function() {

                    });
                }
            }
        });
    })
}

function refresh_aps_settings_menu_ui(status) {
    var aps_settings_menu = document.getElementById('tp_APS_settings_menu');
    if (aps_settings_menu) {
        var menu_shadow_el = aps_settings_menu.querySelector('#tp_APS_title_shadow_el');
        var bet_now_btn = aps_settings_menu.querySelector('#tp_APS_bet_now_btn');
        var cancel_current_bet_btn = aps_settings_menu.querySelector('#tp_APS_cancel_current_bet');

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
            cancel_current_bet_btn.innerText = 'Check / Re-enable';

            bet_now_btn.classList.remove('tp-aps-settings-bet-now-active-btn');
        }
    }
}

function create_and_show_APS_settings_menu() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', chrome.runtime.getURL('main/APS_settings.html'), true);
    xhr.onreadystatechange = function() {
        if (this.readyState !== 4) return;
        if (this.status !== 200) return;

        var settingsContainer = document.createElement('div');
        settingsContainer.classList.add('tp-APS-settings-container');
        settingsContainer.innerHTML = this.responseText;

        var close_settings_btn = settingsContainer.querySelector('#tp_settings_close_btn');
        close_settings_btn.addEventListener('click', (event) => {
            toggle_APS_settings_menu();
        });

        settingsContainer.style.width = document.getElementsByClassName('chat-input__buttons-container')[0].getBoundingClientRect().width + "px";
        settingsContainer.firstChild.style.width = settingsContainer.style.width;

        var menu_shadow_el = settingsContainer.querySelector('#tp_APS_title_shadow_el');

        var bet_now_btn = settingsContainer.querySelector('#tp_APS_bet_now_btn');
        bet_now_btn.addEventListener('click', (event) => {
            if (predictionSniperTimeout) {
                last_prediction_streamer = "";
                toggle_APS_settings_menu();
                checkForPredictions(true);
            }
        });

        var cancel_current_bet_btn = settingsContainer.querySelector('#tp_APS_cancel_current_bet');
        cancel_current_bet_btn.addEventListener('click', (event) => {
            if (predictionSniperTimeout) {
                clearPredictionStatus();
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
            cancel_current_bet_btn.innerText = 'Check / Re-enable';
        }

        var curr_stream_name = getCurrentStreamerName();
        settingsContainer.querySelector('#tp_aps_settings_menu_stream_name').innerText = curr_stream_name;

        var aps_curr_stream_settings = null;
        chrome.storage.local.get('aps_streams_settings_obj', function(res) {
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
        chrome.runtime.sendMessage({action: "bg_APS_settings_opened", detail: "APS_settings.html"}, function(response) {

        });
        setTimeout(function (){

        }, 700);

    };
    xhr.send();
}

function toggle_APS_settings_menu() {
    var aps_settings_menu = document.getElementsByClassName('tp-APS-settings-container')[0];
    if (aps_settings_menu) {
        var aps_settings_menu_el = aps_settings_menu.querySelector('#tp_APS_settings_menu');
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
        var settings_btn = document.getElementById('tp_APS_settings_btn');
        settings_btn.firstChild.src = chrome.runtime.getURL('../images/gamepad_' + status + '.png');
        settings_btn.title = "Predictions Sniper - " + status;
        refresh_aps_settings_menu_ui(status);
    } catch (e) {

    }
}

function append_APS_settings_btn() {
    if (document.getElementById('tp_APS_settings_btn')) {
        return;
    }
    var chat_settings_btn = document.querySelector('button[data-a-target="chat-settings"]');
    if (chat_settings_btn) {
        var btn_container = document.createElement('div');
        btn_container.id = "tp_APS_settings_btn";
        btn_container.title = "Predictions Sniper - idle";

        var chat_settings_btn_size = chat_settings_btn.getBoundingClientRect();
        btn_container.style.width = (chat_settings_btn_size.width || "30") + "px";
        btn_container.style.height = (chat_settings_btn_size.height || "30") + "px";
        btn_container.style.zIndex = "1";

        var img = document.createElement('img');
        img.src = chrome.runtime.getURL('../images/gamepad_idle.png');
        img.width = (chat_settings_btn_size.width || "30") * 0.6;
        img.height = (chat_settings_btn_size.height || "30") * 0.6;
        img.style.margin = "auto";

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

function isOverflown(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
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
        "               | <div style=\"display: inline-block;padding: 5px;cursor: pointer;font-weight: bold;\" id='tp_updateToast_settings_btn' >Settings</div>\n" +
        "                <form action=\"https://www.paypal.com/cgi-bin/webscr\" method=\"post\" target=\"_blank\">\n" +
        "                        <input type=\"hidden\" name=\"cmd\" value=\"_s-xclick\" />\n" +
        "                        <input type=\"hidden\" name=\"hosted_button_id\" value=\"QM8HG45PYA4EU\" />\n" +
        "                        <input id=\"tp_updateToast_donate_btn\" style=\"width: 80%;box-shadow: 0px 3px 10px -5px rgb(23 23 23 / 75%);\" type=\"image\" src=\"" + chrome.runtime.getURL('../images/coffee.png') + "\" border=\"0\" name=\"submit\" title=\"PayPal - The safer, easier way to pay online!\" alt=\"Donate with PayPal button\" />\n" +
        "                        <img alt=\"\" border=\"0\" src=\"https://www.paypal.com/en_US/i/scr/pixel.gif\" width=\"1\" height=\"1\" />\n" +
        "                    </form>\n" +
        "            </div>\n" +
        "            <div style=\"margin-top: 5px;padding: 5px;cursor: pointer;font-size: 12px;text-align: center;font-weight: bold;\" id='tp_updateToast_dismiss_btn' >Close</div>\n" +
        "        </div>";

    updateToast.querySelector('#tp_updateToast_rate_btn').onclick = function () {
        setConfirmedToastFlag('rate_btn', storageFlagName);
        remove_toast();
        chrome.runtime.sendMessage({action: "bg_show_rate", detail: ""}, function(response) {

        });
    };
    updateToast.querySelector('#tp_updateToast_share_btn').onclick = function () {
        setConfirmedToastFlag('share_btn', storageFlagName);
        remove_toast();
        chrome.runtime.sendMessage({action: "bg_show_share", detail: ""}, function(response) {

        });
    };
    updateToast.querySelector('#tp_updateToast_settings_btn').onclick = function () {
        showSettings();
        chrome.runtime.sendMessage({action: "updateToast_settings_btn_click", detail: ""}, function(response) {

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
    return "   <div style=\"font-weight: bold;font-size: 15px;\" >Twitch Previews updated!</div>"
        +  "       <div style=\"font-size: 14px;font-weight: bold;margin-top: 10px;\" >New Features!</div>"
        +  "       <div style=\"font-size: 13px;margin-top: 20px;\" ><strong>- Predictions Sniper Per Stream Settings</strong></div>"
        +  "    <span style=\"font-size: 12px;\" >- To change Sniper individual settings per stream, click the Sniper settings button under the chat (available when the feature is enabled).</span>"
        +  "    </br><span style=\"font-size: 12px;\" >- The menu also contains two buttons: <strong>Vote Now</strong> and <strong>Cancel Upcoming Vote</strong> or <strong>Check / Re-enable</strong> according to the sniper's current status.</span>"
        +  "    </br></br>"
}

function showUpdateToast() {
    chrome.storage.local.get('shouldShowUpdatePopup', function(result) {
        if (result.shouldShowUpdatePopup) {
            showToast(getUpdateToastBody(), 'shouldShowUpdatePopup');
        }
    });
}

function check_showSettings() {
    chrome.storage.local.get('shouldShowSettings', function(result) {
        var shouldShowSettings = result.shouldShowSettings;
        if (shouldShowSettings) {
            showSettings();
            chrome.storage.local.set({'shouldShowSettings': false}, function() {

            });
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

function toggleFeatures(isFromTitleObserver) {
    if (!isFromTitleObserver) {
        clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
    }

    if (options.isSidebarPreviewsEnabled) {
        if (!options.isImagePreviewMode) {
            createVidPreviewVolBtn();
            createPipBtn();
        }

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

    if (options.isPredictionsNotificationsEnabled || options.isPredictionsSniperEnabled) {
        setPredictionsNotifications();
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
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

    if (msg.action === "tp_open_settings") {
        sendResponse({action: 'content-available'});
        showSettings();
    }

});

///////////////////////////////////////// SETTINGS /////////////////////////////////////////

function settings_predictionsNotifications_cb_off() {
    var settingsContainer = document.getElementById('TPBodyEl');
    if (settingsContainer) {
        settingsContainer.querySelector('#TP_popup_predictions_notifications_checkbox').checked = false;
    }
}

function changeFeatureMode(featureName, value) {
    onSettingChange(featureName, value);
    chrome.runtime.sendMessage({action: "bg_update_" + featureName, detail: value}, function(response) {

    });
}

function initSettingsInfoBtn(settingsContainer, checkboxID) {
    try {
        var infoBtn = settingsContainer.querySelector('#' + checkboxID).nextElementSibling;
        infoBtn.src = chrome.runtime.getURL('images/expand.png');
        infoBtn.addEventListener('click', (event) => {
            var infoDiv = infoBtn.parentNode.parentNode.nextElementSibling;
            if (infoDiv.style.maxHeight === "350px") {
                infoBtn.parentNode.parentNode.nextElementSibling.style.maxHeight = "0px";
                infoBtn.style.transform = "rotate(0deg)";
            } else {
                infoBtn.parentNode.parentNode.nextElementSibling.style.maxHeight = "350px";
                infoBtn.style.transform = "rotate(180deg)";
            }
        });
    } catch (e) {
        
    }
   
}

function initCheckbox(settingsContainer, featureName, checkboxID, invertBool) {
    var checkbox = settingsContainer.querySelector('#' + checkboxID);
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
                chrome.runtime.sendMessage({action: "bg_update_" + featureName, detail: false}, function(response) {

                });
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

function initNumInputValue(settingsContainer, featureName, inputID, minimum) {
    var input = settingsContainer.querySelector('#' + inputID);
    input.value = options[featureName];

    input.addEventListener('change', (event) => {
        var newVal = parseFloat(event.target.value);
        if (newVal < minimum) {
            newVal = minimum;
            input.value = minimum;
        }

        changeFeatureMode(featureName, newVal);
    })
}

function initPreviewSizeSlider(settingsContainer) {
    slider = settingsContainer.querySelector("#TP_popup_preview_size_input_slider");
    output = settingsContainer.querySelector("#TP_popup_preview_size_display");
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
    var btn = settingsContainer.querySelector('#tp_popup_' + name +'_btn');
    btn.addEventListener('click', (event) => {
        if (url) {
            chrome.runtime.sendMessage({action: "bg_show_" + name, detail: ""}, function(response) {

            });
        }
        chrome.runtime.sendMessage({action: 'bg_' + name +'_btn_click', detail: ""}, function(response) {

        });
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
    settingsContainer.querySelector('#tp_version').innerText = " - v" + chrome.runtime.getManifest().version;
}

function initDragForAPSSettings(settingsContainer) {
    dragElement(settingsContainer.querySelector('#tp_APS_settings_menu'));

    function dragElement(elmnt) {
        var pos2 = 0, pos4 = 0;
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
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
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
        var translateInfoBtn = settingsContainer.querySelector('#' + checkboxID).parentNode.parentNode.nextElementSibling.querySelector('.translate_div_btn');
        translateInfoBtn.src = chrome.runtime.getURL('images/translate.png');
        translateInfoBtn.addEventListener('click', (event) => {
            chrome.runtime.sendMessage({action: "bg_translate_infoDiv", detail: 'https://translate.google.com/?sl=auto&tl=auto&text=' + encodeURIComponent(translateInfoBtn.parentNode.innerText) + '&op=translate'}, function(response) {

            });
        });
    } catch (e) {

    }
}

function showSettingsMenu() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', chrome.runtime.getURL('main/settings.html'), true);
    xhr.onreadystatechange = function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return;

        var settingsContainer = document.createElement('div');
        settingsContainer.classList.add('tp-settings-container');
        settingsContainer.classList.add('animated');
        settingsContainer.classList.add('bounceIn');
        settingsContainer.innerHTML = this.responseText;

        var close_settings_btn = settingsContainer.querySelector('#tp_settings_close_btn');
        close_settings_btn.addEventListener('click', (event) => {
            settingsContainer.style.width = '800px';
            settingsContainer.style.height = '600px';
            settingsContainer.classList.remove('bounceIn');
            settingsContainer.classList.add('zoomOut');
            setTimeout(function (){
                settingsContainer.parentNode.removeChild(settingsContainer);
            }, 700);
        });

        settingsContainer.querySelector('#TP_popup_title_logo').src = chrome.runtime.getURL('images/TP96.png');
        settingsContainer.querySelector('#TP_popup_logo').src = chrome.runtime.getURL('images/TP96.png');
        settingsContainer.querySelector('#tp_popup_donate_btn').src = chrome.runtime.getURL('images/coffee.png');
        settingsContainer.querySelector('#tp_fScrnWithChat_img').src = chrome.runtime.getURL('images/tp_fScrnWithChat.png');

        initCheckbox(settingsContainer, 'isSidebarPreviewsEnabled', 'TP_popup_sidebar_previews_checkbox', false);
        initCheckbox(settingsContainer, 'isImagePreviewMode', 'TP_popup_preview_mode_checkbox', true);
        initCheckbox(settingsContainer, 'isDirpEnabled', 'TP_popup_directory_preview_mode_checkbox', false);
        initCheckbox(settingsContainer, 'isChannelPointsClickerEnabled', 'TP_popup_channel_points_checkbox', false);
        initCheckbox(settingsContainer, 'isSidebarExtendEnabled', 'TP_popup_sidebar_extend_checkbox', false);
        initCheckbox(settingsContainer, 'isSidebarSearchEnabled', 'TP_popup_sidebar_search_checkbox', false);
        initCheckbox(settingsContainer, 'isPvqcEnabled', 'TP_popup_pvqc_checkbox', false);
        initCheckbox(settingsContainer, 'isErrRefreshEnabled', 'TP_popup_err_refresh_checkbox', false);
        initCheckbox(settingsContainer, 'isfScrnWithChatEnabled', 'TP_popup_fScrnWithChat_checkbox', false);
        initCheckbox(settingsContainer, 'isPredictionsNotificationsEnabled', 'TP_popup_predictions_notifications_checkbox', false);
        initCheckbox(settingsContainer, 'isPredictionsSniperEnabled', 'TP_popup_predictions_sniper_checkbox', false);
        initNumInputValue(settingsContainer, 'aps_percent', 'TP_popup_aps_percent_input', 0);
        initNumInputValue(settingsContainer, 'aps_max_points', 'TP_popup_aps_max_points_input', 0);
        initNumInputValue(settingsContainer, 'aps_min_vote_margin_percent', 'TP_popup_aps_min_vote_margin_percent_input', 0);
        initNumInputValue(settingsContainer, 'aps_secondsBefore', 'TP_popup_aps_secondsBefore_input', 2);

        initPreviewSizeSlider(settingsContainer);

        initSocialBtn(settingsContainer, 'donate', null);
        initSocialBtn(settingsContainer, 'rate', true);
        initSocialBtn(settingsContainer, 'share', true);

        initSocialBtn(settingsContainer, 'github', true);
        initSocialBtn(settingsContainer, 'bugReport', true);
        initSocialBtn(settingsContainer, 'changelog', false);
        initSocialBtn(settingsContainer, 'contact', false);

        setAppVer(settingsContainer);

        initDragForSettings(settingsContainer);

        document.body.appendChild(settingsContainer);

        setTimeout(function (){
            settingsContainer.style.width = '1px';
            settingsContainer.style.height = '1px';
        }, 700);

        chrome.runtime.sendMessage({action: "bg_settings_opened", detail: "settings.html"}, function(response) {

        });
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