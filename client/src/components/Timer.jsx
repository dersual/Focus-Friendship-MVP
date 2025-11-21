// client/src/components/Timer.jsx
import React, { useState, useEffect } from "react";
import { Button } from "./ui";
import ConfirmModal from "./ConfirmModal";
import EvolutionAnimation from "./EvolutionAnimation";
import useAppStore from "../stores/appStore";
import useTimer from "../hooks/useTimer";
import * as petService from "../services/petService";
import {
  getEstimatedXP,
  getXPConsequences,
} from "../services/sessionService.js";
import {
  applyTraitBonuses,
  getTraitBonusDescription,
} from "../utils/traitUtils";

const Timer = () => {
  const {
    goals,
    user,
    timer,
    selectedPet,
    shop,
    setWorkDuration,
    setBreakDuration,
    setSelectedGoal,
    addXP,
    addXPToPet,
    applyPenalty,
    completePomodoroForGoal,
    getActiveBeanTraits,
  } = useAppStore();

  const [isBreakTime, setIsBreakTime] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showXPFeedback, setShowXPFeedback] = useState(null); // { type: 'gain'|'loss', amount: number, message: string }
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [estimatedXP, setEstimatedXP] = useState(0);
  const [xpConsequences, setXPConsequences] = useState(null);
  const [showEvolution, setShowEvolution] = useState(null); // Pet data for evolution animation

  // Update estimated XP when duration changes
  useEffect(() => {
    const duration = isBreakTime ? timer.breakDuration : timer.workDuration;
    const estimated = getEstimatedXP(duration, isBreakTime, false, 0); // Remove tasks bonus
    setEstimatedXP(estimated);

    // Check for XP consequences on very short sessions
    if (!isBreakTime) {
      setXPConsequences(getXPConsequences(duration, isBreakTime));
    } else {
      setXPConsequences(null);
    }
  }, [timer.workDuration, timer.breakDuration, isBreakTime]);

  // Timer completion handler
  const handleTimerComplete = (completionData) => {
    const { xpGained, durationMinutes, isBreak, goalId } = completionData;

    // Get active bean traits for bonus calculation
    const activeBeanTraits = getActiveBeanTraits();

    // Determine goal category for trait application
    let goalCategory = null;
    if (goalId && goals) {
      const selectedGoal = goals.find((g) => g.id === goalId);
      goalCategory = selectedGoal?.category;
    }

    // Apply trait bonuses to XP
    const traitResult = applyTraitBonuses(xpGained, activeBeanTraits, {
      isBreak,
      goalCategory,
      durationMinutes,
    });

    const finalXP = traitResult.finalXP;

    // Add XP to user
    const result = addXP(finalXP, {
      onLevelUp: (newState) => {
        console.log(`Level up! Now level ${newState.level}`);
        // Could show level up animation here
      },
    });

    // Add XP to selected pet with potential bonus
    if (selectedPet && finalXP > 0) {
      // Determine task type based on goal or default to general
      let taskType = "general";
      if (goalId && goals) {
        const selectedGoal = goals.find((g) => g.id === goalId);
        if (selectedGoal?.category) {
          taskType = selectedGoal.category.toLowerCase();
        }
      }

      // Get pet's XP bonus for this task type
      const petConfig = petService.PET_TYPES[selectedPet.type];
      let petXP = finalXP;

      if (petConfig && petConfig.specialty === taskType && petConfig.xpBonus) {
        petXP = Math.round(finalXP * petConfig.xpBonus);
      }

      // Check for evolution before adding XP
      const previousLevel = selectedPet.level;
      const previousEvolution = petService.getPetEvolutionStage(selectedPet);

      // Award XP to the pet
      addXPToPet(selectedPet.id, petXP);

      // Check for evolution after adding XP
      const updatedPets = petService.getAllPets();
      const updatedPet = updatedPets[selectedPet.id];

      if (updatedPet && updatedPet.level > previousLevel) {
        const newEvolution = petService.getPetEvolutionStage(updatedPet);

        // Show evolution animation if the evolution stage changed
        if (newEvolution && newEvolution.level !== previousEvolution?.level) {
          setShowEvolution(updatedPet);
        }
      }

      console.log(
        `Pet ${selectedPet.id} gained ${petXP} XP (${petXP !== finalXP ? "with specialty bonus!" : "base amount"})`,
      );
    }

    // Show XP gained feedback with trait bonus info
    if (finalXP > 0) {
      const traitBonusText = getTraitBonusDescription(
        traitResult.appliedTraits,
      );
      const message = traitBonusText
        ? `Great job! +${finalXP} XP earned! (${traitBonusText})`
        : `Great job! +${finalXP} XP earned!`;

      setShowXPFeedback({
        type: "gain",
        amount: finalXP,
        message: message,
      });
      // Clear feedback after 3 seconds
      setTimeout(() => setShowXPFeedback(null), 3000);
    }

    // Update goal progress if a goal was selected
    if (goalId && !isBreak) {
      completePomodoroForGoal(goalId);
      console.log(`Updated goal ${goalId} with completed session`);
    }

    // Switch to break time if work session completed
    if (!isBreak) {
      setIsBreakTime(true);
    } else {
      setIsBreakTime(false);
    }

    console.log(
      `Timer completed! ${isBreak ? "Break" : "Work"} session: ${durationMinutes}m, XP: ${xpGained} -> ${finalXP} (with traits)`,
    );
  };

  // Timer penalty handler
  const handleTimerPenalty = (penaltyData) => {
    const penaltyResult = applyPenalty(penaltyData);

    // Show XP loss feedback
    setShowXPFeedback({
      type: "loss",
      amount: penaltyData.amount || 10,
      message: `Focus broken! -${penaltyData.amount || 10} XP penalty`,
    });
    // Clear feedback after 4 seconds (longer for negative feedback)
    setTimeout(() => setShowXPFeedback(null), 4000);
    setIsBreakTime(false); // Reset break mode on penalty
  };

  // Initialize timer hook
  const {
    timeLeft,
    isActive,
    isPaused,
    progress,
    startTimer: startTimerHook,
    pauseTimer,
    resumeTimer,
    stopTimer: stopTimerHook,
    formattedTimeLeft,
    canStart,
    canPause,
    canResume,
    canStop,
  } = useTimer(handleTimerComplete, handleTimerPenalty);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartWork = () => {
    // Check if we need to show confirmation for short sessions
    if (xpConsequences) {
      setShowStartConfirm(true);
      return;
    }

    setIsBreakTime(false);
    startTimerHook(
      timer.workDuration,
      false,
      timer.selectedGoal,
      false, // Remove tasks completed
    );
  };

  const handleStartBreak = () => {
    setIsBreakTime(true);
    startTimerHook(timer.breakDuration, true, null, false);
  };

  const confirmStartWork = () => {
    setIsBreakTime(false);
    startTimerHook(
      timer.workDuration,
      false,
      timer.selectedGoal,
      false, // Remove tasks completed
    );
    setShowStartConfirm(false);
  };

  const cancelStartWork = () => {
    setShowStartConfirm(false);
  };

  const handleStopClick = () => {
    // Show confirmation modal instead of immediately stopping
    setShowStopConfirm(true);
  };

  const confirmStop = () => {
    const withPenalty = !isPaused; // Always apply penalty if not paused
    if (withPenalty) {
      applyPenalty({ type: "manual_stop", amount: 10 });
    }
    stopTimerHook(withPenalty);
    setIsBreakTime(false);
    setShowStopConfirm(false);
  };

  const cancelStop = () => {
    setShowStopConfirm(false);
  };

  const getCurrentDuration = () => {
    return isBreakTime ? timer.breakDuration : timer.workDuration;
  };

  const getProgress = () => {
    if (isActive) {
      return progress;
    }
    return 0;
  };

  const getDisplayTime = () => {
    if (isActive) {
      return formattedTimeLeft;
    }
    return formatTime(getCurrentDuration() * 60);
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
      {/* XP Feedback Overlay */}
      {showXPFeedback && (
        <div
          className={`alert ${showXPFeedback.type === "gain" ? "alert-success" : "alert-danger"} position-fixed`}
          style={{
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1050,
            minWidth: "250px",
            animation: "slideDown 0.3s ease-out",
          }}
        >
          <div className="d-flex align-items-center justify-content-center">
            <span className="me-2" style={{ fontSize: "1.2em" }}>
              {showXPFeedback.type === "gain" ? "🎉" : "😔"}
            </span>
            <strong>{showXPFeedback.message}</strong>
          </div>
        </div>
      )}

      {/* Timer Type Header */}
      <div className="mb-3">
        <h3
          className={`h4 fw-bold mb-2 ${
            isBreakTime ? "text-success" : "text-primary"
          }`}
          style={{
            padding: "12px 24px",
            borderRadius: "25px",
            backgroundColor: isBreakTime ? "#d4edda" : "#e3f2fd",
            border: `2px solid ${isBreakTime ? "#28a745" : "#007bff"}`,
          }}
        >
          {isBreakTime ? "☕ Break Time - Relax!" : "🎯 Work Time - Focus!"}
        </h3>
        {isActive && (
          <div
            className={`small ${isBreakTime ? "text-success" : "text-primary"} fw-semibold`}
          >
            Session in progress...
          </div>
        )}
      </div>

      {/* Compact Settings Button */}
      {!isActive && (
        <div className="d-flex justify-content-center mb-3">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowTimerSettings(true)}
          >
            ⚙️ Timer Settings
          </button>
        </div>
      )}

      {/* Timer Circle */}
      <div
        className="timer-circle-container mb-4"
        style={{ position: "relative" }}
      >
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
            stroke={isBreakTime ? "#28a745" : "var(--color-primary)"}
            strokeWidth="12"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={2 * Math.PI * 90 * (1 - getProgress() / 100)}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{
              transition: "stroke-dashoffset 0.1s linear",
              filter: isBreakTime
                ? "drop-shadow(0 0 10px #28a74550)"
                : "drop-shadow(0 0 10px #5ab6bd50)",
            }}
          />
        </svg>
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <span
              className={`timer-display fw-bold ${isBreakTime ? "text-success" : "text-primary"}`}
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
            >
              {getDisplayTime()}
            </span>
            {isActive && (
              <div
                className={`small ${isBreakTime ? "text-success" : "text-primary"}`}
                style={{ fontSize: "0.7rem", marginTop: "4px", opacity: 0.8 }}
              >
                {isBreakTime ? "Break Mode" : "Focus Mode"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Selector */}
      {!isActive && !isBreakTime && goals.length > 0 && (
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

      {/* User Stats Display */}
      {!isActive && (
        <div className="mb-4">
          <div className="row text-center">
            <div className="col-3">
              <div className="small text-muted">Level</div>
              <div className="fw-bold text-primary">{user.level}</div>
            </div>
            <div className="col-3">
              <div className="small text-muted">XP</div>
              <div className="fw-bold text-accent">{user.xp}</div>
            </div>
            <div className="col-3">
              <div className="small text-muted">Sessions</div>
              <div className="fw-bold text-secondary">{user.totalSessions}</div>
            </div>
            <div className="col-3">
              <div className="small text-muted">Est. XP</div>
              <div
                className={`fw-bold ${xpConsequences ? "text-warning" : "text-success"}`}
              >
                +{estimatedXP}
                {xpConsequences && (
                  <div
                    className="small text-warning"
                    style={{ fontSize: "0.7rem" }}
                  >
                    Reduced
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* XP Consequences Warning */}
          {xpConsequences && !isBreakTime && (
            <div className="alert alert-warning mt-3 py-2">
              <div className="small">
                <strong>⚠️ Short Session Warning:</strong>
                <br />
                {xpConsequences.warningMessage}
                <br />
                <strong>Base XP:</strong> {xpConsequences.baseXP} →{" "}
                <strong>Actual XP:</strong> {xpConsequences.effectiveXP}
              </div>
            </div>
          )}

          {/* Task Completion Checkbox */}
          {/* Removed tasks completed checkbox */}
        </div>
      )}

      {/* Timer Controls */}
      <div className="timer-controls d-flex flex-column gap-3">
        {canStart && (
          <div className="d-grid gap-3">
            {/* Work session gets prominent primary position */}
            <Button
              onClick={handleStartWork}
              variant="primary"
              size="lg"
              icon="🎯"
              aria-label="Start Work Timer"
              style={{ fontSize: "1.1em", padding: "12px" }}
            >
              Start Focus Session ({timer.workDuration}m)
              <div
                className="small mt-1"
                style={{ fontSize: "0.8em", opacity: 0.9 }}
              >
                +{estimatedXP} XP
                {xpConsequences && (
                  <span className="text-warning"> ⚠️ Reduced</span>
                )}
              </div>
            </Button>
            {/* Break session is smaller and secondary */}
            <Button
              onClick={handleStartBreak}
              variant="outline-secondary"
              size="md"
              icon="☕"
              aria-label="Start Break Timer"
            >
              Take a Break ({timer.breakDuration}m)
            </Button>
          </div>
        )}

        {/* Work session: Only stop button (no pause to maintain focus) */}
        {canPause && !isBreakTime && (
          <div className="d-flex justify-content-center">
            <Button
              onClick={handleStopClick}
              variant="danger"
              icon="⛔"
              size="lg"
              aria-label="Stop Focus Session"
              style={{
                fontSize: "1.1em",
                padding: "12px 24px",
                boxShadow: "0 4px 12px rgba(220, 53, 69, 0.3)",
              }}
            >
              End Focus Session
              <div
                className="small mt-1"
                style={{ fontSize: "0.8em", opacity: 0.9 }}
              >
                (⚠️ -10 XP penalty)
              </div>
            </Button>
          </div>
        )}

        {/* Break session: Allow pause/resume (more flexible) */}
        {canPause && isBreakTime && (
          <div className="d-flex gap-2">
            <Button
              onClick={pauseTimer}
              variant="secondary"
              icon="⏸️"
              className="flex-grow-1"
              aria-label="Pause Break Timer"
            >
              Pause
            </Button>
            <Button
              onClick={handleStopClick}
              variant="outline-danger"
              icon="⏹️"
              className="flex-grow-1"
              aria-label="End Break"
            >
              End Break
            </Button>
          </div>
        )}

        {canResume && (
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
              variant="outline-danger"
              icon="⏹️"
              className="flex-grow-1"
              aria-label="Stop Timer"
            >
              Stop
            </Button>
          </div>
        )}
      </div>

      {/* Short Session Start Confirmation Modal */}
      <ConfirmModal
        isOpen={showStartConfirm}
        onConfirm={confirmStartWork}
        onCancel={cancelStartWork}
        title="⚠️ Short Session Warning"
        message={
          <div className="text-center">
            <p className="mb-3">
              This session is shorter than 5 minutes and will receive reduced
              XP.
            </p>
            {xpConsequences && (
              <div className="alert alert-warning py-2">
                <strong>XP Impact:</strong>
                <br />
                Base XP: <strong>{xpConsequences.baseXP}</strong>
                <br />
                Reduced XP: <strong>{xpConsequences.effectiveXP}</strong>
                <br />
                <small className="text-muted mt-2">
                  Longer sessions (5+ minutes) receive full XP to encourage deep
                  focus.
                </small>
              </div>
            )}
            <p className="mb-0">
              Would you like to start anyway, or extend your session for better
              XP?
            </p>
          </div>
        }
        confirmText="Start Anyway"
        cancelText="Extend Session"
        confirmVariant="warning"
      />

      {/* Stop Confirmation Modal */}
      <ConfirmModal
        isOpen={showStopConfirm}
        onConfirm={confirmStop}
        onCancel={cancelStop}
        title="⚠️ Stop Focus Session?"
        message={
          <div className="text-center">
            <p className="mb-3">
              Are you sure you want to end your focus session early?
            </p>
            {!isBreakTime && (
              <div className="alert alert-warning py-2">
                <strong>⚠️ Penalty:</strong> You'll lose <strong>10 XP</strong>{" "}
                for stopping early.
                <br />
                <small className="text-muted">
                  Stay focused to earn XP instead!
                </small>
              </div>
            )}
            {isBreakTime && (
              <div className="alert alert-info py-2">
                <small>No penalty for ending break time early.</small>
              </div>
            )}
          </div>
        }
        confirmText={isBreakTime ? "End Break" : "Stop Session"}
        cancelText="Keep Going"
        confirmVariant="danger"
      />

      {/* Timer Settings Modal */}
      {showTimerSettings && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content p-4 rounded shadow">
                <div className="modal-header border-0 pb-3">
                  <h5 className="modal-title fw-bold text-text">
                    ⚙️ Timer Settings
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowTimerSettings(false)}
                  ></button>
                </div>
                <div className="modal-body pt-0">
                  <div className="mb-3">
                    <label
                      htmlFor="work-duration"
                      className="form-label small fw-semibold"
                    >
                      Work Duration (minutes)
                    </label>
                    <input
                      id="work-duration"
                      type="number"
                      className="form-control"
                      value={timer.workDuration}
                      onChange={handleWorkDurationChange}
                      min="1"
                      max="120"
                      step="1"
                    />
                    <div className="form-text">
                      1-120 minutes. Recommended: 25-45 minutes for optimal
                      focus.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="break-duration"
                      className="form-label small fw-semibold"
                    >
                      Break Duration (minutes)
                    </label>
                    <input
                      id="break-duration"
                      type="number"
                      className="form-control"
                      value={timer.breakDuration}
                      onChange={handleBreakDurationChange}
                      min="1"
                      max="60"
                      step="1"
                    />
                    <div className="form-text">
                      1-60 minutes. Recommended: 5-15 minutes for short breaks.
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-primary-custom rounded-pill"
                    onClick={() => setShowTimerSettings(false)}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Evolution Animation */}
      {showEvolution && (
        <EvolutionAnimation
          pet={showEvolution}
          onComplete={() => {
            setShowEvolution(null);
            // Refresh selected pet state
            const updatedPets = petService.getAllPets();
            const updatedPet = updatedPets[selectedPet.id];
            if (updatedPet) {
              // This would be handled by the store, but we can refresh here too
              console.log("Evolution animation complete");
            }
          }}
        />
      )}
    </div>
  );
};

export default Timer;
