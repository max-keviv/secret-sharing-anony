//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");   
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt= require("bcrypt");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
// const md5= require('md5');
// const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

// const saltRounds=5;
// console.log(process.env.SECRET);

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://max-keviv:Vivek2000@cluster0.2tgxk.mongodb.net/userDB",{useNewUrlParser:true, useCreateIndex: true, 
useUnifiedTopology: true},()=>console.log("connected to db"));
mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret = "thisisvivekvishal";
// userSchema.plugin(encrypt,{ secret: process.env.SECRET , encryptedFields: ["password"] });

const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

/////////////////// GOOGLE strategy //////////////////

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:4000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//////////////////// FACEBOOK strategy ////////////////

passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: "http://localhost:4000/auth/facebook/secrets",
    enableProof: true
  },
  function(accessToken, refreshToken, profile, cb) {
     console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


                ///////////////

///////////////////// GET REQUESTs ////////////////////////

app.get("/",function(req,res)
{
    res.render("home");
});

//////////// GOOGLE auth //////////////// 

app.get("/auth/google",
passport.authenticate('google', { scope : ['profile'] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');

  });

//////////// FACEBOOK auth ////////////////

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { successRedirect: '/secrets',
  failureRedirect: '/login' }));
  

             ///////////////

app.get("/login",function(req,res)
{
    res.render("login");
});

app.get("/register",function(req,res)
{    
    res.render("register");
})

app.get("/secrets",function(req,res)
{
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});

app.get("/submit",function(req,res)
{
  if(req.isAuthenticated())
    res.render('submit');
    else
    res.render('login');
});

app.get("/logout",function(req,res)
{
    req.logout();
    res.redirect("/login");
});

/////////////////////////  POST REQUESTs    ///////////////////////////////

app.post("/submit",(req,res)=>{
  const submitSecret = req.body.secret;
  console.log(req.user.id);
  User.findById(req.user.id,function(err, foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser)
      {
        foundUser.secret = submitSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  })
});

app.post("/register",(req,res)=>{

    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    // bcrypt.hash(req.body.password, saltRounds ,function(err,hash){
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });

    //     newUser.save(function(err){
    //         if(err)
    //         {
    //           console.log(err);
    //         }
    //         else{
    //             res.render("secrets");
    //         }
    //     });
    // });
    
});
});

app.post("/login",(req,res)=>{
    
    const user = new User({
     username : req.body.username,
     password : req.body.password
    });

    req.login(user, function(err){
        if(err)
        {
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            });
        }
    });
    // User.findOne({email:username},(err,foundUser)=>{
    //     if(err){
    //         console.log(err);
    //     }
    //     else{
    //         if(foundUser){
    //              bcrypt.compare(password,foundUser.password,function(err,result){
    //                if(result){
    //                 res.render("secrets");
    //                 console.log(foundUser); 
    //             }
    //              else console.log("wrong password\n authentication failed");
    //         });
    //         }
    //     }
    });
// });

                // //////////////////////////// ///////////////

app.listen(process.env.PORT||4000,()=>{console.log("server running at port 4000")});