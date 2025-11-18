// client/src/services/xpService.js

const USER_STATE_KEY = 'ffm:user';

const initialState = {
  xp: 0,
  level: 1,
  totalSessions: 0,
  currentStreak: 0,
  penaltiesEnabled: true, // Default to true
};

// Calculates XP needed for the next level
export const expToNext = (level) => {
  return Math.round(100 * (1.25 ** level));
};

// Loads user state from localStorage or returns initial state
export const getUserState = () => {
  try {
    const storedState = localStorage.getItem(USER_STATE_KEY);
    if (storedState) {
      return { ...initialState, ...JSON.parse(storedState) };
    }
  } catch (error) {
    console.error("Error loading user state from localStorage:", error);
  }
  return initialState;
};

// Persists user state to localStorage
const persistUserState = (state) => {
  try {
    localStorage.setItem(USER_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error persisting user state to localStorage:", error);
  }
};

// Adds XP and handles leveling up
export const addXP = (baseXPGained) => {
  let state = getUserState();
  
  // Calculate streak bonus (5% per streak count)
  const bonusMultiplier = 1 + (state.currentStreak * 0.05);
  const totalXPGained = Math.round(baseXPGained * bonusMultiplier);
  
  console.log(`Base XP: ${baseXPGained}, Streak: ${state.currentStreak}, Bonus: ${bonusMultiplier.toFixed(2)}x, Total Gained: ${totalXPGained}`);

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

  persistUserState(state);
  return { newState: state, levelUp };
};

// Applies a penalty to XP and resets streak
export const applyPenalty = ({ type, amount = 10 }) => {
  let state = getUserState();
  if (state.penaltiesEnabled) {
    state.xp = Math.max(0, state.xp - amount);
    state.currentStreak = 0; // Reset streak on penalty
    console.log(`Penalty applied (${type}): -${amount} XP. Streak reset. Current XP: ${state.xp}`);
    persistUserState(state);
  } else {
    console.log('Penalties are disabled. No XP deducted.');
  }
  return { newState: state };
};

// Toggles penalty setting
export const togglePenalties = () => {
  let state = getUserState();
  state.penaltiesEnabled = !state.penaltiesEnabled;
  persistUserState(state);
  return { newState: state };
};

// Initializes user state if not present
export const initializeUserState = () => {
  const state = getUserState();
  persistUserState(state);
  return state;
};