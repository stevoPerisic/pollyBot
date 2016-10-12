var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var Botkit = require('botkit');
var request = require('request');

app.get('/', function (req, res) {
	res.sendStatus(200);
});

// server static files from the public folder
app.use('/static', express.static(__dirname + '/public'));

app.listen((process.env.PORT || 5000), function () {
  console.log('Listening on port 5000');
});

// Facebook webhook
app.get('/webhook', function (req, res) {
	// This enables subscription to the webhooks
	// console.log(req.query['hub.verify_token']);
	// console.log(process.env.FB_VERIFY_TOKEN);
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
		res.send(req.query['hub.challenge'])
	}
	else {
		res.send('Incorrect verify token')
	}
});

// generic function sending messages
var handler = require('./lib/fb_handler');
handler.controllerFB = Botkit.facebookbot({
    debug: true,
    access_token: process.env.FB_PAGE_ACCESS_TOKEN,
    verify_token: process.env.FB_VERIFY_TOKEN
});

var bot = handler.controllerFB.spawn({});

// add our custom bot message handler because we are using express as our server for both the bot and the consumer/backend app
handler.controllerFB.handlerFB = require('./lib/fb_handler');

// handler receiving messages
app.post('/webhook', jsonParser, function (req, res) {
	// console.log("FB request: \n");
	// console.log(req);
	handler.FBhandler(req.body, bot)
    res.sendStatus(200);
});

// subscribe to page events
request.post('https://graph.facebook.com/me/subscribed_apps?access_token=' + process.env.FB_PAGE_ACCESS_TOKEN,
  function (err, res, body) {
    if (err) {
      console.log('Could not subscribe to page messages')
    }
    else {
      console.log('Successfully subscribed to Facebook events:', body)
      console.log('Botkit activated');

      // start ticking to send conversation messages
      handler.controllerFB.startTicking();
    }
  }
);

// listen to some text
handler.controllerFB.hears(['Hello'], 'message_received', function (bot, message) {
  	bot.reply(message, {
    	"text":"Hello and welcome to Perisic Designs!" 
	});
});
