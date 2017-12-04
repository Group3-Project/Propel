
//Initialise the DB 
var mysql = require('mysql');
var connection = mysql.createConnection({
	host : 'localhost',
	user: 'root',
	password : 'LAMPAmirgo42',
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
// auth module 
var passport = require('passport');

var fbauthController = require('./controllers/fbauthController'); 
var mainController = require('./controllers/mainController');


var app = express();


//define the view engine (dynamic html in /view )
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 8080 );

//blocks the meta data contained in headers
app.disable('x-powered-by');

//static files 
app.use(express.static('./public'))


//launch controllers
mainController(app,connection);
fbauthController(app,passport,connection);

app.listen(app.get('port'), function(){
	console.log("express strated");
});


