module.exports = function(app,express,server, user_fb_id,Player,initPack,removePack,user_fb_name,io,DB){ //Get all the passed variables

var GamerScore;
var GameName;
var matchController = require('./matchController');

const EventEmitter = require('events'); //For memory Leak
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

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
		if(GamerScore >= 0){
			console.log(user_fb_name + " with GamerScore " + GamerScore + " and ID " + socket.id +" is connected" );
		}
  	};

    socket.on('kill_user', (id)=> { //Only disconnect if Logout is pressed, cacthes the emit from mainController
    	delete socket_list[id];
    	Player.onDisconnect(socket);
    	user_fb_id = null;
	console.log(user_fb_name + " is disconnected" );
    });
  };	
	
socket.on('clickgame', function(data) {
	var promise_user = getData("UPDATE users SET latest_game = '" + data.game_id + "' where fb_id = "+ data.user_id);
	promise_user.then(function(dataUser){
	});
})


  socket.on('gameFound', function(user_fb_id) {
    console.log(user_fb_id + ' Assigned Game');
  });
	
  socket.on('changeName', function(data){		  
	var promise_user = getData("UPDATE users SET name = '" + data.new_name + "' where fb_id = "+ data.user_id);
	promise_user.then(function(dataUser){
        socket.emit('nameChanged');
	user_fb_name = data.new_name;
	});	
  });

  socket.on('addFriend', function(data){
    var query = 'Select * from user_friends where user_id ='+ data.user_id+' and friend_id='+ data.friend_id;
    DB.query(query, function(error, rows, fields){
      if(!!error){
        console.log('MySQL Query Error: ' + error);
      }else{
        if(rows.length == 0){
          console.log("No entries")
          DB.query('Insert into user_friends Set ?', data, function(error, rows, fields){
            if(!!error){
              console.log('MySQL Query Error: ' + error);
            }else{
              socket.emit('friend_added');
            }
          });
        }
      }
    });

  })
	
	
  socket.on('removefriend', function(data){
    var query = 'Select * from user_friends where user_id ='+ data.user_id+' and friend_id='+ data.friend_id;
    DB.query(query, function(error, rows, fields){
      if(!!error){
        console.log('MySQL Query Error: ' + error);
      }else{
        if(rows.length > 0){
          DB.query('DELETE FROM user_friends where user_id ='+ data.user_id+' and friend_id='+ data.friend_id, function(error){
            if(!!error){
              console.log('MySQL Query Error: ' + error);
            }else{
              socket.emit('friend_removed');
            }
          });
        }
      }
    });

  });
});
	
	
	
var query2 = "select gamerscore from users where fb_id = " + user_fb_id;
var get_gamescore = function(query){
	return new Promise (function(resolve,reject){
		DB.query(query, function(error, rows, fields){
			if(!!error){
				console.log('MySQL Query Error: ' + error);
				reject(false);
			}
			else{
				resolve(rows);
			}
		});
	});
};
	
var getData = function (query){
	return new Promise(function(resolve, reject){
		DB.query(query, function(error, rows, fields){
			if(!!error){
				console.log('MySQL Query Error: ' + error);
				reject(false);
			}else{
				resolve(rows);
			}
		});

	});
};
	
var gamer_score_temp = get_gamescore(query2);
gamer_score_temp.then(function(gamerscore){
	GamerScore = gamerscore[0].gamerscore;
});
  setInterval(()=>{ //Set the interval, it runs the function again and again after the specified time
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
