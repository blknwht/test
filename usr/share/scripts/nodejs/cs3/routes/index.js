var fn = require('.././func');
var rc = require('.././rcfunc');

// Redis Load
rc.load('cs3.json');

// WIFI Enable on Boot
/*
fn.dbRows("SELECT * from wifi WHERE interface = 'wlan0'",function(row){
	if(row.enabled===0) return;
	fn.exec("/usr/share/scripts/wifi/iscon.sh",function(con){if(con != "UP") {
		fn.exec("/usr/share/scripts/wifi/connect.sh "+row.encryption+" "+row.essid+" "+row.passkey,function(status){console.log(status);});
	}});
});	
*/

exports.index = function(req, res){
	var qry = req.query;

	function reply(data){
		var deferr = ['Success.','Error.'];
		///ops.good_qty = ops.good_qty || 0;
		if(data.txstat && data.txstat.code !== undefined) data.txstat = {error:data.txstat.code,msg:deferr[data.txstat.code]};
		else if(!data.txstat) data.txstat = {error:0,msg:""}; 
		res.send(data);
		data=null; req=null;
	}

	function fget(cb){
		var sels="",form=qry.form,keys=qry._keys_.split(':'); delete(qry.func); delete(qry.form); delete(qry._keys_);
		for(var key in qry) {sels += key +",";}
		var sql = "SELECT "+sels.slice(0,-1)+" FROM "+form+" WHERE "+keys[0]+"='"+qry[keys[0]]+"'";
		fn.dbRows(sql,function(rows){ cb(form,rows); rows=null;});
	}

	function fput(){
		var sets="",sels="",form=qry.form,keys=qry._keys_.split(':'); delete(qry.func); delete(qry.form); delete(qry._keys_);
		for(var key in qry) {sets += key+"='"+qry[key]+"',"; sels += key +",";}
		var sql = "UPDATE "+form+" SET "+sets.slice(0,-1)+" WHERE "+keys[0]+"='"+qry[keys[0]]+"'";
	    fn.dbExec(sql,function(rows){ 
			var sql = "SELECT "+sels.slice(0,-1)+" FROM "+form+" WHERE "+keys[0]+"='"+qry[keys[0]]+"'";
			fn.dbRows(sql,function(rows){ reply(rows); rows=null;}); 
	    });	
	}

	if(qry.func) {
		switch(qry.func){			
			case "sigpct":
				fn.exec("/usr/share/scripts/wifi/sigpct.sh",function(sigs){
					reply(sigs);					
				});			
				break;				
				
			case "getlog":
				qry.lines || 25;
				fn.exec("tail -n "+qry.lines+" /var/log/cs_status.log | tac",function(log){
					reply(log);					
				});			
			
				break;
				
			case "update":
				fn.exec("/usr/share/scripts/gitup.sh",function(status){
					reply(status);
					if(JSON.parse(status).files > 0) fn.exec("/usr/share/scripts/restart.sh &",function(status){});					
				});
				break;				
			
			case "wifioff": 
				fn.exec("/usr/share/scripts/wifi/disconnect.sh",function(status){
					var txstat = {code:0};
					reply({txstat:txstat});					
				});
				break;
			
			case "wifion": 
				fn.dbRows("SELECT * from wifi WHERE interface = 'wlan0'",function(row){
					fn.exec("/usr/share/scripts/wifi/connect.sh "+row.encryption+" "+row.essid+" "+row.passkey,function(status){
						var err = 1; if(JSON.parse(status).up===1) err = 0;
						reply({txstat:{code: err}});					
					});
				});	
				break;
			
			case "fget": 		
				/*
				rc.hget(qry.form,function(rows){
					console.log(rows);
					switch(qry.form){
						case "wifi":
							fn.exec("/usr/share/scripts/wifi/getips.sh",function(wifis){
								wi = JSON.parse(wifis);
								rows.ip_address = wi.ip_address;
								rows.subnet_mask = wi.subnet_mask;
								rows.routers = wi.routers;
								fn.exec("/usr/share/scripts/wifi/iscon.sh",function(con){
									if(con =="UP") rows.enabled = 1; else rows.enabled = 0;
									reply(rows);
								});
							}); break;
						
						default: reply(rows);
					}
				});	
				break;
				*/
				
				fget(function(form,rows){
					switch(form){
						case "wifi":
							fn.exec("/usr/share/scripts/wifi/getips.sh",function(wifis){
								wi = JSON.parse(wifis);
								rows.ip_address = wi.ip_address;
								rows.subnet_mask = wi.subnet_mask;
								rows.routers = wi.routers;
								fn.exec("/usr/share/scripts/wifi/iscon.sh",function(con){
									if(con =="UP") rows.enabled = 1; else rows.enabled = 0;
									reply(rows);
								});
							}); break;
						
						default: reply(rows);
					}

				}); break;
			
			case "fput": 
				// start to write the redis hash
				rc.hput(qry,function(obj){
					fput(); 
				});
				break;
			
			case "discover": fn.sensors(function(devs){reply(devs)}); break;
			case "jsonp": return reply('jsonp({"time":'+new Date().getTime()+'});'); break;
			case "excel": excel(req,res,qry.os,qry.fq); break;		
			default: reply({});
		}
	}
	
	else if(qry.page) {
		
		switch(qry.page){

			case "get":
				fn.dbRows(qry.sql,function(rows){ reply(rows); rows=null;}); 
				break;

			case "put":
				fn.dbExec(qry.sql,function(rows){ reply(rows); rows=null;});
				break;
	
			case "zones":
				fn.dbRows("SELECT rowid, * from zones1 WHERE active = 1 ORDER BY rowid ASC",function(sensors){ 
					fn.dbRows("SELECT sid from sensor WHERE sid NOT IN (SELECT sid FROM zones1 WHERE sid NOT NULL)",function(sids){ 
						if(!qry.reload) res.render('zones.jade',{title:'Sensors', sensors:sensors, sids:sids});
						else {reply({sensors:sensors,sids:sids});}
					});
				}); break;

			case "wifi":
				fn.exec("/usr/share/scripts/wifi/ssids.sh",function(ssids){
					res.render('wifi.jade', { title:'Wireless Network',ssids:JSON.parse(ssids)}); 
				});
				break;

			case "schedule":
				fn.dbRows("SELECT * from schedule ORDER BY hr ASC, min ASC",function(schedule){ 
					var times = []; var v = {};
					schedule.forEach(function(item) { 
						v.time = parseInt(item.hr);
						if(v.time > 12) v.time = v.time % 12;
						v.time = fn.pad(v.time,2) + ':' + fn.pad(item.min,2);
						if(parseInt(item.hr) > 11) v.time += ' PM'; else v.time += ' AM';
						var rec={};
						rec.hrmin = v.time;
						rec.id = item.hr+'.'+item.min;
						times.push(rec);
					})
					res.render('schedule.jade', { title:'Manage Schedules',schedule:times});
					v = null; rec=null; times=null;
					
					//res.render('sched.jade', { title:'Schedules', sensors:sensors, schedule:times });
				});	break;
				 									
			default:
				res.render(qry.page+'.jade', { title:qry.page}); break;	
		}
	  
	}
		
	else {	
		fn.dbRows("SELECT * from global",function(glob){ 
			res.render('index', { 
				glob:glob,
				title:'Home',
				stamp:new Date().getTime()
			});
		});			
	}
};

/*
function jsonwr(data,file){ var fs = require('fs'); fs.writeFile(file, JSON.stringify(data,null,4), function(err) {if(err) return false; return true;})}
function excel(req,res,os,fq){
	var nodeExcel = require('excel-export');
	var ft = fn.fromto(parseInt(os),fq);
	var sql = "SELECT stamp,day,hrmin,temp FROM v_data WHERE hrmin IN(select substr('00' || hr, -2, 2) || ':'||substr('00' || min, -2, 2) from schedule) AND zid = '"+req.query.zid+"' AND stamp > "+ft.from+" AND stamp < "+ft.to+" ORDER BY hrmin ASC";
	fn.dbRows(sql,function(rows){ 
		var piv = fn.pivot(rows,'hrmin','day','temp',{nc:"-"}), conf= {};
		jsonwr(piv,'/usr/share/node/cs3/excel.json');
		conf.cols=[{caption:'Time/Date',type:'string'}]; for(var i in piv.colhead) { conf.cols.push({caption:piv.colhead[i],type:'string'});}; conf.rows=piv.rows;
		console.dir(conf);
		var result = nodeExcel.execute(conf);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats');
		res.setHeader("Content-Disposition", "attachment; filename=" + "diary_"+req.query.zid+".xlsx");
		res.end(result, 'binary');
	})	
}	
*/

function excel(req,res,os,fq){
	var exc = {}; exc.ft = fn.fromto(parseInt(os),fq); exc.dates = exc.ft.fromS+' to '+exc.ft.toS;
	var sql = "SELECT stamp,day,hrmin,temp FROM v_data WHERE hrmin IN(select substr('00' || hr, -2, 2) || ':'||substr('00' || min, -2, 2) from schedule) AND zid = '"+req.query.zid+"' AND stamp > "+exc.ft.from+" AND stamp < "+exc.ft.to+" ORDER BY hrmin ASC";
	fn.dbRows(sql,function(rows){ 
		exc.fname = 'report'; 
		exc.piv = fn.pivot(rows,'hrmin','day','temp',{nc:"-"});
		var wbk = require('msexcel-builder').createWorkbook('./', exc.fname+'.xlsx');
		var sht = wbk.createSheet('Sensor',exc.piv.colhead.length +5,exc.piv.rowhead.length +10);
	
		// Titles
		sht.set(1,1,"Fridge / Freezer Diary Report"); sht.font(1,1,{sz:18});
		sht.set(1,2,"Downende House"); sht.font(1,2,{sz:16});
		sht.set(1,3, exc.dates); sht.font(1,3,{sz:14});
	
		// Header Row
		var row = 6; var col = 1; sht.set(col,row,"Time/Date"); sht.font(col,row,{bold:true});
		for(var c in exc.piv.colhead) {
			var sc = parseInt(c)+1+col
			sht.set(sc,row,exc.piv.colhead[c]);
			//sht.fill(sc,row,{type:'solid',bgColor:'64',fgColor:'8'});
			//sht.fill(sc,row,{type:'solid',fgColor:'8',bgColor:'64'});
		}
		
		for(var r in exc.piv.rows) {for(var c in exc.piv.rows[r]) {var cell = exc.piv.rows[r][c];sht.set(parseInt(c)+1,parseInt(r)+1+row,cell);}}		
		wbk.save(function(ok){
			var file = wbk.fpath + wbk.fname;
			console.log(file);
			res.download(file);	
			exb=null;wbk=null;sht=null;sql=null;rows=null;piv=null;
		});

	})	
}
