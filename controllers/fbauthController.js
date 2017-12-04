
var FacebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session');

module.exports = function (app,passport,db) {

  
  	app.use(passport.initialize());
  	app.use(passport.session());
	app.use(session({
		  secret: 'keyboard cat',
		  resave: false,
		  saveUninitialized: true,
		  cookie: { secure: false }
	}));

	passport.serializeUser(function(user, done) {
	  done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user) {
	    done(err, user);
	  });
	});

	passport.use(new FacebookStrategy({
    clientID: '960280067443569',
    clientSecret: '4ed9c2ce7f70d9912c94e29f3cbfc139',
    callbackURL: "http://localhost:3014/auth/facebook/callback",
    profileFields: ['id','displayName', 'email'] 
  },
  function(accessToken, refreshToken, profile, done) {
  	
  	profile_data = {};

  	profile_data. email = profile._json.email;
  	profile_data.fb_id = profile._json.id;
  	profile_data.name = profile._json.name;

  	// db.query('insert into users set ? ', profile_data, function(err,resp){
  	// 	if (err) throw err;
  	// 	console.log('data saved succesfully');
  	// } );
  	
    done(null,profile);
  }
));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.

// app.get('/auth/facebook/callback',passport.authenticate('facebook', {successRedirect: '/', failureRedirect: '/login' }),function(res,req){
	
// });

app.get('/auth/facebook/callback',passport.authenticate('facebook', { failureRedirect: '/login' }),function(res,req){
	res.render('index');
});

app.get('/auth/facebook',passport.authenticate('facebook', { scope: ['email','public_profile']}));

return passport;
};

