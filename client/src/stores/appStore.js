// client/src/stores/appStore.js
import { create } from "zustand";
import {
  getUserState,
  initializeUserState,
  addXP as addXPService,
  applyPenalty as applyPenaltyService,
} from "../services/xpService";
import * as goalService from "../services/goalService";
import * as petService from "../services/petService";
import { enqueueForSync } from "../services/syncService";

const useAppStore = create((set, get) => ({
  // User state
  user: getUserState(),

  // Timer state
  timer: {
    isActive: false,
    isPaused: false,
    timeLeft: 0,
    workDuration: 25, // minutes
    breakDuration: 5, // minutes
    isBreakTime: false,
    selectedGoal: "",
  },

  // Goals state
  goals: goalService.getActiveGoals(),

  // Pet state
  pets: petService.getAllPets(),
  selectedPet: petService.getSelectedPet(),

  // Shop state
  shop: {
    isOpen: false,
    ownedBeans: ["bean-0"], // legacy - kept for compatibility
    selectedBean: "bean-0", // legacy - kept for compatibility
  },

  // UI state
  ui: {
    showBottomNav: true,
    currentPage: "timer",
  },

  // Actions
  initializeApp: () => {
    initializeUserState();
    set({ user: getUserState() });
    
    // Initialize pets
    get().refreshPets();
    
    // Set default pet if none selected
    const selectedPetId = petService.getSelectedPetId();
    const pets = petService.getAllPets();
    if (pets[selectedPetId]) {
      set({ selectedPet: pets[selectedPetId] });
    } else {
      // Create and select default pet if none exists
      const defaultPet = petService.createDefaultPet();
      set({ 
        pets: { [defaultPet.id]: defaultPet },
        selectedPet: defaultPet 
      });
    }
  },

  // User actions
  addXP: (amount, options = {}) => {
    const { newState, levelUp } = addXPService(amount);
    set({ user: newState });

    if (levelUp && options.onLevelUp) {
      options.onLevelUp(newState);
    }

    return { newState, levelUp };
  },

  applyPenalty: (penaltyData) => {
    const { newState } = applyPenaltyService(penaltyData);
    set({ user: newState });
    return newState;
  },

  // Timer actions
  setWorkDuration: (minutes) => {
    set((state) => ({
      timer: {
        ...state.timer,
        workDuration: Math.max(1, Math.min(120, minutes)),
      },
    }));
  },

  setBreakDuration: (minutes) => {
    set((state) => ({
      timer: {
        ...state.timer,
        breakDuration: Math.max(1, Math.min(60, minutes)),
      },
    }));
  },

  setSelectedGoal: (goalId) => {
    set((state) => ({
      timer: { ...state.timer, selectedGoal: goalId },
    }));
  },

  startTimer: (isBreak = false) => {
    const state = get();
    const duration = isBreak
      ? state.timer.breakDuration
      : state.timer.workDuration;

    set((state) => ({
      timer: {
        ...state.timer,
        isActive: true,
        isPaused: false,
        timeLeft: duration * 60,
        isBreakTime: isBreak,
      },
    }));
  },

  pauseTimer: () => {
    set((state) => ({
      timer: { ...state.timer, isPaused: true },
    }));
  },

  resumeTimer: () => {
    set((state) => ({
      timer: { ...state.timer, isPaused: false },
    }));
  },

  stopTimer: () => {
    set((state) => ({
      timer: {
        ...state.timer,
        isActive: false,
        isPaused: false,
        timeLeft: 0,
      },
    }));
  },

  updateTimeLeft: (timeLeft) => {
    set((state) => ({
      timer: { ...state.timer, timeLeft: Math.max(0, timeLeft) },
    }));
  },

  completeTimer: () => {
    const state = get();
    const { timer, user } = state;

    if (!timer.isBreakTime) {
      // Work session completed
      const xpGained = timer.workDuration * 10;
      const { newState, levelUp } = get().addXP(xpGained);

      // Update goal progress
      if (timer.selectedGoal) {
        const newGoals = goalService.completePomodoroForGoal(
          parseInt(timer.selectedGoal, 10),
        );
        set({
          goals: newGoals.filter((g) => g.completedPomodoros < g.pomodoros),
        });
      }

      // Log session
      enqueueForSync("session", {
        sessionId: Date.now(),
        startAt: new Date(
          Date.now() - timer.workDuration * 60 * 1000,
        ).toISOString(),
        endAt: new Date().toISOString(),
        durationSec: timer.workDuration * 60,
        completed: true,
        xpGained,
        interrupted: false,
        penaltyApplied: false,
        goalId: timer.selectedGoal,
      });
      enqueueForSync("user", newState);
    }

    // Reset timer
    get().stopTimer();
  },

  // Goal actions
  refreshGoals: () => {
    set({ goals: goalService.getActiveGoals() });
  },

  completePomodoroForGoal: (goalId) => {
    const updatedGoals = goalService.completePomodoroForGoal(
      parseInt(goalId, 10),
    );
    set({
      goals: updatedGoals.filter((g) => g.completedPomodoros < g.pomodoros),
    });
  },

  // Pet actions
  selectPet: (petId) => {
    petService.setSelectedPetId(petId);
    set({ 
      selectedPet: petService.getSelectedPet(),
    });
  },

  addXPToPet: (petId, xpAmount) => {
    const result = petService.addXPToPet(petId, xpAmount);
    if (result) {
      set({ 
        pets: petService.getAllPets(),
        selectedPet: petService.getSelectedPet(),
      });
      return result;
    }
    return null;
  },

  unlockPet: (petType, cost) => {
    const state = get();
    const petConfig = petService.PET_TYPES[petType];
    
    if (!petConfig) return false;
    
    if (state.user.xp >= cost) {
      // Deduct XP
      const { newState } = get().addXP(-cost);
      
      // Unlock pet
      const success = petService.unlockPet(petType, cost);
      if (success) {
        set({ 
          pets: petService.getAllPets(),
          user: newState,
        });
      }
      return success;
    }
    return false;
  },

  refreshPets: () => {
    set({ 
      pets: petService.getAllPets(),
      selectedPet: petService.getSelectedPet(),
    });
  },

  // Shop actions
  toggleShop: () => {
    set((state) => ({
      shop: { ...state.shop, isOpen: !state.shop.isOpen },
    }));
  },

  buyBean: (beanId, cost) => {
    const state = get();
    if (state.user.xp >= cost && !state.shop.ownedBeans.includes(beanId)) {
      // Deduct XP
      const newXP = state.user.xp - cost;
      set((state) => ({
        user: { ...state.user, xp: newXP },
        shop: {
          ...state.shop,
          ownedBeans: [...state.shop.ownedBeans, beanId],
        },
      }));
      return true;
    }
    return false;
  },

  selectBean: (beanId) => {
    set((state) => ({
      shop: { ...state.shop, selectedBean: beanId },
    }));
  },

  // UI actions
  setCurrentPage: (page) => {
    set((state) => ({
      ui: { ...state.ui, currentPage: page },
    }));
  },
}));

export default useAppStore;
