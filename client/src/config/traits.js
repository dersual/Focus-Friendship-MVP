// client/src/config/traits.js
export const TRAITS = {
  "focus-boost": {
    id: "focus-boost",
    name: "Focus Boost",
    description: "+20% XP for work sessions",
    type: "work",
    multiplier: 1.2,
    cost: 1000,
    unlockLevel: 5,
    emoji: "🎯",
  },
  "creative-spark": {
    id: "creative-spark",
    name: "Creative Spark",
    description: "+30% XP for creative tasks",
    type: "creative",
    multiplier: 1.3,
    cost: 1500,
    unlockLevel: 10,
    emoji: "🎨",
  },
  "study-buddy": {
    id: "study-buddy",
    name: "Study Buddy",
    description: "+25% XP for study sessions",
    type: "study",
    multiplier: 1.25,
    cost: 1200,
    unlockLevel: 7,
    emoji: "📚",
  },
  "zen-master": {
    id: "zen-master",
    name: "Zen Master",
    description: "+15% XP for all sessions",
    type: "global",
    multiplier: 1.15,
    cost: 2000,
    unlockLevel: 12,
    emoji: "🧘‍♂️",
  },
  "speed-demon": {
    id: "speed-demon",
    name: "Speed Demon",
    description: "+10% XP for short sessions (under 15min)",
    type: "short-session",
    multiplier: 1.1,
    cost: 800,
    unlockLevel: 4,
    emoji: "⚡",
  },
  "marathon-runner": {
    id: "marathon-runner",
    name: "Marathon Runner",
    description: "+35% XP for long sessions (over 45min)",
    type: "long-session",
    multiplier: 1.35,
    cost: 1800,
    unlockLevel: 15,
    emoji: "🏃‍♂️",
  },
};

// Helper functions
export const getTraitById = (traitId) => TRAITS[traitId];

export const getAvailableTraits = (userLevel, userXP) => {
  return Object.values(TRAITS).filter(
    (trait) => trait.unlockLevel <= userLevel,
  );
};

export const getAffordableTraits = (userLevel, userXP) => {
  return getAvailableTraits(userLevel, userXP).filter(
    (trait) => trait.cost <= userXP,
  );
};
