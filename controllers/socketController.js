module.exports = function(app,express,server, user_fb_id,Player,initPack,removePack,user_fb_name,io,DB){ //Get all the passed variables

var matchController = require('./matchController');

//Handling the Ping TimeOut
io.set('heartbeat timeout',5000000);
io.set('heartbeat interval',5000000);

//Global List for all the socket connections
var socket_list = {};
io.sockets.on('connection', (socket)=>{ //Whenever a player connect
  if (user_fb_id) { //If id is not NULL
  	socket.id = user_fb_id;
  	socket_list[socket.id] = socket;

  	if (!(user_fb_id in Player.list)) {
  		Player.onConnect(socket);
  		console.log("Connection with ID " + socket.id + ", " + user_fb_name + " is connected" );
  		console.log("After Connection ------------------");
  		console.log(Player.list);
  		console.log("-------------------------------");
  	};

    socket.on('kill_user', (id)=> { //Only disconnect if Logout is pressed, cacthes the emit from mainController
    	delete socket_list[id];
    	Player.onDisconnect(socket);
    	user_fb_id = null;
    	console.log('Connection with ID ' + socket.id + ', ' + user_fb_name + ' is disconnected');
    	console.log("After Disconnection ------------------");
    	console.log(Player.list);
    	console.log("-------------------------------");
    });
  };


	socket.on('requestGame', function(user) { //joinLobby -> requestGame
    var query = 'Select gamerscore from users where fb_id ='+ user.id;

    DB.query(query, function(error, rows, fields) { // get gamerScore
      if (!!error) {
        console.log('MySQL query error: ' + error);
      } else {
        var emitObj = matchController(app, express, server, user.id, Player, initPack, removePack, io, DB, 'newConnection', user.game, query); // pass it literally everything I can, even if it is not used. Tidy up if you wish
        if (emitObj.port != null) {
          socket.emit('assignGame', emitObj);
        }
      }
    });
  });

  socket.on('gameFound', function(user_fb_id) {
    console.log(user_fb_id + ' assigned game');
  });

  socket.on('addFriend', function(data){
    console.log(data);
    var query = 'Select * from user_friends where user_id ='+ data.user_id+' and friend_id='+ data.friend_id;
    console.log(query)
    DB.query(query, function(error, rows, fields){
      if(!!error){
        console.log('mysql query error' + error);
      }else{
        if(rows.length == 0){
          console.log("No entries")
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
var query2 = "select gamerscore from users where fb_id = " + user_fb_id;
var get_gamescore = function(query){
	return new Promise (function(resolve,reject){
		DB.query(query, function(error, rows, fields){
			if(error){
				console.log('MySQL Query Error ' + error);
				reject(false);
			}
			else{
				console.log(rows);
				resolve(rows);
			}
		});
	});
};
var gamer_score_temp = get_gamescore(query2);
gamer_score_temp.then(function(gamerscore){
	console.log("-------------------------------------------------------------------------------------------------------------------");
	console.log(gamerscore);
	console.log("-------------------------------------------------------------------------------------------------------------------");
});
  setInterval(()=>{ //Set the interval, it runs the function again and again after the specified time
  // putting the matchmaking emit above the whole pack things as I do not know what it is
  var emitObj = matchController(app, express, server, user_fb_id, Player, initPack, removePack, io, DB, 'timeLoop', null, null); // pass it literally everything I can, even if it is not used. Tidy up if you wish
  var i;
  var y;
  var emitToSocket;
if(typeof emitObj != 'undefined'){
  for (i = 0; i < emitObj.length; i++) {
    for (y = 0; y < socket_list.length; y++) {
      if (socket_list[y] == emitObj[i].oldId) {
        emitToSocket = socket_list[y];
      }
    }
  }
    socket.broadcast.to(emitToSocket).emit('message', {port: emitObj[i].port, id: emitObj[i].id});
  }
  // end of matchmaking, presume issue is here if there are any

  var pack = Player.update(); //Creates a pack for the update function
  for (var i in socket_list) {
    var socket = socket_list[i];
    socket.emit('init',initPack);
	  socket.emit('update',pack);
	  socket.emit('remove',removePack);
	}
	initPack.player = [];
	removePack.player = [];
  }, 1000); //Run after every 1000ms
};
