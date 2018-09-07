var jsonLog = require('./')
var spawn = require('child_process').spawn

var log = jsonLog.child({}, { time: false })
var logNoWrite = jsonLog.child({}, { time: false, write: function () {} })

var deepObj = require('./package.json')
deepObj.d0 = JSON.parse(JSON.stringify(deepObj))
deepObj.d1 = JSON.parse(JSON.stringify(deepObj))
deepObj.d2 = JSON.parse(JSON.stringify(deepObj))
deepObj.d3 = JSON.parse(JSON.stringify(deepObj))

var longString = JSON.stringify(deepObj)

function mkBaseline (str) {
  return function () {
    process.stdout.write(str)
  }
}

var benches = {
  helloWorld: {
    base: mkBaseline(logNoWrite.info('hello world')),
    jlog: function () {
      log.info('hello world')
    }
  },
  deepObj: {
    base: mkBaseline(logNoWrite.info('hi', deepObj)),
    jlog: function () {
      log.info('hi', deepObj)
    },
    native: function () {
      log.info('hi', JSON.stringify(deepObj))
    }
  },
  longString: {
    base: mkBaseline(logNoWrite.info(longString)),
    jlog: function () {
      log.info(longString)
    }
  },
  child: {
    base: (function () {
      var one = logNoWrite.child({ one: 1 })
      var two = one.child({ two: 'foobar' })
      var three = two.child({ two: 'again' })
      return mkBaseline(three.info('hi', { ok: 1023, wat: ['da', 'heck'] }))
    }()),
    jlog: function () {
      var one = log.child({ one: 1 })
      var two = one.child({ two: 'foobar' })
      var three = two.child({ two: 'again' })
      three.info('hi', { ok: 1023, wat: ['da', 'heck'] })
    }
  }
}

if (process.argv.length > 2) {
  var group = process.argv[2]
  var logger = process.argv[3]
  var fn = benches[group][logger]

  var heapUsed = process.memoryUsage().heapUsed
  var start = Date.now()
  for (var i = 0; i < 10000; i++) {
    fn(i)
  }
  console.error(JSON.stringify({
    time: Date.now() - start,
    mem: process.memoryUsage().heapUsed - heapUsed
  }))
  process.exit(0)
}

function run (group, logger) {
  return new Promise(function (resolve) {
    var p = spawn('node', [
      'benchmark.js',
      group,
      logger
    ])
    var out
    p.stdout.on('data', function () {})
    p.stderr.on('data', function (data) {
      out = JSON.parse(data.toString().trim())
    })
    p.on('close', function (code) {
      resolve(out)
    })
  })
}

function mean (arr) {
  var sum = arr.reduce(function (a, b) {
    return a + b
  }, 0)
  return Math.round(sum / arr.length)
}

async function main () {
  for (let group of Object.keys(benches)) {
    console.log(group)
    for (let logger of Object.keys(benches[group])) {
      let times = []
      let mems = []
      for (let i = 0; i < 20; i++) {
        let d = await run(group, logger)
        times.push(d.time)
        mems.push(d.mem)
      }
      console.log('  ' + logger, {
        mem: mean(mems),
        time: mean(times)
      })
    }
  }
}
main().catch(console.error)
