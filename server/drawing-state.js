class DrawingState {
  constructor() {
    this.opLog = [];
    this.nextOpId = 1;
  }

  addStroke(stroke) {
    const op = {
      id: this.nextOpId++,
      type: 'stroke',
      data: stroke,
      undone: false,
      timestamp: Date.now()
    };
    this.opLog.push(op);
    return op;
  }

  undo() {
    for (let i = this.opLog.length - 1; i >= 0; i--) {
      if (!this.opLog[i].undone) {
        this.opLog[i].undone = true;
        return this.opLog[i];
      }
    }
    return null;
  }

  redo() {
    for (let i = 0; i < this.opLog.length; i++) {
      if (this.opLog[i].undone) {
        this.opLog[i].undone = false;
        return this.opLog[i];
      }
    }
    return null;
  }

  getActiveStrokes() {
    return this.opLog
      .filter(op => !op.undone)
      .map(op => op.data);
  }

  clear() {
    this.opLog = [];
    this.nextOpId = 1;
  }

  getState() {
    return {
      opLog: this.opLog,
      nextOpId: this.nextOpId
    };
  }
}

module.exports = DrawingState;
