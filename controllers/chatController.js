var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.use('/public',express.static(__dirname + '/public'));

//Listen on port 3000
server.listen(process.env.PORT || 1000);

//listen on every connection
io.sockets.on('connection', function(socket){

    // Usernames
    socket.on('new user',function(data, callback){
       // console.log("user connected...");
        if(data in users){
            callback(false);
        }

        else{
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();
        }
    });

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

  

    socket.on('disconnect', function(data){
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    });

    socket.on('typing', function(data){
        io.sockets.emit('typing', {nick : socket.nickname});
    });
});
