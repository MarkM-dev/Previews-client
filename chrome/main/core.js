var isNavBarCollapsed;
var previewDiv = null;
var appendContainer;
var IMAGE_CACHE_TTL_MS = 20000;
var isImagePreviewMode = true;
var isDirectoryPreviewEnabled = true;
var twitchIframe;
var PREVIEWDIV_WIDTH = 440;
var PREVIEWDIV_HEIGHT = 248;
var isHovering = false;
var lastHoveredCardEl = null;
var TP_PREVIEW_DIV_CLASSNAME = "twitch_previews_previewDiv";
var TP_PIP_DIV_CLASSNAME = "twitch_previews_pip";
var isPipActive = false;
var navCardPipBtn;
var clearOverlaysInterval = null;
var isLayoutHorizontallyInverted = null;
var isDirectoryPreviewCardTop = null;


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
        console.log("directoryMutationObserver called refreshing");
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
            clearExistingPreviewDivs(TP_PIP_DIV_CLASSNAME);
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
    return "https://player.twitch.tv/?channel=" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "&muted&parent=twitch.tv";
}

function createIframeElement() {
    var iframe = document.createElement("Iframe");
    iframe.borderColor = "#232323";
    iframe.style.borderRadius = "5px";

    return iframe;
}

function createPreviewDiv(cssClass) {
    var previewDiv = document.createElement("div");
    previewDiv.classList.add(cssClass);
    previewDiv.classList.add("animated");
    previewDiv.style.position = "fixed";
    previewDiv.style.zIndex = "9";
    previewDiv.style.backgroundSize = "cover";
    previewDiv.style.backgroundColor = "#232323";
    previewDiv.style.borderRadius = "5px";

    return previewDiv;
}

function createAndShowUnderPreviewDivBanner(isCardFromDirectory, left) {
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
        }, 3500);
    }, 1000)

    previewDiv.appendChild(tp_under_preview_div);
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

function setDirectoryPreviewTopPosition () {
   // if (lastHoveredCardEl.getBoundingClientRect().top + lastHoveredCardEl.getBoundingClientRect().height < document.querySelector(".root-scrollable").getBoundingClientRect().height * 0.35) {
    if (lastHoveredCardEl.getBoundingClientRect().top < document.querySelector(".root-scrollable").getBoundingClientRect().height * 0.35) {
        // element is at the top
        isDirectoryPreviewCardTop = true;
        previewDiv.style.top =  "60%";
    } else {
        // bottom
        isDirectoryPreviewCardTop = false;
        previewDiv.style.top = "6rem";
    }
}

function setDirectoryPreviewLeftPosition(calculatedSize) {
    previewDiv.style.marginLeft = (document.querySelector(".root-scrollable").getBoundingClientRect().width / 2) - (calculatedSize.width / 2) + document.getElementById("sideNav").getBoundingClientRect().width + "px";
}

function createAndShowDirectoryPreview() {
    previewDiv = createPreviewDiv(TP_PREVIEW_DIV_CLASSNAME);
    previewDiv.classList.add("tp-anim-duration-1s");
    var calculatedSize = getCalculatedPreviewSizeByWidth(document.querySelector(".root-scrollable").getBoundingClientRect().width * 0.35);
    previewDiv.style.width = calculatedSize.width + "px";
    previewDiv.style.height = calculatedSize.height + "px";
    setDirectoryPreviewTopPosition();
    setDirectoryPreviewLeftPosition(calculatedSize);
    previewDiv.style.boxShadow = "10px 15px 10px -5px rgba(23,23,23,0.75)";
    previewDiv.style.display = "block";

    if(isStreamerOnline(lastHoveredCardEl)) {
        twitchIframe = createIframeElement();
        twitchIframe.width = calculatedSize.width + "px";
        twitchIframe.height = calculatedSize.height + "px";
        setTimeout(function () {
            twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
        },250)
        previewDiv.appendChild(twitchIframe);
    } else {
        previewDiv.style.backgroundImage = getPreviewOfflineImageUrl();
        twitchIframe = createIframeElement();
        twitchIframe.width = calculatedSize.width + "px";
        twitchIframe.height = calculatedSize.height + "px";
        twitchIframe.style.display = "none";
        previewDiv.appendChild(twitchIframe);
    }
    createAndShowUnderPreviewDivBanner(true, calculatedSize.width / 2 - 67);
    appendContainer.appendChild(previewDiv);
}

function changeAndShowDirectoryPreview() {
    if(isStreamerOnline(lastHoveredCardEl)) {
        previewDiv.style.backgroundImage = "none";
        if (!twitchIframe) {
            twitchIframe = createIframeElement();
            previewDiv.appendChild(twitchIframe);
        }
        if(twitchIframe.src !== getPreviewStreamUrl(lastHoveredCardEl)) {
            if (previewDiv.style.display !== "block") {
                setTimeout(function () {
                    twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
                    setTimeout(function () {
                        twitchIframe.style.display = 'block';
                    },300);
                }, 50);
            } else {
                twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
                twitchIframe.style.display = 'block';
            }
        } else {
            twitchIframe.style.display = 'block';
        }
    } else {
        previewDiv.style.backgroundImage = getPreviewOfflineImageUrl();
        if (!isImagePreviewMode){
            twitchIframe.style.display = "none";
        }
    }

    var calculatedSize = getCalculatedPreviewSizeByWidth(document.querySelector(".root-scrollable").getBoundingClientRect().width * 0.35);
    previewDiv.style.width = calculatedSize.width + "px";
    previewDiv.style.height = calculatedSize.height + "px";
    twitchIframe.width = calculatedSize.width + "px";
    twitchIframe.height = calculatedSize.height + "px";
    setDirectoryPreviewTopPosition();
    setDirectoryPreviewLeftPosition(calculatedSize);
    if (!previewDiv.classList.contains("tp-anim-duration-1s")) {
        previewDiv.classList.add("tp-anim-duration-1s");
    }
    if (previewDiv.style.display === "none") {
        previewDiv.classList.add(isDirectoryPreviewCardTop ? 'slideInUp':'slideInDown');
    }

    previewDiv.style.display = "block";
}

function createAndShowPreview() {
    previewDiv = createPreviewDiv(TP_PREVIEW_DIV_CLASSNAME);
    previewDiv.style.width = PREVIEWDIV_WIDTH + "px";
    previewDiv.style.height = PREVIEWDIV_HEIGHT + "px";
    setPreviewDivPosition();
    previewDiv.style.display = "block";


    if(isStreamerOnline(lastHoveredCardEl)) {
        if (isImagePreviewMode) {
            previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);
            lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();
        } else {
            twitchIframe = createIframeElement();
            twitchIframe.width = PREVIEWDIV_WIDTH + "px";
            twitchIframe.height = PREVIEWDIV_HEIGHT + "px";
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

    createAndShowUnderPreviewDivBanner();
    appendContainer.appendChild(previewDiv);
}

function changeAndShowPreview() {
    if(isStreamerOnline(lastHoveredCardEl)) {
        previewDiv.style.backgroundImage = "none";
        if (isImagePreviewMode) {
            if (twitchIframe) { // in case its from directory and user in image mode.
                twitchIframe.style.display = 'none';
            }
            if (new Date().getTime() - lastHoveredCardEl.lastImageLoadTimeStamp > IMAGE_CACHE_TTL_MS) {
                lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();
                previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);
            } else {
                previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);
            }
        } else {
            if(twitchIframe.src !== getPreviewStreamUrl(lastHoveredCardEl)) {
                if (previewDiv.style.display !== "block") {
                    setTimeout(function () {
                        twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
                        setTimeout(function () {
                            twitchIframe.style.display = 'block';
                        },300);
                    }, 50);
                } else {
                    twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
                    twitchIframe.style.display = 'block';
                }
            } else {
                twitchIframe.style.display = 'block';
            }
            twitchIframe.width = PREVIEWDIV_WIDTH + "px";
            twitchIframe.height = PREVIEWDIV_HEIGHT + "px";
        }
    } else {
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

function clearOverlays() {
    try {
        if (twitchIframe) {
            var intervalCount = 0;
             clearOverlaysInterval = setInterval(function (){
                if (!isHovering) {
                    clearInterval(clearOverlaysInterval);
                    clearOverlaysInterval = null;
                    return;
                }
                if (twitchIframe.contentDocument) {
                    if (twitchIframe.contentDocument.querySelector('button[data-a-target="player-overlay-mature-accept"]')) {
                        twitchIframe.contentDocument.querySelector('button[data-a-target="player-overlay-mature-accept"]').click();
                        setTimeout(function (){
                            var vpo = twitchIframe.contentDocument.getElementsByClassName('video-player__overlay')[0];
                            vpo.parentNode.removeChild(vpo);
                        },100);
                        clearInterval(clearOverlaysInterval);
                        clearOverlaysInterval = null;
                    } else {
                        if (twitchIframe.contentDocument.getElementsByClassName('video-player__overlay')[0]) {
                            var vpo = twitchIframe.contentDocument.getElementsByClassName('video-player__overlay')[0];
                            vpo.parentNode.removeChild(vpo);
                            clearInterval(clearOverlaysInterval);
                            clearOverlaysInterval = null;
                        } else {
                            if (intervalCount > 5) {
                                clearInterval(clearOverlaysInterval);
                                clearOverlaysInterval = null;
                            } else {
                                intervalCount++;
                            }
                        }
                        if (isHovering && !isImagePreviewMode && !isNavBarCollapsed) {
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
                previewDiv.classList.remove(isLayoutHorizontallyInverted ? 'slideInRight':'slideInLeft');
            },200)

            setTimeout(function () {
                if (isStreamerOnline(lastHoveredCardEl)) {
                    if(clearOverlaysInterval) {
                        clearInterval(clearOverlaysInterval);
                        clearOverlaysInterval = null;
                    }
                    clearOverlays();
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
                        hidePreview();
                        previewDiv.classList.remove(isLayoutHorizontallyInverted ? 'slideOutRight':'slideOutLeft');
                    },250)
                }
                document.getElementById("tp_navCard_pip_btn").parentElement.removeChild(document.getElementById("tp_navCard_pip_btn"));
            } catch (e) {

            }

        },50)
    }
}

function hideDirectoryPreview() {
    previewDiv.classList.add(isDirectoryPreviewCardTop ? 'backOutDown':'backOutUp');
    setTimeout(function () {
        isHovering = false;
        hidePreview();
        previewDiv.classList.remove('backOutUp');
        previewDiv.classList.remove('backOutDown');
    },250)
}

function setDirectoryMouseOverListeners(navCardEl) {
    navCardEl.onmouseover = function () {
        if (!isDirectoryPreviewEnabled) {
            return;
        }
        if (!isHovering) {
            isHovering = true;
            lastHoveredCardEl = navCardEl;

            if(lastHoveredCardEl.href.indexOf("/videos/") > 0 || lastHoveredCardEl.href.indexOf("/clip/") > 0) {
                return;
            }
            
            if (previewDiv) {
                changeAndShowDirectoryPreview();
            } else {
                createAndShowDirectoryPreview();
                previewDiv.classList.add(isDirectoryPreviewCardTop ? 'slideInUp':'slideInDown');
            }

            navCardEl.addEventListener('click', (event) => {
                hideDirectoryPreview();
            });

            setTimeout(function () {
                previewDiv.classList.remove('slideInDown');
                previewDiv.classList.remove('slideInUp');
            },200)

            setTimeout(function () {
                if (isStreamerOnline(lastHoveredCardEl)) {
                    if(clearOverlaysInterval) {
                        clearInterval(clearOverlaysInterval);
                        clearOverlaysInterval = null;
                    }
                    clearOverlays();
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
                    hideDirectoryPreview();
                }
            } catch (e) {

            }

        },400)
    }
}

function refreshDirectoryNavCardsListAndListeners() {
    var directoryNavCards = document.querySelectorAll('a[data-a-target="preview-card-image-link"]');
    for (var i = 0; i < directoryNavCards.length; i++) {
        setDirectoryMouseOverListeners(directoryNavCards[i]);
    }
}

function refreshNavCardsListAndListeners() {
    isNavBarCollapsed = document.getElementsByClassName('side-nav--collapsed').length > 0;
    var navCards;
    if (isNavBarCollapsed) {
        if (document.getElementsByClassName('side-nav-card')[0].href){
            navCards = document.getElementsByClassName('side-nav-card');
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

function ga_heartbeat() {
    chrome.runtime.sendMessage({action: "heartbeat", detail: ""}, function(response) {

    });
    setTimeout(ga_heartbeat, 325000);
}

function setViewMode() {
    try {
        chrome.storage.sync.get('isImagePreviewMode', function(result) {
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
        chrome.storage.sync.get('isDirectoryPreviewEnabled', function(result) {
            if (typeof result.isDirectoryPreviewEnabled == 'undefined') {
                onDirectoryPreviewModeChange(true, false);
            } else {
                onDirectoryPreviewModeChange(result.isDirectoryPreviewEnabled, false);
            }
        });
    } catch (e) {
        onDirectoryPreviewModeChange(true, false);
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
        chrome.storage.sync.get('previewSize', function(result) {
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
        chrome.storage.sync.set({'isImagePreviewMode': imagePreviewMode}, function() {

        });
    }
}

function setDirectoryCardsListeners() {
    if (isDirectoryPreviewEnabled) {
        //if (document.querySelector('div[data-target="directory-container"]')) {
        if (document.querySelector('.common-centered-column')) {
            //setDirectoryMutationObserver();
            refreshDirectoryNavCardsListAndListeners();
        }
    }
}

function onDirectoryPreviewModeChange(directoryPreviewEnabled, saveToStorage) {
    isDirectoryPreviewEnabled = directoryPreviewEnabled;
    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);

    if (saveToStorage) {
        chrome.storage.sync.set({'isDirectoryPreviewEnabled': directoryPreviewEnabled}, function() {

        });
    }

    setDirectoryCardsListeners();
}

function onPreviewSizeChange(width) {
    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
    var previewSizeObj = getCalculatedPreviewSizeByWidth(width);
    setPreviewSize(previewSizeObj);

    chrome.storage.sync.set({'previewSize': previewSizeObj}, function() {

    });

}

function clearExistingPreviewDivs(className) {
    var previewDivs = document.getElementsByClassName(className);
    for (var i = 0; i <= previewDivs.length; i++) {
        if (previewDivs[i]) {
            previewDivs[i].parentNode.removeChild(previewDivs[i]);
        }
    }
    previewDiv = null;
    twitchIframe = null;
}

function ga_report_appStart() {
    var size = "440px";
    var mode = "image";
    var dirp = "dirp_on";

    try {
        chrome.storage.sync.get('previewSize', function(result) {
            if (typeof result.previewSize == 'undefined') {

            } else {
                size = result.previewSize.width + "px";
            }

            chrome.storage.sync.get('isImagePreviewMode', function(result) {
                if (typeof result.isImagePreviewMode == 'undefined') {

                } else {
                    mode = result.isImagePreviewMode ? "Image":"Video";
                }

                chrome.storage.sync.get('isDirectoryPreviewEnabled', function(result) {
                    if (typeof result.isDirectoryPreviewEnabled == 'undefined') {

                    } else {
                        dirp = result.isDirectoryPreviewEnabled ? "dirp_ON":"dirp_OFF";
                    }
                    chrome.runtime.sendMessage({action: "appStart", detail: mode + " : " + size + " : " + dirp}, function(response) {

                    });
                });
            });
        });
    } catch (e) {
        chrome.runtime.sendMessage({action: "appStart", detail: "-- err: " + e.message}, function(response) {

        });
    }
}

window.addEventListener('load', (event) => {
    setTimeout(function(){
        ga_report_appStart();
        ga_heartbeat();
        appendContainer = document.body;
        document.getElementById('sideNav').style.zIndex = '10';
        setViewMode();
        setPreviewSizeFromStorage();
        refreshNavCardsListAndListeners();
        setSideNavMutationObserver();
        createPipBtn();
        setDirectoryPreviewMode();
        setTimeout(function (){
            setTitleMutationObserverForDirectoryCardsRefresh();
        }, 1000);
    }, 2000);
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

    switch(msg.action) {
        case "update_imagePreviewMode":
            onPreviewModeChange(msg.isImagePreviewMode, true);
            break;
        case "update_directoryPreviewMode":
            onDirectoryPreviewModeChange(msg.isDirectoryPreviewEnabled, true);
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
}

///////////// END OF TAB RESUME /////////////
