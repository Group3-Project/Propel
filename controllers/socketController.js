module.exports = function(app,express,server, user_fb_id,Player,initPack,removePack,user_fb_name,io,DB){ //Get all the passed variables

//Handling the Ping TimeOut
io.set('heartbeat timeout',5000000);
io.set('heartbeat interval',5000000);

//Global List for all the socket connections
var socket_list = {};
io.sockets.on('connection', (socket)=>{ //Whenever a player connect 
  if(user_fb_id){ //If id is not NULL
  	socket.id = user_fb_id; 
  	socket_list[socket.id] = socket;
  	if(!(user_fb_id in Player.list)){
  		Player.onConnect(socket);
  		console.log("Connection with ID " + socket.id + ", " + user_fb_name + " is connected" );
		console.log("After Connection ------------------");
		console.log(Player.list);
		console.log("-------------------------------");
  	};

  socket.on('kill_user', (id)=>{ //Only disconnect if Logout is pressed, cacthes the emit from mainController
  	delete socket_list[id];
  	Player.onDisconnect(socket);
  	user_fb_id = null;
  	console.log('Connection with ID ' + socket.id + ', ' + user_fb_name + ' is disconnected');
  	console.log("After Disconnection ------------------");
  	console.log(Player.list);
  	console.log("-------------------------------");  
  });
};
	

	socket.on('requestGame', function(user){ //joinLobby -> requestGame
        console.log(user.id + ' joined');
        // findRoom()
        socket.emit('assignGame', {id: 'localhost:8082'});
        lobby.addUser({ name: user.id });
    });
 
  socket.on('gameFound', function(user){
    console.log(user.id + ' assigned game');
  });

  socket.on('addFriend', function(data){
    console.log(data);
    DB.query('Select friend_id from user_friends where user_id = ?', data.user_id, function(error, rows, fields){
      if(!!error){
        console.log('mysql query error' + error);
      }else{
        if(rows.length = 0){
          console.log("No dupes")
          DB.query('Insert into user_friends Set ?', data, function(error, rows, fields){
            if(!!error){
              console.log('mysql query error' + error);
            }else{
              socket.emit('friend_added');
            }
          });
        }
      }
    });
 
  })

});

setInterval(()=>{ //Set the interval, it runs the function again and again after the specified time
	var pack = Player.update(); //Creates a pack for the update function
	for(var i in socket_list){
    		var socket = socket_list[i];
    		socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('remove',removePack);
  	}
  	initPack.player = [];
  	removePack.player = [];
    },1000); //Run after every 1000ms
};
