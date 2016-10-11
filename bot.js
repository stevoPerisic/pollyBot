var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var Botkit = require('botkit');

app.get('/', function (req, res) {
	res.sendStatus(200);
});

// server static files from the public folder
app.use('/static', express.static(__dirname + '/public'));

app.listen((process.env.PORT || 5000), function () {
  console.log('Listening on port 5000');
});