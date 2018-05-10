module.exports = function(app,express,server,user_fb_id,Player,user_fb_name,io,user_list,users){ //Get all the passed variables

var user_id_list = [];
var wheretoemit;
	
//listen on every connection
io.sockets.on('connection', function(socket){

     if(user_fb_id){
	    socket.nickname = user_fb_name;
            users[socket.nickname] = socket;
     	    updateNicknames();
     }
    function updateNicknames(){
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
	    user_id_list = [];
	    user_id_list = temp_list;
        io.sockets.emit('usernames', temp_list);
    }

    //listen on new_message
    socket.on('send message', function(data, callback){
        var msg = data.trim();
        if(msg.substr(0,3) === '/w '){
		msg = msg.substr(3);
		var ind = msg.indexOf('/');
		if(ind !== -1){
                var name = msg.substring(0, ind);
                var msg = msg.substring(ind + 1);
		var n = name.toString().toLowerCase().replace(/\s/g, '');
		for(var i = 0; i < user_id_list.length; i++) {
			if (user_id_list[i].name.toLowerCase().replace(/\s/g, '') == n) {
				var emitto = user_id_list[i].id;
				//users[name].emit('whisper', {msg: msg, nick: socket.nickname});
				users[socket.nickname].emit('whisper', {msg: msg, nick: socket.nickname});
				break;
			}
		}
            }
          } else {
            io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
          }    
      });

    socket.on('typing', function(data){
        io.sockets.emit('typing', {nick : user_fb_name});
    });
});
}
