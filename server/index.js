const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const {
  XP_CONFIG,
  computeAward,
  validateSessionTiming,
} = require("./config/xpConfig");

const app = express();
const port = 3001;

// In-memory storage - Enhanced for anti-farming
const sessions = [];
const activeSessions = new Map(); // Track active sessions: sessionId -> sessionData
let userState = {
  id: "default-user",
  xp: 0,
  level: 1,
  totalSessions: 0,
  currentStreak: 0,
  sessionsHistory: [], // Recent sessions for anti-farming
  pets: {
    active: "bean-0",
    collection: {
      "bean-0": { id: "bean-0", xp: 0, level: 1, unlocked: true },
    },
  },
};

app.use(cors());
app.use(express.json());

// --- NEW ANTI-FARMING SESSION ENDPOINTS ---

// POST /api/session/start
// Starts a new focus session with server-side tracking
app.post("/api/session/start", (req, res) => {
  const { clientSessionId, userId, startAt, intendedDurationMinutes } =
    req.body;

  // Validate input
  if (!clientSessionId || !userId || !startAt || !intendedDurationMinutes) {
    return res.status(400).json({
      error:
        "Missing required fields: clientSessionId, userId, startAt, intendedDurationMinutes",
    });
  }

  // Generate server session ID and store
  const serverSessionId = uuidv4();
  const serverStartAt = Date.now();

  const sessionData = {
    serverSessionId,
    clientSessionId,
    userId,
    clientStartAt: startAt,
    serverStartAt,
    intendedDurationMinutes,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  activeSessions.set(serverSessionId, sessionData);

  console.log(`Session started: ${serverSessionId} for user ${userId}`);

  res.status(200).json({
    serverSessionId,
    serverStartAt,
    message: "Session started successfully",
  });
});

// POST /api/session/end
// Ends a session with server-side XP calculation and anti-farming validation
app.post("/api/session/end", (req, res) => {
  const {
    serverSessionId,
    clientSessionId,
    endAt,
    durationMinutes,
    completed = false,
    taskCompleted,
  } = req.body;

  // Validate input
  if (
    !serverSessionId ||
    !clientSessionId ||
    !endAt ||
    durationMinutes === undefined
  ) {
    return res.status(400).json({
      error:
        "Missing required fields: serverSessionId, clientSessionId, endAt, durationMinutes",
    });
  }

  // Get session from active sessions
  const sessionData = activeSessions.get(serverSessionId);
  if (!sessionData) {
    return res.status(404).json({
      error: "Session not found or already completed",
    });
  }

  // Validate timing (prevent spoofing)
  if (
    !validateSessionTiming(sessionData.serverStartAt, endAt, durationMinutes)
  ) {
    console.warn(
      `Invalid session timing for ${serverSessionId}: reported ${durationMinutes}min vs server calculated ${(endAt - sessionData.serverStartAt) / (60 * 1000)}min`,
    );
    return res.status(400).json({
      error: "Session timing validation failed",
    });
  }

  // Compute authoritative XP award
  const award = computeAward(
    {
      minutes: durationMinutes,
      isBreak: false, // For now, assuming work sessions
      taskCompleted: taskCompleted ? true : false,
    },
    userState,
  );

  // Update user state
  const oldLevel = userState.level;
  const oldPetLevel =
    userState.pets.collection[userState.pets.active]?.level || 1;

  userState.xp += award.awardedXP;
  userState.totalSessions += 1;

  // Update level (basic level calculation)
  const newLevel = Math.floor(userState.xp / 100) + 1;
  const levelUp = newLevel > oldLevel;
  userState.level = newLevel;

  // Update current streak
  if (completed && durationMinutes >= XP_CONFIG.minEffectiveMinutes) {
    userState.currentStreak += 1;
  } else if (!completed) {
    userState.currentStreak = 0;
  }

  // Update pet XP and level
  const activePetId = userState.pets.active;
  if (!userState.pets.collection[activePetId]) {
    userState.pets.collection[activePetId] = {
      id: activePetId,
      xp: 0,
      level: 1,
      unlocked: true,
    };
  }

  userState.pets.collection[activePetId].xp += award.petXP;
  const petNewLevel =
    Math.floor(userState.pets.collection[activePetId].xp / 50) + 1;
  const petLevelUp = petNewLevel > oldPetLevel;
  userState.pets.collection[activePetId].level = petNewLevel;

  // Add to sessions history for anti-farming tracking
  const sessionRecord = {
    sessionId: serverSessionId,
    userId: sessionData.userId,
    startTime: sessionData.serverStartAt,
    endTime: endAt,
    minutes: durationMinutes,
    completed,
    taskCompleted: taskCompleted ? true : false,
    awardedXP: award.awardedXP,
    petXP: award.petXP,
    completedAt: Date.now(),
    factors: award.factors,
  };

  sessions.push(sessionRecord);
  userState.sessionsHistory = userState.sessionsHistory || [];
  userState.sessionsHistory.push(sessionRecord);

  // Keep only recent history (last 50 sessions for performance)
  if (userState.sessionsHistory.length > 50) {
    userState.sessionsHistory = userState.sessionsHistory.slice(-50);
  }

  // Remove from active sessions
  activeSessions.delete(serverSessionId);

  // Check for unlocked items (basic implementation)
  const unlockedItems = [];
  if (levelUp) {
    // Check for level-based unlocks
    const LEVEL_UNLOCKS = [
      { level: 3, type: "pet", id: "bean-1" },
      { level: 8, type: "pet", id: "bean-2" },
      { level: 15, type: "pet", id: "bean-3" },
      { level: 25, type: "pet", id: "bean-4" },
    ];

    LEVEL_UNLOCKS.forEach((unlock) => {
      if (
        userState.level >= unlock.level &&
        !userState.pets.collection[unlock.id]
      ) {
        userState.pets.collection[unlock.id] = {
          id: unlock.id,
          xp: 0,
          level: 1,
          unlocked: true,
        };
        unlockedItems.push(unlock);
      }
    });
  }

  console.log(
    `Session completed: ${serverSessionId}, awarded ${award.awardedXP} XP, ${award.petXP} pet XP`,
  );

  res.status(200).json({
    awardedXP: award.awardedXP,
    petXP: award.petXP,
    levelUp,
    petLevelUp,
    newUserState: {
      xp: userState.xp,
      level: userState.level,
      totalSessions: userState.totalSessions,
      currentStreak: userState.currentStreak,
    },
    newPetState: userState.pets.collection[activePetId],
    unlockedItems,
    factors: award.factors,
    message: "Session completed successfully",
  });
});

// --- EXISTING ENDPOINTS ---

// POST /api/sessions
// Records a completed focus session.
app.post("/api/sessions", (req, res) => {
  const {
    sessionId,
    userId,
    startTime,
    endTime,
    durationMinutes,
    isBreak,
    goalId,
    xpGained,
  } = req.body;

  // Validate required fields
  if (
    !sessionId ||
    !userId ||
    !startTime ||
    !endTime ||
    durationMinutes === undefined ||
    isBreak === undefined
  ) {
    return res.status(400).json({
      error:
        "Missing required fields: sessionId, userId, startTime, endTime, durationMinutes, isBreak",
    });
  }

  const session = {
    sessionId,
    userId,
    startTime,
    endTime,
    durationMinutes,
    isBreak,
    goalId,
    xpGained: xpGained || 0,
    receivedAt: new Date().toISOString(),
  };

  sessions.push(session);
  console.log("Received session:", session);
  res.status(200).json({ message: "Session recorded successfully", session });
});

// POST /api/user/sync
// Updates the user's state.
app.post("/api/user/sync", (req, res) => {
  const {
    userId,
    level,
    xp,
    totalSessions,
    totalMinutes,
    currentStreak,
    selectedBean,
  } = req.body;

  // Validate user state data
  if (
    !userId ||
    typeof level !== "number" ||
    typeof xp !== "number" ||
    level < 1 ||
    xp < 0
  ) {
    return res.status(400).json({
      error:
        "Invalid user state data: userId, level, and xp are required and must be valid",
    });
  }

  const clientState = {
    userId,
    level,
    xp,
    totalSessions: totalSessions || 0,
    totalMinutes: totalMinutes || 0,
    currentStreak: currentStreak || 0,
    selectedBean: selectedBean || "blue",
    syncedAt: new Date().toISOString(),
  };

  console.log("Received user sync request:", clientState);

  // Simple merge: client state overwrites server state
  userState = { ...userState, ...clientState };

  console.log("Updated user state:", userState);
  res
    .status(200)
    .json({ message: "User state synced successfully", user: userState });
});

// GET /api/user/state/:userId (for debugging)
app.get("/api/user/state/:userId", (req, res) => {
  const { userId } = req.params;
  const user = { ...userState, userId: userId || userState.userId };
  res.status(200).json(user);
});

// GET /api/sessions/:userId (for debugging)
app.get("/api/sessions/:userId", (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const userSessions = sessions.filter((session) => session.userId === userId);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedSessions = userSessions.slice(startIndex, endIndex);

  res.status(200).json({
    sessions: paginatedSessions,
    total: userSessions.length,
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Only start server if not in test mode
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Focus Friendship server listening on port ${port}`);
  });
}

module.exports = app;
