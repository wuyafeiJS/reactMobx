import config from 'config';
import callFetch from './base';

const BasePath = '/chipdistribution/1.0.0';

const BaseHeader = {
  'Content-Type': 'application/json'
};

const extractCodes = {
  400: '参数错误',
  103: '股票代码不存在'
};

function getMsg(code, rawMsg) {
  if (config.debug) return rawMsg;
  return extractCodes[code] || '系统繁忙，请稍后重试';
}

function decode(body) {
  if (typeof body === 'object') {
    if (body.success) {
      return {
        code: 0,
        data: body.data,
        msg: 'success'
      };
    }
    return {
      code: body.code || -1,
      msg: getMsg(body.code, body.error)
    };
  }
  return null;
}

export function chipsFetch(path, opts = {}) {
  const url = `${config.api.chips}${BasePath}${path}`;
  return callFetch(url, {
    decode,
    ...opts,
    headers: { ...BaseHeader, ...opts.headers }
  });
}
