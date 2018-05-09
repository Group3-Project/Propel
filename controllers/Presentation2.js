game.prototype = {
  findRoom: function(id, gamerScore) {
    if (this.rooms.length == 0) {
      this.addRoom(id, gamerScore);
      return {port: this.port, id: null};
    } else {
      
      for (var i = 0; i < this.rooms.length; i++) {
        var gs = this.rooms[i].returnGamerScore();
        var t = 5 - this.rooms[i].time;
        var newId;

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
    roomIndex = this.rooms.findIndex(function(room) { return room.id === id; });
    if (this.rooms[roomIndex].noPlayers == 1) {
      this.removeRoom(id);
    } else {
      this.rooms[roomIndex].noPlayers = this.rooms[roomIndex].noPlayers - 1;
    }
  },

  removeRoom: function(id) {
    this.rooms = this.rooms.filter(function(oldRoom) {return oldRoom.id != id;});
    waitingUsersFiltered = waitingUsersFiltered.filter(function(waitingRemoval) { return waitingRemoval.id !== id; });
  },

  checkRooms: function() {
    var returnArray = [];
    var i;
    var j;

    for (i = 0; i < this.rooms.length; i++) {
      for (j = i+1; j < this.rooms.length; j++) {
        var gsi = this.rooms[i].returnGamerScore();
        var ti = 5 - this.rooms[i].time;
        var gsj = this.rooms[j].returnGamerScore();
        var tj = 5 - this.rooms[j].time;
        var newId;
        var oldId;

        if (ti == 5) {
          newId = this.rooms[i].id;
          oldId = this.rooms[j].id;
          this.joinRoom(newId, this.rooms[j].returnGamerScore());
          this.removeRoom(oldId);
          console.log('t == 5');
          returnArray.push({port: this.port, id: newId, oldId: oldId});
          break;
        }

        if (((gsj-(gsj*(0.05*tj)) <= gsi+(gsi*(0.05*ti))) && gsj-(gsj*(0.05*tj)) >= gsi-(gsi*(0.05*ti))) || (gsi-(gsi*(0.05*ti)) <= (gsj+(gsj*(0.05*tj))) && (gsi-(gsi*(0.05*ti))) >= (gsj-(gsj*(0.05*tj))))) {
          newId = this.rooms[i].id;
          oldId = this.rooms[j].id;
          this.joinRoom(newId, oldId.gamerScore);
          this.removeRoom(oldId);
          console.log('Boundary Match');
          returnArray.push({port: this.port, id: newId, oldId: oldId});
        }
      }
    }
    return returnArray;
  }
}