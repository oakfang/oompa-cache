# oompa-cache
An Oompa middleware to cache task responses

It is based on the amazing [lru-cache](https://www.npmjs.com/package/lru-cache) package.

## Usage
```js
const Oompa = require('oompa');
const cache = require('oompa-cache');
const db = require('./my-db');

const server = new Oompa({
  GET: ({key}) => db.get(key),
  SET: data => {
    data[cache.invalidate].GET(data.key);
    return db.set(data.key, data.value);
  },
});
server.use(cache('GET', 50, ({key}) => key));

server.listen(9000);
```

## Why?
To cache common task responses.

### `require('oompa-cache')(type:String, cacheOptions:Either<Integer,Object>, hasher:(Object=>String))`
- **type** is the task type you wish to cache.
- **cacheOptions** is passed to the LRU cache (see [here](https://www.npmjs.com/package/lru-cache#options)).
- **hasher** will be called with the request payload and should produce a string key that will be used for the cache.

### Side Effects
Every request will recieve a new payload property: `require('oompa-cache').invalidate`. The value of this property is an object
with a method for each cached task type (so if we cache every `FOO` request, every request will have `request.payload[cache.invalidate].FOO`). This method accepts a key, and removes it from that task's cache.

Moreover, if there's a cache hit, **no more middleware will be called**, so it is advised to use this middleware as the last
of the middleware chain (the last `use` call).