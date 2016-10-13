// simple mongo storage CRUD
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = process.env.MONGODB_URI;

module.exports = function(){

	// var teams_db = new Store(config.path + '/teams', {saveId: 'id'});
 //    var users_db = new Store(config.path + '/users', {saveId: 'id'});
 //    var channels_db = new Store(config.path + '/channels', {saveId: 'id'});

	var mongoStorage = {
		channels: {
			save: function(){
				console.log('channels save');
			},
			get: function(){
				console.log('channels get');
			},
			all: function(){
				console.log('channels all');
			},
		},
		teams: {
			save: function(){
				console.log('channels save');
			},
			get: function(){
				console.log('channels get');
			},
			all: function(){
				console.log('channels all');
			},
		},
		users: {
			save: function(user, cb){
				MongoClient.connect(url, function(err, db) {
					assert.equal(null, err);
					console.log("Connected correctly to server");
					
					var collection = db.collection("users");
					// _document is an object
					collection.insertOne(_document, function(err, item){
						console.log(item);
					}); 

					db.close();
				});
			},
			get: function(userId, cb){
				MongoClient.connect(url, function(err, db) { 
					var collection = db.collection("users");
					collection.find({id: userId}).toArray().then(function(docs){
						console.log('In the read, results are: ')
						console.log(docs);
						// return docs;
						db.close();

						cb(docs);
						// return docs;
					});
				});
			},
			all: function(cb) {
                MongoClient.connect(url, function(err, db) { 
					var collection = db.collection("users");
					collection.find().toArray().then(function(docs){
						console.log('In the read, results are: ')
						console.log(docs);
						// return docs;
						db.close();

						cb(docs);
						// return docs;
					});
				});
            }
		}
	}

	return mongoStorage;
};

