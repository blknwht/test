#!/usr/bin/env Node

function dolftp(comd,cb){
	var dbug = true;
	var async = require('async');
	var childProcess = require('child_process');
	function exec(cmd,cb){var cp = childProcess.exec(cmd,{timeout:300000},function (error, stdout, stderr) {cb(stdout, stderr, error);});}
	function pad(number, length) {var str = '' + number; while (str.length < length) { str = '0' + str;} return str;}
	
	var d = new Date();
	var ts = d.getFullYear()+'/'+pad(d.getMonth()+1,2)+'/'+pad(d.getDate(),2)+'/'+pad(d.getHours(),2)+pad(d.getMinutes(),2);
	
	if(comd=="fullbackup"){
		var br = " -R ";
		var fpath = lftp.RPATH+ts;		
		files = fullbackup

	} else if(comd=="update") {
		var br = "";
		var fpath = lftp.RPATH+'current/';
		files = update;
	} 

	var lerr = [];	
	var lftmcmd = 'lftp '+lftp.METHOD+'://'+lftp.USER+':'+lftp.PASS+'@'+lftp.HOST+':'+lftp.PORT+' -e "set net:max-retries '+lftp.RETRY+';';
	async.forEachSeries(files, function(file,next) {
		if(comd=="update") file.src = fpath+file.src;
		else if(comd=="fullbackup") file.tgt = fpath+file.tgt;
		var exc = ''; if(file.exc) {excs = file.exc.split(' '); for(var i in excs) {exc += ' -x '+excs[i];}}
		var cmd = lftmcmd+' mirror'+br+exc+' --delete --parallel='+lftp.PLEL+' '+file.src+' '+file.tgt+';bye"';
		if(dbug) console.log("Processing >"+cmd);
		exec(cmd,function(sout,serr,err){
			if(err) return cb(cmd);
			next();
		});
	}, function(err) {
		if(! err) {
			if(dbug) console.log('All Done, No Errors');
			
			if(comd=="fullbackup"){
				cmd = lftmcmd+'cd '+lftp.RPATH+'; rm current; ln -s '+ts+' current;bye"'
				if(dbug) console.log(cmd);
				exec(cmd,function(sout,serr,err){
					if(err) return cb(cmd);
					else return cb(true);
				});
			}
			
			if(comd=="update") {
				cmd = "/usr/share/scripts/restart.sh &"
				exec(cmd,function(sout,serr,err){});
				return cb(true);
			}			
		}
		else console.log('Failed');		
	});
}

	//######## DATA ##########
	var lftp = {
		HOST:'192.168.0.5',
		PORT:22,
		USER:'sysadm',
		PASS:'spyder',
		PLEL:10,
		RPATH:"/volumes/drobo/install/coolsense/source/",
		RETRY:1,
		METHOD:"sftp"
	};

	// src=local, tgt=remote - remember the trailing slashes
	var fullbackup = [
		{src:'/root/',tgt:'/',exc:'tmp .npm .forever .bash_history .ssh .config .local .node-gyp'},
		{src:'/usr/share/scripts/',tgt:'/usr/share/',exc:'dhcp.ip'},
		{src:'/usr/share/nodejs/',tgt:'/usr/share/',exc:'archive'},
		{src:'/etc/modules-load.d/',tgt:'/etc/'},
		{src:'/etc/modprobe.d/',tgt:'/etc/'},
		{src:'/var/spool/cron/',tgt:'/var/spool/'},
		{src:'/etc/systemd/system/',tgt:'/etc/systemd/'},
		{src:'/usr/lib/systemd/scripts/',tgt:'/usr/lib/systemd/'},
		{src:'/usr/lib/python2.7/site-packages/',tgt:'/usr/lib/python2.7/'}
		
	];

	// src=remote, tgt=local
	var update = [
		{src:'/usr/share/scripts/',tgt:'/usr/share/'},
		{src:'/usr/share/nodejs/node_modules/',tgt:'/usr/share/nodejs/'},
		{src:'/usr/share/nodejs/cs3/',tgt:'/usr/share/nodejs/',exc:"bak node_modules archive tests cs3.db"},
		{src:'/var/spool/cron/',tgt:'/var/spool/'},
		{src:'/usr/lib/python2.7/site-packages/',tgt:'/usr/lib/python2.7/'}
	];

	var comd = process.argv[2];
	// returns true if no errors
	dolftp(comd,function(ok){
		console.log(ok);
		process.exit(code=0);	
	});
