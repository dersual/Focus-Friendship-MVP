// client/src/components/Timer.jsx
import React, { useState } from 'react';
import useTimer from '../hooks/useTimer';
import { applyPenalty } from '../services/xpService';
import { enqueueForSync } from '../services/syncService';

const Timer = ({ onStopWithPenalty, onTimerComplete, activeGoals, selectedGoal, setSelectedGoal }) => {
  const [minutes, setMinutes] = useState(25);

  const handleComplete = () => {
    onTimerComplete(minutes, selectedGoal);
  };

  const {
    timeLeft,
    isActive,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimer(handleComplete, handlePenalty);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  function handlePenalty({ type }) {
    console.log("Penalty triggered:", type);
    const { newState } = applyPenalty({ type });
    enqueueForSync('session', {
      sessionId: Date.now(),
      startAt: null,
      endAt: new Date().toISOString(),
      durationSec: 0,
      completed: false,
      xpGained: 0,
      interrupted: true,
      penaltyApplied: true,
      penaltyType: type,
    });
    enqueueForSync('user', newState);
  }

  const handleStopClick = () => {
    if (isActive && !isPaused) {
      onStopWithPenalty(stopTimer);
    } else {
      stopTimer();
    }
  };

  const progress = (timeLeft / (minutes * 60)) * 100;

  return (
    <div className="timer-container text-center p-4 border rounded-3 shadow-sm bg-white">
      <div className="position-relative mx-auto" style={{ width: '12rem', height: '12rem' }}>
        <svg className="w-100 h-100" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            className="text-secondary-subtle"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="70"
            cx="96"
            cy="96"
          />
          <circle
            className="text-primary"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 70}
            strokeDashoffset={2 * Math.PI * 70 * (1 - progress / 100)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="70"
            cx="96"
            cy="96"
          />
        </svg>
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
          <span className="fs-1 fw-bold text-text">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {!isActive && (
        <div className="goal-selector mt-4">
          <select
            className="form-select"
            value={selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
            aria-label="Select a goal"
          >
            <option value="">Focus on...</option>
            {activeGoals.map(goal => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="timer-controls mt-4">
        {!isActive && (
          <button
            onClick={() => startTimer(minutes)}
            className="btn btn-primary-custom rounded-pill fs-5 fw-semibold me-3"
            aria-label="Start Timer"
          >
            Start
          </button>
        )}
        {isActive && !isPaused && (
          <button
            onClick={pauseTimer}
            className="btn btn-secondary rounded-pill fs-5 fw-semibold me-3"
            aria-label="Pause Timer"
          >
            Pause
          </button>
        )}
        {isActive && isPaused && (
          <button
            onClick={resumeTimer}
            className="btn btn-accent rounded-pill fs-5 fw-semibold me-3"
            aria-label="Resume Timer"
          >
            Resume
          </button>
        )}
        {isActive && (
          <button
            onClick={handleStopClick}
            className="btn btn-dark rounded-pill fs-5 fw-semibold"
            aria-label="Stop Timer"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
};

export default Timer;