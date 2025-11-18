// client/src/hooks/useTimer.js
import { useState, useEffect, useRef } from 'react';

const useTimer = (onComplete, onPenalty) => {
  const [duration, setDuration] = useState(25 * 60); // Default 25 minutes
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef(null);
  const visibilityGraceTimerRef = useRef(null);

  // Core timer tick logic
  const tick = () => {
    if (isPaused || !isActive) return;
    setTimeLeft(prev => {
      if (prev <= 1) {
        clearInterval(timerRef.current);
        setIsActive(false);
        onComplete();
        return 0;
      }
      return prev - 1;
    });
  };

  // Handle tab visibility changes for penalties
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isActive && !isPaused) {
        // Start an 8-second grace timer
        visibilityGraceTimerRef.current = setTimeout(() => {
          onPenalty({ type: 'leave' });
          // Optionally stop the timer after penalty
          stopTimer(); 
        }, 8000);
      } else if (document.visibilityState === 'visible') {
        // If user returns in time, clear the grace timer
        if (visibilityGraceTimerRef.current) {
          clearTimeout(visibilityGraceTimerRef.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityGraceTimerRef.current) {
        clearTimeout(visibilityGraceTimerRef.current);
      }
    };
  }, [isActive, isPaused, onPenalty]);

  // Timer interval management
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, isPaused]);

  const startTimer = (minutes) => {
    const newDuration = minutes * 60;
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const stopTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(duration); // Reset to initial duration
  };

  return {
    timeLeft,
    isActive,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setDuration,
  };
};

export default useTimer;
