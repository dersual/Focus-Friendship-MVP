// client/src/stores/appStore.js
import { create } from "zustand";
import {
  getUserState,
  initializeUserState,
  addXP as addXPService,
  applyPenalty as applyPenaltyService,
} from "../services/xpService";
import * as goalService from "../services/goalService";
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

  // Shop state
  shop: {
    isOpen: false,
    ownedBeans: ["bean-0"], // default bean
    selectedBean: "bean-0",
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
