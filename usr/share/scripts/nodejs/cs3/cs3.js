var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , fn = require('./func');

var app = express();

//fn.exec('timedatectl set-timezone '+fn.tzone);

//var logfile = fs.createWriteStream('./logfile.log', {flags: 'a'});

// all environments
app.set('port', process.env.PORT || fn.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
//app.use(express.logger({stream: logfile}));

//app.use(express.bodyParser());
app.use(express.json());
app.use(express.urlencoded());

app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(__dirname + '/public'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  fn.cl('Express server listening on port ' + app.get('port'));
});

