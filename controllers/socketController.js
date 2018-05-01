module.exports = function(app,express,server, user_fb_id,Player,initPack,removePack,user_fb_name,io){

io.set('heartbeat timeout',5000000);
io.set('heartbeat interval',5000000);
var socket_list = {};

io.sockets.on('connection', (socket)=>{ //Whenever a player connect 
  console.log(Player.list);
  console.log("-------------------------------")
  if(user_fb_id){
  	socket.id = user_fb_id
  	sockety = socket
  	socket_list[socket.id] = socket;
  	if(!(user_fb_id in Player.list)){
  		Player.onConnect(socket);
  		console.log("connection with id " + socket.id + ", " + user_fb_name +" is connected" );
		console.log("After Connection ------------------");
		console.log(Player.list);
  	}

    socket.on('kill_user', (id)=>{
      console.log("On Logout")
      console.log("id" + id)
      delete socket_list[id];
      Player.onDisconnect(socket);
      console.log("After Disconnection ------------------");
      user_fb_id = null;
      console.log('Connection ' + socket.id + ' is disconnected');
      console.log(Player.list);
        
    })
    socket.on('disconnect', (reason)=>{ //Delete the player form the socket and player list when it desconnect. It's an automatic function, no need to emit
       if(user_fb_id){
         delete socket_list[socket.id];
          Player.onDisconnect(socket);
          console.log("On diss");
          user_fb_id = null;
          console.log(Player.list);
          console.log('Connection ' + socket.id + ", " + user_fb_name  + " is disconnected " + reason);
      }
      //Possible solution to random disconnects:
      // * try to reconect like 5 times or for 10 sec
      // if you fail -> disconnect and alles gut
    });
   }
});


()=>{
  var pack = Player.update();

  for(var i in socket_list){
    var socket = socket_list[i];
    socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('remove',removePack);
  }
  initPack.player = [];
  removePack.player = [];
};

}
