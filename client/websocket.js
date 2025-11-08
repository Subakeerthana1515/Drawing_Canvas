class WebSocketManager {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.userId = null;
    this.username = null;
    this.currentUser = null;
    this.users = new Map();

    this.latencyCheckInterval = null;
    this.lastPingTime = 0;
  }

  connect() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.startLatencyCheck();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.stopLatencyCheck();
    });

    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data);
      this.userId = data.userId;
      this.currentUser = data.user;

      data.users.forEach(user => {
        this.users.set(user.id, user);
      });

      if (this.onUserJoined) {
        this.onUserJoined(data);
      }
    });

    this.socket.on('user-connected', (user) => {
      console.log('New user connected:', user);
      this.users.set(user.id, user);

      if (this.onUserConnected) {
        this.onUserConnected(user);
      }
    });

    this.socket.on('user-disconnected', (userId) => {
      console.log('User disconnected:', userId);
      this.users.delete(userId);

      if (this.onUserDisconnected) {
        this.onUserDisconnected(userId);
      }
    });

    this.socket.on('stroke-added', (data) => {
      if (this.onStrokeAdded) {
        this.onStrokeAdded(data);
      }
    });

    this.socket.on('point-drawn', (data) => {
      if (this.onPointDrawn) {
        this.onPointDrawn(data);
      }
    });

    this.socket.on('cursor-moved', (data) => {
      const user = this.users.get(data.userId);
      if (user) {
        user.cursor = data.cursor;
      }

      if (this.onCursorMoved) {
        this.onCursorMoved(data);
      }
    });

    this.socket.on('operation-undone', (data) => {
      if (this.onOperationUndone) {
        this.onOperationUndone(data);
      }
    });

    this.socket.on('operation-redone', (data) => {
      if (this.onOperationRedone) {
        this.onOperationRedone(data);
      }
    });

    this.socket.on('canvas-cleared', () => {
      if (this.onCanvasCleared) {
        this.onCanvasCleared();
      }
    });

    this.socket.on('pong', () => {
      const latency = Date.now() - this.lastPingTime;
      if (this.onLatencyUpdate) {
        this.onLatencyUpdate(latency);
      }
    });
  }

  joinRoom(roomId, username) {
    this.roomId = roomId;
    this.username = username;

    this.socket.emit('join-room', {
      roomId: roomId,
      username: username
    });
  }

  sendStroke(points, color, width, tool) {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('draw-stroke', {
      roomId: this.roomId,
      points: points,
      color: color,
      width: width,
      tool: tool
    });
  }

  sendPoint(point, color, width, tool) {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('draw-point', {
      roomId: this.roomId,
      point: point,
      color: color,
      width: width,
      tool: tool
    });
  }

  sendCursor(cursor) {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('cursor-move', {
      roomId: this.roomId,
      cursor: cursor
    });
  }

  undo() {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('undo', {
      roomId: this.roomId
    });
  }

  redo() {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('redo', {
      roomId: this.roomId
    });
  }

  clearCanvas() {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('clear-canvas', {
      roomId: this.roomId
    });
  }

  startLatencyCheck() {
    this.latencyCheckInterval = setInterval(() => {
      this.lastPingTime = Date.now();
      this.socket.emit('ping');
    }, 3000);
  }

  stopLatencyCheck() {
    if (this.latencyCheckInterval) {
      clearInterval(this.latencyCheckInterval);
      this.latencyCheckInterval = null;
    }
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  getCurrentUser() {
    return this.currentUser;
  }

  disconnect() {
    if (this.socket) {
      this.stopLatencyCheck();
      this.socket.disconnect();
    }
  }
}
