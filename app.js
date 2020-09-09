
//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "اللحمة"
});
const item2 = new Item({
  name: "الفطور"
});
const item3 = new Item({
  name: "الحلى"
});
const item4 = new Item({
  name: "المسليات"
});
const item5 = new Item({
  name: "مويه ومشروبات"
});

item1.save()
item2.save()
item3.save()
item4.save()
item5.save()



Tasks = ["eat" , "drink" , "sleep"]

app.use(session({
      secret: "our secret",
      resave: false,
      saveUninitialized: false
    }))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://admin-mohammed:Test123@cluster0.pmygq.mongodb.net/userDB", {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
mongoose.set('useCreateIndex', true);

    const userSchema = new mongoose.Schema({
      Name: String,
      email: String,
      password: String,
      googleId: String,
      secret: String
    });

    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate);

    const User = mongoose.model("User", userSchema);

    passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLINET_SECRET,
  callbackURL: "https://shielded-wildwood-31590.herokuapp.com/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
console.log(profile);
User.findOrCreate({ googleId: profile.id , Name: profile.name}, function (err, user) {
  return cb(err, user);
});
}
));

    app.get("/", function(req, res) {
      res.render("home");
    })

    app.get("/auth/google",
      passport.authenticate("google", { scope: ["profile"] }
    ));

    app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login"}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

    app.get("/login", function(req, res) {
      res.render("login");
    })

    app.get("/register", function(req, res) {
      res.render("register");
    })

        app.get("/secrets", function(req, res){

          User.find({"secret": {$ne: null}}, function(err, foundUser){
            if(err){
              console.log(err);
            }else{
              if(foundUser){
                res.render("secrets", {userswithsecret: foundUser})
                }
              else{
                res.redirect("/")
              }
            }
          });
        })

        app.get("/submit", function(req, res){
              if(req.isAuthenticated()){
                res.render("submit");
              }else{
                res.render("login");
              }
            })

        app.post("/submit", function(req, res){
          const SubmitedSercret = req.body.secret;

          User.findById(req.user._id, function(err, foundUser){
            if(err){
              console.log(err);
            }else{
              if(foundUser){
                foundUser.secret = SubmitedSercret;
                foundUser.save(function(){
                  res.redirect("/secrets")
                })
              }else{
                res.redirect("/")
              }
            }
          })
        })

    app.get("/logout", function(req, res){
      req.logout();
      res.redirect("/");
    })

    app.post("/register", function(req, res) {

      User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
          console.log(err);
          res.redirect("register")
        }else{
          passport.authenticate("local")(req, res, function(){
            User.updateOne({username: req.body.username}, {Name: req.body.name}, function(err){
              if(err){
                console.log("12345678");
              }else{
                console.log("Sucesffuly Updated the document");
                  }
              } );
            res.redirect("/secrets")
          })
        }
      })
    })
    app.post("/login", function(req, res) {
      const user = new User({
        username: req.body.username,
        password: req.body.password

      });

      req.login(user, function(err){
        if(err){
          console.log(err);
        }else{
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets")
          })
        }
      })

    })
app.get("/task", function(req, res){
  if(req.isAuthenticated()){
    Item.find({}, function(err, result){
        res.render("task", {Task: result});
    })
  }else{
    res.render("register")
  }

  // User.find({"secret": {$ne: null}}, function(err, foundUser){
  //   if(err){
  //     console.log(err);
  //   }else{
  //     if(foundUser){
  //       }
  //     else{
  //       res.redirect("/")
  //     }
  //   }
  // });
})

app.post("/delete", function(req, res){

  console.log(req.user.username);
  User.updateOne({username: req.user.username}, {secret: req.body.uTask}, function(err){
    if(err){
      console.log("12345678");
    }else{
      console.log("Sucesffuly Updated the document");
        }
    } );

  Item.findByIdAndRemove(req.body.chickbox , function(err){
  if(err){
    console.log(err);
  }else{
      console.log("Deleted");
       res.redirect("/secrets")
}})
})


    let port = process.env.PORT;
    if (port == null || port == "") {
      port = 3000;
    }

    app.listen(port, function() {
      console.log("Server has started Successfully");
    });
