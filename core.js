var isNavBarCollapsed;
var previewDiv = null;
var appendContainer;
var IMAGE_CACHE_TTL_MS = 20000;

function getElementOffset(el) {
    var rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {top: rect.top + scrollTop, left: rect.left + scrollLeft}
}

function createAndShowPreview(navCardEl) {
    previewDiv = document.createElement("div");
    previewDiv.style.width = "440px";
    previewDiv.style.height = "248px";
    previewDiv.style.position = "fixed";
    previewDiv.style.marginTop = (getElementOffset(navCardEl).top + 45) + "px";
    previewDiv.style.marginLeft = isNavBarCollapsed? "6rem":"25rem";
    previewDiv.style.zIndex = "9999999";
    previewDiv.style.backgroundImage = "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-440x248.jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
    previewDiv.style.backgroundSize = "cover";
    previewDiv.style.borderRadius = "5px";
    previewDiv.style.boxShadow = "10px 15px 10px -5px rgba(23,23,23,0.75)";
    previewDiv.style.display = "block";

    navCardEl.lastImageLoadTimeStamp = new Date().getTime();

    appendContainer.appendChild(previewDiv);
}

function changeAndShowPreview(navCardEl) {
    if (new Date().getTime() - navCardEl.lastImageLoadTimeStamp > IMAGE_CACHE_TTL_MS) {
        console.log("refreshing");
        navCardEl.lastImageLoadTimeStamp = new Date().getTime();
        previewDiv.style.backgroundImage = "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-440x248.jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
    } else {
        previewDiv.style.backgroundImage = "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-440x248.jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
    }
   // previewDiv.style.backgroundImage = "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-440x248.jpg?')";
    previewDiv.style.marginTop = (getElementOffset(navCardEl).top + 45) + "px";
    previewDiv.style.marginLeft = isNavBarCollapsed? "6rem":"25rem";
    previewDiv.style.display = "block";
}

function hidePreview() {
    previewDiv.style.display = "none";
    previewDiv.style.backgroundImage = "none";
}

function setMouseOverListeners(navCardEl) {
    navCardEl.onmouseover = function () {
      //  console.log("hover");
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
    sideNavCollapseToggleBtn.onclick = function () {
        setTimeout(function(){
            refreshNavCardsListAndListeners();
            setShowMoreBtnsListeners();
        }, 500);

    }
}

function setShowMoreBtnsListeners() {
    var sideNavShowMoreBtns = document.getElementsByClassName('side-nav-show-more-toggle__button');
    for (var i=0;i < sideNavShowMoreBtns.length;i++) {
        if (sideNavShowMoreBtns[i]) {
            sideNavShowMoreBtns[i].onclick = function () {
                setTimeout(function(){
                    refreshNavCardsListAndListeners();
                }, 500);
            }
        }
    }
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
    appendContainer = document.body;
    setCollapseBtnListener();
    setShowMoreBtnsListeners();
    refreshNavCardsListAndListeners();
});
