(function () {
    'use strict';
    const message = "这是一个简体中文字符串";
    let popupVisible = false; // 弹窗可见状态

    // 创建按钮
    function createButton() {
        const button = document.createElement('img');
        button.setAttribute('class', 'hope-image hope-c-PJLV hope-c-PJLV-iktMgsV-css')
        button.src = '/images/infuse.webp'
        button.style.cssText = `
            z-index: 1000;
            margin-left: 30px;
            border: 3px solid #ef882f;
            border-radius: 50%;
            padding: 2px;
        `
        // 添加按钮到页面
        const t = setInterval((i = 0) => {
            if (!!document.querySelector('.header-left')) {
                clearInterval(t)
                document.querySelector('.header-left').appendChild(button)
            } else if (i >= 200) {
                clearInterval(t)
                console.log('none')
            }
            i++
        }, 300);

        // 按钮点击事件
        button.addEventListener('click', togglePopup);

        //鼠标按下时放大按钮,松开时恢复
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(1.2)';
        });
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });
        //给按钮加一个长按进度条

    }
    // 创建或关闭弹窗
    function togglePopup() {
        if (popupVisible) {
            closePopup();
        } else {
            showPopup();
        }
    }
    // 创建弹窗
    function createPopup() {
        const popup = document.createElement('div');
        popup.id = 'popup';
        popup.setAttribute('class', 'body hope-stack hope-c-dhzjXW hope-c-PJLV hope-c-PJLV-iiHckfM-css')
        popup.style.cssText = `
            background-color: rgba(256,256,256,.2);
            backdrop-filter: blur(8px);
            border-radius: 8px;
        `
        document.querySelector('#root > div + div').appendChild(popup);

        // 读取LocalStorage中的值
        const artplayerSettings = localStorage.getItem('artplayer_settings');
        const settings = JSON.parse(artplayerSettings);

        // 创建一个列表
        const ul = document.createElement('ul');
        ul.id = 'video-list';  // 列表的id，你可以根据需要自行更改

        // 遍历times对象并提取视频路径字符串
        for (const key in settings.times) {
            if (settings.times.hasOwnProperty(key)) {
                const videoPath = key;

                // 创建列表项
                const li = document.createElement('li');

                const link = document.createElement('a');
                link.setAttribute('target', '_blank');
                link.setAttribute('class', 'list-item hope-stack hope-c-dhzjXW hope-c-PJLV hope-c-PJLV-ikoJJtX-css')
                const name = document.createElement('p')
                name.setAttribute('class', 'name-box hope-stack hope-c-dhzjXW hope-c-PJLV hope-c-PJLV-ibXlJvp-css')
                name.textContent = videoPath.split('/').pop();
                const modified = document.createElement('p')
                name.setAttribute('class', 'modified hope-stack hope-c-dhzjXW hope-c-PJLV hope-c-PJLV-ibXlJvp-css')
                modified.textContent = settings.times[videoPath];
                link.appendChild(name);
                link.appendChild(modified);
                link.href = `${videoPath}?video_times=${settings.times[videoPath]}`;  // 设置链接的href为视频路径

                // 将链接添加到列表项中
                li.appendChild(link);

                // 将列表项添加到列表中
                ul.appendChild(li);
            }
        }

        // 将列表添加到弹窗中
        popup.appendChild(ul);
    }

    // 显示弹窗
    function showPopup() {
        const popup = document.getElementById('popup');
        if (!!popup) {
            //显示弹窗
            popup.style.display = 'block';
        } else {
            createPopup();
        }
        document.querySelector('#root > div + div > div').style.display = 'none'
        document.querySelector('.header-left .hope-image:last-child').style.border = '2px'
        popupVisible = true;
    }

    // 关闭弹窗
    function closePopup() {
        const popup = document.getElementById('popup');
        if (popup) {
            popup.style.display = 'none';
        }
        document.querySelector('.header-left .hope-image:last-child').style.border = '0px'
        document.querySelector('#root > div + div > div').removeAttribute('style')
        popupVisible = false;
    }
    // 在页面加载后创建按钮
    window.addEventListener('load', () => {
        createButton()
        //获取url参数
        const paramsStr = window.location.search
        const params = new URLSearchParams(paramsStr)
        const seconds = parseInt(params.get('video_times'))

        //检查是否有视频加载，没有则等待
        if (!!seconds && document.getElementsByTagName('video').length) {
            //进度条跳转
            let myVideo = document.getElementsByTagName("video")[0]
            if (seconds) {
                myVideo.currentTime = seconds
                myVideo.play()
            }
        } else if (!!seconds) {
            //等待播放器加载
            let wait_video_interval = setInterval(() => {
                if (document.getElementsByTagName('video').length) {
                    clearInterval(wait_video_interval)
                    //进度条跳转
                    let myVideo = document.getElementsByTagName("video")[0]
                    if (seconds) {
                        myVideo.currentTime = seconds
                        myVideo.play()
                    }
                    myVideo.addEventListener('play', () => {
                        console.log('播放中', myVideo.currentTime, myVideo)
                    })
                    let startTime = Date.now()
                    myVideo.addEventListener('timeupdate', () => {
                        // console.log('timeupdate', myVideo.currentTime, myVideo)
                        //存储进度，每十秒存一次
                        if(Date.now() - startTime > 10000) {
                            console.log('timeupdate', myVideo.currentTime, myVideo)
                            startTime = Date.now()
                        }
                    })
                }
            }, 500);
        }

    });
})();