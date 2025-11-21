// client/src/services/xpService.js

import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const initialState = {
  xp: 0,
  level: 1,
  totalSessions: 0,
  currentStreak: 0,
  penaltiesEnabled: true, // Always enabled, cannot be disabled
};

// Calculates XP needed for the next level
export const expToNext = (level) => {
  return Math.round(100 * 1.25 ** level);
};

// Loads user state from Firestore or returns initial state, creating it if necessary
export const getUserState = async (uid) => {
  if (!uid) {
    console.error("getUserState called without a UID.");
    return initialState;
  }

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { ...initialState, ...userSnap.data() };
  } else {
    // Document does not exist, create it with initial state
    await setDoc(userRef, initialState);
    return initialState;
  }
};

// Adds XP and handles leveling up
export const addXP = async (uid, baseXPGained) => {
  if (!uid) {
    console.error("addXP called without a UID.");
    return { newState: initialState, levelUp: false };
  }

  let state = await getUserState(uid); // Use the new async getUserState

  // Calculate streak bonus (5% per streak count)
  const bonusMultiplier = 1 + state.currentStreak * 0.05;
  const totalXPGained = Math.round(baseXPGained * bonusMultiplier);

  console.log(
    `Base XP: ${baseXPGained}, Streak: ${state.currentStreak}, Bonus: ${bonusMultiplier.toFixed(2)}x, Total Gained: ${totalXPGained}`,
  );

  state.xp += totalXPGained;
  state.totalSessions += 1;
  state.currentStreak += 1; // Increment streak after successful session

  let levelUp = false;
  while (state.xp >= expToNext(state.level)) {
    state.xp -= expToNext(state.level);
    state.level += 1;
    levelUp = true;
    console.log(`Leveled up to level ${state.level}!`);
  }

  // Persist state to Firestore
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, state); // Update the user document in Firestore

  return { newState: state, levelUp };
};

// Applies a penalty to XP and resets streak
export const applyPenalty = async (uid, { type, amount = 10 }) => {
  if (!uid) {
    console.error("applyPenalty called without a UID.");
    return { newState: initialState };
  }

  let state = await getUserState(uid); // Use the new async getUserState
  // Penalties are always enabled
  state.xp = Math.max(0, state.xp - amount);
  state.currentStreak = 0; // Reset streak on penalty
  console.log(
    `Penalty applied (${type}): -${amount} XP. Streak reset. Current XP: ${state.xp}`,
  );

  // Persist state to Firestore
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, state); // Update the user document in Firestore

  return { newState: state };
};
