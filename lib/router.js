module.exports = function(app, viewRender){
	app.get('/', function (req, res) {
		viewRender(res);
	});
}

