var redis = require('redis');
var coffeeify = require('coffeeify');
var livedb = require('livedb');
var liveDbMongo = require('livedb-mongo');
var parseUrl = require('url').parse;
var moment = require('moment');

module.exports = exports = store;

function store(derby, publicDir) {
  var redisClient;
  var redisObserver;

  // Get Redis configuration
  if (process.env.REDIS_HOST) {
    redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
    redisObserver = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
    redisClient.auth(process.env.REDIS_PASSWORD);
    redisObserver.auth(process.env.REDIS_PASSWORD);
  } else if(process.env.OPENREDIS_URL) {
    var redisUrl = parseUrl(process.env.OPENREDIS_URL);
    redisClient = redis.createClient(redisUrl.port, redisUrl.hostname);
    redisObserver = redis.createClient(redisUrl.port, redisUrl.hostname);
    redisClient.auth(redisUrl.auth.split(":")[1]);
    redisObserver.auth(redisUrl.auth.split(":")[1]);
  } else {
    redisClient = redis.createClient();
    redisObserver = redis.createClient();
  }

  redisClient.select(process.env.REDIS_DB || 1);
  redisObserver.select(process.env.REDIS_DB || 1);

  // Set up the store that creates the model and syncs data
  var db = liveDbMongo(process.env.MONGO_URL + '?auto_reconnect', {safe: true});
  var driver = livedb.redisDriver(db, redisClient, redisObserver);
  var backend = livedb.client({snapshotDb: db, driver: driver});
  var store = derby.createStore({backend: backend});

  store.on('bundle', function(browserify) {
    // Add support for directly requiring coffeescript in browserify bundles
    browserify.transform({global: true}, coffeeify);

    // HACK: In order to use non-complied coffee node modules, we register it
    // as a global transform. However, the coffeeify transform needs to happen
    // before the include-globals transform that browserify hard adds as the
    // first trasform. This moves the first transform to the end as a total
    // hack to get around this
    var pack = browserify.pack;
    browserify.pack = function(opts) {
      var detectTransform = opts.globalTransform.shift();
      opts.globalTransform.push(detectTransform);
      return pack.apply(this, arguments);
    };
  });

  store.on('client', function(client) {
    client.channel.on('getServerTime', function(options, cb) {
      cb(moment());
    });
  });

  return store;
}