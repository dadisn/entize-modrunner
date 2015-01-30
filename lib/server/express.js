var express = require('express');
var expressSession = require('express-session');
var connectStore = require('connect-mongo')(expressSession);
var compression = require('compression');
var serverStatic = require('serve-static');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var highway = require('racer-highway');
var errorMiddleware = require('./errorMiddleware');

module.exports = exports = setup;

function setup(store, app, publicDir, cb) {
  var sessionStore = new connectStore({url: process.env.MONGO_URL, safe: true});
  var session = expressSession({
      secret: process.env.SESSION_SECRET || 'YOUR SECRET HERE'
    , store: sessionStore
    , cookie: process.env.SESSION_COOKIE
    , saveUninitialized: true
    , resave: true
  });
  var handlers = highway(store, {session: session});
  var expressApp = express();

  expressApp
    .use(compression())
    .use(serverStatic(publicDir))
    .use(store.modelMiddleware())
    .use(cookieParser())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: true}))
    .use(session)
    .use(handlers.middleware)
    .use(app.router())
    .use(errorMiddleware)
    .all('*', function(req, res, next) {
      next('404: ' + req.url);
    });

  cb(expressApp, handlers.upgrade);
}