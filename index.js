var util = require('util')
var isTypedArray = require('is-typedarray')

function safety (data, seen) {
  if (typeof data === 'symbol') {
    return data.toString()
  } else if (typeof data === 'function') {
    return data.name ? '[Function: ' + data.name + ']' : '[Function]'
  } else if (typeof data !== 'object') {
    return data
  } else if (data === null) {
    return null
  } else if (data instanceof Date) {
    return data
  } else if (Buffer.isBuffer(data)) {
    return util.inspect(data)
  } else if (isTypedArray(data)) {
    return util.inspect(data, {maxArrayLength: 10, breakLength: Infinity})
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
    data = {err: data}
  }
  var str = toJson(data)
  if (!str || str === 'null' || str === '{}') {
    return ''
  }
  if (str[0] === '{') {
    return str.slice(1, -1) + ','
  }
  return '"data":' + str + ','
}

function mkLevel (prefix, stream) {
  return function (message, data) {
    if (arguments.length === 1 && typeof message !== 'string') {
      data = message
      message = null
    }
    var line = prefix + stringifyPairs(data) + '"msg":' + (toJson(message) || 'null') + '}\n'
    stream.write(line)
    return line
  }
}

function Logger (ctx) {
  return {
    error: mkLevel('{"level":1,' + ctx, process.stderr),
    warn: mkLevel('{"level":2,' + ctx, process.stdout),
    info: mkLevel('{"level":3,' + ctx, process.stdout),
    child: function (moreCtx) {
      return Logger(ctx + stringifyPairs(moreCtx))
    }
  }
}

module.exports = Logger('')
module.exports.toJson = toJson
module.exports.stringifyPairs = stringifyPairs
