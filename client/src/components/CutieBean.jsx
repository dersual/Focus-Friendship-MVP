// client/src/components/CutieBean.jsx
import React, { useState, useEffect } from "react";
import useAppStore from "../stores/appStore";
import * as petService from "../services/petService";
import { TRAITS } from "../config/traits";

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
  const { user, shop, pets, selectedPet, selectPet } = useAppStore();
  const [displayLevel, setDisplayLevel] = useState(
    selectedPet?.level || user.level,
  );
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showEvolutionPopup, setShowEvolutionPopup] = useState(false);

  useEffect(() => {
    const currentLevel = selectedPet?.level || user.level;
    if (currentLevel > displayLevel) {
      setIsLevelingUp(true);
      // Animate level up
      let currentDisplayLevel = displayLevel;
      const interval = setInterval(() => {
        currentDisplayLevel++;
        setDisplayLevel(currentDisplayLevel);
        if (currentDisplayLevel >= currentLevel) {
          clearInterval(interval);
          setIsLevelingUp(false);
        }
      }, 300);
    } else {
      setDisplayLevel(currentLevel);
    }
  }, [selectedPet?.level, user.level, displayLevel]);

  // Guard clause: Wait for essential data to be loaded from Firestore.
  if (!user.uid || !selectedPet) {
    return (
      <div className="text-center p-5">
        <p>Loading your companion...</p>
      </div>
    );
  }

  // Get list of unlocked companions
  const companionList = Object.values(pets);
  const currentCompanionIndex = companionList.findIndex(
    (pet) => pet.id === selectedPet?.id,
  );

  // Determine which bean image to show based on level
  const getBeanImage = (level) => {
    if (level >= 1 && level <= 5) return beanImages[0];
    if (level > 5 && level <= 10) return beanImages[1];
    if (level > 10 && level <= 15) return beanImages[2];
    if (level > 15) return beanImages[3];
    return beanImages[0]; // Default
  };

  // Use shop bean if selected, otherwise use companion or default bean
  const getDisplayBean = () => {
    if (shop.selectedBean && shop.selectedBean !== "bean-0") {
      return BEAN_EMOJIS[shop.selectedBean] || "🌱";
    }
    return null; // Use Bean SVG images
  };

  // Get current bean display info
  const getCurrentBeanInfo = () => {
    const shopBeanEmoji = getDisplayBean();

    if (shopBeanEmoji) {
      // Show shop bean with traits
      const equippedTraits = shop.beanTraits[shop.selectedBean] || [];
      return {
        emoji: shopBeanEmoji,
        name: "Bean Buddy",
        level: user.level,
        xp: user.xp,
        specialty: "general",
        isShopBean: true,
        traits: equippedTraits,
      };
    }

    if (selectedPet) {
      const petConfig = petService.PET_TYPES[selectedPet.type];
      const currentImage = getBeanImage(selectedPet.level);

      return {
        image: currentImage,
        name: petConfig?.name || "Bean Companion",
        level: selectedPet.level,
        xp: selectedPet.xp,
        specialty: petConfig?.specialty || "general",
        isShopBean: false,
        traits: [], // Pets don't have traits for now
      };
    }

    return {
      image: getBeanImage(user.level),
      name: "Bean Buddy",
      level: user.level,
      xp: user.xp,
      specialty: "general",
      isShopBean: false,
      traits: [],
    };
  };

  const beanInfo = getCurrentBeanInfo();

  // Carousel navigation functions
  const handlePrevious = () => {
    if (companionList.length > 1) {
      const prevIndex =
        currentCompanionIndex <= 0
          ? companionList.length - 1
          : currentCompanionIndex - 1;
      selectPet(companionList[prevIndex].id);
    }
  };

  const handleNext = () => {
    if (companionList.length > 1) {
      const nextIndex =
        currentCompanionIndex >= companionList.length - 1
          ? 0
          : currentCompanionIndex + 1;
      selectPet(companionList[nextIndex].id);
    }
  };

  const currentBeanEmoji = beanInfo.emoji;
  const currentBeanImage = beanInfo.image;

  return (
    <div className="text-center">
      {/* Companion Carousel Navigation */}
      {companionList.length > 1 && !beanInfo.isShopBean && (
        <div className="d-flex align-items-center justify-content-center mb-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handlePrevious}
            style={{ width: "32px", height: "32px", padding: 0 }}
          >
            ‹
          </button>
          <div className="mx-3 small text-muted">
            {currentCompanionIndex + 1} / {companionList.length}
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleNext}
            style={{ width: "32px", height: "32px", padding: 0 }}
          >
            ›
          </button>
        </div>
      )}

      {/* Bean Display */}
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
              cursor: "pointer",
            }}
            onClick={() => setShowEvolutionPopup(true)}
          />
        )}
      </div>

      {/* Bean Info */}
      <div className="bean-info mb-3">
        <div className="text-center">
          <div className="fw-bold text-primary h5 mb-1">{beanInfo.name}</div>
          <div className="small text-muted">
            Level {beanInfo.level} • {beanInfo.xp} XP
          </div>
          {beanInfo.specialty !== "general" && (
            <div className="small text-success">
              <strong>Specialty:</strong> {beanInfo.specialty}
            </div>
          )}

          {/* Show equipped traits */}
          {beanInfo.traits && beanInfo.traits.length > 0 && (
            <div className="mt-2">
              <div className="small text-info mb-1">
                <strong>Equipped Traits:</strong>
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-1">
                {beanInfo.traits.map((traitId) => {
                  const trait = TRAITS[traitId];
                  if (!trait) return null;
                  return (
                    <span
                      key={traitId}
                      className="badge bg-info text-white"
                      title={trait.description}
                      style={{ cursor: "help" }}
                    >
                      {trait.emoji} {trait.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Evolution Button - Make it obvious */}
        <div className="text-center mt-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => setShowEvolutionPopup(true)}
          >
            <span className="me-1">🌱</span>
            View Evolution
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="row text-center g-3">
          <div className="col-4">
            <div className="stat-item">
              <div className="stat-label small fw-semibold text-secondary mb-1">
                {selectedPet ? "Pet Level" : "Level"}
              </div>
              <div className="stat-value h4 fw-bold text-primary mb-0">
                {beanInfo.level}
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="stat-item">
              <div className="stat-label small fw-semibold text-secondary mb-1">
                XP
              </div>
              <div className="stat-value h5 mb-0">
                {beanInfo.xp.toLocaleString()}
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

      {/* Evolution Popup Modal */}
      {showEvolutionPopup && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 9999,
          }}
          onClick={() => setShowEvolutionPopup(false)}
        >
          <div
            className="bg-white rounded p-4 mx-3"
            style={{ maxWidth: "400px", width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h5 className="fw-bold mb-3">Bean Evolution</h5>

              <div className="evolution-stages">
                <div className="row g-2">
                  <div className="col-3 text-center">
                    <img
                      src={beanImages[0]}
                      alt="Stage 1"
                      className="img-fluid mb-1"
                      style={{ maxHeight: "60px" }}
                    />
                    <div className="small">Lv 1-5</div>
                    <div
                      className={`small ${beanInfo.level >= 1 ? "text-success" : "text-muted"}`}
                    >
                      {beanInfo.level >= 1 ? "✓" : "○"}
                    </div>
                  </div>
                  <div className="col-3 text-center">
                    <img
                      src={beanImages[1]}
                      alt="Stage 2"
                      className="img-fluid mb-1"
                      style={{ maxHeight: "60px" }}
                    />
                    <div className="small">Lv 6-10</div>
                    <div
                      className={`small ${beanInfo.level >= 6 ? "text-success" : "text-muted"}`}
                    >
                      {beanInfo.level >= 6 ? "✓" : "○"}
                    </div>
                  </div>
                  <div className="col-3 text-center">
                    <img
                      src={beanImages[2]}
                      alt="Stage 3"
                      className="img-fluid mb-1"
                      style={{ maxHeight: "60px" }}
                    />
                    <div className="small">Lv 11-15</div>
                    <div
                      className={`small ${beanInfo.level >= 11 ? "text-success" : "text-muted"}`}
                    >
                      {beanInfo.level >= 11 ? "✓" : "○"}
                    </div>
                  </div>
                  <div className="col-3 text-center">
                    <img
                      src={beanImages[3]}
                      alt="Stage 4"
                      className="img-fluid mb-1"
                      style={{ maxHeight: "60px" }}
                    />
                    <div className="small">Lv 16+</div>
                    <div
                      className={`small ${beanInfo.level >= 16 ? "text-success" : "text-muted"}`}
                    >
                      {beanInfo.level >= 16 ? "✓" : "○"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="small text-muted">
                  Current: <strong>{beanInfo.name}</strong> • Level{" "}
                  {beanInfo.level}
                </div>
                {beanInfo.specialty !== "general" && (
                  <div className="small text-primary">
                    <strong>Specialty:</strong> {beanInfo.specialty}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={() => setShowEvolutionPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CutieBean;
