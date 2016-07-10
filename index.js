const LRU = require('lru-cache');

const invalidate = Symbol('@@cache-invalidate');

module.exports = (type, cacheOptions, hasher) => {
  const cache = LRU(cacheOptions);
  return (request, next) => {
    request.payload = request.payload || {};
    request.payload[invalidate] = request[invalidate] || {};
    request.payload[invalidate][type] = key => cache.del(key);
    if (request.type === type) {
      const key = hasher(request.payload);
      if (cache.has(key)) {
        return cache.get(key);
      }
      return Promise.resolve(request).then(next).then(result => {
        cache.set(key, result);
        return cache.get(key);
      });
    }
    return next(request);
  };
};

module.exports.invalidate = invalidate;