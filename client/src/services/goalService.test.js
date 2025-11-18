// client/src/services/goalService.test.js
import * as goalService from './goalService';

describe('goalService', () => {
  const GOALS_KEY = 'ffm:goals';
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

  it('should add a new goal', () => {
    const newGoals = goalService.addGoal({ title: 'Test Goal', pomodoros: 5 });
    expect(newGoals.length).toBe(1);
    expect(newGoals[0].title).toBe('Test Goal');
    expect(newGoals[0].pomodoros).toBe(5);
    expect(newGoals[0].completedPomodoros).toBe(0);
    expect(localStorage.setItem).toHaveBeenCalledWith(GOALS_KEY, JSON.stringify(newGoals));
  });

  it('should get all goals', () => {
    const storedGoals = [{ id: 1, title: 'Test Goal', pomodoros: 5, completedPomodoros: 0 }];
    localStorage.getItem.mockReturnValue(JSON.stringify(storedGoals));
    const goals = goalService.getAllGoals();
    expect(goals).toEqual(storedGoals);
  });

  it('should complete a pomodoro for a goal', () => {
    const storedGoals = [{ id: 1, title: 'Test Goal', pomodoros: 5, completedPomodoros: 0 }];
    localStorage.getItem.mockReturnValue(JSON.stringify(storedGoals));
    const newGoals = goalService.completePomodoroForGoal(1);
    expect(newGoals[0].completedPomodoros).toBe(1);
    expect(localStorage.setItem).toHaveBeenCalledWith(GOALS_KEY, JSON.stringify(newGoals));
  });

  it('should not complete a pomodoro if goal is already complete', () => {
    const storedGoals = [{ id: 1, title: 'Test Goal', pomodoros: 5, completedPomodoros: 5 }];
    localStorage.getItem.mockReturnValue(JSON.stringify(storedGoals));
    const newGoals = goalService.completePomodoroForGoal(1);
    expect(newGoals[0].completedPomodoros).toBe(5);
    expect(localStorage.setItem).toHaveBeenCalledWith(GOALS_KEY, JSON.stringify(newGoals));
  });

  it('should delete a goal', () => {
    const storedGoals = [{ id: 1, title: 'Test Goal', pomodoros: 5, completedPomodoros: 0 }];
    localStorage.getItem.mockReturnValue(JSON.stringify(storedGoals));
    const newGoals = goalService.deleteGoal(1);
    expect(newGoals.length).toBe(0);
    expect(localStorage.setItem).toHaveBeenCalledWith(GOALS_KEY, JSON.stringify(newGoals));
  });

  it('should get active goals', () => {
    const storedGoals = [
      { id: 1, title: 'Active Goal', pomodoros: 5, completedPomodoros: 2 },
      { id: 2, title: 'Completed Goal', pomodoros: 3, completedPomodoros: 3 },
    ];
    localStorage.getItem.mockReturnValue(JSON.stringify(storedGoals));
    const activeGoals = goalService.getActiveGoals();
    expect(activeGoals.length).toBe(1);
    expect(activeGoals[0].id).toBe(1);
  });
});
