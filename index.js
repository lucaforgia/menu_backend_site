"use strict";

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var path = require('path');
var compression = require('compression');
// var formidable = require('formidable');




var app = express();
app.use(compression({ threshold: 0 }));
app.use(express.static('public'));
app.use(express.static('bower_components'));
// app.use(morgan('combined'));
app.use(bodyParser.json());
// app.use(function(req,res,next){
// 	res.header("Access-Control-Allow-Origin", "*");
// 	res.header("Access-Control-Allow-Methods","POST, GET, OPTIONS, PUT, DELETE");
// 	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
// 	next();
// });
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/menu_backend');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  // console.log('mongoose funziona')
});

var TierSchema = new mongoose.Schema({
	title: {type:String},
	href:String,
	children:{type:Array, default:[]},
	parent:{type:mongoose.Schema.ObjectId, default:null},
	sort: {type:Number, default:null}
});

var Tiers = mongoose.model('tiers', TierSchema);
app.use(function(req,res,next){
	res.locals.tiers = Tiers;
	res.locals.mongoose = mongoose;
	next();
});

// app.use(function(req,res,next){
// 	setTimeout(function(){
// 		next();
// 	},5000);
// });


var tiers_root = '/api/tiers/';
app.use(tiers_root,require('./routes/api')); // api for change database

app.use('/api/fill_standard', require('./routes/reset_database')); // reset database

app.all('*',function(req,res,next){
	res.send('page not found');
	res.status('404').end();
});

app.use(function(err, req, res, next) {
	// console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n');
	// console.log(err);
	// console.log('\n');
	// console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n');
	if (res.headersSent) {
		return next(err);
    }
	res.status(500);
    res.send({"error":{"message":err.message}});
});

var server = app.listen('3000');

module.exports = {
	server:server,
	app:app
};
