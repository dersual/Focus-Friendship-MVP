// client/src/services/xpService.test.js
import * as xpService from './xpService';

describe('xpService', () => {
  const USER_STATE_KEY = 'ffm:user';
  let originalLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
    };
    // Reset mocks before each test
    localStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  it('should initialize user state if not present', () => {
    const state = xpService.initializeUserState();
    expect(state).toEqual({
      xp: 0,
      level: 1,
      totalSessions: 0,
      currentStreak: 0,
      penaltiesEnabled: true,
    });
    expect(localStorage.setItem).toHaveBeenCalledWith(USER_STATE_KEY, JSON.stringify(state));
  });

  it('should load existing user state from localStorage', () => {
    const storedState = { xp: 150, level: 2, totalSessions: 5, currentStreak: 2, penaltiesEnabled: false };
    localStorage.getItem.mockReturnValue(JSON.stringify(storedState));
    const state = xpService.getUserState();
    expect(state).toEqual(storedState);
  });

  it('should calculate expToNext correctly', () => {
    expect(xpService.expToNext(1)).toBe(125); // 100 * 1.25^1
    expect(xpService.expToNext(2)).toBe(156); // 100 * 1.25^2 = 156.25 -> 156
    expect(xpService.expToNext(3)).toBe(195); // 100 * 1.25^3 = 195.3125 -> 195
  });

  it('should add XP and not level up if not enough XP', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ xp: 0, level: 1, totalSessions: 0, currentStreak: 0, penaltiesEnabled: true }));
    const { newState, levelUp } = xpService.addXP(50);
    expect(newState.xp).toBe(50);
    expect(newState.level).toBe(1);
    expect(newState.totalSessions).toBe(1);
    expect(newState.currentStreak).toBe(1);
    expect(levelUp).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should add XP and level up correctly', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ xp: 0, level: 1, totalSessions: 0, currentStreak: 0, penaltiesEnabled: true }));
    const { newState, levelUp } = xpService.addXP(150); // Needs 125 for level 2
    expect(newState.xp).toBe(25); // 150 - 125 = 25
    expect(newState.level).toBe(2);
    expect(newState.totalSessions).toBe(1);
    expect(newState.currentStreak).toBe(1);
    expect(levelUp).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should add XP and level up multiple times correctly', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ xp: 0, level: 1, totalSessions: 0, currentStreak: 0, penaltiesEnabled: true }));
    const { newState, levelUp } = xpService.addXP(400); // Needs 125 for L2, 156 for L3
    expect(newState.xp).toBe(119); // 400 - 125 (L2) - 156 (L3) = 119
    expect(newState.level).toBe(3);
    expect(newState.totalSessions).toBe(1);
    expect(newState.currentStreak).toBe(1);
    expect(levelUp).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should apply penalty and reset streak if penalties are enabled', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ xp: 100, level: 1, totalSessions: 0, currentStreak: 5, penaltiesEnabled: true }));
    const { newState } = xpService.applyPenalty({ type: 'leave', amount: 20 });
    expect(newState.xp).toBe(80);
    expect(newState.currentStreak).toBe(0);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should not apply penalty if penalties are disabled', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ xp: 100, level: 1, totalSessions: 0, currentStreak: 5, penaltiesEnabled: false }));
    const { newState } = xpService.applyPenalty({ type: 'leave', amount: 20 });
    expect(newState.xp).toBe(100); // XP should remain unchanged
    expect(newState.currentStreak).toBe(5); // Streak should remain unchanged
    expect(localStorage.setItem).toHaveBeenCalled(); // Still called to persist state, but XP is same
  });

  it('should not go below 0 XP when applying penalty', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ xp: 10, level: 1, totalSessions: 0, currentStreak: 2, penaltiesEnabled: true }));
    const { newState } = xpService.applyPenalty({ type: 'manual_stop', amount: 20 });
    expect(newState.xp).toBe(0);
    expect(newState.currentStreak).toBe(0);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should toggle penaltiesEnabled setting', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ xp: 0, level: 1, totalSessions: 0, currentStreak: 0, penaltiesEnabled: true }));
    let { newState } = xpService.togglePenalties();
    expect(newState.penaltiesEnabled).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalled();

    ({ newState } = xpService.togglePenalties());
    expect(newState.penaltiesEnabled).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should apply a streak bonus to XP gained', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ xp: 0, level: 1, totalSessions: 0, currentStreak: 10, penaltiesEnabled: true }));
    const { newState } = xpService.addXP(100); // Base XP is 100
    // Bonus = 1 + (10 * 0.05) = 1.5x. Total XP = 100 * 1.5 = 150
    // Level up requires 125 XP. Remaining XP = 150 - 125 = 25
    expect(newState.xp).toBe(25);
    expect(newState.level).toBe(2);
    expect(newState.currentStreak).toBe(11);
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});