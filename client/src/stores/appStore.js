// client/src/stores/appStore.js
import { create } from "zustand";
import { auth, onAuthStateChanged, signIn, db } from "../firebase"; // Added db
import * as xpService from "../services/xpService";
import * as goalService from "../services/goalService";
import * as petService from "../services/petService";
import * as shopService from "../services/shopService";


const useAppStore = create((set, get) => ({
  // User state
  user: {},

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
  goals: [],

  // Pet state
  pets: {},
  selectedPet: null,

  // Shop state
  shop: {
    isOpen: false,
    ownedBeans: ["bean-0"], // legacy - kept for compatibility
    selectedBean: "bean-0", // legacy - kept for compatibility
    ownedTraits: [], // Array of owned trait IDs
    beanTraits: {}, // Object mapping bean IDs to equipped trait IDs: { "bean-1": ["focus-boost"], "bean-2": [] }
  },

  // UI state
  ui: {
    showBottomNav: true,
    currentPage: "timer",
  },

  // Actions
  initializeApp: () => {
    // Firebase Authentication
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        // User is signed in.
        console.log("Firebase User UID:", uid);

        // Load user state from Firestore using xpService
        const userState = await xpService.getUserState(uid);
        set((state) => ({ user: { uid, ...userState } }));

        // Load pets from Firestore
        await get().refreshPets(); // Calls refreshPets with the now available UID

        // Load goals from Firestore
        await get().refreshGoals(); // Calls refreshGoals with the now available UID

        // Load shop state from Firestore
        await get().refreshShop(); // Calls refreshShop with the now available UID
      } else {
        // No user is signed in, sign in anonymously.
        console.log("No Firebase user found, signing in anonymously...");
        try {
          const uid = await signIn();
          console.log("Anonymous sign-in successful. UID:", uid);

          // After anonymous sign-in, initialize user state and pets
          const userState = await xpService.getUserState(uid); // Will create if not exists
          set((state) => ({ user: { uid, ...userState } }));

          await get().refreshPets(); // Calls refreshPets with the now available UID

          // Load goals from Firestore for new user
          await get().refreshGoals(); // Calls refreshGoals with the now available UID

          // Initialize shop state for new user in Firestore
          await get().refreshShop(); // Calls refreshShop with the now available UID
        } catch (error) {
          console.error("Anonymous sign-in failed during app initialization:", error);
        }
      }
    });

  },

  // User actions
  addXP: async (amount, options = {}) => { // Make async
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for addXP action.");
      return { newState: get().user, levelUp: false };
    }
    const { newState, levelUp } = await xpService.addXP(uid, amount); // Pass uid
    set({ user: newState });

    if (levelUp && options.onLevelUp) {
      options.onLevelUp(newState);
    }

    return { newState, levelUp };
  },

  applyPenalty: async (penaltyData) => { // Make async
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for applyPenalty action.");
      return get().user;
    }
    const { newState } = await xpService.applyPenalty(uid, penaltyData); // Pass uid
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

  completeTimer: async () => {
    const state = get();
    const { timer, user } = state;
    const uid = user.uid;

    if (!uid) {
      console.error("UID not found for completeTimer action.");
      return;
    }

    if (!timer.isBreakTime) {
      // Work session completed - record it in Firestore
      const sessionData = {
        durationMinutes: timer.workDuration,
        completed: true,
        isBreak: false,
        goalId: timer.selectedGoal || null,
        startAt: new Date(
          Date.now() - timer.workDuration * 60 * 1000,
        ).toISOString(),
        endAt: new Date().toISOString(),
        taskCompleted: true, // Assuming tasks are always completed if session is completed
        createdAt: new Date().toISOString(), // Use client-side timestamp
      };

      // Write session data to Firestore to trigger Cloud Function
      await db.collection("users").doc(uid).collection("sessions").add(sessionData);

      // Update goal progress (client-side update, will be consistent with Firestore)
      if (timer.selectedGoal) {
        const updatedGoals = await goalService.completePomodoroForGoal(
          uid,
          timer.selectedGoal,
        );
        set({
          goals: updatedGoals.filter((g) => g.completedPomodoros < g.pomodoros),
        });
      }
    }

    // Reset timer
    get().stopTimer();
  },

  // Goal actions
  refreshGoals: async () => {
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for refreshGoals action.");
      return;
    }
    const goals = await goalService.getActiveGoals(uid);
    set({ goals: goals });
  },

  completePomodoroForGoal: async (goalId) => {
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for completePomodoroForGoal action.");
      return;
    }
    const updatedGoals = await goalService.completePomodoroForGoal(
      uid,
      goalId, // goalService now takes string ID
    );
    set({
      goals: updatedGoals.filter((g) => g.completedPomodoros < g.pomodoros),
    });
  },

  // Pet actions
  selectPet: async (petId) => {
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for selectPet action.");
      return;
    }
    await petService.setSelectedPetId(uid, petId);
    const selectedPet = await petService.getSelectedPet(uid); // Re-fetch selected pet to ensure state is accurate
    set({
      selectedPet: selectedPet,
    });
  },

  addXPToPet: async (petId, xpAmount) => {
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for addXPToPet action.");
      return null;
    }
    const result = await petService.addXPToPet(uid, petId, xpAmount);
    if (result) {
      // Refresh pets and selectedPet after XP addition
      const pets = await petService.getAllPets(uid);
      const selectedPet = await petService.getSelectedPet(uid);
      set({
        pets: pets,
        selectedPet: selectedPet,
      });
      return result;
    }
    return null;
  },

  unlockPet: async (petType, cost) => {
    const state = get();
    const uid = state.user.uid;
    if (!uid) {
      console.error("UID not found for unlockPet action.");
      return false;
    }
    const petConfig = petService.PET_TYPES[petType];

    if (!petConfig) return false;

    // Fetch user's current XP from the store (which should be updated from Firestore)
    if (state.user.xp >= cost) {
      // Deduct XP
      const { newState } = await get().addXP(-cost); // addXP is now async

      // Unlock pet
      const success = await petService.unlockPet(uid, petType); // petService.unlockPet is now async
      if (success) {
        // Refresh pets after unlocking
        const pets = await petService.getAllPets(uid);
        set({
          pets: pets,
          user: newState, // Update user state with new XP
        });
      }
      return success;
    }
    return false;
  },

  refreshPets: async () => {
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for refreshPets action.");
      return;
    }
    const pets = await petService.getAllPets(uid);
    const selectedPet = await petService.getSelectedPet(uid);
    set({
      pets: pets,
      selectedPet: selectedPet,
    });
  },

  refreshShop: async () => {
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for refreshShop action.");
      return;
    }
    const shopData = await shopService.getShopData(uid);
    set({ shop: shopData });
  },

  // Shop actions
  toggleShop: () => {
    set((state) => ({
      shop: { ...state.shop, isOpen: !state.shop.isOpen },
    }));
  },

  buyBean: async (beanId, cost) => {
    const state = get();
    const uid = state.user.uid;
    if (!uid) {
      console.error("UID not found for buyBean action.");
      return false;
    }

    if (state.user.xp >= cost && !state.shop.ownedBeans.includes(beanId)) {
      // Deduct XP
      const { newState: userNewState } = await get().addXP(-cost);

      // Buy bean via service
      const success = await shopService.buyBean(uid, beanId);
      if (success) {
        // Refresh shop state
        await get().refreshShop();
        set({ user: userNewState }); // Update user state with new XP
      }
      return success;
    }
    return false;
  },

  selectBean: async (beanId) => {
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for selectBean action.");
      return;
    }
    await shopService.selectBean(uid, beanId);
    await get().refreshShop(); // Refresh shop state to update selected bean
  },

  // Trait actions
  buyTrait: async (traitId, cost) => {
    const state = get();
    const uid = state.user.uid;
    if (!uid) {
      console.error("UID not found for buyTrait action.");
      return false;
    }

    if (state.user.xp >= cost && !state.shop.ownedTraits.includes(traitId)) {
      // Deduct XP
      const { newState: userNewState } = await get().addXP(-cost);

      // Buy trait via service
      const success = await shopService.buyTrait(uid, traitId);
      if (success) {
        // Refresh shop state
        await get().refreshShop();
        set({ user: userNewState }); // Update user state with new XP
      }
      return success;
    }
    return false;
  },

  equipTrait: async (beanId, traitId) => {
    const state = get();
    const uid = state.user.uid;
    if (!uid) {
      console.error("UID not found for equipTrait action.");
      return false;
    }

    if (!state.shop.ownedTraits.includes(traitId)) {
      return false; // Must own trait to equip
    }

    const success = await shopService.equipTrait(uid, beanId, traitId);
    if (success) {
      await get().refreshShop(); // Refresh shop state
    }
    return success;
  },

  unequipTrait: async (beanId) => {
    const uid = get().user.uid;
    if (!uid) {
      console.error("UID not found for unequipTrait action.");
      return;
    }
    await shopService.unequipTrait(uid, beanId);
    await get().refreshShop(); // Refresh shop state
  },

  getActiveBeanTraits: () => {
    const state = get();
    const selectedBean = state.shop.selectedBean;
    return state.shop.beanTraits[selectedBean] || [];
  },

  // UI actions
  setCurrentPage: (page) => {
    set((state) => ({
      ui: { ...state.ui, currentPage: page },
    }));
  },
}));

export default useAppStore;
