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
    waitingUsersFiltered = waitingUsersFiltered.filter(function(waitingRemoval) { return waitingRemoval.id !== id; });
  },

  checkRooms: function() { // as users get places in rooms immediately
    var returnArray = []; // all newly matched users to be pushed back
    var i;
    var j;

    for (i = 0; i < this.rooms.length; i++) {
      //console.log('times here');
      for (j = i+1; j < this.rooms.length; j++) {
        var gsi = this.rooms[i].returnGamerScore(); // get rooms average gamerScore and how long its been waiting
        var ti = 5 - this.rooms[i].time;
        var gsj = this.rooms[j].returnGamerScore(); // get rooms average gamerScore and how long its been waiting
        var tj = 5 - this.rooms[j].time;
        var newId;
        var oldId;

        if (ti == 5) { // if -> crude but ensures no overwaits
          newId = this.rooms[i].id; // in case room gets deleted below
          oldId = this.rooms[j].id; // for when room gets deleted below

          this.joinRoom(newId, this.rooms[j].returnGamerScore());
          this.removeRoom(oldId); // get rid of room j which is now merged with room i

          console.log('t == 5');

          returnArray.push({port: this.port, id: newId, oldId: oldId}); // match!
          break;
        }

        if (((gsj-(gsj*(0.05*tj)) <= gsi+(gsi*(0.05*ti))) && gsj-(gsj*(0.05*tj)) >= gsi-(gsi*(0.05*ti))) || (gsi-(gsi*(0.05*ti)) <= (gsj+(gsj*(0.05*tj))) && (gsi-(gsi*(0.05*ti))) >= (gsj-(gsj*(0.05*tj))))) {
          newId = this.rooms[i].id; // in case room gets deleted below
          oldId = this.rooms[j].id; // for when room gets deleted below

          this.joinRoom(newId, oldId.gamerScore);
          this.removeRoom(oldId); // get rid of room j which is now merged with room i

          console.log('Boundary Match\n');

          returnArray.push({port: this.port, id: newId, oldId: oldId}); // match!
        } // if no match found, do nothing
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

var waitingUsers = [];
var waitingUsersFiltered = [];

// you can call this on a new user connection
function newConnection(id, gamerScore, game) {
  console.log('with GamerScore : ' + gamerScore);
  var values = game.findRoom(id, gamerScore);
  if (values.id != null) { // if -> game was found
    game.removeRoom(values.id);
    return {port: values.port, id: values.id}; // pass back port and game to join !!! VALUES TO BE EMMITED !!!
  } else { // else -> game not found
    waitingUsers.push({id: id, game: game});
    return {port: null, id: null};
    // return a null value
  }
}

// this is called every second, you could do this just before your lobby secondly emit
function timeLoop() {
  waitingUsersFiltered = waitingUsers;
  var games = waitingUsers.map(function (wU) { return wU.game; });
  var returnObj = [];

  var i;
  var j;
  for (i = 0; i < games.length; i++) { // loop through all games
    var pushBack = games[i].checkRooms(); // an array of all newly matched users

    for (j = 0; j < pushBack.length; j++) { // loop through newly matched users
      returnObj.push(pushBack[j]);          // port = port to connect to
      waitingUsersFiltered = waitingUsersFiltered.filter(function(waitingRemoval) { return waitingRemoval.id !== pushBack[j].id; });
      games[i].removeRoom(pushBack[j].id);
      games[i].removeRoom(pushBack[j].oldId);
    }                                       // id = id to connect to
                                            // oldId = id of user for these values to be emitted to

    for (j = 0; j < games[i].rooms.length; j++) { // see countDown
      games[i].rooms[j].countDown(); // for each room in game
    }

    waitingUsers = waitingUsersFiltered;

    if (returnObj.length != 0) {
      return returnObj;
    } else {
      return 'null';
    }
  }
}

var chess = new game( 8082, 2 );
var shoot = new game( 8084, 4 );

// Testing variables
console.log('New Connection initiated by Kuber');
newConnection('Kuber', 9, chess);
console.log('New Connection initiated by Markuss');
newConnection('Markuss', 10, chess);
console.log('New Connection initiated by Ollie');
newConnection('Ollie', 2, chess);
console.log('New Connection initiated by Ollie Junior');
newConnection('Ollie Junior', 3, chess);
console.log('New Connection initiated by Cassie');
newConnection('Cassie', 6, chess);
console.log('New Connection initiated by Samuel');
newConnection('Samuel', 6, chess);
console.log('New Connection initiated by Ben');
newConnection('Ben', 1, chess);
console.log('New Connection initiated by Mayank');
newConnection('Mayank', 2, chess);

console.log('\n--------MatchMaking--------\n');

console.log('TimeLoop 1 :');
console.log(timeLoop());
console.log('\n');
console.log('TimeLoop 2 :');
console.log(timeLoop());
console.log('\n');
console.log('TimeLoop 3 :');
console.log(timeLoop());
console.log('\n');
console.log('TimeLoop 4 :');
console.log(timeLoop());
console.log('\n');
console.log('TimeLoop 5 :');
console.log(timeLoop());
console.log('\n');
console.log('TimeLoop 6 :');
console.log(timeLoop());
console.log('\n');
