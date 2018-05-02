module.exports = function(app,express,server, user_fb_id,user_fb_name,io){ //Get all the passed variables

var users = {};

//listen on every connection
io.sockets.on('connection', function(socket){

users[user_fb_name] = socket;
updateNicknames();

    function updateNicknames(){
        io.sockets.emit('usernames', Object.keys(users));
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
                    users[name].emit('whisper', {msg: msg, nick: user_fb_name});
                } else{
                    callback('Error! Enter a valid User.');
                }
            } else{
                    callback('Error! Enter a message for your Whisper');
                }
            
        } else{
        io.sockets.emit('new message', {msg: msg, nick: user_fb_name});
        }
    });

  

    socket.on('disconnect', function(data){
        if(!user_fb_name) return;
        delete users[user_fb_name];
        updateNicknames();
    });

    socket.on('typing', function(data){
        io.sockets.emit('typing', {nick : user_fb_name});
    });
});
}
