// client/src/services/petService.js

const PETS_KEY = 'ffm:pets';
const SELECTED_PET_KEY = 'ffm:selectedPet';

// Pet types with their characteristics
export const PET_TYPES = {
  'bean-0': {
    name: 'Focus Sprout',
    emoji: '🌱',
    description: 'A gentle companion that grows with your focus',
    unlockCost: 0,
    specialty: 'general',
    evolutionStages: [
      { level: 1, name: 'Tiny Sprout', emoji: '🌱' },
      { level: 5, name: 'Growing Sprout', emoji: '🌿' },
      { level: 10, name: 'Young Plant', emoji: '🪴' },
      { level: 20, name: 'Blooming Plant', emoji: '🌸' },
      { level: 30, name: 'Wise Tree', emoji: '🌳' },
    ]
  },
  'bean-1': {
    name: 'Study Buddy',
    emoji: '📚',
    description: 'Perfect for studying and learning sessions',
    unlockCost: 500,
    specialty: 'study',
    xpBonus: 1.1, // 10% bonus for study-related tasks
    evolutionStages: [
      { level: 1, name: 'Curious Owl', emoji: '🦉' },
      { level: 5, name: 'Book Worm', emoji: '📖' },
      { level: 10, name: 'Scholar', emoji: '🎓' },
      { level: 20, name: 'Professor', emoji: '👨‍🏫' },
      { level: 30, name: 'Sage', emoji: '🧙‍♂️' },
    ]
  },
  'bean-2': {
    name: 'Work Warrior',
    emoji: '💼',
    description: 'Boosts productivity during work sessions',
    unlockCost: 1000,
    specialty: 'work',
    xpBonus: 1.15, // 15% bonus for work-related tasks
    evolutionStages: [
      { level: 1, name: 'Busy Bee', emoji: '🐝' },
      { level: 5, name: 'Worker Ant', emoji: '🐜' },
      { level: 10, name: 'Executive', emoji: '👔' },
      { level: 20, name: 'CEO', emoji: '🏆' },
      { level: 30, name: 'Business Mogul', emoji: '💎' },
    ]
  },
  'bean-3': {
    name: 'Creative Muse',
    emoji: '🎨',
    description: 'Inspires creativity and artistic pursuits',
    unlockCost: 1500,
    specialty: 'creative',
    xpBonus: 1.2, // 20% bonus for creative tasks
    evolutionStages: [
      { level: 1, name: 'Doodle Duck', emoji: '🦆' },
      { level: 5, name: 'Artist Cat', emoji: '🐱' },
      { level: 10, name: 'Painter', emoji: '🎨' },
      { level: 20, name: 'Master Artist', emoji: '🖼️' },
      { level: 30, name: 'Creative Genius', emoji: '✨' },
    ]
  },
  'bean-4': {
    name: 'Zen Master',
    emoji: '🧘',
    description: 'Promotes mindfulness and meditation',
    unlockCost: 2000,
    specialty: 'mindfulness',
    xpBonus: 1.1, // 10% bonus + stress reduction
    evolutionStages: [
      { level: 1, name: 'Peaceful Pebble', emoji: '🪨' },
      { level: 5, name: 'Calm Lotus', emoji: '🪷' },
      { level: 10, name: 'Meditation Monk', emoji: '🧘‍♂️' },
      { level: 20, name: 'Zen Master', emoji: '☯️' },
      { level: 30, name: 'Enlightened One', emoji: '🌟' },
    ]
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

// Load all pets from localStorage
export const getAllPets = () => {
  try {
    const stored = localStorage.getItem(PETS_KEY);
    const pets = stored ? JSON.parse(stored) : {};
    
    // Ensure default pet exists
    if (!pets['bean-0']) {
      pets['bean-0'] = createPet('bean-0');
    }
    
    return pets;
  } catch (error) {
    console.error("Error loading pets:", error);
    return { 'bean-0': createPet('bean-0') };
  }
};

// Save pets to localStorage
export const savePets = (pets) => {
  try {
    localStorage.setItem(PETS_KEY, JSON.stringify(pets));
  } catch (error) {
    console.error("Error saving pets:", error);
  }
};

// Get currently selected pet ID
export const getSelectedPetId = () => {
  try {
    return localStorage.getItem(SELECTED_PET_KEY) || 'bean-0';
  } catch (error) {
    console.error("Error loading selected pet:", error);
    return 'bean-0';
  }
};

// Set selected pet ID
export const setSelectedPetId = (petId) => {
  try {
    localStorage.setItem(SELECTED_PET_KEY, petId);
  } catch (error) {
    console.error("Error saving selected pet:", error);
  }
};

// Get selected pet data
export const getSelectedPet = () => {
  const pets = getAllPets();
  const selectedId = getSelectedPetId();
  return pets[selectedId] || pets['bean-0'];
};

// Create default pet (Focus Sprout)
export const createDefaultPet = () => {
  const defaultPetId = 'focus-sprout-0';
  const defaultPet = {
    id: defaultPetId,
    type: 'focus-sprout',
    xp: 0,
    level: 1,
    totalSessions: 0,
    unlockedAt: Date.now()
  };
  
  // Save to localStorage
  const pets = getAllPets();
  pets[defaultPetId] = defaultPet;
  savePets(pets);
  
  // Set as selected
  setSelectedPetId(defaultPetId);
  
  return defaultPet;
};

// Calculate pet level from XP
export const calculatePetLevel = (xp) => {
  // Similar to user level calculation but slightly different curve
  let level = 1;
  let totalXpNeeded = 0;
  
  while (totalXpNeeded <= xp) {
    totalXpNeeded += Math.round(50 * (1.2 ** level));
    level++;
  }
  
  return Math.max(1, level - 1);
};

// Get XP needed for next level
export const getXPForNextLevel = (currentLevel) => {
  return Math.round(50 * (1.2 ** (currentLevel + 1)));
};

// Add XP to a specific pet
export const addXPToPet = (petId, xpAmount) => {
  const pets = getAllPets();
  
  if (!pets[petId]) {
    console.error(`Pet ${petId} not found`);
    return null;
  }
  
  const pet = pets[petId];
  const oldLevel = pet.level;
  
  pet.xp += xpAmount;
  pet.level = calculatePetLevel(pet.xp);
  pet.totalSessions += 1;
  
  savePets(pets);
  
  const leveledUp = pet.level > oldLevel;
  
  return {
    pet,
    leveledUp,
    newLevel: pet.level,
    oldLevel,
  };
};

// Unlock a new pet
export const unlockPet = (petType, cost) => {
  const pets = getAllPets();
  
  if (pets[petType]) {
    console.warn(`Pet ${petType} already unlocked`);
    return false;
  }
  
  if (!PET_TYPES[petType]) {
    console.error(`Unknown pet type: ${petType}`);
    return false;
  }
  
  pets[petType] = createPet(petType);
  savePets(pets);
  
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
  const currentIndex = stages.findIndex(s => s.level === currentStage.level);
  
  if (currentIndex < stages.length - 1) {
    return stages[currentIndex + 1];
  }
  
  return null; // Max level reached
};

// Get pets that can be unlocked with current XP
export const getUnlockablePets = (userXP) => {
  const pets = getAllPets();
  const unlockable = [];
  
  Object.entries(PET_TYPES).forEach(([petType, config]) => {
    if (!pets[petType] && userXP >= config.unlockCost) {
      unlockable.push({
        ...config,
        id: petType,
        canAfford: true,
      });
    } else if (!pets[petType]) {
      unlockable.push({
        ...config,
        id: petType,
        canAfford: false,
      });
    }
  });
  
  return unlockable.sort((a, b) => a.unlockCost - b.unlockCost);
};