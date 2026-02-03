const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Root route so Render knows the app is live
app.get('/', (req, res) => {
  res.send('Surveillance Server v2.0 is Online!');
});

// Store connected peers
let cameraSocketId = null;
let viewerSocketId = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Identify Camera
  socket.on('register_camera', () => {
    cameraSocketId = socket.id;
    console.log('Camera registered:', socket.id);
    
    // --- THE FIX IS HERE ---
    // If a Viewer is ALREADY waiting, tell the Camera to start immediately!
    if (viewerSocketId) {
      console.log('Viewer found waiting! Telling Camera to start stream...');
      io.to(cameraSocketId).emit('viewer_joined');
    }
  });

  // 2. Identify Viewer
  socket.on('register_viewer', () => {
    viewerSocketId = socket.id;
    console.log('Viewer registered:', socket.id);
    
    // If Camera is already there, ask for the stream
    if (cameraSocketId) {
      console.log('Camera found! Requesting stream...');
      io.to(cameraSocketId).emit('viewer_joined');
    }
  });

  // 3. Relay WebRTC signaling messages
  socket.on('offer', (data) => {
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.broadcast.emit('answer', data);
  });

  socket.on('candidate', (data) => {
    socket.broadcast.emit('candidate', data);
  });

  // 4. Handle Remote Camera Switch
  socket.on('cmd_switch_camera', () => {
    console.log('Command: Switch Camera received');
    socket.broadcast.emit('cmd_switch_camera');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.id === cameraSocketId) cameraSocketId = null;
    if (socket.id === viewerSocketId) viewerSocketId = null;
  });
});

// Use the PORT Render assigns, or 3000 if running locally
const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Signaling server running on port ${port}`);
});