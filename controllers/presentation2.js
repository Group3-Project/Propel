       if (t == 5) {
          newId = this.rooms[i].id;
          this.joinRoom(this.rooms[i].id, gamerScore);

          return {port: this.port, id: newId};
        } else if (gamerScore <= gs+(gs*(0.05*t)) && gamerScore >= gs-(gs*(0.05*t))) {
          newId = this.rooms[i].id;
          this.joinRoom(this.rooms[i].id, gamerScore);
          return {port: this.port, id: newId};
        } else {
          this.addRoom(id, gamerScore);
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

          console.log('boundary match');

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
                                            // !!! VALUES TO BE EMMITTED !!!

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

function gamerScoreUpdate(id, gamerScore, outcome) {
  var modifier = 5.0 - gamerScore;
}

var chess = new game( 8082, 2 );
var shoot = new game( 8084, 4 );


// Testing variables
console.log('newConnection Samuel');
console.log(newConnection('Samuel', 0.9, chess));
console.log('newConnection Kuber');
console.log(newConnection('Kuber', 2.1, chess));
console.log('newConnection Cassie');
console.log(newConnection('Cassie', 2.0, chess));
console.log('newConnection Ollie');
console.log(newConnection('Ollie', 3.1, chess));
console.log('newConnection Markuss');
console.log(newConnection('Markuss', 3.0, chess));
console.log('newConnection Mayank');
console.log(newConnection('Mayank', 10.0, chess));
console.log('newConnection George');
console.log(newConnection('George', 150.0, chess));
console.log('newConnection Ben');
console.log(newConnection('Ben', 0.9, chess));

console.log('\n\n\n');

console.log('timeLoop 1');
console.log(timeLoop());
console.log('\n\ntimeLoop 2');
console.log(timeLoop());
console.log('\n\ntimeLoop 3');
console.log(timeLoop());
console.log('\n\ntimeLoop 4');
console.log(timeLoop());
console.log('\n\ntimeLoop 5');
console.log(timeLoop());
console.log('\n\ntimeLoop 6');
console.log(timeLoop());

/*var i;
console.log('\n\ntimeLoop 1');
console.log(timeLoop());
for (i = 0; i < this.waitingUsers.length; i++) {
  console.log(waitingUsers[i].id);
}
console.log('\n\ntimeLoop 2');
console.log(timeLoop());
for (i = 0; i < this.waitingUsers.length; i++) {
  console.log(waitingUsers[i].id);
}
console.log('\n\ntimeLoop 3');
console.log(timeLoop());
for (i = 0; i < this.waitingUsers.length; i++) {
  console.log(waitingUsers[i].id);
}
console.log('\n\ntimeLoop 4');
console.log(timeLoop());
for (i = 0; i < this.waitingUsers.length; i++) {
  console.log(waitingUsers[i].id);
}
console.log('\n\ntimeLoop 5');
console.log(timeLoop());
for (i = 0; i < this.waitingUsers.length; i++) {
  console.log(waitingUsers[i].id);
}
console.log('\n\ntimeLoop 6');
console.log(timeLoop());
for (i = 0; i < this.waitingUsers.length; i++) {
  console.log(waitingUsers[i].id);
}*/
