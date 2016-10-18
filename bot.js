var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var Botkit = require('botkit');
var request = require('request');
// DB storage
var mongoStorage = require('./lib/mongoStorage');
var handler = require('./lib/fb_handler'); // facebook bot handler


module.exports = function(){
	handler.controllerFB = Botkit.facebookbot({
	    debug: true,
	    access_token: process.env.FB_PAGE_ACCESS_TOKEN,
	    verify_token: process.env.FB_VERIFY_TOKEN,
	    storage: mongoStorage()
	});
	// add our custom bot message handler because we are using express as our server for both the bot and the consumer/backend app
	handler.controllerFB.handlerFB = require('./lib/fb_handler');
	var bot = handler.controllerFB.spawn({});

	// Facebook webhook
	app.get('/webhook', function (req, res) {
		// This enables subscription to the webhooks
		if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
			res.send(req.query['hub.challenge'])
		}
		else {
			res.send('Incorrect verify token')
		}
	});

	// handler receiving messages
	app.post('/webhook', jsonParser, function (req, res) {
		console.log("FB request: \n");
		console.log(req);
		handler.FBhandler(req.body, bot);
	    res.sendStatus(200);
	});

	// subscribe to page events
	request.post('https://graph.facebook.com/me/subscribed_apps?access_token=' + process.env.FB_PAGE_ACCESS_TOKEN,
	  function (err, res, body) {
	  	// console.log(JSON.parse(body).error);
	    if (err || JSON.parse(body).error) {
	      console.log('Could not subscribe to page messages');
	    }
	    else {
	      console.log('Successfully subscribed to Facebook events:', body)
	      console.log('Botkit activated');

	      // start ticking to send conversation messages
	      handler.controllerFB.startTicking();
	    }
	  }
	);

	// Set up the Greeting text
	request.post(
		{
			url:'https://graph.facebook.com/v2.6/me/thread_settings?access_token=' + process.env.FB_PAGE_ACCESS_TOKEN, 
			form: {
				"setting_type":"greeting",
				"greeting":{
					"text":"Hi {{user_first_name}}, welcome to this Polly. Tap 'Get started' or type 'Start' to get started."
				}
			}
		}, 
		function(err,httpResponse,body){
			if(err){
				console.log(err);
			}
		}
	);

	// Set up the Get started button
	request.post(
		{
			url:'https://graph.facebook.com/v2.6/me/thread_settings?access_token=' + process.env.FB_PAGE_ACCESS_TOKEN, 
			form: {
				"setting_type":"call_to_actions",
				"thread_state":"new_thread",
				"call_to_actions":[{ "payload":"Get started" }]
			}
		}, 
		function(err,httpResponse,body){
			if(err){
				console.log(err);
			}
		}
	);

	// this is triggered when a user clicks the send-to-messenger plugin
	handler.controllerFB.on('facebook_optin', function (bot, message) {
		// reply with nice message
		// 

		// what can be done here??? how to trigger this was unable to do that yet


	  	bot.reply(message, 'Welcome, friend')
	});

	handler.controllerFB.on('tick', function (bot, message) {
		// this is the tick binding

		console.log('Ticking...');
	});

	// listen to some text
	handler.controllerFB.hears(['Hello'], 'message_received', function (bot, message) {
	  	bot.reply(message, {
	    	"text":"Hello and welcome to Perisic Designs!" 
		});
	});

	handler.controllerFB.on('facebook_postback', function (bot, message) {
		var surveyResponse;
		console.log(message);
		if(message.payload === 'Get started'){
			bot.reply(message, {
		    	"attachment":{
		    		"type":"template",
					"payload":{
						"template_type": "button",
						"text": "Would you mind answering a few questions?",
						"buttons":[
							{
								"type": "postback",
								"title": "Let's get to it!",
								"payload": "Start Survey"
							},
							{
								"type": "postback",
								"title": "Not interested.",
								"payload": "Decline Survey"
							}
						]
					}
				}
			});
		} else if(message.payload.indexOf('Survey Answer: ') > -1) {
			bot.reply(message, "you selected: "+message.payload.replace('Survey Answer: ', ''));
			surveyResponse = {
				user: message.user,
				answer: message.payload.replace('Survey Answer: ', '')
			};
			console.log("Survey response: ");
			console.log(surveyResponse);
			storage.create(surveyResponse);

		} else {
			return true;
		}
	});

	// Survey declined
	handler.controllerFB.hears(['Decline Survey'], 'message_received', function (bot, message) {
	  	bot.reply(message, {
	    	"text":"Sorry to hear that." 
		});
	});

	// Survey start
	handler.controllerFB.hears(['Start Survey'], 'message_received', function (bot,message) {
		// This is the start of the survey demo
		// only created for the Monday demo

		var question1 = {
			"text": "On the scale of 1-5, how  would you rate the first part of your visit with Dr. Jones?"
		};

		var question2 = {
	    	"attachment":{
	    		"type":"template",
				"payload":{
					"template_type": "button",
					"text": "Based on your experience so far, would you refer a friend?",
					"buttons":[
						{
							// "type": "web_url",
							// "url": "http://www.perisicdesigns.com",
							"type": "postback",
							"title": "Red pill",
							"payload": "Survey Answer: Red pill"
						},
						{
							"type": "postback",
							"title": "Blue pill",
							"payload": "Survey Answer: Blue pill"
						}
					]
				}
			}
		};

		var question3 = {
	    	"attachment":{
	    		"type":"template",
				"payload":{
					"template_type": "button",
					"text": "Is there anything special about your visit that we should know about?",
					"buttons":[
						{
							// "type": "web_url",
							// "url": "http://www.perisicdesigns.com",
							"type": "postback",
							"title": "Red pill",
							"payload": "Survey Answer: Red pill"
						},
						{
							"type": "postback",
							"title": "Blue pill",
							"payload": "Survey Answer: Blue pill"
						}
					]
				}
			}
		};

		bot.startConversation(message,function(err,convo) {
			console.log('convo started');

			convo.ask(question1, [{
					pattern: '5', // digits
					callback: function(response, convo){
						// bot.reply('Thank you!');
						console.log('Pattern Response --');
						console.log(response);
						// storage.create({user: response.user, answer: response.text});
						convo.next();
					}
				}, {
	                default: true,
	                callback: function(response, convo) {
	                    // bot.reply('I did not recognize that answer.');
	                    console.log('Default Response --');
						console.log(response);
	                    convo.repeat();
	                    convo.next();
	                }
	            }
			]);

			convo.ask(question2, function(response, convo){
				convo.next();
			});

			convo.on('end', function(convo) {
				if (convo.status == 'completed') {
					bot.reply(message, 'Thank you for participating in our survey!');
				} else {
					// this happens if the conversation ended prematurely for some reason
					bot.reply(message, 'Ooops something went wrong...');
				}
			});

		});
	});
}



// app.get('/users', function (req, res) {
// 	handler.controllerFB.storage.users.all(function(data){
// 		res.send(data);
// 	});
// });
