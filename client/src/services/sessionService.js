// client/src/services/sessionService.js
import { db } from "../firebase";
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { estimateXP } from "../config/xpConfig";

// Create a new session object
export const createSession = (durationMinutes, isBreak = false, goalId = null) => ({
  sessionId: uuidv4(),
  startAt: new Date().toISOString(),
  endAt: null,
  durationMinutes,
  completed: false,
  xpGained: 0,
  interrupted: false,
  isBreak,
  goalId,
  type: isBreak ? "break" : "work",
  // The estimatedXP is calculated client-side for immediate UI feedback.
  // The final xpGained will be calculated and validated by a Cloud Function.
  estimatedXP: estimateXP({
    minutes: durationMinutes,
    isBreak: isBreak,
    // These are placeholders/defaults. Real values would be needed for a more accurate estimate.
    taskCompleted: false, 
    currentStreak: 0,
    recentShortSessionsCount: 0,
    recentWorkMinutes: 60,
    recentBreakMinutes: 15,
  })
});

// Add a new session to Firestore
export const addSession = async (uid, session) => {
  if (!uid) {
    console.error("addSession called without a UID.");
    return null;
  }
  try {
    const sessionRef = await addDoc(collection(db, "users", uid, "sessions"), {
      ...session,
      createdAt: serverTimestamp(),
    });
    return { ...session, id: sessionRef.id };
  } catch (error) {
    console.error("Error adding session to Firestore:", error);
    return null;
  }
};


// Complete a session
export const completeSession = async (uid, session, actualDurationMinutes) => {
    if (!uid || !session || !session.id) {
        console.error("completeSession called with invalid arguments.");
        return;
    }
    const sessionRef = doc(db, "users", uid, "sessions", session.id);
    await updateDoc(sessionRef, {
        endAt: new Date().toISOString(),
        completed: true,
        interrupted: false,
        actualDurationMinutes: actualDurationMinutes,
    });
};

// Interrupt a session
export const interruptSession = async (uid, session, actualDurationMinutes) => {
    if (!uid || !session || !session.id) {
        console.error("interruptSession called with invalid arguments.");
        return;
    }
    const sessionRef = doc(db, "users", uid, "sessions", session.id);
    await updateDoc(sessionRef, {
        endAt: new Date().toISOString(),
        completed: false,
        interrupted: true,
        actualDurationMinutes: actualDurationMinutes,
    });
};

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