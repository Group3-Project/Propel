
var FacebookStrategy = require('passport-facebook').Strategy;




module.exports = function (app,passport,db) {


	passport.serializeUser(function(user, done) {
	  done(null, user._json);
	});

	passport.deserializeUser(function(id, done) {
	  // User.findById(id, function(err, user) {
	  //   done(err, user);
	  // });
    done(null,id);
	});

	passport.use(new FacebookStrategy({
    clientID: '960280067443569',
    clientSecret: '4ed9c2ce7f70d9912c94e29f3cbfc139',
    callbackURL: "http://10.72.96.115/auth/facebook/callback",
    profileFields: ['id','displayName', 'email'] 
  },
  function(accessToken, refreshToken, profile, done) {
  	
  	profile_data = {};

  	profile_data. email = profile._json.email;
  	profile_data.fb_id = profile._json.id;
  	profile_data.name = profile._json.name;

    //check if user with that fb_id isnt aleady registerd in the db
    db.query('select exists (select 1 from users where fb_id =  ?) as duplicateCheck', profile_data.fb_id, function(err,resp){
      if(err){
        //handleerror
        console.log(err);
      }

      if(resp[0].duplicateCheck == 0){

      db.query('insert into users set ? ', profile_data, function(err,resp){
        if (err) throw err;
         console.log('data saved succesfully');
      });

      }else{
        console.log("User already exists");
      }

     
    });

    done(null,profile);
  }
));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.


app.get('/auth/facebook/callback',passport.authenticate('facebook', {failureRedirect: '/login' }),function(req,res){

  res.redirect('/');

});


app.get('/auth/facebook',passport.authenticate('facebook', { scope: ['email','public_profile']}));

return passport;
};

