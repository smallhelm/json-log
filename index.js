var util = require('util')
var isTypedArray = require('is-typedarray')

function safety (data, seen) {
  if (typeof data === 'symbol') {
    return data.toString()
  } else if (typeof data === 'function') {
    return data.name ? `[Function: ${data.name}]` : '[Function]'
  } else if (typeof data !== 'object') {
    return data
  } else if (data === null) {
    return null
  } else if (data instanceof Date) {
    return data
  } else if (Buffer.isBuffer(data)) {
    return util.inspect(data)
  } else if (isTypedArray(data)) {
    return util.inspect(data, { maxArrayLength: 10, breakLength: Infinity })
  }
  if (seen.indexOf(data) >= 0) {
    return '[Circular]'
  }
  seen.push(data)
  var out
  var i, k
  if (Array.isArray(data)) {
    out = []
    for (i = 0; i < data.length; i++) {
      out.push(safety(data[i], seen))
    }
  } else {
    out = {}
    var keys = Object.keys(data)
    for (i = 0; i < keys.length; i++) {
      k = keys[i]
      out[k] = safety(data[k], seen)
    }

    // Errors don't enumerate these properties, so let's be sure to include them
    if (typeof data.name === 'string') {
      out.name = data.name
    }
    if (typeof data.message === 'string') {
      out.message = data.message
    }
    if (typeof data.stack === 'string') {
      out.stack = data.stack
    }
  }
  seen.pop()
  return out
}

function toJson (data) {
  return JSON.stringify(safety(data, []))
}

function stringifyPairs (data) {
  if (data instanceof Error) {
    data = { err: data }
  }
  var str = toJson(data)
  if (!str || str === 'null' || str === '{}') {
    return ''
  }
  if (str[0] === '{') {
    return str.slice(1, -1) + ','
  }
  return `"data":${str},`
}

var timeFns = {
  iso: () => `"time":"${(new Date()).toISOString()}",`,
  now: () => `"time":${Date.now()},`,
  none: () => ''
}

function mkLevel (level, time, ctx, write) {
  if (typeof time !== 'function') {
    time = timeFns[timeFns.hasOwnProperty(time) ? time : 'none']
  }
  return function (message, data) {
    if (arguments.length === 1 && typeof message !== 'string') {
      data = message
      message = null
    }
    var line = `{"level":${level},${time()}${ctx}${stringifyPairs(data)}"msg":${toJson(message) || 'null'}}\n`
    write(line)
    return line
  }
}

function Logger (ctx, conf) {
  var log = {}
  Object.keys(conf.levels).forEach(function (lname) {
    var level = Object.assign({}, conf, conf.levels[lname])
    log[lname] = mkLevel(level.code, level.time, ctx, level.write)
  })
  log.child = function (moreCtx, moreConf) {
    return Logger(ctx + stringifyPairs(moreCtx), Object.assign({}, conf, moreConf))
  }
  return log
}

module.exports = Logger('', {
  time: 'iso',
  write: process.stdout.write.bind(process.stdout),
  levels: {
    error: { code: 1, write: process.stderr.write.bind(process.stderr) },
    warn: { code: 2 },
    info: { code: 3 }
  }
})
module.exports.toJson = toJson
module.exports.stringifyPairs = stringifyPairs
