// client/src/utils/traitUtils.js
import { TRAITS } from "../config/traits";

/**
 * Apply trait bonuses to XP based on session context
 * @param {number} baseXP - Base XP amount
 * @param {Array} traitIds - Array of trait IDs equipped to the current bean
 * @param {Object} context - Session context
 * @param {boolean} context.isBreak - Whether this is a break session
 * @param {string} context.goalCategory - Category of the selected goal (if any)
 * @param {number} context.durationMinutes - Session duration in minutes
 * @returns {Object} { finalXP, appliedTraits, multiplier }
 */
export function applyTraitBonuses(baseXP, traitIds = [], context = {}) {
  if (!traitIds || traitIds.length === 0) {
    return {
      finalXP: baseXP,
      appliedTraits: [],
      multiplier: 1,
    };
  }

  const { isBreak = false, goalCategory = null, durationMinutes = 0 } = context;
  let multiplier = 1;
  const appliedTraits = [];

  for (const traitId of traitIds) {
    const trait = TRAITS[traitId];
    if (!trait) continue;

    let shouldApply = false;

    // Determine if trait applies to this session
    switch (trait.type) {
      case "global":
        shouldApply = true;
        break;
      case "work":
        shouldApply = !isBreak;
        break;
      case "break":
        shouldApply = isBreak;
        break;
      case "creative":
      case "study":
        shouldApply =
          !isBreak && goalCategory && goalCategory.toLowerCase() === trait.type;
        break;
      case "short-session":
        shouldApply = !isBreak && durationMinutes > 0 && durationMinutes < 15;
        break;
      case "long-session":
        shouldApply = !isBreak && durationMinutes >= 45;
        break;
      default:
        shouldApply = false;
    }

    if (shouldApply) {
      multiplier *= trait.multiplier;
      appliedTraits.push({
        id: traitId,
        name: trait.name,
        multiplier: trait.multiplier,
        type: trait.type,
      });
    }
  }

  // Cap multiplier to prevent excessive bonuses
  const cappedMultiplier = Math.min(multiplier, 2.5);
  const finalXP = Math.round(baseXP * cappedMultiplier);

  return {
    finalXP,
    appliedTraits,
    multiplier: cappedMultiplier,
  };
}

/**
 * Get a description of active trait bonuses for display
 */
export function getTraitBonusDescription(appliedTraits) {
  if (!appliedTraits || appliedTraits.length === 0) {
    return null;
  }

  if (appliedTraits.length === 1) {
    const trait = appliedTraits[0];
    const bonus = Math.round((trait.multiplier - 1) * 100);
    return `${trait.name} +${bonus}%`;
  }

  const totalBonus = appliedTraits.reduce(
    (acc, trait) => acc * trait.multiplier,
    1,
  );
  const bonusPercent = Math.round((totalBonus - 1) * 100);
  return `Multiple traits +${bonusPercent}%`;
}
