g = {
	fpl: [11,9,10,22,17],
	al: [],
	leds: {},
	comd: null,
};

var fn = require('./func');
var sys = require('sys');
var async = require('async');
var gpio = require("gpio");

function arr2obj(arr,key){
	var grp = {};
	for (i=0; i < arr.length; i++) {
	   dkey = [arr[i][key]];
	   if (!(dkey in grp)) grp[dkey] = [];
	   grp[dkey].push(arr[i]);
	}
	return grp;	
}

// Initialize GPIO LEDS
function init(cb){
	var i = 1; 
	async.forEach(g.fpl, function(item, next) {
		gpio.export(item,{direction:"out",interval:10000,ready:function(){
			g.leds[i] = this;
			i++;
			return next();
		}})
		
	}, function(err) {
			setTimeout(function() { return cb(g.leds,g.comd); },100);
  });
}

var slto;
function statled(mode){
	var on=0,off=0;
	switch (mode){
		case 0: g.leds[5].reset();clearInterval(slto);return;
		case 1: g.leds[5].set(); clearInterval(slto); return;
		case 2: on=500; off=500;
	}
	on=on+off; slto=setInterval(function() {g.leds[5].set(); setTimeout(function() { g.leds[5].reset()},off);},on);	
}

function isnow(cb){
	var dates = {}; dates.now = new Date();
	dates.hr = fn.pad(dates.now.getHours(),2); dates.min = fn.pad(dates.now.getMinutes(),2);
	dates.stamp = new Date(); dates.stamp.setHours(dates.hr); dates.stamp.setMinutes(dates.min); dates.stamp.setSeconds(0,0,0); dates.stamp = dates.stamp.getTime(); 
	var sql = "SELECT * from schedule WHERE hr = "+dates.hr+" AND min = "+dates.min;
	fn.dbRows(sql,function(rows){ 
		dates.do = rows.length;
		cb(dates); dates=null; sql=null;rows=null;
	});	
}

// Do Everything
var al=[],zones=[];
function getstat() {	
	isnow(function(dates){	
		var hrmin = dates.hr+':'+dates.min, day = dates.now.getDate();	
		fn.sensors(function(devs){
			var ins=''; for (i=0; i < devs.length; i++){if(devs[i].up) ins += "'"+devs[i].sid+"',";} ins = ins.slice(0,-1);	
			var sql = "SELECT rowid as 'zid',* from zones where led > 0 AND sid IN ("+ins+")";			
			fn.dbRows(sql,function(rows){ // create LED Reference array
				
				// Status LED
				if(!rows.error) { 
					zones = arr2obj(rows,'led'); 
					al = []; 
					statled(1);
				} 
				else statled(2);
				
				// Sensor Led Array
				var sz={}; for (var i=1; i<5;i++) {
					if(zones[i]) {
						sz[zones[i][0].sid] = zones[i][0].zid; 
						g.leds[i].set(); 
						if(zones[i][0].temp > zones[i][0].altemp) al.push(i);
					} 
					else g.leds[i].reset();
						
				}	
				
				
				
				async.eachSeries(devs,function(dev,next) {
					if(!dev.up) return;
					var sql = '';
					if(fn.freq && dates.now.getMinutes() % fn.freq == 0 && dates.now.getSeconds() < 15) dates.do = 1;
					if(dates.do !==0 && sz[dev.sid]) sql += "INSERT INTO data ('temp','stamp','zid','hrmin','deviceid','day') VALUES('"+dev.temp+"','"+dates.stamp+"','"+sz[dev.sid]+"','"+hrmin+"','0',"+day+");"
					sql += "INSERT OR IGNORE INTO sensor ('sid','stamp','temp') VALUES('" + dev.sid + "','"+dev.stamp+"','"+dev.temp+"');";
					sql += "UPDATE sensor SET stamp ='"+dev.stamp+"', temp='"+dev.temp+"' WHERE sid = '"+dev.sid+"';";							
					//fn.cl(sql);					
					fn.dbExec(sql,function(err){fn.cl('err:'+err+' sid:'+dev.sid+' temp:'+dev.temp+' dadd:'+dates.do); next(); });
				}, function(err){ 
					sql = null; dates = null; devs = null; zones = null; ins = null;
					return alarms(rows); 
				});	
			});			

		});
	});
}

function double(val,x){for(i=1;i<x;i++){val=val*2}return val}

// Do alarms
function alarms(sids){
	var ems = [];
	sids.forEach(function(item) { 
		var now = new Date(); now = now.getTime(); var sql = false;
		if(item.temp > item.altemp) {
			if(item.alarmts == 0) var sql = "UPDATE zones SET alarmts = "+now+" WHERE sid = '"+ item.sid +"';";		
			else if(now - item.alarmts > double(item.algrace,item.sends) * 60 * 1000 && now - item.emailts > (double(item.algrace,item.sends) * 60 - 10) * 1000) {
				ems.push(item);
				var sql = "UPDATE zones SET sends="+(item.sends+1)+", emailts = "+now+" WHERE sid = '"+item.sid+"';";
			}   					
		} else if(item.alarmts > 0) var sql = "UPDATE zones SET sends=1, alarmts=0 WHERE sid = '"+item.sid+"';";	
		if(sql) {
			fn.dbExec(sql,function(err){
				sql = null; sids = null; item = null;
				if(err) fn.cl(err);
			});
			fn.cl(sql);
		}
	});
	if(ems.length > 0) sendMail(ems);
}

function sendMail(ems){
	//mailOptions.subject = 'Sensor S.'+item.id+'-'+item.info+' is OVER '+item.altemp+' max temperature ' + item.temp;
	//var url = 'http://192.168.1.83:3000/sensor?did='+item.macid+'_'+item.id;
	//mailOptions.html = "Click <a href='"+'url'+"'>Here</a> to view the sensor";
	fn.cl(ems);
	
	data = {
	    from: "PacMac <C00Lsense@peter-c.net>",
	    to: "pac@dis.com.sg",
	    subject: 'Alert - '+ems.length+' sensor(s) are over temperature',
	    text: 'The following require attention:\n',
	    html: 'The following require attention:<br>'
	};
	
	ems.forEach(function(item) { 
		data.text += 'Sensor #'+item.led+' - '+item.info+' is OVER '+item.altemp+' max temperature ' + item.temp+'\n';
		data.html += 'Sensor #'+item.led+' - '+item.info+' is OVER '+item.altemp+' max temperature ' + item.temp+'<br>';
	});
	
	fn.email(data);ems = null; data = null;
}

fn.cl('##### STATUS RESTART #####');

// Main Function
var itv;
init(function(){	
	statled(1);
	getstat();

	itv = setInterval(function() {
		var date = new Date();	
		if (date.getSeconds() % 15 === 0) getstat();
		for(var i in al) g.leds[al[i]].set(); 
		setTimeout(function() { 
			for(var i in al) g.leds[al[i]].reset(); 
		},500);
	}, 1000);
});






