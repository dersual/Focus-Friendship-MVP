// client/src/services/petService.js

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
} from "firebase/firestore";

// Pet types with their characteristics
export const PET_TYPES = {
  "bean-0": {
    name: "Focus Sprout",
    emoji: "🌱",
    description: "A gentle companion that grows with your focus",
    unlockCost: 0,
    specialty: "general",
    evolutionStages: [
      { level: 1, name: "Tiny Sprout", emoji: "🌱" },
      { level: 5, name: "Growing Sprout", emoji: "🌿" },
      { level: 10, name: "Young Plant", emoji: "🪴" },
      { level: 20, name: "Blooming Plant", emoji: "🌸" },
      { level: 30, name: "Wise Tree", emoji: "🌳" },
    ],
  },
  "bean-1": {
    name: "Study Buddy",
    emoji: "📚",
    description: "Perfect for studying and learning sessions",
    unlockCost: 500,
    specialty: "study",
    xpBonus: 1.1, // 10% bonus for study-related tasks
    evolutionStages: [
      { level: 1, name: "Curious Owl", emoji: "🦉" },
      { level: 5, name: "Book Worm", emoji: "📖" },
      { level: 10, name: "Scholar", emoji: "🎓" },
      { level: 20, name: "Professor", emoji: "👨‍🏫" },
      { level: 30, name: "Sage", emoji: "🧙‍♂️" },
    ],
  },
  "bean-2": {
    name: "Work Warrior",
    emoji: "💼",
    description: "Boosts productivity during work sessions",
    unlockCost: 1000,
    specialty: "work",
    xpBonus: 1.15, // 15% bonus for work-related tasks
    evolutionStages: [
      { level: 1, name: "Busy Bee", emoji: "🐝" },
      { level: 5, name: "Worker Ant", emoji: "🐜" },
      { level: 10, name: "Executive", emoji: "👔" },
      { level: 20, name: "CEO", emoji: "🏆" },
      { level: 30, name: "Business Mogul", emoji: "💎" },
    ],
  },
  "bean-3": {
    name: "Creative Muse",
    emoji: "🎨",
    description: "Inspires creativity and artistic pursuits",
    unlockCost: 1500,
    specialty: "creative",
    xpBonus: 1.2, // 20% bonus for creative tasks
    evolutionStages: [
      { level: 1, name: "Doodle Duck", emoji: "🦆" },
      { level: 5, name: "Artist Cat", emoji: "🐱" },
      { level: 10, name: "Painter", emoji: "🎨" },
      { level: 20, name: "Master Artist", emoji: "🖼️" },
      { level: 30, name: "Creative Genius", emoji: "✨" },
    ],
  },
  "bean-4": {
    name: "Zen Master",
    emoji: "🧘",
    description: "Promotes mindfulness and meditation",
    unlockCost: 2000,
    specialty: "mindfulness",
    xpBonus: 1.1, // 10% bonus + stress reduction
    evolutionStages: [
      { level: 1, name: "Peaceful Pebble", emoji: "🪨" },
      { level: 5, name: "Calm Lotus", emoji: "🪷" },
      { level: 10, name: "Meditation Monk", emoji: "🧘‍♂️" },
      { level: 20, name: "Zen Master", emoji: "☯️" },
      { level: 30, name: "Enlightened One", emoji: "🌟" },
    ],
  },
};

// Default pet data structure
const createPet = (petType) => ({
  id: petType,
  type: petType,
  xp: 0,
  level: 1,
  unlockedAt: new Date().toISOString(),
  totalSessions: 0,
  favoriteTaskType: null,
});

// Load all pets from Firestore for a given user
export const getAllPets = async (uid) => {
  if (!uid) {
    console.error("getAllPets called without a UID.");
    return {};
  }

  const petsRef = collection(db, "users", uid, "pets");
  const q = query(petsRef);
  const querySnapshot = await getDocs(q);

  let pets = {};
  querySnapshot.forEach((doc) => {
    pets[doc.id] = doc.data();
  });

  // Ensure default pet "bean-0" exists
  if (!pets["bean-0"]) {
    const defaultPet = createPet("bean-0");
    await setDoc(doc(db, "users", uid, "pets", "bean-0"), defaultPet);
    pets["bean-0"] = defaultPet;
  }

  return pets;
};

// Get currently selected pet ID from user document in Firestore
export const getSelectedPetId = async (uid) => {
  if (!uid) {
    console.error("getSelectedPetId called without a UID.");
    return "bean-0";
  }

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists() && userSnap.data().selectedPet) {
    return userSnap.data().selectedPet;
  } else {
    // If not found, set default and update user doc
    await updateDoc(userRef, { selectedPet: "bean-0" });
    return "bean-0";
  }
};

// Set selected pet ID in user document in Firestore
export const setSelectedPetId = async (uid, petId) => {
  if (!uid) {
    console.error("setSelectedPetId called without a UID.");
    return;
  }
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { selectedPet: petId });
};

// Get selected pet data
export const getSelectedPet = async (uid) => {
  if (!uid) {
    console.error("getSelectedPet called without a UID.");
    return null; // Or some default empty pet object
  }
  const pets = await getAllPets(uid);
  const selectedId = await getSelectedPetId(uid);
  return pets[selectedId] || pets["bean-0"] || null; // Return null if no default pet either
};

// Create default pet (Focus Sprout) for a user in Firestore
export const createDefaultPet = async (uid) => {
  if (!uid) {
    console.error("createDefaultPet called without a UID.");
    return null;
  }

  const defaultPetId = "bean-0"; // Assuming "bean-0" is the default type and ID
  const defaultPet = createPet(defaultPetId); // Use the existing createPet helper

  // Save to Firestore subcollection
  await setDoc(doc(db, "users", uid, "pets", defaultPetId), defaultPet);

  // Set as selected in user's main document
  await setSelectedPetId(uid, defaultPetId);

  return defaultPet;
};

// Calculate pet level from XP
export const calculatePetLevel = (xp) => {
  // Similar to user level calculation but slightly different curve
  let level = 1;
  let totalXpNeeded = 0;

  while (totalXpNeeded <= xp) {
    totalXpNeeded += Math.round(50 * 1.2 ** level);
    level++;
  }

  return Math.max(1, level - 1);
};

// Get XP needed for next level
export const getXPForNextLevel = (currentLevel) => {
  return Math.round(50 * 1.2 ** (currentLevel + 1));
};

// Add XP to a specific pet in Firestore
export const addXPToPet = async (uid, petId, xpAmount) => {
  if (!uid) {
    console.error("addXPToPet called without a UID.");
    return null;
  }

  const petRef = doc(db, "users", uid, "pets", petId);
  const petSnap = await getDoc(petRef);

  if (!petSnap.exists()) {
    console.error(`Pet ${petId} not found for user ${uid}`);
    return null;
  }

  const pet = petSnap.data();
  const oldLevel = pet.level;

  pet.xp += xpAmount;
  pet.level = calculatePetLevel(pet.xp);
  pet.totalSessions = (pet.totalSessions || 0) + 1; // Increment total sessions, handle initial undefined

  await updateDoc(petRef, pet); // Update the pet document in Firestore

  const leveledUp = pet.level > oldLevel;

  return {
    pet,
    leveledUp,
    newLevel: pet.level,
    oldLevel,
  };
};

// Unlock a new pet for a user in Firestore
export const unlockPet = async (uid, petType) => {
  if (!uid) {
    console.error("unlockPet called without a UID.");
    return false;
  }

  const petRef = doc(db, "users", uid, "pets", petType);
  const petSnap = await getDoc(petRef);

  if (petSnap.exists()) {
    console.warn(`Pet ${petType} already unlocked for user ${uid}`);
    return false;
  }

  if (!PET_TYPES[petType]) {
    console.error(`Unknown pet type: ${petType}`);
    return false;
  }

  const newPet = createPet(petType);
  await setDoc(petRef, newPet); // Save the new pet document to Firestore

  return true;
};

// Get current evolution stage for a pet
export const getPetEvolutionStage = (pet) => {
  const petType = PET_TYPES[pet.type];
  if (!petType) return null;

  const stages = petType.evolutionStages;
  let currentStage = stages[0];

  for (const stage of stages) {
    if (pet.level >= stage.level) {
      currentStage = stage;
    } else {
      break;
    }
  }

  return currentStage;
};

// Get next evolution stage for a pet
export const getNextEvolutionStage = (pet) => {
  const petType = PET_TYPES[pet.type];
  if (!petType) return null;

  const stages = petType.evolutionStages;
  const currentStage = getPetEvolutionStage(pet);
  const currentIndex = stages.findIndex((s) => s.level === currentStage.level);

  if (currentIndex < stages.length - 1) {
    return stages[currentIndex + 1];
  }

  return null; // Max level reached
};

// Get pets that can be unlocked with current XP for a user
export const getUnlockablePets = async (uid, userXP) => {
  if (!uid) {
    console.error("getUnlockablePets called without a UID.");
    return [];
  }

  const pets = await getAllPets(uid); // Get all pets for the user from Firestore
  const unlockable = [];

  Object.entries(PET_TYPES).forEach(([petType, config]) => {
    // Check if petType is already in the 'pets' object (meaning it's unlocked)
    if (!pets[petType]) {
      unlockable.push({
        ...config,
        id: petType,
        canAfford: userXP >= config.unlockCost,
      });
    }
  });

  return unlockable.sort((a, b) => a.unlockCost - b.unlockCost);
};
