var log = require('./index');

log('whatever', {you: ['want', 'with']}, 'any', {number: {'of': 'arguments'}}, '!');

log.error(new Error("I'm an error"), 'with', {some: ['more', {arbitrary: 'data'}]});

//other log levels
log.log('...');// same as log(...)
log.err('...');// same as log.error(...)
log.info('...');
log.warn('...');
log.debug('...');
