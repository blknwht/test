g_debug = true;

function cl(dat){if(g_debug) return console.log(dat);}
//function cl(dat){if(g_debug) return update_log(dat);}

function ascii(val){return String.fromCharCode(val)}
function pad(number, length) {var str = '' + number; while (str.length < length) { str = '0' + str;}return str;}
function bit_test(num,bit){ return ((num>>bit) % 2 != 0)}
function bit_set(num,bit){return num | 1<<bit;}
function bit_clear(num,bit){return num & ~(1<<bit);}
function bit_toggle(num,bit){return bit_test(num,bit)?bit_clear(num,bit):bit_set(num,bit);}
function daySec(){ var now = new Date(); return ((now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds());}
function dayMin(){ return parseInt(daySec() / 60);}
function hm2ts(hrmin,time) { var ts = new Date(); ts.setHours(parseInt(hrmin/60)); ts.setMinutes( (hrmin % 60)); ts.setSeconds(0); if(time) return ts.getTime(); else return ts.toISOString().replace(/T/, ' ').replace(/\..+/, '');}

exports.sched = function(req, res){	
	dbRows("SELECT * from sensors WHERE active = 'true'",function(sensors){ 
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
	dbRows("SELECT * from sensors WHERE active = 'true'",function(sensors){ 
		var sens = sensors;
		dbRows("SELECT * from schedule",function(schedule){ 
			res.render('sensor.jade', { title:'Sensor', sensors:sens, schedule:schedule});
		});		
	});
};

exports.index = function(req, res){	
	dbRows("SELECT * from sensors WHERE active = 'true'",function(sensors){ 
		var sens = sensors;
		dbRows("SELECT * from schedule",function(schedule){ 
			res.render('index.jade', { title:'Home', sensors:sens, schedule:schedule});
		});		
	});
};	

exports.sensors = function(req, res){	
	dbRows("SELECT * from sensors  WHERE active = 'true'",function(sensors){ 
		dbRows("SELECT * from schedule",function(schedule){ 
			res.render('sensors.jade', { title:'Sensors', sensors:sensors, schedule:schedule});
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
				
			default: 		
				res.send(qy.mode);
				break;
		}
	}
}

function update_log(str) {
	var fs = require('fs');
	var path = "coolSense.log";
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

function dbConnect(){
	var sqlite3 = require('sqlite3').verbose();
	//return new sqlite3.Database('/usr/share/csServ/csdb.sqlite');
	return new sqlite3.Database('/users/pac/node/de.sqlite');
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
	port.open(function(err){    
        port.on("data", function (data) {portReply(port,data);});
        port.on("close", function (path) { cl("Disconnect:" + port.path);port.alive = false; return false;});
        port.on("error", function() { console.log("error:", arguments); port.alive = false; return false;});
        port.alive = true;
        return true;
    });
}
      
/*## WRITE TO THE PORTS EVERY MINUTE ##*/
function portWrite(port){
    if(port.alive === false) portOpen(port);
	if(port.alive === true){
		var outStr = String.fromCharCode(1) + daySec() + ":" + 0 + ":" + g_next4.join(":") + ':' + g_altemp[port.macid].join(':') + String.fromCharCode(10);
		port.write(outStr, function(err,res) { 
			cl(daySec()+":"+port.path+' SEND:' + outStr.replace("\r\n",""));
		});
	}
}


// Port Reply Handler
// 25440:/dev/tty.OmniTek_Bluetooth-DevB recv:19:5d:ee3e00|4|1|424|-2212||2943|
function portReply(port,reply){
    reply = reply.replace('\u0001','').replace("\r\n","").split('|');
    cl(daySec()+":"+port.path+' RECV:' + reply);     
	var head = reply.splice(0,3);
	var macid = head[0]; var scount = parseInt(head[1])+1; var pages = head[2]; var id = 1;

	for (var i = 0; i < (pages * scount); i++) { 
		if(i % scount ===0) {
			var tstamp = hm2ts(reply[i],true);
			//var d = new Date(); d.setTime(tstamp); cl(d);
			var id = 1; 
			var add=false; for(var s=0; s < g_sched.length; s++) { 
				if(g_sched[s] == reply[i]) {add=true; break;} 
			}
		} 
		
		else {		
			if(reply[i] != '' && macid.length == 12) {
				var temp = parseInt(reply[i])/100;			
				var sql = "";
				if(add) sql += "INSERT INTO data (macid,deviceid,temp,stamp) VALUES ('"+ macid +"',"+ id +","+ temp + ","+ tstamp +"); ";
				sql += "UPDATE sensors SET temp = '"+ temp +"' WHERE macid = '"+ macid +"' AND id = "+ id +"; ";
				sql += "INSERT OR IGNORE into sensors (macid,id,temp) values('"+ macid +"',"+ id +","+ temp +"); ";
				cl('UPDATE: '+macid+":"+id+':'+temp); if(add) cl('INSERT: '+macid+":"+id+':'+temp);
				//cl(sql); 
				dbExec(sql,function(err){})
			}
			id++;
		}
		//console.log(reply[i]+':'+g_sched[s]+':'+add);	
	}
}


//## Port Events
function setupHandlers(port) {

   	port.on("error", function() { 
    	console.log("error:", arguments);
    	port.alive = false;
    });
    
    port.on("xclose", function (path) { 
    	cl("Disconnect:" + port.path); 
    	port.alive = false;
    });
    
    port.on("xdata", function (data) {
        portReply(port,data);
    });
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
			    port.alReg = 0;
			    g_ports.push(port);
			    //setupHandlers(port);
				cl('adding:' + port.path);
				//cl(port);
		    }
		    i++;		
		});
	});	
}
/*
var g_alreg = {};
function getSensors(){
	g_alreg = {};
	var sql = "SELECT * FROM sensors ORDER BY macid ASC, id ASC";	
	dbRows(sql,function(data) { 
        var mido = ''; var alReg = 0;
        for(var key in data) {
   			var item = data[key];
   			var bit = parseInt(item.id)-1+4;	//Bits 4567
   			if (mido != item.macid) {var alReg = 0;}
   			mido = item.macid;
       		if(item.altemp && parseInt(item.temp) > parseInt(item.altemp)) alReg = bit_set(alReg,bit);
        	else alReg = bit_clear(alReg,bit);
        	//cl('bit:'+bit);	
		}
		g_alreg[item.macid] = alReg;
	});	
}
*/


var g_altemp = {};
function getSensors(){
	g_altemp = [];
	var sql = "SELECT * FROM sensors where active = 'true' ORDER BY macid ASC, id ASC";	
	dbRows(sql,function(data) { 
		for(var key in data) {g_altemp[data[key].macid] = [99,99,99,99];}        
        for(var key in data) {
   			var item = data[key];
   			if(item.altemp) g_altemp[item.macid][parseInt(item.id)-1] = item.altemp;
		}
cl(g_altemp);
	});	
}


// Get Schedules as Mins & add 1440 mins after midnight.
var g_sched = []; var g_next4 = []; 
function getSched(){	
	g_sched = []; g_next4=[];
	var sql = "select ((hr * 60) + min) as 'min' from schedule ORDER BY hr ASC, min ASC";
	var now = dayMin(); var x = 0;
	dbRows(sql,function(data){ 
		for(var key in data) {
   			var item = data[key];
			g_sched.push(item.min); 
			if(item.min > now && x < 4) { 
				g_next4.push(item.min); 
				x++;
			}
		}
		for (var i = 0; i < 4-x; i++) { g_next4.push(g_sched[i]+1440);}
		//cl(g_sched);
	});
	
}

// Get All Data
function getAll(){
	getPorts();
	getSched();
	getSensors();
		
}

//## Every Minute
setInterval(function() {
    var date = new Date();
    if ( date.getSeconds() === 55) { getAll(); }
    if ( date.getSeconds() === 0) {
        for (var i = 0; i < g_ports.length; i++) {
            portWrite(g_ports[i]);
        }   
    }
},1010);

getAll();

/*
function ts2str(ts,hd){
	var ts = ts.split(/[- :]/);
	var tso = new Date(ts[0],ts[1]-1,ts[2],ts[3],ts[4],ts[5]);
	if(hd=='hm') return pad(tso.getHours(),2) + ':' + pad(tso.getMinutes(),2);
	if(hd=='h') return tso.getHours() + (tso.getMinutes()/60);
	if(hd=='t') return tso.getTime();
}


dbRows("select rowid,tstamp from data where rowid >= 600 and rowid < 700",function(data){
	for(var key in data) {
   		var item = data[key]; 
		var stamp = ts2str(item.tstamp.toString(),'t');
		var sql = "UPDATE data SET stamp = "+stamp+" WHERE rowid = " + item.rowid;
		console.log(sql);
		dbExec(sql,function(){});
	}
	
	
});
*/


