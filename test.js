import test from 'ava';
import cache from '.';

const payloadProxy = payload => new Proxy(payload, {
  get(target, name) {
    target.__propertyGets = (target.__propertyGets || 0) + 1;
    return target[name];
  }
});

test('Task should not be cached', t => {
  const payload = {
    name: 'foo',
    age: 5,
  };
  const request = {
    type: 'FOO',
    payload: payloadProxy(payload),
  };
  const cacher = cache('BAR', 50, ({name}) => name);
  t.is(cacher(request, () => 5), 5);
  t.is(payload.__propertyGets, 1);
});

test('Task should be cached', async t => {
  const payload = {
    name: 'foo',
    age: 5,
  };
  const request = {
    type: 'FOO',
    payload: payloadProxy(payload),
  };
  let state = 0;
  const cacher = cache('FOO', 50, ({name}) => name);
  t.is(await cacher(request, () => state++), 0);
  t.is(cacher(request, () => state++), 0);
  t.is(payload.__propertyGets, 4);
});

test('Task should be cached and invalidated', async t => {
  const payload = {
    name: 'foo',
    age: 5,
  };
  const request = {
    type: 'FOO',
    payload: payloadProxy(payload),
  };
  const subsequent = {
    type: 'BAR',
  };
  let state = 0;
  const cacher = cache('FOO', 50, ({name}) => name);
  t.is(await cacher(request, () => state++), 0);
  cacher(subsequent, r => {
    r.payload[cache.invalidate].FOO('foo');
  });
  t.is(await cacher(request, () => state++), 1);
  t.is(payload.__propertyGets, 4);
});