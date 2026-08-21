const { io } = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  console.log('Waiting for vehicle-location...');
});

socket.on('vehicle-location', (data) => {
  console.log('GPS REAL-TIME RECEIVED');
  console.log(data);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});