3// client/src/components/Goals.jsx
import React, { useState, useEffect } from 'react';
import * as goalService from '../services/goalService';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalPomodoros, setNewGoalPomodoros] = useState(1);

  useEffect(() => {
    setGoals(goalService.getAllGoals());
  }, []);

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (newGoalTitle.trim() && newGoalPomodoros > 0) {
      const newGoals = goalService.addGoal({
        title: newGoalTitle,
        pomodoros: parseInt(newGoalPomodoros, 10),
      });
      setGoals(newGoals);
      setNewGoalTitle('');
      setNewGoalPomodoros(1);
    }
  };

  const handleDeleteGoal = (goalId) => {
    const newGoals = goalService.deleteGoal(goalId);
    setGoals(newGoals);
  };

  return (
    <div className="goals-container p-4 border rounded-3 shadow-sm bg-white">
      <h3 className="fw-bold mb-3">My Goals</h3>
      <form onSubmit={handleAddGoal} className="d-flex mb-4">
        <input
          type="text"
          className="form-control me-2"
          placeholder="New goal title..."
          value={newGoalTitle}
          onChange={(e) => setNewGoalTitle(e.target.value)}
          required
        />
        <input
          type="number"
          className="form-control me-2"
          style={{ width: '80px' }}
          value={newGoalPomodoros}
          onChange={(e) => setNewGoalPomodoros(e.target.value)}
          min="1"
          required
        />
        <button type="submit" className="btn btn-primary-custom">Add</button>
      </form>

      <ul className="list-group">
        {goals.map(goal => (
          <li key={goal.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-semibold">{goal.title}</span>
              <div className="progress mt-1" style={{ height: '10px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${(goal.completedPomodoros / goal.pomodoros) * 100}%` }}
                  aria-valuenow={goal.completedPomodoros}
                  aria-valuemin="0"
                  aria-valuemax={goal.pomodoros}
                ></div>
              </div>
              <small className="text-muted">{goal.completedPomodoros} / {goal.pomodoros} Pomodoros</small>
            </div>
            <button onClick={() => handleDeleteGoal(goal.id)} className="btn btn-sm btn-outline-danger">
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Goals;
