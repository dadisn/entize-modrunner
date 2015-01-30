var derby = require('derby');
var jQuery = require('jquery');
var moment = require('moment');

// Plugins
derby.use(require('d-subcomponents'));

// Create the app
var app = module.exports = derby.createApp('entize-modrunner', __filename);

// Load the stylus compiler
app.serverUse(module, 'derby-stylus');

// Load default components
app.component(require('d-connection-alert'));
app.component(require('d-before-unload'));
app.component(require('e-components/toast'));
app.use(require('d-datepicker'));
app.use(require('d-bootstrap'), {loadStyles: false});

// Load views
app.loadViews(__dirname + '/../../views/app');

// Load the component we're developing
app.use(require('../../../../'));

// Load styles
app.loadStyles(__dirname + '/../../styles/vendor/bootstrap.min');
app.loadStyles(__dirname + '/../../styles/app/');


// Make jQuery global
global.$ = jQuery;
global.jQuery = jQuery;

// Set the locale for Moment.js
require('moment/locale/sv');
moment.locale('sv');

app.proto.init = function(model) {
  // Require derby-debug for debuggin purposes if not in production
  if(!this.app.derby.util.isProduction) this.app.use(require('derby-debug'));
};

app.proto.create = function() {
  // Require 3rd party Javascript
  require('../vendor/bootstrap.min');
};