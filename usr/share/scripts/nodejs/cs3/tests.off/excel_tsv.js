var x = require('./excel.json');
var fs = require('fs');
var writeStream = fs.createWriteStream("file.xls");



writeStream.write(x.rowhead.toString().replace(/,/g,"\t")+"\n");

var async = require('async');
async.forEach(x.rows, function(item, next) {
	writeStream.write(item.toString().replace(/,/g,"\t")+"\n",function(){next();});	
	
	}, function(err){ 
		writeStream.close();
		console.log('done');
});		

