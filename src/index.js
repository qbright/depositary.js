/**
 * Created by zhengqiguang on 2017/4/11.
 */

(function (window, undefined) {

    var headTarget = document.getElementsByTagName("head")[0];
    var Promise = function () { //sample promise
        this.thens = [];
    }
    Promise.prototype = {
        constructor: Promise,
        resolve: function () {
            var t = this.thens.shift(), n;
            t && (n = t.apply(null, arguments), n instanceof Promise && (n.thens = this.thens));
        },
        then: function (n) {
            this.thens.push(n);
            return this;
        }
    }

    var asyncLoadParallel = function (objSet, callBackHandler, finishCallBack, index, passData) { //like async.map parallel
        !index && (index = 0);
        !passData && (passData = []);

        var count = 0;
        for (var i = 0; i < objSet.length; i++) {
            var cb = (function (objSet, finishCallBack, index, passData) {
                return function (pd) {
                    count++;
                    passData[index] = pd;
                    if (objSet.length === count) {
                        finishCallBack && finishCallBack(passData);
                    }
                }
            })(objSet, finishCallBack, i, passData);

            callBackHandler && callBackHandler(objSet[i], cb);
        }

    }
    var common = {
        getScript: function (url) {
            var promise = new Promise();
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (( xhr.status === 200 ) ||
                        ( ( xhr.status === 0 ) && xhr.responseText )) {
                        //@TODO js 加载
                        promise.resolve({
                            s: xhr.responseText
                        });

                    } else {
                        //@TODO js 加载错误
                    }
                }

            };
            xhr.send();

            return promise;
        },
        extend: function (o1, o2) {
            var o3 = JSON.parse(JSON.stringify(o1));
            for (var k in o2) {
                o3[k] = o2[k];
            }
            return o3;
        },
        formatUrl: function (urlInfo) {
            if (!urlInfo.url) {
                throw new Error("depositary.js Error : url is required");
            }

            urlInfo.hash === undefined && (urlInfo.hash = "");
            urlInfo.id === undefined && (urlInfo.id = urlInfo.url);

            urlInfo.fUrl = urlInfo.url.replace(/\[hash\]/img, urlInfo.hash).replace(/\[id\]/img, urlInfo.id);
            return urlInfo;
        },
        formatConfig: function (urls) {

            var fUrl = [];
            for (var i = 0, urlObj; urlObj = urls[i]; i++) {
                var temp = common.extend(defaultConfig, urlObj);
                fUrl.push(this.formatUrl(temp));

            }
            return fUrl;
        },
        executeCode: function (info) {
            switch (info.type) {
                case "js":
                    scriptHandler.executeScript(info);
                    break;
                default:
                    break;
            }
        }

    }

    var storagePrefix = "depositary-";
    var lS = window.localStorage;
    var storageHandler = {
        getSource: function (fUrl) {
            if (fUrl.ignoreCache) { //忽略cache
                return null;
            }

            var key = storagePrefix + fUrl.id;
            var info = lS.getItem(key);
            if (!info) { // 没有记录
                return null;
            }

            try { // 解析错误
                info = JSON.parse(info);
            } catch (e) {
                return null
            }

            var now = Date.now();

            if (info.settime + info.expired < now || fUrl.hash !== info.hash) {//判断是否过期 ,hash值是否相同
                this.clean(key);//@TODO test;
                return null;
            }

            return info
        },
        checkStorageAvility: function () {
            return !!window.localStorage;
        },
        setSource: function (fUrl) {
            var key = storagePrefix + fUrl.id;
            fUrl.settime = Date.now();
            localStorage.setItem(key, JSON.stringify(fUrl));
        },
        clean: function (key) {
            if (key) {
                localStorage.removeItem(key);
            } else {
                localStorage.clear();
            }
        }

    }


    var scriptHandler = {
        executeScript: function (obj) {
            var script = document.createElement("script");
            script.defer = true;
            script.text = obj.s;
            headTarget.appendChild(script);

        },
        loadScript: function (fUrls) {
            asyncLoadParallel(fUrls, function (fUrl, cb) {
                var s = storageHandler.getSource(fUrl);
                if (!s) {
                    common.getScript(fUrl.fUrl).then(function (response) {
                        fUrl.s = response.s;
                        storageHandler.setSource(fUrl);
                        cb(fUrl);
                    });
                } else {
                    cb(s);
                }

            }, function (passData) {
                console.log(passData);
                for (var i = 0; i < passData.length; i++) {
                    common.executeCode(passData[i]);
                }
            });


        }
    }


    var defaultConfig = {
        expired: 365 * 24 * 60 * 60 * 1000,
        type: "js",
        ignoreCache: false
    }

    window.depositary = {
        fetch: function (urls) {
            var fUrls = common.formatConfig(urls);
            if (storageHandler.checkStorageAvility()) {
                scriptHandler.loadScript(fUrls);
            } else {
                //@TODO load by script tag;
            }

        }

    }
})(window, undefined);

