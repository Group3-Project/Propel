//Initialise the DB 
var mysql = require('mysql');
var connection = mysql.createConnection({ //Establishing the connection
  host : '127.0.0.1',
  user: 'root',
  password : 'toor',
  database : 'propel'
});

connection.connect(function(error){ //Error Handler
  if(!!error){
    console.log('MySQL Error' + error);
  }else{
    console.log('Connected to MySQL');
  }
});

//App setup
var express = require('express');
var session = require('express-session');
var app = express();
var server = require('http').Server(app);

server.listen(80);

//Authorization-Flow
var passport = require('passport');
app.use(session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

//Define the view engine (dynamic html in /view )
app.set('view engine', 'ejs');
//jquery 
app.use(require('express-jquery')('/jquery.js'));

//Blocks the meta data contained in headers
app.disable('x-powered-by');

//Static files 
app.use(express.static('./public'));

//Definining the controllers needed for core Functionality
var fbauthController = require('./controllers/fbauthController');
var mainController = require('./controllers/mainController');

//Launch the defined controllers
mainController(app,connection, express, server);
fbauthController(app,passport,connection, server);
