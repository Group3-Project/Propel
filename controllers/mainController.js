module.exports = function(app,DB,express, server){

var io = require('socket.io')(server);
var socketController = require('./socketController');
var chatController = require('./chatController');
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
		console.log('MySQL Query Error: ' + error);
	}else{
		game_list = rows;
	}
});

var user_profile = null;
var other_profile = null;
//get username and pic from fb_id
var getData = function (query){
	return new Promise(function(resolve, reject){
		DB.query(query, function(error, rows, fields){
			if(!!error){
				console.log('MySQL Query Error: ' + error);
				reject(false);
			}else{
				resolve(rows);
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
		 socketController(app, express,server,user_profile.id,Player,initPack,removePack,user_profile.name,io,DB);
		 chatController(app,express,server,user_profile.id,Player,user_profile.name,io);
	}else{
		console.log('User not logged in');
	}

	res.render('index',{game_list : game_list, user: user_profile});
	
});
app.get('/profile',function(req, res){
	var friends = false;
	if(req.user){	
		 user_profile = req.user;
		 socketController(app, express,server,user_profile.id,Player,initPack,removePack,user_profile.name,io,DB);
		 user_profile.fb_id = user_profile.id;
		 var promise_friends = getData("select * from user_friends s1 LEFT JOIN users s2 ON s1.friend_id = s2.fb_id WHERE s1.user_id =" + user_profile.id);
			promise_friends.then(function(dataFriends){
					for (i = 0; i < dataFriends.length; i++){			
						if (dataFriends[i].friend_id == user_profile.id){
							friends = true;
						}
					}
		 	res.render('profile',{userview: user_profile, user: user_profile,userfriends:dataFriends, friends: friends});
		 });
	}else{
		res.render('index',{game_list : game_list, user: user_profile});
	}
});
	
app.get('/upload',function(req, res){
	if(req.user){	
		 user_profile = req.user;
		 socketController(app, express,server,user_profile.id,Player,initPack,removePack,user_profile.name,io,DB);
		 res.render('upload',{userview: user_profile, user: user_profile});
	}else{
		res.render('index',{game_list : game_list, user: user_profile});
	}
});
	
app.get('/profile/:username',function(req, res){
	user_profile = req.user;
	var friends = false;
	var promise_user = getData("select * from users where fb_id =" + req.params.username);
	promise_user.then(function(dataUser){
			var promise_friends = getData("select * from user_friends s1 LEFT JOIN users s2 ON s1.friend_id = s2.fb_id WHERE s1.user_id =" + req.params.username);
			promise_friends.then(function(dataFriends){
				if(req.user){
					var promiseisfriend = getData("select * from user_friends where friend_id = " + req.params.username + " and user_id = " + user_profile.id);
						promiseisfriend.then(function(dataIsFriend){
							if(typeof dataIsFriend != 'undefined'){
								friends = true;
							}
						})
					socketController(app, express,server,user_profile.id,Player,initPack,removePack,user_profile.name,io,DB);
					res.render('profile',{user: user_profile, userview: dataUser[0], userfriends : dataFriends,friends: friends});
				}else{
					res.render('profile',{userview: dataUser[0], userfriends : dataFriends});
					console.log(userfriends);
				}
				
			})
	})
});

app.get('/gameView/:gameID',function(req, res){
	user_profile = req.user;
	var gameID = req.params.gameID;
	var gameInfo = getData("select * from game_list where id = " + gameID);

	if(req.user){
		user_profile = req.user;
		socketController(app, express,server,user_profile.id,Player,initPack,removePack,user_profile.name,io,DB);
		gameInfo.then(function(data){
			 res.render('gameView',{game: data[0], user: user_profile});
		})
	}
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
