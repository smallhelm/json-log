var test = require('ava')
var log = require('./')
var toJson = log.toJson
var stringifyPairs = log.stringifyPairs

test('toJson', function (t) {
  t.is(toJson(), undefined)
  t.is(toJson(toJson), undefined)
  t.is(toJson(true), 'true')
  t.is(toJson(false), 'false')
  t.is(toJson(NaN), 'null')
  t.is(toJson(Infinity), 'null')
  t.is(toJson(null), 'null')
  t.is(toJson(1), '1')
  t.is(toJson(1e10), '10000000000')
  t.is(toJson(Symbol('hi')), '"Symbol(hi)"')
  t.is(toJson('say "hello".'), '"say \\"hello\\"."')
  t.is(toJson(Buffer.alloc(1000, 0)), '"<Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... >"')
  t.is(toJson({one: {two: Buffer.alloc(1000, 0)}}), '{"one":{"two":"<Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... >"}}')

  t.is(toJson(new Int8Array(1000)), '"Int8Array [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ... 990 more items ]"')
})

test('toJson - Circular', function (t) {
  var data = {a: 1}
  data.b = data
  t.is(toJson(data), '{"a":1,"b":"[Circular]"}')

  data = {a: 1}
  data.b = {c: data}
  t.is(toJson(data), '{"a":1,"b":{"c":"[Circular]"}}')

  data = {a: 1, b: {c: 3}}
  data.b.d = data
  t.is(toJson(data), '{"a":1,"b":{"c":3,"d":"[Circular]"}}')

  data = {a: 1}
  data.b = [data, data]
  t.is(toJson(data), '{"a":1,"b":["[Circular]","[Circular]"]}')

  data = []
  data.push({a: 1, b: data})
  t.is(toJson(data), '[{"a":1,"b":"[Circular]"}]')

  // duplicates are not cycles
  var foo = {bar: 'baz'}
  data = [foo, foo]
  t.is(toJson(data), '[{"bar":"baz"},{"bar":"baz"}]')
  data = {a: foo, b: foo}
  t.is(toJson(data), '{"a":{"bar":"baz"},"b":{"bar":"baz"}}')
})

test('toJson - errors', function (t) {
  var err = new Error('oops')
  err.otherThing = {hi: err}
  var json = toJson(err)
  t.is(typeof json, 'string')
  json = JSON.parse(json)
  t.is(typeof json.stack, 'string')
  t.true(json.stack.length > 0)
  delete json.stack
  t.deepEqual(json, {name: 'Error', message: 'oops', otherThing: {hi: '[Circular]'}})
})

test('stringifyPairs - unexpected inputs', function (t) {
  t.is(stringifyPairs(), '')
  t.is(stringifyPairs(undefined), '')
  t.is(stringifyPairs(null), '')
  t.is(stringifyPairs(NaN), '')
  t.is(stringifyPairs(Infinity), '')
  t.is(stringifyPairs(false), '"data":false,')
  t.is(stringifyPairs(true), '"data":true,')
  t.is(stringifyPairs(0), '"data":0,')
  t.is(stringifyPairs(-1), '"data":-1,')
  t.is(stringifyPairs(new Number(5)), '')// eslint-disable-line no-new-wrappers
  t.is(stringifyPairs(new String('hi')), '"0":"h","1":"i",')// eslint-disable-line no-new-wrappers
  t.is(stringifyPairs('hi'), '"data":"hi",')
  t.is(stringifyPairs([1, 2, 3]), '"data":[1,2,3],')
  t.is(stringifyPairs(log), '')
  t.is(stringifyPairs(Symbol('sym')), '"data":"Symbol(sym)",')
  t.is(stringifyPairs(Buffer.alloc(1000, 0)), '"data":"<Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... >",')
  t.is(stringifyPairs(stringifyPairs), '')

  t.is(stringifyPairs({
    name: 'bob',
    fun: function () {},
    sym: Symbol('sym')
  }), '"name":"bob","sym":"Symbol(sym)",')// eslint-disable-line no-new-wrappers

  t.true(/^"err":{"name":"Error","message":"hi","stack":.*},$/.test(stringifyPairs(new Error('hi'))))
})

test('log', function (t) {
  t.is(log.info(), '{"level":3,"msg":null}\n')
  t.is(log.info('hi'), '{"level":3,"msg":"hi"}\n')
  t.is(log.info('hi', {some: ['data']}), '{"level":3,"some":["data"],"msg":"hi"}\n')
  t.is(log.info({some: ['data']}), '{"level":3,"some":["data"],"msg":null}\n')

  var err = new Error('wat')
  delete err.stack
  t.is(log.info(err), '{"level":3,"err":{"name":"Error","message":"wat"},"msg":null}\n')
  err = new TypeError('wat')
  delete err.stack
  t.is(log.info('foo', err), '{"level":3,"err":{"name":"TypeError","message":"wat"},"msg":"foo"}\n')
  t.is(log.info('foo', {err: err}), '{"level":3,"err":{"name":"TypeError","message":"wat"},"msg":"foo"}\n')
  t.is(log.info('foo', {hi: err}), '{"level":3,"hi":{"name":"TypeError","message":"wat"},"msg":"foo"}\n')
})

test('log.child', function (t) {
  var log2 = log.child({foo: 'bar'})
  t.is(log.info(), '{"level":3,"msg":null}\n')
  t.is(log2.info(), '{"level":3,"foo":"bar","msg":null}\n')
  t.is(log2.info({qux: 'quux'}), '{"level":3,"foo":"bar","qux":"quux","msg":null}\n')
})

test('log.child ctx is immutable', function (t) {
  var ctx = {a: 1, b: 2, c: {d: 3}}
  var log2 = log.child(ctx)
  t.is(log2.info(), '{"level":3,"a":1,"b":2,"c":{"d":3},"msg":null}\n')
  ctx.b = 'change'
  ctx.c.d = 'change'
  ctx.added = 1
  t.is(log2.info(), '{"level":3,"a":1,"b":2,"c":{"d":3},"msg":null}\n')
  log2 = log.child(ctx)
  t.is(log2.info(), '{"level":3,"a":1,"b":"change","c":{"d":"change"},"added":1,"msg":null}\n')
})

test('log.child duplicate keys rather than overwriting parent ctx', function (t) {
  var log2 = log.child({foo: 'bar'})
  t.is(log2.info({foo: 'baz'}), '{"level":3,"foo":"bar","foo":"baz","msg":null}\n')
  var log3 = log2.child({foo: 'overwrite?'})
  t.is(log3.info({foo: 'baz'}), '{"level":3,"foo":"bar","foo":"overwrite?","foo":"baz","msg":null}\n')
})

test.serial('log levels', function (t) {
  var last
  process.stdout.write = function (line) {
    last = 'OUT:' + line
  }
  process.stderr.write = function (line) {
    last = 'ERR:' + line
  }
  log.info()
  t.is(last, 'OUT:{"level":3,"msg":null}\n')
  log.warn()
  t.is(last, 'OUT:{"level":2,"msg":null}\n')
  log.error()
  t.is(last, 'ERR:{"level":1,"msg":null}\n')
})
