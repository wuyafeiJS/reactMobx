
import { Codes } from 'lib/const';
import Tesla from 'lib/tesla';
import * as util from 'lib/util';
import config from 'config';
import 'whatwg-fetch';

// /////////////////////////////////////////////////////////////
// mock start
// /////////////////////////////////////////////////////////////
/* eslint-disable */
if (process.env.NODE_ENV === 'development') {
  const oriFetch = window.fetch;
  const fakeRes = require('mocks/fetch').default;
  window.fetch = function fetch(url, options) {
    let res,
      hit = false;
    fakeRes.forEach(item => {
      if (item.rule && item.rule.test(url)) {
        res = item.res;
        hit = true;
        return false;
      }
    });
    if (hit) {
      return new Promise(resolve => {
        setTimeout(() => {
          console.log('mock hit: ', url, res);
          resolve({
            ok: true,
            status: 200,
            json() {
              return Promise.resolve(res);
            }
          });
        }, 500);
      });
    } else {
      return oriFetch(url, options);
    }
  };
}
/* eslint-enable */
// /////////////////////////////////////////////////////////////
// mock end
// /////////////////////////////////////////////////////////////

/* eslint-disable no-param-reassign */

// 把返回数据格式统一为 code,data,msg
function decoding(custDecode) {
  return function decode(body) {
    if (!body) {
      return {
        code: Codes.ResponseEmptyError,
        msg: '返回数据为空！'
      };
    }
    if ('code' in body && ('data' in body || 'msg' in body)) {
      return body;
    }
    if (custDecode) {
      const r = custDecode(body);
      if (r) {
        return r;
      }
    }
    console.warn('请指定解包规则', body); // eslint-disable-line no-console
    // 这里还在斟酌是否直接返回原始包
    return {
      code: Codes.ResponseDecodeError,
      msg: '解包失败！'
    };
  };
}

function transformGetParams(url, opts) {
  const paramStr = util.objectToParams(opts.params);
  url += (url.indexOf('?') >= 0 ? '&' : '?') + paramStr;
  opts.body = null;
  opts.data = null;
  return url;
}

function transformPostBody(opts) {
  let body;
  // 兼容data
  if (typeof opts.data === 'object') {
    body = opts.data;
    opts.data = null;
  }
  if (body) {
    let oriBody = opts.body;
    if (typeof oriBody === 'string') {
      try {
        oriBody = JSON.parse(oriBody);
      } catch (_) {} // eslint-disable-line no-empty
    }
    if (oriBody) {
      body = { ...body, ...oriBody };
    }
  } else {
    // eslint-disable-next-line prefer-destructuring
    body = opts.body; // either string or object
  }

  if (typeof body === 'object') {
    opts.body = JSON.stringify(body);
  }
}

/**
 * 分离fetch api option和自定义option
 * @param {Object} oriOpts 合并的options
 */
function extractOptions(oriOpts) {
  // 抽离出自定义options
  const { decode, indicator, toastError, obsData, autofill } = oriOpts;

  // 生成fetch的新options
  const newOpts = {
    ...oriOpts,
    credentials: 'same-origin', // 发送同域cookie
    mode: 'cors', // 允许跨域请求
    decode: null,
    toastError: null
  };

  return {
    custOpts: {
      obsData,
      decode,
      indicator,
      toastError,
      autofill
    },
    opts: newOpts
  };
}

export default function callFetch(url, oriOpts = { obsData: null }) {
  const {
    opts,
    custOpts: { decode, toastError, indicator }
  } = extractOptions(oriOpts);

  // 处理参数
  const method = opts.method ? opts.method.toLowerCase() : 'get';
  if (method === 'get' || method === 'put') {
    // 非纯函数
    url = transformGetParams(url, opts);
  } else {
    // 兼容各种body类型（非纯函数）
    transformPostBody(opts);
  }

  if (indicator) {
    Tesla.emit(Tesla.GlobalIndicator, true);
  }

  return (
    fetch(url, opts)
      // fetch 只有在遇到网络错误的时候才会 reject 这个 promise，即使是404也是resolve状态
      .catch(err => {
        if (!(err instanceof Error)) {
          return Promise.reject(err);
        }
        const debugMsg = (err && err.message) || '未知网络错误';
        // 把网络错误映射成标准错误
        const netError = {
          code: Codes.NetworkError,
          msg: config.debug ? debugMsg : '网络错误，请重试！'
        };
        return Promise.reject(netError);
      })
      .then(res =>
        /**
         * 无论返回什么，先JSON解包
         * 无论是成功还是失败的返回，都能返回有效的JSON body
         */
        res
          .json()
          /**
           * 如果JSON解包失败时，分两场景处理
           * 1. http码为2xx时，抛出JSON解释错误
           * 2. 非2xx时，抛出http错误码
           */
          .catch(() => {
            const jsonErr = {
              code: Codes.JSONParseError,
              msg: '接口数据JSON解析错误！'
            };
            const reqErr = {
              code: Codes.RequestError,
              msg: `请求错误${res.status}！`
            };
            return Promise.reject(res.ok ? jsonErr : reqErr);
          })
      )
      .then(body => decoding(decode)(body))
      .then(body => {
        // 隐藏全屏Loading
        if (indicator) {
          Tesla.emit(Tesla.GlobalIndicator, false);
        }

        // 处理成功返回
        if (body.code === 0) {
          return body.data;
        }

        // 如果返回码非0，则抛出错误，放到后续catch统一处理
        throw body;
      })
      .catch(rawErr => {
        // 隐藏全屏Loading
        if (indicator) {
          Tesla.emit(Tesla.GlobalIndicator, false);
        }

        let err = rawErr;
        if (!err || !err.code) {
          err = {
            code: Codes.NetworkUnknownError
          };
          if (config.debug) {
            err.msg = (rawErr && rawErr.message) || '未知异常';
          } else {
            err.msg = '系统繁忙，请稍后重试';
          }
        }

        // 统一的错误提示，ResponseSequenceError类型错误不提示
        if (toastError && err.msg) {
          Tesla.emit(Tesla.Toast, `[${err.code}]${err.msg}`);
        }

        // 继续往后抛错
        // 业务代码可以catch分支捕获具体返回码
        return Promise.reject(err);
      })
  );
}
