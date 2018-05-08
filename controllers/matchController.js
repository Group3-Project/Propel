module.exports = function(app, express, server, fbId, Player, initPack, removePack, io, DB, thingToDo, gameConnect, gamerScore) {

  
  function game(port, noPlayers) {
    this.port = port;
    this.noPlayers = noPlayers; // noPlayers == max number of players in given game, - ref , 2 in chess, 4 in shooter - need to pass this
    this.rooms = [];
  }
  
  game.prototype = {
    findRoom: function(id, gamerScore) {
      if (this.rooms.length == 0) {
        this.addRoom(id, gamerScore); // create new room
        return {port: this.port, id: null};
      } else {
        for (var i = 0; i < this.rooms.length; i++) { // loop through all waiting (not yet filled) rooms
          var gs = this.rooms[i].returnGamerScore(); // get rooms average gamerScore and how long its been waiting
          var t = 5 - this.rooms[i].time;
          var newId;
  
          if (t == 5) { // if -> crude but ensures no overwaits
            newId = this.rooms[i].id; // in case room gets deleted below
            this.joinRoom(this.rooms[i].id, gamerScore);
            return {port: this.port, id: newId}; // match!
          } else if (gamerScore <= gs+(gs*(0.05*t)) && gamerScore >= gs-(gs*(0.05*t))) { // else if -> boundaries change based on how long room queued, fcfs
            newId = this.rooms[i].id; // in case room gets deleted below
            this.joinRoom(this.rooms[i].id, gamerScore);
            return {port: this.port, id: newId}; // match!
          } else { // can't find a match
            this.addRoom(id, gamerScore); // create new room
            return {port: this.port, id: null};
          }
        }
      }
  
    },
    addRoom: function(id, gamerScore) {
      var newRoom = new room(id, this.port, this.noPlayers);
      newRoom.gamerScore.push(gamerScore);
      this.rooms.push(newRoom);
    },
    joinRoom: function(id, gamerScore) {
      roomIndex = this.rooms.findIndex(function(room) { return room.id === id; }); // find room by id
  
      if (this.rooms[roomIndex].noPlayers == 1) { // if -> remove room from queue if now full
        this.removeRoom(id);
      } else { // else -> decrement number of players left to fill room
        this.rooms[roomIndex].noPlayers = this.rooms[roomIndex].noPlayers - 1;
      }
    },
    removeRoom: function(id) {
      this.rooms = this.rooms.filter(function(oldRoom) {return oldRoom.id != id;});
    },
    checkRooms: function() { // as users get places in rooms immediately
      var returnArray = []; // all newly matched users to be pushed back
  
      var i;
      var j;
  
      //console.log(this.rooms.length);
  
      for (i = 0; i < this.rooms.length; i++) {
        //console.log('times here');
        for (j = i+1; j < this.rooms.length; j++) {
          var gsi = this.rooms[i].returnGamerScore(); // get rooms average gamerScore and how long its been waiting
          var ti = 5 - this.rooms[i].time;
  
          var gsj = this.rooms[j].returnGamerScore(); // get rooms average gamerScore and how long its been waiting
  
          var tj = 5 - this.rooms[j].time;
  
          var newId;
          var oldId;
          //console.log('up here');
  
          if (ti == 5) { // if -> crude but ensures no overwaits
            newId = this.rooms[i].id; // in case room gets deleted below
            oldId = this.rooms[j].id; // for when room gets deleted below
  
            //console.log('\n' + oldId + '\n');
  
            this.joinRoom(newId, gamerScore);
            this.removeRoom(oldId); // get rid of room j which is now merged with room i
            
            //console.log('t == 5');
  
            //console.log({port: this.port, id: newId, oldId: oldId});
            returnArray.push({port: this.port, id: newId, oldId: oldId}); // match!
            break;
          }
  
          if (((gsj-(gsj*(0.05*tj)) <= gsi+(gsi*(0.05*ti))) && gsj-(gsj*(0.05*tj)) >= gsi-(gsi*(0.05*ti))) || (gsi-(gsi*(0.05*ti)) <= (gsj+(gsj*(0.05*tj))) && (gsi-(gsi*(0.05*ti))) >= (gsj-(gsj*(0.05*tj))))) {
            //console.log('boundary here');
            newId = this.rooms[i].id; // in case room gets deleted below
            //console.log(this.rooms[i].id);
            //console.log(newId);
            //console.log(this.rooms[j].id);
            //console.log('here now');
            oldId = this.rooms[j].id; // for when room gets deleted below
            //console.log('here and now');
            this.joinRoom(newId, oldId.gamerScore);
            this.removeRoom(oldId); // get rid of room j which is now merged with room i
  
            //console.log('boundary match');
  
            returnArray.push({port: this.port, id: newId, oldId: oldId}); // match!
          } // if no match found, do nothing
  
          //console.log('nothing');
        }
      }
  
      return returnArray;
    }
  }
  
  function room(id, port, noPlayers) {
    this.id = id;
    this.port = port;
    this.noPlayers = noPlayers;
    this.gamerScore = []; // never externally call this; see returnGamerScore
    this.time = 5;
  }
  
  room.prototype = {
    returnGamerScore: function() { // calculate average gamerScore of players in room
      var t = 0;
      for (var i = 0; i < this.gamerScore.length; i++) {
        t += this.gamerScore[i];
      }
      return t / this.gamerScore.length;
    },
    countDown: function() { // waiting timer
      if (this.time >= 1) { // if -> ensure we never go into negatives
        this.time = this.time - 1;
      }
    }
  }
  
  /////////////////////////////////////////////////////////////////////
  //////////////// START HERE ///////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////
  
  // create instances by reading whatever database we are holding the games in
  
  
  // you can call this on a new user connection
  function newConnection(id, gamerScore, game) {
    console.log(chess);
    game = game.toLowerCase();
    var values = game.findRoom(id, gamerScore);
    if (values.id != null) { // if -> game was not found
      waitingIndex = waitingUsers.findIndex(function(waiting) { return waiting.id === values.id; }); // find room by id
      console.log({port: values.port, id: values.id});
      return {port: values.port, id: values.id}; // pass back port and game to join !!! VALUES TO BE EMMITED !!!
    } else { // else -> game not found
      waitingUsers.push({id: id, game: game});
      console.log({port: null, id: null});
      return {port: null, id: null};
      // return a null value
    }
  }
  
  // this is called every second, you could do this just before your lobby secondly emit
  function timeLoop() {
    //console.log('here1');
    var games = waitingUsers.map(function (wU) { return wU.game; });
    var returnObj = [];
    //console.log('here2');
  
    var i;
    var j;
    for (i = 0; i < games.length; i++) { // loop through all games
      var pushBack = games[i].checkRooms(); // an array of all newly matched users
      //console.log(pushBack);
  
      for (j = 0; j < pushBack.length; j++) { // loop through newly matched users
        returnObj.push(pushBack[j]); // port = port to connect to
      }                                    // id = id to connect to
      // oldId = id of user for these values to be emitted to
      // !!! VALUES TO BE EMMITTED !!!
      for (j = 0; j < games[i].rooms.length; j++) { // see countDown
        games[i].rooms[j].countDown(); // for each room in game
      }
  
  
      if (returnObj.length != 0) {
        return returnObj;
      } else {
        return 'null';
      }
  
    }
  }
  
  var chess = new game( 8082, 2 );
  var shoot = new game( 8084, 4 );
  
  var waitingUsers = [];
  
  
  /* Testing variables
    newConnection('match21', 21, chess);
    newConnection('match20', 20, chess);
    newConnection('match31', 31, chess);
    newConnection('match30', 30, chess);
    newConnection('match100', 100, chess);
    newConnection('match150', 150, chess);

    //console.log('timeLoop 1');
    //console.log(timeLoop());
    //console.log('timeLoop 2');
    //console.log(timeLoop());
    //console.log('timeLoop 3');
    //console.log(timeLoop());
    //console.log('timeLoop 4');
    //console.log(timeLoop());
    //console.log('timeLoop 5');
    //console.log(timeLoop());
    //console.log('timeLoop 6');
    //console.log(timeLoop());
    */
  
    //var fbId = 10;
    //var gamerScore = 20;
    //var gameConnect = 'chess';
    //var thingToDo = 'timeLoop';
  
  if (thingToDo == 'newConnection') {
    newConnection(fbId, gamerScore, gameConnect);
  } else if (thingToDo == 'timeLoop') {
    timeLoop();
  }
  
  
  
  
  
  
  //console.log('5, 22, chess');
  //newConnection(5, 22, chess);
  //console.log('timeLoop');
  //timeLoop();
  //console.log('7, 30, chess');
  //newConnection(8, 30, chess);
  // remove from waiting users, like a reverse newConnection
  //console.log('timeLoop');
  //timeLoop();
  //console.log(chess.findRoom(12, 21));
  
  /* General Comments
  
  STRUCTURE OF HOW THIS WILL WORK
  
  read page for game title <- Markuss. I really do not want to try and figure out where in you ejs you want this
  pass game title to lobby <- ^
  
  * How does a game handle a room id? If a room exists with that id - add user, if not - create new room. Easy. ...
  ... See chess as an example
  
  
  WHATS STILL LEFT TO DO HERE
  
  - Send lobby the game name from page user is on <- just add this to the emit
  - Make it so games expand / contract with mutable rooms
  
  Thats about it. I will at this point note that I have removed the gamerScore changing with win/loss altogether. ...
  ... For demonstration purposes we will just assign our connecting users these as random integers (1-10)
  
  */


};




//console.log('5, 22, chess');
//newConnection(5, 22, chess);
//console.log('timeLoop');
//timeLoop();
//console.log('7, 30, chess');
//newConnection(8, 30, chess);
// remove from waiting users, like a reverse newConnection
//console.log('timeLoop');
//timeLoop();
//console.log(chess.findRoom(12, 21));

/* General Comments

STRUCTURE OF HOW THIS WILL WORK

read page for game title <- Markuss. I really do not want to try and figure out where in you ejs you want this
pass game title to lobby <- ^

* How does a game handle a room id? If a room exists with that id - add user, if not - create new room. Easy. ...
... See chess as an example


WHATS STILL LEFT TO DO HERE

- Send lobby the game name from page user is on <- just add this to the emit
- Make it so games expand / contract with mutable rooms

Thats about it. I will at this point note that I have removed the gamerScore changing with win/loss altogether. ...
... For demonstration purposes we will just assign our connecting users these as random integers (1-10)

*/
