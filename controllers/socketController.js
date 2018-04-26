module.exports = function(app,express,server, user_fb_id){
var io = require('socket.io')(server,{});


var socket_list = {};
var Player = (id)=>{
  var self = {
    id:id,
    number:"" + Math.floor(10 * Math.random()), //***************For the cursor, could be removed - come back later
  }
  self.getInitPack = ()=>{
		return {
			id:self.id,
			number:self.number,
		};
	}
	self.getUpdatePack = ()=>{
		return {
			id:self.id,
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

io.sockets.on('connection', (socket)=>{ //Whenever a player connect
 if(user_fb_id){
  socket.id = user_fb_id;
  socket_list[socket.id] = socket;
  Player.onConnect(socket);

  socket.on('disconnect', ()=>{ //Delete the player form the socket and player list when it desconnect. It's an automatic function, no need to emit
     if(user_fb_id){
	  delete socket_list[socket.id];
    Player.onDisconnect(socket);
    user_fb_id = null;
	
    console.log('Connection ' + socket.id + " is disconnected");
     }
  });
  console.log('Socket Connection with unique id ' + socket.id + " is connected");
 }
});

var initPack = {player:[]};
var removePack = {player:[]};

setInterval(()=>{
  var pack = Player.update();

  for(var i in socket_list){
    var socket = socket_list[i];
    socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('remove',removePack);
  }
  initPack.player = [];
  removePack.player = [];
},1000/25); //1000/25 this means 25fps, the function will run everytim after 40ms

}
