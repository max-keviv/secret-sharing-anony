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

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useCreateIndex: true, 
useUnifiedTopology: true},()=>console.log("connected to db"));
mongoose.set("useCreateIndex",true);
const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

// const secret = "thisisvivekvishal";
// userSchema.plugin(encrypt,{ secret: process.env.SECRET , encryptedFields: ["password"] });

const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

///////////////////// GET REQUESTs ////////////////////////

app.get("/",function(req,res)
{
    res.render("home");
});

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
    if(req.isAuthenticated())
    {
        res.render("secrets");
    }
    else
    {
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res)
{
    req.logout();
    res.redirect("/login");
});

/////////////////////////  POST REQUESTs    ///////////////////////////////

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

app.listen(4000,()=>{console.log("server running at port 4000")});