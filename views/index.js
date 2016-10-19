module.exports = function(_res){
	_res.render('index', 
		{
			title: 'Hey', 
			message: 'Now we got it!',
			paragraph: 'Testing!'
		}
	);
}