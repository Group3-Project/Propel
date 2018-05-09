module.exports = function(app,express,server,user_fb_id,Player,user_fb_name,io,user_list,users){ //Get all the passed variables

//var users = {};
//var user_list = [];
	//console.log('users abiut to be bhfoijhvrdvjhsdhuf');
	//console.log(users);
//console.log('users length here 1 ' + users.length);
var user_id_list = [];
//listen on every connection
io.sockets.on('connection', function(socket){
	//console.log('users length here 2 ' + users.length);
     if(user_fb_id){
	     //console.log('users length here 3 ' + users.length);
	    socket.nickname = user_fb_name;
            users[socket.nickname] = socket;
	     //console.log('users length here 4 ' + users.length);
     	    updateNicknames();
	     //console.log('users length here 5 ' + users.length);
	    ////console.log(users);
     }
    function updateNicknames(){
	//console.log('users length here 6 ' + users.length);
        var temp_list = [];
    	for (i = 0; i < Object.keys(users).length; i++){
            tempObj = {
              	 'name' : Object.keys(users)[i],
              	  'id' : users[Object.keys(users)[i]].id
            }
	    if(user_list.indexOf(Object.keys(users)[i]) == -1){
		user_list.push(Object.keys(users)[i]);
	    }
            temp_list.push(tempObj);

       	 }
	    //console.log('users length here 7 ' + users.length);
	    user_id_list = [];
	    user_id_list = temp_list;
        io.sockets.emit('usernames', temp_list);
    }

    //listen on new_message
    socket.on('send message', function(data, callback){
	    //console.log('users length here 8 ' + users.length);
        var msg = data.trim();
        if(msg.substr(0,3) === '/w '){
		msg = msg.substr(3);
		var ind = msg.indexOf('/');
		if(ind !== -1){
		//console.log('-1 whispering here');
                var name = msg.substring(0, ind);
                var msg = msg.substring(ind + 1);
		var n = name.toString().toLowerCase().replace(/\s/g, '');
		////console.log('-1 whispering here 2');
		////console.log('xXx' + n + 'xXx');
		//console.log('users length here 9 ' + users.length);
		for (var property in users) {
		    if (users.hasOwnProperty(property)) {
			if (property.toString().toLowerCase().replace(/\s/g, '') == n) {
				socket.broadcast.to(user_fb_name).emit('whisper', {msg: msg, nick: socket.nickname});
				break;
			}
			//console.log('\n\n\nproperty print' + property);
		    }
		}
		for(var i = 0; i < user_id_list.length; i++) {
			////console.log(users[i].name.toLowerCase().replace(/\s/g, ''));
			if (user_id_list[i].name.toLowerCase().replace(/\s/g, '') == n) {
				socket.broadcast.to(user_id_list[i].id).emit('whisper', {msg: msg, nick: socket.nickname});
				break;
			}
		}



            }

          } else {
            io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
          }    
      });

    //socket.on('disconnect', function(data){
    /*socket.on('kill_user', (data)=>{ //Only disconnect if Logout is pressed, cacthes the emit from mainController
        delete users[socket.nickname];
        Player.onDisconnect(socket);
	user_fb_id = null;
        updateNicknames();
    });*/

    socket.on('typing', function(data){
        io.sockets.emit('typing', {nick : user_fb_name});
    });
});
}
