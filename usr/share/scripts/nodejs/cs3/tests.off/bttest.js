function BTscan(){
	var child = require('child_process');
	var ps = child.spawn('/usr/bin/bluetoothctl', []);
	//ps.stdin.write('devices\r\n');
	ps.stdin.write('scan on\r\n');
	ps.stdout.pipe(process.stdout);
	ps.stdin.end();
}

//BTscan();


var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
//exec("modprobe wire;modprobe w1-gpio;modprobe w1-therm", puts);

var exec = require('child_process').exec;
function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

//execute("modprobe wire;modprobe w1-gpio;modprobe w1-therm;cat /sys/bus/w1/devices/w1_bus_master1/w1_master_slave_count;cat /sys/bus/w1/devices/w1_bus_master1/w1_master_slaves", function(stdout){ console.log(stdout);});

execute("cat /sys/bus/w1/devices/10-000801b58739/w1_slave", function(stdout){ console.log(stdout);});