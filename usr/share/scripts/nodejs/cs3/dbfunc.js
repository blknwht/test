var conf = require('./config.json');
function cl(dat){return console.log(dat);}
function cd(dat){return console.dir(dat);}

function dbConnect(){
	var sqlite3 = require('sqlite3').verbose();
	return new sqlite3.Database(conf.dbf);
}

// Centralize handling of callback errors
function cberror(error,msgno){
	var msg = {0:"Update SUCCESS",1:"Update FAILED",2:"Clock In SUCCESS",3:"Clock In FAILED",4:"Clock Out SUCCESS",5:"Clock Out FAILED"};
	return {"ERROR":{"code":error,"msg":msg[msgno]}};
}

// Export for use in other modules.
module.exports = {	

	dbRows:	function(sql,cb){
		var db = dbConnect();
		db.all(sql, function(err,rows) { 
			db.close(); 
			if(!err) return cb(rows);
			else return cb({error:1,msg:err})
		});
	},
	
	dbExec:	function(sql,cb){
		var db = dbConnect();
		db.exec(sql,function(err){ 
			db.close();
			if(!err) return cb(sql);
			else return cb({error:1, msg:err});
		});
	},
	
	fget:	function(form,cb){
		this.dbRows("SELECT name,value FROM config WHERE form='"+form+"'",function(rows){	
			var fdat = {}; for(var i in rows) {fdat[rows[i].name] = rows[i].value}
			cb(fdat);
		})
	}
		
};