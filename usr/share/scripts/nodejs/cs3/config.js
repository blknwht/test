var wdat = {
	ssid:"wifi@symphony",
	pwd:"A02011962A"		
}

var wdat = {
	ssid:"dis-wifi",
	pwd:"0015945500"		
}

var childProcess = require('child_process');
function exec(cmd,cb){
	childProcess.exec(cmd, function (error, stdout, stderr) {
		if(error){ return cb(error,stderr);}
		else return cb(stdout);
	});	
	
}

function connect(wdat){
	exec("ip link set wlan0 up",function(err,serr){
		if(err=="") {	
			exec("iwconfig wlan0 essid "+wdat.ssid+" key "+wdat.pwd,function(err,serr){
				if(err=="") {	
					setTimeout(function() {
						exec("dhcpcd wlan0",function(err,serr){
							if(err=="") {	console.log('OK');}
							else {
								if(serr.indexOf('already running') !== -1) {					
									console.log('running');
								}
							}	
						});
					}, 200);
				}	
			});		
		}
	});
}

connect(wdat);

//if(process.argv.length > 0) 
console.log(process.argv[0]);
//var comd = process.argv[2];


/*
iwlist wlan0 scan | grep wifi@symphony

[root@alarmpi ~]# ip link set wlan0 up
[root@alarmpi ~]# iwconfig wlan0 essid wifi@symphony key A02011962A
[root@alarmpi ~]# dhcpcd wlan0
dhcpcd[296]: version 6.0.5 starting
dhcpcd[296]: wlan0: rebinding lease of 192.168.0.152
dhcpcd[296]: wlan0: leased 192.168.0.152 for 86400 seconds
dhcpcd[296]: wlan0: adding host route to 192.168.0.152 via 127.0.0.1
dhcpcd[296]: wlan0: adding route to 192.168.0.0/24
dhcpcd[296]: wlan0: adding default route via 192.168.0.1
dhcpcd[296]: forked to background, child pid 394
[root@alarmpi ~]# dhcpcd wlan0
dhcpcd[402]: dhcpcd already running on pid 394 (/run/dhcpcd-wlan0.pid)
[root@alarmpi ~]# iwconfig wlan0 essid wifi@symphony key A02011962A
[root@alarmpi ~]# ip link set wlan0 up
[root@alarmpi ~]# 
*/
