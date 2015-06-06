# json-log
write logs as json to stdout and stderr

 * no configuration!
 * ISO timestamps
 * use log levels if you feel like it

```js
var log = require('json-log');

log('whatever', {you: ['want', 'with']}, 'any', {number: {'of': 'arguments'}}, '!');

log.error(new Error("I'm an error"), 'with', {some: ['more', {arbitrary: 'data'}]});

//other log levels
log.log('...');// same as log(...)
log.err('...');// same as log.error(...)
log.info('...');
log.warn('...');
log.debug('...');
```
## output
```js
["2015-06-06T18:42:52.625Z","log","whatever",{"you":["want","with"]},"any",{"number":{"of":"arguments"}},"!"]
["2015-06-06T18:42:52.627Z","error",{"message":"Error: I'm an error","stack":"Error: I'm an error\n    at Object.<anonymous> (/home/smallhelm/json-log/tests.js:5:11)\n    at Module._compile (module.js:456:26)\n    at Object.Module._extensions..js (module.js:474:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:312:12)\n    at Function.Module.runMain (module.js:497:10)\n    at startup (node.js:119:16)\n    at node.js:935:3"},"with",{"some":["more",{"arbitrary":"data"}]}]
["2015-06-06T18:42:52.627Z","log","..."]
["2015-06-06T18:42:52.627Z","error","..."]
["2015-06-06T18:42:52.627Z","info","..."]
["2015-06-06T18:42:52.627Z","warn","..."]
["2015-06-06T18:42:52.627Z","debug","..."]
```

# License

The MIT License (MIT)

Copyright (c) 2015 mrwrite

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
