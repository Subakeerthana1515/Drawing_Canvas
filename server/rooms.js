const DrawingState = require('./drawing-state');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.userColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];
    this.colorIndex = 0;
  }

  getRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        drawingState: new DrawingState()
      });
    }
    return this.rooms.get(roomId);
  }

  addUser(roomId, socketId, username) {
    const room = this.getRoom(roomId);
    const color = this.userColors[this.colorIndex % this.userColors.length];
    this.colorIndex++;

    const user = {
      id: socketId,
      username: username || `User${room.users.size + 1}`,
      color: color,
      cursor: { x: 0, y: 0 }
    };

    room.users.set(socketId, user);
    return { room, user };
  }

  removeUser(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(socketId);
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  updateUserCursor(roomId, socketId, cursor) {
    const room = this.rooms.get(roomId);
    if (room && room.users.has(socketId)) {
      room.users.get(socketId).cursor = cursor;
    }
  }

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  getRoomDrawingState(roomId) {
    const room = this.getRoom(roomId);
    return room.drawingState;
  }
}

module.exports = new RoomManager();
