var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function (app,passport,db) { //Initialise the login
	passport.serializeUser(function(user, done) {
	done(null, user._json);
});

passport.deserializeUser(function(id, done) { //Setting the id to null, eg. after logout happens
	done(null,id);
});

passport.use(new FacebookStrategy({
	clientID: '960280067443569',
	clientSecret: '4ed9c2ce7f70d9912c94e29f3cbfc139',
	callbackURL: "http://reyleight.com/auth/facebook/callback",
	profileFields: ['id','displayName', 'email'] 
},
function(accessToken, refreshToken, profile, done) {
  	profile_data = {};
  	profile_data. email = profile._json.email;
  	profile_data.fb_id = profile._json.id;
  	profile_data.name = profile._json.name;
	
//Check if user with that FB_id isn't aleady registerd in the Database
db.query("select count(1) from users where fb_id = " + profile_data.fb_id) as duplicateCheck',function(err,resp){

if(err){ //Error Handling
        console.log(err);
      };
	
if(resp[0].duplicateCheck == 0){
	db.query('Insert into users Set ? ', profile_data, function(err,resp){
        if (err) throw err;
		console.log('Data Saved Succesfully');
	});
	}else{
        	console.log("User already exists");
	}
});
done(null,profile);
}
));

/*Facebook will redirect the user to this URL after approval. Finish the authentication process by attempting to obtain an access token.
If access was granted, the user will be logged in. Otherwise, authentication has failed.*/

app.get('/auth/facebook/callback',passport.authenticate('facebook', {failureRedirect: '/login' }),function(req,res){
	res.redirect('/');
});

app.get('/auth/facebook',passport.authenticate('facebook', { scope: ['email','public_profile']}));
return passport;
};
