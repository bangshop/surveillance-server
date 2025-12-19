const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Store connected peers
let cameraSocketId = null;
let viewerSocketId = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Identify who is who
  socket.on('register_camera', () => {
    cameraSocketId = socket.id;
    console.log('Camera registered:', socket.id);
  });

  socket.on('register_viewer', () => {
    viewerSocketId = socket.id;
    console.log('Viewer registered:', socket.id);
    // Tell the camera to start the call if a viewer joins
    if (cameraSocketId) {
      io.to(cameraSocketId).emit('viewer_joined');
    }
  });

  // 2. Relay WebRTC signaling messages (Offer, Answer, ICE Candidates)
  socket.on('offer', (data) => {
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.broadcast.emit('answer', data);
  });

  socket.on('candidate', (data) => {
    socket.broadcast.emit('candidate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    if (socket.id === cameraSocketId) cameraSocketId = null;
    if (socket.id === viewerSocketId) viewerSocketId = null;
  });
});

http.listen(3000, () => {
  console.log('Signaling server running on port 3000');
});