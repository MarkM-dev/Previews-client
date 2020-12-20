var isNavBarCollapsed;
var previewDiv = null;
var appendContainer;
var IMAGE_CACHE_TTL_MS = 20000;
var isImagePreviewMode = true;
var isDirpEnabled = true;
var isChannelPointsClickerEnabled = false;
var channelPointsClickerInterval = null;
var twitchIframe;
var PREVIEWDIV_WIDTH = 440;
var PREVIEWDIV_HEIGHT = 248;
var isHovering = false;
var lastHoveredCardEl = null;
var TP_PREVIEW_DIV_CLASSNAME = "twitch_previews_previewDiv";
var clearOverlaysInterval = null;
var clearVidPlayInterval = null;
var isLayoutHorizontallyInverted = null;


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

function getElementOffset(el) {
    var rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {top: rect.top + scrollTop, left: rect.left + scrollLeft}
}

function calculatePreviewDivPosition(navCardEl) {
    var elOffset = getElementOffset(navCardEl).top + (isNavBarCollapsed? 45:30);
    //var elOffset = getElementOffset(navCardEl).top + (30);
    if (window.innerHeight - elOffset < PREVIEWDIV_HEIGHT) { // if cuts off bottom
        if (elOffset - PREVIEWDIV_HEIGHT - (isNavBarCollapsed? 25:20) < 0) { // if cuts off top too
            return "5rem";
        } else {
            return elOffset - PREVIEWDIV_HEIGHT - (isNavBarCollapsed? 25:20) + "px";
            //return elOffset - PREVIEWDIV_HEIGHT - (20);
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
        return "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-" + PREVIEWDIV_WIDTH + "x" + Math.round(PREVIEWDIV_HEIGHT) + ".jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
}

function getPreviewStreamUrl(navCardEl) {
   // return "https://player.twitch.tv/?channel=" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "&!controls&muted";
    //return "https://player.twitch.tv/?channel=" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "&muted&parent=twitch.tv";
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
    previewDiv.style.width = PREVIEWDIV_WIDTH + "px";
    previewDiv.style.height = PREVIEWDIV_HEIGHT + "px";
    setPreviewDivPosition();
    previewDiv.style.display = "block";


    if(isStreamerOnline(lastHoveredCardEl)) {

        previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);
        lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();

        if (isImagePreviewMode) {
         //   previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);
           // lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();
        } else {
            createAndShowLoadingSpinnerForSideNav();
            twitchIframe = createIframeElement();
            twitchIframe.width = PREVIEWDIV_WIDTH + "px";
            twitchIframe.height = PREVIEWDIV_HEIGHT + "px";
            twitchIframe.style.visibility = 'hidden';
            setTimeout(function () {
                twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
            },250)
            previewDiv.appendChild(twitchIframe);
        }
    } else {
        previewDiv.style.backgroundImage = getPreviewOfflineImageUrl();
        if (!isImagePreviewMode) {
            twitchIframe = createIframeElement();
            twitchIframe.width = PREVIEWDIV_WIDTH + "px";
            twitchIframe.height = PREVIEWDIV_HEIGHT + "px";
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

        if (isImagePreviewMode) {
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
            twitchIframe.width = PREVIEWDIV_WIDTH + "px";
            twitchIframe.height = PREVIEWDIV_HEIGHT + "px";
        }
    } else {
        clearLoadingSpinnerFromSideNav();
        previewDiv.style.backgroundImage = getPreviewOfflineImageUrl();
        if (!isImagePreviewMode){
            twitchIframe.style.display = "none";
        }
    }

    previewDiv.style.width = PREVIEWDIV_WIDTH + "px";
    previewDiv.style.height = PREVIEWDIV_HEIGHT + "px";
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
        if (!isDirpEnabled) {
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

function refreshNavCardsListAndListeners() {
    if (document.getElementById('sideNav')) {
        isNavBarCollapsed = document.getElementsByClassName('side-nav--collapsed').length > 0;
        var navCards;
        if (isNavBarCollapsed) {
            if (document.querySelectorAll('a.side-nav-card')[0].href){
                navCards = document.querySelectorAll('a.side-nav-card');
            } else {
                isNavBarCollapsed = false;
                navCards = document.getElementsByClassName('side-nav-card__link');
            }
        } else {
            navCards = document.getElementsByClassName('side-nav-card__link');
        }
        //var navCards = document.getElementsByClassName('side-nav-card__link');
        for (var i = 0; i < navCards.length; i++) {
            navCards[i].lastImageLoadTimeStamp = new Date().getTime();
            setMouseOverListeners(navCards[i]);
        }
    }

}

function setViewMode() {
    try {
        browser.storage.local.get('isImagePreviewMode', function(result) {
            if (typeof result.isImagePreviewMode == 'undefined') {
                isImagePreviewMode = true;
            } else {
                if(isImagePreviewMode) {
                    if (isImagePreviewMode !== result.isImagePreviewMode) {
                        onPreviewModeChange(result.isImagePreviewMode, false);
                    }
                } else {
                    isImagePreviewMode = result.isImagePreviewMode;
                }
            }
        });
    } catch (e) {
        onPreviewModeChange(true, false);
    }
}

function setDirectoryPreviewMode() {
    try {
        browser.storage.local.get('isDirpEnabled', function(result) {
            if (typeof result.isDirpEnabled == 'undefined') {
                onDirectoryPreviewModeChange(true, false);
            } else {
                onDirectoryPreviewModeChange(result.isDirpEnabled, false);
            }
        });
    } catch (e) {
        onDirectoryPreviewModeChange(true, false);
    }
}

function setChannelPointsClickerMode() {
    try {
        browser.storage.local.get('isChannelPointsClickerEnabled', function(result) {
            if (typeof result.isChannelPointsClickerEnabled == 'undefined') {
                onChannelPointsClickerModeChange(false, false);
            } else {
                onChannelPointsClickerModeChange(result.isChannelPointsClickerEnabled, false);
            }
        });
    } catch (e) {
        onChannelPointsClickerModeChange(false, false);
    }
}

function getCalculatedPreviewSizeByWidth (width) {
    return {width: width, height: 0.5636363636363636 * width};
}

function setPreviewSize(previewSizeObj) {
    PREVIEWDIV_WIDTH = previewSizeObj.width;
    PREVIEWDIV_HEIGHT = previewSizeObj.height;
}

function setPreviewSizeFromStorage() {
    if (previewDiv) {
        clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
    }

    try {
        browser.storage.local.get('previewSize', function(result) {
            if (typeof result.previewSize == 'undefined') {
                setPreviewSize(getCalculatedPreviewSizeByWidth(PREVIEWDIV_WIDTH));
            } else {
                setPreviewSize(result.previewSize);
            }
        });
    } catch (e) {
        setPreviewSize(getCalculatedPreviewSizeByWidth(PREVIEWDIV_WIDTH));
    }
}

function onPreviewModeChange(imagePreviewMode, saveToStorage) {
    isImagePreviewMode = imagePreviewMode;
    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);

    if (saveToStorage) {
        browser.storage.local.set({'isImagePreviewMode': imagePreviewMode}, function() {

        });
    }
}

function setDirectoryCardsListeners() {
    if (isDirpEnabled) {
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
    if (isChannelPointsClickerEnabled && !channelPointsClickerInterval) {
        clickChannelPointsBtn();
        channelPointsClickerInterval = setInterval(function() {
            clickChannelPointsBtn();
        }, 15000);
    }
}

function onDirectoryPreviewModeChange(directoryPreviewEnabled, saveToStorage) {
    isDirpEnabled = directoryPreviewEnabled;
    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);

    if (saveToStorage) {
        browser.storage.local.set({'isDirpEnabled': directoryPreviewEnabled}, function() {

        });
    }

    setDirectoryCardsListeners();
}

function onChannelPointsClickerModeChange(ChannelPointsClickerEnabled, saveToStorage) {
    isChannelPointsClickerEnabled = ChannelPointsClickerEnabled;

    if (saveToStorage) {
        browser.storage.local.set({'isChannelPointsClickerEnabled': ChannelPointsClickerEnabled}, function() {

        });
    }

    if (ChannelPointsClickerEnabled) {
        setChannelPointsClickerListeners();
    } else {
        if (channelPointsClickerInterval) {
            clearInterval(channelPointsClickerInterval);
            channelPointsClickerInterval = null;
        }
    }

}

function onPreviewSizeChange(width) {
    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
    var previewSizeObj = getCalculatedPreviewSizeByWidth(width);
    setPreviewSize(previewSizeObj);

    browser.storage.local.set({'previewSize': previewSizeObj}, function() {

    });

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

window.addEventListener('load', (event) => {
    setTimeout(function(){
        appendContainer = document.body;
        document.getElementById('sideNav').style.zIndex = '10';
        setViewMode();
        setPreviewSizeFromStorage();
        refreshNavCardsListAndListeners();
        setSideNavMutationObserver();
        setDirectoryPreviewMode();
        setTimeout(function (){
            setTitleMutationObserverForDirectoryCardsRefresh();
            setChannelPointsClickerMode();
        }, 1000);
    }, 2000);
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

    switch(msg.action) {
        case "update_imagePreviewMode":
            onPreviewModeChange(msg.isImagePreviewMode, true);
            break;
        case "update_directoryPreviewMode":
            onDirectoryPreviewModeChange(msg.isDirpEnabled, true);
            break;
        case "update_ChannelPointsClickerMode":
            onChannelPointsClickerModeChange(msg.isChannelPointsClickerEnabled, true);
            break;
        case "update_previewSize":
            onPreviewSizeChange(msg.width);
            break;
    }

});

///////////// TAB RESUME /////////////

window.addEventListener('visibilitychange', function() {
    !document.hidden && pageAwakened();
});

function pageAwakened() {
    setViewMode();
    setPreviewSizeFromStorage();
    setDirectoryPreviewMode();
    setChannelPointsClickerMode();
}

///////////// END OF TAB RESUME /////////////
