/* eslint-disable no-undef */
/**
 * @param {string} fmt 日期格式 yyyy-MM-dd 等
 * @param {string} str 可选, 形式如 20170918 或者 2017.09.18, 转成 Date对象, 然后再按照指定格式返回
 * @return {string} dateStr
 */
export function dateFormat(fmt, dateSrc) {
  let date;
  if (typeof dateSrc === 'string') {
    const str = String(dateSrc);
    let y;
    let m;
    let d;
    if (str.match(/[.-]/)) {
      const arr = str.indexOf('.') > -1 ? str.split('.') : str.split('-');
      y = arr[0]; // eslint-disable-line
      m = arr[1] - 1;
      d = arr[2]; // eslint-disable-line
    } else {
      y = str.substr(0, 4);
      m = str.substr(4, 2) - 1;
      d = str.substr(6, 2);
    }

    date = new Date(y, m, d);
  } else if (dateSrc instanceof Date) {
    date = dateSrc;
  } else {
    date = new Date();
  }

  const map = {
    M: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds()
  };

  return fmt.replace(/y+|M+|d+|h+|m+|s+/g, (all, offset) => {
    const k = fmt[offset];
    if (k === 'y') {
      return String(date.getFullYear()).substr(4 - all.length);
    }

    const v = map[k];
    if (typeof v !== 'undefined') {
      if (all.length > 1) {
        const s = `0${v}`;
        return s.substr(s.length - 2);
      }
      return v;
    }

    return all;
  });
}

/**
 * 对象转化为url参数，对象只支持一层嵌套
 * @param {Object} obj
 */
export function objectToParams(obj) {
  if (typeof obj !== 'object') return '';
  return Object.keys(obj)
    .map(key => `${key}=${String(obj[key])}`)
    .join('&');
}

export function toPercent(n) {
  if (typeof n !== 'number') return n;
  if (n >= 1) return '100%';
  return `${(n * 100).toFixed(2)}%`;
}

let storageName;
export function initLocal(name) {
  storageName = name;
}
export function getLocal(key, defValue) {
  try {
    if (!storageName)
      throw new Error('storageName should be set using initLocal');
    const res = JSON.parse(localStorage.getItem(storageName));
    if (!res || !res[key]) return defValue;
    return res[key];
  } catch (e) {
    console.error('getLocal', e); // eslint-disable-line no-console
  }

  return '';
}

export function setLocal(key, value) {
  try {
    if (!storageName)
      throw new Error('storageName should be set using initLocal');
    const res = JSON.parse(localStorage.getItem(storageName)) || {};
    localStorage.setItem(storageName, JSON.stringify({ ...res, [key]: value }));
  } catch (e) {
    console.error('setLocal', e); // eslint-disable-line no-console
  }
}

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function paddedArray(count, val = null) {
  const arr = new Array(count);
  for (let i = 0; i < count; i += 1) {
    arr[i] = val;
  }

  return arr;
}
/* eslint-disable no-param-reassign,consistent-return */
export function getValue(scope, keys = '', defaultValue) {
  keys = keys.split('.');
  while (keys.length) {
    const key = keys.shift();
    scope = scope || {};
    if (typeof scope[key] === 'undefined') return defaultValue;
    scope = scope[key];
  }
  return scope;
}

export function setValue(scope, keys, value) {
  keys = keys.split('.');
  while (keys.length) {
    const key = keys.shift();
    if (!scope[key]) {
      scope[key] = keys.length ? {} : value;
    }
    if (keys.length) {
      scope[key] = scope[key] || {};
      scope = scope[key];
    } else {
      scope[key] = value;
    }
  }
}
/* eslint-enable */

/**
 * 获取字符串的字符长度，中文字算2个
 * @param {String} str 字符串
 */
export function clen(str) {
  if (typeof str !== 'string') return 0;
  return str.replace(/[^\x00-\xff]/g, '**').length; // eslint-disable-line no-control-regex
}

export function isAStock(stock) {
  if (!stock) return false;

  if (!stock.type2) {
    return /^(60|000|002|300)/.test(stock.code);
  }
  return Number(stock.type2) === 1001;
}

export function getVisibilityState() {
  const prefixes = ['webkit'];
  // eslint-disable-next-line no-undef
  if ('visibilityState' in document) return 'visibilityState';
  for (let i = 0; i < prefixes.length; i + 1) {
    // eslint-disable-next-line no-undef
    if (`${prefixes[i]}VisibilityState` in document) {
      return `${prefixes[i]}VisibilityState`;
    }
  }
  // otherwise it's not supported
  return null;
}

// eslint-disable-next-line no-undef
const ua = navigator.userAgent;
export const Platform = {
  ios: !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
  android: ua.indexOf('Android') > -1 || ua.indexOf('Adr') > -1,
  wechat: !!/(micromessenger|webbrowser)/i.test(ua)
};
