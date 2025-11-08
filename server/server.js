const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const roomManager = require('./rooms');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);

    const { room, user } = roomManager.addUser(roomId, socket.id, username);

    socket.emit('user-joined', {
      userId: user.id,
      user: user,
      users: roomManager.getRoomUsers(roomId),
      strokes: room.drawingState.getActiveStrokes()
    });

    socket.to(roomId).emit('user-connected', user);

    console.log(`User ${user.username} joined room ${roomId}`);
  });

  socket.on('draw-stroke', ({ roomId, points, color, width, tool }) => {
    const drawingState = roomManager.getRoomDrawingState(roomId);

    const stroke = {
      points,
      color,
      width,
      tool,
      userId: socket.id
    };

    const op = drawingState.addStroke(stroke);

    socket.to(roomId).emit('stroke-added', { op, stroke });
  });

  socket.on('draw-point', ({ roomId, point, color, width, tool }) => {
    socket.to(roomId).emit('point-drawn', {
      userId: socket.id,
      point,
      color,
      width,
      tool
    });
  });

  socket.on('cursor-move', ({ roomId, cursor }) => {
    roomManager.updateUserCursor(roomId, socket.id, cursor);
    socket.to(roomId).emit('cursor-moved', {
      userId: socket.id,
      cursor
    });
  });

  socket.on('undo', ({ roomId }) => {
    const drawingState = roomManager.getRoomDrawingState(roomId);
    const op = drawingState.undo();

    if (op) {
      io.to(roomId).emit('operation-undone', { opId: op.id });
    }
  });

  socket.on('redo', ({ roomId }) => {
    const drawingState = roomManager.getRoomDrawingState(roomId);
    const op = drawingState.redo();

    if (op) {
      io.to(roomId).emit('operation-redone', { opId: op.id, stroke: op.data });
    }
  });

  socket.on('clear-canvas', ({ roomId }) => {
    const drawingState = roomManager.getRoomDrawingState(roomId);
    drawingState.clear();

    io.to(roomId).emit('canvas-cleared');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    const rooms = Array.from(socket.rooms);
    rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        roomManager.removeUser(roomId, socket.id);
        socket.to(roomId).emit('user-disconnected', socket.id);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
