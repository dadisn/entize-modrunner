var derby = require('derby');
var http = require('http');
var publicDir = __dirname + '/public';
var defaults = require('./config/defaults');

// Configure process environmental variables
for(var key in defaults) {
  process.env[key] = process.env[key] || defaults[key];
}

derby.use(require('racer-bundle'));
derby.run(function() {
  var express = require('./lib/server/express');
  var store = require('./lib/server/store')(derby, publicDir);
  var app = require('./lib/app');

  express(store, app, publicDir, function(expressApp, upgrade) {
    var server = http.createServer(expressApp);
    server.on('upgrade', upgrade);

    app.writeScripts(store, publicDir, {extensions: ['.coffee']}, function(err) {
      if (err) {
        console.log('Bundle was not created:', app.name, ', error:', err);
      } else {
        console.log('Bundle created:', app.name);
      }
      server.listen(process.env.PORT, function() {
        console.log('%d listening. Go to: http://localhost:%d/', process.pid, process.env.PORT);
      });
    });
  });
});
