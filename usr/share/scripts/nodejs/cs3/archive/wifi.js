#!/usr/bin/env node
var dbug = true;
function cl(str){if(dbug) return console.log(str)}
var fn = require('./func');

var cmds = {
    getips: "ifconfig :interface | grep inet | xargs | tr -d '\n' | awk '{printf $2\" \"$4\" \"$6\" \"}' && ip route | grep default | grep :interface | awk '{printf $3}'",
    isup: "ip link show wlan0 | tr -d '\n' | awk '{print $9}'",
    ips: "dhcpcd -U :interface",
    ssids: "iwlist wlan0 scan | grep ESSID | tr -d 'ESSID:' | xargs | tr -d '\n'",
    scan: 'iwlist :interface scan',
    stat: 'iwconfig :interface',
    disable: 'ip link set :interface down',
    enable: 'ip link set :interface up',
    interfaces: 'iwconfig',
    dhcp: 'dhcpcd :interface',
    dhcp_ip: 'dhcpcd :interface -r :ip_address',
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
	dis		:dis,
	con		:con,
	iscon	:iscon,
	ssids	:ssids,
	ips		:ips,
	dhcp	:dhcp
}

var childProcess = require('child_process');
function exec(cmd,cb){
	cl(cmd);
	childProcess.exec(cmd, function (error, stdout, stderr) {
		if(error || stderr) var res = stderr.toString().replace('\n','');
		else if(stdout) var res = stdout.toString().replace('\n','');
		else var res = '';
		return cb(res);
	});
}

// Translate :tokens
function translate(cmd, data) {
    var str = cmds[cmd];
    for (index in data) {
        if (!data.hasOwnProperty(index)) break;
        str = str.replace(new RegExp(':'+index,'g'),data[index]);
    }
    return str;
};

// Execute Commands
function docmd(data,cmd,cb){
	exec(translate(cmd,data),function(res){
		if(res !== true && erok[cmd] !== undefined && res.indexOf(erok[cmd]) !==-1 ) cb(true);
		else cb(res);
	})
}

function parse(str,start,end){
	var ls = str.indexOf(start);
	if(str && ls !== -1) return str.substring(ls+start.length,str.indexOf(end,ls));
	return '';
}

function dhcp(data,cb){
	exec(translate('dhcp',data),function(res){
		cl(res);
		//var routers = parse(res,"route via ","\n");
		var ip = parse(res,"leased "," for ");
		if(ip){
			fn.dbExec("UPDATE wifi set enabled = 1, ip_address = '"+ip+"' WHERE interface = '"+data.interface+"'",function(row){});
			return cb({ip:ip,up:true});			
		}
		return cb({up:false});
	});	
}


// connect
function con(data,cb){
	dis(function(res){
		if(!res) return cb(false);
		docmd(data,'enable',function(res){
			exec(translate('connect_'+data.encryption.toLowerCase(),data),function(res){	
				// WEP=No Reply, WPA = errors - Ignore reply
				dhcp(data,function(res){
					cl(res);
					return cb(res.up);
				})
			});
		});
	});
}

// disconnect
// waiting for pid 1641 to exit
// dhcpcd not running
function dis(cb){
	exec(translate('dhcp_disable',defaults),function(res){
		exec(translate('disconnect',defaults),function(res){
			cb(true);
		});
	});		
}

// get IP Addresses from DHCPCD
function dhdump(data,cb){
	docmd(data,'ips',function(res){
		var ipa = {}, ips = res.replace("'","").split('\n');
		ips.forEach(function(item) { 
			var bits = item.split('=');
			if(bits.length==2) ipa[bits[0]] = bits[1].split(' ')[0]; 
		})
		cb(ipa);
	});		
}

// Get IP Addresses
function ips(data,cb){
	exec(translate('getips',defaults),function(res){
		res.split(' ');
		if(ips.length != 4) return cb({});
		else cb({'ip_address':ips[0],'subnet_mask':ips[1],'broadcast_address':ips[2],'routers':ips[3]});
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


return;
// Command Line Connect
//if(process.argv[2] == "connect"){
	fn.dbRows("SELECT * from wifi WHERE interface = 'wlan0'",function(row){
		if(row.enabled===0) return;
		con(row,function(status){
			cl(status);
			//ips(defaults,function(res){cl(res);})
		});
	});	
//} 

