import {
  log,
  JsonLog,
  toJson,
  stringifyPairs,
  timeFns,
  mkLevel
} from './'
import test from 'ava'
var http = require('http')

class JsonLogTEST {
  constructor (ctx) {
    this.ctx = ctx
    this.error = mkLevel(1, timeFns.none, ctx, () => '')
    this.warn = mkLevel(2, timeFns.none, ctx, () => '')
    this.info = mkLevel(3, timeFns.none, ctx, () => '')
  }
  child (moreCtx) {
    return new JsonLogTEST(this.ctx + stringifyPairs(moreCtx))
  }
}

const logT = new JsonLogTEST('')

test('toJson', function (t) {
  t.is(toJson(), undefined)
  t.is(toJson(true), 'true')
  t.is(toJson(false), 'false')
  t.is(toJson(NaN), 'null')
  t.is(toJson(Infinity), 'null')
  t.is(toJson(null), 'null')
  t.is(toJson(1), '1')
  t.is(toJson(1e10), '10000000000')
  t.is(toJson(Symbol('hi')), '"Symbol(hi)"')
  t.is(toJson('say "hello".'), '"say \\"hello\\"."')
  t.is(toJson(Buffer.alloc(1000, 0)).replace(/950 more bytes>/, '>'), '"<Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... >"')
  t.is(toJson({ one: { two: Buffer.alloc(1000, 0) } }).replace(/950 more bytes>/, '>'), '{"one":{"two":"<Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... >"}}')

  t.is(toJson(new Int8Array(1000)), '"Int8Array [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ... 990 more items ]"')

  t.is(toJson(new Date(1514160000000)), '"2017-12-25T00:00:00.000Z"')
  t.is(toJson(new Date('invalid')), 'null')
  t.is(toJson(function () {}), '"[Function]"')
  t.is(toJson(function hi () {}), '"[Function: hi]"')
  t.is(toJson(toJson), '"[Function: toJson]"')

  var superLongString = ''
  for (let i = 0; i < 1000000; i++) {
    superLongString += 'l'
  }
  t.is(toJson(superLongString), `"${superLongString.substring(0, 1000)}..."`)
})

test('toJson - Dupl references', function (t) {
  var data = { a: 1 }
  data.b = data
  t.is(toJson(data), '{"a":1,"b":"[Dupl]"}')

  data = { a: 1 }
  data.b = { c: data }
  t.is(toJson(data), '{"a":1,"b":{"c":"[Dupl]"}}')

  data = { a: 1, b: { c: 3 } }
  data.b.d = data
  t.is(toJson(data), '{"a":1,"b":{"c":3,"d":"[Dupl]"}}')

  data = { a: 1 }
  data.b = [data, data]
  t.is(toJson(data), '{"a":1,"b":["[Dupl]","[Dupl]"]}')

  data = []
  data.push({ a: 1, b: data })
  t.is(toJson(data), '[{"a":1,"b":"[Dupl]"}]')

  // duplicates not in the same cycle
  var foo = { bar: 'baz' }
  data = [foo, foo]
  t.is(toJson(data), '[{"bar":"baz"},"[Dupl]"]')
  data = { a: foo, b: foo }
  t.is(toJson(data), '{"a":{"bar":"baz"},"b":"[Dupl]"}')
})

test('toJson - errors', function (t) {
  var err = new Error('oops')
  err.otherThing = { hi: err }
  var json = toJson(err)
  t.is(typeof json, 'string')
  json = JSON.parse(json)
  t.is(typeof json.stack, 'string')
  t.true(json.stack.length > 0)
  delete json.stack
  t.deepEqual(json, { name: 'Error', message: 'oops', otherThing: { hi: '[Dupl]' } })
})

test.cb('toJson - http req/res', function (t) {
  t.plan(12)
  var server = http.createServer(function (req, res) {
    res.end('hi')

    req = JSON.parse(toJson(req))
    t.deepEqual(Object.keys(req), ['url', 'method', 'headers', 'remoteAddress', 'remotePort'])
    t.is(req.url, '/say-hi')
    t.is(req.method, 'PUT')
    t.is(req.headers['some-header'], 'wat')
    t.is(typeof req.remoteAddress, 'string')
    t.is(typeof req.remotePort, 'number')

    res = JSON.parse(toJson(res))
    t.deepEqual(Object.keys(res), ['statusCode', 'header'])
    t.is(res.statusCode, 200)
    t.is(typeof res.header, 'string')
  })
  server.unref()
  server.listen(0, function () {
    var opts = server.address()
    opts.method = 'PUT'
    opts.path = '/say-hi'
    opts.headers = { 'some-header': 'wat' }
    var r = http.request(opts, function (res) {
      res = JSON.parse(toJson(res))
      t.deepEqual(Object.keys(res), ['url', 'method', 'headers', 'remoteAddress', 'remotePort'])
      t.is(res.headers['content-length'], '2')
      t.end()
    })
    r.end()
    t.is(toJson(r), '"[ClientRequest [object Object]]"')
  })
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
  t.is(stringifyPairs({ foo: 1, bar () {} }), '"foo":1,"bar":"[Function: bar]",')
  t.is(stringifyPairs(Symbol('sym')), '"data":"Symbol(sym)",')
  t.is(stringifyPairs(Buffer.alloc(1000, 0)).replace(/950 more bytes>/, '>'), '"data":"<Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... >",')
  t.is(stringifyPairs(stringifyPairs), '"data":"[Function: stringifyPairs]",')

  t.is(stringifyPairs({
    name: 'bob',
    fun: function () {},
    sym: Symbol('sym')
  }), '"name":"bob","fun":"[Function: fun]","sym":"Symbol(sym)",')// eslint-disable-line no-new-wrappers

  t.true(/^"err":{"name":"Error","message":"hi","stack":.*},$/.test(stringifyPairs(new Error('hi'))))
})

test('logT', function (t) {
  t.is(logT.info(), '{"level":3,"msg":null}\n')
  t.is(logT.info('hi'), '{"level":3,"msg":"hi"}\n')
  t.is(logT.info('hi', { some: ['data'] }), '{"level":3,"some":["data"],"msg":"hi"}\n')
  t.is(logT.info({ some: ['data'] }), '{"level":3,"msg":{"some":["data"]}}\n')

  var err = new Error('wat')
  delete err.stack
  t.is(logT.info('dang', err), '{"level":3,"err":{"name":"Error","message":"wat"},"msg":"dang"}\n')
  err = new TypeError('wat')
  delete err.stack
  t.is(logT.info('foo', err), '{"level":3,"err":{"name":"TypeError","message":"wat"},"msg":"foo"}\n')
  t.is(logT.info('foo', { err: err }), '{"level":3,"err":{"name":"TypeError","message":"wat"},"msg":"foo"}\n')
  t.is(logT.info('foo', { hi: err }), '{"level":3,"hi":{"name":"TypeError","message":"wat"},"msg":"foo"}\n')
})

test('logT.child', function (t) {
  var log2 = logT.child({ foo: 'bar' })
  t.is(logT.info(), '{"level":3,"msg":null}\n')
  t.is(log2.info(), '{"level":3,"foo":"bar","msg":null}\n')
  t.is(log2.info('', { qux: 'quux' }), '{"level":3,"foo":"bar","qux":"quux","msg":""}\n')
})

test('logT.child ctx is immutable', function (t) {
  var ctx = { a: 1, b: 2, c: { d: 3 } }
  var log2 = logT.child(ctx)
  t.is(log2.info(), '{"level":3,"a":1,"b":2,"c":{"d":3},"msg":null}\n')
  ctx.b = 'change'
  ctx.c.d = 'change'
  ctx.added = 1
  t.is(log2.info(), '{"level":3,"a":1,"b":2,"c":{"d":3},"msg":null}\n')
  log2 = logT.child(ctx)
  t.is(log2.info(), '{"level":3,"a":1,"b":"change","c":{"d":"change"},"added":1,"msg":null}\n')
})

test('logT.child duplicate keys rather than overwriting parent ctx', function (t) {
  var log2 = logT.child({ foo: 'bar' })
  t.is(log2.info('', { foo: 'baz' }), '{"level":3,"foo":"bar","foo":"baz","msg":""}\n')
  var log3 = log2.child({ foo: 'overwrite?' })
  t.is(log3.info('', { foo: 'baz' }), '{"level":3,"foo":"bar","foo":"overwrite?","foo":"baz","msg":""}\n')
})

test('mkLevel', function (t) {
  var last
  const error = mkLevel(1, timeFns.none, '"blah":"ok",', function (line) { last = 'ERR:' + line })
  const warn = mkLevel(2, timeFns.none, '"blah":"ok",', function (line) { last = 'OUT:' + line })
  const info = mkLevel(3, () => '"time":1,', '"blah":"ok",', function (line) { last = 'OUT:' + line })

  info('one')
  t.is(last, 'OUT:{"level":3,"time":1,"blah":"ok","msg":"one"}\n')

  warn('two')
  t.is(last, 'OUT:{"level":2,"blah":"ok","msg":"two"}\n')

  error('three')
  t.is(last, 'ERR:{"level":1,"blah":"ok","msg":"three"}\n')
})

test('test stock JsonLog', function (t) {
  let out = log.info('hi', { one: 2 })
    .replace(/"[0-9-]+T[0-9:.]+Z"/, '[ISO-TIME]')
  t.is(out, '{"level":3,"time":[ISO-TIME],"one":2,"msg":"hi"}\n')

  let log2 = new JsonLog('some-ctx')
  out = log2.info('hi', { one: 2 })
    .replace(/"[0-9-]+T[0-9:.]+Z"/, '[ISO-TIME]')
  t.is(out, '{"level":3,"time":[ISO-TIME],some-ctx"one":2,"msg":"hi"}\n')
})
