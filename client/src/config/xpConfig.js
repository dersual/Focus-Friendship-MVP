// client/src/config/xpConfig.js
export const XP_CONFIG = {
  // Anti-farming settings
  strictness: "balanced", // "lenient", "balanced", "strict"
  minEffectiveMinutes: 5, // Sessions below this get diminished XP
  shortSessionDiminishK: 3, // Controls diminishing returns curve
  shortSessionWindowMinutes: 60, // Window to count short sessions
  shortSessionCapPerWindow: 6, // Max short sessions before heavy penalty

  // XP calculation
  baseXpPerMinute: 10, // Base XP = minutes * this
  taskCompletionMultiplier: 2.0, // Extra reward for completing tasks
  streakBonusEnabled: true,
  maxStreakBonus: 0.5, // Max +50% bonus from streak
  streakDivisor: 20, // Streak bonus = currentStreak / this

  // Work-to-break ratio bonus
  workBreakRatioEnabled: true,
  idealWorkBreakRatio: 4, // Ideal 25:5 = 5:1 ratio, but we use 4 for practical purposes
  maxRatioBonus: 0.2, // Max +20% bonus for good work/break balance

  // Pet system
  petXpRatio: 0.5, // Pet gets 50% of user XP

  // Session limits
  workMinMaxMinutes: [1, 120],
  breakMinMaxMinutes: [1, 60],

  // System flags
  serverSync: true,
  penaltiesEnabled: true,
  shopCurrency: "xp",
  supplyAssets: true,

  // Penalties
  manualStopPenalty: 10, // XP lost for stopping early

  // Tolerance for time validation (±20%)
  timeTolerance: 0.2,
};

// Helper function to clamp values
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Compute effective minutes with diminishing returns for short sessions
export const computeEffectiveMinutes = (minutes) => {
  if (minutes < XP_CONFIG.minEffectiveMinutes) {
    const effectiveFactor =
      minutes / (minutes + XP_CONFIG.shortSessionDiminishK);
    return minutes * effectiveFactor;
  }
  return minutes;
};

// Compute short session penalty multiplier
export const computeShortSessionPenalty = (recentShortSessionsCount) => {
  const S = recentShortSessionsCount;
  let penalty = 1 / (1 + Math.max(0, S - 1) * 0.5);

  if (S > XP_CONFIG.shortSessionCapPerWindow) {
    penalty *= 0.2; // Heavy penalty cap
  }

  return penalty;
};

// Compute streak bonus
export const computeStreakBonus = (currentStreak) => {
  if (!XP_CONFIG.streakBonusEnabled) return 1;
  const bonus = clamp(
    currentStreak / XP_CONFIG.streakDivisor,
    0,
    XP_CONFIG.maxStreakBonus,
  );
  return 1 + bonus;
};

// Compute work-to-break ratio bonus
export const computeWorkBreakRatioBonus = (
  recentWorkMinutes,
  recentBreakMinutes,
) => {
  if (!XP_CONFIG.workBreakRatioEnabled || recentBreakMinutes === 0) return 1;

  const actualRatio = recentWorkMinutes / recentBreakMinutes;
  const idealRatio = XP_CONFIG.idealWorkBreakRatio;

  // Calculate how close we are to the ideal ratio (1.0 = perfect, 0.0 = terrible)
  const ratioScore = Math.max(
    0,
    1 - Math.abs(actualRatio - idealRatio) / idealRatio,
  );

  // Apply bonus based on ratio score
  const bonus = ratioScore * XP_CONFIG.maxRatioBonus;
  return 1 + bonus;
};

// Main estimation function (client-side preview)
export const estimateXP = ({
  minutes,
  isBreak = false,
  taskCompleted = false,
  currentStreak = 0,
  recentShortSessionsCount = 0,
  recentWorkMinutes = 0,
  recentBreakMinutes = 0,
}) => {
  if (isBreak || minutes <= 0) return 0;

  const baseXP = Math.round(minutes * XP_CONFIG.baseXpPerMinute);
  const effectiveMinutes = computeEffectiveMinutes(minutes);
  const shortPenalty = computeShortSessionPenalty(recentShortSessionsCount);
  const taskMultiplier = taskCompleted ? XP_CONFIG.taskCompletionMultiplier : 1;
  const streakBonus = computeStreakBonus(currentStreak);
  const ratioBonus = computeWorkBreakRatioBonus(
    recentWorkMinutes,
    recentBreakMinutes,
  );

  const estimatedXP = Math.round(
    baseXP *
      (effectiveMinutes / minutes) *
      shortPenalty *
      taskMultiplier *
      streakBonus *
      ratioBonus,
  );

  return Math.max(0, estimatedXP);
};

// Estimate pet XP
export const estimatePetXP = (userXP) => {
  return Math.floor(userXP * XP_CONFIG.petXpRatio);
};
