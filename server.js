// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var responseTime = require('response-time');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(responseTime());

var port = process.env.PORT || 3000;        // set our port




// REGISTER OUR ROUTES -------------------------------
var azure = require('./routes/azure.js');
var azureimport = require('./routes/azureimport.js');

app.use('/api', azure);
app.use('/api', azureimport);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);