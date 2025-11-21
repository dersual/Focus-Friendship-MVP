// client/src/components/EvolutionAnimation.jsx
import React, { useState, useEffect } from "react";
import * as petService from "../services/petService";

const EvolutionAnimation = ({ pet, onComplete }) => {
  const [stage, setStage] = useState("start"); // start, evolving, complete
  const [currentEvolution, setCurrentEvolution] = useState(null);
  const [nextEvolution, setNextEvolution] = useState(null);

  useEffect(() => {
    if (pet) {
      setCurrentEvolution(petService.getPetEvolutionStage(pet));
      setNextEvolution(petService.getNextEvolutionStage(pet));
    }
  }, [pet]);

  useEffect(() => {
    if (stage === "start") {
      const timer = setTimeout(() => setStage("evolving"), 500);
      return () => clearTimeout(timer);
    } else if (stage === "evolving") {
      const timer = setTimeout(() => setStage("complete"), 2000);
      return () => clearTimeout(timer);
    } else if (stage === "complete") {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  if (!pet || !currentEvolution) return null;

  const getAnimationStyles = () => {
    switch (stage) {
      case "start":
        return {
          transform: "scale(1)",
          opacity: 1,
        };
      case "evolving":
        return {
          transform: "scale(1.2)",
          opacity: 0.7,
          filter: "brightness(1.5) blur(2px)",
        };
      case "complete":
        return {
          transform: "scale(1)",
          opacity: 1,
          filter: "brightness(1) blur(0px)",
        };
      default:
        return {};
    }
  };

  return (
    <div className="evolution-animation position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
         style={{
           backgroundColor: "rgba(0, 0, 0, 0.8)",
           zIndex: 9999,
           color: "white"
         }}>
      <div className="text-center">
        
        {/* Evolution Stage Display */}
        <div className="mb-4">
          <div 
            className="evolution-pet-display mb-3"
            style={{
              fontSize: "8rem",
              transition: "all 0.5s ease-in-out",
              ...getAnimationStyles()
            }}
          >
            {currentEvolution.emoji}
          </div>
          
          <div className="evolution-text">
            {stage === "start" && (
              <div>
                <h3 className="text-primary fw-bold">Level Up!</h3>
                <p className="text-light">{currentEvolution.name} is evolving...</p>
              </div>
            )}
            
            {stage === "evolving" && (
              <div>
                <h3 className="text-warning fw-bold">Evolution in Progress!</h3>
                <div className="spinner-border text-warning my-3" role="status">
                  <span className="visually-hidden">Evolving...</span>
                </div>
                <p className="text-light">Something amazing is happening!</p>
              </div>
            )}
            
            {stage === "complete" && nextEvolution && (
              <div>
                <div className="mb-3" style={{ fontSize: "6rem" }}>
                  {nextEvolution.emoji}
                </div>
                <h3 className="text-success fw-bold">Evolution Complete!</h3>
                <h4 className="text-primary">{nextEvolution.name}</h4>
                <p className="text-light">
                  Your pet has reached Level {nextEvolution.level}!
                </p>
              </div>
            )}
            
            {stage === "complete" && !nextEvolution && (
              <div>
                <h3 className="text-success fw-bold">Level Up!</h3>
                <h4 className="text-primary">Level {pet.level}</h4>
                <p className="text-light">
                  Your {currentEvolution.name} grew stronger!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="evolution-progress">
          <div className="d-flex justify-content-center gap-3">
            <div className={`evolution-dot ${stage === "start" ? "active" : stage !== "start" ? "complete" : ""}`}></div>
            <div className={`evolution-dot ${stage === "evolving" ? "active" : stage === "complete" ? "complete" : ""}`}></div>
            <div className={`evolution-dot ${stage === "complete" ? "active" : ""}`}></div>
          </div>
        </div>

        {stage === "complete" && (
          <button 
            className="btn btn-primary mt-4"
            onClick={onComplete}
          >
            Continue
          </button>
        )}
      </div>

      <style jsx>{`
        .evolution-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #6c757d;
          transition: all 0.3s ease;
        }
        
        .evolution-dot.active {
          background-color: #0d6efd;
          box-shadow: 0 0 10px rgba(13, 110, 253, 0.5);
        }
        
        .evolution-dot.complete {
          background-color: #198754;
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        
        .evolution-pet-display {
          animation: ${stage === "evolving" ? "sparkle 0.5s infinite" : "none"};
        }
      `}</style>
    </div>
  );
};

export default EvolutionAnimation;