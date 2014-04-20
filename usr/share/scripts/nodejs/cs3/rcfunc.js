#!/usr/bin/env node

module.exports = {	
	load:load,
	dump:dump,
	hget:hget,
	hput:hput
}

rc = require("redis").createClient();
var fs = require('fs');	

// Redis hgetall
function hget(hash,cb){
	if(!hash) return cb({}); 
	rc.hgetall(hash, function(err, obj){
		return cb(obj);  
	});
}

// redis hput
function hput(qry,cb){
	var func=qry.func, form=qry.form; delete(qry.func); delete(qry.form);
	hsets = [form]; for(var key in qry) { hsets.push(key,qry[key])};
	qry.form=form; qry.func=func; //re-set them
	rc.hmset(hsets,function(err,isok){
		if(isok=="OK") {
			hget(form,function(obj){
				return cb(obj);  				
			})
		} else return cb({});
	});
}

// parse .json file
function jget(cb,file){
	if(file.indexOf('.json') !== -1) file = file.split('.json')[0];
	fs.readFile(__dirname + '/'+file+'.json', 'utf8', function (err, data) {if(!err) return cb(JSON.parse(data));});     
	cb({});
}

// load keys if they dont exist
function load(file){
	function kload(hash,key,val){
		//console.log(hash+':'+key+'='+val);
		rc.hexists(hash,key,function(err,ex){
			if(!ex) rc.hset(hash,key,val);
		})
	}

	jget(function(json){
		for(var index in json) { 
			var hash = json[index];
			for(var key in hash) { 
				kload(index,key,hash[key]);
			}
		}
		
	},file);
}

// Only dumps hash keys
function dump(cb,file){
	rc.keys('*',function(err,items){		
		var dump = {};
		function async(key, cb) {
			rc.hgetall(key,function(err,rkey){cb(rkey);}
		)}
	
		function series(item) {if(item) {
		    rc.type(item,function(err,type){
			    if(type=='hash') async( item, function(result) {
			      dump[item] = result;
			      return series(items.shift());
			    }); 
			    else return series(items.shift());
		    });
		  } else {
		    if(file !==undefined) fs.writeFile(file,JSON.stringify(dump, null, 4), function() {
				//process.exit(code=0);
		    });
		    cb(dump);
		  }
		}
		series(items.shift());
	})
}

//dump(function(keys){console.log(keys)},'cs3.json');
//load('cs3.json');
