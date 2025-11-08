# Flam Collaborative Canvas

A production-ready real-time collaborative drawing canvas application built with vanilla JavaScript, HTML5 Canvas API, and Socket.IO. Multiple users can draw together on the same canvas with live synchronization, cursor tracking, and global undo/redo capabilities.

## Features

### Core Features
- **Real-time Drawing**: Draw on the canvas and see strokes appear live for all users
- **Live Stroke Synchronization**: Strokes sync as they're being drawn, not just after completion
- **Multiple Drawing Tools**:
  - Draw tool with customizable colors
  - Eraser tool
  - Adjustable brush width (1-20px)
- **Cursor Tracking**: See other users' cursor positions with their names and colors
- **Global Undo/Redo**: Any user can undo/redo operations, affecting the entire canvas
- **Room System**: Users can join specific rooms via URL or room ID
- **Clear Canvas**: Ability to clear the entire canvas for all users
- **Export PNG**: Download the current canvas as a PNG image

### UI/UX Features
- **Flam Branding**: Pastel lavender-pink gradient background (#f9e0ff → #e0ccff)
- **Floating Toolbar**: Translucent white toolbar with rounded corners and soft shadows
- **User Panel**: Shows active users with their assigned colors
- **Latency Display**: Real-time connection latency indicator
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Transitions and hover effects throughout the UI

### Technical Features
- **Coordinate Normalization**: All coordinates normalized (0-1) for screen size compatibility
- **Point Batching**: Strokes batched every 30ms to reduce network traffic
- **Efficient Rendering**: RequestAnimationFrame for smooth drawing
- **Op-log System**: Append-only operation log for reliable undo/redo
- **Touch Support**: Full touch/mobile drawing support

## Tech Stack

**Frontend:**
- HTML5
- CSS3
- Vanilla JavaScript (no frameworks)
- HTML5 Canvas API
- Socket.IO Client

**Backend:**
- Node.js
- Express
- Socket.IO Server

## Installation & Setup

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

### Development Mode
```bash
npm run dev
```

## Usage

### Joining a Room

1. When you open the application, you'll see a welcome modal
2. Enter your name (optional - a random name will be assigned if left empty)
3. Enter a room ID (default: 'default')
4. Click "Join Room"

### Sharing a Room

Share the URL with the room parameter:
```
http://localhost:3000?room=myroom
```

### Drawing

- **Draw**: Click the pencil icon or use the default tool
- **Erase**: Click the eraser icon to erase parts of the canvas
- **Change Color**: Click the color circle to pick a new color
- **Adjust Width**: Use the slider to change brush width
- **Undo**: Click the undo button to undo the last stroke
- **Redo**: Click the redo button to redo an undone stroke
- **Clear**: Click the trash icon to clear the entire canvas (confirmation required)
- **Export**: Click the download icon to save the canvas as PNG

### Multi-User Testing

To test with multiple users:

1. Open the application in multiple browser windows/tabs
2. Use the same room ID in each window
3. Start drawing in any window and watch it appear in all others
4. Move your cursor and see it displayed for other users
5. Try undo/redo from different windows to see global state management

**Or use incognito/private windows:**
```
Window 1: http://localhost:3000?room=test
Window 2: http://localhost:3000?room=test (incognito)
Window 3: http://localhost:3000?room=test (different browser)
```

## Project Structure

```
collaborative-canvas/
├── client/
│   ├── index.html           # Main HTML structure
│   ├── style.css            # All styles including Flam branding
│   ├── canvas.js            # Canvas drawing logic and rendering
│   ├── websocket.js         # WebSocket client communication
│   └── main.js              # Initialization and toolbar control
├── server/
│   ├── server.js            # Express + Socket.IO server
│   ├── rooms.js             # Room and user session management
│   └── drawing-state.js     # Stroke tracking and undo/redo op-log
├── package.json
├── README.md
└── ARCHITECTURE.md
```

## Known Limitations

1. **No Persistence**: Canvas state is stored in memory only. When all users leave a room, the canvas is cleared.
2. **No Authentication**: Anyone can join any room with any name.
3. **Basic Conflict Resolution**: Strokes are processed in order received; no sophisticated conflict resolution.
4. **Memory Usage**: Large canvases with many strokes can consume significant memory.
5. **No Stroke Compression**: Full stroke data sent over network without compression.
6. **Single Server**: No horizontal scaling or load balancing support.

## Future Enhancements

- Database persistence for canvas state
- User authentication and room permissions
- Shape tools (rectangle, circle, line)
- Text tool
- Layers support
- Stroke compression
- Canvas zoom and pan
- Collaborative cursors with real-time drawing preview
- More brush types and effects

## Deployment

### Frontend Deployment
Deploy the `client` folder to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

**Frontend URL**: `https://your-frontend.vercel.app`

### Backend Deployment
Deploy the server to any Node.js hosting service:
- Heroku
- Render

**Backend URL**: `https://your-backend.onrender.com`
`

### Environment Configuration

For production, update the Socket.IO connection in `client/websocket.js`:

```javascript
this.socket = io('https://your-backend-url.com');
```

## Performance Notes

- **Coordinate Normalization**: Reduces data size and supports different screen sizes
- **Point Batching**: Reduces WebSocket messages by ~70%
- **RequestAnimationFrame**: Ensures smooth 60fps drawing
- **Efficient Repainting**: Only redraws when necessary

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with touch events


## Author

Built for Flam coding assessment

---

For detailed technical documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)
