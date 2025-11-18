// client/src/components/Goals.jsx
import React, { useState, useEffect } from "react";
import useAppStore from "../stores/appStore";
import { Button } from "./ui";
import * as goalService from "../services/goalService";

const Goals = () => {
  const { goals, refreshGoals } = useAppStore();
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalPomodoros, setNewGoalPomodoros] = useState(1);

  useEffect(() => {
    refreshGoals();
  }, [refreshGoals]);

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (newGoalTitle.trim() && newGoalPomodoros > 0) {
      goalService.addGoal({
        title: newGoalTitle,
        pomodoros: parseInt(newGoalPomodoros, 10),
      });
      refreshGoals(); // Update store
      setNewGoalTitle("");
      setNewGoalPomodoros(1);
    }
  };

  const handleDeleteGoal = (goalId) => {
    goalService.deleteGoal(goalId);
    refreshGoals(); // Update store
  };

  return (
    <div className="goals-container">
      <h3 className="h4 fw-bold mb-4">🎯 My Goals</h3>

      {/* Add Goal Form */}
      <form onSubmit={handleAddGoal} className="mb-4">
        <div className="row g-2 mb-3">
          <div className="col-8">
            <input
              type="text"
              className="form-control"
              placeholder="Goal title..."
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              required
            />
          </div>
          <div className="col-4">
            <input
              type="number"
              className="form-control text-center"
              placeholder="Sessions"
              value={newGoalPomodoros}
              onChange={(e) =>
                setNewGoalPomodoros(parseInt(e.target.value) || 1)
              }
              min="1"
              max="100"
              required
            />
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon="+"
          className="w-100"
        >
          Add Goal
        </Button>
      </form>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted mb-0">No goals yet. Add one above!</p>
        </div>
      ) : (
        <div className="goals-list">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="goal-item mb-3 p-3 border rounded-3 bg-light"
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="fw-semibold mb-0">{goal.title}</h6>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="btn btn-sm btn-outline-danger rounded-circle"
                  style={{ width: "32px", height: "32px", padding: 0 }}
                  aria-label="Delete goal"
                >
                  <span style={{ fontSize: "0.8rem" }}>×</span>
                </button>
              </div>

              <div className="progress mb-2" style={{ height: "8px" }}>
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{
                    width: `${Math.min(100, (goal.completedPomodoros / goal.pomodoros) * 100)}%`,
                    backgroundColor: "var(--color-primary)",
                  }}
                  aria-valuenow={goal.completedPomodoros}
                  aria-valuemin="0"
                  aria-valuemax={goal.pomodoros}
                ></div>
              </div>

              <small className="text-muted">
                {goal.completedPomodoros} / {goal.pomodoros} sessions completed
                {goal.completedPomodoros >= goal.pomodoros && (
                  <span className="text-success fw-bold ms-1">✓ Complete!</span>
                )}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Goals;
