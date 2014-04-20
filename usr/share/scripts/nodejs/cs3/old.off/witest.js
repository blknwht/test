#!/usr/bin/env node

var fn = require('./func');

var cmds = {
    isup: "ip link show wlan0 | tr -d '\n' | awk '{print $9}'",
    ips: 'ifconfig :interface | grep inet | tr -d "\n"; ip route | grep default | grep wlan0 | awk {\'print " ","routers "$3\'}',
    ssids: "iwlist wlan0 scan | grep ESSID | tr -d 'ESSID:' | xargs | tr -d '\n'",
    scan: 'iwlist :interface scan',
    stat: 'iwconfig :interface',
    disable: 'ip link set :interface down',
    enable: 'ip link set :interface up',
    interfaces: 'iwconfig',
    dhcp: 'dhcpcd :interface',
    dhcp_disable: 'dhcpcd :interface -k',
    leave: 'iwconfig :interface essid " "',
	iscon: "iwconfig :interface | grep ESSID:",

    metric: 'ifconfig :interface metric :METRIC',
    connect_open: 'iwconfig :interface essid ":essid"',
    connect_wep: 'iwconfig :interface essid ":essid" key :passkey',
    connect_wpa: 'wpa_passphrase ":essid" :passkey > wpa-temp.conf && wpa_supplicant -B -D wext -i :interface -c wpa-temp.conf && rm wpa-temp.conf',
    
    disconnect: 'killall wpa_supplicant; ip link set :interface down'
};

var erok = {
	connect_wpa: 'ioctl[SIOCSIWAP]: Operation not permitted',
	disconnect: "wpa_supplicant: no process found",	
	dhcp: "forked to background",
	dhcp_disable:"to exit"
}

var defaults = {
	interface:'wlan0'
}

module.exports = {		
	dis: dis,
	con: con,
	iscon: iscon,
	ssids:ssids,
	ips:ips
}

var childProcess = require('child_process');
function exec(cmd,cb){
	//console.log(cmd);
	childProcess.exec(cmd, function (error, stdout, stderr) {
		if(error || stderr) var res = stderr.toString().replace('\n','');
		else if(stdout) var res = stdout.toString().replace('\n','');
		else var res = true;
		return cb(res);
	});
}

// Translate :tokens
function translate(cmd, data) {
    var string = cmds[cmd];
    for (index in data) {
        if (!data.hasOwnProperty(index)) break;
        string = string.replace(':' + index, data[index]);
    }
    return string;
};

// Execute Commands
function docmd(data,cmd,cb){
	exec(translate(cmd,data),function(res){
		if(res !== true && erok[cmd] !== undefined && res.indexOf(erok[cmd]) !==-1 ) cb(true);
		else cb(res);
	})
}

// connect
function con(data,cb){
	dis(function(res){
		if(!res) cb(false);
		docmd(data,'connect_'+data.encryption.toLowerCase(),function(res){
			if(!res) cb(false);
			docmd(defaults,'dhcp',function(res){
				if(!res) cb(false);
				setTimeout((function() {
					iscon(function(res){cb(res);});
				}), 2000);
			})
		});
	});
}

// get IP Addresses from DHCPCD
function ips(data,cb){
	var ipl = {inet:'ip_address',netmask:'subnet_mask',broadcast:'broadcast_address',routers:'routers'};
	docmd(data,'ips',function(res){
		var ipa = {}, ips = res.split('  ');
		ips.forEach(function(item) { 
			var bits = item.split(' ');
			if(bits.length==2) ipa[ipl[bits[0]]] = bits[1].split(' ')[0]; 
		})
		cb(ipa);
	});		
}

// disconnect
function dis(cb){
	docmd(defaults,'dhcp_disable',function(res){
		docmd(defaults,'disconnect',function(res){
			cb(res);
		});
	});		
}

// get SSIDs
function ssids(cb){
	docmd(defaults,'ssids',function(res){
		cb(res.split(' '));
	});		
}

// is wireless connected
function iscon(cb){
	docmd(defaults,'iscon',function(res){
		if(res.length > 5) return cb(true);
		return cb(false);
	});		
}

// Command Line Connect
if(process.argv.length > 0){
	exec("/usr/share/scripts/ips.sh",function(ips){
		console.dir(JSON.parse(ips));
	})
} 

