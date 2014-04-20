var
	root 	= __dirname,
	ems		= {service: "looenet.com", host:'mail.looenet.com',auth:{user: "ishotgun",pass: "spyder"}},
	dbf 	= root+'/cs3.db',
	debug 	= 'file',
	freq 	= 0,
	emails 	= false,
	port	= 80,
	tzone	= 'Asia/Singapore';

module.exports = {	

	root	: root,
	dbf 	: dbf,
	debug 	: debug,
	freq 	: freq,
	emails 	: emails,
	tzone	: tzone,
	port	: port,

	dbRows:		dbRows,
	dbExec:		dbExec,
	sensors:	sensors,	
	discover:	discover,	
	readTemp:	tempTry,
	email:		sendMail,

	ascii:		function (val){return String.fromCharCode(val)},
	pad:		function(number, length) {var str = '' + number; while (str.length < length) { str = '0' + str;} return str;},
	daySec:		function(){ var now = new Date(); return ((now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds());},
	dayMin:		function(){ return parseInt(daySec() / 60);},
	hm2ts:		function(hrmin,time) { 
					var ts = new Date(); 
					ts.setHours(parseInt(hrmin/60)); ts.setMinutes( (hrmin % 60)); ts.setSeconds(0); 
					if(time) return ts.getTime(); else return ts.toISOString().replace(/T/, ' ').replace(/\..+/, '');
				},
	mdays:		function (m,y){return /8|3|5|10/.test(--m)?30:m==1?(!(y%4)&&y%100)||!(y%400)?29:28:31;},

	nowms:		function(){return new Date().getTime()},
	
	nowtz:		function(){var time = require('time'); var a = new time.Date(1337324400000); a.setTimezone('Europe/Amsterdam'); return a;},
	
	fromto:		function(os,dwm,cb){
					dwm = dwm || 'm'; 
					var from = new Date(), to = new Date(), now = new Date(), tos = now.getTimezoneOffset() * 60000;
					if(dwm=='m'){os = now.getMonth() + os ; to.setMonth(os+1); from.setDate(1); from.setHours(0,0,0,0);from.setMonth(os); to.setDate(1); to.setHours(0,0,0,0);}
					else {if(dwm=='w') {os = (os-1) * 7;os2 = os + 7;} else os2 = os;
					from.setDate(now.getDate()+os); from.setHours(0,0,0,0);to.setDate(now.getDate()+os2+1); to.setHours(0,0,0,0);}
					return {from:from.getTime(),to:to.getTime(),fromS:mydate(from),toS:mydate(to)};		
				},

	pivot:		function(data,rowid,colid,cell,opt){
					var lrow=[],crow=[],drow=[], nc=opt.nc||'';
					for(var i in data) {if(lrow.indexOf(data[i][rowid])=== -1) lrow.push(data[i][rowid]);if(crow.indexOf(data[i][colid])=== -1) crow.push(data[i][colid]);}
					if(!isNaN(data[0][colid])) crow.sort(function (a,b){return a-b}); else crow.sort();
					for(var r in lrow) {drow.push([lrow[r]]);for(var c in crow) {drow[r].push(nc);}}
					if(!isNaN(data[0][rowid])) lrow.sort(function (a,b){return a-b}); else lrow.sort();
					for(var i in data) {var c = crow.indexOf(data[i][colid])+1, r = lrow.indexOf(data[i][rowid]);drow[r][c] = data[i][cell];}
					return {rows:drow,rowhead:lrow,colhead:crow};	
				},

	exec:		function (cmd,cb){
					//console.log(cmd);
					var childProcess = require('child_process');
					childProcess.exec(cmd,function (error, stdout, stderr) {
						if(typeof(cb)=="function") {
							if(error){ return cb(error,stderr);}
							else return cb(stdout);
						} else return null;
					});
				},

	cl:			cl,
}


function mydate(date){ return date.getDate()+'/'+date.getMonth()+'/'+date.getFullYear();}

// Console Log
function cl(dat){switch(debug){ case true:return console.log(dat); case false:return false; case "file":return update_log(dat);}}

// Try Twice
function tempTry(sid,cb){ 
	readTemp(sid,function(dev){ 
		if(dev.up) return cb(dev); 
		else {
			cl(sid+' > Read Failed');
			readTemp(sid,function(dev){return cb(dev)})
		}
	})
}

function dbExec(sql,cb){
	var db = dbConnect(dbf); 
	db.exec(sql,function(err){ 
		if(!err) err='dbok'; cb(err);
		db.close(); db=null; sql=null; err=null;
	});
}

// SELECT
function dbRows(sql,cb){
	var db = dbConnect(dbf); 
	db.all(sql, function(err,rows) {
		if(err) rows = {error:err}; else if(rows.length==1) rows=rows[0];cb(rows);
		db.close(); rows=null;sql=null;db=null;err=null;
	});
}

function sensors(cb){
	var async = require('async');
	discover(function(sids){
		var devs = [];
		async.forEach(sids, function(item, next) {
			tempTry(item,function(dev){ devs.push(dev); next();})
		}, function(err){ cb(devs); devs=null; item=null; async.null;});		
	});
}

function discover(cb){	
	var childProcess = require('child_process');
	childProcess.exec('cat /sys/bus/w1/devices/w1_bus_master1/w1_master_slaves', function (error, stdout, stderr) {
		var cbd = stdout.substring(0,stdout.length-1).split("\n");
		cb(cbd); cbd=null;error=null;stdout=null;stderr=null;childProcess=null;
	});
}

function readTemp(sid,callback){
	var v={}, fs = require('fs');
	fs.readFile('/sys/bus/w1/devices/'+sid+'/w1_slave', function(err, buffer) {
		v.data = buffer.toString('ascii').split(" ");
		v.ok = v.data[11].split('\n')[0];
		v.temp = parseFloat(v.data[20].split('t=')[1].replace('\n','')/1000);
		if(err || v.ok != 'YES') {v.temp = null; v.ok=false;} else v.ok=true;
		v.cbd = {sid:sid,stamp:Date.now(),temp:v.temp,up:v.ok};
		callback(v.cbd);
		v=null; buffer=null; err=null; fs=null;
	});
}

function dbConnect(dbf){
	var sqlite3 = require('sqlite3').verbose();
	return new sqlite3.Database(dbf);
};

function update_log (str) {
	var fs = require('fs');
	var v = {path:root+'/cs.log',dt:new Date().toString()};
	v.st = fs.createWriteStream(v.path,{'flags':'a+','encoding':'utf8','mode': 0644}); 
	v.st.write(v.dt + " ", 'utf8'); 
	v.st.write(str+"\n", 'utf8');	
	v.st.end(); v=null; fs=null; str=null;
}

function sendMail(data){
	var email = require("nodemailer");
	var smtp = email.createTransport("SMTP",ems);
	smtp.sendMail(data, function(err, res){
	    if(err) cl(err);
	    else cl("Message sent: " + res.message);
	    smtp.close();
	});
}
