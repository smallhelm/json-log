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

  var a = {}
  a.one = a
  t.is(toJson(a), '{"one":"[Circular]"}')
  a = []
  a.push(a)
  t.is(toJson(a), '["[Circular]"]')

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

test('stringifyPairs', function (t) {
  t.is(stringifyPairs(), '')
  t.is(stringifyPairs({one: 2}), '"one":2,')
  t.is(stringifyPairs(undefined), '')
  t.is(stringifyPairs(null), '')
  t.is(stringifyPairs(false), '')
  t.is(stringifyPairs(true), '')
  t.is(stringifyPairs(0), '')
  t.is(stringifyPairs(-1), '')
  t.is(stringifyPairs(NaN), '')
  t.is(stringifyPairs(new Number(5)), '')// eslint-disable-line no-new-wrappers
  t.is(stringifyPairs('hi'), '"0":"h","1":"i",')
  t.is(stringifyPairs(new String('hi')), '"0":"h","1":"i",')// eslint-disable-line no-new-wrappers
  t.is(stringifyPairs([1, 2, 3]), '"0":1,"1":2,"2":3,')// eslint-disable-line no-new-wrappers
  t.is(stringifyPairs(log), '')// eslint-disable-line no-new-wrappers
  t.is(stringifyPairs({
    name: 'bob',
    is: t.is,
    sym: Symbol('sym')
  }), '"name":"bob","sym":"Symbol(sym)",')// eslint-disable-line no-new-wrappers
})

test('log', function (t) {
  t.is(log.info('hi'), '{"level":3,"msg":"hi"}\n')
  t.is(log.info('hi', {some: ['data']}), '{"level":3,"some":["data"],"msg":"hi"}\n')
})
