'use strict';

const style = document.createElement('style');
style.textContent = `
.art-layer-autoPlayback {
    display: none !important;
}
.art-control-fullscreenWeb {
    display: none !important;
}
#popup div:first-child {
    width: 100%;
}
.video-list-button {
    z-index: 1000;
    margin-left: 30px;
    border: 0px solid;
    border-radius: 50%;
    padding: 2px;
}
.video-list-button:hover {
    transform: scale(1.2);
}
#video-list {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    user-select: none;
}
#video-list li {
    min-width: 165px;
    width: 18%;
    border-radius: 6px;
    margin: auto;
    position: relative;
    overflow: hidden;
}
#video-list .list-item:hover {
    background-color: rgba(256, 256, 256, 0.2);
}
#video-list li .side-box {
    width: 20%;
    position: absolute;
    top: 0;
    right: -20%;
    background: #fff;
    color: red;
    font-size: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
}

#video-list .cover-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: #000;
    border-radius: 6px;
    width: 100%;
    position: relative;
}
#video-list .cover-box img {
    vertical-align: middle;
    width: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 6px;
}
#video-list .cover-box .progress-bar {
    position: absolute;
    bottom: 0;
    height: 3px;
    background-color: orangered;
    border-radius: 2px;
}
#video-list .name-box{
    word-break: break-all;
    height: 3em;
    width: 100%; /* 设置 div 的宽度 */
    overflow: hidden; /* 隐藏溢出部分 */
    text-overflow: ellipsis; /* 使用省略号表示溢出部分 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    text-align: center;
}
@media screen and (max-width: 768px) {
    #video-list {
        font-size: 12px;
    }
}
`;
document.head.appendChild(style);

const $ = (selector) => {
    return document.querySelector(selector)
}

class ViewingHistory {
    constructor() {
        this._history = JSON.parse(window.localStorage.getItem('viewing-history')) || [];
        this.init()
    }

    get history() {
        const data = JSON.parse(window.localStorage.getItem('viewing-history'))
        return data.filter(item => !item.isDelete)
    }
    set history(value) {
        value.sort((a, b) => b.modified - a.modified)
        // this._history = JSON.parse(localStorage.getItem('viewing-history')) || [];
        window.localStorage.setItem('viewing-history', JSON.stringify(value, null, 4));
        this._history = value;
    }
    get syncTime() {
        return window.localStorage.getItem('viewing-history-sync-time')
    }

    set syncTime(value) {
        window.localStorage.setItem('viewing-history-sync-time', value)
    }

    update(item) {
        item.modified = Date.now()
        const temp = this.history
        //如果数组中不存在该对象则新增，否则修改
        const existingItemIndex = temp.findIndex(currentValue => currentValue.path === item.path);
        if (existingItemIndex === -1) {
            temp.push(item);
        } else {
            // 存在则修改
            if (!temp[existingItemIndex].isDelete) {
                temp[existingItemIndex] = item;
            }
        }
        this.history = temp
    }

    search(path) {
        return this.history.find(item => {
            return item.path === path
        })
    }


    clear(path) {
        this.history = this.history.map(item => {
            if (item.path === path) {
                return {
                    ...item,
                    isDelete: true,
                    modified: Date.now()
                }
            } else {
                return item
            }
        })
    }

    async sync() {
        //正在同步用黑色
        const button = $('.header-left .hope-image:last-child');
        button && (button.style.borderColor = '#000');
        let origin = await fetch(`/p/Onedrive/backups/history_data.json?sign=76IHghbPpbXQ6yaUzbVYvZ02ensaWGktcAqgUsSnwPw=:0&ts=1702308252797&timestamp=${Date.now()}}`, {
            method: 'GET',
            headers: {
                // 根据需要设置请求头部
            }
        })
            .then(response => {
                if (!response.ok || response.status !== 200) {
                    throw new Error('Network response was not ok');
                }
                return response.text(); // 或者使用 response.text()，根据服务器返回的数据类型
            })
            .then(data => {
                return data
            })
            .catch(error => {
                console.error('GET request failed:', error);
                return null
            });
        if (!origin) return -1
        origin = JSON.parse(origin)
        const origin_data = origin
        //数据没更新则不处理
        let merge_data = [];
        try {
            let all_history = this._history;
            if (JSON.stringify(origin_data) === JSON.stringify(all_history, null, 4)) {
                console.log('没有更新', origin_data)
                return 0
            }
            //把远程数据转成map
            const merge_data_map = origin_data.reduce((map, item) => {
                map.set(item.path, item);
                return map;
            }, new Map());
            //把本地数据合并到远程
            for (const item of all_history) {
                if (item.modified > this.syncTime) {

                    const merge_get = merge_data_map.get(item.path);
                    if (!merge_get) {
                        !item.isDelete && merge_data_map.set(item.path, item)
                        //删除的数据只保留几项必要的数据
                        item.isDelete && merge_data_map.set(item.path, {
                            path: item.path,
                            modified: item.modified,
                            isDelete: item.isDelete,
                        })
                    } else if (item.modified > merge_get.modified) {
                        //不管删除修改还是更新都保留最新的操作
                        !item.isDelete && merge_data_map.set(item.path, item);
                        item.isDelete && merge_data_map.set(item.path, {
                            path: item.path,
                            modified: item.modified,
                            isDelete: item.isDelete,
                        });
                    }
                }
            }
            merge_data = [...merge_data_map.values()]
        } catch (e) {
            console.log(e)
            return -1
        }

        // 上传数据
        const upload_data = JSON.stringify(merge_data, null, 4); // 要发送的数据
        const res = await fetch('/api/fs/put', {
            method: 'PUT',
            headers: {
                'Authorization': window.localStorage.getItem('token'),
                'File-Path': encodeURIComponent('/Onedrive/backups/history_data.json'),
                'As-Task': true,
                'Content-Type': 'application/json;charset=UTF-8',
                'Content-Length': upload_data.length
            },
            body: upload_data,
        })
            .then(response => {
                if (!response.ok || response.status !== 200) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // 或者使用 response.json()，根据服务器返回的数据类型
            })
            .then(data => {
                if (data.code !== 200) {
                    throw new Error(data);
                }
                this.syncTime = Date.now()
                this.history = merge_data.filter(item => !item.isDelete)
                const button = $('.header-left .hope-image:last-child');
                button && (button.style.borderColor = 'orangered');
                return data
            })
            .catch(error => {
                console.error('PUT request failed:', error);
                return { code: 500 }
            });
        // 每五分钟与服务器同步一次数据
        setTimeout(() => {
            this.sync()
        }, 5 * 60 * 1000)
        return res.code === 200 ? 1 : -1
    }

    //初始化
    init() {
        this.sync()
    }

}



class ViewUI {
    static _popupVisible = false;
    static async getVideoShot(video) {
        try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = parseInt(video.videoWidth / 10)
            canvas.height = parseInt(video.videoHeight / 10)
            await ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const data = await canvas.toDataURL('image/png')
            return data
        } catch (err) {
            console.log('获取截图失败', err)
            return null
        }
    }
    static elementFn(dom, fn) {
        dom.parentNode.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            dom.style.right ? (dom.style.right = null) : (dom.style.right = '0px');
            //一个控制器，用来移除监听
            const controller = new AbortController()
            document.addEventListener('click', (e) => {
                if (dom.contains(e.target)) {
                    fn()
                } else if (!dom.contains(e.target)) {
                    dom.style.right = null;
                    controller.abort()
                }
            }, { signal: controller.signal });
        });


        //移动端
        let startX = 0;
        dom.parentNode.addEventListener('touchstart', (event) => {
            if (dom.parentNode.contains(event.target)) {
                // 记录触摸起始点的X坐标
                startX = event.touches[0].clientX;
                if (dom.contains(event.target)) {
                    startX = 0;
                    setTimeout(() => {
                        fn()
                    }, 200)
                }
            } else if (!dom.parentNode.contains(event.target)) {
                startX = 0;
            }
        });
        dom.parentNode.addEventListener('touchmove', (event) => {
            // 计算触摸移动的距离
            var deltaX = startX - event.touches[0].clientX;

            // 如果移动距离大于一定阈值，认为是右滑动
            if (deltaX > 60) {
                // 触发右滑动事件，你可以在这里执行相应的操作
                dom.style.right = '0'
            } else if (deltaX < -60) {
                // 触发左滑动事件，你可以在这里执行相应的操作
                dom.style.right = null
            }
        });

    }

    constructor() {
        this.viewingHistory = new ViewingHistory();
        this.init();
    }

    get popupVisible() {
        return ViewUI._popupVisible;
    }
    //修改popupVisible时触发
    set popupVisible(value) {
        const popup = $('#popup');
        if (value) {
            this.createPopup();
            $('#root > div + div > div').style.display = 'none';
            $('.header-left .hope-image:last-child').style.borderWidth = '2px'
        } else {
            !!popup && ($('#popup').remove());
            $('.header-left .hope-image:last-child').style.borderWidth = '0px'
            $('#root > div + div > div').removeAttribute('style');
        }
        ViewUI._popupVisible = value;
    }

    init() {
        //使用一个立即执行函数重写history.pushState/replaceState，加入回调函数以便监听
        ; ((callback) => {
            ['replaceState'].forEach((item) => {
                const prevHistoryFn = window.history[item];
                window.history[item] = (...args) => {
                    const ret = prevHistoryFn.apply(window.history, args);
                    setTimeout(() => {
                        this.popupVisible = false;
                        callback.apply(this, args);
                    }, 0);
                    return ret;
                }
            })
        })(this.checkVideo)

        this.createButton();
        this.checkVideo();

    }

    //创建按钮
    createButton() {
        const button = document.createElement('img');
        button.setAttribute('class', 'video-list-button hope-image hope-c-PJLV hope-c-PJLV-iktMgsV-css')
        button.src = '/images/infuse.webp'

        // 等待logo加载后添加按钮到页面
        const observer = new MutationObserver((mutations, observer) => {
            if (!!$('.header-left')) {
                observer.disconnect()
                $('.header-left').appendChild(button);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        button.addEventListener('click', () => {
            this.popupVisible = !this.popupVisible
        });
    }

    //创建弹窗
    createPopup() {
        $('#popup') && ($('#popup').remove());
        const popup = document.createElement('div');
        popup.id = 'popup';
        popup.setAttribute('class', 'body hope-stack hope-c-dhzjXW hope-c-PJLV hope-c-PJLV-iiHckfM-css')
        popup.style.cssText = `
            background-color: rgba(256,256,256,.2);
            backdrop-filter: blur(8px);
            border-radius: 8px;
        `
        $('#root > div + div').appendChild(popup);


        // 创建一个列表
        const ul = document.createElement('ul');
        ul.id = 'video-list';  // 列表的id，你可以根据需要自行更改
        // 将列表添加到弹窗中
        const box = document.createElement('div')
        box.appendChild(ul);
        popup.appendChild(box);

        // 遍历times对象并提取视频路径字符串
        for (const item of this.viewingHistory.history) {
            // 创建列表项
            const li = document.createElement('li');

            const link = document.createElement('a');
            // link.setAttribute('target', '_blank');
            link.setAttribute('class', 'list-item')
            link.insertAdjacentHTML('beforeend', `
            <div class="cover-box">
                <img class="cover" src="${item.shot}"/>
                <div class="progress-bar"></div>
            </div>
            <div class="name-box">
                ${item.name}
            </div>
            `)
            const progress = item.current_time / item.duration * 100;
            progress > 3 && (link.querySelector('.progress-bar').style.width = `${progress.toFixed(2)}%`)

            if (item.path.split('?')[0] === decodeURIComponent(window.location.pathname)) {
                link.addEventListener('click', () => {
                    this.popupVisible = false;
                    this.checkVideo();
                }, { once: true })
            }
            link.href = `${item.path}?video_times=${item.current_time}`;  // 设置链接的href为视频路径
            // 将链接添加到列表项中
            li.appendChild(link);
            li.insertAdjacentHTML('beforeend', `
            <div class="side-box">
                <svg fill="currentColor" stroke-width="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" class="hope-icon hope-c-XNyZK hope-c-PJLV hope-c-PJLV-idsFsIa-css" height="1em" width="1em" style="overflow: visible;"><path fill="currentColor" fill-opacity="0.6" d="M292.7 840h438.6l24.2-512h-487z"></path><path d="M864 256H736v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zm-504-72h304v72H360v-72zm371.3 656H292.7l-24.2-512h487l-24.2 512z"></path></svg>
            </div>
            `)
            ViewUI.elementFn(li.querySelector('.side-box'), () => {
                this.viewingHistory.clear(item.path)
                li.querySelector('.side-box').parentNode.remove()
            })

            // 将列表项添加到列表中
            ul.appendChild(li);
            link.querySelector('img').style.height = parseInt(link.querySelector('img').offsetWidth) * 9 / 16 + 'px'
            li.querySelector('.side-box').style.height = link.querySelector('img').style.height
            !item.shot && (link.querySelector('img').style.visibility = 'hidden')
        }
        ul.insertAdjacentHTML('beforeend', `
        <li class="empty"></li>
        <li class="empty"></li>
        <li class="empty"></li>
        <li class="empty"></li>
        `)


    }

    checkVideo() {
        //通过正则判断url是否以MP4、mkv结尾
        const re = /\.(mp4|mkv|avi|mov|rmvb|webm|flv)$/
        if (!re.test(window.location.pathname)) return
        //获取url参数
        const paramsStr = window.location.search
        const params = new URLSearchParams(paramsStr)
        let video_times = params.get('video_times')
        const path = decodeURI(window.location.pathname)
        //如果没从历史记录中进来且有记录则不处理
        if (!video_times && !!this.viewingHistory.search(path)) return

        //等待播放器加载
        const observer = new MutationObserver((mutations, observer) => {
            if (!!$('.art-video')) {
                observer.disconnect()
                const myVideo = $('.art-video')
                myVideo.setAttribute('crossorigin', 'anonymous');
                myVideo.src = myVideo.src
                //构造当前对象数据
                const currentVideo = {
                    name: path.split('/').pop(),
                    modified: 0,
                    path: path,
                    duration: 0,
                    current_time: 0,
                    last_time: video_times || 0,
                    shot: null,
                }
                //视频元数据加载后
                myVideo.addEventListener('loadedmetadata', () => {
                    myVideo.removeAttribute('crossorigin');

                }, { once: true })
                //进度条跳转
                if (!!video_times) {
                    myVideo.addEventListener('canplay', () => {
                        const cur = this.viewingHistory.search(path)
                        video_times = cur ? cur.current_time : 0
                        myVideo.currentTime = parseInt(video_times)
                        myVideo.play().catch((e) => {
                            console.log(e)
                        })
                    }, { once: true })
                }
                let startTime = Date.now()
                myVideo.addEventListener('timeupdate', async () => {
                    //存储进度，每十秒存一次
                    if (Date.now() - startTime > 3000) {
                        startTime = Date.now()
                        currentVideo.duration = myVideo.duration
                        const screenshot = await ViewUI.getVideoShot(myVideo)
                        currentVideo.current_time = myVideo.currentTime
                        currentVideo.shot = screenshot
                        //更新历史记录
                        !!this.viewingHistory && this.viewingHistory.update(currentVideo)
                    }
                })
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

; (function () {
    const UI = new ViewUI()
})()