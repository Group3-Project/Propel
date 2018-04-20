
//Initialise the DB 
var mysql = require('mysql');
var connection = mysql.createConnection({
  host : '127.0.0.1',
  user: 'root',
  password : 'LAMPAmirgo42',
  database : 'propel'
});

connection.connect(function(error){
  if(!!error){
    console.log('mysql error' + error);
  }else{
    console.log('connected to mysql');
  }
});

//app setup 
var express = require('express');
var session = require('express-session');

var app = express();

var server = require('http').Server(app);
server.listen(80);

// authorization- flow
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

app.use(session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }
}));

//define the view engine (dynamic html in /view )
app.set('view engine', 'ejs')
//app.set('port', process.env.PORT || 80);


//blocks the meta data contained in headers
app.disable('x-powered-by');

//static files 
app.use(express.static('./public'))

//define controllers
var fbauthController = require('./controllers/fbauthController'); 
var mainController = require('./controllers/mainController');

//launch controllers
mainController(app,connection, express, server);
fbauthController(app,passport,connection);


// app.listen(app.get('port'), function(){
//   console.log("express strated");
// });

//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//Socket.io for package handling
// var socket_list = {};
// var Player = (id)=>{
//   var self = {
//     id:id,
//     number:"" + Math.floor(10 * Math.random()), //***************For the cursor, could be removed - come back later
//   }
//   self.getInitPack = ()=>{
// 		return {
// 			id:self.id,
// 			number:self.number,
// 		};
// 	}
// 	self.getUpdatePack = ()=>{
// 		return {
// 			id:self.id,
// 		}
// 	}
//   Player.list[id] = self;
//   initPack.player.push(self.getInitPack());
//   return self;
// }

// Player.list = {};

// Player.onConnect = (socket)=>{
//   var player = Player(socket.id);

//   socket.emit('init',{
// 		player:Player.getAllInitPack(),
// 	})
// }
// Player.getAllInitPack = ()=>{ //To get all the previous player states
// 	var players = [];
// 	for(var i in Player.list)
// 		players.push(Player.list[i].getInitPack());
// 	return players;
// }
// Player.onDisconnect = (socket)=>{
//   delete Player.list[socket.id];
//   removePack.player.push(socket.id);
// }
// Player.update = ()=>{
//   var pack = []; //Contains information of every single player in the game and will be sent to each player connected
//   for(var i in Player.list){
//     var player = Player.list[i];
//     pack.push(player.getUpdatePack());
//   }
//   return pack;
// }

// io.sockets.on('connection', (socket)=>{ //Whenever a player connect
 
//   socket.id = Math.random();
//   socket_list[socket.id] = socket;
//   Player.onConnect(socket);

//   socket.on('disconnect', ()=>{ //Delete the player form the socket and player list when it desconnect. It's an automatic function, no need to emit
//     delete socket_list[socket.id];
//     Player.onDisconnect(socket);

//     console.log('Connection ' + socket.id + " is disconnected");
//   });
//   console.log('Socket Connection with unique id ' + socket.id + " is connected");
// });
// var initPack = {player:[]};
// var removePack = {player:[]};

// setInterval(()=>{
//   var pack = Player.update();

//   for(var i in socket_list){
//     var socket = socket_list[i];
//     socket.emit('init',initPack);
// 		socket.emit('update',pack);
// 		socket.emit('remove',removePack);
//   }
//   initPack.player = [];
//   removePack.player = [];
// },1000/25); //1000/25 this means 25fps, the function will run everytim after 40ms
