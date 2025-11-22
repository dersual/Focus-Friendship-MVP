// client/src/components/Goals.jsx
import React, { useState, useEffect } from "react";
import useAppStore from "../stores/appStore";
import { Button } from "./ui";
import * as goalService from "../services/goalService";

const Goals = () => {
  const { goals, refreshGoals, addXP, user } = useAppStore();
  const uid = user?.uid;
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalPomodoros, setNewGoalPomodoros] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showXPReward, setShowXPReward] = useState(null);
  const goalsPerPage = 4; // Limit goals to prevent overflow

  useEffect(() => {
    if (uid) {
      refreshGoals();
    }
  }, [uid, refreshGoals]);

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (newGoalTitle.trim() && newGoalPomodoros > 0) {
      goalService.addGoal(uid, {
        title: newGoalTitle,
        pomodoros: parseInt(newGoalPomodoros, 10),
      });
      refreshGoals(); // Update store
      setNewGoalTitle("");
      setNewGoalPomodoros(1);
    }
  };

  const handleDeleteGoal = (goalId) => {
    // Award XP for completed goals before deleting
    const goal = goals.find((g) => g.id === goalId);
    if (goal && goal.completedPomodoros >= goal.pomodoros) {
      // Award XP based on number of pomodoros: 50 XP per session
      const xpReward = goal.pomodoros * 50;
      addXP(xpReward, {
        onLevelUp: (newState) => {
          console.log(`Level up! Now level ${newState.level}`);
        },
      });

      // Show XP reward notification
      setShowXPReward(`🎉 +${xpReward} XP for completing "${goal.title}"!`);
      setTimeout(() => setShowXPReward(null), 3000);
    }

    goalService.deleteGoal(uid, goalId);
    refreshGoals(); // Update store
  };

  // Calculate pagination
  const totalPages = Math.ceil(goals.length / goalsPerPage);
  const startIndex = (currentPage - 1) * goalsPerPage;
  const paginatedGoals = goals.slice(startIndex, startIndex + goalsPerPage);

  return (
    <div
      className="goals-container"
      style={{ height: "100%", overflow: "hidden" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="h4 fw-bold mb-0">🎯 My Goals</h3>
        {goals.length > goalsPerPage && (
          <small className="text-muted">
            {startIndex + 1}-{Math.min(startIndex + goalsPerPage, goals.length)}{" "}
            of {goals.length}
          </small>
        )}
      </div>

      {/* XP Reward Notification */}
      {showXPReward && (
        <div className="alert alert-success py-2 mb-3" role="alert">
          <small className="fw-bold">{showXPReward}</small>
        </div>
      )}

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

      {/* Scrollable Goals Container */}
      <div
        className="goals-list-container"
        style={{
          height: "calc(100% - 220px)", // Account for header, form, and pagination
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No goals yet. Add one above!</p>
          </div>
        ) : (
          <div className="goals-list">
            {paginatedGoals.map((goal) => (
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
                  {goal.completedPomodoros} / {goal.pomodoros} sessions
                  completed
                  {goal.completedPomodoros >= goal.pomodoros && (
                    <span className="text-success fw-bold ms-1">
                      ✓ Complete! Click ✕ for XP
                    </span>
                  )}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li
                  key={i + 1}
                  className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Goals;
