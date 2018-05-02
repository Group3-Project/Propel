module.exports = function() {  // Markuss I will let you handle this during implementation

  function game(port, noPlayers) {
    this.port = port;
    this.noPlayers = noPlayers; // noPlayers == max number of players in given game
    this.rooms = []
  }

  game.prototype = {
    findRoom: function(id, gamerScore) {
      for (var i = 0; i < this.rooms.length; i++) { // loop through all waiting (not yet filled) rooms
        var gs = this.rooms[i].returnGamerScore(); // get rooms average gamerScore and how long its been waiting
        var t = 5 - this.rooms[i].time;

        if (t == 5){ // if -> crude but ensures no overwaits
          var newId = this.rooms[i].id; // in case room gets deleted below
          this.rooms[i].joinRoom(id, gamerScore);
          return {port: this.port, id: newId}; // match!
        } else if (gamerScore > gs-(gs*(0.05*t)) && gamerScore < gs+(gs*(0.05*t))) { // else if -> boundaries change based on how long room queued, fcfs
          var newId = this.rooms[i].id; // in case room gets deleted below
          this.rooms[i].joinRoom(id, gamerScore);
          return {port: this.port, id: newId}; // match!
        } else { // can't find a match
          this.addRoom(id, gamerScore); // create new room
          return {port: this.port, id: null};
        }
      }
    }
    addRoom: function(id, gamerScore) {
      var newRoom = new Room(id, this.port, this.noPlayers);
      newRoom.gamerScore.push(gamerScore);
      this.rooms.push(newRoom);
    }
    joinRoom: function(id, gamerScore) {
      roomIndex = this.rooms.findIndex((room => room.id == id)); // find room by id

      if (this.rooms[roomIndex].noPlayers == 1) { // if -> remove room from queue if now full
        this.removeRoom(id);
      } else { // else -> decrement number of players left to fill room
        this.rooms[roomIndex].noPlayers = this.rooms[roomIndex].noPlayers - 1;
      }
    }
    removeRoom: function(id) {
      this.rooms = this.rooms.filter(function(oldRoom){return oldRoom.id != id});
    }
    checkRooms: function() { // as users get places in rooms immediately
      returnArray = []; // all newly matched users to be pushed back

      for (int i = 0; i < this.rooms.length; i++) {
        for (int j = i+1; j < this.rooms.length(); j++) {
          var gsi = this.rooms[i].returnGamerScore(); // get rooms average gamerScore and how long its been waiting
          var ti = 5 - this.rooms[i].time;

          var gsj = this.rooms[j].returnGamerScore(); // get rooms average gamerScore and how long its been waiting
          var tj = 5 - this.rooms[j].time;

          if (ti == 5){ // if -> crude but ensures no overwaits
            var newId = this.rooms[i].id; // in case room gets deleted below
            var oldId = this.rooms[j].id; // for when room gets deleted below
            this.rooms[i].joinRoom(id, gamerScore);
            this.removeRoom(this.rooms[j].id); // get rid of room j which is now merged with room i
            returnArray.push({port: this.port, id: newId, oldId: oldId}); // match!
          if ((gsj.gsj-(gsj*(0.05*tj)) <= gsi.gsi+(gsi*(0.05*ti))) && gsj.gsj-(gsj*(0.05*tj)) >=gsi.gsi-(gsi*(0.05*ti))) || // this hellish mess ensures that the ranges expanded ...
              (gsi.gsi-(gsi*(0.05*ti)) <=gsj.gsj+(gsj*(0.05*tj))) && gsi.gsi-(gsi*(0.05*ti)) >= gsj.gsj-(gsj*(0.05*tj)))) { // ... by wait priority overlap (like two lines)
            var newId = this.rooms[i].id; // in case room gets deleted below
            var oldId = this.rooms[j].id; // for when room gets deleted below
            this.rooms[i].joinRoom(id, gamerScore);
            this.removeRoom(this.rooms[j].id); // get rid of room j which is now merged with room i
            returnArray.push({port: this.port, id: newId, oldId: oldId}) // match!
          } // if no match found, do nothing
        }
      }
    }

    return returnArray;
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
    }
    countDown: function() { // waiting timer
      if (this.time >= 1) { // if -> ensure we never go into negatives
        this.time = this.time--;
      }
    }
  }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////// START HERE /////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // create instances by reading whatever database we are holding the games in
  var chess = new game( 8082, 2 );
  var shoot = new game( 8084, 4 );

  var waitingUsers = [];

  // you can call this on a new user connection
  function newConnection(id, gamerScore, game) {
    var values = game.findRoom(id, gamerScore)l
    if (values.id != null) { // if -> game was not found
      return {port: values.port, id: values.id} // pass back port and game to join !!! VALUES TO BE EMMITED !!!
    } else { // else -> game not found
      waitingUsers.push({id: id, game: game});
      // return a null value
    }
  }

  // this is called every second, you could do this just before your lobby secondly emit
  function timeLoop() {
    var games = waitingUsers.map(function (wU) { return wU.game; });

    for (var i = 0; i < games.length; i++) { // loop through all games
      pushBack = games[i].checkRooms(); // an array of all newly matched users

      for (var j = 0; j < pushBack.length; j++) { // loop through newly matched users
        return {port: pushBack.port, id: pushBack.id, oldId: pushBack.oldId} // port = port to connect to
      }                                                                      // id = id to connect to
                                                                             // oldId = id of user for these values to be emitted to
                                                                             // !!! VALUES TO BE EMMITTED !!!
      for (var j = 0; j < games[i].rooms.length; j++) { // see countDown
        games[i].rooms[j].countDown(); // for each room in game
      }
    }
  }
};

/* General Comments

STRUCTURE OF HOW THIS WILL WORK

read page for game title <- Markuss. I really do not want to try and figure out where in you ejs you want this
pass game title to lobby <- ^

lobby calls the newConnection function here, passing the fb id (acts as a new room id - just add mutable room ...
... list in game), the gamerScore of user and the game they wish to connect to (game title ^^^)

This function returns a) port and room id, to be emmited to user that requested newConnection *
                      b) null value where a wait call is emmited to client side js. This also puts user in ...
                         ... wait list to be explained below

That handles new connections but what about users who don't get an immediate match? The timeLoop function is ...
... called every second, you could do this just before your lobby secondly emit. This will return a list of ...
... port, id, oldId. Being the port and room to connect to, and the id for this information to be emmited to ...
... respectively. As long as you keep a list of currently connected users with their ids, we are all good.

* How does a game handle a room id? If a room exists with that id - add user, if not - create new room. Easy. ...
... See chess as an example

This can all replace the basic stuff put in yesterday. Hope it all makes sense, though I get if you don't want...
... to try and figure out the game.checkRooms() function. That barely makes sense to me.

WHATS STILL LEFT TO DO HERE

- Send lobby the game name from page user is on
- On connection call newConnection
- Every second call timeLoop
- Emit back matches
- Make it so games expand / contract with mutable rooms

Thats about it. I will at this point note that I have removed the gamerScore changing with win/loss altogether. ...
... For demonstration purposes we will just assign our connecting users these as random integers (1-10)

*/
