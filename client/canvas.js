class CanvasManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });

    this.isDrawing = false;
    this.currentStroke = [];
    this.strokes = [];
    this.tempStrokes = new Map();

    this.currentTool = 'draw';
    this.currentColor = '#000000';
    this.currentWidth = 3;

    this.lastBatchTime = 0;
    this.batchInterval = 30;
    this.pendingPoints = [];

    this.animationFrameId = null;

    this.initCanvas();
    this.setupEventListeners();
  }

  initCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const oldStrokes = [...this.strokes];

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.strokes = oldStrokes;
    this.redrawCanvas();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrawing(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stopDrawing();
    }, { passive: false });
  }

  normalizeCoordinate(x, y) {
    return {
      x: x / this.canvas.width,
      y: y / this.canvas.height
    };
  }

  denormalizeCoordinate(nx, ny) {
    return {
      x: nx * this.canvas.width,
      y: ny * this.canvas.height
    };
  }

  getCanvasCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX || e.pageX) - rect.left,
      y: (e.clientY || e.pageY) - rect.top
    };
  }

  startDrawing(e) {
    this.isDrawing = true;
    const coords = this.getCanvasCoordinates(e);
    const normalizedCoords = this.normalizeCoordinate(coords.x, coords.y);

    this.currentStroke = [normalizedCoords];
    this.pendingPoints = [normalizedCoords];
    this.lastBatchTime = Date.now();

    this.drawPoint(coords.x, coords.y, this.currentColor, this.currentWidth, this.currentTool);

    if (this.onDrawStart) {
      this.onDrawStart(normalizedCoords);
    }
  }

  draw(e) {
    if (!this.isDrawing) {
      const coords = this.getCanvasCoordinates(e);
      const normalizedCoords = this.normalizeCoordinate(coords.x, coords.y);

      if (this.onCursorMove) {
        this.onCursorMove(normalizedCoords);
      }
      return;
    }

    const coords = this.getCanvasCoordinates(e);
    const normalizedCoords = this.normalizeCoordinate(coords.x, coords.y);

    this.currentStroke.push(normalizedCoords);
    this.pendingPoints.push(normalizedCoords);

    if (this.currentStroke.length >= 2) {
      const prevPoint = this.currentStroke[this.currentStroke.length - 2];
      const prevDenorm = this.denormalizeCoordinate(prevPoint.x, prevPoint.y);
      this.drawLine(
        prevDenorm.x, prevDenorm.y,
        coords.x, coords.y,
        this.currentColor,
        this.currentWidth,
        this.currentTool
      );
    }

    const now = Date.now();
    if (now - this.lastBatchTime >= this.batchInterval && this.pendingPoints.length > 0) {
      if (this.onDrawBatch) {
        this.onDrawBatch([...this.pendingPoints]);
      }
      this.pendingPoints = [];
      this.lastBatchTime = now;
    }
  }

  stopDrawing() {
    if (!this.isDrawing) return;

    this.isDrawing = false;

    if (this.pendingPoints.length > 0 && this.onDrawBatch) {
      this.onDrawBatch([...this.pendingPoints]);
      this.pendingPoints = [];
    }

    if (this.currentStroke.length > 0) {
      const stroke = {
        points: this.currentStroke,
        color: this.currentColor,
        width: this.currentWidth,
        tool: this.currentTool,
        id: Date.now()
      };

      this.strokes.push(stroke);

      if (this.onStrokeComplete) {
        this.onStrokeComplete(stroke);
      }
    }

    this.currentStroke = [];
  }

  drawPoint(x, y, color, width, tool) {
    this.ctx.save();

    if (tool === 'erase') {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, width / 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawLine(x1, y1, x2, y2, color, width, tool) {
    this.ctx.save();

    if (tool === 'erase') {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawStroke(stroke) {
    if (!stroke || !stroke.points || stroke.points.length === 0) return;

    const points = stroke.points;

    for (let i = 0; i < points.length; i++) {
      const point = this.denormalizeCoordinate(points[i].x, points[i].y);

      if (i === 0) {
        this.drawPoint(point.x, point.y, stroke.color, stroke.width, stroke.tool);
      } else {
        const prevPoint = this.denormalizeCoordinate(points[i - 1].x, points[i - 1].y);
        this.drawLine(
          prevPoint.x, prevPoint.y,
          point.x, point.y,
          stroke.color,
          stroke.width,
          stroke.tool
        );
      }
    }
  }

  addRemotePoint(userId, point, color, width, tool) {
    if (!this.tempStrokes.has(userId)) {
      this.tempStrokes.set(userId, []);
    }

    const userStrokes = this.tempStrokes.get(userId);
    const denormPoint = this.denormalizeCoordinate(point.x, point.y);

    if (userStrokes.length > 0) {
      const lastPoint = userStrokes[userStrokes.length - 1];
      const lastDenorm = this.denormalizeCoordinate(lastPoint.x, lastPoint.y);
      this.drawLine(
        lastDenorm.x, lastDenorm.y,
        denormPoint.x, denormPoint.y,
        color,
        width,
        tool
      );
    } else {
      this.drawPoint(denormPoint.x, denormPoint.y, color, width, tool);
    }

    userStrokes.push(point);
  }

  completeRemoteStroke(userId, stroke) {
    this.tempStrokes.delete(userId);

    if (stroke && stroke.points && stroke.points.length > 0) {
      this.strokes.push(stroke);
    }
  }

  redrawCanvas() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (const stroke of this.strokes) {
        this.drawStroke(stroke);
      }

      this.animationFrameId = null;
    });
  }

  loadStrokes(strokes) {
    this.strokes = strokes || [];
    this.redrawCanvas();
  }

  clearCanvas() {
    this.strokes = [];
    this.tempStrokes.clear();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setWidth(width) {
    this.currentWidth = width;
  }

  exportPNG() {
    const link = document.createElement('a');
    link.download = `flam-canvas-${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}
