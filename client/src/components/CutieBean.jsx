// client/src/components/CutieBean.jsx
import React, { useState, useEffect } from "react";
import useAppStore from "../stores/appStore";

// Import SVG assets
import Bean0 from "../assets/images/cutie/bean-0.svg";
import Bean1 from "../assets/images/cutie/bean-1.svg";
import Bean2 from "../assets/images/cutie/bean-2.svg";
import Bean3 from "../assets/images/cutie/bean-3.svg";

// Bean emoji mapping for shop beans
const BEAN_EMOJIS = {
  "bean-0": "🌱",
  "bean-1": "😊",
  "bean-2": "🧘",
  "bean-3": "🚀",
  "bean-4": "🌌",
};

const beanImages = [Bean0, Bean1, Bean2, Bean3];

const CutieBean = () => {
  const { user, shop } = useAppStore();
  const [displayLevel, setDisplayLevel] = useState(user.level);
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  useEffect(() => {
    if (user.level > displayLevel) {
      setIsLevelingUp(true);
      // Animate level up
      let currentLevel = displayLevel;
      const interval = setInterval(() => {
        currentLevel++;
        setDisplayLevel(currentLevel);
        if (currentLevel >= user.level) {
          clearInterval(interval);
          setIsLevelingUp(false);
        }
      }, 300);
    } else {
      setDisplayLevel(user.level);
    }
  }, [user.level]);

  // Determine which bean image to show based on level
  const getBeanImage = (level) => {
    if (level >= 1 && level <= 5) return beanImages[0];
    if (level > 5 && level <= 10) return beanImages[1];
    if (level > 10 && level <= 15) return beanImages[2];
    if (level > 15) return beanImages[3];
    return beanImages[0]; // Default
  };

  // Use shop bean if selected, otherwise use level-based bean
  const getDisplayBean = () => {
    if (shop.selectedBean && shop.selectedBean !== "bean-0") {
      return BEAN_EMOJIS[shop.selectedBean] || "🌱";
    }
    return null; // Use image
  };

  const currentBeanImage = getBeanImage(displayLevel);
  const currentBeanEmoji = getDisplayBean();

  return (
    <div className="text-center">
      <div className="cutie-bean-container mb-4">
        {currentBeanEmoji ? (
          <div
            className={`bean-emoji ${isLevelingUp ? "animate-bounce" : ""}`}
            style={{
              fontSize: "clamp(4rem, 12vw, 8rem)",
              transition: "transform 300ms ease-in-out",
              filter: "drop-shadow(0 4px 12px rgba(90, 182, 189, 0.3))",
            }}
          >
            {currentBeanEmoji}
          </div>
        ) : (
          <img
            src={currentBeanImage}
            alt="Cutie Bean"
            className={`img-fluid ${isLevelingUp ? "animate-bounce" : ""}`}
            style={{
              maxWidth: "min(200px, 50vw)",
              width: "100%",
              height: "auto",
              transition: "transform 300ms ease-in-out",
              filter: "drop-shadow(0 4px 12px rgba(90, 182, 189, 0.3))",
            }}
          />
        )}
      </div>

      <div className="stats-grid">
        <div className="row text-center g-3">
          <div className="col-4">
            <div className="stat-item">
              <div className="stat-label small fw-semibold text-secondary mb-1">
                Level
              </div>
              <div className="stat-value h4 fw-bold text-primary mb-0">
                {user.level}
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="stat-item">
              <div className="stat-label small fw-semibold text-secondary mb-1">
                XP
              </div>
              <div className="stat-value h5 mb-0">
                {user.xp.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="stat-item">
              <div className="stat-label small fw-semibold text-secondary mb-1">
                Streak
              </div>
              <div className="stat-value h5 mb-0">
                {user.currentStreak} <span className="text-accent">🔥</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLevelingUp && (
        <div className="level-up-notification mt-4">
          <div className="alert alert-success py-2 mb-0" role="alert">
            <h6 className="text-accent fw-bold mb-0">🎉 Level Up! 🎉</h6>
          </div>
        </div>
      )}
    </div>
  );
};

export default CutieBean;
