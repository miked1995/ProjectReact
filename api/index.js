const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const https = require('https');
const http = require('http');
const swaggerUi = require('swagger-ui-express'),
swaggerDocument = require('./swagger.json');
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const { MongoClient } = require("mongodb");
const uri =   "mongodb://localhost:27017";
const client = new MongoClient(uri);

//Code Here//

let var1 = []

app.get('/hello', urlencodedParser, function (req, res) {
    res.send('Hello World, from express');
  })

/* Schema For User Auth
const userSchema = new mongoose.Schema({
  name:{type:String, required:true},
  email:{type:String, required:true, unique:true},
  password:{type:String,required:true}
},{collection:'Users'}
const User= mongoose.model("User",userSchema);*/

//Generate random token
function randomToken() {
  const chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
  const randomArray = Array.from(
    { length: 10 },
    (v, k) => chars[Math.floor(Math.random() * chars.length)]
  );

  const randomString = randomArray.join("");
  return randomString;
}

//Generate random value
function randomValue(){
  let value = Math.floor(Math.random() * 99 ) + 1 ;
  return value;
}

///////////////////////////Users////////////////////////////
//Register User
app.post('/registo', urlencodedParser, function (req, res) {
    let reg = req.body;
    
    console.log(req.body);
    var1.push(reg);

    MongoClient.connect(uri, function(err, db) {
      if (err) throw err;
      var dbo = db.db("ProgWeb_Work1");
      var query = {email: reg.email};

      dbo.collection("Users").find(query).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);

        if(result.lenght == 0){
          dbo.collection("Users").insertOne(reg, function(err, result) {
            if (err) throw err;
            res.send('User added to the database');
            db.close();
          });
        }
        else{
          res.send('Register failed! Email already in use!');
          db.close();
        }
      });
    }); 
});

//Login User
app.post('/login', urlencodedParser, function (req, res) {
  let log = req.body;
  MongoClient.connect(uri, function(err, db) {
    var dbo = db.db("ProgWeb_Work1");
    var query = { name: log.name , password: log.password};
    var query1 = { id: randomToken(), email: log.email};

    dbo.collection("Users").find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      if(result.length == 1){
        dbo.collection("Session").insertOne(query1, function(err, result) {
          if (err) throw err;
          res.send('Login successfull!');
          db.close();
       });
      }
      else{
        res.send('Login failed!');
        db.close();
      }
    });
  });
});

//Logout User
app.post('/logout', urlencodedParser, function (req, res){
  let log = req.body;
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    var dbo = db.db("ProgWeb_Work1");
    query = {email: log.email};
    dbo.collection("Session").deleteMany(query, function(err, obj) {
      if (err) throw err;
      res.send("Logout successfull");
      db.close();
    });
  }); 
});

//Equpment history
app.get('/userhistory', urlencodedParser, function (req, res){
  let log = req.body;
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    var dbo = db.db("ProgWeb_Work1");
    var query = {user: log.user};
    
    dbo.collection("Logs_Equipments").find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);

      if(result.lenght != 0){
        console.log(result);
        res.json(result);
        db.close;
      }
      else{
        res.send("Error! User inserted not in the database");
        db.close;
      }
    });
  });
});

//Get Users
app.get('/users', urlencodedParser, function (req, res) {
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    var dbo = db.db("ProgWeb_Work1");
    //var query = { name: "*" };
    dbo.collection("Users").find().toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      db.close();
      res.json(result);
    });
  }); 
});

////////////////////////Equipments//////////////////////////
//Register Equipment
app.post('/devices', urlencodedParser, function (req, res) {
  let reg = req.body;

  console.log(req.body);
  var1.push(reg);

  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    var dbo = db.db("ProgWeb_Work1");
    var datetime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var query = {name: reg.name, model: reg.model, sn: reg.sn};
    var query1 = {type: "Insert", name: reg.name, model: reg.model, sn: reg.sn, user: reg.user, datetime: datetime};
    var query2 = {sn: reg.sn};
    var query3 = {name: reg.name, model: reg.model, sn: reg.sn, temperature: randomValue()};

    dbo.collection("Equipments").find(query2).toArray(function(err, result) {
      if (err) throw err;

      if(result.length != 1){
        dbo.collection("Equipments").insertOne(query, function(err, result) {
          if (err) throw err;
          console.log("1 document inserted");
          res.send('Device added to the database');
  
          dbo.collection("Logs_Equipments").insertOne(query1, function(err, result){
            if (err) throw err;
          });

          dbo.collection("Monitorization").insertOne(query3, function(err, result) {
            if (err) throw err;
            db.close();
          });
        });
      }
      else{
        res.send("Serial number already exists!");
        db.close;
      }
    });
  }); 
});

//Delete Equipment
app.post('/unregister', urlencodedParser, function (req, res){
  let log = req.body;
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    var dbo = db.db("ProgWeb_Work1");
    var query = {sn: log.sn};
    var datetime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var query1 = {type: "Delete", name: log.name, model: log.model, sn: log.sn, user: log.user, datetime: datetime};
    
    
    dbo.collection("Equipments").find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      
      if(result.length == 1){
        dbo.collection("Equipments").deleteMany(query, function(err, obj) {
          if (err) throw err;
        });

        dbo.collection("Logs_Equipments").insertOne(query1, function(err, result){
          if (err) throw err;
          res.send("Equipment unregistered successfully");
        });

        dbo.collection("Monitorization").deleteMany(query, function(err, obj) {
          if (err) throw err;
          db.close();
        });
      }
      else{
        res.send("Equipment doesn't exist!");
        db.close;
      }
    });
  });
});

//Equipment monitorization
app.get('/monitorization', urlencodedParser, function (req, res){
  let log = req.body;
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    var dbo = db.db("ProgWeb_Work1");
    var query = {sn: log.sn};
    
    dbo.collection("Monitorization").find(query).toArray(function(err, result) {
      if (err) throw err;

      if(result.length != 0){
        console.log(result);
        res.json(result);
        db.close;
      }
      else{
        res.send("Error! Serial number inserted not in the database");
        db.close;
      }
    });
  });
});

//Equpment history
app.get('/devicehistory', urlencodedParser, function (req, res){
  let log = req.body;
  MongoClient.connect(uri, function(err, db) {
    if (err) throw err;
    var dbo = db.db("ProgWeb_Work1");
    var query = {sn: log.sn};
    
    dbo.collection("Logs_Equipments").find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);

      if(result.length != 0){
        console.log(result);
        res.json(result);
        db.close;
      }
      else{
        res.send("Error! Serial number inserted not in the database");
        db.close;
      }
    });
  });
});

//Connection to Database
app.get('/mongodb', urlencodedParser, function (req, res) {
    async function run() {
        try {
          // Connect the client to the server (optional starting in v4.7)
          await client.connect();
          // Establish and verify connection
          await client.db("admin").command({ ping: 1 });
          console.log("Connected successfully to server");
          res.json("Connection to database worked");
        } finally {
          // Ensures that the client will close when you finish/error
          await client.close();
        }
      }
      run().catch(console.dir);
});

//End Code//

app.use(
  '/api-docs',
  swaggerUi.serve, 
  swaggerUi.setup(swaggerDocument)
);
app.listen(8001, () => {
  console.log("server listening on port 8001");
});