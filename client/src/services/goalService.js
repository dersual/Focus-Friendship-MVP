// client/src/services/goalService.js

const GOALS_KEY = 'ffm:goals';

const getGoals = () => {
  try {
    const storedGoals = localStorage.getItem(GOALS_KEY);
    return storedGoals ? JSON.parse(storedGoals) : [];
  } catch (error) {
    console.error("Error loading goals from localStorage:", error);
    return [];
  }
};

const persistGoals = (goals) => {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (error) {
    console.error("Error persisting goals to localStorage:", error);
  }
};

export const addGoal = ({ title, pomodoros }) => {
  const goals = getGoals();
  const newGoal = {
    id: Date.now(),
    title,
    pomodoros,
    completedPomodoros: 0,
    createdAt: new Date().toISOString(),
  };
  const newGoals = [...goals, newGoal];
  persistGoals(newGoals);
  return newGoals;
};

export const completePomodoroForGoal = (goalId) => {
  const goals = getGoals();
  const newGoals = goals.map(goal => {
    if (goal.id === goalId && goal.completedPomodoros < goal.pomodoros) {
      return { ...goal, completedPomodoros: goal.completedPomodoros + 1 };
    }
    return goal;
  });
  persistGoals(newGoals);
  return newGoals;
};

export const deleteGoal = (goalId) => {
  const goals = getGoals();
  const newGoals = goals.filter(goal => goal.id !== goalId);
  persistGoals(newGoals);
  return newGoals;
};

export const getActiveGoals = () => {
  return getGoals().filter(goal => goal.completedPomodoros < goal.pomodoros);
};

export const getAllGoals = () => {
  return getGoals();
};
