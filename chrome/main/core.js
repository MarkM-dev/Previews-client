var isNavBarCollapsed;
var previewDiv = null;
var appendContainer;
var IMAGE_CACHE_TTL_MS = 20000;
var isImagePreviewMode = true;
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

var mutationObserver = new MutationObserver(function(mutations) {
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

function onPreviewModeChange(imagePreviewMode, saveToStorage) {
    isImagePreviewMode = imagePreviewMode;
    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);

    if (saveToStorage) {
        chrome.storage.sync.set({'isImagePreviewMode': imagePreviewMode}, function() {

        });
    }
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
    iframe.width = PREVIEWDIV_WIDTH + "px";
    iframe.height = PREVIEWDIV_HEIGHT + "px";
    iframe.borderColor = "#232323";
    iframe.style.borderRadius = "5px";

    return iframe;
}

function createAndShowPreview() {
    previewDiv = document.createElement("div");
    previewDiv.classList.add("twitch_previews_previewDiv");
    previewDiv.classList.add("animated");
    previewDiv.style.width = PREVIEWDIV_WIDTH + "px";
    previewDiv.style.height = PREVIEWDIV_HEIGHT + "px";
    previewDiv.style.position = "fixed";
    previewDiv.style.marginTop = calculatePreviewDivPosition(lastHoveredCardEl);
    previewDiv.style.marginLeft = isNavBarCollapsed? "6rem":"25rem";
    //previewDiv.style.marginLeft = "25rem";
    previewDiv.style.zIndex = "9";
    previewDiv.style.backgroundSize = "cover";
    previewDiv.style.backgroundColor = "#232323";
    previewDiv.style.borderRadius = "5px";
    previewDiv.style.boxShadow = "10px 15px 10px -5px rgba(23,23,23,0.75)";
    previewDiv.style.display = "block";


    if(isStreamerOnline(lastHoveredCardEl)) {
        if (isImagePreviewMode) {
            previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);
            lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();
        } else {
            twitchIframe = createIframeElement();
            setTimeout(function () {
                twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
            },250)
            previewDiv.appendChild(twitchIframe);
        }
    } else {
        previewDiv.style.backgroundImage = getPreviewOfflineImageUrl();
        if (!isImagePreviewMode) {
            twitchIframe = createIframeElement();
            twitchIframe.style.display = "none";
            previewDiv.appendChild(twitchIframe);
        }
    }

    var tp_under_preview_div = document.createElement("div");
    tp_under_preview_div.classList.add('tp-under-preview-logo');
    tp_under_preview_div.classList.add('animated');
    tp_under_preview_div.classList.add('slideInLeft');
    tp_under_preview_div.classList.add('tp_anim_delay_1000ms');
    tp_under_preview_div.classList.add('tp_anim_duration_700ms');
    tp_under_preview_div.innerText = "Twitch Previews";

    setTimeout(function (){
        if (document.getElementsByClassName('tp-under-preview-logo').length > 0) {
            tp_under_preview_div.classList.remove('slideInLeft');
            tp_under_preview_div.classList.remove('tp_anim_delay_1000ms');
            tp_under_preview_div.classList.remove('tp_anim_duration_700ms');
            tp_under_preview_div.classList.add('tp_anim_duration_1000ms');
            tp_under_preview_div.classList.add('slideOutLeft');
        }
    }, 4000);

    previewDiv.appendChild(tp_under_preview_div);
    appendContainer.appendChild(previewDiv);
}

function changeAndShowPreview() {
    if(isStreamerOnline(lastHoveredCardEl)) {
        previewDiv.style.backgroundImage = "none";
        if (isImagePreviewMode) {
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
        }
    } else {
        previewDiv.style.backgroundImage = getPreviewOfflineImageUrl();
        if (!isImagePreviewMode){
            twitchIframe.style.display = "none";
        }
    }

    previewDiv.style.marginTop = calculatePreviewDivPosition(lastHoveredCardEl);
    previewDiv.style.marginLeft = isNavBarCollapsed? "6rem":"25rem";
    //previewDiv.style.marginLeft = "25rem";
    previewDiv.style.display = "block";
}

function hidePreview() {
    if (twitchIframe) {
        twitchIframe.src = '';
        twitchIframe.style.display = 'none';
    } else {
        previewDiv.style.backgroundImage = "none";
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
                            lastHoveredCardEl.querySelector('div[data-a-target="side-nav-live-status"]').appendChild(navCardPipBtn);
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
                //previewDiv.classList.remove("slideOutRight");
                if (previewDiv.style.display === "none") {
                    previewDiv.classList.add("slideInLeft");
                }
                changeAndShowPreview();
            } else {
                createAndShowPreview();
                previewDiv.classList.add("slideInLeft");
            }

            setTimeout(function () {
                previewDiv.classList.remove("slideInLeft");
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
                    previewDiv.classList.add("slideOutLeft");
                    setTimeout(function () {
                        isHovering = false;
                        hidePreview();
                        previewDiv.classList.remove("slideOutLeft");
                    },250)
                }
                document.getElementById("tp_navCard_pip_btn").parentElement.removeChild(document.getElementById("tp_navCard_pip_btn"));
            } catch (e) {

            }

        },50)
    }
}

function setSideNavMutationObserver() {
    mutationObserver.observe(document.getElementsByClassName("side-bar-contents")[0], {
        childList: true,
        subtree: true
    });
}

function refreshNavCardsListAndListeners() {
    isNavBarCollapsed = document.getElementsByClassName('side-nav--collapsed').length > 0;
    var navCards;
    if (isNavBarCollapsed) {
        navCards = document.getElementsByClassName('side-nav-card');
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

function onPreviewSizeChange(width) {
    clearExistingPreviewDivs(TP_PREVIEW_DIV_CLASSNAME);
    var previewSizeObj = getCalculatedPreviewSizeByWidth(width);
    setPreviewSize(previewSizeObj);

    chrome.storage.sync.set({'previewSize': previewSizeObj}, function() {

    });

}

function ga_report_appStart() {
    var size = "440px";
    var mode = "image";
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
                chrome.runtime.sendMessage({action: "appStart", detail: mode + " : " + size}, function(response) {

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
    }, 2000);
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action === "update_imagePreviewMode") {
        onPreviewModeChange(msg.isImagePreviewMode, true);
    } else {
        if (msg.action === "update_previewSize") {
            onPreviewSizeChange(msg.width);
        }
    }
});

///////////// TAB RESUME /////////////

window.addEventListener('visibilitychange', function() {
    !document.hidden && pageAwakened();
});

function pageAwakened() {
    setViewMode();
    setPreviewSizeFromStorage();
}

///////////// END OF TAB RESUME /////////////
