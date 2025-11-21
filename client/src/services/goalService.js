// client/src/services/goalService.js

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

const getGoals = async (uid) => {
  if (!uid) {
    console.error("getGoals called without a UID.");
    return [];
  }

  const goalsRef = collection(db, "users", uid, "goals");
  const q = query(goalsRef);
  const querySnapshot = await getDocs(q);

  const goals = [];
  querySnapshot.forEach((doc) => {
    goals.push({ id: doc.id, ...doc.data() });
  });

  return goals;
};

export const addGoal = async (uid, { title, pomodoros }) => {
  if (!uid) {
    console.error("addGoal called without a UID.");
    return null;
  }

  const newGoalData = {
    title,
    pomodoros,
    completedPomodoros: 0,
    createdAt: new Date().toISOString(),
  };
  const goalsRef = collection(db, "users", uid, "goals");
  const docRef = await addDoc(goalsRef, newGoalData);

  return { id: docRef.id, ...newGoalData };
};

export const completePomodoroForGoal = async (uid, goalId) => {
  if (!uid) {
    console.error("completePomodoroForGoal called without a UID.");
    return [];
  }

  const goalRef = doc(db, "users", uid, "goals", goalId);
  const goalSnap = await getDoc(goalRef);

  if (goalSnap.exists()) {
    const goal = goalSnap.data();
    if (goal.completedPomodoros < goal.pomodoros) {
      await updateDoc(goalRef, {
        completedPomodoros: goal.completedPomodoros + 1,
      });
    }
  }
  return getGoals(uid); // Return updated list of goals
};

export const deleteGoal = async (uid, goalId) => {
  if (!uid) {
    console.error("deleteGoal called without a UID.");
    return [];
  }

  const goalRef = doc(db, "users", uid, "goals", goalId);
  await deleteDoc(goalRef);

  return getGoals(uid); // Return updated list of goals
};

export const getActiveGoals = async (uid) => {
  if (!uid) {
    console.error("getActiveGoals called without a UID.");
    return [];
  }
  const goals = await getGoals(uid);
  return goals.filter((goal) => goal.completedPomodoros < goal.pomodoros);
};

export const getAllGoals = async (uid) => {
  if (!uid) {
    console.error("getAllGoals called without a UID.");
    return [];
  }
  return getGoals(uid);
};
