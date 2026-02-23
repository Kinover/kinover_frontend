/**
 * 프로토타입 오염 없이 앱 진입 시 한 번만 로드하는 폴리필.
 * index.js에서 import만 하면 적용됨.
 */

// Array.prototype.findLastIndex (ES2023)
if (typeof Array.prototype.findLastIndex !== 'function') {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, 'findLastIndex', {
    value: function (predicate, thisArg) {
      if (this == null) throw new TypeError('"this" is null or not defined');
      const o = Object(this);
      const len = o.length >>> 0;
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      for (let k = len - 1; k >= 0; k--) {
        const kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
      }
      return -1;
    },
    configurable: true,
    writable: true,
  });
}
