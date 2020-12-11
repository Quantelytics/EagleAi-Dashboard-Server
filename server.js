const express = require('express');
const app = express();
var cors = require('cors')
//To make app run on any cross origin
app.use(cors())


var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('server.properties');
var database = require('./config/database');  

//server details
var port = process.env.BACKEND_PORT || process.env.PORT || 3000; 
const serverName =  properties.get('server.host.name');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Routes
require('./app/routes.js')(app);

// To Make app listen at particular port
app.listen(port, serverName, function () {
    console.log("Server is running on "+ port +" port");
});
