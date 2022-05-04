//requiring modules
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const multer = require("multer");
const passport = require("passport");
const https = require("https");
const fetch = require('node-fetch');
const { UserInfo } = require("git");

var today = new Date();
var date = today.getDate()+'-'+(today.getMonth()+1)+'-'+today.getFullYear()




//setting up the app
const app = express()
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



// connecting to mongoose and creating a new dataabase
mongoose.connect("mongodb://admin-sangeeta:JLlCixxIoO3lYCwJ@cluster0-shard-00-00.vllwc.mongodb.net:27017,cluster0-shard-00-01.vllwc.mongodb.net:27017,cluster0-shard-00-02.vllwc.mongodb.net:27017/spaceDB?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority",  { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true });


// creating a schema for blogdb
const cardSchema = new mongoose.Schema ({
  title: String,
  content: String,
  source: String,
  date: String,
  by: String
})
const Card = new mongoose.model("Card", cardSchema);


//creating schema for user db
const userSchema = new mongoose.Schema ({
  username: String,
  email: String
})
const User = new mongoose.model("User", userSchema);





//responsing with home.ejs file when / route is access
app.get("/", (req, res) => {
  res.render("home")
})

//responsing with explore.ejs file when /explore route is access
app.get("/explore", (req, res) => {
  res.render("explore")
})


//Astronomy Picture of the Day
app.get("/apod", (req, res) => {

  https.get("https://api.nasa.gov/planetary/apod?api_key=AigZS5sGYaeGiCcEftyYyb7QUkcuXMAOl6OJ43mF", function(response) {
    
    response.on("data", function(data) {
      let nasaAPOD = JSON.parse(data)
      console.log(nasaAPOD);
      res.render("apod", {nasaAPOD: nasaAPOD})
    })
  })
})


//send card.ejs when someone gets /card route
app.get("/card", (req, res) => {
  Card.find((err, foundCards) => {
    !err &&  res.render("card", {cards: foundCards})
  });
});


//parameters for fullpageview when clicked on a individual topic
app.get("/card/:topic", (req, res) => {
  Card.find((err, foundCards) => {
   (!err) && foundCards.forEach((eachCard, i=0) => {
       (i == req.params.topic) && res.render("fullpageview", {card: eachCard})
    });
  });
});



//login page
app.get("/login", (req, res) => {
  res.render("login")
})


app.get("/AdminLogin", (req, res) => {
  res.render("AdminLogin")
})


//authentication
app.post("/AdminLogin", (req, res) => {
  let username = "admin";
  let password = "space-cosmos123";

  // if username and pwd is right then get all the data from the database and forward then to admin page 
  if (req.body.username === username && req.body.password === password) {
    Card.find((err, foundCards) => {
      User.find((err, foundUsers) => {
        !err &&  res.render("admin", {cards: foundCards, users: foundUsers})
      })
    });
  } else {
    res.render("failure")
  }
})


app.get("/userLogin", function (req, res) {
  res.render('userLogin')
})


//news page
app.get("/news", (req, res) => {

  https.get("https://api.spaceflightnewsapi.net/v3/articles", function(response) {
    const chunks = []
    response.on('data', function (chunk) {
      chunks.push(chunk)
    })

    response.on('end', function () {
      const data = Buffer.concat(chunks)
      var spaceNews = JSON.parse(data)
      res.render("news", {spaceNews: spaceNews})
    })
  })
})


//reports page
app.get("/reports", (req, res) => {

  https.get("https://api.spaceflightnewsapi.net/v3/reports", function(response) {
    const chunks = []
    response.on('data', function (chunk) {
      chunks.push(chunk)
    })

    response.on('end', function () {
      const data = Buffer.concat(chunks)
      var spaceReports = JSON.parse(data)
      res.render("reports", {spaceReports: spaceReports})
    })
  })
})




//add page
app.post("/add" , (req, res) => {

  let myobj = {
    title: req.body.title,
    source: req.body.source,
    content: req.body.content,
    date : date,
    by: "Admin"
  }


  Card.create(myobj, function(err, response) {
    if (!err) {
      Card.find((err, foundCards) => {
        User.find((err, foundUsers) => {
          !err &&  res.render("admin", {cards: foundCards, users: foundUsers})
        })
      });
    }
  })
})

//users can add to databaseusing this route
app.post("/addbyuser" , (req, res) => {

  let myobj = {
    title: req.body.title,
    source: req.body.source,
    content: req.body.content,
    date : date,
    by: req.body.username
  }

  let newuser = {
    username: req.body.username,
    email: req.body.email
  }

  User.findOne({email: newuser.email}, (err, foundUser) => {
    if(err) {
      User.create(newuser, (err) => {
        if(err) console.log(err);
      })
    } else {
      console.log('do nothing');
    }
  }) 

  


  Card.create(myobj, function(err, response) {
    if (!err) {
      Card.find((err, foundCards) => {
        !err &&  res.redirect("/card")
      });
    }
  })
})

//removing item from admin page
app.get("/remove/:item", (req, res) => {
  Card.deleteOne({_id: req.params.item}, function(err) {
    if (!err) {
      Card.find((err, foundCards) => {
        User.find((err, foundUsers) => {
          !err &&  res.render("admin", {cards: foundCards, users: foundUsers})
        })
      });
    } 
  })
})

//weather page
app.get("/weather", function(req, res){
  let rightData = true
  console.log(req.body.cityName);
  res.render("weather", {weatherDescription: "", cityName: "", weatherTemp: "", imgUrl: "", rightData: rightData})
})


//weather page 
app.post("/weather", function(req, res){
  const cityName = req.body.cityName;
  console.log(req.body.cityName);
  const appId = "1c5ed49367b45ab915f439370e43a902"
  const units = "Imperial"
  const url = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName +"&appid=" + appId +"&units="+ units

  https.get(url, function(response){

    response.on("data", function(data){

      const weatherData = JSON.parse(data);
      // console.log(weatherData);
      let weatherTemp, weatherDescription, weatherIcon, imgUrl = ""
      let rightData = true
      if (weatherData.cod == '404') {
        rightData = false
      } else {
        weatherTemp = Math.floor(((weatherData.main.temp - 32)*5)/9)
        weatherDescription = weatherData.weather[0].description
        weatherIcon = weatherData.weather[0].icon
  
        imgUrl = "https://openweathermap.org/img/wn/" + weatherIcon + "@2x.png"  
      }
      
      res.render("weather", {weatherDescription: weatherDescription, cityName: cityName, weatherTemp: weatherTemp, imgUrl: imgUrl, rightData})
    })

  })
})

//contact page
app.get("/contact", function (req, res) {
  res.render("contact")
})



//setting a server, which is running the port 3000
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log("Server started on port 3000");
})
