const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// --- THIS FIXES THE TIMEOUT ERROR ---
// Render checks this page to see if the server is alive.
app.get('/', (req, res) => {
  res.send('Surveillance Server is Running!');
});

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
    if (cameraSocketId) {
      io.to(cameraSocketId).emit('viewer_joined');
    }
  });

  // 2. Relay WebRTC signaling messages
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

// Use the PORT Render assigns, or 3000 if running locally
const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Signaling server running on port ${port}`);
});