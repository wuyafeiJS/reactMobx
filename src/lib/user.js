import JSB from 'lib/jsb';
import { Codes } from 'lib/const';
import * as util from 'lib/util';

function handleError(err) {
  let res = err;
  if (!('code' in err) || !('msg' in err)) {
    res = {
      code: Codes.JSBError,
      msg: '登陆失败',
      err
    };
  }
  return Promise.reject(res);
}

function makeKey(obj, prefix = 'trade') {
  const keyBuilder = [prefix];
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    keys.sort((a, b) => (a > b ? 1 : -1));
    keys.forEach(key => {
      if (obj[key] === null || obj[key] === undefined) return;
      keyBuilder.push(`${key}:${obj[key]}`);
    });
  }
  return keyBuilder.join('_');
}

let portal;
function getPortal(silent = true, resetCache = false) {
  if (!resetCache && portal) return Promise.resolve(portal);
  portal = null;
  return JSB.getffTInfo(silent ? 0 : 1)
    .then(data => {
      if (util.getValue(data, 'portal_id')) {
        return data;
      }
      return Promise.reject({
        code: Codes.JSBPortalError,
        msg: '获取用户信息失败'
      });
    })
    .then(data => {
      portal = data;

      // portal_id 在 IOS JSB 里返回整型，Android JSB 里返回字符串，统一为字符串
      portal.portal_id = String(portal.portal_id);

      return data;
    })
    .catch(handleError);
}

const trades = {};
function getTrade(opts, resetCache = false) {
  const key = makeKey(opts, 'trade');
  if (!resetCache && trades[key]) return Promise.resolve(trades[key]);
  trades[key] = null;
  return JSB.getTradeUserInfo(opts)
    .then(data => {
      if (util.getValue(data, 'userAccount.client_id')) {
        return data;
      }
      return Promise.reject({
        code: Codes.JSBTradeError,
        msg: '获取用户信息失败'
      });
    })
    .then(data => {
      trades[key] = data;
      return data;
    })
    .catch(handleError);
}

/**
 * 调起广发通登录
 */
function loginPortal() {
  return getPortal(false);
}

/**
 * 调起交易登录
 */
function loginTrade(opts) {
  return getTrade({ ...opts, mustLoginWhenNull: 1 }, true);
}

export default {
  getPortal,
  getTrade,
  loginPortal,
  loginTrade
};
