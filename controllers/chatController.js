module.exports = function(app,express,server,user_fb_id,Player,user_fb_name,io){ //Get all the passed variables

var users = {};

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
		console.log(temp_list.indexOf(tempObj));	
       	 }
	    
	
        io.sockets.emit('usernames', temp_list);
    }

    //listen on new_message

    socket.on('send message', function(data, callback){
        var msg = data.trim();
        if(msg.substr(0,3) === '/w '){
            msg = msg.substr(3);
            var ind = msg.indexOf(' ');
            if(ind !== -1){
                var name = msg.substring(0, ind);
                var msg = msg.substring(ind + 1);
		
                if(name in users){
                    users[name].emit('whisper', {msg: msg, nick: socket.nickname});
                } else{
                    callback('Error! Enter a valid User.');
                }
            } else{
                    callback('Error! Enter a message for your Whisper');
                }
            
        } else{
        io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
        }
    });

  

    //socket.on('disconnect', function(data){
    socket.on('kill_user', (data)=>{ //Only disconnect if Logout is pressed, cacthes the emit from mainContro
        delete users[socket.nickname];
        Player.onDisconnect(socket);
	user_fb_id = null;
        updateNicknames();
    });

    socket.on('typing', function(data){
        io.sockets.emit('typing', {nick : user_fb_name});
    });
});
}
