async function main() {

    let isFirefox = typeof browser !== "undefined";
    let _browser = isFirefox ? browser : chrome;
    let options = {};
    let recording_url_obj = {};

    const _tp_i18n = await import(_browser.runtime.getURL("./main/tp_i18n.js")).then((res) => {
        _browser.storage.local.get('tp_options', function(result) {
            options = result.tp_options;
            let items = document.querySelectorAll('[tp_i18n]');
            items.forEach((item) => {
                item.innerText = res.i18n[item.attributes.tp_i18n.value][options.selected_lang];
            })
        });
    });


    document.getElementById('tp_open_player_btn').addEventListener('click', function (e) {
        _browser.runtime.sendMessage({action: 'bg_open_record_playback_player', detail: ""}, function(response) {

        });
    });
    document.getElementById('tp_download_clip_btn').addEventListener('click', function (e) {
        let a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = recording_url_obj.url;
        a.download = recording_url_obj.stream_name + ' - ' + new Date(document.getElementById('vid').duration * 1000).toISOString().substr(14, 5).replace(':','-').replace('00-','') + 's.webm';
        a.click();
        window.URL.revokeObjectURL(recording_url_obj.url);
        a.remove();
    })

    _browser.storage.local.get('record_url', function(result) {
        if (result.record_url) {
            recording_url_obj = result.record_url;
            _browser.storage.local.set({'record_url': null}, function() {});
            window.addEventListener('beforeunload', function () {
                window.URL.revokeObjectURL(recording_url_obj.url);
            });

            let video = document.getElementById('vid');
            video.volume = 0.1;
            video.preload = "metadata";
            video.src = recording_url_obj.url;

            video.addEventListener("loadedmetadata", async function () {
                while (video.duration === Infinity) {
                    await new Promise(r => setTimeout(r, 1000));
                    video.currentTime = 10000000 * Math.random();
                }
                video.currentTime = 0;
            })
        }
    });
}
main().then();