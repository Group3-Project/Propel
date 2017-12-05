module.exports = function(app,DB){

var game_list;

//db queries
DB.query("select * from game_list", function(error, rows, fields){
	if(!!error){
		console.log('mysql query error' + error);
	}else{
		game_list = rows;
	}
});





//routes
app.get('/',function(req, res){
	res.render('index',{game_list : game_list});
});


};