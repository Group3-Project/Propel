module.exports = function(app,DB,express, server){

var socketController = require('./socketController');
var game_list;

//first db select to get all the game list
DB.query("select * from game_list", function(error, rows, fields){
	if(!!error){
		console.log('mysql query error' + error);
	}else{
		game_list = rows;
	}
});

var user_profile = null;

//get username and pic from fb_id
function getProfile(){

};


//routes
app.get('/',function(req, res){
	
	if(req.session.passport){
		
		//temp solution -> in the future getProfile and db will be used 
		 user_profile = req.session.passport.user;
		 console.log("User recognized");
		 socketController(app, express,server, user_profile.id);

	}else{
		console.log('nobody has loged in yet');
	}

	res.render('index',{game_list : game_list, user: user_profile});
	
});

app.get('/logout', function (req, res) {
    req.logout();
    req.session.destroy(function (err) {
        if (err) {
            return next(err);
        }
        
        user_profile = null;
        // destroy session data
        req.session = null;

        // redirect to homepage
        res.redirect('/');
    });
});


};