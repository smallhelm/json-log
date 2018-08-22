# json-log

[![Build Status](https://travis-ci.org/smallhelm/json-log.svg)](https://travis-ci.org/smallhelm/json-log)

Lightweight, robust, fast, and opinionated json logger.

Works great with systemd, heroku, or lambda.

- [Philosophy](#philosophy)
  * [Write to stdout/err](#write-to-stdouterr)
  * [Logs should be meaningful](#logs-should-be-meaningful)
    + [1 error](#1---error)
    + [2 warn](#2---warn)
    + [3 info](#3---info)
    + [Why no debug/trace?](#why-no-debugtrace)
  * [Context is crucial](#context-is-crucial)
  * [Robust json stringification](#robust-json-stringification)
- [API](#api)
  * [log.info(message, data)](#loginfomessage-data)
  * [log.warn(message, data)](#logwarnmessage-data)
  * [log.error(message, data)](#logerrormessage-data)
  * [log2 = log.child(data[, conf])](#log2--logchilddata-conf)
- [License](#license)

## Philosophy
### Write to stdout/err

Let your process manager (systemd, heroku, lambda etc.) handle writing logs. Persisting logs can get complicated fast; log rotation, file limits, compression, and backups just to name a few.

Your nodejs process should not be burdened with all that complexity. Simply write to stdout/err and let the manager take care of the rest.

I often use systemd with journald+syslog. It works amazing. You can always set up other tools that monitor syslog and pipe them to another service i.e. AWS Cloudwatch.

NOTE: You can change the write method using [.child(data, {write: ...})](#log2--logchilddata-conf)

#### pid? hostname?

The process manager's logger should add info such as the process name, pid and hostname.

NOTE: If needed, you can add them like other context data:
```js
log.child({
  hostname: require('os').hostname(),
  pid: process.pid
})
```

### Logs should be meaningful

Logs should help you monitor the system, alert you of errors, and help you diagnose issues in a post-mortem. They should not be riddled with "normal" error messages that drown out the errors that require your attention.

Having only 3 levels helps you focus and create meaningful, actionable logs.

NOTE: You can customize the levels using [.child(data, {levels: ...})](#log2--logchilddata-conf)

#### 1 - `error`

The system is unstable and staff should be alerted to take action. A stable system will not emit error logs. This way you take `error` seriously and fix the problem so that condition is gracefully handled in the future. Don't be shy, you should use `log.error` statements generously. But they should only be called when there is an actual error that requires your attention.

Examples:

* A remote service you depend on changed it's api and now responds with unexpected data. Your code now throws an exception trying to parse it.
* A bad db query was made. You'll want to fix that query so it will work in the future.
* The db connection was lost and the retries failed.

These log entries are sent to stderr. You can setup your process manager to do something special with the stderr stream i.e. email them to you, or trigger a monitoring alarm.

#### 2 - `warn`

A recoverable error that is somewhat unexpected. You'll want to monitor these to give you clues when things may become unstable, or detect malicious users.

Examples:

* A user tried uploading a file that exceeded the size limit. Keep an eye on that user id, they may be malicious. (Be sure to include the userId in the log entries so you can correlate their activity)
* A rpc call had to retry before getting a successful response. May indicate the service or network connection is having trouble.
* A sub-process was restarted. May be an issue if it's repeatedly restarted.

#### 3 - `info`

Any useful information about the operation of the system. Information that helps you in a post-mortem, or in analysing the usage and performance of the system.

Examples:
* This request was made
* This task was started
* This query returned X

#### Why no debug/trace?

During development use `console.log` to debug your system. Remove those `console.log`s before deploying to production. Anything that would be helpful in production should use `log.info`.

### Context is crucial

High concurrency is easy to achieve in nodejs. Therefore it's important that each entry contains information about its context. What request it is a part of, what parameters its working with etc. Include request ids, urls, user ids, db record ids, anything that helps give context to the log message. `json-log` will robustly serialize them, including error objects.

Create context specific loggers using `log.child(data)`

### Robust json stringification

This json encoder gracefully handles the following:

* Circular references
* Error objects
* Buffers and Typed Arrays (using util.inspect to truncate them)

See test.js for more details

## API

```js
var log = require('json-log')
```

### log.info(message, data)

Simply write a message string along with some optional data to `stdout` at level `3`.

```js
log.info('hello world')
// OUT-> {"level":3,"time":...,"msg":"hello world"}

log.info('hello world', {extra: 'data', arr: [1, 2]})
// OUT-> {"level":3,"time":...,"extra":"data","arr":[1,2],"msg":"hello world"}

log.info('hello world', [1, 2])// shorthand for {data: [1,2]}
// OUT-> {"level":3,"time":...,"data":[1,2],"msg":"hello world"}

// Accidentally included a buffer or typed array in your data? No problem.
log.info('oops!!', Buffer.alloc(10000000))
// OUT-> {"level":3,"time":...,"data":"<Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... >","msg":"oops!!"}
```

### log.warn(message, data)

Same as `log.info` but level is `2`

```js
log.warn('wat da?', {more: 'info'})
// OUT-> {"level":2,"time":...,"more":"info","msg":"wat da?"}
```

### log.error(message, data)

Same as `log.info` but writes to `stderr` and level is `1`

```js
log.error('grrr', {err: new Error('fail')})
log.error('grrr', new Error('fail'))// shorthand for {err: ...}
// ERR-> {"level":1,"time":...,"err":{"name":"Error","message":"fail","stack":"Error..."},"msg":"some error"}
```

### log2 = log.child(data[, conf])

Create a new log that has the context `data` included on every entry.

```js
var log2 = log.child({reqId: 1, foo: 'bar'})

log2.info('hello again')
// OUT-> {"level":3,"time":...,"reqId":1,"foo":"bar","msg":"hello again"}

log2.info('hello again', {aaa: 1})
// OUT-> {"level":3,"time":...,"reqId":1,"foo":"bar","aaa":1,"msg":"hello again"}

var log3 = log2.child({baz: '333'})
log3.info('yet again')
// OUT-> {"level":3,"time":...,"reqId":1,"foo":"bar","baz":"333","msg":"yet again"}
```

You can override a parent data context key, but it will write both keys to the log so no data is lost.

```js
var log2 = log.child({aaa: 'base'})
var log3 = log2.child({aaa: 'over1'})
log3.info('try to overwrite', {aaa: 'inline'})
// OUT-> {"level":3,"time":...,"aaa":"base","aaa":"over1","aaa":"inline","msg":"try to overwrite"}
```

You can also configure the logger to setup custom timestamps, log level, and output write method.

* `time`: `'iso' | 'now' | false | function(){return '"time":?,'}`
* `write`: `function(line){}`
* `levels`: `{<level>: {code: <number or string>[, ...conf]}}` For each level specify the code to write to the log, and optionally extend it with custom write/time functions.

The default config:
```js
{
  time: 'iso',
  write: process.stdout.write.bind(process.stdout),
  levels: {
    error: {code: 1, write: process.stderr.write.bind(process.stderr)},
    warn: {code: 2},
    info: {code: 3}
  }
}
```

## License

MIT
