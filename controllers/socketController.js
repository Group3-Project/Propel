module.exports = function(app,express,server, user_fb_id,Player,initPack,removePack,user_fb_name){
var io = require('socket.io')(server);

io.set('heartbeat timeout',5000000);
io.set('heartbeat interval',5000000);
var socket_list = {};

var sockety;
io.sockets.on('connection', (socket)=>{ //Whenever a player connect 
if(user_fb_id){
	socket.id = user_fb_id
	sockety = socket
	socket_list[socket.id] = socket;
	if(!(user_fb_id in Player.list)){
		Player.onConnect(socket);
		console.log("connection with id " + socket.id + ", " + user_fb_name " + is connected" );
	}

  socket.on('disconnect', (reason)=>{ //Delete the player form the socket and player list when it desconnect. It's an automatic function, no need to emit
 console.log("user id" + user_fb_id);
 if(user_fb_id){
   delete socket_list[socket.id];
    Player.onDisconnect(socket);
    console.log("On diss");
    console.log(Player.list);
    user_fb_id = null;
	
    console.log('Connection ' + socket.id + ", " + user_fb_name  + " is disconnected " + reason);
     }
  });
 // console.log('Socket Connection with unique id ' + socket.id + " is connected");
 }
});
app.get('/logout', function (req, res) {
    req.logout();
    req.session.destroy(function (err) {
        if (err) {
            return next(err);
        }
        delete socket_list[sockety.id];
    Player.onDisconnect(sockety);
	console.log("On diss");
	console.log(Player.list);
    user_fb_id = null;
	
    console.log('Connection ' + sockety.id + ", " + user_fb_name + " is disconnected ");
        // destroy session data
        req.session = null;
	
        // redirect to homepage
        res.redirect('/');
    });
});
//var initPack = {player:[]};
//var removePack = {player:[]};

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
