// (c) Twitch Previews.
(async () => {

    let isFirefox = typeof browser !== "undefined";
    let _browser = isFirefox ? browser : chrome;
    const _tp_i18n = await import(_browser.runtime.getURL("main/tp_i18n.js"));
    let isAppInit = true;
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
    let bLastChatOpenState = null;
    let isMultiStreamMode = false;
    let multiStream_curr_zIndex = 5000;
    let startMultiStream_name = false;
    let multiStream_layout_presets = [];
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

    function _i18n(name, args) {
        let translation = _tp_i18n.i18n[name][options.selected_lang];
        if (args) {
            args.forEach((arg) => {
                translation = translation.replace('%s', arg);
            })
        }
        return translation;
    }

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

    function isInIframe() {
        return window.top !== window.self && window.top.location.origin === 'https://www.twitch.tv';
    }

    let sideNavMutationObserver = new MutationObserver(function(mutations) {
        if (isHovering || isAppInit) {
            isAppInit = false;
            return;
        }

        let shouldRefresh = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === "childList") {
                shouldRefresh = true;
            }
        });
        if (shouldRefresh){
            if (options.isSidebarPreviewsEnabled) {
                refreshNavCardsListAndListeners();
            }

            if (options.isSidebarHideSectionsEnabled) {
                hideSidebarSections();
            }

            if (options.isSidebarFavoritesEnabled) {
                setSidebarFavorites();
            }

            if (options.isYTsidebarEnabled) {
                setYTsidebar();
            }
        }
    });

    let sideNavMutationObserver_for_bug = new MutationObserver(function(mutations_list) {
        for (let i = 0; i < mutations_list.length; i++) {
            for (let j = 0; j < mutations_list[i].addedNodes.length; j++) {
                if(mutations_list[i].addedNodes[j].classList.contains('side-nav-section')) {

                    if (options.isSidebarPreviewsEnabled) {
                        refreshNavCardsListAndListeners();
                    }

                    if (options.isSidebarHideSectionsEnabled) {
                        hideSidebarSections();
                    }

                    if (options.isSidebarFavoritesEnabled) {
                        setSidebarFavorites();
                    }

                    return;
                }
            }
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

    function setTitleMutationObserver() {
        titleMutationObserver.observe(document.getElementsByTagName('title')[0], {
            childList: true,
            subtree: true
        });
    }

    function setSideNavMutationObserver() {
        if (document.querySelector('.side-nav-section')) {
            sideNavMutationObserver.observe(document.querySelector('.side-nav-section'), {
                childList: true,
                subtree: true
            });
        }
    }

    function setSideNavMutationObserver_for_sidebar_disappearing_followed_bug() {
        if (document.querySelector('.side-nav-section')) {
            sideNavMutationObserver_for_bug.observe(document.querySelector('.side-nav-section').parentNode, {
                childList: true,
                subtree: false
            });
        }
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
        vidPreviewVolBtn.title = _i18n('vidPreviewVolBtn_title');
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
        navCardPipBtn.title = _i18n('navCardPipBtn_title');
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

        createMultiStreamBox(e.target.yt_videoId ? e.target.stream_name:lastHoveredCardEl.href.substr(lastHoveredCardEl.href.lastIndexOf("/") + 1), true, false, false, false, e.target.yt_videoId);
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
        if (window.innerHeight - elOffset < options.PREVIEWDIV_HEIGHT) { // if cuts off bottom
            if (elOffset - options.PREVIEWDIV_HEIGHT - (isNavBarCollapsed? 25:20) < 0) { // if cuts off top too
                return "5rem";
            } else {
                return elOffset - options.PREVIEWDIV_HEIGHT - (isNavBarCollapsed? 25:20) + "px";
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
        if (navCardEl.tp_yt) {
            return "url('" + navCardEl.thumbnail_url + "')";
        } else {
            return "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "-" + options.PREVIEWDIV_WIDTH + "x" + Math.round(options.PREVIEWDIV_HEIGHT) + ".jpg?" + navCardEl.lastImageLoadTimeStamp + "')";
        }
    }

    function getPreviewStreamUrl(navCardEl) {
        if (navCardEl.tp_yt) {
            return "https://www.youtube.com/embed/" + navCardEl.yt_videoId + "?autoplay=1&origin=twitch.tv&controls=0&mute=1";
        } else {
            return "https://player.twitch.tv/?channel=" + navCardEl.href.substr(navCardEl.href.lastIndexOf("/") + 1) + "&parent=twitch.tv&muted=true";

        }
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
    }

    function createAndShowDirectoryPreview() {
        previewDiv = createPreviewDiv(TP_PREVIEW_DIV_CLASSNAME);
        previewDiv.style.position = "absolute";
        previewDiv.style.left = "0px";
        previewDiv.style.top = "0px";
        let calculatedSize = lastHoveredCardEl.getBoundingClientRect();
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
            if (new Date().getTime() - lastHoveredCardEl.lastImageLoadTimeStamp > IMAGE_CACHE_TTL_MS) {
                lastHoveredCardEl.lastImageLoadTimeStamp = new Date().getTime();
            }
            previewDiv.style.backgroundImage = getPreviewImageUrl(lastHoveredCardEl);

            if (options.isImagePreviewMode) {
                if (twitchIframe) { // in case its from directory and user in image mode.
                    twitchIframe.style.display = 'none';
                }
            } else {
                twitchIframe.style.display = 'block';
                twitchIframe.style.visibility = 'hidden';
                setTimeout(function () {
                    twitchIframe.src = getPreviewStreamUrl(lastHoveredCardEl);
                }, 125);

                createAndShowLoadingSpinnerForSideNav();

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
                navCardPipBtn.yt_videoId = null;
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
                    previewDiv.querySelector('.tp-loading').innerText = _i18n('preview_loader_offline_text');
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
                    if (navCardEl.tp_yt && twitchIframe) {
                        previewDiv.style.visibility = "visible";

                        setTimeout(function () {
                            clearLoadingSpinnerFromSideNav();
                            twitchIframe.classList.add('tp-anim-duration-100ms');
                            twitchIframe.classList.add('fadeIn');
                            setTimeout(function () {
                                if (twitchIframe) {
                                    twitchIframe.classList.remove('fadeIn');
                                }
                            },200)

                            twitchIframe.style.visibility = "visible";
                        }, 250);

                        let container = lastHoveredCardEl.querySelector('div[data-a-target="side-nav-live-status"]');
                        if (container) {
                            container.appendChild(navCardPipBtn);
                            navCardPipBtn.yt_videoId = navCardEl.yt_videoId;
                            navCardPipBtn.stream_name = navCardEl.stream_name;
                        }
                        clearInterval(clearOverlaysInterval);
                        clearOverlaysInterval = null;
                    } else {
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
                    }
                }, 100);
            } else {
                if (!isNavBarCollapsed && isHovering) {
                    let container = lastHoveredCardEl.querySelector('div[data-a-target="side-nav-live-status"]');
                    if (container) {
                        container.appendChild(navCardPipBtn);
                        navCardPipBtn.yt_videoId = navCardEl.yt_videoId;
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
        isNavBarCollapsed = !!document.querySelector('.side-nav--collapsed');
        let parentSearchContainer = ancestor || document;
        let navCards;
        if (isNavBarCollapsed) {
            if (parentSearchContainer.querySelector('a.side-nav-card') && parentSearchContainer.querySelector('a.side-nav-card').href){
                navCards = parentSearchContainer.querySelectorAll('a.side-nav-card');
            } else {
                isNavBarCollapsed = false;
                navCards = parentSearchContainer.querySelectorAll('.side-nav-card__link');
            }
        } else {
            navCards = parentSearchContainer.querySelectorAll('.side-nav-card__link');
        }

        return navCards;
    }

    function refreshNavCardsListAndListeners() {
        if (document.getElementById('sideNav')) {
            let navCards = getSidebarNavCards();
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

    function hideSidebarSections() {
        let sidebarContent = document.querySelector('.side-bar-contents');
        if (sidebarContent) {
            let elements = sidebarContent.querySelectorAll('.side-nav-section');
            if (elements.length > 1) {
                for (let i = 1; i < elements.length; i++) {
                    elements[i].className = '';
                    elements[i].style.display = 'none';
                }
            }
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
        let selected_land = "lang_" + options.selected_lang;
        let sidebar_previews = options.isSidebarPreviewsEnabled ? "sBarP_ON":"sBarP_OFF";
        let size = options.PREVIEWDIV_WIDTH + "px";
        let mode = options.isImagePreviewMode ? "Image":"Video";
        let dirp = options.isDirpEnabled ? "dirp_ON":"dirp_OFF";
        let errRefresh = options.isErrRefreshEnabled ? "errRefresh_ON":"errRefresh_OFF";
        let channelPointsClicker = options.isChannelPointsClickerEnabled ? "cpc_ON":"cpc_OFF";
        let sidebarFavorites = options.isSidebarFavoritesEnabled ? "sBarF_ON" : "sBarF_OFF";
        let sidebarFavorites_og = options.sidebarFavorites_hide_originals ? "sBarF_og_ON" : "sBarF_og_OFF";
        let sidebarExtend = options.isSidebarExtendEnabled ? "sBarE_ON" : "sBarE_OFF";
        let sidebarSearch = options.isSidebarSearchEnabled ? "sBarS_ON" : "sBarS_OFF";
        let pvqc = options.isPvqcEnabled ? "pvqc_ON" : "pvqc_OFF";
        let isfScrnWithChatEnabled = options.isfScrnWithChatEnabled ? "fScrnC_ON" : "fScrnC_OFF";
        let predictionsNotifications = options.isPredictionsNotificationsEnabled ? "PN_ON" : "PN_OFF";
        let predictionsSniper = options.isPredictionsSniperEnabled ? "APS_ON" : "APS_OFF";
        let selfPreview = options.isSelfPreviewEnabled ? "SP_ON" : "SP_OFF";
        let multiStream = options.isMultiStreamEnabled ? "multiStream_ON" : "multiStream_OFF";
        let pip_main = options.isPipEnabled ? "pip_ON" : "pip_OFF";
        let screenshot = options.isScreenshotEnabled ? "s_ON" : "s_OFF";
        let fastForward = options.isFastForwardEnabled ? "FF_ON" : "FF_OFF";
        let seek = options.isSeekEnabled ? "seek_ON" : "seek_OFF";
        let flashBangDefender = options.isFlashBangDefenderEnabled ? "fbd_ON" : "fbd_OFF";
        let clip_downloader = options.isClipDownloaderEnabled ? "CDL_ON" : "CDL_OFF";
        let sidebarHideSections = options.isSidebarHideSectionsEnabled ? "sBarHS_ON" : "sBarHS_OFF";
        let muteAutoPlayers = options.isMuteAutoPlayersEnabled ? "mautop_ON" : "mautop_OFF";
        let YTsidebar = options.isYTsidebarEnabled ? "YTSB_ON" : "YTSB_OFF";
        let ave = options.isAdvancedVideoEmbedsEnabled ? "ave_ON" : "ave_OFF";
        let record = options.isRecordEnabled ? "rec_ON" : "rec_OFF";

        sendMessageToBG({action: "appStart", detail: selected_land + " : " + sidebar_previews + " : " + mode + " : " + size + " : " + dirp + " : "
                + channelPointsClicker + " : " + sidebarSearch + " : " + sidebarExtend + " : " + isfScrnWithChatEnabled + " : " + errRefresh
                + " : " + pvqc + " : " + predictionsNotifications + " : " + predictionsSniper + " : " + selfPreview + " : " + multiStream
                + " : " + pip_main + " : " + sidebarFavorites + " : " + sidebarFavorites_og + " : " + screenshot + " : " + flashBangDefender + " : " + fastForward + " : "
                + seek + " : " + clip_downloader + " : " + sidebarHideSections + " : " + muteAutoPlayers + " : " + YTsidebar + " : " + ave + " : " + record});
    }

    function refreshPageOnMainTwitchPlayerError(fullRefresh) {
        sendMessageToBG({action: "bg_errRefresh_exec", detail: ""});

        if (fullRefresh) {
            if (!isInIframe()) {
                location.replace(window.location);
            }
        } else {
            let btn = document.querySelector('.content-overlay-gate__allow-pointers button');
            if (btn) {
                btn.click();
                isMainPlayerError = false;
                setTimeout(function (){
                    let t_player = document.querySelector(".video-player").querySelector('video');
                    if (t_player) {
                        t_player.play();
                        setTimeout(function () {
                            fastForwardFuncExec();
                        }, 100);
                    }
                }, 2000);
                setTimeout(function (){
                    checkForAutoRefresh();
                }, 10000);
            } else {
                if (!document.hidden) {
                    if (!isInIframe()) {
                        location.replace(window.location);
                    }
                } else {
                    isMainPlayerError = true;
                }
            }
        }
    }

    function checkForAutoRefresh() {
        let el = document.querySelector('p[data-test-selector="content-overlay-gate__text"]');
        if (el) {
            if (['1000','2000','3000','4000'].some(x => el.innerText.indexOf(x) >= 0)) {
                refreshPageOnMainTwitchPlayerError();
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

    function setYTsidebar() {
        _browser.runtime.sendMessage({action: "get_YT_live_streams", detail: true}, function(res) {

            let isExperimentalSidebar = !!document.querySelector('.side-nav--hover-exp');

            let followed_channels_section = document.querySelector('.side-nav-section');
            if (followed_channels_section) {
                let yt_section = followed_channels_section.cloneNode(true);
                yt_section.id = 'tp_YTsidebar_section';
                yt_section.classList.remove('side-nav-section');
                yt_section.children[1].innerHTML = '';

                let section_title = yt_section.querySelector('.side-nav-header');
                if (section_title) {
                    let title_figure = section_title.querySelector('figure');
                    if (title_figure) {
                        if(isExperimentalSidebar) {
                            title_figure.innerHTML = '';
                            title_figure.style.width = '20px';
                            title_figure.style.height = '20px';
                            section_title.querySelector('h5').innerText = _i18n('sidebar_yt_channels_section_title');
                        } else {
                            title_figure.title = _i18n('sidebar_yt_channels_title');
                            title_figure.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="21px" width="21px" xmlns="http://www.w3.org/2000/svg">' +
                                    '<path d="M960 509.2c0-2.2 0-4.7-.1-7.6-.1-8.1-.3-17.2-.5-26.9-.8-27.9-2.2-55.7-4.4-81.9-3-36.1-7.4-66.2-13.4-88.8a139.52 139.52 0 0 0-98.3-98.5c-28.3-7.6-83.7-12.3-161.7-15.2-37.1-1.4-76.8-2.3-116.5-2.8-13.9-.2-26.8-.3-38.4-.4h-29.4c-11.6.1-24.5.2-38.4.4-39.7.5-79.4 ' +
                                        '1.4-116.5 2.8-78 3-133.5 7.7-161.7 15.2A139.35 139.35 0 0 0 82.4 304C76.3 326.6 72 356.7 69 392.8c-2.2 26.2-3.6 54-4.4 81.9-.3 9.7-.4 18.8-.5 26.9 0 2.9-.1 5.4-.1 7.6v5.6c0 ' +
                                        '2.2 0 4.7.1 7.6.1 8.1.3 17.2.5 26.9.8 27.9 2.2 55.7 4.4 81.9 3 36.1 7.4 66.2 13.4 88.8 12.8 47.9 50.4 85.7 98.3 98.5 28.2 7.6 83.7 12.3 161.7 15.2 37.1 1.4 76.8 2.3 116.5 2.8 13.9.2 ' +
                                        '26.8.3 38.4.4h29.4c11.6-.1 24.5-.2 38.4-.4 39.7-.5 79.4-1.4 116.5-2.8 78-3 133.5-7.7 161.7-15.2 47.9-12.8 85.5-50.5 98.3-98.5 6.1-22.6 10.4-52.7 13.4-88.8 2.2-26.2 3.6-54 4.4-81.9.3-9.7.4-18.8.5-26.9 0-2.9.1-5.4.1-7.6v-5.6zm-72 5.2c0 2.1 ' +
                                        '0 4.4-.1 7.1-.1 7.8-.3 16.4-.5 25.7-.7 26.6-2.1 53.2-4.2 77.9-2.7 32.2-6.5 58.6-11.2 76.3-6.2 23.1-24.4 41.4-47.4 47.5-21 5.6-73.9 10.1-145.8 12.8-36.4 1.4-75.6 2.3-114.7 2.8-13.7.2-26.4.3-37.8.3h-28.6l-37.8-.3c-39.1-.5-78.2-1.4-114.7-2.8-71.9-2.8-124.9-7.2-145.8-12.8-23-6.' +
                                        '2-41.2-24.4-47.4-47.5-4.7-17.7-8.5-44.1-11.2-76.3-2.1-24.7-3.4-51.3-4.2-77.9-.3-9.3-.4-18-.5-25.7 0-2.7-.1-5.1-.1-7.1v-4.8c0-2.1 0-4.4.1-7.1.1-7.8.3-16.4.5-25.7.7-26.6 2.1-53.2 4.2-77.9 2.7-32.2 6.5-58.6 11.2-76.3 6.2-23.1 24.4-41.4 47.4-47.5 21-5.6 73.9-10.1 145.8-12.8 36.4-1.4 75.6-2.3 ' +
                                        '114.7-2.8 13.7-.2 26.4-.3 37.8-.3h28.6l37.8.3c39.1.5 78.2 1.4 114.7 2.8 71.9 2.8 124.9 7.2 145.8 12.8 23 6.2 41.2 24.4 47.4 47.5 4.7 17.7 8.5 44.1 11.2 76.3 2.1 24.7 3.4 51.3 4.2 77.9.3 9.3.4 18 .5 25.7 0 2.7.1 5.1.1 7.1v4.8zM423 646l232-135-232-133z"></path>' +
                                '</svg>';
                        }
                    } else {
                        section_title.querySelector('h5').innerText = _i18n('sidebar_yt_channels_section_title');
                    }

                    if (yt_section.querySelector('.side-nav-show-more-toggle__button')) {
                        yt_section.querySelector('.side-nav-show-more-toggle__button').remove();
                    }
                }


                if (res.result.length > 0) {
                    let shown_followed_channels = getSidebarNavCards(document.querySelector('.side-nav-section'));

                    if (shown_followed_channels[0]) {
                        for (let i = 0; i < res.result.length; i++) {
                            let navCard = shown_followed_channels[0].cloneNode(true);
                            if (!isNavBarCollapsed) {
                                navCard.querySelector('p[data-a-target="side-nav-title"]').innerText = res.result[i].stream_name;
                                navCard.querySelector('p[data-a-target="side-nav-title"]').title = res.result[i].stream_name;
                                navCard.querySelector('div[data-a-target="side-nav-live-status"]').querySelector('span').innerText = res.result[i].view_count;
                                navCard.querySelector('div[data-a-target="side-nav-game-title"]').querySelector('p').innerText = res.result[i].title;
                                navCard.querySelector('div[data-a-target="side-nav-game-title"]').querySelector('p').title = res.result[i].title;
                            }
                            navCard.querySelector('img.tw-image-avatar').src = res.result[i].profile_pic_url;
                            navCard.title = res.result[i].stream_name + ' - ' + res.result[i].title;

                            navCard.href = "https://www.youtube.com/watch?v=" + res.result[i].videoId;
                            navCard.tp_yt = true;
                            navCard.yt_videoId = res.result[i].videoId;
                            navCard.stream_name = res.result[i].stream_name;
                            navCard.thumbnail_url = res.result[i].thumbnail_url;
                            navCard.onclick = (e) => {
                                e.preventDefault();
                                e.cancelBubble = true;
                                sendMessageToBG({action: "bg_open_YT_stream", detail: "https://www.youtube.com/watch?v=" + res.result[i].videoId});
                            }
                            let container_div = document.createElement('div');
                            container_div.appendChild(navCard);
                            yt_section.children[1].appendChild(container_div);
                        }
                    }
                }

                if(!isExperimentalSidebar) {
                    if (!yt_section.children[1].firstChild && !isNavBarCollapsed) {
                        let div = document.createElement('div');
                        div.innerText = 'No live youtubers';
                        div.style.padding = '0px 10px 5px 10px';
                        div.style.color = 'grey';
                        yt_section.children[1].appendChild(div);
                    }
                }


                let old_yt_section = document.getElementById('tp_YTsidebar_section');
                if (old_yt_section) {
                    old_yt_section.parentNode.replaceChild(yt_section, old_yt_section);
                } else {
                    let favorites_section = document.getElementById('tp_favorites_section');
                    if (favorites_section) {
                        favorites_section.after(yt_section);
                    } else {
                        followed_channels_section.parentNode.prepend(yt_section);
                    }
                }

                if(options.isSidebarPreviewsEnabled) {
                    refreshNavCardsListAndListeners();
                }
                if(options.isSidebarSearchEnabled) {
                    showSidebarSearchBtn();
                }

            }
        })
    }

    function getStreamIndexInFavorites(stream_name, arr) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === stream_name) {
                return i;
            }
        }
        return -1;
    }

    function setFavoritesBtnIcon(btn, isFavorite) {
        if (isFavorite) {
            btn.querySelector('figure').innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 0 0 .6 45.3l183.7 179.1-43.4 ' +
                    '252.9a31.95 31.95 0 0 0 46.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3z"></path>' +
                '</svg>';
        } else {
            btn.querySelector('figure').innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 0 0 .6 45.3l183.7 179.1-43.4 ' +
                '252.9a31.95 31.95 0 0 0 46.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3zM664.8 561.6l36.1 ' +
                '210.3L512 672.7 323.1 772l36.1-210.3-152.8-149L417.6 382 512 190.7 606.4 382l211.2 30.7-152.8 148.9z"></path></svg>';
        }
    }

    function updateFavoritesBtnIcon(favorites_btn) {
        _browser.storage.local.get('favorites_arr', function (res) {
            let curr_stream_name = document.querySelector('.channel-info-content').querySelector('a').href.split('/').pop();
            let isFavorite = false;
            if (res.favorites_arr) {
                if (getStreamIndexInFavorites(curr_stream_name, res.favorites_arr) !== -1) {
                    isFavorite = true;
                }
            }
            setFavoritesBtnIcon(favorites_btn, isFavorite);
        });
    }

    function appendFavoritesBtn() {
        let tp_favorites_btn = document.getElementById('tp_favorites_btn');
        if (tp_favorites_btn) {
            if (!document.querySelector('.channel-info-content')) {
                tp_favorites_btn.remove();
            } else {
                updateFavoritesBtnIcon(tp_favorites_btn);
            }
            return;
        }

        if (!document.querySelector('.channel-info-content')) {
            return;
        }
        try {
            let bell_btn = document.querySelector('.live-notifications__btn');
            if(bell_btn) {
                let favorites_btn = bell_btn.cloneNode(true);
                favorites_btn.id = 'tp_favorites_btn';
                favorites_btn.style.margin = '0 0px 0 10px';
                favorites_btn.title = _i18n('favorites_btn_title');
                favorites_btn.querySelector('button').removeAttribute('disabled');

                updateFavoritesBtnIcon(favorites_btn);

                favorites_btn.onclick = function (e) {
                    _browser.storage.local.get('favorites_arr', function (res) {
                        let curr_stream_name = document.querySelector('.channel-info-content').querySelector('a').href.split('/').pop();
                        if (res.favorites_arr) {
                            let item_index = getStreamIndexInFavorites(curr_stream_name, res.favorites_arr)
                            if (item_index !== -1) {
                                res.favorites_arr.splice(item_index, 1);
                                _browser.storage.local.set({'favorites_arr': res.favorites_arr}, function() {

                                });
                                setFavoritesBtnIcon(favorites_btn, false);
                                sendMessageToBG({action: "bg_favorite_btn_click", detail: false});
                            } else {
                                res.favorites_arr.push(curr_stream_name);
                                _browser.storage.local.set({'favorites_arr': res.favorites_arr}, function() {

                                });
                                setFavoritesBtnIcon(favorites_btn, true);
                                sendMessageToBG({action: "bg_favorite_btn_click", detail: true});
                            }
                        } else {
                            _browser.storage.local.set({'favorites_arr': [curr_stream_name]}, function() {

                            });
                            setFavoritesBtnIcon(favorites_btn, true);
                            sendMessageToBG({action: "bg_favorite_btn_click", detail: true});
                        }
                        setSidebarFavorites();
                    })
                }

                bell_btn.parentNode.parentNode.parentNode.append(favorites_btn);
            }
        } catch (e) {

        }
    }

    function setSidebarFavorites() {
        _browser.storage.local.get('favorites_arr',function (res) {

            let isExperimentalSidebar = !!document.querySelector('.side-nav--hover-exp');

            let followed_channels_section = document.querySelector('.side-nav-section');
            if (followed_channels_section) {
                let favorites_section = followed_channels_section.cloneNode(true);
                favorites_section.id = 'tp_favorites_section';
                favorites_section.classList.remove('side-nav-section');
                favorites_section.children[1].innerHTML = '';

                let section_title = favorites_section.querySelector('.side-nav-header');
                if (section_title) {
                    let title_figure = section_title.querySelector('figure');
                    if (title_figure) {
                        if(isExperimentalSidebar) {
                            title_figure.innerHTML = '';
                            title_figure.style.width = '20px';
                            title_figure.style.height = '20px';
                            section_title.querySelector('h5').innerText = _i18n('sidebar_favorite_channels_section_title');
                        } else {
                            title_figure.title = _i18n('sidebar_favorite_channels_title');
                            title_figure.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">' +
                                    '<path d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 0 0 .6 45.3l183.7 ' +
                                    '179.1-43.4 252.9a31.95 31.95 0 0 0 46.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3zM664.8 ' +
                                    '561.6l36.1 210.3L512 672.7 323.1 772l36.1-210.3-152.8-149L417.6 382 512 190.7 606.4 382l211.2 30.7-152.8 148.9z"></path>' +
                                '</svg>';
                        }
                    } else {
                        section_title.querySelector('h5').innerText = _i18n('sidebar_favorite_channels_section_title');
                    }

                    if (favorites_section.querySelector('.side-nav-show-more-toggle__button')) {
                        favorites_section.querySelector('.side-nav-show-more-toggle__button').remove();
                    }
                }

                extendSidebar().then(function (promise_result) {
                    if (res.favorites_arr) {
                        let shown_followed_channels = getSidebarNavCards(document.querySelector('.side-nav-section'));
                        for (let i = 0; i < shown_followed_channels.length; i++) {
                            for (let j = 0; j < res.favorites_arr.length; j++) {
                                if (shown_followed_channels[i].href.split('/').pop() === res.favorites_arr[j]) {
                                    if (isStreamerOnline(shown_followed_channels[i])) {
                                        let el = shown_followed_channels[i].cloneNode(true);
                                        el.title = el.href.split('/').pop();
                                        el.onclick = (e) => {
                                            e.preventDefault();
                                            window.history.replaceState({},'','/' + el.title);
                                            window.location.href = '#';
                                        }
                                        let container_div = document.createElement('div');
                                        container_div.appendChild(el);
                                        favorites_section.children[1].appendChild(container_div);
                                        if (options.sidebarFavorites_hide_originals) {
                                            shown_followed_channels[i].parentNode.style.display = 'none';
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }

                    if(!isExperimentalSidebar) {
                        if (!favorites_section.children[1].firstChild && !isNavBarCollapsed) {
                            let div = document.createElement('div');
                            div.innerText = _i18n('sidebar_favorite_no_live_favorites');
                            div.style.padding = '0px 10px 5px 10px';
                            div.style.color = 'grey';
                            favorites_section.children[1].appendChild(div);
                        }
                    }


                    let old_favorites_section = document.getElementById('tp_favorites_section');
                    if (old_favorites_section) {
                        old_favorites_section.parentNode.replaceChild(favorites_section, old_favorites_section);
                    } else {
                        followed_channels_section.parentNode.prepend(favorites_section);
                    }

                    if(options.isSidebarPreviewsEnabled) {
                        refreshNavCardsListAndListeners();
                    }
                    if(options.isSidebarSearchEnabled) {
                        showSidebarSearchBtn();
                    }
                });
            }
        })
    }

    function extendSidebarSection(sideNavSection) {
        if(sideNavSection) {
            if (sideNavSection.querySelector('button[data-a-target="side-nav-show-more-button"]')) {
                sideNavSection.querySelector('button[data-a-target="side-nav-show-more-button"]').click();
            }
        }
    }

    function extendSidebar() {
        return new Promise((resolve, reject) => {
            if (!isNavBarCollapsed) {
                let sideNavSections = document.querySelectorAll('.side-nav-section');
                if(sideNavSections[0]) {
                    let navCards = getSidebarNavCards(sideNavSections[0]);
                    if (isStreamerOnline(navCards[navCards.length - 1])) {
                        extendSidebarSection(sideNavSections[0]);
                        if (timesExtendedSidebar < 15) {
                            timesExtendedSidebar++;
                            setTimeout(function (){
                                extendSidebar().then(function (res) {});
                            },300);
                        } else {
                            timesExtendedSidebar = 0;
                            extendSidebarSection(sideNavSections[1]);
                            extendSidebarSection(sideNavSections[2]);
                            resolve('done');
                        }
                    } else {
                        timesExtendedSidebar = 0;
                        extendSidebarSection(sideNavSections[1]);
                        extendSidebarSection(sideNavSections[2]);
                        resolve('done');
                    }
                } else {
                    resolve('done');
                }
            } else {
                resolve('done');
            }
        })

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
        search_input.placeholder = _i18n('sidebar_search_input_placeholder');
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
        extendSidebar().then(function (res) {});
        sendMessageToBG({action: "bg_sBarS_btn_click", detail: true});
    }

    function createSideBarSearchBtn() {
        let search_btn = document.createElement("div");
        search_btn.id = "tp_sidebar_search_btn";
        search_btn.classList.add('tp-sidebar-search-btn');
        search_btn.style.backgroundImage = "url('" + getRuntimeUrl('../images/tp_sidebar_search.png') + "')";
        isLayoutHorizontallyInverted ? search_btn.style.left = "4rem" : search_btn.style.right = "4rem";
        search_btn.title = _i18n('sidebar_search_btn_title');
        search_btn.onclick = sidebarSearchBtnClick;

        return search_btn;
    }

    function showSidebarSearchBtn() {
        if (document.getElementById('tp_sidebar_search_btn')) {
            return;
        }

        if (!isNavBarCollapsed) {
            let sidenav_content = document.querySelector('.side-nav-header');
            if (sidenav_content) {
                sidenav_content.appendChild(createSideBarSearchBtn());
            }
        }
    }

    function checkForTwitchClipsPermissions(featureName) {
        _browser.runtime.sendMessage({action: "check_permission_clip.twitch.tv", detail: true}, function(response) {
            if (response.result === 'granted') {
                sendMessageToBG({action: 'setListenersForCd', detail: true})
                changeFeatureMode(featureName, true);
            } else {
                changeFeatureMode(featureName, false);
                settings_clipDownloader_cb_off();
                sendMessageToBG({action: 'removeListenersForCd', detail: true})
            }
        });
    }

    function checkForYTPermissions(featureName) {
        _browser.runtime.sendMessage({action: "check_permission_YT", detail: true}, function(response) {
            if (response.result === 'granted') {
                changeFeatureMode(featureName, true);
            } else {
                changeFeatureMode(featureName, false);
                settings_YTsidebar_cb_off();
            }
        });
    }

    function checkForTwitchNotificationsPermissions(featureName) {
        if (Notification.permission !== "granted") {
            Notification.requestPermission().then(function (res){
                if (res === "denied") {
                    if(isFirefox) {
                        alert(_i18n('aps_notification_denied_alert_text'));
                    }
                    settings_predictionsNotifications_cb_off();
                    return;
                }
                sendMessageToBG({action: "bg_update_" + featureName, detail: true});
                onSettingChange(featureName, true);
                showNotification(_i18n('app_name'), _i18n('aps_notification_enabled_notif_text'), getRuntimeUrl('../images/TP96.png'), true);
            },function (err) {
                settings_predictionsNotifications_cb_off();
                onSettingChange(featureName, false);
            });
        } else {
            sendMessageToBG({action: "bg_update_" + featureName, detail: true});
            onSettingChange(featureName, true);
            showNotification(_i18n('app_name'), _i18n('aps_notification_enabled_notif_text'), getRuntimeUrl('../images/TP96.png'), true);
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
                                    showNotification(curr_streamer + ": " + _i18n('aps_prediction_started_notif_text') + "\n",  prediction_text + "\n" + _i18n('aps_sniper_active_notif_text'), curr_streamer_img_url);
                                }
                            }
                        },function (res){
                            if (options.isPredictionsNotificationsEnabled) {
                                if (res === 'prediction_closed_or_ended') {
                                    showNotification(curr_streamer + ": " + _i18n('aps_prediction_closed_or_ended_notif_text') + "\n", prediction_text + "\n" + _i18n('aps_prediction_closed_before_exec_notif_text'), curr_streamer_img_url);
                                } else {
                                    initAutoPredictionsSniper(curr_stream_aps_settings, should_bet_now).then(function (res) {
                                        if (!should_bet_now) {
                                            showNotification(curr_streamer + ": " + _i18n('aps_prediction_started_notif_text') + "\n", prediction_text + "\n" + _i18n('aps_sniper_active_notif_text'), curr_streamer_img_url);
                                        }
                                    }, function (res){
                                        if (res === 'prediction_closed_or_ended') {
                                            showNotification(curr_streamer + ": " + _i18n('aps_prediction_closed_or_ended_notif_text') + "\n", prediction_text + "\n" + _i18n('aps_prediction_closed_before_exec_notif_text'), curr_streamer_img_url);
                                        } else {
                                            showNotification(curr_streamer + ": " + _i18n('aps_prediction_closed_or_ended_notif_text') + "\n", "Predictions sniper failed to monitor / join prediction, try refreshing the page if prediction still active", curr_streamer_img_url);
                                        }
                                    })
                                }
                            }
                        });
                    });
                } else {
                    if(options.isPredictionsNotificationsEnabled) {
                        showNotification(curr_streamer + ": " + _i18n('aps_prediction_started_notif_text') + "\n", prediction_text, curr_streamer_img_url);
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
                                extraText = '\n' + _i18n('aps_prediction_closed_before_exec_notif_text');
                                APS_awaiting_to_place_bet_streamName = null;
                            }

                            if (APS_didnt_vote_reason_margin_percent) {
                                extraText = "\n" + _i18n('aps_sniper_didnt_vote_notif_text') + APS_didnt_vote_reason_margin_percent;
                                APS_didnt_vote_reason_margin_percent = null;
                            }


                            switch(res.prediction_status) {
                                case "ended":
                                    showNotification(curr_streamer + ": " + _i18n('aps_prediction_ended_notif_text'), (res.prediction_question_answer_str ? res.prediction_question_answer_str : prediction_text) + "\n" + res.text1, curr_streamer_img_url);
                                   // showNotification(curr_streamer + ": " + "Prediction Ended", prediction_text + "\n" + res.text1, curr_streamer_img_url);
                                    break;
                                case "closed":
                                    showNotification(curr_streamer + ": " + _i18n('aps_prediction_closed_notif_text'), (res.prediction_title_and_options_str ? res.prediction_title_and_options_str : prediction_text) + "\n" + res.text1 + extraText, curr_streamer_img_url);
                                    break;
                                case "unknown":
                                    showNotification(curr_streamer + ": " + _i18n('aps_prediction_closed_or_ended_notif_text'), prediction_text + extraText, curr_streamer_img_url);
                                    break;
                                default:
                                    showNotification(curr_streamer + ": " + _i18n('aps_prediction_closed_or_ended_notif_text'), prediction_text + extraText, curr_streamer_img_url);
                                    break;
                            }
                        }
                    });
                } else {
                    if (options.isPredictionsNotificationsEnabled) {
                        showNotification(curr_streamer + ": " + _i18n('aps_prediction_closed_or_ended_notif_text'), prediction_text, curr_streamer_img_url);
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
        // consider multilang - display name might be different than url.
        try {
            return document.getElementsByClassName('channel-info-content')[0].getElementsByTagName('a')[1].innerText;
        } catch (e) {
            return window.location.pathname.substring(1);
        }
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

                                                            showNotification(curr_streamer + ": " + _i18n('aps_sniper_voted_title_notif_text') + "\n", _i18n('aps_sniper_voted_body_notif_text', [prediction_question, prediction_options_str, sniper_selection_str, prediction_bet_amount]), curr_streamer_img_url, true);
                                                            //showNotification(curr_streamer + ": " + "Sniper voted!\n", prediction_question + " " + prediction_options_str + '\nSniper voted "' + sniper_selection_str + '" with ' + prediction_bet_amount + " points!", curr_streamer_img_url, true);
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

    function fScrnWithChat_backToFullscreen_callback(e) {
        if (document.fullscreenElement) {
            enter_fScrnWithChat();
        }
    }

    function add_fScrnWithChat_backToFullscreen_callback() {
        document.querySelector('.video-player__container').addEventListener("fullscreenchange", fScrnWithChat_backToFullscreen_callback);
    }

    function remove_fScrnWithChat_backToFullscreen_callback() {
        document.querySelector('.video-player__container').removeEventListener("fullscreenchange", fScrnWithChat_backToFullscreen_callback);
    }

    function enter_fScrnWithChat(dontCreateBox) {
        document.querySelector('.video-player__container').addEventListener("fullscreenchange", fScrnWithChat_exitFullScreen_callback);
        if (!dontCreateBox) {
            createMultiStreamBox(window.location.pathname.substring(1), true, true, true, false, false);
        }
        hasEnteredFScreenWithChat = true;
        sendMessageToBG({action: "bg_fScrnWithChat_started", detail: 'custom'});
    }

    function exit_fScrnWithChat() {
        document.querySelector('.video-player__container').removeEventListener("fullscreenchange", fScrnWithChat_exitFullScreen_callback);
        clearExistingPreviewDivs('tp-multi-stream-fScrnWithChat', true);
        hasEnteredFScreenWithChat = false;
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
            exit_fScrnWithChat_default();
        }
    }

    function fScrnFuncBlock(e) {
        e.preventDefault();
        e.cancelBubble = true;
        exit_fScrnWithChat_default();
    }

    function set_FScreenFuncBlock() {
        document.querySelector('div[data-a-target="player-overlay-click-handler"]').addEventListener("dblclick", fScrnFuncBlock);
        document.querySelector('button[data-a-target="player-fullscreen-button"]').addEventListener("click", fScrnFuncBlock);
    }

    function remove_FScreenFuncBlock() {
        document.querySelector('div[data-a-target="player-overlay-click-handler"]').removeEventListener("dblclick", fScrnFuncBlock);
        document.querySelector('button[data-a-target="player-fullscreen-button"]').removeEventListener("click", fScrnFuncBlock);
    }

    function enter_fScrnWithChat_default() {
        bLastChatOpenState = document.getElementsByClassName('toggle-visibility__right-column--expanded').length > 0;
        setChatOpenMode(true);
        setTheatreMode(true);
        document.addEventListener("keydown", fScreenWithChatESC_callback);
        hasEnteredFScreenWithChat = true;
        toggleBrowserFullScreen(document.body);
        set_FScreenFuncBlock();
        sendMessageToBG({action: "bg_fScrnWithChat_started", detail: 'default'});
    }

    function exit_fScrnWithChat_default() {
        hasEnteredFScreenWithChat = false;
        setTheatreMode(false);
        setChatOpenMode(bLastChatOpenState);
        document.removeEventListener("keydown", fScreenWithChatESC_callback);
        toggleBrowserFullScreen(document.body);
        remove_FScreenFuncBlock();
    }

    function toggle_fScrnWithChat(mode) {
        if (mode === "default") {
            if (hasEnteredFScreenWithChat) {
                exit_fScrnWithChat_default();
            } else {
                enter_fScrnWithChat_default();
            }
        } else {
            if (hasEnteredFScreenWithChat) {
                clickFullscreen();
                exit_fScrnWithChat();
            } else {
                enter_fScrnWithChat(true);
                if (!document.fullscreenElement) {
                    clickFullscreen();
                }
            }
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
                btn_container.title = _i18n('fScrnWithChat_btn_title');

                let ttv_theater_mode_btn_size = ttv_theater_mode_btn.getBoundingClientRect();
                btn_container.style.width = (ttv_theater_mode_btn_size.width || "30") + "px";
                btn_container.style.height = (ttv_theater_mode_btn_size.height || "30") + "px";
                btn_container.style.zIndex = "1";

                let img = document.createElement('img');
                img.src = getRuntimeUrl('../images/fScrnWithChat_main.png');
                img.width = (ttv_theater_mode_btn_size.width || "30") * 0.7;
                img.height = (ttv_theater_mode_btn_size.height || "30") * 0.7;
                img.style.margin = "auto";


                let menu_div = document.createElement('div');
                menu_div.classList.add('tp-fScrnWithChat-menu-div');
                menu_div.classList.add('animated');
                menu_div.classList.add('fadeIn');

                let custom_chat_btn = document.createElement('div');
                custom_chat_btn.style.backgroundImage = "url(" + getRuntimeUrl('../images/fScrnWithChat_custom.png') + ")";
                custom_chat_btn.style.marginRight = "2px";
                custom_chat_btn.title = _i18n('fScrnWithChat_custom_chat_btn_title');

                let default_chat_btn = document.createElement('div');
                default_chat_btn.style.backgroundImage = "url(" + getRuntimeUrl('../images/fScrnWithChat_default.png') + ")";
                default_chat_btn.style.backgroundSize = "60%";
                default_chat_btn.title = _i18n('fScrnWithChat_default_chat_btn_title');

                let selected_mode = '';

                custom_chat_btn.onclick = function (e){
                    e.preventDefault();
                    e.cancelBubble = true;
                    selected_mode = 'custom';
                    if (document.fullscreenElement) {
                        document.exitFullscreen().then(() => {
                            setTimeout(function () {
                                add_fScrnWithChat_backToFullscreen_callback();
                                toggle_fScrnWithChat(selected_mode);
                            }, 500);
                        })
                    } else {
                        add_fScrnWithChat_backToFullscreen_callback();
                        toggle_fScrnWithChat(selected_mode);
                    }

                }
                default_chat_btn.onclick = function (e){
                    e.preventDefault();
                    e.cancelBubble = true;
                    selected_mode = 'default';
                    if (document.fullscreenElement) {
                        document.exitFullscreen().then(() => {
                            setTimeout(function () {
                                toggle_fScrnWithChat(selected_mode);
                            }, 500);
                        })
                    } else {
                        toggle_fScrnWithChat(selected_mode);
                    }

                }

                menu_div.appendChild(custom_chat_btn);
                if (!isInIframe()) {
                    menu_div.appendChild(default_chat_btn);
                } else {
                    menu_div.style.width = '50px';
                    custom_chat_btn.style.marginRight = '0';
                }

                btn_container.onclick = function (e){
                    e.preventDefault();
                    e.cancelBubble = true;

                    if (hasEnteredFScreenWithChat) {
                        toggle_fScrnWithChat(selected_mode);
                        remove_fScrnWithChat_backToFullscreen_callback();
                        return;
                    }
                    if (menu_div.style.display === "none") {
                        menu_div.style.display = "flex";
                    } else {
                        menu_div.style.display = "none";
                    }
                }

                btn_container.onmouseenter = function (){
                    if (!hasEnteredFScreenWithChat) {
                        menu_div.style.display = "flex";
                    }
                }

                btn_container.onmouseleave = function (){
                    menu_div.style.display = "none";
                }




                btn_container.appendChild(img);
                btn_container.appendChild(menu_div);
                ttv_theater_mode_btn.parentNode.before(btn_container);
            }
        } catch (e) {

        }
    }

    function addSeekOverlay(left, isEnd) {
        let seekSeconds = isInIframe() ? 1.5 : 5;
        let container = document.createElement('div');
        container.classList.add('tp_seek_indication');
        if (left) {
            if(isEnd) {
                container.innerHTML = "<div style='margin-left: 10%;' >" +
                    "<svg stroke=\"currentColor\" fill=\"none\" stroke-width=\"0\" viewBox=\"0 0 24 24\" height=\"50px\" width=\"50px\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2 7H5V17H2V7Z\" fill=\"currentColor\"></path><path d=\"M6 12L13.0023 7.00003V17L6 12Z\" fill=\"currentColor\"></path><path d=\"M21.0023 7.00003L14 12L21.0023 17V7.00003Z\" fill=\"currentColor\"></path></svg>" +
                    "<div>" + _i18n('seek_indication_end_text') + "</div>" +
                    "</div>"
            } else {
                container.innerHTML = "<div style='margin-left: 10%;' >" +
                    "<svg stroke=\"currentColor\" fill=\"currentColor\" stroke-width=\"0\" viewBox=\"0 0 24 24\" height=\"50px\" width=\"50px\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10c5.514,0,10-4.486,10-10S17.514,2,12,2z M12,20c-4.411,0-8-3.589-8-8 s3.589-8,8-8s8,3.589,8,8S16.411,20,12,20z\"></path><path d=\"M11 16L11 8 6 12zM17 16L17 8 12 12z\"></path></svg>" +
                    "<div>" + seekSeconds + " " + _i18n('seek_indication_seconds_text') + "</div>" +
                    "</div>"
            }
        } else {
            if(isEnd) {
                container.innerHTML = "<div style='margin-right: 10%;' >" +
                    "<svg stroke=\"currentColor\" fill=\"none\" stroke-width=\"0\" viewBox=\"0 0 24 24\" height=\"50px\" width=\"50px\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21.0023 17H18.0023V7H21.0023V17Z\" fill=\"currentColor\"></path><path d=\"M17.0023 12L10 17V7L17.0023 12Z\" fill=\"currentColor\"></path><path d=\"M2 17L9.00232 12L2 7V17Z\" fill=\"currentColor\"></path></svg>" +
                    "<div>" + _i18n('seek_indication_end_text') + "</div>" +
                    "</div>"
            } else {
                container.innerHTML = "<div style='margin-right: 10%;' >" +
                    "<svg stroke=\"currentColor\" fill=\"currentColor\" stroke-width=\"0\" viewBox=\"0 0 24 24\" height=\"50px\" width=\"50px\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.514,2,12,2z M12,20c-4.411,0-8-3.589-8-8s3.589-8,8-8 s8,3.589,8,8S16.411,20,12,20z\"></path><path d=\"M13 16L18 12 13 8zM7 16L12 12 7 8z\"></path></svg>" +
                    "<div>" + seekSeconds + " " + _i18n('seek_indication_seconds_text') + "</div>" +
                    "</div>"
            }
        }

        document.querySelector('.video-player__container').querySelector('video').parentNode.appendChild(container);
        setTimeout(()=>{
            container.remove();
        }, 500);
    }

    function seekVideo(left) {
        let video = document.querySelector('video');
        if (!video) {
            return;
        }
        if (video.buffered.length === 0) {
            return;
        }

        let seekSeconds = isInIframe() ? 1.5 : 5;

        if (left) {
            if (video.currentTime - seekSeconds < video.buffered.start(0)) {
                video.currentTime = video.buffered.start(0) + 1.2;
                addSeekOverlay(left, true);
            } else {
                video.currentTime-= seekSeconds;
                addSeekOverlay(left, false);
            }
        } else {
            if (video.currentTime + seekSeconds >= video.buffered.end(video.buffered.length - 1)) {
                video.currentTime = video.buffered.end(video.buffered.length - 1) - 1.2;
                addSeekOverlay(left, true);
            } else {
                video.currentTime+= seekSeconds;
                addSeekOverlay(left, false);
            }
        }
    }

    function setSeekListeners() {
        if (document.body.attributes.tp_seek_listener) {
            return;
        }

        document.body.setAttribute("tp_seek_listener", 'true');
        document.body.addEventListener('keydown', function(event) {
            if (event.target.tagName.toUpperCase() === 'INPUT' || event.target.tagName.toUpperCase() === 'TEXTAREA') {
                return;
            }

            if (window.location.pathname.indexOf('/videos/') > -1 || window.location.pathname.indexOf('/clip/') > -1) {
                return;
            }

            switch (event.key) {
                case "ArrowLeft":
                    seekVideo(true);
                    break;
                case "ArrowRight":
                    seekVideo(false);
                    break;
            }
        });
    }

    function append_clearChat_btn() {
        if (document.getElementById('tp_clearChat_btn')) {
            return;
        }
        let chat_settings_btn = document.querySelector('button[data-a-target="chat-settings"]');
        if (chat_settings_btn) {
            let btn_container = document.createElement('div');
            btn_container.id = "tp_clearChat_btn";
            btn_container.classList.add('tp-under-chat-btn');
            btn_container.title = _i18n('clear_chat_btn_title');

            let chat_settings_btn_size = chat_settings_btn.getBoundingClientRect();
            btn_container.style.width = (chat_settings_btn_size.width || "30") + "px";
            btn_container.style.height = (chat_settings_btn_size.height || "30") + "px";
            btn_container.style.zIndex = "1";
            btn_container.style.padding =  "2% 2% 0 2%";

            btn_container.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="0" viewBox="0 0 24 24" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg" >' +
                    '<path d="M15.9644 4.63379H3.96442V6.63379H15.9644V4.63379Z" fill="currentColor"></path>' +
                    '<path d="M15.9644 8.63379H3.96442V10.6338H15.9644V8.63379Z" fill="currentColor"></path>' +
                    '<path d="M3.96442 12.6338H11.9644V14.6338H3.96442V12.6338Z" fill="currentColor"></path>' +
                    '<path d="M12.9645 13.7093L14.3787 12.295L16.5 14.4163L18.6213 12.2951L20.0355 13.7093L17.9142 15.8305L20.0356 17.9519L18.6214 19.3661L16.5 17.2447L14.3786 19.3661L12.9644 17.9519L15.0858 15.8305L12.9645 13.7093Z" fill="currentColor"></path>' +
                '</svg>';

            btn_container.onclick = function (){
                let chats = document.querySelector('.chat-scrollable-area__message-container').children;
                for (let i = 1; i < chats.length; i++) {
                    chats[i].style.display = "none";
                }
            }

            try {
                chat_settings_btn.parentNode.parentNode.before(btn_container);
            } catch (e) {

            }
        }
    }

    function append_incognitoChat_btn() {
        setTimeout(function () {
            let streamChatElement = document.querySelector('.stream-chat');
            if (!streamChatElement) {
                return;
            }

            if (!streamChatElement.querySelector('p[data-test-selector="current-user-banned-text"]')) {
                if (document.getElementById('tp_incognitoChat_btn')) {
                    document.getElementById('tp_incognitoChat_btn').remove();
                }
                return;
            }

            if (document.getElementById('tp_incognitoChat_btn')) {
                return;
            }

            let chat_settings_btn = streamChatElement.querySelector('button[data-a-target="chat-settings"]');
            if (chat_settings_btn) {
                let btn_container = document.createElement('div');
                btn_container.id = "tp_incognitoChat_btn";
                btn_container.classList.add('tp-under-chat-btn');
                btn_container.title = _i18n('incognito_chat_btn_title');

                let chat_settings_btn_size = chat_settings_btn.getBoundingClientRect();
                btn_container.style.width = (chat_settings_btn_size.width || "30") + "px";
                btn_container.style.height = (chat_settings_btn_size.height || "30") + "px";
                btn_container.style.zIndex = "1";
                btn_container.style.padding =  "2% 2% 0 2%";

                btn_container.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="-3 -3 22 22" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1H2zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 ' +
                    '2 0 0 1-2-2V2a2 2 0 0 1 2-2h12z"></path><path d="M5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"></path>' +
                    '</svg>';

                btn_container.onclick = function (){
                    let right_column_rect = document.querySelector('.channel-root__right-column').getBoundingClientRect();
                    let obj = {};
                    obj.stream_name = window.location.pathname.substring(1);
                    obj.height = right_column_rect.height + 8;
                    obj.width = right_column_rect.width + 12;
                    obj.top = 125;
                    obj.left = right_column_rect.left + 5;

                    sendMessageToBG({action: "bg_incognito_chat_btn_click", detail: obj});
                }

                try {
                    chat_settings_btn.parentNode.parentNode.before(btn_container);
                } catch (e) {

                }
            }
        }, 2500);
    }

    function muteAutoplayingVideoElements() {
        let videoContainer = document.querySelector('div[data-a-target="video-player"]');
        if (videoContainer) {
            let attr = videoContainer.getAttribute('data-a-player-type');
            if (attr && (attr === 'frontpage' || attr === 'channel_home_carousel')) {
                videoContainer.querySelector('video').muted = true;
            }
        }
    }

    function fastForwardFuncExec() {
        try {
            let video = document.querySelector('video');
            video.currentTime = video.buffered.end(video.buffered.length - 1);
        } catch (e) {

        }
    }

    function appendFastForwardBtn() {
        let btn = document.getElementById('tp_fast_forward_btn');
        if (btn) {
            if (btn.previousSibling) {
                return;
            }
            btn.remove();
        }
        try {
            let ttv_fullscreen_btn = document.querySelector('button[data-a-target="player-fullscreen-button"]');
            if (ttv_fullscreen_btn) {
                let btn_container = document.createElement('div');
                btn_container.id = "tp_fast_forward_btn";
                btn_container.classList.add('tp-player-control');
                btn_container.title = _i18n('fast_forward_btn_title');

                let ttv_fullscreen_btn_size = ttv_fullscreen_btn.getBoundingClientRect();
                btn_container.style.width = (ttv_fullscreen_btn_size.width || "30") + "px";
                btn_container.style.height = (ttv_fullscreen_btn_size.height || "30") + "px";
                btn_container.style.zIndex = "1";

                btn_container.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg" style="padding: 5%;">' +
                    '<path d="M825.8 498L538.4 249.9c-10.7-9.2-26.4-.9-26.4 14v496.3c0 14.9 15.7 23.2 26.4 14L825.8 526c8.3-7.2 8.3-20.8 0-28zm-320 0L218.4 249.9c-10.7-9.2-26.4-.9-26.4 14v496.3c0 14.9 15.7 23.2 26.4 ' +
                    '14L505.8 526c4.1-3.6 6.2-8.8 6.2-14 0-5.2-2.1-10.4-6.2-14z"></path>' +
                    '</svg>';

                btn_container.onclick = function (){
                    fastForwardFuncExec();
                }

                document.querySelector('.player-controls__left-control-group').children[0].after(btn_container);
            }
        } catch (e) {

        }
    }

    function appendCastBtn() {
        if (document.getElementById('tp_cast_btn')) {
            return;
        }
        try {
            let ttv_fullscreen_btn = document.querySelector('button[data-a-target="player-fullscreen-button"]');
            if (ttv_fullscreen_btn) {
                let btn_container = document.createElement('div');
                btn_container.id = "tp_cast_btn";
                btn_container.classList.add('tp-player-control');
                btn_container.title = _i18n('cast_btn_title');

                let ttv_fullscreen_btn_size = ttv_fullscreen_btn.getBoundingClientRect();
                btn_container.style.width = (ttv_fullscreen_btn_size.width || "30") + "px";
                btn_container.style.height = (ttv_fullscreen_btn_size.height || "30") + "px";
                btn_container.style.zIndex = "1";

                btn_container.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="100%" width="63%" xmlns="http://www.w3.org/2000/svg"><g>' +
                        '<path fill="none" d="M0 0h24v24H0z"></path>' +
                        '<path d="M4.929 2.929l1.414 1.414A7.975 7.975 0 0 0 4 10c0 2.21.895 4.21 2.343 5.657L4.93 17.07A9.969 9.969 0 0 1 2 10a9.969 9.969 0 0 1 2.929-7.071zm14.142 0A9.969 9.969 0 0 ' +
                        '1 22 10a9.969 9.969 0 0 1-2.929 7.071l-1.414-1.414A7.975 7.975 0 0 0 20 10c0-2.21-.895-4.21-2.343-5.657L19.07 2.93zM7.757 5.757l1.415 1.415A3.987 3.987 0 0 0 8 10c0 1.105.448 2.105 ' +
                        '1.172 2.828l-1.415 1.415A5.981 5.981 0 0 1 6 10c0-1.657.672-3.157 1.757-4.243zm8.486 0A5.981 5.981 0 0 1 18 10a5.981 5.981 0 0 1-1.757 4.243l-1.415-1.415A3.987 3.987 0 0 0 16 10a3.987 ' +
                        '3.987 0 0 0-1.172-2.828l1.415-1.415zM12 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-1 2h2v8h-2v-8z"></path></g>' +
                    '</svg>';

                btn_container.onclick = function (){

                    _browser.storage.local.set({'tp_cast': true}, function() {
                        sendMessageToBG({action: "bg_cast_btn_click", detail: window.location.href});
                    });
                }
                document.querySelector('.player-controls__right-control-group').children[2].before(btn_container);
            }
        } catch (e) {

        }
    }

    function appendFlashBangDefenderBtn() {
        if (document.getElementById('tp_flashBangDefender_btn')) {
            return;
        }
        try {
            let ttv_fullscreen_btn = document.querySelector('button[data-a-target="player-fullscreen-button"]');
            if (ttv_fullscreen_btn) {
                let btn_container = document.createElement('div');
                btn_container.id = "tp_flashBangDefender_btn";
                btn_container.classList.add('tp-player-control');
                btn_container.title = _i18n('flashbang_defender_btn_title');

                let ttv_fullscreen_btn_size = ttv_fullscreen_btn.getBoundingClientRect();
                btn_container.style.width = (ttv_fullscreen_btn_size.width || "30") + "px";
                btn_container.style.height = (ttv_fullscreen_btn_size.height || "30") + "px";
                btn_container.style.zIndex = "1";

                btn_container.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" version="1.2" baseProfile="tiny" viewBox="0 0 24 24" height="100%" width="73%" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M17.502 12.033l-4.241-2.458 2.138-5.131c.066-.134.103-.285.103-.444 0-.552-.445-1-.997-1-.249.004-.457.083-.622.214l-.07.06-7.5 7.1c-.229.217-.342.529-.306.842.036.313.219.591.491.75l4.242 2.46-2.163 ' +
                        '5.19c-.183.436-.034.94.354 1.208.173.118.372.176.569.176.248 0 .496-.093.688-.274l7.5-7.102c.229-.217.342-.529.306-.842-.037-.313-.22-.591-.492-.749z"></path>' +
                    '</svg>';

                let opacitySlider;

                btn_container.onclick = function (){
                    let video = document.querySelector('video');
                    if (!video) return;

                    let existing_overlay = document.getElementById('tp_flashBangDefender_overlay');
                    if (existing_overlay) {
                        existing_overlay.remove();
                        opacitySlider.remove();
                        btn_container.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" version="1.2" baseProfile="tiny" viewBox="0 0 24 24" height="100%" width="73%" xmlns="http://www.w3.org/2000/svg">' +
                                '<path d="M17.502 12.033l-4.241-2.458 2.138-5.131c.066-.134.103-.285.103-.444 0-.552-.445-1-.997-1-.249.004-.457.083-.622.214l-.07.06-7.5 7.1c-.229.217-.342.529-.306.842.036.313.219.591.491.75l4.242 2.46-2.163 ' +
                                '5.19c-.183.436-.034.94.354 1.208.173.118.372.176.569.176.248 0 .496-.093.688-.274l7.5-7.102c.229-.217.342-.529.306-.842-.037-.313-.22-.591-.492-.749z"></path>' +
                            '</svg>';
                        return;
                    }

                    let overlay = document.createElement('div');
                    overlay.id = 'tp_flashBangDefender_overlay';
                    overlay.style.width = '100%';
                    overlay.style.height = '100%';
                    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';

                    document.querySelector('.video-player__overlay').appendChild(overlay);

                    btn_container.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" version="1.2" baseProfile="tiny" viewBox="0 0 24 24" height="100%" width="63%" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M14.5 4h.005m-.005 0l-2.5 6 5 2.898-7.5 7.102 2.5-6-5-2.9 7.5-7.1m0-2c-.562.012-1.029.219-1.379.551l-7.497 7.095c-.458.435-.685 1.059-.61 1.686.072.626.437 1.182.982 1.498l3.482 2.021-1.826 4.381c-.362.871-.066 ' +
                        '1.879.712 2.416.344.236.739.354 1.135.354.498 0 .993-.186 1.375-.548l7.5-7.103c.458-.434.685-1.058.61-1.685-.073-.627-.438-1.183-.982-1.498l-3.482-2.018 1.789-4.293c.123-.26.192-.551.192-.857 0-1.102-.89-1.996-2.001-2z"></path>' +
                        '</svg>';

                    opacitySlider = document.createElement('input');
                    opacitySlider.classList.add('tp-multi-stream-box-title-opacity-slider');
                    opacitySlider.classList.add('tp-player-opacity-slider');
                    opacitySlider.type = 'range';
                    opacitySlider.min = '0';
                    opacitySlider.max = '1';
                    opacitySlider.step = '0.01';

                    opacitySlider.value = "0.5";

                    opacitySlider.title = _i18n('flashbang_defender_slider_title');

                    opacitySlider.oninput = function (e) {
                        let slider_hex_val = parseInt(e.target.value * 255).toString(16);
                        if (slider_hex_val === '0') {
                            slider_hex_val = '00';
                        }

                        overlay.style.backgroundColor = "#000000" + slider_hex_val;
                    }

                    btn_container.before(opacitySlider);
                    sendMessageToBG({action: "bg_flashBangDefender_btn_click", detail: ""});
                }
                document.querySelector('.player-controls__right-control-group').children[2].before(btn_container);
            }
        } catch (e) {

        }
    }

    function appendScreenShotBtn() {
        if (document.getElementById('tp_screenshot_btn')) {
            return;
        }
        try {
            let ttv_fullscreen_btn = document.querySelector('button[data-a-target="player-fullscreen-button"]');
            if (ttv_fullscreen_btn) {
                let btn_container = document.createElement('div');
                btn_container.id = "tp_screenshot_btn";
                btn_container.classList.add('tp-player-control');
                btn_container.title = _i18n('screenshot_btn_title');

                let ttv_fullscreen_btn_size = ttv_fullscreen_btn.getBoundingClientRect();
                btn_container.style.width = (ttv_fullscreen_btn_size.width || "30") + "px";
                btn_container.style.height = (ttv_fullscreen_btn_size.height || "30") + "px";
                btn_container.style.zIndex = "1";

                btn_container.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="100%" width="63%" xmlns="http://www.w3.org/2000/svg"><g>' +
                        '<path fill="none" d="M0 0h24v24H0z"></path>' +
                        '<path d="M9.827 21.763L14.31 14l3.532 6.117A9.955 9.955 0 0 1 12 22c-.746 0-1.473-.082-2.173-.237zM7.89 21.12A10.028 10.028 0 0 1 2.458 15h8.965L7.89 21.119zM2.05 13a9.964 9.964 ' +
                        '0 0 1 2.583-7.761L9.112 13H2.05zm4.109-9.117A9.955 9.955 0 0 1 12 2c.746 0 1.473.082 2.173.237L9.69 10 6.159 3.883zM16.11 2.88A10.028 10.028 0 0 1 21.542 9h-8.965l3.533-6.119zM21.95 ' +
                        '11a9.964 9.964 0 0 1-2.583 7.761L14.888 11h7.064z"></path></g>' +
                    '</svg>';

                btn_container.onclick = function (){
                    let video = document.querySelector('video');
                    let canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    let ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    let dataURI = canvas.toDataURL('image/png');

                    fetch(dataURI).then(function (res) {
                        res.blob().then(function (blob_res) {
                            createMultiStreamBox(getCurrentStreamerName(), true, false, false, URL.createObjectURL(blob_res), false);
                        })
                    });
                    sendMessageToBG({action: "bg_screenshot_btn_click", detail: ""});
                }
                document.querySelector('.player-controls__right-control-group').children[2].before(btn_container);
            }
        } catch (e) {

        }
    }


    function appendRecordBtn() {
        if (document.getElementById('tp_record_btn')) {
            return;
        }
        try {
            let ttv_fullscreen_btn = document.querySelector('button[data-a-target="player-fullscreen-button"]');
            if (ttv_fullscreen_btn) {
                let btn_container = document.createElement('div');
                btn_container.id = "tp_record_btn";
                btn_container.classList.add('tp-player-control');
                btn_container.title = _i18n('record_btn_start_title');

                let ttv_fullscreen_btn_size = ttv_fullscreen_btn.getBoundingClientRect();
                btn_container.style.width = (ttv_fullscreen_btn_size.width || "30") + "px";
                btn_container.style.height = (ttv_fullscreen_btn_size.height || "30") + "px";
                btn_container.style.zIndex = "1";

                btn_container.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="0" viewBox="0 0 24 24" height="100%" width="63%" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"></path>' +
                    '<path fill-rule="evenodd" clip-rule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 ' +
                    '12ZM20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" fill="currentColor"></path>' +
                    '</svg>';

                let isRecording = false;
                let stream_name = '';
                let mediaRecorder;

                function downloadRecording(event) {
                    if (event.data.size > 0) {
                        let blob = new Blob([event.data], {
                            type: "video/webm;codecs=h264"
                        });
                        let url = URL.createObjectURL(blob);

                        let video = document.createElement('video');
                        video.preload = "metadata";
                        video.addEventListener("loadedmetadata", async function () {
                            while (video.duration === Infinity) {
                                await new Promise(r => setTimeout(r, 1000));
                                video.currentTime = 10000000 * Math.random();
                            }

                            let a = document.createElement("a");
                            document.body.appendChild(a);
                            a.style.display = "none";
                            a.href = url;
                            a.download = stream_name + ' - ' + new Date(video.duration * 1000).toISOString().substr(14, 5).replace(':','-').replace('00-','') + 's.webm';
                            a.click();
                            window.URL.revokeObjectURL(url);
                            video = null;
                            a.remove();
                        })
                        video.src = url;

                    } else {
                        alert('Error: recording is empty.');
                    }
                }

                function stopRecording() {
                    mediaRecorder.stop();
                    btn_container.style.color = 'white';
                    btn_container.title = _i18n('record_btn_start_title');
                    isRecording = false;

                    let video = document.querySelector("video");
                    video.removeEventListener('abort', stopRecording);
                    window.removeEventListener('beforeunload', stopRecording);
                }

                function startRecording() {
                    let videoMuted_timeoutMS = 0;
                    let video = document.querySelector("video");
                    if (video.muted) {
                        videoMuted_timeoutMS = 200;
                        video.muted = false;
                    }

                    setTimeout(function () {
                        video.captureStream = video.captureStream || video.mozCaptureStream;
                        let stream = video.captureStream(60);
                        let options = { mimeType: 'video/webm;codecs=h264' };
                        mediaRecorder = new MediaRecorder(stream, options);
                        mediaRecorder.ondataavailable = downloadRecording;
                        stream_name = getCurrentStreamerName();

                        video.addEventListener('abort', stopRecording);
                        window.addEventListener('beforeunload', stopRecording);

                        mediaRecorder.start();
                        isRecording = true;
                        btn_container.style.color = 'red';
                        btn_container.title = _i18n('record_btn_stop_title');
                        sendMessageToBG({action: "bg_record_btn_click", detail: ""});
                        if (videoMuted_timeoutMS) {
                            setTimeout(function () {
                                video.volume = 0.001;
                            }, 300);
                        }
                    }, videoMuted_timeoutMS);
                }

                btn_container.onclick = function (){
                    if (isRecording) {
                        stopRecording();
                    } else {
                        startRecording()
                    }
                }
                document.querySelector('.player-controls__right-control-group').children[2].before(btn_container);
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
                btn_container.title = _i18n('pip_main_btn_title');

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

    function appendClipDownloaderBtn() {
        if (document.getElementById('tp_clip_download_btn')) {
            return;
        }
        let video = document.querySelector('video');
        if (video && video.src.indexOf('.mp4?') > -1) {
            try {
                let ttv_fullscreen_btn = document.querySelector('button[data-a-target="player-fullscreen-button"]');
                if (ttv_fullscreen_btn) {
                    let btn_container = document.createElement('div');
                    btn_container.id = "tp_clip_download_btn";
                    btn_container.classList.add('tp-player-control');
                    btn_container.title = _i18n('clip_download_btn_title');

                    let ttv_fullscreen_btn_size = ttv_fullscreen_btn.getBoundingClientRect();
                    btn_container.style.width = (ttv_fullscreen_btn_size.width || "30") + "px";
                    btn_container.style.height = (ttv_fullscreen_btn_size.height || "30") + "px";
                    btn_container.style.zIndex = "1";

                    btn_container.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 20 20" height="100%" width="70%" xmlns="http://www.w3.org/2000/svg">' +
                            '<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 ' +
                            '1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>' +
                        '</svg>';

                    btn_container.onclick = function (){
                        let video_el = document.querySelector('video');
                        if (video_el && video_el.src.indexOf('.mp4?') > -1) {
                            let element = document.createElement('a');
                            element.setAttribute('href', 'data:video/mp4;mp4,' + encodeURIComponent(video_el.src));
                            element.setAttribute('download', document.title);
                            element.style.display = 'none';
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);

                            sendMessageToBG({action: "bg_clip_download_btn_click", detail: true});
                        } else {
                            document.getElementById('tp_clip_download_btn').remove();
                            alert(_i18n('clip_download_no_clip_found_alert_text'));
                        }
                    }
                    document.querySelector('.player-controls__right-control-group').firstChild.before(btn_container);
                }
            } catch (e) {
                console.log(e)
            }
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
                cancel_current_bet_btn.innerText = _i18n('aps_cancel_vote_btn');

                bet_now_btn.classList.add('tp-aps-settings-bet-now-active-btn');
            } else {
                menu_shadow_el.classList.remove('tp-shadow-active');
                menu_shadow_el.classList.add('tp-shadow-idle');

                cancel_current_bet_btn.classList.remove('tp-aps-settings-cancel-bet-active-btn');
                cancel_current_bet_btn.classList.add('tp-aps-settings-check-bet-active-btn');
                cancel_current_bet_btn.innerText = _i18n('aps_check_prediction_btn');

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
            bet_now_btn.innerText = _i18n('aps_vote_now_btn');
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
                    cancel_current_bet_btn.innerText = _i18n('aps_check_prediction_checking_text');
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
                cancel_current_bet_btn.innerText = _i18n('aps_cancel_vote_btn');
            } else {
                set_APS_settings_btn_icon_and_title('idle');
                menu_shadow_el.classList.add('tp-shadow-idle');

                cancel_current_bet_btn.classList.add('tp-aps-settings-check-bet-active-btn');
                cancel_current_bet_btn.innerText = _i18n('aps_check_prediction_btn');
            }

            let curr_stream_name = getCurrentStreamerName();
            settingsContainer.querySelector('#tp_aps_settings_menu_stream_name').innerText = curr_stream_name;

            set_settings_i18n(settingsContainer);

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
            settings_btn.title = _i18n('aps_btn_title_status_prefix_text') + status;
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
            btn_container.classList.add('tp-under-chat-btn');
            btn_container.title = _i18n('aps_btn_title_status_idle_text');

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

    let fScrnWithChat_savedState = {
        bg_color: null,
        slider: null,
        rect: {},
        fonts: {
            font_size: null,
            font_color: null,
            font_weight: null
        }
    }


    function createMultiStreamBox(streamName, isOTF, isMultiStreamChat, isFScrnWithChat, screenshot_imageDataUri, yt_videoId) {
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

        let iframe = document.createElement("Iframe");
        iframe.classList.add('tp-multistream-iframe');

        let closeBtn = createMultiStreamTitleBtn(_i18n('multistream_title_close_btn_title'), "X");
        closeBtn.onclick = function () {
            multiStreamDiv.parentNode.removeChild(multiStreamDiv);
            if (isFScrnWithChat) {
                remove_fScrnWithChat_backToFullscreen_callback();
            }
        }

        let fullScreenBtn = createMultiStreamTitleBtn(_i18n('multistream_title_fullscreen_btn_title'), "&#x26F6");
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

        let minimizeBtn = createMultiStreamTitleBtn(_i18n('multistream_title_minimize_btn_title'), "__");
        let streamBox_last_height = 0;
        minimizeBtn.onclick = function () {
            if (multiStreamDiv.getBoundingClientRect().height === 27) {
                multiStreamDiv.style.height = streamBox_last_height + "px";
                minimizeBtn.innerHTML = "__";
                multiStreamDiv.style.border = "none";
                if (!isMultiStreamChat) {
                    multiStreamDiv.classList.remove('tp-multi-stream-minimized');
                    multiStreamDiv.classList.add('tp-multi-stream-not-minimized');
                }
            } else {
                streamBox_last_height = multiStreamDiv.getBoundingClientRect().height;
                multiStreamDiv.style.height = "27px";
                minimizeBtn.innerHTML = "&#8212;";
                multiStreamDiv.style.border = "1px solid grey";
                if (!isMultiStreamChat) {
                    multiStreamDiv.classList.remove('tp-multi-stream-not-minimized');
                    multiStreamDiv.classList.add('tp-multi-stream-minimized');
                }
            }
        };

        let alwaysOnTopBtn = createMultiStreamTitleBtn(_i18n('multistream_title_always_on_top_btn_title'), "A");
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
            multiStreamDiv.classList.add('tp-multi-stream-chat');
            var opacitySlider;
            let colorPickerCustomBtn;
            var colorPicker;
            let font_colorPickerCustomBtn;
            let font_colorPicker;

            function add_ColorPickerAndOpacitySlider(bg_color, slider_val) {
                colorPickerCustomBtn = createMultiStreamTitleBtn(_i18n('multistream_title_color_picker_btn_title'), "C");
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
                    iframe.contentDocument.querySelector('html').style.backgroundColor = e.target.value + parseInt(opacitySlider.value * 255).toString(16);
                    fScrnWithChat_savedState.bg_color = e.target.value;
                }

                opacitySlider = document.createElement('input');
                opacitySlider.classList.add('tp-multi-stream-box-title-btn');
                opacitySlider.classList.add('tp-multi-stream-box-title-opacity-slider');
                opacitySlider.type = 'range';
                opacitySlider.min = '0';
                opacitySlider.max = '1';
                opacitySlider.step = '0.05';
                if (isFScrnWithChat) {
                    opacitySlider.value = slider_val ? slider_val + "" : "0";
                } else {
                    opacitySlider.value = '1';
                }
                opacitySlider.title = 'Opacity';

                opacitySlider.oninput = function (e) {
                    let slider_hex_val = parseInt(e.target.value * 255).toString(16);
                    if (slider_hex_val === '0') {
                        slider_hex_val = '00';
                    }
                    iframe.contentDocument.querySelector('html').style.backgroundColor = fScrnWithChat_savedState.bg_color ? fScrnWithChat_savedState.bg_color + slider_hex_val : "#18181b" + slider_hex_val;
                    fScrnWithChat_savedState.slider = e.target.value;
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

                let new_val;
                if (bg_color) {
                    if (slider_val) {
                        new_val = bg_color + parseInt(slider_val * 255).toString(16);
                    } else {
                        new_val = bg_color + parseInt(opacitySlider.value * 255).toString(16);
                    }
                } else {
                    new_val = colorPicker.value + parseInt(opacitySlider.value * 255).toString(16);
                }
                iframe.contentDocument.querySelector('html').style.backgroundColor = new_val;
            }

            function addChatPositionControls() {
                let position_controls_container = document.createElement('div');
                position_controls_container.classList.add('tp-multi-stream-box-font-controls-container');
                position_controls_container.style.left = "auto";
                position_controls_container.style.right = "12%";

                let align_left_Btn = createMultiStreamTitleBtn(_i18n('multistream_align_chat_to_left_btn_title'), "<");
                align_left_Btn.onclick = function () {
                    multiStreamDiv.style.height = "calc(100vh - " + (isFScrnWithChat ? '40':'50') + "px)";
                    multiStreamDiv.style.width = "350px";
                    multiStreamDiv.style.top = "0";
                    multiStreamDiv.style.left = "0";
                    fScrnWithChat_savedState.rect = multiStreamDiv.getBoundingClientRect();
                }

                let align_default_Btn = createMultiStreamTitleBtn(_i18n('multistream_align_chat_to_default_btn_title'), "o");
                align_default_Btn.onclick = function () {
                    multiStreamDiv.style.width = "350px";
                    multiStreamDiv.style.height = "600px";
                    multiStreamDiv.style.top = "20px";
                    multiStreamDiv.style.left = "20px";
                    fScrnWithChat_savedState.rect = multiStreamDiv.getBoundingClientRect();
                }

                let align_right_Btn = createMultiStreamTitleBtn(_i18n('multistream_align_chat_to_right_btn_title'), ">");
                align_right_Btn.onclick = function () {
                    multiStreamDiv.style.height = "calc(100vh - " + (isFScrnWithChat ? '40':'50') + "px)";
                    multiStreamDiv.style.width = "350px";
                    multiStreamDiv.style.top = "0";
                    multiStreamDiv.style.left = "calc(100% - 350px)";
                    fScrnWithChat_savedState.rect = multiStreamDiv.getBoundingClientRect();
                }

                position_controls_container.appendChild(align_left_Btn);
                position_controls_container.appendChild(align_default_Btn);
                position_controls_container.appendChild(align_right_Btn);

                iframe.contentDocument.querySelector('.stream-chat-header').prepend(position_controls_container);
            }

            function addFontControls(font_color) {
                let font_controls_container = document.createElement('div');
                font_controls_container.classList.add('tp-multi-stream-box-font-controls-container');

                font_colorPickerCustomBtn = createMultiStreamTitleBtn(_i18n('multistream_title_color_picker_btn_title'), "C");
                font_colorPickerCustomBtn.onclick = function () {
                    font_colorPicker.click();
                }

                font_colorPicker = document.createElement('input');
                font_colorPicker.type = 'color';
                font_colorPicker.classList.add('tp-multi-stream-box-title-btn');
                font_colorPicker.style.display = "none";
                font_colorPicker.value = '#efeff1';
                font_colorPicker.oninput = function (e) {
                    let color = e.target.value;
                    iframe.contentDocument.querySelector('.chat-scrollable-area__message-container').style.color = color;
                    fScrnWithChat_savedState.fonts.font_color = color;
                }

                let bold_btn = createMultiStreamTitleBtn(_i18n('multistream_font_bold_btn_title'), "B");
                bold_btn.onclick = function () {
                    if (bold_btn.attributes.tp_font_bold) {
                        bold_btn.removeAttribute('tp_font_bold');
                        iframe.contentDocument.querySelector('.chat-scrollable-area__message-container').style.fontWeight = 'normal';
                        fScrnWithChat_savedState.fonts.font_weight = 'normal';
                    } else {
                        bold_btn.setAttribute('tp_font_bold', 'true');
                        iframe.contentDocument.querySelector('.chat-scrollable-area__message-container').style.fontWeight = 'bold';
                        fScrnWithChat_savedState.fonts.font_weight = 'bold';
                    }
                }

                let lastFontSize = '13';
                let font_size_up_btn = createMultiStreamTitleBtn(_i18n('multistream_font_size_increase_btn_title'), "+");
                font_size_up_btn.onclick = function () {
                    lastFontSize++;
                    iframe.contentDocument.querySelector('.chat-list--default').style.fontSize = lastFontSize + 'px';
                    fScrnWithChat_savedState.fonts.font_size = lastFontSize;
                }

                let font_size_down_btn = createMultiStreamTitleBtn(_i18n('multistream_font_size_decrease_btn_title'), "-");
                font_size_down_btn.onclick = function () {
                    lastFontSize--;
                    iframe.contentDocument.querySelector('.chat-list--default').style.fontSize = lastFontSize + 'px';
                    fScrnWithChat_savedState.fonts.font_size = lastFontSize;
                }

                font_controls_container.appendChild(font_colorPicker);
                font_controls_container.appendChild(font_colorPickerCustomBtn);
                font_controls_container.appendChild(bold_btn);
                font_controls_container.appendChild(font_size_up_btn);
                font_controls_container.appendChild(font_size_down_btn);
                iframe.contentDocument.querySelector('.stream-chat-header').prepend(font_controls_container);

                iframe.contentDocument.querySelector('.chat-scrollable-area__message-container').style.color = font_color ? font_color : '#ffffff';
            }

            extraMultiBoxBtn = createMultiStreamTitleBtn(_i18n('multistream_title_add_stream_btn_title'), "&#11208;");
            extraMultiBoxBtn.onclick = function () {
                createMultiStreamBox(streamName, true, false, false, false, yt_videoId);
                sendMessageToBG({action: "bg_multiStream_box_stream_started", detail: ""});
            }

            title.innerHTML = "&#9703; " + streamName.charAt(0).toUpperCase() + streamName.slice(1);

            multiStreamDiv.style.width = "350px";
            multiStreamDiv.style.height = "600px";
            if (yt_videoId) {
                iframe.src = "https://www.youtube.com/live_chat?v=" + yt_videoId + "&embed_domain=www.twitch.tv";
            } else {
                iframe.src = "https://www.twitch.tv/embed/" + streamName + "/chat?" + (document.querySelector('html.tw-root--theme-dark') ? "darkpopout&":"") + "parent=twitch.tv"
            }
        } else {
            multiStreamDiv.classList.add('tp-multi-stream-video');
            multiStreamDiv.classList.add('tp-multi-stream-not-minimized');
            if (!isMultiStreamMode) {
                multiStreamDiv.style.boxShadow = 'rgb(23, 23, 23, 0.75) 12px 12px 10px -10px';
            }
            extraMultiBoxBtn = createMultiStreamTitleBtn(_i18n('multistream_title_add_chat_btn_title'), "&#9703;");
            extraMultiBoxBtn.onclick = function () {
                createMultiStreamBox(streamName, true, true, false, false, yt_videoId);
                sendMessageToBG({action: "bg_multiStream_box_chat_started", detail: ""});
            }
            title.innerHTML = "<span style='position:absolute;top: 4px;' >&#11208; " + streamName.charAt(0).toUpperCase() + streamName.slice(1) + "</span>";
            if (!screenshot_imageDataUri) {
                iframe.setAttribute('allowfullscreen', 'true');
                if (yt_videoId) {
                    iframe.src = "https://www.youtube.com/embed/" + yt_videoId + "?autoplay=1&origin=twitch.tv&controls=1&mute=1";
                } else {
                    if (options.isAdvancedVideoEmbedsEnabled) {
                        iframe.style.visibility = "hidden";
                        multiStreamDiv.style.backgroundColor = '#000000';
                        multiStreamDiv.style.backgroundImage = "url('https://static-cdn.jtvnw.net/previews-ttv/live_user_" + streamName + "-600x338.jpg?" + new Date().getTime() + "')";

                        let loader = document.createElement("span");
                        loader.classList.add('tp-loading');
                        loader.innerText = _i18n('preview_loader_text');
                        loader.style.right = "0";
                        loader.style.borderTopLeftRadius = "10px";
                        loader.style.borderLeft = "1px solid #8f8f8f";
                        multiStreamDiv.appendChild(loader);

                        iframe.contentDocument
                        iframe.onload = function (e) {
                            setTimeout(function () {
                                iframe.style.visibility = "visible";
                                loader.remove();
                                multiStreamDiv.style.backgroundImage = "";
                            }, 2000);
                        }
                        iframe.src = "https://www.twitch.tv/" + streamName;
                    } else {
                        iframe.src = "https://player.twitch.tv/?channel=" + streamName + "&parent=twitch.tv&muted=true";
                    }
                }
            }
        }

        titleBtnContainer = document.createElement('div');
        titleBtnContainer.classList.add('tp-multi-stream-box-title-btn-container');

        if(!isFScrnWithChat) {
            titleBtnContainer.appendChild(extraMultiBoxBtn);
            titleBtnContainer.appendChild(alwaysOnTopBtn);
        }
        titleBtnContainer.appendChild(minimizeBtn);
        titleBtnContainer.appendChild(fullScreenBtn);
        titleBtnContainer.appendChild(closeBtn);

        title.appendChild(titleBtnContainer);

        multiStreamDiv.appendChild(title);
        if (screenshot_imageDataUri) {
            multiStreamDiv.classList.add('tp-multi-stream-box-screenshot');
            let img = document.createElement('img');
            img.style.width = '100%';
            img.style.height = '100%';
            img.src = screenshot_imageDataUri;

            let click_download_overlay = document.createElement('div');
            click_download_overlay.id = 'tp_screenshot_click_overlay';
            click_download_overlay.style.position = 'absolute';
            click_download_overlay.style.top = '0';
            click_download_overlay.style.left = '0';
            click_download_overlay.style.width = '100%';
            click_download_overlay.style.height = '100%';

            click_download_overlay.innerHTML =
                "<div>" +
                    "<svg stroke=\"currentColor\" fill=\"currentColor\" stroke-width=\"0\" viewBox=\"0 0 20 20\" height=\"1em\" width=\"1em\" xmlns=\"http://www.w3.org/2000/svg\">" +
                        "<path fill-rule=\"evenodd\" d=\"M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z\" clip-rule=\"evenodd\"></path>" +
                    "</svg>" +
                "</div>" +
                "<div style='font-weight: bold;font-size: 15px;' >" + _i18n('multistream_download_screenshot_btn_title') + "</div>";

            click_download_overlay.onclick = function () {
                let link = document.createElement("a");
                link.download = streamName;
                link.target = "_blank";
                link.href = screenshot_imageDataUri;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            multiStreamDiv.prepend(click_download_overlay);
            multiStreamDiv.appendChild(img);

            if (isInIframe()) {
                multiStreamDiv.style.height = '112px';
                multiStreamDiv.style.width = '200px';
                multiStreamDiv.style.top = '45%';
                multiStreamDiv.style.left = '0px';
            }
        } else {
            multiStreamDiv.appendChild(iframe);
        }


        initDragForMultiStream(multiStreamDiv);

        if (isFScrnWithChat) {

            multiStreamDiv.onmouseup = function () {
                fScrnWithChat_savedState.rect = multiStreamDiv.getBoundingClientRect();
                fScrnWithChat_savedState.bg_color = fScrnWithChat_savedState.bg_color ? fScrnWithChat_savedState.bg_color : colorPicker.value;
            }

            multiStreamDiv.style.height = typeof fScrnWithChat_savedState.rect.height !== "undefined" ? fScrnWithChat_savedState.rect.height + "px" : "calc(100% - 40px)";
            multiStreamDiv.style.width = typeof fScrnWithChat_savedState.rect.width !== "undefined" ? fScrnWithChat_savedState.rect.width + "px" : "350px";
            multiStreamDiv.style.top = typeof fScrnWithChat_savedState.rect.top !== "undefined" ? fScrnWithChat_savedState.rect.top + "px" : "0";
            multiStreamDiv.style.left = typeof fScrnWithChat_savedState.rect.left !== "undefined" ? fScrnWithChat_savedState.rect.left + "px" : "calc(100% - 350px)";

            document.querySelector('.video-player__container').appendChild(multiStreamDiv);
        } else {
            let container_scrollable_wrapper = document.querySelector('.root-scrollable__wrapper');
            if (container_scrollable_wrapper) {
                container_scrollable_wrapper.firstChild.appendChild(multiStreamDiv);
            } else {
                document.querySelector('.video-player__container').appendChild(multiStreamDiv);
            }

            if (isMultiStreamMode) {
                if (multiStream_curr_selected_preset_index) {
                    load_multiStream_layout_preset(multiStream_curr_selected_preset_index);
                }
            }
        }

        setTimeout(function (){
            if (isMultiStreamChat) {
                if (iframe.contentDocument) {
                    iframe.contentDocument.querySelector('html').classList.add('tp-hide-channel-leaderboard');
                    iframe.contentDocument.querySelector('html').classList.add('tp-multi-chat-transparent');
                    add_ColorPickerAndOpacitySlider(isFScrnWithChat ? fScrnWithChat_savedState.bg_color : null, isFScrnWithChat ? fScrnWithChat_savedState.slider : null);
                    addFontControls(isFScrnWithChat ? fScrnWithChat_savedState.fonts.font_color : null);
                    addChatPositionControls();
                    if (isFScrnWithChat) {
                        if (fScrnWithChat_savedState.fonts.font_size) {
                            iframe.contentDocument.querySelector('.chat-list--default').style.fontSize = fScrnWithChat_savedState.fonts.font_size + 'px';
                        }
                        if (fScrnWithChat_savedState.fonts.font_weight) {
                            iframe.contentDocument.querySelector('.chat-scrollable-area__message-container').style.fontWeight = fScrnWithChat_savedState.fonts.font_weight;
                        }
                    }
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
                btn_container.title = _i18n('multistream_title_add_stream_btn_title');
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
                    createMultiStreamBox(href, true, false, false, false, false);
                    sendMessageToBG({action: "bg_searchBar_multiStream_started", detail: ""});
                })

                let btn_containerChat = document.createElement('div');
                btn_containerChat.title = _i18n('multistream_title_add_chat_btn_title');
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
                    createMultiStreamBox(href, true, true, false, false, false);
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
        let inputContainer = document.querySelector('div[data-a-target="tray-search-input"]');
        if (!inputContainer) {
            return;
        }

        let input = inputContainer.querySelector('input');

        if (input.attributes.tp_listener) {
            return;
        }

        input.addEventListener('input', (event) => {
            if (event.target.value.length > 0) {
                setTimeout(function (){
                    setSearchResultsClickListeners(input);
                }, 750);
            }
        })

        input.setAttribute('tp_listener', 'true');
    }

    function appendMultiStreamSearchInfoText() {
        let div = document.createElement('div');
        div.classList.add('tp-multi-stream-info-div');
        div.innerHTML = _i18n('multistream_info_title_pt1') + " <img width='18' height='18' style='margin: auto 5px' class='tp-theme-support' src='" + getRuntimeUrl('../images/multistream.png') + "' /> " + _i18n('multistream_info_title_pt2');

        document.querySelector('div[data-a-target="tray-search-input"]').querySelector('input').before(div);
    }

    function create_layout_preview_square(label, preset, rem5_px) {

        let div = document.createElement('div');
        div.style.top = (preset.top - rem5_px) + 'px';
        div.style.left = (preset.left - rem5_px) + 'px';
        div.style.width = preset.width + 'px';
        div.style.height = preset.height + 'px';
        div.innerText = label;

        if (label === 'Stream') {
            div.style.backgroundColor = 'rgba(161,96,254,0.4)';
        } else {
            div.style.backgroundColor = 'rgba(64,255,64,0.4)';
        }

        return div;
    }

    let multiStream_curr_selected_preset_index = false;

    function createLayoutPresetBtn(label, layout_preset_index, isSaveBtn) {
        let container = document.createElement('div');
        container.classList.add('tp-multistream-layout-preset-container')

        let icon_btn = document.createElement('span');
        icon_btn.classList.add('tp-multistream-layout-preset-btn');
        icon_btn.innerHTML = isSaveBtn ? '&#128427;' : layout_preset_index + 1;

        let text_span = document.createElement('span');
        text_span.innerHTML = '<span style="color:white;font-weight: bold;" >| </span><span style="margin-left: 5px;" >' + label + '</span>';
        text_span.style.fontSize = '13px';
        text_span.style.color = 'white';

        container.onclick = function (e) {
            e.preventDefault();
            e.cancelBubble = true;
            if (isSaveBtn) {
                save_curr_multiStream_layout_preset();
            } else {
                if (multiStream_curr_selected_preset_index === layout_preset_index) {
                    multiStream_curr_selected_preset_index = false;
                    icon_btn.innerHTML = layout_preset_index + 1;
                    icon_btn.style.color = 'white';
                    return;
                }

                let icons = document.querySelectorAll('.tp-multistream-layout-preset-btn');
                for (let i = 0; i < icons.length-1; i++) {
                    icons[i].innerHTML = (i + 1) + '';
                    icons[i].style.color = 'white';
                }

                icon_btn.innerHTML = '&#10687;';
                icon_btn.style.color = 'limegreen';
                multiStream_curr_selected_preset_index = layout_preset_index;
                load_multiStream_layout_preset(layout_preset_index);
            }
        }


        container.appendChild(icon_btn);
        container.appendChild(text_span);

        if (!isSaveBtn) {
            let rem5_px = 5 * parseFloat(getComputedStyle(document.documentElement).fontSize);

            container.onmouseenter = function () {
                let layout_preview_container = document.getElementById('tp_multiStream_layout_preview_container');
                if(layout_preview_container) {
                    layout_preview_container.innerHTML = '';
                }

                layout_preview_container = document.createElement('div');
                layout_preview_container.id = 'tp_multiStream_layout_preview_container';

                multiStream_layout_presets[layout_preset_index].streams.forEach((preset) => {
                    layout_preview_container.appendChild(create_layout_preview_square('Stream', preset, rem5_px));
                })

                multiStream_layout_presets[layout_preset_index].chats.forEach((preset) => {
                    layout_preview_container.appendChild(create_layout_preview_square('Chat', preset, rem5_px));
                })

                document.querySelector('.root-scrollable__wrapper').firstChild.appendChild(layout_preview_container);
            }

            container.onmouseleave = function () {
                let layout_preview_container = document.getElementById('tp_multiStream_layout_preview_container');
                if(layout_preview_container) {
                    layout_preview_container.remove();
                }
            }


            let delete_btn = document.createElement('span');
            delete_btn.classList.add('tp-multistream-layout-delete-preset-btn');
            delete_btn.innerText = 'X';

            delete_btn.onclick = function (e) {
                e.preventDefault();
                e.cancelBubble = true;
                if (confirm(_i18n('multistream_preset_delete_confirm_dialog_text') + '"' + label + '"?')) {
                    delete_multiStream_layout_preset(layout_preset_index);
                    let layout_preview_container = document.getElementById('tp_multiStream_layout_preview_container');
                    if(layout_preview_container) {
                        layout_preview_container.remove();
                    }
                    document.querySelector('.tp-multi-stream-layout-controls').remove();
                    appendMultiStreamLayoutControls();
                }
            }

            container.appendChild(delete_btn);
        }

        return container;
    }

    function delete_multiStream_layout_preset(preset_index) {
        multiStream_layout_presets.splice(preset_index,1);

        _browser.storage.local.set({'multiStream_layout_presets': multiStream_layout_presets}, function() {

        });
    }

    function save_curr_multiStream_layout_preset() {
        let streams = document.querySelectorAll('.tp-multi-stream-video');
        let chats = document.querySelectorAll('.tp-multi-stream-chat');
        if (streams.length === 0 && chats.length === 0) {
            return;
        }

        let preset = {};
        let prompt_res = prompt(_i18n('multistream_preset_add_name_prompt_text'), _i18n('multistream_preset_add_name_prompt_placeholder'));
        if (prompt_res === null) {
            return;
        }
        if (prompt_res === "") {
            save_curr_multiStream_layout_preset();
            return;
        }
        preset.name = prompt_res;
        preset.streams = [];
        preset.chats = [];

        streams.forEach((stream_box) => {
            let rect = stream_box.getBoundingClientRect();
            preset.streams.push({top: rect.top, left: rect.left, width: rect.width, height: rect.height});
        })

        chats.forEach((chat_box) => {
            let rect = chat_box.getBoundingClientRect();
            preset.chats.push({top: rect.top, left: rect.left, width: rect.width, height: rect.height});
        })

        multiStream_layout_presets.push(preset);

        _browser.storage.local.set({'multiStream_layout_presets': multiStream_layout_presets}, function() {

        });

        document.querySelector('#tp_multi_stream_layout_controls_save_btn').before(createLayoutPresetBtn(preset.name,multiStream_layout_presets.length -1));
    }

    function load_multiStream_layout_preset(preset_index) {
        let streams = document.querySelectorAll('.tp-multi-stream-video');
        let chats = document.querySelectorAll('.tp-multi-stream-chat');

        streams.forEach((stream_box, i) => {
            if (!multiStream_layout_presets[preset_index].streams[i]) {
                stream_box.style.zIndex = stream_box.attributes.tp_alwaysOnTop ? (1000 + multiStream_curr_zIndex++) + '' : (multiStream_curr_zIndex++) + '';
            } else {
                stream_box.style.top = 'calc(' + multiStream_layout_presets[preset_index].streams[i].top + 'px' + ' - 5rem)';
                stream_box.style.left = 'calc(' + multiStream_layout_presets[preset_index].streams[i].left + 'px' + ' - 5rem)';
                stream_box.style.width = multiStream_layout_presets[preset_index].streams[i].width + 'px';
                stream_box.style.height = multiStream_layout_presets[preset_index].streams[i].height + 'px';
            }
        })

        chats.forEach((stream_box, i) => {
            if (!multiStream_layout_presets[preset_index].chats[i]) {
                stream_box.style.zIndex = stream_box.attributes.tp_alwaysOnTop ? (1000 + multiStream_curr_zIndex++) + '' : (multiStream_curr_zIndex++) + '';
            } else {
                stream_box.style.top = 'calc(' + multiStream_layout_presets[preset_index].chats[i].top + 'px' + ' - 5rem)';
                stream_box.style.left = 'calc(' + multiStream_layout_presets[preset_index].chats[i].left + 'px' + ' - 5rem)';
                stream_box.style.width = multiStream_layout_presets[preset_index].chats[i].width + 'px';
                stream_box.style.height = multiStream_layout_presets[preset_index].chats[i].height + 'px';
            }
        })
    }

    function appendMultiStreamLayoutControls() {
        let layout_settings_btn = document.createElement('div');
        layout_settings_btn.classList.add('tp-multi-stream-layout-controls');
        layout_settings_btn.tabIndex = 1;
        layout_settings_btn.title = _i18n('multistream_layout_presets_btn_title');

        let img = document.createElement('img');
        img.style.width = '70%';
        img.style.height = '70%';
        img.src = getRuntimeUrl('../images/multistream_layout.png');
        img.style.margin = "auto 5px";
        img.classList.add('tp-theme-support');

        layout_settings_btn.appendChild(img);

        let settings_container = document.createElement('div');
        settings_container.classList.add('tp-multi-stream-layout-controls-container');
        settings_container.classList.add('animated');
        settings_container.classList.add('fadeIn');
        settings_container.style.display = 'none';

        let settings_content = document.createElement('div');
        settings_content.classList.add('tp-multi-stream-layout-controls-content');


        layout_settings_btn.onclick = function () {
            if (settings_container.style.display === 'none') {
                settings_container.style.display = 'inline-block';
            } else {
                settings_container.style.display = 'none'
            }
        }

        layout_settings_btn.onblur = function () {
            settings_container.style.display = 'none';
        }

        _browser.storage.local.get('multiStream_layout_presets', function(result) {
            if (result.multiStream_layout_presets && result.multiStream_layout_presets.length > 0) {
                multiStream_layout_presets = result.multiStream_layout_presets;
            } else {
                multiStream_layout_presets = [];

                let rem5_px = 5 * parseFloat(getComputedStyle(document.documentElement).fontSize);

                let preset1 = {};
                preset1.name = '4 Streams';
                preset1.streams = [];
                preset1.chats = [];

                let width = window.innerWidth / 2 - rem5_px / 2;
                let height = window.innerHeight / 2 - rem5_px / 2;
                let rightHalf_leftMargin = width + rem5_px;
                let bottomHalf_topMargin = height + rem5_px;

                preset1.streams.push(
                    {top: rem5_px, left: rem5_px, width: width, height: height},
                    {top: rem5_px, left: rightHalf_leftMargin, width: width, height: height},
                    {top: bottomHalf_topMargin, left: rem5_px, width: width, height: height},
                    {top: bottomHalf_topMargin, left: rightHalf_leftMargin, width: width, height: height},
                );

                let preset2 = {};
                preset2.name = '2 Streams, 1 Chat';
                preset2.streams = [];
                preset2.chats = [];

                preset2.streams.push(
                    {top: rem5_px, left: rem5_px, width: window.innerWidth - 350 - rem5_px, height: window.innerHeight / 2 - rem5_px / 2},
                    {top: window.innerHeight / 2 + rem5_px / 2, left: rem5_px, width: window.innerWidth - 350 - rem5_px, height: window.innerHeight / 2 - rem5_px / 2}
                );
                preset2.chats.push(
                    {top: rem5_px, left: window.innerWidth - 350, width: 350, height: window.innerHeight - rem5_px}
                );

                let preset3 = {};
                preset3.name = '2 Streams, 2 Chats';
                preset3.streams = [];
                preset3.chats = [];

                preset3.streams.push(
                    {top: rem5_px, left: rem5_px + 350, width: window.innerWidth - 350 - 350 - rem5_px, height: window.innerHeight / 2 - rem5_px / 2},
                    {top: window.innerHeight / 2 + rem5_px / 2, left: rem5_px + 350, width: window.innerWidth - 350 - 350 - rem5_px, height: window.innerHeight / 2 - rem5_px / 2}
                );
                preset3.chats.push(
                    {top: rem5_px, left: rem5_px, width: 350, height: window.innerHeight - rem5_px},
                    {top: rem5_px, left: window.innerWidth - 350, width: 350, height: window.innerHeight - rem5_px}
                );

                multiStream_layout_presets.push(preset1);
                multiStream_layout_presets.push(preset2);
                multiStream_layout_presets.push(preset3);

                _browser.storage.local.set({'multiStream_layout_presets': multiStream_layout_presets}, function() {

                });
            }

            for (let i = 0; i < multiStream_layout_presets.length; i++) {
                let preset = createLayoutPresetBtn(multiStream_layout_presets[i].name, i);
                settings_content.appendChild(preset);
            }

            let save_btn = createLayoutPresetBtn('Save current layout as preset', multiStream_layout_presets.length, true);
            save_btn.id = "tp_multi_stream_layout_controls_save_btn";
            settings_content.appendChild(save_btn);
        });

        settings_container.appendChild(settings_content);
        layout_settings_btn.appendChild(settings_container);

        document.querySelector('div[data-a-target="tray-search-input"]').querySelector('input').before(layout_settings_btn);
    }

    function initMultiStream(firstStreamName) {
        document.querySelector('.root-scrollable__wrapper').firstChild.innerHTML = "";
        document.querySelector('.root-scrollable__wrapper').classList.add('tp_multistream_container');
        setTwitchSearchBarListener();
        appendMultiStreamSearchInfoText();
        appendMultiStreamLayoutControls();
        createMultiStreamBox(firstStreamName, false, false, false, false, false);
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

    function appendCastWorker() {
         let s = document.createElement("script");
        s.innerHTML = "let context = window.cast.framework.CastContext.getInstance();\n" +
            "                    let CAST_STATE_CHANGED_EVENT_STR = window.cast.framework.CastContextEventType.CAST_STATE_CHANGED;\n" +
            "                    context.addEventListener(CAST_STATE_CHANGED_EVENT_STR , function(e) {\n" +
            "                        window.postMessage('tp_cast_close');" +
            "                       if (e.castState === \"CONNECTED\") {\n" +
            "                            window.onpagehide = function(e) {\n" +
            "                                e.preventDefault();\n" +
            "                                e.stopPropagation();\n" +
            "                                e.stopImmediatePropagation();\n" +
            "                            }\n" +
            "                            window.onbeforeunload = function(e) {\n" +
            "                                e.preventDefault();\n" +
            "                                e.stopPropagation();\n" +
            "                                e.stopImmediatePropagation();\n" +
            "                            }\n" +
            "                            window.onunload = function(e) {\n" +
            "                                e.preventDefault();\n" +
            "                                e.stopPropagation();\n" +
            "                                e.stopImmediatePropagation();\n" +
            "                            }\n" +
            "                        }\n" +
            "                    })";
        document.body.appendChild(s);

        window.onmessage = function(event) {
            if (event.data === "tp_cast_close") {
                document.getElementById('cast_loading_overlay').innerText = _i18n('cast_closing_tab_text');
                let d = Date.now() + 3000;
                let i = 0;
                while (Date.now() < d) {
                    i++;
                    if (i === 1000) {
                        parent.close();
                        window.close();
                        this.close();
                    }
                }
            }
        }
    }

    function check_cast_start() {
        _browser.storage.local.get('tp_cast', function(result) {
            if (result.tp_cast) {

                _browser.storage.local.set({'tp_cast': false}, function() {

                });
                check_import_tp_options_availability().then(function () {
                    let overlay = document.createElement('div');
                    overlay.id = "cast_loading_overlay";
                    overlay.innerText = _i18n('cast_waiting_text');
                    document.body.appendChild(overlay);


                    let times_interval_ran = 0;
                    let interval = setInterval(function () {
                        if (document.querySelector('.tw-chromecast-button__icon')) {
                            setPvqc();
                            appendCastWorker();
                            setTimeout(()=>{
                                overlay.innerText = _i18n('cast_select_device_text');
                                document.querySelector('.tw-chromecast-button__icon').closest('button').click();
                            }, 1000);
                            clearInterval(interval);
                        } else {
                            times_interval_ran++;
                            if (times_interval_ran > 30) {
                                alert(_i18n('cast_not_found_err_text'));
                                clearInterval(interval);
                            }
                        }
                    }, 1000);
                });
            }
        });
    }

    function check_multistream_start() {
        _browser.storage.local.get('startMultiStream_name', function(result) {
            if (result.startMultiStream_name) {

                check_import_tp_options_availability().then(function () {
                    startMultiStream_name = result.startMultiStream_name;

                    let overlay = document.createElement('div');
                    overlay.id = "multistream_loading_overlay";
                    overlay.innerText = _i18n('multistream_starting_text');
                    document.body.appendChild(overlay);

                    _browser.storage.local.set({'startMultiStream_name': false}, function() {

                    });
                });
            }
        });
    }

    function setConfirmedToastFlag(storageFlagName) {
        let storageFlagObj = {};
        storageFlagObj[storageFlagName] = false;
        _browser.storage.local.set(storageFlagObj, function() {

        });
    }

    function isOverflown(element) {
        return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
    }

    function getSecondsRangeForToast(seconds) {
        switch (true) {
            case (seconds < 3):
                return '1-3';
            case (seconds < 6):
                return '3-6';
            case (seconds < 10):
                return '6-10';
            case (seconds < 15):
                return '10-15';
            case (seconds < 20):
                return '15-20';
            case (seconds < 25):
                return '20-25';
            case (seconds < 30):
                return '25-30';
            case (seconds < 45):
                return '30-45';
            case (seconds < 60):
                return '45-60';
            case (seconds < 75):
                return '60-75';
            case (seconds < 90):
                return '75-90';
            case (seconds < 120):
                return '90-120';
            case (seconds < 150):
                return '120-150';
            case (seconds < 180):
                return '150-180';
            case (seconds < 210):
                return '180-210';
            case (seconds < 300):
                return '210-300';
            case (seconds < 600):
                return '300-600';
            case (seconds < 900):
                return '600-900';
            case (seconds < 1200):
                return '900-1200';
            default:
                return '>1200';
        }
    }

    function showToast(toast_body, storageFlagName, isDelayedRateToast) {
        let toast_show_time;
        let hideClass = '';
        let toastType = isDelayedRateToast ? 'delayedRateToast':'updateToast';

        function remove_toast(updateToast) {
            updateToast.remove();
        }

        let updateToast = document.createElement("div");
        updateToast.id = "tp_updateToast";
        updateToast.classList.add("tp_update_toast");
        if (isDelayedRateToast) {
            hideClass = 'class="tp_display_none"';
            updateToast.classList.add("tp_update_toast_delayedRate");
        }
        updateToast.classList.add("animated");
        updateToast.classList.add("slideInRight");

        updateToast.innerHTML = "<div style=\"font-size: 14px;color: white;\" >\n" +
            "            <div>" +
            "               <img id='tp_updateToast_translate_btn' src=\"" + getRuntimeUrl('images/translate.png') + "\" width=\"25\" height=\"25\" title=\"" + geti18nMessage('translateStr') + "\" />\n" +
            "               <img " + hideClass + " id='tp_updateToast_settings_top_btn' src=\"" + getRuntimeUrl('images/settings.png') + "\" width=\"25\" height=\"25\" title=\"Settings\" />\n" +
            "               <span id='tp_updateToast_dismiss_top_btn' >X</span>\n" +
            "               <div id='tp_updateToast_body_container' >" + toast_body + "</div>" +
            "               <div " + hideClass + " style=\"font-size: 12px;margin-top: 25px;\" >" + _i18n('update_toast_rate_line_text') + "</div>\n" +
            "            </div>\n" +
            "            <div style=\"font-size: 12px;margin-top: 10px;text-align: center;\" >\n" +
            "                <div style=\"display: inline-block;padding: 5px;cursor: pointer;font-weight: bold;\" id='tp_updateToast_rate_btn' >" + _i18n('update_toast_rate') + "</div>\n" +
            "               | <div style=\"display: inline-block;padding: 5px;cursor: pointer;font-weight: bold;\" id='tp_updateToast_share_btn' >" + _i18n('update_toast_share') + "</div>\n" +
            "               | <div style=\"display: inline-block;padding: 5px;cursor: pointer;font-weight: bold;\" id='tp_updateToast_settings_btn' >" + _i18n('update_toast_settings') + "</div>\n" +
            "                <div id=\"tp_updateToast_donate_btn\" >\n" +
            "                                <img id=\"tp_updateToast_donate_btn_img\" src=\"" + getRuntimeUrl('images/donate_heart.png') + "\" width=\"22\" height=\"20\" >\n" +
            "                                <span id=\"tp_updateToast_donate_btn_buffer_span\" ></span>\n" +
            "                                <span id=\"tp_updateToast_donate_btn_text_span\" >" + _i18n('donate_btn_text') + "</span>\n" +
            "                            </div>\n" +
            "            </div>\n" +
            "            <div style=\"margin-top: 5px;padding: 5px;cursor: pointer;font-size: 12px;text-align: center;font-weight: bold;\" id='tp_updateToast_dismiss_btn' >" + (isDelayedRateToast ? _i18n('delayed_rate_toast_close'):_i18n('update_toast_close')) + "</div>\n" +
            "        </div>";

        updateToast.querySelector('#tp_updateToast_rate_btn').onclick = function () {
            sendMessageToBG({action: toastType + "_rate_btn_click", detail: ""});
            sendMessageToBG({action: "bg_show_rate", detail: ""});
        };
        updateToast.querySelector('#tp_updateToast_share_btn').onclick = function () {
            sendMessageToBG({action: toastType + "_share_btn_click", detail: ""});
            sendMessageToBG({action: "bg_show_share", detail: ""});
        };
        updateToast.querySelector('#tp_updateToast_settings_btn').onclick = function () {
            showSettings();
            sendMessageToBG({action: toastType + "_settings_btn_click", detail: ""});
        };

        updateToast.querySelector('#tp_updateToast_donate_btn').onclick = function () {
            sendMessageToBG({action: "bg_show_donate", detail: ""});
            sendMessageToBG({action: toastType + "_donate_btn_click", detail: ""});
        };

        updateToast.querySelector('#tp_updateToast_dismiss_btn').onclick = function () {
            setConfirmedToastFlag(storageFlagName);
            sendMessageToBG({action: toastType, detail: getSecondsRangeForToast(parseInt((new Date().getTime() - toast_show_time) / 1000)) + 's'});
            remove_toast(updateToast);
        };

        updateToast.querySelector('#tp_updateToast_dismiss_top_btn').onclick = function () {
            setConfirmedToastFlag(storageFlagName);
            sendMessageToBG({action: toastType, detail: getSecondsRangeForToast(parseInt((new Date().getTime() - toast_show_time) / 1000)) + 's'});
            remove_toast(updateToast);
        };

        updateToast.querySelector('#tp_updateToast_translate_btn').onclick = function () {
            sendMessageToBG({action: toastType + "_translate_btn_click", detail: 'https://translate.google.com/?sl=auto&tl=auto&text=' + encodeURIComponent(updateToast.querySelector('#tp_updateToast_body_container').innerText) + '&op=translate'});
        };

        updateToast.querySelector('#tp_updateToast_settings_top_btn').onclick = function () {
            showSettings();
            sendMessageToBG({action: toastType + "_settings_top_btn_click", detail: 'https://translate.google.com/?sl=auto&tl=auto&text=' + encodeURIComponent(updateToast.querySelector('#tp_updateToast_body_container').innerText) + '&op=translate'});
        };

        document.body.appendChild(updateToast);
        setTimeout(function (){
            if (isOverflown(updateToast)) {
                updateToast.style.boxShadow = "10px 15px 10px -5px rgba(23,23,23,0.75)";
            } else {
                updateToast.style.width = "35rem";
                updateToast.firstChild.style.width = "30rem";
            }
        }, 100);
        toast_show_time = new Date().getTime();
    }

    function getDelayedRateToastBody() {
        return "   <div style=\"font-weight: bold;font-size: 15px;color: white;\" >"+ _i18n('delayed_rate_toast_title') +"</div>"
            +  "       <div style=\"font-size: 13px;margin-top: 10px;color: white;\" >" + _i18n('delayed_rate_toast_body') + "</div>";
    }

    function getUpdateToastBody() {
        let ffclass = isFirefox ? 'class="tp_display_none"':'';
        let cclass = isFirefox ? '':'class="tp_display_none"';
        return "   <div style=\"font-weight: bold;font-size: 15px;color: white;\" >" + _i18n('update_toast_updated_title') + "</div>"
            +  "       <div style=\"font-size: 14px;font-weight: bold;margin-top: 10px;color: white;\" >New Features!</div>"
            +  "       <div style=\"font-size: 14px;color: white;margin-top: 20px;\" "+ ffclass +" ><strong style='color: #2cff95;' >- Record Stream Button! " +
                                "<svg stroke=\"currentColor\" fill=\"none\" stroke-width=\"0\" viewBox=\"0 0 24 24\" height=\"20px\" width=\"20px\" style=\"margin-bottom: -5px;color:whitesmoke;\" xmlns=\"http://www.w3.org/2000/svg\">" +
                                    "<path d=\"M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z\" fill=\"currentColor\"></path>" +
                                    "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM20 12C20 16.4183 16.4183 20 12 20C7.58172 " +
                                    "20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z\" fill=\"currentColor\"></path>" +
                                "</svg>" +
                            "</strong>"
            +  "             <span ><br><span style=\"font-size: 12px;color: whitesmoke;\" >- Click to start recording, click again to stop recording and save.</span>"
            +  "             <span ><br><span style=\"font-size: 12px;color: whitesmoke;font-weight: bold;\" >- Works great with the \"Seek Using Keyboard Arrows\" feature.</span>"
            +  "             <span ><br><span style=\"font-size: 12px;color: whitesmoke;\" >- Check the settings for more info.</span>"
/*
            +  "             <span ><br><span style=\"font-size: 12px;color: whitesmoke;\" ><img height='136' width='263' style='margin-top: 5px;' src='" + getRuntimeUrl('images/updatetoast_img.jpg') + "' ></span>"
*/
            +  "       </div>"
            +  "       <div style=\"font-size: 14px;color: white;margin-top: 20px;\" ><strong style='color: #2cff95;' >- Incognito Chat! " +
                                "<svg stroke=\"currentColor\" fill=\"currentColor\" stroke-width=\"0\" viewBox=\"0 0 22 22\" height=\"20px\" width=\"20px\" style=\"margin-bottom: -9px;color:whitesmoke;\" xmlns=\"http://www.w3.org/2000/svg\">" +
                                "<path d=\"M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1H2zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12z\"></path>" +
                                "<path d=\"M5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z\"></path>" +
                                "</svg>" +
                            "</strong>"
            +  "             <span ><br><span style=\"font-size: 12px;color: whitesmoke;\" >- The button will show under the chat (if you are banned).</span>"
            +  "             <span ><br><span style=\"font-size: 12px;color: whitesmoke;\" >- Opens the chat in a resized incognito window.</span>"
            +  "             <span ><br><span style=\"font-size: 12px;color: whitesmoke;\" "+ cclass +" >- Note: Firefox users will need to manually allow the extension to \"Run in Private Windows\" in \"about:addons\" for this feature to work.</span>"
            +  "       </div>"
            +  "    </br>"
    }

    function showUpdateToast() {
        _browser.storage.local.get('shouldShowUpdatePopup', function(result) {
            if (result.shouldShowUpdatePopup) {
                showToast(getUpdateToastBody(), 'shouldShowUpdatePopup');
            }
        });
    }

    function check_shouldShowDelayedRateToast() {
        _browser.storage.local.get('shouldShowDelayedRateToast', function(result) {
            if (result.shouldShowDelayedRateToast) {
                _browser.storage.local.get('tpInstallTime', function(result) {
                    if (result.tpInstallTime) {
                        if ((new Date().getTime() - result.tpInstallTime) / 1000 > 604800) {
                            _browser.storage.local.set({'shouldShowDelayedRateToast': false}, function() {

                            });
                            setTimeout(function () {
                                showToast(getDelayedRateToastBody(), 'shouldShowDelayedRateToast', true);
                            }, 30000)
                        }
                    }
                })
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

    function check_showSettingsAndAskNewPermissions() {
        _browser.storage.local.get('shouldShowSettingsAndAskNewPermissions', function(result) {
            if (result.shouldShowSettingsAndAskNewPermissions) {
                _browser.storage.local.set({'shouldShowSettingsAndAskNewPermissions': false}, function() {

                });
                setOptionsFromDB().then(
                    function (options){
                        showSettingsMenu();
                        if (result.shouldShowSettingsAndAskNewPermissions.includes("isPredictionsNotificationsEnabled")) {
                            checkForTwitchNotificationsPermissions('isPredictionsNotificationsEnabled');
                        }
                        if (result.shouldShowSettingsAndAskNewPermissions.includes('isClipDownloaderEnabled')) {
                            checkForTwitchClipsPermissions('isClipDownloaderEnabled');
                        }
                        if (result.shouldShowSettingsAndAskNewPermissions.includes('isYTsidebarEnabled')) {
                            checkForYTPermissions('isYTsidebarEnabled');
                        }
                    },
                    function (err){

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
        content.innerText = _i18n('fte_message');

        let closeBtn = document.createElement('div');
        closeBtn.classList.add('tp-fte-toast-close-btn');
        closeBtn.innerText = _i18n('fte_close_btn_text');

        closeBtn.onclick = function () {
            document.body.removeChild(container);
        };

        content.appendChild(closeBtn);
        container.appendChild(content);
        document.body.appendChild(container);
    }

    function check_import_tp_options_availability() {
        return new Promise((resolve, reject) => {
            if (!options.PREVIEWDIV_WIDTH) {
                return setOptionsFromDB().then(function (options) {
                    resolve(options);
                });
            } else {
                resolve(options);
            }
        })
    }

    function check_FTE() {
        _browser.storage.local.get('isFTE', function(result) {
            if (result.isFTE) {

                _browser.storage.local.set({'isFTE': false}, function() {});
                check_import_tp_options_availability().then(function () {
                    show_FTE();
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
        if(isInIframe()) {

            if (options.isErrRefreshEnabled) {
                listenForPlayerError();
            }

            if (isFirefox) {

            } else {
                if (options.isPipEnabled) {
                    setPIPBtn();
                }
            }

            if (options.isfScrnWithChatEnabled) {
                setfScrnWithChatBtn();
            }

            if (options.isCastEnabled) {
                appendCastBtn();
            }

            if (options.isFlashBangDefenderEnabled) {
                appendFlashBangDefenderBtn();
            }

            if (options.isRecordEnabled) {
                appendRecordBtn();
            }

            if (options.isScreenshotEnabled) {
                appendScreenShotBtn();
            }

            if (options.isFastForwardEnabled) {
                appendFastForwardBtn();
            }

            if (options.isSeekEnabled) {
                setSeekListeners();
            }

            let ttv_theater_mode_btn = document.querySelector('button[data-a-target="player-theatre-mode-button"]');
            if (ttv_theater_mode_btn) {
                ttv_theater_mode_btn.remove();
            }

            document.querySelector('body').prepend(document.querySelector('div[data-a-target="video-player"]'));
            document.querySelector('#root').remove();
            document.querySelector('.video-player__container').classList.remove('video-player__container--resize-calc');
            document.querySelector('video').muted = true;


            return;
        }


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
            setSideNavMutationObserver_for_sidebar_disappearing_followed_bug();
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
                extendSidebar().then(function (res) {});
            } catch (e) {

            }

        }

        if (options.isSidebarSearchEnabled) {
            try {
                document.querySelector('.side-bar-contents').addEventListener("mouseenter", showSidebarSearchBtn);
                if (!options.isSidebarFavoritesEnabled) {
                    showSidebarSearchBtn();
                }

            } catch (e) {

            }
        }

        if(isFirefox) {
            if (options.isPredictionsNotificationsEnabled || options.isPredictionsSniperEnabled) {
                setTimeout(function () {
                    if (window.location.pathname.indexOf('/moderator') === -1) {
                        setPredictionsNotifications();
                    }
                }, 2500)
            }
        } else {
            if (options.isPredictionsNotificationsEnabled || options.isPredictionsSniperEnabled) {
                if (window.location.pathname.indexOf('/moderator') === -1) {
                    setPredictionsNotifications();
                }
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

        if (options.isClipDownloaderEnabled) {
            appendClipDownloaderBtn();
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

        function sidebarExpandBtnClick(e) {
            if (options.isSidebarFavoritesEnabled) {
                setSidebarFavorites();
            }
            if (options.isYTsidebarEnabled) {
                setYTsidebar();
            }
            document.querySelector('.collapse-toggle').removeEventListener('click', sidebarExpandBtnClick);
        }

        if (options.isSidebarHideSectionsEnabled) {
            setTimeout(function () {
                hideSidebarSections();
            }, 1700);
        }

        if (options.isSidebarFavoritesEnabled) {
            setTimeout(function () {
                setSidebarFavorites();
                setSideNavMutationObserver();
                setSideNavMutationObserver_for_sidebar_disappearing_followed_bug();
                appendFavoritesBtn();
                if (!isFromTitleObserver) {
                    if (isNavBarCollapsed) {
                        document.querySelector('.collapse-toggle').addEventListener('click', sidebarExpandBtnClick);
                    }
                }
            }, 2000)
        }

        if (options.isYTsidebarEnabled) {
            setTimeout(function () {
                setYTsidebar();
                setSideNavMutationObserver();
                setSideNavMutationObserver_for_sidebar_disappearing_followed_bug();
                if (!isFromTitleObserver) {
                    if (isNavBarCollapsed) {
                        document.querySelector('.collapse-toggle').addEventListener('click', sidebarExpandBtnClick);
                    }
                }
            }, 2500)
        }

        if (options.isCastEnabled) {
            appendCastBtn();
        }

        if (options.isFlashBangDefenderEnabled) {
            appendFlashBangDefenderBtn();
        }

        if (options.isRecordEnabled) {
            appendRecordBtn();
        }

        if (options.isScreenshotEnabled) {
            appendScreenShotBtn();
        }

        if (options.isFastForwardEnabled) {
            appendFastForwardBtn();
        }

        if (options.isSeekEnabled) {
            setSeekListeners();
        }

        if (options.isClearChatEnabled) {
            append_clearChat_btn();
        }

        if (options.isIncognitoChatEnabled) {
            append_incognitoChat_btn();
        }

        if (options.isMuteAutoPlayersEnabled) {
            muteAutoplayingVideoElements();
        }
    }

    _browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

        if (msg.action === "tp_open_settings") {
            if (!isInIframe()) {
                sendResponse({action: 'content-available'});
                showSettings();
            }
        } else {
            if (msg.action === "tp_enable_clip_downloader") {
                sendResponse({action: 'response'});
                settings_clipDownloader_cb_on();
                let settingsContainer = document.getElementById('TPBodyEl');
                if (settingsContainer) {
                    checkForTwitchClipsPermissions('isClipDownloaderEnabled');
                }
            } else {
                if (msg.action === "tp_enable_YTsidebar") {
                    sendResponse({action: 'response'});
                    settings_YTsidebar_cb_on();
                    let settingsContainer = document.getElementById('TPBodyEl');
                    if (settingsContainer) {
                        checkForYTPermissions('isYTsidebarEnabled');
                    }
                }
            }
        }

    });

    ///////////////////////////////////////// SETTINGS /////////////////////////////////////////

    function settings_clipDownloader_cb_off() {
        let settingsContainer = document.getElementById('TPBodyEl');
        if (settingsContainer) {
            settingsContainer.querySelector('#TP_popup_clip_downloader_checkbox').checked = false;
        }
    }

    function settings_clipDownloader_cb_on() {
        let settingsContainer = document.getElementById('TPBodyEl');
        if (settingsContainer) {
            settingsContainer.querySelector('#TP_popup_clip_downloader_checkbox').checked = true;
        }
    }

    function settings_YTsidebar_cb_off() {
        let settingsContainer = document.getElementById('TPBodyEl');
        if (settingsContainer) {
            settingsContainer.querySelector('#TP_popup_YTsidebar_checkbox').checked = false;
        }
    }

    function settings_YTsidebar_cb_on() {
        let settingsContainer = document.getElementById('TPBodyEl');
        if (settingsContainer) {
            settingsContainer.querySelector('#TP_popup_YTsidebar_checkbox').checked = true;
        }
    }

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
                    if (featureName === "isClipDownloaderEnabled") {
                        checkForTwitchClipsPermissions(featureName);
                    } else {
                        if (featureName === "isYTsidebarEnabled") {
                            checkForYTPermissions(featureName);
                        } else {
                            changeFeatureMode(featureName,invertBool ? false : true);
                        }
                    }
                }
            } else {
                changeFeatureMode(featureName,invertBool ? true : false);
                if (featureName !== "isImagePreviewMode") {
                    settingsContainer.querySelector('#refreshChangeDivInfo').style.display = "block";
                    settingsContainer.querySelector('.tp_settings_switch_container').style.height = "532px";
                }
                if (featureName === "isClipDownloaderEnabled") {
                    sendMessageToBG({action: 'removeListenersForCd', detail: true});
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

    function set_settings_i18n(settingsContainer) {
        let items = settingsContainer.querySelectorAll('[tp_i18n]');
        items.forEach((item) => {
            item.innerText = _i18n(item.attributes.tp_i18n.value);
        })

        let items_html = settingsContainer.querySelectorAll('[tp_i18n_html]');
        items_html.forEach((item) => {
            item.innerHTML = _i18n(item.attributes.tp_i18n_html.value);
        })
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
            if (options.selected_lang !== 'en') {
                translateInfoBtn.style.display = 'none';
                return;
            }
            translateInfoBtn.src = getRuntimeUrl('images/translate.png');
            translateInfoBtn.title = geti18nMessage('translateStr');
            translateInfoBtn.addEventListener('click', (event) => {
                sendMessageToBG({action: "bg_translate_infoDiv", detail: 'https://translate.google.com/?sl=auto&tl=auto&text=' + encodeURIComponent(translateInfoBtn.parentNode.innerText) + '&op=translate'});
            });
        } catch (e) {

        }
    }

    function initSettingsImportExportFuncs(settingsContainer) {
        initSettingsInfoBtn(settingsContainer, 'TP_popup_settings_save_checkbox');
        initTranslateInfoDivBtn(settingsContainer, 'TP_popup_settings_save_checkbox');

        let settingsNameDictionary = {
            'tp_options': _i18n('settings_feature_import_export_settings'),
            'favorites_arr': _i18n('settings_feature_import_export_favorites'),
            'aps_streams_settings_obj': _i18n('settings_feature_import_export_aps_settings'),
            'multiStream_layout_presets': _i18n('settings_feature_import_export_multistream_layouts'),
        };

        function exportSettings(content, fileName, contentType) {
            let element = document.createElement('a');
            let file = new Blob([content], {type: contentType});
            element.setAttribute('href', URL.createObjectURL(file));
            element.setAttribute('download', fileName);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        function getSettingsFromStorage(storageName) {
            return new Promise((resolve, reject) => {
                _browser.storage.local.get(storageName, function(result) {
                    let settings = result[storageName];
                    resolve(settings);
                });
            })
        }

        function setSettingsToStorage(key, value) {
            return new Promise((resolve, reject) => {
                let obj = {};
                obj[key] = value;
                _browser.storage.local.set(obj, function(e) {
                    resolve('done');
                });
            })
        }

        function getSelectedSettings() {
            let selectedSettings = [];
            let selectedSettingsString = '';
            let checkboxes = settingsContainer.querySelectorAll('.tp_settings_save_selection_cb');
            for (let checkbox of checkboxes) {
                if (checkbox.checked) {
                    selectedSettings.push(checkbox.name);
                    selectedSettingsString += '\n- ' + settingsNameDictionary[checkbox.name];
                }
            }
            if (selectedSettings.length === 0) {
                alert(_i18n('settings_feature_import_export_no_selected_err_text'));
                return false;
            }
            return {selectedSettings: selectedSettings, selectedSettingsString: selectedSettingsString};
        }

        function getSettingsNamesForImport(loaded_settings) {
            let selectedSettings = [];
            let selectedSettingsString = '';
            let selectedSettingsObj = getSelectedSettings();

            selectedSettingsObj.selectedSettings.forEach(function(key,index) {
                if (Object.prototype.hasOwnProperty.call(loaded_settings, key)) {
                    selectedSettings.push(key);
                    selectedSettingsString += '\n- ' + settingsNameDictionary[key];
                }
            });

            return {selectedSettings: selectedSettings, selectedSettingsString: selectedSettingsString};
        }

        settingsContainer.querySelector('#TP_popup_settings_import_btn').onclick = function (e) {
            let selectedSettingsObj = getSelectedSettings();
            if (!selectedSettingsObj) {
                return;
            }
            settingsContainer.querySelector('#TP_popup_settings_import_btn_input').click();
        };

        settingsContainer.querySelector('#TP_popup_settings_import_btn_input').onchange = function (e) {
            let reader = new FileReader();
            reader.onload = function(e1) {

                let loaded_settings = JSON.parse(e1.target.result);
                let selectedSettingsForImportObj = getSettingsNamesForImport(loaded_settings);
                let str = 'Twitch Previews Import & Override settings with: ' + e.target.files[0].name + '?' +
                    '\nImporting & overriding:' + selectedSettingsForImportObj.selectedSettingsString;

                if (confirm(str)) {
                    if (selectedSettingsForImportObj.selectedSettings.includes("tp_options")) {
                        _browser.runtime.sendMessage({action: "tp_settings_upgrade_db", detail: loaded_settings.tp_options}, function(response) {
                            setSettingsToStorage('tp_options', response.result.upgraded_options).then(function (res) {
                                let new_permissions_ask_arr = [];
                                if (loaded_settings.tp_options.isPredictionsNotificationsEnabled) {
                                    new_permissions_ask_arr.push('isPredictionsNotificationsEnabled');
                                }
                                if (loaded_settings.tp_options.isClipDownloaderEnabled) {
                                    new_permissions_ask_arr.push('isClipDownloaderEnabled');
                                }
                                if (loaded_settings.tp_options.isYTsidebarEnabled) {
                                    new_permissions_ask_arr.push('isYTsidebarEnabled');
                                }

                                delete loaded_settings.tp_options;
                                selectedSettingsForImportObj.selectedSettings = selectedSettingsForImportObj.selectedSettings.filter(e => e !== 'tp_options');

                                selectedSettingsForImportObj.selectedSettings.reduce((p, x) => setSettingsToStorage(x, loaded_settings[x])
                                    .then(res => {}), Promise.resolve())
                                    .then(lastResult => {
                                        _browser.storage.local.set({'shouldShowSettingsAndAskNewPermissions': new_permissions_ask_arr}, function() {
                                            location.replace(window.location);
                                        });
                                    });
                            });
                        });
                    } else {
                        selectedSettingsForImportObj.selectedSettings.reduce((p, x) => setSettingsToStorage(x, loaded_settings[x])
                            .then(res => {}), Promise.resolve())
                            .then(lastResult => {
                                _browser.storage.local.set({'shouldShowSettings': true}, function() {
                                    location.replace(window.location);
                                });
                            });
                    }
                }
                settingsContainer.querySelector('#TP_popup_settings_import_btn_input').value = null;
            }
            reader.onerror = function(e) {
                alert('An error occurred: ' + e.getMessage());
            }
            reader.readAsText(e.target.files[0]);
        };

        settingsContainer.querySelector('#TP_popup_settings_export_btn').onclick = function (e) {
            let selectedSettingsObj = getSelectedSettings();
            if (!selectedSettingsObj) {
                return;
            }
            if (confirm('Twitch Previews selected settings for export:' + selectedSettingsObj.selectedSettingsString + '\n\nExport?')) {
                let export_obj = {};

                selectedSettingsObj.selectedSettings.reduce((p, x) => getSettingsFromStorage(x)
                    .then(res => {
                        let isResUndefined = typeof res === "undefined";
                        if (isResUndefined) {
                            res = false;
                        }
                        export_obj[x] = res;
                    }), Promise.resolve()).then(lastResult => {
                    let dateStr = new Date().toISOString().split('.')[0].replace('T', '_').replace(':', '-').split(':')[0];
                    let manifestData = _browser.runtime.getManifest();
                    let appVer = "v" + manifestData.version;
                    exportSettings(JSON.stringify(export_obj), 'twitch_previews_' + appVer + '_settings_' + dateStr + '.json', 'application/json');
                });
            }
        };
    }

    function initLangSelector(settingsContainer) {
        let lang_selector = settingsContainer.querySelector('#tp_settings_lang_selector');

        _tp_i18n.i18n.availableLangs[0].forEach((lang) => {
            let option_el = document.createElement('option');
            option_el.value = lang.code;
            option_el.innerText = lang.display_str;
            if (lang.code === options.selected_lang) {
                option_el.selected = true;
            }

            lang_selector.appendChild(option_el);
        })

        lang_selector.addEventListener('change', (event) => {
            changeFeatureMode('selected_lang', event.target.value);
            _browser.storage.local.set({'shouldShowSettings': true}, function() {
                location.replace(window.location);
            });
        });
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

            let minimize_settings_btn = settingsContainer.querySelector('#tp_settings_minimize_btn');
            minimize_settings_btn.addEventListener('click', (event) => {
                if (settingsContainer.classList.contains('tp-settings-minimized')) {
                    settingsContainer.classList.remove('tp-settings-minimized');
                } else {
                    settingsContainer.classList.add('tp-settings-minimized');
                }
            });

            settingsContainer.querySelector('#TP_popup_title_logo').src = getRuntimeUrl('images/TP96.png');
            settingsContainer.querySelector('#TP_popup_logo').src = getRuntimeUrl('images/TP96.png');
            settingsContainer.querySelector('#tp_popup_donate_btn_img').src = getRuntimeUrl('images/donate_heart.png');
            settingsContainer.querySelector('#tp_fScrnWithChat_img').src = getRuntimeUrl('images/fScrnWithChat_main.png');
            settingsContainer.querySelector('#tp_pip_img').src = getRuntimeUrl('images/pip.png');
            settingsContainer.querySelector('#tp_multiStream_img').src = getRuntimeUrl('images/multistream.png');
            settingsContainer.querySelector('#tp_multiStream_chat_img').src = getRuntimeUrl('images/multistream_chat.png');

            initCheckbox(settingsContainer, 'isSidebarPreviewsEnabled', 'TP_popup_sidebar_previews_checkbox', false);
            settingsContainer.querySelector('#TP_popup_preview_mode_toggle_btn_data_span').attributes['data-on'].value = _i18n('settings_feature_preview_mode_data_on');
            settingsContainer.querySelector('#TP_popup_preview_mode_toggle_btn_data_span').attributes['data-off'].value = _i18n('settings_feature_preview_mode_data_off');
            initCheckbox(settingsContainer, 'isImagePreviewMode', 'TP_popup_preview_mode_checkbox', true);
            initCheckbox(settingsContainer, 'isDirpEnabled', 'TP_popup_directory_preview_mode_checkbox', false);
            initCheckbox(settingsContainer, 'isSelfPreviewEnabled', 'TP_popup_self_previews_checkbox', false);
            initTextInputValue(settingsContainer, 'selfPreviewStreamName', 'TP_popup_self_preview_input');
            initCheckbox(settingsContainer, 'isChannelPointsClickerEnabled', 'TP_popup_channel_points_checkbox', false);
            initCheckbox(settingsContainer, 'isSidebarExtendEnabled', 'TP_popup_sidebar_extend_checkbox', false);
            initCheckbox(settingsContainer, 'isSidebarFavoritesEnabled', 'TP_popup_sidebar_favorites_checkbox', false);
            initCheckbox(settingsContainer, 'sidebarFavorites_hide_originals', 'TP_popup_sidebar_favorites_hide_originals_checkbox', false);
            initCheckbox(settingsContainer, 'isSidebarSearchEnabled', 'TP_popup_sidebar_search_checkbox', false);
            initCheckbox(settingsContainer, 'isSidebarHideSectionsEnabled', 'TP_popup_sidebar_hide_sections_checkbox', false);
            initCheckbox(settingsContainer, 'isPvqcEnabled', 'TP_popup_pvqc_checkbox', false);
            initCheckbox(settingsContainer, 'isClipDownloaderEnabled', 'TP_popup_clip_downloader_checkbox', false);
            initCheckbox(settingsContainer, 'isYTsidebarEnabled', 'TP_popup_YTsidebar_checkbox', false);
            initCheckbox(settingsContainer, 'isMuteAutoPlayersEnabled', 'TP_popup_muteAutoPlayers_checkbox', false);
            initCheckbox(settingsContainer, 'isErrRefreshEnabled', 'TP_popup_err_refresh_checkbox', false);
            initCheckbox(settingsContainer, 'isfScrnWithChatEnabled', 'TP_popup_fScrnWithChat_checkbox', false);
            initCheckbox(settingsContainer, 'isPipEnabled', 'TP_popup_pip_checkbox', false);
            initCheckbox(settingsContainer, 'isScreenshotEnabled', 'TP_popup_screenshot_checkbox', false);
            initCheckbox(settingsContainer, 'isRecordEnabled', 'TP_popup_record_checkbox', false);
            initCheckbox(settingsContainer, 'isClearChatEnabled', 'TP_popup_clearChat_checkbox', false);
            initCheckbox(settingsContainer, 'isIncognitoChatEnabled', 'TP_popup_incognitoChat_checkbox', false);
            initCheckbox(settingsContainer, 'isFlashBangDefenderEnabled', 'TP_popup_flashBangDefender_checkbox', false);
            initCheckbox(settingsContainer, 'isFastForwardEnabled', 'TP_popup_fastForward_checkbox', false);
            initCheckbox(settingsContainer, 'isSeekEnabled', 'TP_popup_seek_checkbox', false);
            initCheckbox(settingsContainer, 'isCastEnabled', 'TP_popup_cast_checkbox', false);
            initCheckbox(settingsContainer, 'isMultiStreamEnabled', 'TP_popup_multiStream_checkbox', false);
            initCheckbox(settingsContainer, 'isAdvancedVideoEmbedsEnabled', 'TP_popup_AdvancedVideoEmbeds_checkbox', false);
            initCheckbox(settingsContainer, 'isPredictionsNotificationsEnabled', 'TP_popup_predictions_notifications_checkbox', false);
            initCheckbox(settingsContainer, 'isPredictionsSniperEnabled', 'TP_popup_predictions_sniper_checkbox', false);
            initNumInputValue(settingsContainer, 'aps_percent', 'TP_popup_aps_percent_input', 0);
            initNumInputValue(settingsContainer, 'aps_max_points', 'TP_popup_aps_max_points_input', 0);
            initNumInputValue(settingsContainer, 'aps_min_vote_margin_percent', 'TP_popup_aps_min_vote_margin_percent_input', 0);
            initNumInputValue(settingsContainer, 'aps_secondsBefore', 'TP_popup_aps_secondsBefore_input', 2);

            initSettingsImportExportFuncs(settingsContainer);

            initLangSelector(settingsContainer);
            set_settings_i18n(settingsContainer);

            if (isFirefox) {
                let els = settingsContainer.querySelectorAll('.tp-firefox-hide');
                for (let i = 0; i < els.length; i++) {
                    els[i].style.display = "none";
                }
                settingsContainer.querySelector('#tp_settings_first_section_title').style.marginTop = '4px';
            } else {
                let els = settingsContainer.querySelectorAll('.tp-chrome-hide');
                for (let i = 0; i < els.length; i++) {
                    els[i].style.display = "none";
                }
            }

            initPreviewSizeSlider(settingsContainer);

            initSocialBtn(settingsContainer, 'donate', true);
            initSocialBtn(settingsContainer, 'rate', true);
            initSocialBtn(settingsContainer, 'share', true);

            initSocialBtn(settingsContainer, 'github', true);
            initSocialBtn(settingsContainer, 'bugReport', true);
            initSocialBtn(settingsContainer, 'changelog', false);
            initSocialBtn(settingsContainer, 'contact', false);
            initSocialBtn(settingsContainer, 'twitter', true);


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

        check_import_tp_options_availability().then(function () {
            showSettingsMenu();
        });
    }

    ///////////////////////////////////////// END OF SETTINGS /////////////////////////////////////////

    window.addEventListener('load', (event) => {
        if (window.location.href.indexOf('twitch.tv/embed/') > -1) {
            setOptionsFromDB().then(
                function (options){
                    if (options.isChannelPointsClickerEnabled) {
                        setChannelPointsClickerListeners();
                    }
                    if (options.isClearChatEnabled) {
                        append_clearChat_btn();
                    }

                    if (options.isIncognitoChatEnabled) {
                        append_incognitoChat_btn();
                    }
                },
                function (err){

                });
            return;
        }
        setTimeout(function(){

            if (isInIframe()) {
                setOptionsFromDB().then(
                    function (options){
                        toggleFeatures();
                    },
                    function (err){

                    });
                return;
            }

            ga_heartbeat();
            appendContainer = document.body;
            let sidenav = document.getElementById('sideNav');
            if (sidenav) {
                sidenav.style.zIndex = '10';
            }
            setOptionsFromDB().then(
                function (options){
                    ga_report_appStart();
                    toggleFeatures();
                    setTimeout(function (){
                        setTitleMutationObserver();
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
            if (!isInIframe()) {
                refreshPageOnMainTwitchPlayerError(true);
            }
        }
        setOptionsFromDB().then(
            function (options){
                toggleFeatures();
            },
            function (err){

            });
    }

    ///////////// END OF TAB RESUME /////////////
    if (!isInIframe()) {
        check_showSettings();
        check_showSettingsAndAskNewPermissions();
        check_FTE();
        check_multistream_start();
        check_cast_start();
        check_shouldShowDelayedRateToast();
    }

})();