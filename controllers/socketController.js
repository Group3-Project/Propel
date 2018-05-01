module.exports = function(app,express,server, user_fb_id,Player,initPack,removePack,user_fb_name,io){

io.set('heartbeat timeout',5000000);
io.set('heartbeat interval',5000000);
var socket_list = {};

io.sockets.on('connection', (socket)=>{ //Whenever a player connect 
  if(user_fb_id){
  	socket.id = user_fb_id
  	sockety = socket
  	socket_list[socket.id] = socket;
  	if(!(user_fb_id in Player.list)){
  		Player.onConnect(socket);
  		console.log("connection with id " + socket.id + ", " + user_fb_name +" is connected" );
		console.log("After Connection ------------------");
		console.log(Player.list);
		console.log("-------------------------------");
  	}

    socket.on('kill_user', (id)=>{
      console.log("On Logout")
      console.log("id" + id)
      delete socket_list[id];
      Player.onDisconnect(socket);
      user_fb_id = null;
      console.log('Connection ' + socket.id + ' is disconnected');
      console.log("After Disconnection ------------------");
      console.log(Player.list);
      console.log("-------------------------------");
        
    })
   //}
});

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
    },1000);
}
