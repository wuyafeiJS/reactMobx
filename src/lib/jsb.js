/* eslint-disable */

function parseURL(url) {
  const a = document.createElement('a');
  a.href = url;
  return {
    source: url,
    protocol: a.protocol.replace(':', ''),
    host: a.hostname,
    port: a.port,
    query: a.search,
    params: (function () {
      const ret = {};
      const seg = a.search.replace(/^\?/, '').split('&');
      const len = seg.length;
      let i = 0;
      let s;
      for (; i < len; i++) {
        if (!seg[i]) {
          continue;
        }
        s = seg[i].split('=');
        ret[s[0]] = s[1];
      }
      return ret;
    })(),
    file: (a.pathname.match(/\/([^/?#]+)$/i) || [null, ''])[1],
    hash: a.hash.replace('#', ''),
    path: a.pathname.replace(/^([^/])/, '/$1'),
    relative: (a.href.match(/tps?:\/\/[^/]+(.+)/) || [null, ''])[1],
    segments: a.pathname.replace(/^\//, '').split('/')
  };
}

const urlParams = parseURL(location.href).params;
const debug = Number(urlParams.__debug) === 1;
const mock = Number(urlParams.__mock) === 1;
const STATUS = {
  SUCCESS: 'successful',
  CANCEL: 'cancelled',
  FAIL: 'failed'
};
const ANDROID = 1;
const IOS = 2;
const modeNames = ['unknow', 'Android', 'iOS'];
let mode = 0; // 平台: 0 - unknow, 1 - Android, 2 -iOS
let JSB = {
  _sn: 0,
  _readyListeners: [],
  _callList: [],
  _bridge: undefined,
  onReady(f) {
    if (this.getMode() === ANDROID) {
      f();
    } else {
      this._readyListeners.push(f);
    }
  },
  getBridge() {
    return this._bridge;
  },
  _call() {
    const args = Array.prototype.slice.call(arguments);
    if (this.callHandler) {
      this.callHandler.apply(this, args);
    } else {
      // 在ios bridge未得到初始化之前，保存调用队列，初始化完成后自动调用
      JSB._callList.push(args);
    }
  }
};

window.JSB = JSB;

const report = function (data) {
  if (!debug) return;
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
  const image = new Image();
  image.src = `http://spdev.ff.com.cn:8066/report/info?xxx=${data}`;
};

window.report = report;

// 返回平台名称
// const getModeName = function(mode) {
//   return modeNames[mode] || modeNames[0]
// }

// triggerReady
const triggerReady = function () {
  let _f;
  while (typeof (_f = JSB._readyListeners.shift()) === 'function') {
    _f.apply();
  }
};

// 检查调用队列是否有任务需要调用
const checkCallList = function () {
  let args;
  while ((args = JSB._callList.shift())) {
    // eslint-disable-line
    if (JSB.callHandler) {
      JSB.callHandler(...args);
    }
  }
};

const userAgent = window.navigator.userAgent;
const android =
  userAgent.indexOf('Android') > -1 || userAgent.indexOf('Adr') > -1;
// Android
// window.ActionBridge 原先这个判断也是可取的, 因为ios是异步加载, android是同步, 但是在hmr的场景下就不大好了
if (android) {
  report('android');
  mode = ANDROID;
  JSB._bridge = window.ActionBridge;
  JSB.callHandler = function () {
    const args = Array.prototype.slice.call(arguments);
    const actionName = args[0];
    let params = args[1];
    let successCallback = args[2];
    let failCallback = args[3];

    if (typeof params === 'object') {
      params = JSON.stringify(params);
    } else if (typeof params === 'function') {
      params = null;
      successCallback = args[1];
      failCallback = args[2];
    } else {
      params = `${params}`;
    }

    const successCallbackName = this.defineCallback(successCallback);
    const failCallbackName = this.defineCallback(failCallback);

    report({
      p: params,
      n: actionName,
      s: successCallbackName,
      f: failCallbackName
    });

    window.ActionBridge.handleAction(
      actionName,
      params,
      successCallbackName,
      failCallbackName
    );
  };
} else {
  report('ios');
  // iOS
  window.lock = false;
  window.onBridgeReady = function (event) {
    if (window.lock) return;
    window.lock = true;
    // 必须执行bridge.init，方可与原生代码互相调用，否则仅可起调原生代码的功能，但获取返回值的异步函数将不会执行。
    event.bridge.init(function (message, responseCallback) { });
    mode = IOS;
    JSB.callHandler = function (action, params, succ, fail) {
      window.ActionBridge.handleAction(action, params, succ, fail);
    };
    checkCallList();
    triggerReady();
  };
  window.document.addEventListener(
    'ActionBridgeReady',
    window.onBridgeReady,
    false
  );
}

// ============================接口  屏蔽平台差异===========================
JSB.getMode = function () {
  return mode;
};
JSB.getModeName = function (mode) {
  mode = mode || this.getMode();
  return modeNames[mode] || modeNames[0];
};

JSB.getSN = function () {
  return this._sn;
};

// Android需要在window上定义一个回调函数，并将回调函数名称在调用handleAction时传过去
JSB.defineCallback = function (callback) {
  if (!callback) {
    callback = function () { };
  }

  const sn = ++this._sn;
  const now = new Date().getTime();
  const funName = `JSB_CALLBACK_${now}_${sn}`;
  window[funName] = function (res) {
    // Android回调的数据是字符串，尝试将其转换为对象，尽量保持两个平台数据返回类型一致
    try {
      const data = JSON.parse(res);
      callback(data);
    } catch (e) {
      callback(res);
    }
  };
  return funName;
};

// 打开一个web页面或一个原生页面
// type: web，popWeb，controller
// uri: type为web或popWeb时，uri为新web页面地址；type为controller时，uri为原生控制器类型
JSB.openPage = function (type, uri, title) {
  let action, params;
  if (type === 'controller') {
    action = mode === ANDROID ? uri : 'revealController';
    params =
      mode === ANDROID
        ? null
        : {
          controllertype: type,
          data: uri
        };
  } else {
    action = mode === ANDROID ? 'open_url' : 'revealController';
    params =
      mode === ANDROID
        ? {
          targetUrl: uri,
          title: title || '',
          needAudioSession: false
        }
        : {
          controllertype: type,
          data: uri
        };
  }
  JSB._call(action, params);
};

// 添加自选股         params = {  market: 股票市场,stockCode: 股票代码  }
JSB.addMyStock = function (params) {
  const action = 'add_fav_stock';
  JSB._call(action, {
    params
  });
};

// 删除自选股        params = {  market: 股票市场,stockCode: 股票代码  }
JSB.removeMyStock = function (params) {
  const action = 'del_fav_stock';
  JSB._call(action, {
    params
  });
};

// 设置标题
JSB.setTitle = function (title) {
  const action = 'set_title';
  JSB._call(action, {
    title
  });
};

// 加密数据
JSB.encodeData = function (str, success, fail) {
  if (mock) {
    success &&
      success(
        'm*92*AE*3E*93*CE*D2*23*0A*836*8AEzT*E5G*97*883*91G*16bw*22*A05*A8*CCL8G*97*883*91G*16bw*22*A05*A8*CCL8G*97*883*91G*16bw*22*A05*A8*CCL8*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00*00'
      ); // ==> 123123
    return;
  }
  const action = this.getMode() === ANDROID ? 'encode_data' : 'encodeData';
  const params = {};
  if (this.getMode() === ANDROID) {
    params.value = str;
  } else {
    params.data = str;
  }
  JSB._call(
    action,
    params,
    res => {
      success && success(res.data);
    },
    res => {
      fail && fail(res);
    }
  );
};

// 关闭webview
JSB.close = function () {
  JSB._call('close_webview', {});
};

// 查看个股行情, 一般不要直接调用, 优先调用 util.js 中的封装
JSB.stockQuote = function (market, code) {
  const MarketMap = { 101: 'sh', 105: 'sz' };
  if (typeof market === 'number') {
    // 应该传的是exchange代码了
    market = MarketMap[market];
  }
  const action = 'quote_query';
  const params = { market, stockCode: code, uiType: 1 };
  JSB._call(action, params);
};

JSB.stockQuery = function (value) {
  return makePromise('stock_query', { value: value });
};

JSB.secuSearch = function (value) {
  return makePromise('secu_search', { showAddBtn: value }).then(res => {
    if (!res.data) throw { code: 400, desc: 'error or cancelled' }; // ios
    return res.data;
  });
};

/**
 * mustLoginWhenNull 是否强制登录
 */
JSB.getffTInfo = function (mustLoginWhenNull = 0) {
  let action = 'get_fft_info';
  let params = { mustLoginWhenNull };

  return makePromise(action, params)
    .then(res => {
      if (!res.data || !res.data.portal_id)
        return Promise.reject({ code: 400 });
      res.data.mobile = res.data.mobile || res.data.user_id; // android vs ios

      return res.data;
    })
    .catch(err => {
      // android 不强制登录能直接触发异常
      return Promise.reject({ code: 400 });
    });
};

JSB.getTradeUserInfo = function ({
  type = 'common_trade_account',
  mustLoginWhenNull = 0,
  mustLive = 0
} = {}) {
  return makePromise('get_trade_user_info', {
    type,
    mustLoginWhenNull,
    mustLive
  }).then(res => {
    // mustLive 0 ? userAccount : userInfo
    const hasData = res && res.data;
    let hasAccount;
    if (mode === ANDROID) {
      if (mustLive === 1) res.data.userAccount = res.data.userInfo;
      hasAccount = hasData && res.data.userAccount;
    } else {
      if (hasData) {
        if (!res.data.userAccount) {
          res.data.userAccount = res.data;
        }
        hasAccount = res.data.userAccount.client_id;
      }
    }
    if (!hasAccount) throw { code: 400, desc: 'no data' };
    return res.data;
  });
};

// 获取自选股列表
JSB.getFavStocks = function () {
  // 注意: ios 跟 android 同个账号拿到的列表可能是不一样的,
  // 因为android切换广发通会清除列表, 而ios 并不会
  return makePromise('get_fav_stock_list').then(res => {
    if (res && res.data) {
      return res.data;
    }
    throw { code: 400 };
  });
};

// JSB增加分享接口(回调， 标题， 描述， 连接， 图标的连接)
/*
title: 标题
description: 描述
pageUrl: 目标url
thumbUrl: 指定分享后的icon
shareDes: 分享到哪里，0-好友；1-朋友圈
*/
JSB.shareInformation = function (title, description, pageUrl, thumbUrl) {
  // ios 暂时不支持
  return makePromise('share', { title, description, pageUrl, thumbUrl });
};

JSB.getDeviceInfo = function () {
  return makePromise('get_device_info');
};

function makePromise(intf, params) {
  return new Promise((resolve, reject) => {
    // if (process.env.PAGE_ENV === 'app')
    JSB._call(intf, params, resolve, reject);
    // else
    //   reject({code: 500, msg: 'jsb not supported!'})
  });
}

if (process.env.NODE_ENV === 'development') {
  const ua = navigator.userAgent;
  const isWebView =
    ua.indexOf('appSource/dd') > -1 || // android
    ua.indexOf('com.dd.client') > -1 || // android 6.6
    ua.indexOf('cn.com.dd') > -1; // ios

  if (!isWebView) {
    JSB = require('../mock/jsb').default; // eslint-disable-line
  }
}

export default JSB;
