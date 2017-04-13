/**
 * Created by zhengqiguang on 2017/4/13.
 */

var asyncLoad = function (objSet, callBackHandler, finishCallBack, index, passData) { //like async.map
    !index && (index = 0);
    !passData && (passData = []);
    if (finishCallBack && (objSet.length - 1 < index )) {
        finishCallBack(passData);
        return;
    }

    var cb = (function (objSet, callBackHandler, finishCallBack, index, passData) {
        index++;
        return function (pd) {
            passData.push(pd);
            asyncLoad(objSet, callBackHandler, finishCallBack, index, passData);
        }
    })(objSet, callBackHandler, finishCallBack, index, passData);

    callBackHandler && callBackHandler(objSet[index], cb);

}
