// client/src/hooks/useTimer.js
import { useState, useEffect, useRef, useCallback } from "react";
import {
  createSession,
  enqueueSession,
  completeSession,
  interruptSession,
  startSession,
} from "../services/sessionService";

const TIMER_UPDATE_INTERVAL = 100; // Update every 100ms for smooth progress
const GRACE_PERIOD_MS = 2000; // 2 second grace period before applying penalties

const useTimer = (onComplete, onPenalty) => {
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(null);
  const totalPausedTimeRef = useRef(0);
  const visibilityTimeRef = useRef(null);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibilityTimeRef.current = Date.now();
      } else if (visibilityTimeRef.current && isActive && !isPaused) {
        const awayTime = Date.now() - visibilityTimeRef.current;

        // If away for more than grace period, apply penalty and stop timer
        if (awayTime > GRACE_PERIOD_MS) {
          console.log(`Away for ${awayTime}ms, applying penalty`);
          stopTimer(true); // Force stop with penalty
          if (onPenalty) {
            onPenalty({
              type: "tab_switch",
              awayTime,
              message: `Timer stopped due to being away for ${Math.round(awayTime / 1000)}s`,
            });
          }
        }
        visibilityTimeRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, isPaused, onPenalty]);

  // Timer tick logic using timestamps
  const tick = useCallback(() => {
    if (!isActive || isPaused || !startTimeRef.current || !session) {
      return;
    }

    const now = Date.now();
    const elapsed =
      (now - startTimeRef.current - totalPausedTimeRef.current) / 1000;
    const remaining = Math.max(0, session.durationMinutes * 60 - elapsed);

    setTimeLeft(Math.ceil(remaining));
    setProgress(
      ((session.durationMinutes * 60 - remaining) /
        (session.durationMinutes * 60)) *
        100,
    );

    if (remaining <= 0) {
      handleComplete();
    }
  }, [isActive, isPaused, session]);

  // Timer update interval
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(tick, TIMER_UPDATE_INTERVAL);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, isPaused, tick]);

  // Start timer
  const startTimer = useCallback(
    (
      durationMinutes,
      isBreak = false,
      goalId = null,
      tasksCompleted = false,
    ) => {
      if (isActive) {
        console.warn("Timer already active");
        return false;
      }

      const newSession = createSession(durationMinutes, isBreak, goalId);
      newSession.tasksCompleted = tasksCompleted; // Add task completion tracking
      setSession(newSession);
      setTimeLeft(durationMinutes * 60);
      setProgress(0);
      setIsActive(true);
      setIsPaused(false);

      startTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;
      pausedAtRef.current = null;

      // Queue session for sync and start server session
      enqueueSession(newSession);
      startSession(newSession); // Register with server for anti-farming

      console.log(`Timer started: ${durationMinutes} minutes`, newSession);
      return true;
    },
    [isActive],
  );

  // Pause timer
  const pauseTimer = useCallback(() => {
    if (!isActive || isPaused) {
      console.warn("Cannot pause: timer not active or already paused");
      return false;
    }

    setIsPaused(true);
    pausedAtRef.current = Date.now();
    console.log("Timer paused");
    return true;
  }, [isActive, isPaused]);

  // Resume timer
  const resumeTimer = useCallback(() => {
    if (!isActive || !isPaused) {
      console.warn("Cannot resume: timer not active or not paused");
      return false;
    }

    if (pausedAtRef.current) {
      const pauseDuration = Date.now() - pausedAtRef.current;
      totalPausedTimeRef.current += pauseDuration;
      pausedAtRef.current = null;
    }

    setIsPaused(false);
    console.log("Timer resumed");
    return true;
  }, [isActive, isPaused]);

  // Stop timer (with optional penalty)
  const stopTimer = useCallback(
    (withPenalty = false) => {
      if (!isActive || !session) {
        console.warn("Cannot stop: timer not active");
        return false;
      }

      clearInterval(intervalRef.current);

      // Calculate actual duration
      const actualDurationMinutes = startTimeRef.current
        ? Math.round(
            (Date.now() - startTimeRef.current - totalPausedTimeRef.current) /
              (1000 * 60),
          )
        : 0;

      if (withPenalty) {
        const penalty = 10; // Default penalty amount
        interruptSession(session.sessionId, penalty, actualDurationMinutes)
          .then((result) => {
            console.log(
              `Timer stopped with penalty: ${penalty} XP, actual XP: ${result.xpGained}`,
            );
          })
          .catch((error) => {
            console.error("Error interrupting session:", error);
          });
      } else {
        interruptSession(session.sessionId, 0, actualDurationMinutes)
          .then((result) => {
            console.log(
              `Timer stopped without penalty, XP gained: ${result.xpGained}`,
            );
          })
          .catch((error) => {
            console.error("Error stopping session:", error);
          });
      }

      // Reset state
      setIsActive(false);
      setIsPaused(false);
      setTimeLeft(0);
      setProgress(0);
      setSession(null);

      startTimeRef.current = null;
      totalPausedTimeRef.current = 0;
      pausedAtRef.current = null;
      visibilityTimeRef.current = null;

      return true;
    },
    [isActive, session],
  );

  // Complete timer
  const handleComplete = useCallback(() => {
    if (!session) {
      console.warn("Cannot complete: no active session");
      return;
    }

    clearInterval(intervalRef.current);

    // Calculate actual duration based on elapsed time
    const actualDurationMinutes = startTimeRef.current
      ? Math.round(
          (Date.now() - startTimeRef.current - totalPausedTimeRef.current) /
            (1000 * 60),
        )
      : session.durationMinutes;

    // Use new async completeSession function
    completeSession(
      session.sessionId,
      actualDurationMinutes,
      session.tasksCompleted,
    )
      .then((result) => {
        console.log(`Timer completed! XP gained: ${result.xpGained}`);

        if (onComplete) {
          onComplete({
            session,
            xpGained: result.xpGained,
            durationMinutes: actualDurationMinutes,
            isBreak: session.isBreak,
            goalId: session.goalId,
            tasksCompleted: session.tasksCompleted,
            serverValidated: result.serverValidated,
          });
        }
      })
      .catch((error) => {
        console.error("Error completing session:", error);
        // Fallback to basic XP calculation
        const fallbackXP = Math.round(session.durationMinutes * 10);
        if (onComplete) {
          onComplete({
            session,
            xpGained: fallbackXP,
            durationMinutes: actualDurationMinutes,
            isBreak: session.isBreak,
            goalId: session.goalId,
            tasksCompleted: session.tasksCompleted,
            serverValidated: false,
          });
        }
      });

    // Reset state
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(0);
    setProgress(0);
    setSession(null);

    startTimeRef.current = null;
    totalPausedTimeRef.current = 0;
    pausedAtRef.current = null;
    visibilityTimeRef.current = null;
  }, [session, onComplete]);

  // Format time for display
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    // State
    session,
    timeLeft,
    isActive,
    isPaused,
    progress,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,

    // Utilities
    formatTime,
    formattedTimeLeft: formatTime(timeLeft),

    // Status helpers
    canStart: !isActive,
    canPause: isActive && !isPaused,
    canResume: isActive && isPaused,
    canStop: isActive,

    // Legacy compatibility
    setDuration: () => {}, // Deprecated - use startTimer with duration
  };
};

export default useTimer;
