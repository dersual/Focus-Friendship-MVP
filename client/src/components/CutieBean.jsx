// client/src/components/CutieBean.jsx
import React, { useState, useEffect } from 'react';
import { getUserState } from '../services/xpService';

// Import SVG assets
import Bean0 from '../assets/images/cutie/bean-0.svg';
import Bean1 from '../assets/images/cutie/bean-1.svg';
import Bean2 from '../assets/images/cutie/bean-2.svg';
import Bean3 from '../assets/images/cutie/bean-3.svg';

const beanImages = [Bean0, Bean1, Bean2, Bean3];

const CutieBean = () => {
  const [userState, setUserState] = useState(getUserState());
  const [displayLevel, setDisplayLevel] = useState(userState.level);
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      const newState = getUserState();
      if (newState.level > userState.level) {
        setIsLevelingUp(true);
        // Animate level up
        let currentLevel = userState.level;
        const interval = setInterval(() => {
          currentLevel++;
          setDisplayLevel(currentLevel);
          if (currentLevel >= newState.level) {
            clearInterval(interval);
            setIsLevelingUp(false);
            setUserState(newState);
          }
        }, 300); // Adjust animation speed
      } else {
        setUserState(newState);
        setDisplayLevel(newState.level);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userState]);

  // Determine which bean image to show based on level
  const getBeanImage = (level) => {
    if (level >= 1 && level <= 5) return beanImages[0];
    if (level > 5 && level <= 10) return beanImages[1];
    if (level > 10 && level <= 15) return beanImages[2];
    if (level > 15) return beanImages[3];
    return beanImages[0]; // Default
  };

  const currentBeanImage = getBeanImage(displayLevel);

  return (
    <div className="text-center p-4">
      <img
        src={currentBeanImage}
        alt="Cutie Bean"
        className={`img-fluid w-auto h-auto mx-auto ${isLevelingUp ? 'animate-bounce' : ''}`}
        style={{ transition: 'transform 300ms ease-in-out' }}
      />
      <h4 className="fw-semibold mt-4">Level: {userState.level}</h4>
      <p className="fs-6">XP: {userState.xp}</p>
      <p className="fs-6">Focus Streak: {userState.currentStreak} 🔥</p>
      {isLevelingUp && <h5 className="text-accent fw-bold mt-2">Leveling Up!</h5>}
    </div>
  );
};

export default CutieBean;