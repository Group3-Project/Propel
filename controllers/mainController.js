module.exports = function(app,DB,express, server){

var io = require('socket.io')(server);
var socketController = require('./socketController');
var game_list;
var initPack = {player:[]};
var removePack = {player:[]};	
var Player = (id)=>{
  var self = {
    id:id
  }
  self.getInitPack = ()=>{
		return {
			id:self.id
		};
	}
	self.getUpdatePack = ()=>{
		return {
			id:self.id
		}
	}
  Player.list[id] = self;
  initPack.player.push(self.getInitPack());
  return self;
}

Player.list = {};

Player.onConnect = (socket)=>{
  var player = Player(socket.id);

  socket.emit('init',{
		player:Player.getAllInitPack(),
	})
}
Player.getAllInitPack = ()=>{ //To get all the previous player states
	var players = [];
	for(var i in Player.list)
		players.push(Player.list[i].getInitPack());
	console.log(Player.list);
	return players;
}
Player.onDisconnect = (socket)=>{
  delete Player.list[socket.id];
  removePack.player.push(socket.id);
}
Player.update = ()=>{
  var pack = []; //Contains information of every single player in the game and will be sent to each player connected
  for(var i in Player.list){
    var player = Player.list[i];
    pack.push(player.getUpdatePack());
  }
  return pack;
}

//first db select to get all the game list
DB.query("select * from game_list", function(error, rows, fields){
	if(!!error){
		console.log('mysql query error' + error);
	}else{
		game_list = rows;
	}
});

var user_profile = null;
var other_profile = null;
//get username and pic from fb_id
var getProfile = function (userId){
	return new Promise(function(resolve, reject){
		DB.query("select * from users where fb_id =", userId, function(error, rows, fields){
			if(!!error){
				console.log('mysql query error' + error);
				reject(false);
			}else{
				resolve(rows[0]);
				//her_profile =  rows;
			}
		});

	});
};

var cookieParser = require('cookie-parser')
app.use(cookieParser());

//routes
app.get('/',function(req, res){
	user_profile = null;
	if(req.user){	
		console.log(req.user);
		 user_profile = req.user;
		 console.log("User recognized!");
		 socketController(app, express,server,user_profile.id,Player,initPack,removePack,user_profile.name,io);
	}else{
		console.log('User not logged in');
	}

	res.render('index',{game_list : game_list, user: user_profile});
	
});
app.get('/profile',function(req, res){
	if(req.user){	
		 user_profile = req.user;
		 socketController(app, express,server,user_profile.id,Player,initPack,removePack,user_profile.name,io);
		 res.render('profile',{userview: user_profile, user: user_profile});
	}else{
		res.render('index',{game_list : game_list, user: user_profile});
	}
});
	
app.get('/profile/:username',function(req, res){
	user_profile = req.user;
	var promise = getProfile(req.params.username);

	promise.then(function(data){
		if(req.user){
			res.render('profile',{user: user_profile, userview: data});
		}else{
			res.render('profile',{userview: data});
		}
	})
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
