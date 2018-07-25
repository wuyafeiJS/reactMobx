import config from 'config';
import callFetch from './base';

const BasePath = '/v1';

function decode(body) {
  if (typeof body === 'object') {
    if ('error' in body) {
      return {
        code: body.error.code || -1,
        msg: body.error.desc
      };
    }
    return {
      code: 0,
      data: body,
      msg: 'success'
    };
  }
  return null;
}

export function quoteFetch(path, opts = {}) {
  const url = `${config.api.quote}${BasePath}${path}`;
  return callFetch(url, { decode, ...opts });
}
