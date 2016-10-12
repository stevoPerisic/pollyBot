// this function processes the POST request to the webhook
module.exports = {
	controllerFB: null,
	create_user_if_new: function(_userID, _timestamp){
		var me = this;
		var user;

		me.controllerFB.storage.users.get(_userID, function(err, user){
			console.log('Saving user '+_userID);

			if(err){
				console.log('There was an error in trying to find a user.');
				return true;
			}

			if (!user) {
	            user = {
	                id: _userID,
	                time: _timestamp
	            };

	            me.controllerFB.storage.users.save(user, function(err, id) {
	            	if(!err)
	            		console.log('saved user id: '+id);
	            });
	        } else {
	        	console.log('We already have a user with this ID.');
	        	return true;
	        }

		});
	},
	FBhandler: function (obj, bot) {
		var me = this;
		var message;

		me.controllerFB.debug('GOT A MESSAGE HOOK');

		if (obj.entry) {
			for (var e = 0; e < obj.entry.length; e++) {
				for (var m = 0; m < obj.entry[e].messaging.length; m++) {
					var facebook_message = obj.entry[e].messaging[m]

					console.log(facebook_message)

					// normal message
					if (facebook_message.message) {
						message = {
							text: facebook_message.message.text,
							user: facebook_message.sender.id,
							channel: facebook_message.sender.id,
							timestamp: facebook_message.timestamp,
							seq: facebook_message.message.seq,
							mid: facebook_message.message.mid,
							attachments: facebook_message.message.attachments
						}

						// save if user comes from m.me adress or Facebook search
						me.create_user_if_new(facebook_message.sender.id, facebook_message.timestamp)
						
						me.controllerFB.debug('CONVO ISSUE', message);
						me.controllerFB.debug('CONVO ISSUE', bot);
						
						me.controllerFB.receiveMessage(bot, message)
					}
					// clicks on a postback action in an attachment
					else if (facebook_message.postback) {
						// trigger BOTH a facebook_postback event
						// and a normal message received event.
						// this allows developers to receive postbacks as part of a conversation.
						message = {
							payload: facebook_message.postback.payload,
							user: facebook_message.sender.id,
							channel: facebook_message.sender.id,
							timestamp: facebook_message.timestamp
						}

						me.controllerFB.trigger('facebook_postback', [bot, message])

						message = {
							text: facebook_message.postback.payload,
							user: facebook_message.sender.id,
							channel: facebook_message.sender.id,
							timestamp: facebook_message.timestamp
						}

						me.controllerFB.receiveMessage(bot, message)
					}
					// When a user clicks on "Send to Messenger"
					else if (facebook_message.optin) {
						message = {
							optin: facebook_message.optin,
							user: facebook_message.sender.id,
							channel: facebook_message.sender.id,
							timestamp: facebook_message.timestamp
						}

						// save if user comes from "Send to Messenger"
						me.create_user_if_new(facebook_message.sender.id, facebook_message.timestamp)

						me.controllerFB.trigger('facebook_optin', [bot, message])
					}
					// message delivered callback
					else if (facebook_message.delivery) {
						message = {
							optin: facebook_message.delivery,
							user: facebook_message.sender.id,
							channel: facebook_message.sender.id,
							timestamp: facebook_message.timestamp
						}

						me.controllerFB.trigger('message_delivered', [bot, message])
					}
					else {
						me.controllerFB.log('Got an unexpected message from Facebook: ', facebook_message)
					}
				}
			}
		}		
	}
}
