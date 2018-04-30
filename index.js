
//Initialise the DB 
var mysql = require('mysql');
var connection = mysql.createConnection({
  host : '127.0.0.1',
  user: 'root',
  password : 'toor',
  database : 'propel'
});

connection.connect(function(error){
  if(!!error){
    console.log('mysql error' + error);
  }else{
    console.log('connected to mysql');
  }
});

//app setup 
var express = require('express');
var session = require('express-session');


var app = express();

var server = require('http').Server(app);

server.listen(80);


// authorization- flow
var passport = require('passport');
app.use(session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());



//define the view engine (dynamic html in /view )
app.set('view engine', 'ejs')
//app.set('port', process.env.PORT || 80);


//blocks the meta data contained in headers
app.disable('x-powered-by');

//static files 
app.use(express.static('./public'))

//define controllers
var fbauthController = require('./controllers/fbauthController'); 
var mainController = require('./controllers/mainController');

//launch controllers
mainController(app,connection, express, server);
fbauthController(app,passport,connection);


