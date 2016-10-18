var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var router = require('./lib/router.js');
var viewRender = require('./views/index.js');
var bot = require('./bot.js');

app.set('views', './views');
app.set('view engine', 'pug');
router(app, viewRender);

app.listen((process.env.PORT || 5000), function () {
  console.log('Listening on port 5000');
  bot();
});
