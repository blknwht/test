var fn = require('./func');
var sqlite3 = require('sqlite3');
var async = require('async');

function pad(number, length) {var str = '' + number; while (str.length < length) { str = '0' + str;} return str;}

// Add HR:MIN from Timestamp
function addhrmin(cb){
	function loop(){
		var sql = "SELECT rowid,stamp FROM data WHERE hrmin IS NULL LIMIT 4000";
		fn.dbRows(sql,function(rows){
			async.eachSeries(rows, function (item,next){ 
				var ts = new Date(item.stamp);
				var hrmin = pad(ts.getHours(),2)+':'+pad(ts.getMinutes(),2);
				var day = ts.getDate();
				var sql="UPDATE data SET hrmin='"+hrmin+"',day="+day+" WHERE rowid="+item.rowid;
				fn.dbExec(sql,function(reply){
					fn.cl(reply);
					next();
				});
	
			}, function(err) {
			    if(rows.length==0) return cb();
			    loop();
			    fn.cl('iterating done');
			});
		});
	}
	loop();
}

addhrmin(function(){fn.cl('all done');});


function cs3ug(){	
	//SELECT name FROM sqlite_master WHERE type='table' AND name='table_name';
	var sql = "ALTER TABLE 'sensors' RENAME TO 'zones';";
	sql += "ALTER TABLE zones ADD COLUMN 'sid' VARCHAR DEFAULT '-None-';";
	sql += "ALTER TABLE zones ADD COLUMN 'led' INTEGER DEFAULT 0;";
	sql += "ALTER TABLE zones ADD COLUMN 'sends' INTEGER DEFAULT 0;";
	sql += "CREATE TABLE sensor (sid VARCHAR PRIMARY KEY NOT NULL UNIQUE, stamp INTEGER, temp DOUBLE,zid INTEGER DEFAULT 0);";
	sql += "ALTER TABLE data ADD COLUMN zid VARCHAR;";
	sql += "ALTER TABLE data ADD COLUMN hrmin VARCHAR;";
	sql += "ALTER TABLE data ADD COLUMN day INTEGER;";
	sql += "ALTER TABLE data ADD COLUMN mystamp INTEGER;";
	sql += "DROP trigger 'tstamp';"
	sql += "CREATE TRIGGER sensor_ud AFTER UPDATE ON 'sensor' BEGIN UPDATE zones SET tstamp = new.stamp, temp = new.temp WHERE sid = new.sid; END;";
	sql += "CREATE TRIGGER zones_ud AFTER UPDATE ON 'zones' BEGIN UPDATE sensor SET zid = new.rowid WHERE sid = new.sid; END;";
	sql += "CREATE VIEW v_data as SELECT * FROM data where stamp > 1357001128000;";
	
	fn.cl(sql);
	fn.dbExec(sql,function(err){
		fn.cl(err);

		fn.dbRows("SELECT rowid, * from zones",function(rows){ 
			//console.dir(rows);
			var sql = '';
			for(var item in rows) {
				sql += "UPDATE data SET zid = '"+rows[item].rowid+"' WHERE macid='"+rows[item].macid+"' AND deviceid='"+rows[item].id+"'; ";
			}
			fn.cl(sql);
			fn.dbExec(sql,function(err){
				if(err) fn.cl(err);
				else fn.cl('Done');
			});
		});
	});
}

//cs3ug();



