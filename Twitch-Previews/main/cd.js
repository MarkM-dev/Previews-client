(function () {
    if (document.getElementById('tp_clip_download_btn')) {
        return;
    }
    setTimeout(function () {
        let video = document.querySelector('video');
        if (video && video.src.indexOf('.mp4?') > -1) {
            try {
                let append_containers = document.querySelectorAll('.player-controls__right-control-group');
                if (append_containers.length) {
                    let btn_container = document.createElement('div');
                    btn_container.id = "tp_clip_download_btn";
                    btn_container.classList.add('tp-player-control');
                    btn_container.title = "Download Clip";

                    btn_container.style.width = "3rem";
                    btn_container.style.height = "3rem";
                    btn_container.style.zIndex = "1";

                    btn_container.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 20 20" height="100%" width="70%" xmlns="http://www.w3.org/2000/svg">' +
                        '<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 ' +
                        '1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';

                    btn_container.onclick = function (){
                        let video_el = document.querySelector('video');
                        if (video_el && video_el.src.indexOf('.mp4?') > -1) {
                            /*let element = document.createElement('a');
                            element.setAttribute('href', 'data:video/mp4;mp4,' + encodeURIComponent(video_el.src));
                            element.setAttribute('download', document.title);
                            element.style.display = 'none';
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);*/

                            let isFirefox = typeof browser !== "undefined";
                            let _browser = isFirefox ? browser : chrome;
                            _browser.runtime.sendMessage({action: "bg_clip_download_btn_click", detail: video_el.src}, function(response) {

                            });
                        } else {
                            document.getElementById('tp_clip_download_btn').remove();
                            alert('no clip found');
                        }
                    }
                    append_containers[append_containers.length - 1].firstChild.before(btn_container);
                    if (append_containers.length > 1) {
                        append_containers[append_containers.length - 2].style.opacity = '0';
                    }
                }
            } catch (e) {
                console.log(e)
            }
        }
    }, 3000);
})()
