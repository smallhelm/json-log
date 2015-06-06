var isError = require('is-error');

var mkLogFn = function(stream, level){
  return function(/* data... */){
    var log_data = Array.prototype.slice.call(arguments).map(function(data){
      if(isError(data)){
        return {message: data.toString(), stack: data.stack};
      }
      return data;
    });
    log_data.unshift(level);
    log_data.unshift((new Date()).toISOString());
    stream.write(JSON.stringify(log_data)+"\n");
  };
};

module.exports = mkLogFn(process.stdout, 'log');
module.exports.error = module.exports.err = mkLogFn(process.stderr, 'error');
['debug', 'info', 'log', 'warn'].forEach(function(level){
  module.exports[level] = mkLogFn(process.stdout, level);
});
module.exports.mkLogFn = mkLogFn;
