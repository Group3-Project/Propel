module.exports = function(app,DB,express, server){

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

//get username and pic from fb_id
function getProfile(userId){
	DB.query("select * from users where fb_id =?", userId, function(error, rows, fields){
	if(!!error){
		console.log('mysql query error' + error);
	}else{
		console.log(rows);
		return rows[0];
	}
	return false;
});
};


//routes
app.get('/',function(req, res){
	user_profile = null;
	if(req.user){	
		console.log(req.user)
		//temp solution -> in the future getProfile and db will be used 
		 user_profile = req.user;
		 console.log("User recognized");
		 socketController(app, express,server,user_profile.id,Player,initPack,removePack);

	}else{
		console.log('nobody has loged in yet');
	}

	res.render('index',{game_list : game_list, user: user_profile});
	
});
app.get('/profile',function(req, res){
	if(req.user){	
		console.log(req.user)
		//temp solution -> in the future getProfile and db will be used 
		 user_profile = req.user;
		 socketController(app, express,server,user_profile.id,Player,initPack,removePack);
		 res.render('profile',{user: user_profile});
	}else{
		res.render('index',{game_list : game_list, user: user_profile});
	}
});
	
app.get('/profile/:username',function(req, res){
	user_profile = null;
	var username = req.params.username;
	user_profile = getProfile(username);
	console.log(user_profile.name);
	res.render('profile',{user: user_profile});
});
// app.get('/logout', function (req, res) {
//     req.logout();
//     req.session.destroy(function (err) {
//         if (err) {
//             return next(err);
//         }
        
//         user_profile = null;
//         // destroy session data
//         req.session = null;

//         // redirect to homepage
//         res.redirect('/');
//     });
// });


};
