const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

// In-memory storage
const sessions = [];
let userState = {
  id: 'default-user',
  xp: 0,
  level: 1,
  totalSessions: 0,
};

app.use(cors());
app.use(express.json());

// --- API Endpoints ---

// POST /api/sessions
// Records a completed focus session.
app.post('/api/sessions', (req, res) => {
  const session = req.body;
  session.receivedAt = new Date().toISOString();
  sessions.push(session);
  console.log('Received session:', session);
  res.status(201).json({ message: 'Session recorded', session });
});

// POST /api/user/sync
// Updates the user's state.
app.post('/api/user/sync', (req, res) => {
  const clientState = req.body;
  console.log('Received user sync request:', clientState);

  // Simple merge: client state overwrites server state
  userState = { ...userState, ...clientState };
  
  console.log('Updated user state:', userState);
  res.status(200).json(userState);
});

// GET /api/user/state (for debugging)
app.get('/api/user/state', (req, res) => {
  res.status(200).json(userState);
});

// GET /api/sessions (for debugging)
app.get('/api/sessions', (req, res) => {
  res.status(200).json(sessions);
});


app.listen(port, () => {
  console.log(`Focus Friendship server listening on port ${port}`);
});
