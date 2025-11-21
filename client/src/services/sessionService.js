// client/src/services/sessionService.js
import { v4 as uuidv4 } from "uuid";
import { estimateXP } from "../config/xpConfig.js";

const SESSION_QUEUE_KEY = "ffm:queue";
const API_BASE_URL = "http://localhost:3001/api";

// Session model
const createSession = (durationMinutes, isBreak = false, goalId = null) => ({
  sessionId: uuidv4(),
  startAt: new Date().toISOString(),
  endAt: null,
  durationMinutes,
  completed: false,
  xpGained: 0,
  interrupted: false,
  penaltyApplied: 0,
  isBreak,
  goalId,
  type: isBreak ? "break" : "work",
  serverSessionId: null, // For anti-farming validation
  estimatedXP: 0,
  serverValidated: false,
});

// Get session queue from localStorage
const getSessionQueue = () => {
  try {
    const queue = localStorage.getItem(SESSION_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error("Error loading session queue:", error);
    return [];
  }
};

// Persist session queue to localStorage
const persistQueue = (queue) => {
  try {
    localStorage.setItem(SESSION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error persisting session queue:", error);
  }
};

// Add session to sync queue
export const enqueueSession = (session) => {
  // Calculate estimated XP for client-side display
  session.estimatedXP = estimateXP({
    minutes: session.durationMinutes,
    isBreak: session.isBreak,
    taskCompleted: session.tasksCompleted || false,
    currentStreak: 0, // TODO: Get actual streak
    recentShortSessionsCount: 0,
    recentWorkMinutes: 60,
    recentBreakMinutes: 15,
  });

  const queue = getSessionQueue();
  queue.push({ ...session, queuedAt: new Date().toISOString() });
  persistQueue(queue);
  console.log("Session queued for sync:", session.sessionId);

  // Attempt immediate sync
  syncPendingSessions();
};

// Start session - registers with server for anti-farming
export const startSession = async (session) => {
  try {
    const response = await fetch(`${API_BASE_URL}/session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: session.sessionId,
        durationMinutes: session.durationMinutes,
        isBreak: session.isBreak,
        goalId: session.goalId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      session.serverSessionId = data.serverSessionId;
      session.serverValidated = true;

      // Update session in queue
      const queue = getSessionQueue();
      const index = queue.findIndex((s) => s.sessionId === session.sessionId);
      if (index >= 0) {
        queue[index] = { ...queue[index], ...session };
        persistQueue(queue);
      }

      console.log(
        "Session started on server:",
        session.sessionId,
        "->",
        data.serverSessionId,
      );
      return { success: true, serverSessionId: data.serverSessionId };
    } else {
      console.warn(
        "Server session start failed, continuing offline:",
        response.status,
      );
      return { success: false, offline: true };
    }
  } catch (error) {
    console.warn("Session start error, continuing offline:", error.message);
    return { success: false, offline: true };
  }
};

// Complete a session
export const completeSession = async (
  sessionId,
  actualDurationMinutes = null,
  tasksCompleted = false,
) => {
  const queue = getSessionQueue();
  const session = queue.find((s) => s.sessionId === sessionId);

  if (!session) {
    console.error("Session not found:", sessionId);
    return { success: false, error: "Session not found" };
  }

  const endAt = new Date().toISOString();
  const finalDuration = actualDurationMinutes || session.durationMinutes;

  // Try server validation first
  if (session.serverSessionId && session.serverValidated) {
    try {
      const response = await fetch(`${API_BASE_URL}/session/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverSessionId: session.serverSessionId,
          actualDurationMinutes: finalDuration,
          tasksCompleted,
          completed: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update with server-validated XP
        session.endAt = endAt;
        session.completed = true;
        session.xpGained = data.xpAwarded;
        session.interrupted = false;
        session.actualDurationMinutes = finalDuration;
        session.tasksCompleted = tasksCompleted;
        session.serverValidated = true;
        session.synced = true;
        session.syncedAt = new Date().toISOString();

        persistQueue(queue);
        console.log(
          "Session completed with server validation:",
          sessionId,
          "XP:",
          data.xpAwarded,
        );
        return {
          success: true,
          xpGained: data.xpAwarded,
          serverValidated: true,
        };
      } else {
        console.warn(
          "Server validation failed, using client estimate:",
          response.status,
        );
      }
    } catch (error) {
      console.warn(
        "Server validation error, using client estimate:",
        error.message,
      );
    }
  }

  // Fallback to client estimation
  const clientXP = estimateXP({
    minutes: finalDuration,
    isBreak: session.isBreak,
    taskCompleted: tasksCompleted,
    currentStreak: 0, // TODO: Get actual streak
    recentShortSessionsCount: 0,
    recentWorkMinutes: 60,
    recentBreakMinutes: 15,
  });
  session.endAt = endAt;
  session.completed = true;
  session.xpGained = clientXP;
  session.interrupted = false;
  session.actualDurationMinutes = finalDuration;
  session.tasksCompleted = tasksCompleted;
  session.serverValidated = false;

  persistQueue(queue);
  console.log(
    "Session completed with client estimate:",
    sessionId,
    "XP:",
    clientXP,
  );

  // Try to sync later
  syncPendingSessions();

  return { success: true, xpGained: clientXP, serverValidated: false };
};

// Mark session as interrupted/stopped early
export const interruptSession = async (
  sessionId,
  penalty = 0,
  actualDurationMinutes = null,
) => {
  const queue = getSessionQueue();
  const session = queue.find((s) => s.sessionId === sessionId);

  if (!session) {
    console.error("Session not found:", sessionId);
    return { success: false, error: "Session not found" };
  }

  const endAt = new Date().toISOString();
  const finalDuration = actualDurationMinutes || 0; // Interrupted sessions often have minimal actual time

  // Try server validation if we have server session
  if (session.serverSessionId && session.serverValidated) {
    try {
      const response = await fetch(`${API_BASE_URL}/session/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverSessionId: session.serverSessionId,
          actualDurationMinutes: finalDuration,
          tasksCompleted: false,
          completed: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        session.endAt = endAt;
        session.completed = false;
        session.interrupted = true;
        session.xpGained = data.xpAwarded;
        session.penaltyApplied = penalty;
        session.actualDurationMinutes = finalDuration;
        session.serverValidated = true;
        session.synced = true;
        session.syncedAt = new Date().toISOString();

        persistQueue(queue);
        console.log(
          "Session interrupted with server validation:",
          sessionId,
          "XP:",
          data.xpAwarded,
        );
        return {
          success: true,
          xpGained: data.xpAwarded,
          serverValidated: true,
        };
      } else {
        console.warn(
          "Server interruption validation failed, using client penalty:",
          response.status,
        );
      }
    } catch (error) {
      console.warn(
        "Server interruption error, using client penalty:",
        error.message,
      );
    }
  }

  // Fallback to client penalty calculation
  session.endAt = endAt;
  session.completed = false;
  session.interrupted = true;
  session.penaltyApplied = penalty;
  session.xpGained = Math.max(0, (session.estimatedXP || 0) - penalty);
  session.actualDurationMinutes = finalDuration;
  session.serverValidated = false;

  persistQueue(queue);
  console.log(
    "Session interrupted with client penalty:",
    sessionId,
    "Penalty:",
    penalty,
  );

  // Try to sync later
  syncPendingSessions();

  return { success: true, xpGained: session.xpGained, serverValidated: false };
};

// Sync pending sessions to server
export const syncPendingSessions = async () => {
  const queue = getSessionQueue();
  const pendingSessions = queue.filter((s) => !s.synced);

  if (pendingSessions.length === 0) {
    return { success: true, synced: 0 };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessions: pendingSessions }),
    });

    if (response.ok) {
      // Mark sessions as synced
      const updatedQueue = queue.map((session) =>
        pendingSessions.find((ps) => ps.sessionId === session.sessionId)
          ? { ...session, synced: true, syncedAt: new Date().toISOString() }
          : session,
      );

      persistQueue(updatedQueue);
      console.log(`Successfully synced ${pendingSessions.length} sessions`);
      return { success: true, synced: pendingSessions.length };
    } else {
      console.error("Failed to sync sessions:", response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error("Error syncing sessions:", error);
    return { success: false, error: error.message };
  }
};

// Clear old synced sessions (keep last 100)
export const cleanupSyncedSessions = () => {
  const queue = getSessionQueue();
  const syncedSessions = queue
    .filter((s) => s.synced)
    .sort(
      (a, b) =>
        new Date(b.syncedAt || b.endAt) - new Date(a.syncedAt || a.endAt),
    );

  if (syncedSessions.length > 100) {
    const toKeep = syncedSessions.slice(0, 100);
    const pendingSessions = queue.filter((s) => !s.synced);
    const cleanQueue = [...pendingSessions, ...toKeep];

    persistQueue(cleanQueue);
    console.log(`Cleaned up ${syncedSessions.length - 100} old sessions`);
  }
};

// Get session statistics
export const getSessionStats = () => {
  const queue = getSessionQueue();
  const completedSessions = queue.filter((s) => s.completed);
  const totalXP = completedSessions.reduce((sum, s) => sum + s.xpGained, 0);
  const totalMinutes = completedSessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );

  return {
    totalSessions: completedSessions.length,
    totalXP,
    totalMinutes,
    averageSessionLength:
      completedSessions.length > 0
        ? totalMinutes / completedSessions.length
        : 0,
    streak: calculateStreak(queue),
  };
};

// Calculate current streak
const calculateStreak = (queue) => {
  const recentSessions = queue
    .filter((s) => s.completed)
    .sort((a, b) => new Date(b.endAt) - new Date(a.endAt));

  let streak = 0;
  for (const session of recentSessions) {
    if (session.completed) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export { createSession, getSessionQueue };

// Get estimated XP for a session before starting
export const getEstimatedXP = (
  durationMinutes,
  isBreak = false,
  tasksCompleted = false,
  currentStreak = 0,
) => {
  return estimateXP({
    minutes: durationMinutes,
    isBreak,
    taskCompleted: tasksCompleted,
    currentStreak,
    recentShortSessionsCount: 0,
    recentWorkMinutes: 60, // TODO: Get actual recent work minutes
    recentBreakMinutes: 15, // TODO: Get actual recent break minutes
  });
};

// Get XP consequences warning for very short sessions
export const getXPConsequences = (durationMinutes, isBreak = false) => {
  if (isBreak || durationMinutes >= 5) {
    return null; // No warning needed
  }

  // Calculate base XP (without anti-farming penalties)
  const baseXP = durationMinutes * 10;

  // Calculate effective XP (with anti-farming penalties)
  const effectiveXP = estimateXP({
    minutes: durationMinutes,
    isBreak: false,
    taskCompleted: false,
    currentStreak: 0,
    recentShortSessionsCount: 0,
    recentWorkMinutes: 60, // TODO: Get actual recent work minutes
    recentBreakMinutes: 15, // TODO: Get actual recent break minutes
  });

  const penalty = baseXP - effectiveXP;

  return {
    baseXP,
    effectiveXP,
    penalty,
    warningMessage: `Sessions under 5 minutes receive reduced XP due to anti-farming protection.`,
  };
};
