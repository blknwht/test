var express = require('express');
var app = express();
var socket = require('socket.io');
//var server = app.listen(4000);
//var io = socket.listen(server);

var io = require('socket.io').listen(app.listen(4000));

app.get('/', function(request, response){
  response.sendfile(__dirname + "/index.htm");
});
 
var activeClients = 0;
 
io.sockets.on('connection', function(socket){clientConnect(socket)});
 
function clientConnect(socket){
  activeClients +=1;
  io.sockets.emit('message', {clients:activeClients});
  socket.on('disconnect', function(){clientDisconnect()});
}
 
function clientDisconnect(){
  activeClients -=1;
  io.sockets.emit('message', {clients:activeClients});
}