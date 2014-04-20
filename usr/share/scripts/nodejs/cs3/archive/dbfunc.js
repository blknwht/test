var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , sqlite3 = require('sqlite3').verbose();

var app = express();

//var logfile = fs.createWriteStream('./logfile.log', {flags: 'a'});

// all environments
app.set('port', process.env.PORT || 3300);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
//app.use(express.logger({stream: logfile}));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(__dirname + '/public'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function ag(){
	var sqlite3 = require('sqlite3').verbose();
	var db = new sqlite3.Database('/Users/pac/node/ag.sqlite');
	db.each("select rowid, tstamp from data", function(err, row) {
		var d = new Date();
		var ts = row.tstamp.toString();
		if(ts.length == 9) ts = '0'+ts;
		d.setYear(parseInt(ts.substring(0,2))+2000);
		d.setMonth(parseInt(ts.substring(2,4))-1);
		d.setDate(parseInt(ts.substring(4,6)));
		d.setHours(parseInt(ts.substring(6,8)));
		d.setMinutes(ts.substring(8,10));
		d.setSeconds(0);
		var sql = "UPDATE data SET stamp = "+d.getTime()+" WHERE rowid="+row.rowid;
		console.log(sql);
		db.exec(sql,function(err){});
	});

}

ag();