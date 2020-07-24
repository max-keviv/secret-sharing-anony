//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();
const mongoose = require("mongoose");   
const encrypt = require("mongoose-encryption");
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));


// console.log(process.env.SECRET);

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useCreateIndex: true, 
useUnifiedTopology: true},()=>console.log("connected to db"));

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

// const secret = "thisisvivekvishal";

userSchema.plugin(encrypt,{ secret: process.env.SECRET , encryptedFields: ["password"] });

const User = new mongoose.model("user",userSchema);


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
})


app.post("/register",(req,res)=>{
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save(function(err){
        if(err)
        {
          console.log(err);
        }
        else{
            res.render("secrets");
        }
    });
});

app.post("/login",(req,res)=>{
    const username= req.body.username;
    const password= req.body.password;

    User.findOne({email:username},(err,foundUser)=>{
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                 if(foundUser.password === password){
                    res.render("secrets");
                    console.log(foundUser);
                 }
                 else console.log("wrong password\n authentication failed");
            }
        }
    })
});

app.listen(4000,()=>{console.log("server running at port 4000")});