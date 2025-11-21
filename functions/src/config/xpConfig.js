const XP_CONFIG = {
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
  idealWorkBreakRatio: 4, // Ideal 25:5 = 5:1 ratio, but we
  // use 4 for practical purposes
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
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Compute effective minutes with diminishing returns for short sessions
const computeEffectiveMinutes = (minutes) => {
  if (minutes < XP_CONFIG.minEffectiveMinutes) {
    const effectiveFactor =
      minutes / (minutes + XP_CONFIG.shortSessionDiminishK);
    return minutes * effectiveFactor;
  }
  return minutes;
};

// Compute short session penalty multiplier
const computeShortSessionPenalty = (recentShortSessionsCount) => {
  const S = recentShortSessionsCount;
  let penalty = 1 / (1 + Math.max(0, S - 1) * 0.5);

  if (S > XP_CONFIG.shortSessionCapPerWindow) {
    penalty *= 0.2; // Heavy penalty cap
  }

  return penalty;
};

// Compute streak bonus
const computeStreakBonus = (currentStreak) => {
  if (!XP_CONFIG.streakBonusEnabled) return 1;
  const bonus = clamp(
      currentStreak / XP_CONFIG.streakDivisor,
      0,
      XP_CONFIG.maxStreakBonus,
  );
  return 1 + bonus;
};

// Compute work-to-break ratio bonus
const computeWorkBreakRatioBonus = (recentWorkMinutes, recentBreakMinutes) => {
  if (!XP_CONFIG.workBreakRatioEnabled || recentBreakMinutes === 0) return 1;

  const actualRatio = recentWorkMinutes / recentBreakMinutes;
  const idealRatio = XP_CONFIG.idealWorkBreakRatio;

  // Calculate how close we are to the ideal ratio
  // (1.0 = perfect, 0.0 = terrible)
  const ratioScore = Math.max(
      0,
      1 - Math.abs(actualRatio - idealRatio) / idealRatio,
  );

  // Apply bonus based on ratio score
  const bonus = ratioScore * XP_CONFIG.maxRatioBonus;
  return 1 + bonus;
};

// Server-side authoritative XP calculation
const computeAward = ({
  minutes,
  isBreak = false,
  taskCompleted = false,
  currentStreak = 0,
  recentShortSessionsCount = 0,
  recentWorkMinutes = 0,
  recentBreakMinutes = 0,
  user = {},
}) => {
  if (isBreak || minutes <= 0) {
    return {
      awardedXP: 0,
      petXP: 0,
      breakdown: {
        baseXP: 0,
        effectiveMinutes: 0,
        shortPenalty: 1,
        taskMultiplier: 1,
        streakBonus: 1,
        ratioBonus: 1,
      },
    };
  }

  const baseXP = Math.round(minutes * XP_CONFIG.baseXpPerMinute);
  const effectiveMinutes = computeEffectiveMinutes(minutes);
  const shortPenalty = computeShortSessionPenalty(recentShortSessionsCount);
  const taskMultiplier = taskCompleted ? XP_CONFIG.taskCompletionMultiplier : 1;
  const streakBonus = computeStreakBonus(currentStreak);
  const ratioBonus = computeWorkBreakRatioBonus(
      recentWorkMinutes,
      recentBreakMinutes,
  );

  const awardedXP = Math.round(
      baseXP *
      (effectiveMinutes / minutes) *
      shortPenalty *
      taskMultiplier *
      streakBonus *
      ratioBonus,
  );

  const petXP = Math.floor(awardedXP * XP_CONFIG.petXpRatio);

  return {
    awardedXP: Math.max(0, awardedXP),
    petXP: Math.max(0, petXP),
    breakdown: {
      baseXP,
      effectiveMinutes,
      shortPenalty,
      taskMultiplier,
      streakBonus,
      ratioBonus,
      finalXP: awardedXP,
    },
  };
};

// Count recent short sessions for a user
const countRecentShortSessions = (
    userSessions,
    windowMinutes = XP_CONFIG.shortSessionWindowMinutes,
) => {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const cutoff = now - windowMs;

  return userSessions.filter(
      (session) =>
        session.startAt >= cutoff &&
      session.durationMinutes < XP_CONFIG.minEffectiveMinutes &&
      !session.isBreak,
  ).length;
};

// Calculates XP needed for the next level (User XP)
const expToNext = (level) => {
  return Math.round(100 * 1.25 ** level);
};

// Calculates pet level from XP
const calculatePetLevel = (xp) => {
  let level = 1;
  let totalXpNeeded = 0;

  while (totalXpNeeded <= xp) {
    totalXpNeeded += Math.round(50 * 1.2 ** level);
    level++;
  }

  return Math.max(1, level - 1);
};

module.exports = {
  XP_CONFIG,
  clamp,
  computeEffectiveMinutes,
  computeShortSessionPenalty,
  computeStreakBonus,
  computeAward,
  countRecentShortSessions,
  expToNext,
  calculatePetLevel,
};
