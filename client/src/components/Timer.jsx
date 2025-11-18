// client/src/components/Timer.jsx
import React, { useEffect, useRef } from "react";
import { Button } from "./ui";
import useAppStore from "../stores/appStore";

const Timer = () => {
  const {
    timer,
    goals,
    user,
    setWorkDuration,
    setBreakDuration,
    setSelectedGoal,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    updateTimeLeft,
    completeTimer,
    applyPenalty,
  } = useAppStore();

  const intervalRef = useRef(null);

  // Timer countdown effect
  useEffect(() => {
    if (timer.isActive && !timer.isPaused && timer.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        updateTimeLeft(timer.timeLeft - 1);
      }, 1000);
    } else if (timer.timeLeft === 0 && timer.isActive) {
      // Timer completed
      completeTimer();
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [timer.isActive, timer.isPaused, timer.timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStopClick = () => {
    if (timer.isActive && !timer.isPaused) {
      // Apply penalty for early stop
      if (user.penaltiesEnabled) {
        applyPenalty({ type: "manual_stop" });
      }
    }
    stopTimer();
  };

  const getCurrentDuration = () => {
    return timer.isBreakTime ? timer.breakDuration : timer.workDuration;
  };

  const getProgress = () => {
    const totalSeconds = getCurrentDuration() * 60;
    return totalSeconds > 0
      ? ((totalSeconds - timer.timeLeft) / totalSeconds) * 100
      : 0;
  };

  const handleWorkDurationChange = (e) => {
    const value = Math.max(1, Math.min(120, parseInt(e.target.value) || 1));
    setWorkDuration(value);
  };

  const handleBreakDurationChange = (e) => {
    const value = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
    setBreakDuration(value);
  };

  return (
    <div className="text-center">
      {/* Timer Type Header */}
      <div className="mb-3">
        <h3 className="h5 fw-bold text-primary">
          {timer.isBreakTime ? "☕ Break Time" : "🎯 Focus Time"}
        </h3>
      </div>

      {/* Duration Controls - Only show when timer is not active */}
      {!timer.isActive && (
        <div className="row g-3 mb-4">
          <div className="col-6">
            <label
              htmlFor="work-duration"
              className="form-label fw-semibold small"
            >
              Work (min)
            </label>
            <input
              id="work-duration"
              type="number"
              min="1"
              max="120"
              value={timer.workDuration}
              onChange={handleWorkDurationChange}
              className="form-control form-control-sm text-center fw-bold"
            />
          </div>
          <div className="col-6">
            <label
              htmlFor="break-duration"
              className="form-label fw-semibold small"
            >
              Break (min)
            </label>
            <input
              id="break-duration"
              type="number"
              min="1"
              max="60"
              value={timer.breakDuration}
              onChange={handleBreakDurationChange}
              className="form-control form-control-sm text-center fw-bold"
            />
          </div>
        </div>
      )}

      {/* Timer Circle */}
      <div className="timer-circle-container mb-4">
        <svg className="timer-circle" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="8"
            opacity="0.3"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={
              timer.isBreakTime ? "var(--color-accent)" : "var(--color-primary)"
            }
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={2 * Math.PI * 90 * (1 - getProgress() / 100)}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
          <span className="timer-display text-text">
            {timer.isActive
              ? formatTime(timer.timeLeft)
              : formatTime(getCurrentDuration() * 60)}
          </span>
        </div>
      </div>

      {/* Goal Selector */}
      {!timer.isActive && !timer.isBreakTime && goals.length > 0 && (
        <div className="goal-selector mb-4">
          <label htmlFor="goal-select" className="form-label fw-semibold small">
            Focus Goal (Optional)
          </label>
          <select
            id="goal-select"
            className="form-select form-select-sm"
            value={timer.selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
            aria-label="Select a goal"
          >
            <option value="">Choose a goal...</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title} ({goal.completedPomodoros}/{goal.pomodoros})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Timer Controls */}
      <div className="timer-controls d-flex flex-column gap-3">
        {!timer.isActive && (
          <div className="d-grid gap-2">
            <Button
              onClick={() => startTimer(false)}
              variant="primary"
              size="lg"
              icon="🎯"
              aria-label="Start Work Timer"
            >
              Start Work ({timer.workDuration}m)
            </Button>
            <Button
              onClick={() => startTimer(true)}
              variant="accent"
              size="md"
              icon="☕"
              aria-label="Start Break Timer"
            >
              Start Break ({timer.breakDuration}m)
            </Button>
          </div>
        )}

        {timer.isActive && !timer.isPaused && (
          <div className="d-flex gap-2">
            <Button
              onClick={pauseTimer}
              variant="secondary"
              icon="⏸️"
              className="flex-grow-1"
              aria-label="Pause Timer"
            >
              Pause
            </Button>
            <Button
              onClick={handleStopClick}
              variant="danger"
              icon="⏹️"
              className="flex-grow-1"
              aria-label="Stop Timer"
            >
              Stop
            </Button>
          </div>
        )}

        {timer.isActive && timer.isPaused && (
          <div className="d-flex gap-2">
            <Button
              onClick={resumeTimer}
              variant="primary"
              icon="▶️"
              className="flex-grow-1"
              aria-label="Resume Timer"
            >
              Resume
            </Button>
            <Button
              onClick={handleStopClick}
              variant="danger"
              icon="⏹️"
              className="flex-grow-1"
              aria-label="Stop Timer"
            >
              Stop
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timer;
