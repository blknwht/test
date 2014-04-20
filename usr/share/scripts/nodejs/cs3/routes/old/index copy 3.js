//var config = require('config.json');

g_dbf = '/usr/share/node/cs/deh.sqlite';
g_debug = true;
g_freq = 60;
g_bl = false;
g_emails = false;

//function cl(dat){if(g_debug) return console.log(dat);}
function cl(dat){if(g_debug) return update_log(dat);}

function ascii(val){return String.fromCharCode(val)}
function pad(number, length) {var str = '' + number; while (str.length < length) { str = '0' + str;}return str;}
function bit_test(num,bit){ return ((num>>bit) % 2 != 0)}
function bit_set(num,bit){return num | 1<<bit;}
function bit_clear(num,bit){return num & ~(1<<bit);}
function bit_toggle(num,bit){return bit_test(num,bit)?bit_clear(num,bit):bit_set(num,bit);}
function daySec(){ var now = new Date(); return ((now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds());}
function dayMin(){ return parseInt(daySec() / 60);}
function hm2ts(hrmin,time) { var ts = new Date(); ts.setHours(parseInt(hrmin/60)); ts.setMinutes( (hrmin % 60)); ts.setSeconds(0); if(time) return ts.getTime(); else return ts.toISOString().replace(/T/, ' ').replace(/\..+/, '');}


function update_log(str) {
	var fs = require('fs');
	var path = "/var/log/coolSense.log";
	var now = new Date();
	var dateAndTime = now.toUTCString();
	stream = fs.createWriteStream(path, {
		'flags': 'a+',
		'encoding': 'utf8',
		'mode': 0644
	});
	
	stream.write(dateAndTime + " ", 'utf8');
	stream.write(str+"\n", 'utf8')
	stream.end();
}

exports.sched = function(req, res){	
	dbRows("SELECT * from sensors WHERE active = 'true' ORDER BY macid ASC,id ASC",function(sensors){ 
		var times = [];
		dbRows("SELECT * from schedule ORDER BY hr ASC, min ASC",function(schedule){ 
			schedule.forEach(function(item) { 
				var time = parseInt(item.hr);
				if(time > 12) time = time % 12;
				time = pad(time,2) + ':' + pad(item.min,2);
				if(parseInt(item.hr) > 11) time += ' PM'; else time += ' AM';
				var rec={};
				rec.hrmin = time;
				rec.id = item.hr+'.'+item.min;
				times.push(rec);
			})
			//console.log(times);
			res.render('sched.jade', { title:'Schedules', sensors:sensors, schedule:times });
		});		
	});
};

/*
- each row in sensors
	li(data-theme="b")
		a(href="#test")=row.info
*/
exports.sensor = function(req, res){	
	dbRows("SELECT * from sensors WHERE active = 'true' ORDER BY macid ASC,id ASC",function(sensors){ 
		var sens = sensors;
		dbRows("SELECT * from schedule",function(schedule){ 
			res.render('sensor.jade', { title:'Sensor', sensors:sens, schedule:schedule});
		});		
	});
};

exports.index = function(req, res){	
	dbRows("SELECT * from sensors WHERE active = 'true' ORDER BY macid ASC,id ASC",function(sensors){ 
		var sens = sensors;
		dbRows("SELECT * from schedule",function(schedule){ 
			res.render('index.jade', { title:'Home', sensors:sens, schedule:schedule});
		});		
	});
};	

exports.sensors = function(req, res){	
	dbRows("SELECT * from sensors  WHERE active = 'true' ORDER BY macid ASC,id ASC",function(sensors){ 
		dbRows("SELECT * from schedule",function(schedule){ 
			res.render('sensors.jade', { title:'Sensors', sensors:sensors, schedule:schedule});
		});		
	});
};

exports.setup = function(req, res){	
	dbRows("SELECT * from sensors WHERE active = 'true' ORDER BY macid ASC,id ASC",function(sensors){ 
		var sens = sensors;
		dbRows("SELECT * from schedule",function(schedule){ 
			res.render('setup.jade', { title:'Setup', sensors:sens, schedule:schedule});
		});		
	});
};


exports.db = function(req,res){
	if(Object.keys(req.query).length>0) {

		var qy = req.query;
		if(!qy.mode) return res.send('bad mode');
		
		switch (qy.mode){
			case "get":	
				dbRows(qy.sql,function(json){ return res.send(JSON.stringify(json));});
				break;
			
			case "put":
				//res.send(qy.sql);
				dbExec(qy.sql,function(err){ return res.send(err);});
				break;
				
			case "now":
				for (var i = 0; i < g_ports.length; i++) {portWrite(g_ports[i]);}  
				res.send('All Sensors Updated.');
				break;
				
			case "bl":
				bload(g_ports[0]);
				res.send('OK');
				break;
			
			default: 		
				res.send(qy.mode);
				break;
		}
	}
}

function sendMail(item){
	if(!g_emails) return;
	var nodemailer = require("nodemailer");
	
	// create reusable transport method (opens pool of SMTP connections)
	var smtpTransport = nodemailer.createTransport("SMTP",{
	    service: "looenet.com",
	    host: 'mail.looenet.com',
	    auth: {
	        user: "ishotgun",
	        pass: "spyder"
	    }
	});

	var mailOptions = {
	    from: "PacMac ✔ <C00Lsense@peter-c.net>", // sender address
	    to: "pac@dis.com.sg,andy@downende.com", // list of receivers
	    xsubject: "Hello", // Subject line
	    text: "Hello world ", // plaintext body
	    xhtml: "Click <a href='"+url+"'>Here</a> to view the sensor" // html body
	}
	
	mailOptions.subject = 'Sensor S.'+item.id+'-'+item.info+' is OVER '+item.altemp+' max temperature ' + item.temp;
	var url = 'http://192.168.1.83:3000/sensor?did='+item.macid+'_'+item.id;
	mailOptions.html = "Click <a href='"+url+"'>Here</a> to view the sensor";
		
	smtpTransport.sendMail(mailOptions, function(error, response){
	    if(error){
	        console.log(error);
	    }else{
	        console.log("Message sent: " + response.message);
	    }
	
	    // if you don't want to use this transport object anymore, uncomment following line
	    smtpTransport.close(); // shut down the connection pool, no more messages
	});
}

function dbConnect(dbf){
	var sqlite3 = require('sqlite3').verbose();
	return new sqlite3.Database(g_dbf);
}

function dbRows(sql,cb){
	var db = dbConnect();
	db.all(sql, function(err,rows) { db.close(); cb(rows);});
}

function dbExec(sql,cb){
	var db = dbConnect();
	db.exec(sql,function(err){ 
		db.close(); 
		cb(err);
	});
}

var myParser = function(emitter, buffer) {
  // Inspect buffer, emit on emitter:
  if(buffer.toString("utf8", 0,1) === String.fromCharCode(1) && buffer.toString("utf8",-1,1) === String.fromCharCode(10))
    emitter.emit("foo", buffer);
  else
    emitter.emit("data", buffer);
};

var myParser = function(emitter, buffer) {
  // Inspect buffer, emit on emitter:
  if(buffer.toString("utf8", 0, 3) === "foo")
    emitter.emit("foo", buffer);
  else
    emitter.emit("data", buffer);
};

function portOpen(port){
	port.on("error", function() { console.log("error:", arguments); port.alive = false; return false;});
	port.open(function(err,cb){    
        port.on("data", function (data) {portReply(port,data);});
        port.on("close", function (path) { cl("Disconnect:" + port.path);port.alive = false; return false;});
        port.alive = true;
        return portWrite(port);
    });
}
      
/*## WRITE TO THE PORTS EVERY MINUTE ##*/
function portWrite(port){
    if(port.alive === false) {
		port.open(function(err){    
			if(err) return;        
	        port.alive = true;
	        port.on("data", function (data) {portReply(port,data);});
	        port.on("close", function (path) { cl("Disconnect:" + port.path);port.alive = false; return false;});
	        var outStr = String.fromCharCode(1) + daySec() + ":" + 0 + ":" + g_next4.join(":") + ':' + g_altemp[port.macid].join(':') + String.fromCharCode(10);
			port.write(outStr, function(err,res) { cl(daySec()+":"+port.path+' SEND:' + outStr.replace("\r\n",""));});
	    });    
    
    
    }
	else if(port.alive === true){
		var outStr = String.fromCharCode(1) + daySec() + ":" + 0 + ":" + g_next4.join(":") + ':' + g_altemp[port.macid].join(':') + String.fromCharCode(10);
		port.write(outStr, function(err,res) { cl(daySec()+":"+port.path+' SEND:' + outStr.replace("\r\n",""));});
	}
cl(g_altemp[port.macid]);
}


function sensErr(macid,id){
	
	return;
}

// Port Reply Handler
// 25440:/dev/tty.OmniTek_Bluetooth-DevB recv:19:5d:ee3e00|4|1|424|-2212||2943|
function portReply(port,reply){ 
    reply = reply.replace('\u0001','').replace("\r\n","").split('|');
    cl(daySec()+":"+port.path+' RECV:' + reply);     
	var head = reply.splice(0,3);
	var macid = head[0]; 
	var scount = parseInt(head[1])+1; 
	var pages = head[2]; 
	var id = 1;

	for (var i = 0; i < (pages * scount); i++) { 
		if(i % scount === 0) {
			var tstamp = hm2ts(reply[i],true);
			//var d = new Date(); d.setTime(tstamp); cl(d);
			var id = 1; 
			for(var s=0; s < g_sched.length; s++) { 
				//cl(g_sched[s]+':'+reply[i]); 
				var add=false; 
				if(g_sched[s] == reply[i]) {add=true; break;}

			}
		} 
		
		else {		
			if(reply[i] != '' && macid.length == 12) {
				var temp = parseInt(reply[i])/100;			
				if(temp > 84.99) {sensErr(macid,id); continue;}
				var sql = ""; var altemp = temp + 5;
				if(add) sql += "INSERT INTO data (macid,deviceid,temp,stamp) VALUES ('"+ macid +"',"+ id +","+ temp + ","+ tstamp +"); ";
				sql += "UPDATE sensors SET temp = '"+ temp +"' WHERE macid = '"+ macid +"' AND id = "+ id +"; ";
				sql += "INSERT OR IGNORE into sensors (macid,id,temp,altemp,info) values('"+ macid +"',"+ id +","+ temp +","+ altemp +",'"+macid+' - '+id+"'); ";
				cl('UPDATE: '+macid+", "+id+', '+temp); if(add) cl('INSERT@'+g_sched[s]+', '+macid+", "+id+', '+temp);
				//cl(sql); 
				dbExec(sql,function(err){})
			}
			id++;
		}
		//console.log(reply[i]+':'+g_sched[s]+':'+add);	
	}
}

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var g_ports = [];
function getPorts(){
	var i= 0; var sql = "SELECT * FROM config WHERE type = 'ports' ORDER BY id ASC";	
	dbRows(sql,function(data) { 
		data.forEach(function(item) { 
		    if(!g_ports[i] || item.id != g_ports[i].macid) {
			    var port = new SerialPort(item.value,{ baudrate:9600, parser: serialport.parsers.readline("\n") },false);
			    port.alive = false;		    
			    port.macid = item.id;
			    port.id= i;
			    g_ports.push(port);
			    cl('adding:' + port.path);
			    port.on("error", function() { cl("error:", arguments); port.alive = false;});
		    }
		    i++;		
		});
	});	
}

var g_altemp = {};
function getSensors(){
	g_altemp = [];
	var sql = "SELECT * FROM sensors where active = 'true' ORDER BY macid ASC, id ASC";	
	dbRows(sql,function(data) { 
		for(var key in data) {g_altemp[data[key].macid] = [99,99,99,99];}        
        for(var key in data) {
   			var item = data[key];
   			g_altemp[item.macid][parseInt(item.id)-1] = item.altemp;
   			alarms(item);
   		}
   	});	
}

// Do alarms
function alarms(item){
	if(!item.altemp) return;
	var now = new Date(); now = now.getTime(); var sql = false;
	if(item.altemp && item.temp > item.altemp) {
		if(item.alarmts == 0) var sql = "UPDATE sensors SET alarmts = "+ now +" WHERE macid = '"+ item.macid +"' AND id = "+ item.id +"; ";		
		else if(now - item.alarmts > parseInt(item.algrace) * 60 * 1000 && now - item.emailts > (item.algrace * 60 - 10) * 1000) {
			sendMail(item);
			var sql = "UPDATE sensors SET emailts = "+ now +" WHERE macid = '"+ item.macid +"' AND id = "+ item.id +"; ";
		}   					
	} else var sql = "UPDATE sensors SET alarmts = "+ 0 +" WHERE macid = '"+ item.macid +"' AND id = "+ item.id +"; ";	
	if(sql) dbExec(sql,function(err){});
}

// Get Schedules as Mins & add 1440 mins after midnight.
var g_sched = []; var g_next4 = []; 
function getSched(frq){	
	g_sched = []; g_next4=[];
	var now = dayMin(); var x = 0;
	var sql = "select ((hr * 60) + min) as 'min' from schedule ORDER BY hr ASC, min ASC";
	
	// Schedule based on Frequency Mins
	if(frq){ 
		now = now - (now % frq);		
		for (var i = 0; i < 4-x; i++) { 
			var min = now + i * frq;
			g_sched.push(min);
		} 
		g_next4 = g_sched;
cl(g_sched);
	}
	
	else dbRows(sql,function(data){ 
		for(var key in data) {
   			var item = data[key];
			g_sched.push(item.min); 
			if(item.min > now && x < 4) { 
				g_next4.push(item.min); 
				x++;
			}
		}

		for (var i = 0; i < 4-x; i++) { g_next4.push(g_sched[i]+1440);}
		cl(g_next4);
	});
	
}

// Get All Data
function getAll(){
	getPorts();
	getSched(5);
	getSensors();
		
}

//## Every Minute
setInterval(function() {
    var date = new Date();
    if ( date.getSeconds() === g_freq - 5) { getAll(); }
    if ( date.getSeconds() % g_freq === 0 ) {
        if(g_bl) return;
        for (var i = 0; i < g_ports.length; i++) {
            portWrite(g_ports[i]);
        }   
    }
},1010);

getAll();



/*##########################################*/
/*
function BTscan(){
	var child = require('child_process');
	var ps = child.spawn('/usr/bin/bluetoothctl', []);
	//ps.stdin.write('devices\r\n');
	ps.stdin.write('scan on\r\n');
	ps.stdout.pipe(process.stdout);
	ps.stdin.end();
}

BTscan();

var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
exec("ls -la", puts);
*/
/*
var child = require('child_process');
var ps = child.spawn('/usr/bin/bluetoothctl', ['-i']);
ps.stdout.pipe(process.stdout);
ps.stdin.write('devices');
ps.stdin.end();
*/



/*
function run_cmd(cmd, args, callBack ) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var resp = "";

    child.stdout.on('data', function (buffer) { resp += buffer.toString() });
    child.stdout.on('end', function() { callBack (resp) });
} // ()

run_cmd( "/usr/bin/bluetoothctl", ["devices"], function(text) { console.log (text) });
*/
