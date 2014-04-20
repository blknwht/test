var express = require('express')
  http = require('http')
  , path = require('path')
  , fs = require('fs')
  , sqlite3 = require('sqlite3').verbose();

var app = express();

//var logfile = fs.createWriteStream('./logfile.log', {flags: 'a'});



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function cl(dat){return console.log(dat);}

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var port = new SerialPort('/dev/tty.OmniTek_Bluetooth-DevB',{ baudrate:9600, parser: serialport.parsers.readline("\r") },false)


	var g_cbstack = [];
	port.on('data', function (data) {
	  if (g_cbstack.length > 0) {
	    var callback = g_cbstack.pop();
	    callback(null, data);
	  };
	});
	
	function sendToPort (data, callback) {
	  port.write(data, function (err, res) {
	    if (err) {
	      g_cbstack.splice(g_cbstack.indexOf(callback), 1);
	      callback(err);
	    };
	
	  });
	  g_cbstack.unshift(callback);
	};

var async  = require("async");
function bl(g_hexfile,cb){
	fs.readFile(g_hexFile, function(ferr, f){
		var hex = f.toString().split('\r\n');	
		
		//pop&push the array with the headers
		hex.pop();
		hex.push('@');
		hex.unshift("?");			
		
		port.open(function(perr){ 
			port.on("error", function() { console.log("error:", arguments);});
			var i = 0;
			async.eachSeries(hex, function(item,move){ 
				var addr = 'B';
				if(item.length > 7) addr = item.substr(3,4);
				outStr = String.fromCharCode(1) + item + String.fromCharCode(13);
				sendToPort (outStr, function(serr,data){
					if(serr) cl(serr);
					cl('TX>'+addr + ' RX>'+data);
					if(data == addr) move();
					else if(data == '@') return cb(true);
					else return cb(false);
				});
			i++			    
			},function(ferr){if(ferr) cl(ferr);});
		});
	});
}

var g_hexFile = '/Users/pac/MACSERV/Proton/2013/07/CS-BT_J.hex';
bl(g_hexFile,function(){
	cl('Done');
	process.exit(code=0);	
	
});

/*
var SerialDevice = require('devicestack').SerialDevice,util = require('util');
function MyDevice(port) {SerialDevice.call(this,port, {baudrate: 9600,databits: 8,stopbits: 1,parity: 'none'});}
util.inherits(MyDevice, SerialDevice);
module.exports = MyDevice;

var MyDevice = require('/dev/tty.OmniTek_Bluetooth-DevB');
var myDevice = new MyDevice({locationId: 0x1234,serialNumber: 's2345'});

myDevice.open(function(err) {
  myDevice.on('receive', function(data) {
    console.log(data);
  });

  outStr = String.fromCharCode(1) + '0:255:0:0:0:0:0:0:0:0' + String.fromCharCode(10);	//LF
  myDevice.send(outStr);

});
*/



