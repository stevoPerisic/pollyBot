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
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

// This is the Botkit controller for facebook messenger
var controllerFB = Botkit.facebookbot({
    debug: true,
    access_token: process.env.FB_PAGE_ACCESS_TOKEN,
    verify_token: process.env.FB_VERIFY_TOKEN
});

// new instance of the bot
var bot = controllerFB.spawn({});

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
      controllerFB.startTicking();
    }
  }
);

// add our custom bot message handler because we are using express as our server for both the bot and the consumer/backend app
controllerFB.handlerFB = require('./lib/fb_handler');

// handler receiving messages
app.post('/webhook', jsonParser, function (req, res) {
	// console.log("FB request: \n");
	// console.log(req);
	controllerFB.FBhandler(req.body, bot);
    res.sendStatus(200);
});

// listen to some text
controllerFB.hears(['Hello'], 'message_received', function (bot, message) {
  	bot.reply(message, {
    	"text":"Hello and welcome to Perisic Designs!" 
	});
});
