let canvasManager;
let wsManager;
let currentStrokesByUser = new Map();

function init() {
  canvasManager = new CanvasManager('canvas');
  wsManager = new WebSocketManager();

  setupToolbar();
  setupWebSocketHandlers();
  setupWelcomeModal();
}

function setupToolbar() {
  const drawBtn = document.getElementById('draw-btn');
  const eraseBtn = document.getElementById('erase-btn');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const colorPicker = document.getElementById('color-picker');
  const colorDisplay = document.getElementById('color-display');
  const widthSlider = document.getElementById('width-slider');
  const widthValue = document.getElementById('width-value');
  const clearBtn = document.getElementById('clear-btn');
  const exportBtn = document.getElementById('export-btn');

  drawBtn.addEventListener('click', () => {
    setActiveTool('draw');
    canvasManager.setTool('draw');
  });

  eraseBtn.addEventListener('click', () => {
    setActiveTool('erase');
    canvasManager.setTool('erase');
  });

  undoBtn.addEventListener('click', () => {
    wsManager.undo();
  });

  redoBtn.addEventListener('click', () => {
    wsManager.redo();
  });

  colorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    canvasManager.setColor(color);
    colorDisplay.style.background = color;
  });

  colorDisplay.style.background = colorPicker.value;

  widthSlider.addEventListener('input', (e) => {
    const width = parseInt(e.target.value);
    canvasManager.setWidth(width);
    widthValue.textContent = width;
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire canvas? This will affect all users.')) {
      wsManager.clearCanvas();
    }
  });

  exportBtn.addEventListener('click', () => {
    canvasManager.exportPNG();
  });
}

function setActiveTool(tool) {
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.classList.remove('active');
  });

  const toolBtn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
  if (toolBtn) {
    toolBtn.classList.add('active');
  }
}

function setupWebSocketHandlers() {
  wsManager.connect();

  canvasManager.onStrokeComplete = (stroke) => {
    wsManager.sendStroke(
      stroke.points,
      stroke.color,
      stroke.width,
      stroke.tool
    );
  };

  canvasManager.onDrawBatch = (points) => {
    points.forEach(point => {
      wsManager.sendPoint(
        point,
        canvasManager.currentColor,
        canvasManager.currentWidth,
        canvasManager.currentTool
      );
    });
  };

  canvasManager.onCursorMove = (cursor) => {
    wsManager.sendCursor(cursor);
  };

  wsManager.onUserJoined = (data) => {
    canvasManager.loadStrokes(data.strokes || []);
    updateUsersList();
    updateRoomInfo();
    document.getElementById('welcome-modal').classList.add('hidden');
  };

  wsManager.onUserConnected = (user) => {
    updateUsersList();
    showNotification(`${user.username} joined the room`);
  };

  wsManager.onUserDisconnected = (userId) => {
    updateUsersList();
    removeCursor(userId);
    currentStrokesByUser.delete(userId);
  };

  wsManager.onStrokeAdded = (data) => {
    canvasManager.completeRemoteStroke(data.stroke.userId, data.stroke);
  };

  wsManager.onPointDrawn = (data) => {
    const user = wsManager.getUser(data.userId);
    const color = user ? user.color : data.color;

    canvasManager.addRemotePoint(
      data.userId,
      data.point,
      color,
      data.width,
      data.tool
    );
  };

  wsManager.onCursorMoved = (data) => {
    const user = wsManager.getUser(data.userId);
    if (user) {
      updateCursor(user);
    }
  };

  wsManager.onOperationUndone = (data) => {
    canvasManager.strokes = canvasManager.strokes.filter((_, index) => {
      return index !== canvasManager.strokes.length - 1;
    });
    canvasManager.redrawCanvas();
  };

  wsManager.onOperationRedone = (data) => {
    if (data.stroke) {
      canvasManager.strokes.push(data.stroke);
      canvasManager.redrawCanvas();
    }
  };

  wsManager.onCanvasCleared = () => {
    canvasManager.clearCanvas();
  };

  wsManager.onLatencyUpdate = (latency) => {
    updateLatency(latency);
  };
}

function setupWelcomeModal() {
  const modal = document.getElementById('welcome-modal');
  const usernameInput = document.getElementById('username-input');
  const roomInput = document.getElementById('room-input');
  const joinBtn = document.getElementById('join-btn');

  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  if (roomFromUrl) {
    roomInput.value = roomFromUrl;
  }

  joinBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim() || `User${Math.floor(Math.random() * 1000)}`;
    const roomId = roomInput.value.trim() || 'default';

    wsManager.joinRoom(roomId, username);
  });

  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinBtn.click();
    }
  });

  roomInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinBtn.click();
    }
  });
}

function updateUsersList() {
  const usersList = document.getElementById('users-list');
  const users = wsManager.getAllUsers();

  usersList.innerHTML = '';

  users.forEach(user => {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';

    const colorDot = document.createElement('div');
    colorDot.className = 'user-color';
    colorDot.style.background = user.color;

    const userName = document.createElement('div');
    userName.className = 'user-name';
    userName.textContent = user.username;

    if (user.id === wsManager.userId) {
      userName.textContent += ' (You)';
    }

    userItem.appendChild(colorDot);
    userItem.appendChild(userName);
    usersList.appendChild(userItem);
  });
}

function updateCursor(user) {
  if (user.id === wsManager.userId) return;

  const cursorsContainer = document.getElementById('cursors-container');
  let cursorElement = document.getElementById(`cursor-${user.id}`);

  if (!cursorElement) {
    cursorElement = document.createElement('div');
    cursorElement.id = `cursor-${user.id}`;
    cursorElement.className = 'cursor';

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.style.background = user.color;

    const label = document.createElement('div');
    label.className = 'cursor-label';
    label.textContent = user.username;

    cursorElement.appendChild(dot);
    cursorElement.appendChild(label);
    cursorsContainer.appendChild(cursorElement);
  }

  const denormalized = canvasManager.denormalizeCoordinate(user.cursor.x, user.cursor.y);
  cursorElement.style.transform = `translate(${denormalized.x}px, ${denormalized.y}px)`;
}

function removeCursor(userId) {
  const cursorElement = document.getElementById(`cursor-${userId}`);
  if (cursorElement) {
    cursorElement.remove();
  }
}

function updateRoomInfo() {
  const roomIdDisplay = document.getElementById('room-id-display');
  roomIdDisplay.textContent = wsManager.roomId;
}

function updateLatency(latency) {
  const latencyValue = document.getElementById('latency-value');
  latencyValue.textContent = latency;

  if (latency < 50) {
    latencyValue.style.color = '#4ECDC4';
  } else if (latency < 100) {
    latencyValue.style.color = '#F7DC6F';
  } else {
    latencyValue.style.color = '#FF6B6B';
  }
}

function showNotification(message) {
  console.log('Notification:', message);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
