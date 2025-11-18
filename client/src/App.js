import React, { useState, useEffect } from "react";
import Timer from "./components/Timer";
import CutieBean from "./components/CutieBean";
import ConfirmModal from "./components/ConfirmModal";
import Goals from "./components/Goals";
import { getUserState, applyPenalty, initializeUserState, addXP } from "./services/xpService";
import * as goalService from "./services/goalService";
import { enqueueForSync } from "./services/syncService";

function App() {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});
  const [activeGoals, setActiveGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState("");

  useEffect(() => {
    initializeUserState();
    setActiveGoals(goalService.getActiveGoals());
  }, []);

  const handleStopTimerWithPenalty = (stopTimerCallback) => {
    const userState = getUserState();
    if (userState.penaltiesEnabled) {
      setConfirmModalTitle("Stop Timer?");
      setConfirmModalMessage("Stopping will cost 10 XP and reset your streak. Confirm stop?");
      setOnConfirmAction(() => () => {
        applyPenalty({ type: 'manual_stop' });
        enqueueForSync('session', {
          sessionId: Date.now(),
          startAt: null,
          endAt: new Date().toISOString(),
          durationSec: 0,
          completed: false,
          xpGained: 0,
          interrupted: true,
          penaltyApplied: true,
          penaltyType: 'manual_stop',
        });
        enqueueForSync('user', getUserState());
        stopTimerCallback();
        setIsConfirmModalOpen(false);
      });
      setIsConfirmModalOpen(true);
    } else {
      stopTimerCallback();
    }
  };

  const handleTimerComplete = (minutes, goalId) => {
    console.log(`Timer completed for goal: ${goalId}`);
    const baseXPGained = minutes * 10;
    const { newState, levelUp } = addXP(baseXPGained);

    if (goalId) {
      const newGoals = goalService.completePomodoroForGoal(parseInt(goalId, 10));
      setActiveGoals(newGoals.filter(g => g.completedPomodoros < g.pomodoros));
    }

    enqueueForSync('session', {
      sessionId: Date.now(),
      startAt: new Date(Date.now() - minutes * 60 * 1000).toISOString(),
      endAt: new Date().toISOString(),
      durationSec: minutes * 60,
      completed: true,
      xpGained: baseXPGained, // Log base XP, bonus is handled client-side
      interrupted: false,
      penaltyApplied: false,
      goalId: goalId,
    });
    enqueueForSync('user', newState);

    if (levelUp) {
      console.log("Level Up! New State:", newState);
    }
  };

  return (
    <div className="App d-flex flex-column align-items-center min-vh-100 bg-background text-text p-4">
      <h1 className="display-4 fw-bold mb-5">Focus Friendship</h1>
      <div className="container">
        <div className="row d-flex flex-column flex-md-row align-items-start justify-content-around w-100">
          <div className="col-12 col-md-4 p-4">
            <CutieBean />
          </div>
          <div className="col-12 col-md-4 p-4">
            <Timer
              onStopWithPenalty={handleStopTimerWithPenalty}
              onTimerComplete={handleTimerComplete}
              activeGoals={activeGoals}
              selectedGoal={selectedGoal}
              setSelectedGoal={setSelectedGoal}
            />
          </div>
          <div className="col-12 col-md-4 p-4">
            <Goals />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={onConfirmAction}
        title={confirmModalTitle}
        message={confirmModalMessage}
      />
    </div>
  );
}

export default App;