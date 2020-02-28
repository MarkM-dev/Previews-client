var isNavBarCollapsed;
var previewDiv = null;
var appendContainer;
var IMAGE_CACHE_TTL_MS = 20000;
var isImagePreviewMode = true;
var twitchIframe;
var PREVIEWDIV_HEIGHT = 248;
var PREVIEWDIV_WIDTH = 440;

var mutationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === "childList") {
            refreshNavCardsListAndListeners();
        }
    });
});

function onPreviewModeChange(imagePreviewMode, saveToStorage) {
    isImagePreviewMode = imagePreviewMode;
    var previewDivs = document.getElementsByClassName("twitch_previews_previewDiv");
    if (previewDivs.length > 0) {
        for (var i=0;i<previewDivs.length;i++) {
            previewDivs[i].parentNode.removeChild(previewDivs[i]);
        }
    }
    previewDiv = null;

    if (saveToStorage) {
        chrome.storage.sync.set({'isImagePreviewMode': imagePreviewMode}, function() {

        });
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
    if (window.innerHeight - elOffset < PREVIEWDIV_HEIGHT) {
        return elOffset - PREVIEWDIV_HEIGHT - (isNavBarCollapsed? 25:20);
    } else {
        return elOffset;
    }
}

function createAndShowPreview(navCardEl) {
    previewDiv = document.createElement("div");
    previewDiv.classList.add("twitch_previews_previewDiv");
    previewDiv.style.width = PREVIEWDIV_WIDTH + "px";
    previewDiv.style.height = PREVIEWDIV_HEIGHT + "px";
    previewDiv.style.position = "fixed";
    previewDiv.style.marginTop = calculatePreviewDivPosition(navCardEl) + "px";
    previewDiv.style.marginLeft = isNavBarCollapsed? "6rem":"25rem";
    previewDiv.style.zIndex = "9";
    previewDiv.style.backgroundColor = "#232323";
    previewDiv.style.borderRadius = "5px";
    previewDiv.style.boxShadow = "10px 15px 10px -5px rgba(23,23,23,0.75)";
    previewDiv.style.display = "block";

    if (isImagePreviewMode) {
        previewDiv.style.backgroundSize = "cover";
        previewDiv.style.backgroundImage = "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-440x248.jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
        navCardEl.lastImageLoadTimeStamp = new Date().getTime();
    } else {
        twitchIframe = document.createElement("Iframe");
        twitchIframe.src = "https://player.twitch.tv/?channel=" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "&!controls";
        twitchIframe.width = PREVIEWDIV_WIDTH + "px";
        twitchIframe.height = PREVIEWDIV_HEIGHT + "px";
        twitchIframe.borderColor = "#232323";
        twitchIframe.style.borderRadius = "5px";
        previewDiv.appendChild(twitchIframe);
    }

    appendContainer.appendChild(previewDiv);
}

function changeAndShowPreview(navCardEl) {
    if (isImagePreviewMode) {
        if (new Date().getTime() - navCardEl.lastImageLoadTimeStamp > IMAGE_CACHE_TTL_MS) {
            navCardEl.lastImageLoadTimeStamp = new Date().getTime();
            previewDiv.style.backgroundImage = "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-440x248.jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
        } else {
            previewDiv.style.backgroundImage = "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-440x248.jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
        }
    } else {
        if(twitchIframe.src !== "https://player.twitch.tv/?channel=" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "&!controls&muted") {
            twitchIframe.src = "https://player.twitch.tv/?channel=" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "&!controls&muted";
        }
    }
    previewDiv.style.marginTop = calculatePreviewDivPosition(navCardEl) + "px";
    previewDiv.style.marginLeft = isNavBarCollapsed? "6rem":"25rem";
    previewDiv.style.display = "block";
}

function hidePreview() {
    if (twitchIframe) {
        twitchIframe.src = '';
    } else {
        previewDiv.style.backgroundImage = "none";
    }
    previewDiv.style.display = "none";
}

function setMouseOverListeners(navCardEl) {
    navCardEl.onmouseover = function () {
        if (previewDiv) {
            changeAndShowPreview(navCardEl);
        } else {
            createAndShowPreview(navCardEl);
        }
    };
    navCardEl.onmouseleave = function () {
        hidePreview();
    }
}

function setCollapseBtnListener() {
    var sideNavCollapseToggleBtn = document.getElementsByClassName('collapse-toggle')[0];

    sideNavCollapseToggleBtn.onmouseover = function () {
        mutationObserver.disconnect();
    };
    sideNavCollapseToggleBtn.onmouseleave = function () {
        setSideNavMutationObserver();
    };

    sideNavCollapseToggleBtn.onclick = function () {
        setTimeout(function(){
            refreshNavCardsListAndListeners();
            setShowMoreBtnsListeners();
            setSideNavMutationObserver();
        }, 500);
    }
}

function setShowMoreBtnsListeners() {
    var sideNavShowMoreBtns = document.getElementsByClassName('side-nav-show-more-toggle__button');
    for (var i=0;i < sideNavShowMoreBtns.length;i++) {
        if (sideNavShowMoreBtns[i]) {

            sideNavShowMoreBtns[i].onmouseover = function () {
                mutationObserver.disconnect();
            };

            sideNavShowMoreBtns[i].onmouseleave = function () {
              setSideNavMutationObserver();
            };

            sideNavShowMoreBtns[i].onclick = function () {
                setTimeout(function(){
                    refreshNavCardsListAndListeners();
                    setSideNavMutationObserver();
                }, 500);
            }
        }
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
    for (var i = 0; i < navCards.length; i++) {
        navCards[i].lastImageLoadTimeStamp = new Date().getTime();
        setMouseOverListeners(navCards[i]);
    }
}

window.addEventListener('load', (event) => {
    setTimeout(function(){
        appendContainer = document.body;
        setCollapseBtnListener();
        setShowMoreBtnsListeners();
        refreshNavCardsListAndListeners();
        setSideNavMutationObserver();
    }, 2000);
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action === "update_imagePreviewMode") {
        onPreviewModeChange(msg.isImagePreviewMode, true);
    }
});

///////////// TAB RESUME /////////////

window.addEventListener('visibilitychange', function() {
    !document.hidden && pageAwakened();
});

if (window.webkitRequestAnimationFrame && (/^iP/.test(navigator.platform) || /Android/.test(navigator.userAgent))) {
    webkitRequestAnimationFrame(webkitWake);
}

var lastTs;
function webkitWake(timestamp) {
    if ((timestamp - lastTs) > 10000) {
        pageAwakened();
    }
    lastTs = timestamp;
    webkitRequestAnimationFrame(webkitWake);
}

function pageAwakened() {
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
        isImagePreviewMode = true;
    }
}

///////////// END OF TAB RESUME /////////////
